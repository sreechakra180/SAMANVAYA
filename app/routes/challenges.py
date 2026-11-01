from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Indicator, Challenge, KIND
from app.schemas.api import ChallengeIn
from app.services.normalise import canonicalise

router = APIRouter()

@router.post("/challenges", status_code=201)
def create_challenge(p: ChallengeIn, db: Session = Depends(get_db)):
    kind_int = KIND.get(p.identifier_type)
    if kind_int is None:
        raise HTTPException(400, "invalid identifier_type")
    canon = canonicalise(p.identifier_type, p.identifier_value)
    if canon is None:
        raise HTTPException(400, "invalid identifier_value")

    ind = db.scalar(select(Indicator).where(
        Indicator.kind == kind_int, Indicator.canonical == canon))
    if ind is None:
        ind = Indicator(kind=kind_int, canonical=canon, display_value=canon)
        db.add(ind); db.flush()

    ind.challenged = True
    c = Challenge(indicator_id=ind.id, claimant_name=p.claimant_name,
                  contact_email=p.contact_email, proof_note=p.proof_note,
                  status="under_review", created_at=datetime.now(timezone.utc))
    db.add(c); db.commit()
    return {"challenge_id": f"chal_{c.id}", "status": "under_review"}

