# Community Scam Map — Backend Updates & Implementation Log

## 1. Overview & Objective
This document records the end-to-end design, implementation, mathematical calibration, and verification of the **Community Scam Map Backend** built for the Mitigata CyberForge Hackathon. The backend adheres to the complete **Design & Test Book** (`deepseek_html_20261031_e0748a.html`), providing an explainable, deterministic, privacy-preserving, and high-performance scam reporting and intelligence engine.

---

## 2. Key Architectural Pillars Implemented

### 2.1 The Core Principle: Counting Independent Sources, Not Reports
* **Zero Raw Counting:** The system never decides verdicts based on simple volume inflation.
* **Pseudonymous Keyed Fingerprinting:**
  * Reporter identity: $rid\_fp = \text{HMAC-SHA256}(K_{id}, \text{"rid:"} + \text{reporter\_id})$ (32 bytes)
  * Network identity: $net\_fp = \text{HMAC-SHA256}(K_{id}, \text{"net:"} + \text{ip\_prefix})[:16]$
  * Raw $reporter\_id$ and $ip\_prefix$ are never stored in plain text or leaked into response payloads.
* **Clustering via Union-Find:**
  * Same $rid\_fp \implies$ collapse to 1 cluster.
  * Same $net\_fp$ within 6 hours $\implies$ collapse to 1 cluster.
  * Cluster evidence: $v(C_k) = \max_{r \in C_k} w_r$.
* **Coordinated Campaign Detection & Collapse:**
  * Identifies 4+ source clusters within a 120-minute window sharing templated descriptions ($\text{Jaccard} \ge 0.70$).
  * Collapses the entire campaign into a single evidence mass unit:
    $$v_G = \max_{k \in G} v_k \cdot \min(1.0, 1.0 + 0.1 \log_2 |G|)$$

### 2.2 Bayesian Beta-Binomial Trust Engine (Parts 1 & 3)
* **Skeptical Prior:** $\alpha_0 = 0.5, \beta_0 = 1.5$ (initial score $S(0) = 0.25$).
* **Dispute Mass ($D$):**
  * $D = 2.0$ when challenge is open.
  * $D = 4.0$ when challenge is upheld.
  * $D = 0.0$ otherwise.
* **Posterior Score ($S$):**
  $$S = \frac{\alpha_0 + E}{\alpha_0 + \beta_0 + E + D}$$
* **State Machine & Hysteresis:**
  * `HIGH_CONFIDENCE`: $c \ge 5 \land S \ge 0.75 \implies \text{KNOWN\_SCAM}$
  * `CORROBORATED`: $c \ge 3 \land S \ge 0.55 \implies \text{SUSPICIOUS}$
  * `UNVERIFIED`: $c \ge 1 \land S \ge 0.30 \implies \text{SUSPICIOUS}$
  * `DISPUTED`: Challenge open $\implies \text{SUSPICIOUS}$ (Hard Veto)
  * Demotion Hysteresis: `HIGH_CONFIDENCE` held until $S < 0.65$; `CORROBORATED` held until $S < 0.45$.

### 2.3 Hard Invariants (Enforced in Code)
1. **$I_1$ (Dispute Veto):** Any indicator under active dispute/challenge cannot receive the `KNOWN_SCAM` verdict under any circumstance.
2. **$I_2$ (Privacy & Display Floor):** Indicators with fewer than 3 independent source clusters ($c < 3$) cannot receive `KNOWN_SCAM`, and their public representation is masked (e.g. `+9198XXXXX210`, `r***@okaxis`, `sbi***.in/...`, `HD***`).
3. **$I_3$ (Allowlist Primacy):** Any entry matching the pre-seeded verified business registry immediately short-circuits to `VERIFIED_BUSINESS`.
4. **Wording Standard:** Uses neutral factual attribution ("Reported by N people near you"); prohibited words like "scammer" or "fraud" are avoided in customer-facing outputs.

---

## 3. Implemented Modules & Routes

