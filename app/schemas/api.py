from datetime import datetime
from pydantic import BaseModel, Field

class ReportIn(BaseModel):
    report_id: str | None = None
    occurred_at: str | None = None
    reported_at: str | None = None
    reporter_id: str | None = None
    ip_prefix: str | None = None
    channel: str
    scam_type: str
    identifier_type: str
    identifier_value: str
    pincode: str
    locality: str | None = None
    city: str | None = None
    note: str | None = ""
    has_screenshot: bool = False
    amount_lost_inr: int = 0

class ChallengeIn(BaseModel):
    identifier_type: str
    identifier_value: str
    claimant_name: str
    contact_email: str
    proof_note: str = ""

