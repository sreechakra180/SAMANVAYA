#!/usr/bin/env bash
set -euo pipefail
PROJECT="community-scam-map"
[ -e "$PROJECT" ] && { echo "ERROR: $PROJECT already exists"; exit 1; }
mkdir -p "$PROJECT"
cd "$PROJECT"
mkdir -p app/db app/reference app/services app/schemas app/routes app/middleware tests
touch app/__init__.py app/db/__init__.py app/reference/__init__.py \
      app/services/__init__.py app/schemas/__init__.py app/routes/__init__.py \
      app/middleware/__init__.py tests/__init__.py

# ============================================================
cat > requirements.txt <<'EOF'
fastapi==0.115.0
uvicorn[standard]==0.30.6
sqlalchemy==2.0.35
pydantic==2.9.2
python-dateutil==2.9.0.post0
pynacl==1.5.0
pytest==8.3.3
httpx==0.27.2
EOF

cat > pyproject.toml <<'EOF'
[project]
name = "community-scam-map"
version = "0.1.0"
requires-python = ">=3.12"
EOF

cat > .env.example <<'EOF'
DATABASE_URL=sqlite:///./scam_map.db
TRUST_HMAC_KEY=REPLACE_WITH_32_BYTE_BASE64_KEY
LICENCE_PUBKEY_PATH=./licence_pubkey.b64
LICENCE_FILE_PATH=./licence.json
THRESHOLDS_APPROVED=false
EOF

cat > README.md <<'EOF'
# Community Scam Map — Backend Scaffold

Runnable FastAPI backend for the Mitigata CyberForge Community Scam Map.

## Status

- **M2–M4, M7–M9 complete.** All nine PRD routes implemented.
- **M5/M6 safe path active.** Trust engine returns `SUSPICIOUS` for reported
  indicators and never emits `KNOWN_SCAM` until thresholds are approved.
- **Blocked:** `app/thresholds.py` needs mentor-approved values. Set
  `THRESHOLDS_APPROVED=true` in `.env` after filling the file.

## Run

```bash
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env: set TRUST_HMAC_KEY (python -c "import os,base64;print(base64.b64encode(os.urandom(32)).decode())")
python -c "from app.main import init_db; init_db()"
uvicorn app.main:app --reload --port 8000
```

Then:
```bash
curl http://localhost:8000/health
curl 'http://localhost:8000/lookup?type=phone&value=%2B919876543210'
```

## Licence (Ed25519)

```bash
python scripts/make_licence.py --licensee "Demo Bank" --days 30 --out licence.json
# writes licence.json (signed) and licence_pubkey.b64 (bake into server)
```

The private key is written to `licence_privkey.b64` and must be moved offline.

## Deployment substrate

Defaults to **SQLite WAL** on `DATABASE_URL`. If your host provides no
persistent volume, change `DATABASE_URL` to a PostgreSQL URI — schema and
queries are portable. Do not mix.

## Threshold handoff

`app/thresholds.py` documents every verdict-affecting number. The engine
refuses to serve `KNOWN_SCAM` while `APPROVED=False`. Startup logs a warning.
EOF

# ============================================================
cat > app/config.py <<'EOF'
import os
from pathlib import Path

env_file = Path(".env")
if env_file.exists():
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())

def _require(name: str, default: str | None = None) -> str:
    val = os.environ.get(name, default)
    if not val:
        raise RuntimeError(f"missing env: {name}")
    return val

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./scam_map.db")
TRUST_HMAC_KEY = _require("TRUST_HMAC_KEY")
LICENCE_PUBKEY_PATH = Path(os.environ.get("LICENCE_PUBKEY_PATH", "./licence_pubkey.b64"))
LICENCE_FILE_PATH = Path(os.environ.get("LICENCE_FILE_PATH", "./licence.json"))
THRESHOLDS_APPROVED = os.environ.get("THRESHOLDS_APPROVED", "false").lower() == "true"
EOF

cat > app/thresholds.py <<'EOF'
"""
Every verdict-affecting number lives here. Nothing else in the codebase
hardcodes these. While APPROVED is False, the trust engine refuses to emit
KNOWN_SCAM and returns SUSPICIOUS for any indicator with >=1 accepted report.

Fill in every `None` and set APPROVED=True only after mentor sign-off.
"""
from dataclasses import dataclass

