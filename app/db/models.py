from datetime import datetime
from sqlalchemy import (
    Integer, SmallInteger, String, Text, Boolean, BigInteger, Float,
    DateTime, ForeignKey, LargeBinary, UniqueConstraint, Index
)
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base

KIND = {"phone": 1, "upi": 2, "url": 3, "sender_id": 4}
VERDICT = {"NO_REPORTS": 0, "SUSPICIOUS": 1, "KNOWN_SCAM": 2, "VERIFIED_BUSINESS": 3}
VERDICT_INV = {v: k for k, v in VERDICT.items()}

class Indicator(Base):
    __tablename__ = "indicators"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    kind: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    canonical: Mapped[str] = mapped_column(Text, nullable=False)
    verdict: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    report_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    distinct_reporters: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    first_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    scam_type: Mapped[str | None] = mapped_column(Text)
    challenged: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    display_value: Mapped[str] = mapped_column(Text, nullable=False, default="")
    version: Mapped[int] = mapped_column(BigInteger, nullable=False, default=1)
    computed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    __table_args__ = (UniqueConstraint("kind", "canonical", name="indicators_canonical_uq"),)

class Report(Base):
    __tablename__ = "reports"
    report_id: Mapped[str] = mapped_column(Text, primary_key=True)
    indicator_id: Mapped[int] = mapped_column(ForeignKey("indicators.id"), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reporter_fp: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    net_fp: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    channel: Mapped[str] = mapped_column(Text, nullable=False)
    scam_type: Mapped[str] = mapped_column(Text, nullable=False)
    pincode: Mapped[str] = mapped_column(String(6), nullable=False)
    note_len: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    has_screenshot: Mapped[bool] = mapped_column(Boolean, default=False)
    amount_lost_inr: Mapped[int] = mapped_column(BigInteger, default=0)
    w: Mapped[float | None] = mapped_column(Float)
    trust_state: Mapped[int] = mapped_column(SmallInteger, default=1)
    __table_args__ = (
        Index("reports_indicator_occ", "indicator_id", "occurred_at"),
        Index("reports_pincode_occ", "pincode", "occurred_at"),
        Index("reports_reporter", "reporter_fp", "reported_at"),
        Index("reports_net", "net_fp", "reported_at"),
    )

class Challenge(Base):
    __tablename__ = "challenges"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    indicator_id: Mapped[int] = mapped_column(ForeignKey("indicators.id"))
    claimant_name: Mapped[str] = mapped_column(Text, nullable=False)
    contact_email: Mapped[str] = mapped_column(Text, nullable=False)
    proof_note: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(Text, default="under_review")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

class ClockState(Base):
    __tablename__ = "clock_state"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    max_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

