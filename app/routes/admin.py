from fastapi import APIRouter, Depends
from sqlalchemy import delete
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Report, Indicator, Challenge

router = APIRouter()

@router.post("/admin/reset")
def reset(db: Session = Depends(get_db)):
    db.execute(delete(Report))
    db.execute(delete(Challenge))
    db.execute(delete(Indicator))
    db.commit()
    return {"ok": True}