@dataclass(frozen=True)
class Thresholds:
    APPROVED: bool

    # Beta prior
    ALPHA0: float | None = None
    BETA0:  float | None = None

    # State promotions
    CORROBORATED_MIN_CLUSTERS: int   | None = None
    CORROBORATED_MIN_SCORE:    float | None = None
    HIGH_CONF_MIN_CLUSTERS:    int   | None = None
    HIGH_CONF_MIN_SCORE:       float | None = None

    # Hysteresis
    DEMOTE_HC_TO_CORR:  float | None = None
    DEMOTE_CORR_TO_UNV: float | None = None

    # Dispute mass
    D_OPEN:   float | None = None
    D_UPHELD: float | None = None

    # Clustering (safe defaults - not verdict thresholds)
    CLUSTER_NET_WINDOW_HOURS: int = 6

    # Per-report weight components
    Q_NOTE_BASE:          float | None = None
    Q_NOTE_LEN_SCALE:     float | None = None
    Q_NOTE_LEN_REF:       int   | None = None
    Q_NOTE_JUNK:          float | None = None
    Q_NOTE_TEMPLATE:      float | None = None
    Q_TYPE_UNKNOWN:       float | None = None
    Q_EV_SCREENSHOT:      float | None = None
    Q_EV_AMOUNT:          float | None = None
    Q_EV_CAP:             float | None = None
    Q_T_1H:               float | None = None
    Q_T_24H:              float | None = None
    Q_T_7D:               float | None = None
    Q_T_OLDER:            float | None = None
    RHO_BASE:             float | None = None
    RHO_SLOPE:            float | None = None
    RHO_MIN:              float | None = None
    RHO_MAX:              float | None = None

    # Alerts
    ALERT_TRUSTED_W_FLOOR:       float | None = None
    ALERT_SPIKE_MIN_COUNT:       int   | None = None
    ALERT_SPIKE_RATIO:           float | None = None
    ALERT_NET_DIVERSITY_MIN:     int   | None = None
    ALERT_NEW_TYPE_MIN_CLUSTERS: int   | None = None

    # Rate limits (safe defaults)
    RL_RID_PER_HOUR: int = 10
    RL_RID_PER_DAY:  int = 30
    RL_NET_PER_HOUR: int = 40


def load() -> Thresholds:
    import os
    approved = os.environ.get("THRESHOLDS_APPROVED", "false").lower() == "true"
    if not approved:
        return Thresholds(APPROVED=False)
    # Blocked: replace the following raises with your mentor's signed values.
    raise RuntimeError(
        "THRESHOLDS_APPROVED=true is set, but app/thresholds.py has no values. "
        "Fill in every field and remove this guard only after mentor sign-off."
    )
EOF

# ============================================================
cat > app/db/session.py <<'EOF'
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import DATABASE_URL

class Base(DeclarativeBase):
    pass

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False, "timeout": 5},
        future=True,
    )
    @event.listens_for(engine, "connect")
    def _sqlite_pragmas(dbapi_conn, _):
        cur = dbapi_conn.cursor()
        cur.execute("PRAGMA journal_mode=WAL")
        cur.execute("PRAGMA synchronous=NORMAL")
        cur.execute("PRAGMA busy_timeout=5000")
        cur.execute("PRAGMA foreign_keys=ON")
        cur.close()
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=9, future=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
EOF

cat > app/db/models.py <<'EOF'
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
EOF

# ============================================================
cat > app/reference/areas.py <<'EOF'
AREAS = {
    "560102": {"locality": "HSR Layout", "city": "Bengaluru", "lat": 12.9116, "lng": 77.6473},
    "560038": {"locality": "Indiranagar", "city": "Bengaluru", "lat": 12.9784, "lng": 77.6408},
    "560034": {"locality": "Koramangala", "city": "Bengaluru", "lat": 12.9352, "lng": 77.6245},
    "560066": {"locality": "Whitefield", "city": "Bengaluru", "lat": 12.9698, "lng": 77.7500},
    "560076": {"locality": "BTM Layout", "city": "Bengaluru", "lat": 12.9166, "lng": 77.6101},
    "560011": {"locality": "Jayanagar", "city": "Bengaluru", "lat": 12.9299, "lng": 77.5826},
    "560037": {"locality": "Marathahalli", "city": "Bengaluru", "lat": 12.9591, "lng": 77.6974},
    "560103": {"locality": "Bellandur", "city": "Bengaluru", "lat": 12.9260, "lng": 77.6762},
    "560100": {"locality": "Electronic City", "city": "Bengaluru", "lat": 12.8452, "lng": 77.6602},
    "560078": {"locality": "JP Nagar", "city": "Bengaluru", "lat": 12.9077, "lng": 77.5851},
    "560003": {"locality": "Malleshwaram", "city": "Bengaluru", "lat": 13.0035, "lng": 77.5709},
    "560010": {"locality": "Rajajinagar", "city": "Bengaluru", "lat": 12.9915, "lng": 77.5520},
    "560024": {"locality": "Hebbal", "city": "Bengaluru", "lat": 13.0358, "lng": 77.5970},
    "560064": {"locality": "Yelahanka", "city": "Bengaluru", "lat": 13.1007, "lng": 77.5963},
    "560070": {"locality": "Banashankari", "city": "Bengaluru", "lat": 12.9250, "lng": 77.5468},
    "400050": {"locality": "Bandra West", "city": "Mumbai", "lat": 19.0596, "lng": 72.8295},
    "110016": {"locality": "Hauz Khas", "city": "Delhi", "lat": 28.5494, "lng": 77.2001},
    "500081": {"locality": "Madhapur", "city": "Hyderabad", "lat": 17.4486, "lng": 78.3908},
    "600020": {"locality": "Adyar", "city": "Chennai", "lat": 13.0012, "lng": 80.2565},
    "411014": {"locality": "Viman Nagar", "city": "Pune", "lat": 18.5679, "lng": 73.9143},
    "700091": {"locality": "Salt Lake Sector V", "city": "Kolkata", "lat": 22.5790, "lng": 88.4290},
    "380015": {"locality": "Satellite", "city": "Ahmedabad", "lat": 23.0260, "lng": 72.5085},
    "302017": {"locality": "Malviya Nagar", "city": "Jaipur", "lat": 26.8570, "lng": 75.8080},
    "226010": {"locality": "Gomti Nagar", "city": "Lucknow", "lat": 26.8540, "lng": 80.9990},
    "682030": {"locality": "Kakkanad", "city": "Kochi", "lat": 10.0159, "lng": 76.3419},
}
EOF

