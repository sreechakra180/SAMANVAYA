from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Report
from app.reference.areas import AREAS

router = APIRouter()

@router.get("/map")
def map_view(pincode: str | None = None, days: int = 7, radius_km: float = 2.0, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=days)
    query = (
        select(Report.pincode, func.count(), func.max(Report.occurred_at))
        .where(Report.occurred_at >= start)
        .where(Report.occurred_at < now)
    )
    if pincode:
        query = query.where(Report.pincode == pincode)
    rows = db.execute(query.group_by(Report.pincode)).all()
    clusters = []
    for pin, count, last in rows:
        a = AREAS.get(pin)
        if not a: continue
        sev = "CRIT" if count >= 10 else ("HIGH" if count >= 5 else "MED")
        top_type = db.execute(
            select(Report.scam_type)
            .where(Report.pincode == pin, Report.occurred_at >= start, Report.occurred_at < now)
            .group_by(Report.scam_type)
            .order_by(func.count(Report.scam_type).desc())
            .limit(1)
        ).scalar()
        clusters.append({
            "pincode": pin,
            "locality": a["locality"],
            "city": a["city"],
            "count": count,
            "top_scam_type": top_type,
            "severity": sev,
            "lat": a["lat"],
            "lng": a["lng"]
        })
    return {"clusters": clusters}

