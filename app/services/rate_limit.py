from datetime import datetime, timedelta, timezone
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.db.models import Report

def check(db: Session, reporter_fp: bytes, net_fp_b: bytes, rid_per_h: int, rid_per_d: int, net_per_h: int) -> bool:
    now = datetime.now(timezone.utc)
    h1 = now - timedelta(hours=1)
    d1 = now - timedelta(days=1)
    rid_h = db.scalar(select(func.count()).where(Report.reporter_fp == reporter_fp).where(Report.reported_at >= h1)) or 0
    if rid_h >= rid_per_h: return False
    rid_d = db.scalar(select(func.count()).where(Report.reporter_fp == reporter_fp).where(Report.reported_at >= d1)) or 0
    if rid_d >= rid_per_d: return False
    net_h = db.scalar(select(func.count()).where(Report.net_fp == net_fp_b).where(Report.reported_at >= h1)) or 0
    if net_h >= net_per_h: return False
    return True