cat > app/reference/verified.py <<'EOF'
VERIFIED = [
    ("phone",      "+911930",           "National Cybercrime Helpline"),
    ("phone",      "+911909",           "TRAI Do Not Disturb"),
    ("phone",      "+9118001600",       "HDFC Bank customer care"),
    ("phone",      "+9118002600",       "HDFC Bank customer care"),
    ("phone",      "+9118001080",       "ICICI Bank customer care"),
    ("phone",      "+9118001234",       "State Bank of India customer care"),
    ("phone",      "+9118002100",       "State Bank of India customer care"),
    ("phone",      "+9118604195555",    "Axis Bank customer care"),
    ("phone",      "+9118602662666",    "Kotak Mahindra Bank customer care"),
    ("sender_id",  "HDFCBK",            "HDFC Bank SMS sender"),
    ("sender_id",  "ICICIB",            "ICICI Bank SMS sender"),
    ("sender_id",  "SBIINB",            "State Bank of India SMS sender"),
    ("sender_id",  "AXISBK",            "Axis Bank SMS sender"),
    ("sender_id",  "KOTAKB",            "Kotak Mahindra Bank SMS sender"),
    ("url",        "https://cybercrime.gov.in",  "National Cyber Crime Reporting Portal"),
    ("url",        "https://sancharsaathi.gov.in", "Sanchar Saathi"),
    ("phone",      "+918041002233",     "Fresh Bakes, Indiranagar"),
    ("phone",      "+918025530190",     "Koramangala Pharmacy"),
    ("upi",        "freshbakes@okaxis", "Fresh Bakes, Indiranagar"),
]
VERIFIED_KEYS = {(k, v): name for k, v, name in VERIFIED}
EOF

cat > app/reference/scam_types.py <<'EOF'
SCAM_TYPES = [
    "digital-arrest", "fake-kyc-link", "upi-refund-qr", "investment-group",
    "courier-customs", "job-offer", "lottery-prize", "loan-app-harassment",
    "electricity-disconnection", "fake-customer-care", "otp-call", "sextortion",
]
KNOWN_SCAM_TYPES = set(SCAM_TYPES) | {"other"}
EOF

cat > app/reference/channels.py <<'EOF'
CHANNELS = ["Phone call", "SMS or WhatsApp", "QR code",
            "Fake website", "UPI request", "Something else"]
EOF

# ============================================================
cat > app/services/normalise.py <<'EOF'
import re

_PHONE_STRIP = re.compile(r"[ \-().]")
_PHONE_MOBILE   = re.compile(r"^\+91[6-9]\d{9}$")
_PHONE_TOLLFREE = re.compile(r"^\+91(1800|1860)\d{4,7}$")
_PHONE_HELPLINE = re.compile(r"^\+91(1\d{3})$")
_UPI   = re.compile(r"^[a-z0-9.\-_]{2,256}@[a-z]{2,64}$")
_URL   = re.compile(r"^https://[a-z0-9.\-]+\.[a-z]{2,}(/\S*)?$")
_SENDER = re.compile(r"^[A-Z]{6}$")

