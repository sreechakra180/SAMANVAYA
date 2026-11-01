import uuid
from datetime import datetime, timezone, timedelta
from dateutil.parser import isoparse
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Indicator, Report, KIND
from app.schemas.api import ReportIn
from app.services.normalise import canonicalise
from app.services.fingerprint import rid_fp, net_fp as net_fp_fn
from app.services.rate_limit import check as rl_check
from app.services.trust_engine import assess
from app.reference.areas import AREAS
from app.reference.scam_types import KNOWN_SCAM_TYPES
from app.reference.channels import CHANNELS
from app.thresholds import load as load_thresholds

router = APIRouter()

CHANNEL_MAP = {
    "phone": "Phone call",
    "voice": "Phone call",
    "call": "Phone call",
    "sms": "SMS or WhatsApp",
    "whatsapp": "SMS or WhatsApp",
    "qr": "QR code",
    "url": "Fake website",
    "website": "Fake website",
    "web": "Fake website",
    "upi": "UPI request",
    "apk": "Something else",
    "app": "Something else",
    "telegram": "Something else",
    "other": "Something else",
}

def _case_id(indicator_id: int) -> str:
    return f"case_{indicator_id:08d}"

@router.post("/reports", status_code=201)
def create_report(p: ReportIn, db: Session = Depends(get_db)):
    # Auto-generate server telemetry fields if omitted by clients
    updates = {}
    if not p.report_id:
        updates["report_id"] = f"rep_{uuid.uuid4().hex[:12]}"
    if not p.reporter_id:
        updates["reporter_id"] = f"usr_{uuid.uuid4().hex[:8]}"
    if not p.ip_prefix:
        updates["ip_prefix"] = "192.168.1.0/24"
    now_dt = datetime.now(timezone.utc)
    now_iso = now_dt.isoformat()
    if not p.reported_at:
        updates["reported_at"] = now_iso
    if not p.occurred_at:
        updates["occurred_at"] = now_iso
    if updates:
        p = p.model_copy(update=updates)

    kind_int = KIND.get(p.identifier_type)
    if kind_int is None:
        raise HTTPException(400, "invalid identifier_type")
    canon = canonicalise(p.identifier_type, p.identifier_value)
    if canon is None:
        raise HTTPException(400, "invalid identifier_value")
    if p.pincode not in AREAS:
        raise HTTPException(400, "invalid pincode")

    # Channel normalisation
    if p.channel not in CHANNELS:
        mapped_channel = CHANNEL_MAP.get(p.channel.lower().strip())
        if mapped_channel:
            p = p.model_copy(update={"channel": mapped_channel})
        else:
            raise HTTPException(400, "invalid channel")

    # Scam type normalisation (hyphens & underscore tolerance)
    norm_scam = p.scam_type.replace("_", "-").lower().strip()
    if norm_scam in KNOWN_SCAM_TYPES:
        p = p.model_copy(update={"scam_type": norm_scam})
    else:
        p = p.model_copy(update={"scam_type": "other"})

    try:
        occurred = isoparse(p.occurred_at)
        reported = isoparse(p.reported_at)
        if occurred.tzinfo is None:
            occurred = occurred.replace(tzinfo=timezone.utc)
        if reported.tzinfo is None:
            reported = reported.replace(tzinfo=timezone.utc)
    except Exception:
        raise HTTPException(400, "invalid timestamp")

    now = datetime.now(timezone.utc)
    if occurred > now + timedelta(minutes=5):
        raise HTTPException(400, "occurred_at in future")

    r_fp = rid_fp(p.reporter_id)
    n_fp = net_fp_fn(p.ip_prefix)
    cfg = load_thresholds()
    if not rl_check(db, r_fp, n_fp, cfg.RL_RID_PER_HOUR, cfg.RL_RID_PER_DAY, cfg.RL_NET_PER_HOUR):
        raise HTTPException(429, "rate limited")

    existing = db.scalar(select(Report).where(Report.report_id == p.report_id))
    if existing is not None:
        ind = db.get(Indicator, existing.indicator_id)
        return {"report_id": p.report_id, "case_id": _case_id(ind.id), "merged": True}

    ind = db.scalar(select(Indicator).where(
        Indicator.kind == kind_int, Indicator.canonical == canon))
    was_new = ind is None
    if was_new:
        ind = Indicator(kind=kind_int, canonical=canon)
        db.add(ind); db.flush()

    rep = Report(
        report_id=p.report_id, indicator_id=ind.id,
        occurred_at=occurred, reported_at=reported, ingested_at=now,
        reporter_fp=r_fp, net_fp=n_fp, channel=p.channel,
        scam_type=p.scam_type, pincode=p.pincode,
        note_len=len(p.note or ""), has_screenshot=p.has_screenshot,
        amount_lost_inr=p.amount_lost_inr, trust_state=1,
    )
    db.add(rep)
    db.flush()

    reports = db.scalars(select(Report).where(Report.indicator_id == ind.id)).all()
    a = assess(list(reports), cfg, now)
    from app.db.models import VERDICT
    from app.services.normalise import mask
    ind.verdict = VERDICT[a.verdict]
    ind.report_count = a.report_count
    ind.distinct_reporters = a.distinct_reporters
    ind.first_seen = a.first_seen
    ind.last_seen = a.last_seen
    ind.scam_type = a.scam_type
    ind.display_value = mask(p.identifier_type, canon, a.distinct_reporters)
    ind.computed_at = now
    ind.version = (ind.version or 0) + 1
    db.commit()

    return {"report_id": p.report_id, "case_id": _case_id(ind.id), "merged": not was_new}