| Module | Route / Component | Description |
|---|---|---|
| **M1 / M2** | `app/db/models.py`, `app/reference/` | SQLite (WAL) / PostgreSQL portable ORM models. Seeded with 25 urban pincodes, 19 verified allowlist entries, 12 scam types, 6 report channels. |
| **M3** | `app/services/normalise.py` | Strict canonicalisation for Indian mobile (`+91[6-9]...`), toll-free (`1800/1860`), cybercrime helplines (`1930/1909`), UPI VPA (`user@bank`), normalized HTTPS URLs, and 6-char SMS sender IDs. |
| **M4** | `POST /reports` | Validates schema, area, and time. Computes keyed HMAC fingerprints. Enforces sliding-window rate limits (10/h, 30/d per reporter; 40/h per network). Ingests report and computes incremental read-after-write verdict. |
| **M5** | `app/services/trust_engine.py` | Pure deterministic trust engine with multi-factor weighting ($q_{note}, q_{type}, q_{evidence}, q_{temporal}, \rho$), Union-Find clustering, and campaign collapse. |
| **M6** | `GET /lookup` | $O(1)$ lookup directly probing the precomputed `indicators` table. Returns verdict, display value, reporter count, timestamps, and 10 sanitized evidence events without PII. |
| **M7** | `GET /map`, `GET /alerts` | Centroid-based map view with 7-day clustering. Proactive alert engine evaluating `SPIKE` ($n_{24} \ge 5 \land n_{24} \ge 2 \times \text{baseline} \land \text{net\_diversity} \ge 3$) and `NEW_TYPE` (present in 24h $\setminus$ prior 30d). |
| **M8** | `POST /challenges` | Business dispute submission. Flags indicator, adds dispute mass $D = 2.0$, and enforces hard veto against `KNOWN_SCAM`. |
| **M9** | `app/middleware/licence_gate.py` | Ed25519 cryptographic licence verification via PyNaCl. Includes clock rollback detection (>5 min backwards). Provides `GET /license` and `POST /license`. |
| **Admin** | `POST /admin/reset` | Resets all reports, indicators, and challenges for clean demo/test runs. |
| **Health** | `GET /health` | Health-check endpoint for container/orchestrator liveness. |

---

## 4. Reconciled Configuration Parameters (`app/thresholds.py`)

All parameters are reconciled from Part 3 of the Design Book and loaded through `app/thresholds.py`:

* **Beta Prior:** $\alpha_0 = 0.5, \beta_0 = 1.5$
* **Promotions:** `corr_min_clusters = 3`, `corr_min_score = 0.55`, `hc_min_clusters = 5`, `hc_min_score = 0.75`
* **Hysteresis:** `demote_hc_to_corr = 0.65`, `demote_corr_to_unv = 0.45`
* **Dispute Mass:** `D_open = 2.0`, `D_upheld = 4.0`
* **Clustering & Campaign:** `net_window_hours = 6`, `campaign_window_minutes = 120`, `campaign_min_group = 4`, `gamma_min = 0.70`, `gamma_note_min = 0.60`, `note_jaccard = 0.70`, `note_template_jaccard = 0.85`
* **Weights:** `note_base = 0.45`, `note_len_scale = 0.55`, `note_len_ref = 200`, `note_junk = 0.15`, `note_template_dup = 0.35`, `q_type_unknown = 0.75`, `q_ev_screenshot = 0.08`, `q_ev_amount = 0.04`, `q_ev_cap = 1.10`
* **Temporal:** `q_t_1h = 1.00`, `q_t_24h = 0.95`, `q_t_7d = 0.85`, `q_t_older = 0.60`, `q_t_90d_multiplier = 0.50`
* **Alerts:** `alert_trusted_w_floor = 0.40`, `alert_spike_min_count = 5`, `alert_spike_ratio = 2.0`, `alert_net_diversity_min = 3`
* **Rate Limits:** `rl_rid_per_hour = 10`, `rl_rid_per_day = 30`, `rl_net_per_hour = 40`

---

## 5. Verification & Test Suite

The test suite consists of 30 automated tests across 6 modules:
* `tests/test_normalise.py` (13 tests) — Validates phone, toll-free, helplines, UPI, URLs, SMS sender IDs, and junk rejections.
* `tests/test_reports.py` (2 tests) — Validates report creation, idempotency on repeated `report_id`, and 400 rejection on invalid data.
* `tests/test_lookup.py` (4 tests) — Validates `NO_REPORTS`, allowlist short-circuit (`VERIFIED_BUSINESS`), post-report status, and challenge suppression.
* `tests/test_privacy.py` (1 test) — Verifies that PII (reporter IDs, IP addresses, private notes) are never leaked in lookup queries.
* `tests/test_alerts.py` (4 tests) — Verifies SPIKE thresholding, vacuous zero-baseline handling ($2 \times 0 = 0$), net diversity hardening gate ($<3$ IPs suppresses spike), and NEW_TYPE detection without self-suppression.
* `tests/test_trust_scenarios.py` (6 tests) — Verifies scenarios S1 (Organic wave $\to$ KNOWN_SCAM), S2 (40-friend bombing collapsed to 1 cluster), S3 (Same-Wi-Fi 22 accounts collapsed), S4 (Same reporter repeated 6 times collapsed), S10 (Dispute hard veto overrides 7 reports), and S12 (First-time user fair weighting).