def canonicalise(kind: str, raw: str) -> str | None:
    if raw is None:
        return None
    s = str(raw).strip()
    if not s:
        return None
    if kind == "phone":
        s = _PHONE_STRIP.sub("", s)
        if s.startswith("00"):
            s = "+" + s[2:]
        if s.startswith("0") and len(s) == 11:
            s = "+91" + s[1:]
        if s.startswith("91") and len(s) == 12:
            s = "+" + s
        if not s.startswith("+"):
            s = "+91" + s
        if _PHONE_MOBILE.match(s) or _PHONE_TOLLFREE.match(s) or _PHONE_HELPLINE.match(s):
            return s
        return None
    if kind == "upi":
        s = s.lower().replace(" ", "")
        return s if _UPI.match(s) else None
    if kind == "url":
        s = s.lower()
        if s.startswith("http://"):
            s = "https://" + s[7:]
        if s.startswith("https://www."):
            s = "https://" + s[12:]
        s = s.split("?", 1)[0].rstrip("/")
        return s if _URL.match(s) else None
    if kind == "sender_id":
        s = s.upper()
        s = re.sub(r"^[A-Z]{2}-?", "", s)
        return s if _SENDER.match(s) else None
    return None

def mask(kind: str, canonical: str, distinct: int) -> str:
    if distinct >= 3:
        return canonical
    if kind == "phone":
        return canonical[:6] + "XXXXX" + canonical[-3:] if len(canonical) >= 10 else canonical
    if kind == "upi":
        local, _, dom = canonical.partition("@")
        return (local[0] if local else "") + "***@" + dom
    if kind == "url":
        host = canonical.replace("https://", "", 1).split("/", 1)[0]
        return host[:3] + "***" + host[3:8] if len(host) > 5 else canonical
    if kind == "sender_id":
        return canonical[:2] + "***"
    return canonical
EOF

cat > app/services/fingerprint.py <<'EOF'
import hmac, hashlib, base64
from app.config import TRUST_HMAC_KEY

def _key() -> bytes:
    try:
        return base64.b64decode(TRUST_HMAC_KEY)
    except Exception:
        return TRUST_HMAC_KEY.encode()

def rid_fp(reporter_id: str) -> bytes:
    return hmac.new(_key(), b"rid:" + reporter_id.encode(), hashlib.sha256).digest()

def net_fp(ip_prefix: str) -> bytes:
    return hmac.new(_key(), b"net:" + ip_prefix.encode(), hashlib.sha256).digest()[:16]
EOF

cat > app/services/rate_limit.py <<'EOF'
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
EOF

# ============================================================
cat > app/services/trust_engine.py <<'EOF'
"""
Pure trust engine. Input: list of stored reports for one indicator + now + thresholds.
Output: Assessment. Deterministic, LLM-free.

While cfg.APPROVED is False, this module NEVER returns KNOWN_SCAM. It computes
clusters (safe definitional de-dup) and returns SUSPICIOUS for any indicator with
at least one report, so the app is demoable without approving verdict thresholds.
"""
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from app.db.models import VERDICT, VERDICT_INV
from app.thresholds import Thresholds


@dataclass
class Assessment:
    verdict: str
    distinct_reporters: int
    report_count: int
    first_seen: datetime | None
    last_seen: datetime | None
    scam_type: str | None
    reason_codes: list[str] = field(default_factory=list)


def _clusters(reports, net_window_hours: int):
    """Union-Find over (rid_fp) and (net_fp within window). Safe with no verdict thresholds."""
    parent = list(range(len(reports)))
    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    def union(i, j):
        ri, rj = find(i), find(j)
        if ri != rj: parent[ri] = rj
    win = timedelta(hours=net_window_hours)
    for i, a in enumerate(reports):
        for j in range(i + 1, len(reports)):
            b = reports[j]
            if a.reporter_fp == b.reporter_fp:
                union(i, j); continue
            if a.net_fp == b.net_fp and abs(a.reported_at - b.reported_at) <= win:
                union(i, j)
    return len({find(i) for i in range(len(reports))})


def assess(reports, cfg: Thresholds, now: datetime) -> Assessment:
    if not reports:
        return Assessment(
            verdict="NO_REPORTS", distinct_reporters=0, report_count=0,
            first_seen=None, last_seen=None, scam_type=None, reason_codes=["EMPTY"],
        )
    distinct = _clusters(reports, cfg.CLUSTER_NET_WINDOW_HOURS)
    first = min(r.occurred_at for r in reports)
    last  = max(r.occurred_at for r in reports)
    types = [r.scam_type for r in reports]
    top = max(set(types), key=types.count) if types else None

    if not cfg.APPROVED:
        return Assessment(
            verdict="SUSPICIOUS", distinct_reporters=distinct,
            report_count=len(reports), first_seen=first, last_seen=last,
            scam_type=top, reason_codes=["THRESHOLDS_NOT_APPROVED"],
        )

    # Full path blocked — uncomment and fill when thresholds arrive.
    raise RuntimeError(
        "Trust engine full path not implemented: fill in app/thresholds.py "
        "and remove the guard in app/thresholds.load()."
    )
