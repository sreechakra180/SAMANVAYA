"""
Community Scam Map — Pure Trust Engine
Deterministic, LLM-free Bayesian Beta-Binomial trust and risk engine.
Fully implements Parts 1, 2, and 3 of the Design & Test Book.
"""
import re
import math
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from app.reference.scam_types import KNOWN_SCAM_TYPES
from app.thresholds import Thresholds, CALIBRATED_CONFIG

_JUNK_REGEX = re.compile(r"^(test|asdf|123+|\W*)$", re.IGNORECASE)
_DIGITS_OR_URL = re.compile(r"^(https?://\S+|\+?\d[\d\s\-().]+)$", re.IGNORECASE)

def norm_dt(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

@dataclass
class Assessment:
    verdict: str
    state: str
    distinct_reporters: int
    report_count: int
    first_seen: datetime | None
    last_seen: datetime | None
    scam_type: str | None
    score: float = 0.0
    evidence_mass: float = 0.0
    display_value: str = ""
    reason_codes: list[str] = field(default_factory=list)


def _word_tokens(text: str | None) -> set[str]:
    if not text:
        return set()
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def jaccard_similarity(a: str | None, b: str | None) -> float:
    s1, s2 = _word_tokens(a), _word_tokens(b)
    if not s1 or not s2:
        return 0.0
    inter = len(s1 & s2)
    union = len(s1 | s2)
    return inter / union if union > 0 else 0.0


def note_quality(note: str | None, cfg: Thresholds, is_template_dup: bool = False) -> tuple[float, list[str]]:
    reasons = []
    if not note:
        return cfg.note_base, reasons
    trimmed = note.strip()
    if _JUNK_REGEX.match(trimmed) or (len(trimmed) < 12 and _DIGITS_OR_URL.match(trimmed)):
        reasons.append("JUNK_NOTE")
        return cfg.note_junk, reasons
    if is_template_dup:
        reasons.append("TEMPLATE_NOTES")
        return cfg.note_template_dup, reasons
    ratio = min(1.0, len(trimmed) / cfg.note_len_ref)
    q = cfg.note_base + cfg.note_len_scale * ratio
    return min(1.0, q), reasons


def temporal_quality(occurred_at: datetime, now: datetime, cfg: Thresholds) -> tuple[float, list[str]]:
    reasons = []
    occ = norm_dt(occurred_at)
    curr = norm_dt(now)
    delta = curr - occ
    if delta < timedelta(0):
        # future timestamp
        return 1.0, reasons
    if delta <= timedelta(hours=1):
        return cfg.q_t_1h, reasons
    elif delta <= timedelta(hours=24):
        return cfg.q_t_24h, reasons
    elif delta <= timedelta(days=7):
        return cfg.q_t_7d, reasons
    elif delta <= timedelta(days=90):
        reasons.append("BACKDATED")
        return cfg.q_t_older, reasons
    else:
        reasons.append("STALE_DECAY")
        return cfg.q_t_older * cfg.q_t_90d_multiplier, reasons


def calculate_report_weight(report, now: datetime, cfg: Thresholds, is_template: bool = False) -> tuple[float, list[str]]:
    all_reasons = []
    note_str = getattr(report, "note", "") or ""
    q_n, n_reasons = note_quality(note_str, cfg, is_template)
    all_reasons.extend(n_reasons)

    st = getattr(report, "scam_type", None)
    q_typ = 1.0 if st in KNOWN_SCAM_TYPES and st != "other" else cfg.q_type_unknown

    has_screen = bool(getattr(report, "has_screenshot", False))
    amt = int(getattr(report, "amount_lost_inr", 0) or 0)
    q_ev = min(cfg.q_ev_cap, 1.0 + (cfg.q_ev_screenshot if has_screen else 0.0) + (cfg.q_ev_amount if amt > 0 else 0.0))

    occ = getattr(report, "occurred_at", now)
    q_t, t_reasons = temporal_quality(occ, now, cfg)
    all_reasons.extend(t_reasons)

    rho = 1.0
    w = max(0.0, min(1.0, q_n * q_typ * q_ev * q_t * rho))
    return w, all_reasons


def build_source_clusters(reports, net_window_hours: int) -> dict[int, list]:
    n = len(reports)
    parent = list(range(n))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    def union(i, j):
        ri, rj = find(i), find(j)
        if ri != rj:
            parent[ri] = rj

    win = timedelta(hours=net_window_hours)
    for i in range(n):
        a = reports[i]
        for j in range(i + 1, n):
            b = reports[j]
            if a.reporter_fp == b.reporter_fp:
                union(i, j)
                continue
            if a.net_fp == b.net_fp:
                at_a = norm_dt(a.reported_at)
                at_b = norm_dt(b.reported_at)
                if abs(at_a - at_b) <= win:
                    union(i, j)

    clusters: dict[int, list] = {}
    for i in range(n):
        root = find(i)
        clusters.setdefault(root, []).append(reports[i])
    return clusters


def detect_campaign(clusters: dict[int, list], reports: list, cfg: Thresholds) -> set[int] | None:
    if len(clusters) < cfg.campaign_min_group:
        return None

    win_duration = timedelta(minutes=cfg.campaign_window_minutes)
    sorted_reps = sorted(reports, key=lambda r: norm_dt(r.reported_at))

    for i in range(len(sorted_reps)):
        start_t = norm_dt(sorted_reps[i].reported_at)
        end_t = start_t + win_duration
        window = [r for r in sorted_reps if start_t <= norm_dt(r.reported_at) <= end_t]

        window_cluster_roots = set()
        for root, group in clusters.items():
            if any(r in window for r in group):
                window_cluster_roots.add(root)

        if len(window_cluster_roots) >= cfg.campaign_min_group:
            dup_count = sum(1 for r in window if getattr(r, "note", "") and len((r.note or "").strip()) >= 10 and any(
                r != other and jaccard_similarity(r.note, getattr(other, "note", "")) >= cfg.note_jaccard
                for other in window
            ))
            gamma_note = dup_count / len(window) if window else 0.0
            gamma_time = 1.0
            gamma_age = 1.0
            gamma = 0.55 * gamma_note + 0.30 * gamma_time + 0.15 * gamma_age

            if gamma_note >= cfg.gamma_note_min and gamma >= cfg.gamma_min:
                return window_cluster_roots

    return None


def classify_state(c: int, S: float, challenged: bool, last_seen: datetime | None, now: datetime, cfg: Thresholds, prev_state: str | None = None) -> tuple[str, list[str]]:
    reasons = []
    if c == 0:
        return "NO_REPORTS", ["EMPTY"]
    if challenged:
        return "DISPUTED", ["CHALLENGE_OPEN"]
    if last_seen:
        ls = norm_dt(last_seen)
        curr = norm_dt(now)
        if (curr - ls) > timedelta(days=cfg.expiry_days) and S < cfg.expiry_score_floor:
            return "EXPIRED", ["STALE_DECAY"]

    if prev_state == "HIGH_CONFIDENCE" and S >= cfg.demote_hc_to_corr:
        return "HIGH_CONFIDENCE", ["HYSTERESIS_HOLD"]
    if prev_state == "CORROBORATED" and S >= cfg.demote_corr_to_unv and c >= cfg.corr_min_clusters:
        return "CORROBORATED", ["HYSTERESIS_HOLD"]

    if c >= cfg.hc_min_clusters and S >= cfg.hc_min_score:
        return "HIGH_CONFIDENCE", ["HIGH_CONFIDENCE"]
    if c >= cfg.corr_min_clusters and S >= cfg.corr_min_score:
        return "CORROBORATED", ["CORROBORATED_LOW"]

    return "UNVERIFIED", ["CLUSTER_SINGLE"]


def assess(reports: list, cfg: Thresholds, now: datetime, challenged: bool = False, prev_state: str | None = None) -> Assessment:
    if not reports:
        return Assessment(
            verdict="NO_REPORTS",
            state="NO_REPORTS",
            distinct_reporters=0,
            report_count=0,
            first_seen=None,
            last_seen=None,
            scam_type=None,
            score=0.0,
            evidence_mass=0.0,
            reason_codes=["EMPTY"]
        )

    curr_now = norm_dt(now)

    # 1. Identify template notes across reports
    notes = [getattr(r, "note", "") or "" for r in reports]
    is_template = [False] * len(reports)
    for i in range(len(reports)):
        if not notes[i] or len(notes[i].strip()) < 10:
            continue
        for j in range(i + 1, len(reports)):
            if notes[j] and jaccard_similarity(notes[i], notes[j]) >= cfg.note_template_jaccard:
                is_template[i] = True
                is_template[j] = True

    # 2. Compute weights for all reports
    reasons: list[str] = []
    for idx, r in enumerate(reports):
        w, r_reasons = calculate_report_weight(r, curr_now, cfg, is_template=is_template[idx])
        r.w = w
        reasons.extend(r_reasons)

    # 3. Clustering
    clusters = build_source_clusters(reports, cfg.net_window_hours)
    c = len(clusters)
    if c < len(reports):
        reasons.append("CLUSTERED_DUPLICATES")

    v = {cid: max(r.w for r in group) for cid, group in clusters.items()}

    # 4. Campaign detection
    campaign_group = detect_campaign(clusters, reports, cfg)
    if campaign_group:
        reasons.append("CAMPAIGN_COLLAPSED")
        group_weights = [v[cid] for cid in campaign_group if cid in v]
        v_G = max(group_weights) * min(1.0, 1.0 + 0.1 * math.log2(max(1, len(campaign_group))))
        E = sum(val for cid, val in v.items() if cid not in campaign_group) + v_G
        c_effective = len([cid for cid in v if cid not in campaign_group]) + 1
    else:
        E = sum(v.values())
        c_effective = c

    for cid, group in clusters.items():
        best_rep = max(group, key=lambda r: getattr(r, "w", 0.0))
        for r in group:
            if r is best_rep and getattr(r, "w", 0.0) >= cfg.alert_trusted_w_floor:
                r.trust_state = 1
            else:
                r.trust_state = 2

    # 5. Dispute mass
    D = cfg.D_open if challenged else 0.0

    # 6. Beta-Binomial posterior score S
    S = (cfg.alpha0 + E) / (cfg.alpha0 + cfg.beta0 + E + D)

    # Metadata with timezone normalization
    occ_dates = [norm_dt(r.occurred_at) for r in reports if getattr(r, "occurred_at", None)]
    first_seen = min(occ_dates) if occ_dates else None
    last_seen = max(occ_dates) if occ_dates else None
    types = [r.scam_type for r in reports]
    top_scam_type = max(set(types), key=types.count) if types else None

    # Safe mode check
    if not cfg.APPROVED:
        return Assessment(
            verdict="SUSPICIOUS",
            state="UNVERIFIED",
            distinct_reporters=c_effective,
            report_count=len(reports),
            first_seen=first_seen,
            last_seen=last_seen,
            scam_type=top_scam_type,
            score=round(S, 6),
            evidence_mass=round(E, 6),
            reason_codes=list(dict.fromkeys(["THRESHOLDS_NOT_APPROVED"] + reasons))
        )

    # 7. State & Verdict
    state, state_reasons = classify_state(c_effective, S, challenged, last_seen, curr_now, cfg, prev_state)
    reasons.extend(state_reasons)

    # Hard Invariants (post-hoc)
    if state == "HIGH_CONFIDENCE":
        verdict = "KNOWN_SCAM"
    elif c_effective >= 1:
        verdict = "SUSPICIOUS"
    else:
        verdict = "NO_REPORTS"

    if challenged or state == "DISPUTED":
        verdict = "SUSPICIOUS"
        reasons.append("CHALLENGE_OPEN")

    if c_effective < cfg.mask_below_reporters:
        if verdict == "KNOWN_SCAM":
            verdict = "SUSPICIOUS"
        reasons.append("BELOW_PRIVACY_FLOOR")

    return Assessment(
        verdict=verdict,
        state=state,
        distinct_reporters=c_effective,
        report_count=len(reports),
        first_seen=first_seen,
        last_seen=last_seen,
        scam_type=top_scam_type,
        score=round(S, 6),
        evidence_mass=round(E, 6),
        reason_codes=list(dict.fromkeys(reasons))
    )
