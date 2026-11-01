"""
Community Scam Map — Official Alerts Engine
Implements SPIKE and NEW_TYPE detection conforming to Part 2, Section D of the Design Book.
Operates strictly on trusted reports (trust_state = 1) and enforces net_fp diversity hardening.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Response
from sqlalchemy import select, func, distinct
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Report, Indicator, KIND, VERDICT_INV

router = APIRouter()

@router.get("/alerts")
def alerts(response: Response, pincode: Optional[str] = None, db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"

    now = datetime.now(timezone.utc)
    h24 = now - timedelta(hours=24)
    d8  = now - timedelta(days=8)
    d1  = now - timedelta(days=1)
    d30 = now - timedelta(days=30)
    future_buffer = now + timedelta(minutes=15)

    if pincode:
        pincodes_to_check = [pincode]
    else:
        active_pins = db.scalars(
            select(distinct(Report.pincode)).where(
                Report.trust_state == 1,
                Report.occurred_at >= h24,
                Report.occurred_at <= future_buffer,
            )
        ).all()
        pincodes_to_check = list(active_pins)

    out = []

    for pin in pincodes_to_check:
        # W4: 24h trusted count and net_fp diversity
        n24 = db.scalar(
            select(func.count()).where(
                Report.pincode == pin,
                Report.trust_state == 1,
                Report.occurred_at >= h24,
                Report.occurred_at <= future_buffer,
            )
        ) or 0

        net_diversity = db.scalar(
            select(func.count(distinct(Report.net_fp))).where(
                Report.pincode == pin,
                Report.trust_state == 1,
                Report.occurred_at >= h24,
                Report.occurred_at <= future_buffer,
            )
        ) or 0

        # W2: 7-day baseline [now-8d, now-1d) / 7
        baseline_count = db.scalar(
            select(func.count()).where(
                Report.pincode == pin,
                Report.trust_state == 1,
                Report.occurred_at >= d8,
                Report.occurred_at < d1,
            )
        ) or 0
        baseline_per_day = baseline_count / 7.0

        # SPIKE: n24 >= 5 AND n24 >= 2*baseline AND net_diversity >= 3
        if n24 >= 5 and (n24 >= 2.0 * baseline_per_day) and (net_diversity >= 3):
            out.append({
                "type": "SPIKE",
                "pincode": pin,
                "window": "24h",
                "count": n24,
                "baseline_per_day": round(baseline_per_day, 1),
                "net_diversity": net_diversity,
            })

        # NEW_TYPE: present in [now-24h, now) trusted \ prior in [now-30d, now-1d) trusted
        present_types = db.scalars(
            select(distinct(Report.scam_type)).where(
                Report.pincode == pin,
                Report.trust_state == 1,
                Report.occurred_at >= h24,
                Report.occurred_at <= future_buffer,
            )
        ).all()

        for st in present_types:
            prior_seen = db.scalar(
                select(func.count()).where(
                    Report.pincode == pin,
                    Report.trust_state == 1,
                    Report.scam_type == st,
                    Report.occurred_at >= d30,
                    Report.occurred_at < d1,
                )
            ) or 0
            if prior_seen == 0:
                out.append({
                    "type": "NEW_TYPE",
                    "pincode": pin,
                    "scam_type": st,
                    "window": "24h",
                })

    # Fetch recent trusted reports for locality feed and live alerts (strictly ordered by most recent submission first)
    recent_query = select(Report).where(Report.trust_state == 1)
    if pincode:
        recent_query = recent_query.where(Report.pincode == pincode)
    recent_rows = db.scalars(
        recent_query.order_by(
            Report.reported_at.desc(),
            Report.ingested_at.desc(),
            Report.occurred_at.desc(),
        ).limit(50)
    ).all()

    # Look up indicators for rich alert metadata
    ind_ids = {r.indicator_id for r in recent_rows}
    indicators_map = {}
    KIND_INV = {v: k for k, v in KIND.items()}
    if ind_ids:
        inds = db.scalars(select(Indicator).where(Indicator.id.in_(ind_ids))).all()
        for ind in inds:
            indicators_map[ind.id] = ind

    recent_reports = []
    live_report_alerts = []
    for r in recent_rows:
        ind = indicators_map.get(r.indicator_id)
        kind_name = KIND_INV.get(ind.kind, "phone") if ind else "phone"
        disp_val = (ind.display_value or ind.canonical) if ind else "Unlisted Identifier"
        rep_data = {
            "report_id": r.report_id,
            "occurred_at": r.occurred_at.isoformat() if r.occurred_at else None,
            "reported_at": r.reported_at.isoformat() if r.reported_at else None,
            "channel": r.channel,
            "scam_type": r.scam_type,
            "pincode": r.pincode,
            "has_screenshot": r.has_screenshot,
            "amount_lost_inr": r.amount_lost_inr,
            "identifier_value": disp_val,
            "identifier_type": kind_name,
            "report_count": ind.report_count if ind else 1,
            "verdict": VERDICT_INV.get(ind.verdict, "SUSPICIOUS") if ind else "SUSPICIOUS",
        }
        recent_reports.append(rep_data)

        # Include recent reports as live alerts so newly submitted citizen reports immediately show up
        live_report_alerts.append({
            "type": "LIVE_REPORT",
            "pincode": r.pincode,
            "scam_type": r.scam_type,
            "identifier_value": disp_val,
            "identifier_type": kind_name,
            "report_id": r.report_id,
            "channel": r.channel,
            "occurred_at": r.occurred_at.isoformat() if r.occurred_at else None,
            "reported_at": r.reported_at.isoformat() if r.reported_at else None,
            "has_screenshot": r.has_screenshot,
            "amount_lost_inr": r.amount_lost_inr,
            "window": "24h",
            "advice": f"Recent citizen incident logged for {kind_name.upper()} '{disp_val}' regarding {r.scam_type.replace('-', ' ')} via {r.channel}."
        })

    # Combine live alerts with statistical alerts (live reports first so users immediately see their submissions)
    combined_alerts = live_report_alerts + out

    return {
        "alerts": combined_alerts,
        "recent_reports": recent_reports,
        "summary": {
            "total_alerts": len(combined_alerts),
            "live_reports": len(live_report_alerts),
            "spikes": len([a for a in out if a.get("type") == "SPIKE"]),
            "new_types": len([a for a in out if a.get("type") == "NEW_TYPE"]),
        }
    }