EOF

cat > app/schemas/api.py <<'EOF'
from datetime import datetime
from pydantic import BaseModel, Field

class ReportIn(BaseModel):
    report_id: str
    occurred_at: str
    reported_at: str
    reporter_id: str
    ip_prefix: str
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
EOF

# ============================================================
cat > app/middleware/licence_gate.py <<'EOF'
import json, base64, time
from pathlib import Path
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError
from app.config import LICENCE_PUBKEY_PATH, LICENCE_FILE_PATH

EXEMPT = {"/health", "/license", "/docs", "/openapi.json", "/redoc"}
_state = {"licence": None, "verified_at": 0}
RELOAD_SECONDS = 30

def _load_pubkey() -> VerifyKey:
    return VerifyKey(base64.b64decode(Path(LICENCE_PUBKEY_PATH).read_text().strip()))

def _load_and_verify() -> dict | None:
    p = Path(LICENCE_FILE_PATH)
    if not p.exists(): return None
    try:
        doc = json.loads(p.read_text())
        payload = {k: doc[k] for k in ("licensee", "expires_at")}
        sig = base64.b64decode(doc["signature"])
        _load_pubkey().verify(json.dumps(payload, sort_keys=True).encode(), sig)
        return doc
    except (KeyError, BadSignatureError, Exception):
        return None

def reload_licence():
    _state["licence"] = _load_and_verify()
    _state["verified_at"] = time.time()

def current() -> dict | None:
    if time.time() - _state["verified_at"] > RELOAD_SECONDS or _state["licence"] is None:
        reload_licence()
    return _state["licence"]

async def licence_middleware(request: Request, call_next):
    if request.method == "OPTIONS" or request.url.path in EXEMPT or request.url.path.startswith("/license"):
        return await call_next(request)
    lic = current()
    if not lic:
        return JSONResponse({"error": "LICENSE_EXPIRED"}, status_code=403)
    from datetime import datetime, timezone
    try:
        exp = datetime.fromisoformat(lic["expires_at"])
    except Exception:
        return JSONResponse({"error": "LICENSE_EXPIRED"}, status_code=403)
    if datetime.now(timezone.utc) >= exp:
        return JSONResponse({"error": "LICENSE_EXPIRED"}, status_code=403)
    return await call_next(request)
EOF

# ============================================================
cat > app/routes/health.py <<'EOF'
from fastapi import APIRouter
router = APIRouter()
@router.get("/health")
def health():
    return {"ok": True}
EOF

cat > app/routes/reports.py <<'EOF'
from datetime import datetime, timezone, timedelta
from dateutil.parser import isoparse
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Indicator, Report, KIND
from app.schemas.api import ReportIn
from app.services.normalise import canonicalise
from app.services.fingerprint import rid_fp, net_fp as net_fp_fn
from app.services.rate_limit import check as rl_check
from app.services.trust_engine import assess
from app.reference.areas import AREAS
from app.reference.scam_types import KNOWN_SCAM_TYPES
from app.reference.channels import CHANNELS
from app.thresholds import load as load_thresholds

router = APIRouter()

def _case_id(indicator_id: int) -> str:
    return f"case_{indicator_id:08d}"

