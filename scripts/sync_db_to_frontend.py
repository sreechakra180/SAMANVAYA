"""
Synchronizes SQLite database (`scam_map.db`) with frontend static seed database.
Ensures that all citizen reports and threat indicators created locally or via tests
are bundled and accessible on any device (even on static deployments),
strictly enforcing privacy masking for phone numbers and email/UPI addresses.
"""

import sqlite3
import json
import os
from pathlib import Path

DB_PATH = Path("scam_map.db")
TARGET_JSON = Path("app/frontend/src/data/seedDatabase.json")

def mask_val(kind: str, val: str) -> str:
    if not val:
        return ""
    val = val.strip()
    if val in ("1930", "+911930", "1909", "+911909", "112", "100"):
        return val
    if "XXXXX" in val or "***" in val:
        return val
    if kind == "phone" or any(c.isdigit() for c in val):
        digits = "".join(c for c in val if c.isdigit())
        if len(digits) == 12 and digits.startswith("91"):
            core = digits[2:]
            return f"+91 {core[:3]}XXXXX{core[-2:]}"
        elif len(digits) == 10:
            return f"+91 {digits[:3]}XXXXX{digits[-2:]}"
        elif len(digits) >= 8:
            return f"+91 {digits[:3]}XXXXX{digits[-2:]}"
    if kind == "upi" or "@" in val:
        user, _, dom = val.partition("@")
        if len(user) <= 2:
            return f"{user[:1]}***@{dom}"
        elif len(user) <= 4:
            return f"{user[0]}***{user[-1]}@{dom}"
        else:
            return f"{user[:2]}***{user[-1]}@{dom}"
    if kind == "sender_id":
        if len(val) == 6 and val.isalpha() and val.isupper():
            return val
        if len(val) > 3:
            return f"{val[:2]}***{val[-1]}"
    if kind == "url":
        clean = val.replace("https://", "").replace("http://", "").replace("www.", "")
        parts = clean.split(".")
        if len(parts) >= 2:
            dom = parts[0]
            tld = parts[1].split("/")[0]
            return f"{dom[:3]}***.{tld}"
    return val

def sync():
    if not DB_PATH.exists():
        print(f"Database {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    KIND_NAMES = {1: "phone", 2: "upi", 3: "url", 4: "sender_id"}
    VERDICT_NAMES = {0: "NO_REPORTS", 1: "SUSPICIOUS", 2: "KNOWN_SCAM", 3: "VERIFIED_BUSINESS"}

    inds = cur.execute("""
        SELECT id, kind, canonical, verdict, report_count, distinct_reporters, first_seen, last_seen, scam_type, display_value, challenged 
        FROM indicators
    """).fetchall()

    indicators_map = {}
    for i in inds:
        i_id, kind_int, canon, verd_int, rep_count, dist_rep, f_seen, l_seen, s_type, disp_val, chal = i
        kind_name = KIND_NAMES.get(kind_int, "phone")
        masked_disp = mask_val(kind_name, disp_val or canon)
        indicators_map[i_id] = {
            "id": i_id,
            "kind": kind_name,
            "canonical": canon,
            "verdict": VERDICT_NAMES.get(verd_int, "SUSPICIOUS"),
            "report_count": rep_count,
            "distinct_reporters": dist_rep,
            "first_seen": str(f_seen) if f_seen else None,
            "last_seen": str(l_seen) if l_seen else None,
            "scam_type": s_type,
            "display_value": masked_disp,
            "challenged": bool(chal),
        }

    reps = cur.execute("""
        SELECT report_id, indicator_id, occurred_at, reported_at, channel, scam_type, pincode, has_screenshot, amount_lost_inr 
        FROM reports 
        ORDER BY reported_at DESC
    """).fetchall()

    reports_list = []
    for r in reps:
        rep_id, ind_id, occ, rep_at, chan, scam_t, pin, has_scr, amt = r
        ind = indicators_map.get(ind_id, {})
        kind_name = ind.get("kind", "phone")
        masked_val = ind.get("display_value") or mask_val(kind_name, ind.get("canonical", "Unknown"))
        reports_list.append({
            "report_id": rep_id,
            "indicator_type": kind_name,
            "identifier_value": masked_val,
            "canonical": ind.get("canonical", "Unknown"),
            "occurred_at": str(occ),
            "reported_at": str(rep_at),
            "channel": chan,
            "scam_type": scam_t,
            "pincode": pin,
            "has_screenshot": bool(has_scr),
            "amount_lost_inr": amt or 0,
            "verdict": ind.get("verdict", "SUSPICIOUS"),
        })

    out_data = {
        "indicators": list(indicators_map.values()),
        "reports": reports_list,
    }

    TARGET_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(TARGET_JSON, "w") as f:
        json.dump(out_data, f, indent=2)

    print(f"Successfully synced & masked {len(indicators_map)} indicators and {len(reports_list)} reports to {TARGET_JSON}")

if __name__ == "__main__":
    sync()
