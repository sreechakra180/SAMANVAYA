"""
Synchronizes SQLite database (`scam_map.db`) with frontend static seed database.
Ensures that all citizen reports and threat indicators created locally or via tests
are bundled and accessible on any device (even on static deployments).
"""

import sqlite3
import json
import os
from pathlib import Path

DB_PATH = Path("scam_map.db")
TARGET_JSON = Path("app/frontend/src/data/seedDatabase.json")

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
        indicators_map[i_id] = {
            "id": i_id,
            "kind": KIND_NAMES.get(kind_int, "phone"),
            "canonical": canon,
            "verdict": VERDICT_NAMES.get(verd_int, "SUSPICIOUS"),
            "report_count": rep_count,
            "distinct_reporters": dist_rep,
            "first_seen": str(f_seen) if f_seen else None,
            "last_seen": str(l_seen) if l_seen else None,
            "scam_type": s_type,
            "display_value": disp_val or canon,
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
        reports_list.append({
            "report_id": rep_id,
            "indicator_type": ind.get("kind", "phone"),
            "identifier_value": ind.get("display_value", "Unknown"),
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

    print(f"Successfully synced {len(indicators_map)} indicators and {len(reports_list)} reports to {TARGET_JSON}")

if __name__ == "__main__":
    sync()