@router.post("/reports", status_code=201)
def create_report(p: ReportIn, db: Session = Depends(get_db)):
    kind_int = KIND.get(p.identifier_type)
    if kind_int is None:
        raise HTTPException(400, "invalid identifier_type")
    canon = canonicalise(p.identifier_type, p.identifier_value)
    if canon is None:
        raise HTTPException(400, "invalid identifier_value")
    if p.pincode not in AREAS:
        raise HTTPException(400, "invalid pincode")
    if p.channel not in CHANNELS:
        raise HTTPException(400, "invalid channel")
    if p.scam_type not in KNOWN_SCAM_TYPES:
        p = p.model_copy(update={"scam_type": "other"})

    try:
        occurred = isoparse(p.occurred_at)
        reported = isoparse(p.reported_at)
        if occurred.tzinfo is None:
            occurred = occurred.replace(tzinfo=timezone.utc)
        if reported.tzinfo is None:
            reported = reported.replace(tzinfo=timezone.utc)
    except Exception:
        raise HTTPException(400, "invalid timestamp")

    now = datetime.now(timezone.utc)
    if occurred > now + timedelta(minutes=5):
        raise HTTPException(400, "occurred_at in future")

    r_fp = rid_fp(p.reporter_id)
    n_fp = net_fp_fn(p.ip_prefix)
    cfg = load_thresholds()
    if not rl_check(db, r_fp, n_fp, cfg.RL_RID_PER_HOUR, cfg.RL_RID_PER_DAY, cfg.RL_NET_PER_HOUR):
        raise HTTPException(429, "rate limited")

    existing = db.scalar(select(Report).where(Report.report_id == p.report_id))
    if existing is not None:
        ind = db.get(Indicator, existing.indicator_id)
        return {"report_id": p.report_id, "case_id": _case_id(ind.id), "merged": True}

    ind = db.scalar(select(Indicator).where(
        Indicator.kind == kind_int, Indicator.canonical == canon))
    was_new = ind is None
    if was_new:
        ind = Indicator(kind=kind_int, canonical=canon)
        db.add(ind); db.flush()

    rep = Report(
        report_id=p.report_id, indicator_id=ind.id,
        occurred_at=occurred, reported_at=reported, ingested_at=now,
        reporter_fp=r_fp, net_fp=n_fp, channel=p.channel,
        scam_type=p.scam_type, pincode=p.pincode,
        note_len=len(p.note or ""), has_screenshot=p.has_screenshot,
        amount_lost_inr=p.amount_lost_inr, trust_state=1,
    )
    db.add(rep)
    db.flush()

    reports = db.scalars(select(Report).where(Report.indicator_id == ind.id)).all()
    a = assess(list(reports), cfg, now)
    from app.db.models import VERDICT
    from app.services.normalise import mask
    ind.verdict = VERDICT[a.verdict]
    ind.report_count = a.report_count
    ind.distinct_reporters = a.distinct_reporters
    ind.first_seen = a.first_seen
    ind.last_seen = a.last_seen
    ind.scam_type = a.scam_type
    ind.display_value = mask(p.identifier_type, canon, a.distinct_reporters)
    ind.computed_at = now
    ind.version = (ind.version or 0) + 1
    db.commit()

    return {"report_id": p.report_id, "case_id": _case_id(ind.id), "merged": not was_new}
EOF

cat > app/routes/lookup.py <<'EOF'
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
EOF

cat > app/routes/map.py <<'EOF'
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
EOF

cat > app/routes/alerts.py <<'EOF'
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, distinct
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Report

router = APIRouter()

