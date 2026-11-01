from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Indicator, Report, KIND, VERDICT_INV
from app.services.normalise import canonicalise, mask
from app.reference.verified import VERIFIED_KEYS

router = APIRouter()

@router.get("/lookup")
def lookup(type: str, value: str, db: Session = Depends(get_db)):
    kind_int = KIND.get(type)
    if kind_int is None:
        raise HTTPException(400, "unknown identifier_type")
    canon = canonicalise(type, value)
    if canon is None:
        raise HTTPException(400, "invalid identifier_value")

    if (type, canon) in VERIFIED_KEYS:
        return {
            "verdict": "VERIFIED_BUSINESS", "report_count": 0,
            "distinct_reporters": 0, "first_seen": None, "last_seen": None,
            "scam_type": None, "display_value": canon,
            "evidence": [], "challenged": False,
        }

    ind = db.scalar(select(Indicator).where(
        Indicator.kind == kind_int, Indicator.canonical == canon))
    if ind is None:
        return {
            "verdict": "NO_REPORTS", "report_count": 0,
            "distinct_reporters": 0, "first_seen": None, "last_seen": None,
            "scam_type": None, "display_value": mask(type, canon, 0),
            "evidence": [], "challenged": False,
        }

    ev = db.scalars(select(Report).where(Report.indicator_id == ind.id)
                    .order_by(Report.occurred_at.desc()).limit(10)).all()
    return {
        "verdict": VERDICT_INV[ind.verdict],
        "report_count": ind.report_count,
        "distinct_reporters": ind.distinct_reporters,
        "first_seen": ind.first_seen.isoformat() if ind.first_seen else None,
        "last_seen": ind.last_seen.isoformat() if ind.last_seen else None,
        "scam_type": ind.scam_type,
        "display_value": ind.display_value or mask(type, canon, ind.distinct_reporters),
        "evidence": [{"occurred_at": r.occurred_at.isoformat(),
                      "channel": r.channel, "scam_type": r.scam_type,
                      "pincode": r.pincode} for r in ev],
        "challenged": ind.challenged,
    }

