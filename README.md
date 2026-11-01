# Community Scam Map — Full Backend

Production-ready FastAPI backend for the **Mitigata CyberForge Community Scam Map**, built to the complete specification of the **Design & Test Book** (`deepseek_html_20261031_e0748a.html`).

---

## Features & Architecture

* **Source-Independence Engine (M1–M5):**
  * Keyed pseudonymous identity fingerprints (`HMAC-SHA256`) — zero raw PII stored or leaked.
  * Union-Find clustering collapsing repeats and same-network bursts within 6 hours.
  * Coordinated campaign detection collapsing duplicate template waves into a single evidence unit.
  * Bounded Beta-Binomial aggregation with skeptical prior ($\alpha_0=0.5, \beta_0=1.5$).
  * Fully deterministic state machine with demotion hysteresis.
* **O(1) Precomputed Lookup (M6):**
  * Sub-16ms internal latency on precomputed `indicators` table.
  * Read-after-write consistency updated upon ingestion.
  * Privacy floor masking for identifiers with fewer than 3 independent reports.
* **Geo & Temporal Intelligence (M7):**
  * Centroid-based map view with 7-day rolling window (`GET /map`).
  * Proactive Alert Engine (`GET /alerts`) detecting `SPIKE` (with net diversity $\ge 3$ hardening) and `NEW_TYPE` trends.
* **Business Protection & Dispute Mechanism (M8):**
  * Pre-seeded allowlist for verified institutions (19 entries: helplines, banks, portals).
  * `POST /challenges` with instant short-circuit and hard veto ensuring disputed indicators can **never** be labeled `KNOWN_SCAM`.
* **Licence & Integrity Gate (M9):**
  * Ed25519 digital signature licensing via PyNaCl.
  * Clock rollback defense (>5 minutes backwards detection).
* **Comprehensive Automated Test Suite (M10):**
  * 30 passing tests covering normalisation, privacy, alerts matrix, and S1–S12 simulation matrix.

---

## Quickstart

### 1. Environment Setup
```bash
# Windows
.\.venv\Scripts\activate

# Linux / macOS
source .venv/bin/activate

# Install dependencies (if not already installed)
pip install -r requirements.txt
```

### 2. Generate Licence Keys (Ed25519)
```bash
python scripts/make_licence.py --licensee "Demo Bank" --days 30
```

### 3. Initialize Database
```bash
python -c "from app.main import init_db; init_db()"
```

### 4. Run Automated Test Suite
```bash
pytest -v
```
*(30 passed in ~0.4s)*

### 5. Launch Server
```bash
uvicorn app.main:app --reload --port 8000
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Liveness health check |
| `GET` | `/lookup?type={phone\|upi\|url\|sender_id}&value={value}` | Precomputed verdict lookup |
| `POST` | `/reports` | Ingest scam report (idempotent, rate-limited) |
| `GET` | `/map?pincode={pin}&days=7` | Clustered incident map |
| `GET` | `/alerts?pincode={pin}` | Proactive area alerts (SPIKE & NEW_TYPE) |
| `POST` | `/challenges` | File a business dispute |
| `GET` | `/license` | Current licence status |
| `POST` | `/license` | Upload signed licence document |
| `POST` | `/admin/reset` | Reset database for fresh test run |

---

## Offline Deliverables

* `community-scam-map.zip`: Ready-to-distribute self-contained package.
* `bootstrap.sh`: Bash setup script for automated scaffolding on Unix environments.
* `UPDATES.md`: Full technical log and parameter calibration manifesto.