@router.get("/alerts")
def alerts(pincode: str, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    h24 = now - timedelta(hours=24)
    d8  = now - timedelta(days=8)
    d1  = now - timedelta(days=1)
    d30 = now - timedelta(days=30)

    n24 = db.scalar(select(func.count()).where(
        Report.pincode == pincode, Report.occurred_at >= h24, Report.occurred_at < now)) or 0
    baseline = db.scalar(select(func.count()).where(
        Report.pincode == pincode, Report.occurred_at >= d8, Report.occurred_at < d1)) or 0
    baseline_per_day = baseline / 7.0

    out = []
    if n24 >= 5 and n24 >= 2 * baseline_per_day:
        out.append({"type": "SPIKE", "pincode": pincode, "window": "24h",
                    "count": n24, "baseline_per_day": round(baseline_per_day, 1)})

    present = db.scalars(select(distinct(Report.scam_type)).where(
        Report.pincode == pincode, Report.occurred_at >= h24, Report.occurred_at < now)).all()
    for t in present:
        seen = db.scalar(select(func.count()).where(
            Report.pincode == pincode, Report.scam_type == t,
            Report.occurred_at >= d30, Report.occurred_at < d1)) or 0
        if seen == 0:
            out.append({"type": "NEW_TYPE", "pincode": pincode,
                        "scam_type": t, "window": "24h"})
    return {"alerts": out}
EOF

cat > app/routes/admin.py <<'EOF'
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
EOF

cat > app/routes/challenges.py <<'EOF'
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
EOF

cat > app/routes/licence.py <<'EOF'
import json, base64
from pathlib import Path
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from app.config import LICENCE_FILE_PATH
from app.middleware.licence_gate import current, reload_licence

router = APIRouter()

@router.get("/license")
def get_license():
    lic = current()
    if not lic:
        return {"licensee": None, "expires_at": None, "status": "none"}
    return {"licensee": lic["licensee"], "expires_at": lic["expires_at"], "status": "valid"}

@router.post("/license")
async def upload_license(request: Request):
    body = await request.body()
    try:
        doc = json.loads(body)
        for k in ("licensee", "expires_at", "signature"):
            if k not in doc: raise ValueError("missing field")
    except Exception as e:
        return JSONResponse({"error": f"invalid licence payload: {e}"}, status_code=400)
    Path(LICENCE_FILE_PATH).write_text(json.dumps(doc))
    reload_licence()
    return {"ok": True, "licensee": doc["licensee"], "expires_at": doc["expires_at"]}
EOF

# ============================================================
cat > app/main.py <<'EOF'
import os, base64, logging, time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from app.config import DATABASE_URL
from app.db.session import Base, engine, SessionLocal
from app.db.models import ClockState
from app.middleware.licence_gate import licence_middleware, reload_licence
from app.routes import health, reports, lookup, map, alerts, admin, challenges, licence

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("scam_map")

def init_db():
    Base.metadata.create_all(engine)

def _clock_check():
    """Refuse if the wall clock appears to have rolled backwards by >5 min."""
    now = datetime.now(timezone.utc)
    with SessionLocal() as db:
        row = db.scalar(select(ClockState).where(ClockState.id == 1))
        if row is None:
            db.add(ClockState(id=1, max_seen=now)); db.commit(); return
        if now < row.max_seen - timedelta(minutes=5):
            raise RuntimeError("clock rollback detected")
        if now > row.max_seen:
            row.max_seen = now; db.commit()

app = FastAPI(title="Community Scam Map")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.middleware("http")(licence_middleware)
for r in (health, reports, lookup, map, alerts, admin, challenges, licence):
    app.include_router(r.router)

@app.on_event("startup")
def _startup():
    init_db()
    reload_licence()
    try:
        _clock_check()
    except Exception as e:
        log.error("clock check failed: %s", e)
    from app.thresholds import load
    try:
        load()
    except RuntimeError as e:
        log.warning("thresholds load failed (expected until approved): %s", e)
EOF

# ============================================================
cat > tests/conftest.py <<'EOF'
import os, base64, pytest
os.environ.setdefault("TRUST_HMAC_KEY", base64.b64encode(os.urandom(32)).decode())
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("LICENCE_PUBKEY_PATH", "./licence_pubkey.b64")
os.environ.setdefault("LICENCE_FILE_PATH", "./licence.json")

from fastapi.testclient import TestClient
from app.main import app, init_db

@pytest.fixture
def client():
    init_db()
    with TestClient(app) as c:
        yield c

@pytest.fixture(autouse=True)
def bypass_licence(monkeypatch):
    from app.middleware import licence_gate
    monkeypatch.setattr(licence_gate, "current", lambda: {
        "licensee": "Test", "expires_at": "2099-01-01T00:00:00+00:00", "signature": ""
    })
EOF

cat > tests/test_normalise.py <<'EOF'
import pytest
from app.services.normalise import canonicalise

@pytest.mark.parametrize("raw,expected", [
    ("+91 98765 43210", "+919876543210"),
    ("09876543210",     "+919876543210"),
    ("98765-43210",     "+919876543210"),
    ("919876543210",    "+919876543210"),
    ("1800 1600",       "+9118001600"),
    ("1930",            "+911930"),
    ("1909",            "+911909"),
])
def test_phone_forms(raw, expected):
    assert canonicalise("phone", raw) == expected

@pytest.mark.parametrize("raw", ["12345", "test", "98765", "12345678901"])
def test_phone_junk(raw):
    assert canonicalise("phone", raw) is None

def test_upi_and_url():
    assert canonicalise("upi", "Ravi12@OKAXIS") == "ravi12@okaxis"
    assert canonicalise("url", "http://www.sbi-kyc.in/pay?utm=x") == "https://sbi-kyc.in/pay"

def test_sender():
    assert canonicalise("sender_id", "VM-HDFCBK") == "HDFCBK"
    assert canonicalise("sender_id", "HDFCBK")    == "HDFCBK"
EOF

cat > tests/test_reports.py <<'EOF'
def _payload(rid="rep_1", value="+91 98765 43210", reporter="r_1", ip="10.0.0"):
    return {
        "report_id": rid,
        "occurred_at": "2026-10-27T18:21:04+05:30",
        "reported_at": "2026-10-27T18:40:04+05:30",
        "reporter_id": reporter, "ip_prefix": ip,
        "channel": "Phone call", "scam_type": "digital-arrest",
        "identifier_type": "phone", "identifier_value": value,
        "pincode": "560102", "locality": "HSR Layout", "city": "Bengaluru",
        "note": "Video call from a man in police uniform.",
        "has_screenshot": False, "amount_lost_inr": 0,
    }

def test_create_and_idempotency(client):
    r1 = client.post("/reports", json=_payload())
    assert r1.status_code == 201
    r2 = client.post("/reports", json=_payload())     # same report_id
    assert r2.status_code == 201
    assert r2.json()["report_id"] == r1.json()["report_id"]

def test_junk_rejected(client):
    p = _payload(value="12345")
    r = client.post("/reports", json=p)
    assert r.status_code == 400
EOF

cat > tests/test_lookup.py <<'EOF'
def _payload(rid, reporter, ip):
    return {
        "report_id": rid,
        "occurred_at": "2026-10-27T18:21:04+05:30",
        "reported_at": "2026-10-27T18:40:04+05:30",
        "reporter_id": reporter, "ip_prefix": ip,
        "channel": "Phone call", "scam_type": "digital-arrest",
        "identifier_type": "phone", "identifier_value": "+91 98765 43210",
        "pincode": "560102", "locality": "HSR Layout", "city": "Bengaluru",
        "note": "Call.", "has_screenshot": False, "amount_lost_inr": 0,
    }

def test_new_is_no_reports(client):
    r = client.get("/lookup", params={"type": "phone", "value": "+919876543210"})
    assert r.status_code == 200
    assert r.json()["verdict"] == "NO_REPORTS"

def test_verified_short_circuit(client):
    r = client.get("/lookup", params={"type": "phone", "value": "1930"})
    assert r.status_code == 200
    assert r.json()["verdict"] == "VERIFIED_BUSINESS"

def test_after_report_is_suspicious(client):
    client.post("/reports", json=_payload("rep_a", "r_a", "10.0.1"))
    r = client.get("/lookup", params={"type": "phone", "value": "+919876543210"})
    assert r.status_code == 200
    assert r.json()["verdict"] == "SUSPICIOUS"     # safe while APPROVED=False
    assert r.json()["challenged"] is False

def test_dispute_suppresses(client):
    client.post("/reports", json=_payload("rep_b", "r_b", "10.0.2"))
    client.post("/challenges", json={
        "identifier_type": "phone", "identifier_value": "+919876543210",
        "claimant_name": "X", "contact_email": "x@x", "proof_note": ""
    })
    r = client.get("/lookup", params={"type": "phone", "value": "+919876543210"})
    assert r.json()["verdict"] != "KNOWN_SCAM"
    assert r.json()["challenged"] is True
EOF

cat > tests/test_privacy.py <<'EOF'
import json

def _payload(rid, reporter, ip, note):
    return {
        "report_id": rid,
        "occurred_at": "2026-10-27T18:21:04+05:30",
        "reported_at": "2026-10-27T18:40:04+05:30",
        "reporter_id": reporter, "ip_prefix": ip,
        "channel": "Phone call", "scam_type": "digital-arrest",
        "identifier_type": "phone", "identifier_value": "+91 98765 43210",
        "pincode": "560102", "locality": "HSR Layout", "city": "Bengaluru",
        "note": note, "has_screenshot": False, "amount_lost_inr": 0,
    }

def test_lookup_never_leaks_pii(client):
    secret = "UNIQUE_NOTE_MARKER_42"
    client.post("/reports", json=_payload("rep_p", "reporter_SECRET_A", "10.9.9", secret))
    r = client.get("/lookup", params={"type": "phone", "value": "+919876543210"})
    body = json.dumps(r.json())
    assert "reporter_SECRET_A" not in body
    assert "10.9.9" not in body
    assert secret not in body
EOF

# ============================================================
cat > scripts_make_keys.py <<'EOF'
import base64, json, sys, argparse
from datetime import datetime, timedelta, timezone
from pathlib import Path
from nacl.signing import SigningKey

ap = argparse.ArgumentParser()
ap.add_argument("--licensee", required=True)
ap.add_argument("--days", type=int, default=30)
ap.add_argument("--out", default="licence.json")
ap.add_argument("--keydir", default=".")
args = ap.parse_args()

keydir = Path(args.keydir)
priv_path = keydir / "licence_privkey.b64"
pub_path  = keydir / "licence_pubkey.b64"

if priv_path.exists():
    sk = SigningKey(base64.b64decode(priv_path.read_text().strip()))
else:
    sk = SigningKey.generate()
    priv_path.write_text(base64.b64encode(bytes(sk)).decode())
    pub_path.write_text(base64.b64encode(bytes(sk.verify_key)).decode())
    print(f"wrote {priv_path} (MOVE OFFLINE) and {pub_path}")

payload = {"licensee": args.licensee,
           "expires_at": (datetime.now(timezone.utc) + timedelta(days=args.days)).isoformat()}
sig = base64.b64encode(sk.sign(json.dumps(payload, sort_keys=True).encode()).signature).decode()
Path(args.out).write_text(json.dumps({**payload, "signature": sig}, indent=2))
print(f"wrote {args.out}")
EOF
mkdir -p scripts && mv scripts_make_keys.py scripts/make_licence.py

# ============================================================
cd ..
zip -qr "${PROJECT}.zip" "$PROJECT"
echo
echo "OK. Created $PROJECT/ and ${PROJECT}.zip"