**Result:** `30 passed in 0.41s` (100% green).

---

## 6. How to Run the Backend

```bash
# 1. Activate Virtual Environment
.venv\Scripts\activate   # (Windows) or source .venv/bin/activate (Linux/macOS)

# 2. Run Tests
pytest -v

# 3. Start Development Server
uvicorn app.main:app --reload --port 8000
```

### Verification Endpoints:
```bash
# Liveness Check
curl http://localhost:8000/health

# Verified Business Lookup (Helpline)
curl http://localhost:8000/lookup?type=phone&value=1930

# Clean Lookup
curl http://localhost:8000/lookup?type=phone&value=%2B919876543210

# Licence Check
curl http://localhost:8000/license
```

---

## 7. Deliverables Created in Workspace
1. **Full application structure:** `app/` (routes, services, schemas, db, reference, middleware).
2. **Configuration & environment:** `.env`, `.env.example`, `requirements.txt`, `pyproject.toml`.
3. **Licence generation tool & keys:** `scripts/make_licence.py`, `licence_privkey.b64`, `licence_pubkey.b64`, `licence.json`.
4. **Automated shell bootstrapper:** `bootstrap.sh`.
5. **Packaged ZIP archive:** `community-scam-map.zip`.
6. **Documentation & logs:** `README.md`, `UPDATES.md`.

---

## 8. SAMANVAYA Product Redesign & Frontend Transformation

### 8.1 Branding Transformation
- Replaced all legacy branding ("SatarkSetu", "Community Scam Map") with **SAMANVAYA** ("COMMUNITY CYBER INTELLIGENCE").
- Tagline: *"Know before you trust."*
- Secondary Statement: *"Community-powered intelligence for safer digital interactions."*
- Minimalist typographic wordmark with custom letter-spacing.

### 8.2 Editorial Design Tokens & Anti-AI-Slop Audit
- Abolished dark cyber-dashboard clichés, random shields, and neon gradients.
- Established a calm, high-trust editorial palette:
  - Background: Warm white `#F8FAF7`
  - Cards & Surfaces: Pure white `#FFFFFF` / Mint `#EAF3EA` / Neutral `#F1F4F0`
  - Brand & Accents: Forest Green `#24543B` / Soft Sage `#CADFCC` / Natural Green `#A8C9AD`
  - Typography: Deep Forest `#193A2A` / Muted Text `#78877D`
  - Alert States: Restrained Coral `#D97869` / Critical Red `#BA1A1A`
- **Zero Fabricated Metrics:** Removed artificial counters (64k nodes, 184 EPS, ₹14.20 Cr, 100% accuracy claims). Every metric reflects real backend database queries (`GET /map`, `GET /alerts`, `GET /lookup`).

### 8.3 Scroll-Driven Video Scrubbing
- **Hero Section (`HeroScrollSection.tsx`):**
  - High-performance scrubbing of `public/videos/samanvaya-hero.mp4` tied to scroll offset via `requestAnimationFrame`.
  - Progressive 4-phase narrative HUD overlay explaining community defense stages.
- **Exploded Architecture Section (`ArchitectureSection.tsx`):**
  - Sticky split-scroll view synchronizing `public/videos/samanvaya-architecture.mp4` with the 8 pipeline stages.
  - Concludes with architectural thesis: *"AI assists. Evidence decides. Communities protect."*

### 8.4 3D Spatial Threat Radar (`ThreatRadar3D.tsx`)
- Built on HTML5 Canvas using cartographic math mapped to India's 25 monitored scam corridors.
- Features real-time orbit controls (drag rotation, zoom, camera reset), dynamic radar sweep beam, and interactive hotspot cards showing live case counts and threat categories.

### 8.5 Full Bilingual Localisation (EN / हिन्दी)
- Centralized `i18n` context engine with instant switching and `localStorage` persistence.
- Complete coverage across all 5 navigation screens, verdict badges, radar controls, ML scanner, and report forms.
- Integrated Web Speech API text-to-speech for accessible verbal verdict announcements in both languages.

### 8.6 Live Integration & Test Status
- **Backend Tests:** 37/37 pytest tests passing in 1.60s.
- **Frontend Production Build:** `tsc -b && vite build` completed in 6.54s with 0 errors.
- **Live Seeding:** `scripts/seed_demo_data.py` populated authentic reports producing active clusters across 7 key metropolitan corridors and real SPIKE/NEW_TYPE alerts.

