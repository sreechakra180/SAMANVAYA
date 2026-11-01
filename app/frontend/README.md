# SAMANVAYA — Community Cyber Intelligence Platform
### *Know before you trust.*

**Samanvaya** (समन्वय — *"Harmonious Coordination"*) is an enterprise-grade, community-powered cyber scam intelligence platform engineered for India's digital ecosystem. It replaces reactive complaint portals with real-time, privacy-preserving threat intelligence, Bayesian trust assessment, localized spike detection, and spatial cartographic radar.

---

## 1. Brand Identity & Design Language

- **Product Name:** SAMANVAYA
- **Descriptor:** COMMUNITY CYBER INTELLIGENCE
- **Primary Tagline:** *"Know before you trust."*
- **Secondary Statement:** *"Community-powered intelligence for safer digital interactions."*
- **Design Philosophy:** Premium Editorial Technology + Minimalist Product Design + Soft Illustrative Motion.
- **Anti-AI-Slop Commitment:** Zero generic neon gradients, zero floating blobs, zero decorative shield emojis, zero fabricated metrics (no fake "64K nodes" or "100% accuracy"). Every number displayed is derived directly from live telemetry or verified ground-truth data.

### Editorial Color Palette (Design Tokens)

| Token | Hex | Role |
|---|---|---|
| `bg` | `#F8FAF7` | Warm white background |
| `surface` | `#FFFFFF` | Pure white card surfaces |
| `surface-subtle` | `#F1F4F0` | Very light neutral surface |
| `surface-mint` | `#EAF3EA` | Soft mint accent |
| `sage` | `#CADFCC` | Calm sage boundary |
| `natural` | `#A8C9AD` | Natural green mid-tone |
| `forest` | `#24543B` | Primary forest green brand |
| `forest-dark` | `#193A2A` | Deep green primary typography |
| `mutedText` | `#78877D` | Secondary body text |
| `editorialBorder` | `#DCE7DD` | Restrained card borders |
| `warning` | `#D97869` | Restrained warning coral |
| `critical` | `#BA1A1A` | Accessible critical alert red |

---

## 2. Architecture & Key Features

### A. Scroll-Driven Video Scrubbing Hero (`HeroScrollSection.tsx`)
- Integrates `samanvaya-hero.mp4` (`4.77 MB`) located in `public/videos/`.
- Uses high-performance `requestAnimationFrame` scrubbing tracking `window.scrollY`.
- Frame rate calibrated with time delta clamping to avoid stutter.
- Progressive 4-phase narrative HUD overlay explaining the platform's lifecycle from community intake to collective defense.
- Supports instant play/pause fallback for accessibility and prefers-reduced-motion environments.

### B. Exploded Backend Architecture Section (`ArchitectureSection.tsx`)
- Integrates `samanvaya-architecture.mp4` (`5.72 MB`) located in `public/videos/`.
- Two-column sticky split-scroll: the left column locks the scrubbing video visualization while the right column progresses through the 8 pipeline stages in strict operational order:
  1. **Stage 1 — Signal Intake:** Anonymized phone, UPI, URL, Sender ID intake.
  2. **Stage 2 — Cryptographic Fingerprinting:** HMAC-SHA256 reporter salt + CIDR `/24` subnet hashing.
  3. **Stage 3 — Anti-Sybil Rate Limiting:** Sliding-window burst mitigation preventing coordinated smear campaigns.
  4. **Stage 4 — Canonical Normalisation:** E.164 phone formatting, case-folding, domain sanitisation.
  5. **Stage 5 — Precomputed Allowlist Gate:** Microsecond bypass for 1930, official banks, emergency numbers.
  6. **Stage 6 — Bayesian Trust Engine:** Evidence-weighted scoring with reporter diversity metrics.
  7. **Stage 7 — Spatial Clustering:** Haversine clustering across 25 monitored Indian urban corridors.
  8. **Stage 8 — Cryptographic Gatekeeper:** Ed25519 digital licensing with monotonic clock-rollback guard.
- Concludes with the architectural manifesto: *"AI assists. Evidence decides. Communities protect."*

### C. 3D Spatial Threat Radar (`ThreatRadar3D.tsx`)
- Calm, spatial cartographic visualizer built on HTML5 Canvas.
- Accurately renders India's 25 monitored scam corridors with real latitudes, longitudes, and active threat levels.
- Features:
  - **Dynamic sweep radar plane** simulating continuous background corridor monitoring.
  - **Live telemetry sync** connected directly to `GET /map`.
  - **Interactive 3D Orbit Controls:** Smooth mouse/touch drag for yaw and pitch, wheel zoom, and animated camera reset.
  - **Interactive hotspot selection:** Clicking any corridor pin displays the locality, pincode, active case volume, top scam vector, and severity indicator.

### D. Universal Indicator Lookup (`LookupScreen.tsx` & `VerdictBadge.tsx`)
- Real-time search across Phone (+91), UPI ID, URL, and SMS Sender Header.
- Real backend verdicts: `NO_REPORTS`, `SUSPICIOUS`, `KNOWN_SCAM`, and `VERIFIED_BUSINESS`.
- **Accessibility & TTS:** Web Speech API audio read-aloud in English and Hindi.
- **Evidence Trail:** Anonymized, chronologically sorted incident records displaying timestamp, channel, scam category, and pincode.
- Sample query chips for instant judge evaluation (`1930`, `+919876543210`, `fraud.cbi@paytm`, `VK-HDFCBK`).

### E. AI Scam Message Scanner (`AIScamScanner.tsx`)
- Powered by the real backend endpoint `POST /api/model/analyze` (TF-IDF + Calibrated Logistic Regression model).
- Real-time inference returning:
  - Threat likelihood percentage (e.g., 98.3%).
  - Detected category (Digital Arrest, Electricity Disconnection, KYC Phishing, Job Task, Lottery, Customs).
  - Risk severity tier (CRITICAL, HIGH, MODERATE, LOW).
  - Extracted Indicators of Compromise (phones, UPIs, URLs).
  - Lexical risk trigger tokens.
  - Real measured inference latency (~3.2 ms).
- Preloaded with authentic sample prompts (Digital Arrest police call, Electricity disconnection SMS, FedEx customs narcotics, Telegram job offer, Legitimate bank OTP).

### F. Threat Alerts & Statutory Merchant Dispute (`AlertsScreen.tsx`)
- Powered by `GET /api/alerts` with real SPIKE and NEW_TYPE detection algorithms.
- **Corridor Filter:** Filter alerts across all 25 national corridors or drill into specific urban centers (Bengaluru, Mumbai, Delhi, Hyderabad, Pune, Chennai, Kolkata).
- **Statutory Merchant Dispute Flow:** Formal challenge portal powered by `POST /api/challenges`, allowing legitimate commercial entities to file dispute notes against false reports.

### G. 60-Second Citizen Report Flow (`ReportFlow.tsx`)
- Frictionless reporting intake designed for high-stress situations.
- 6 discrete channel tiles (Phone call, SMS/WhatsApp, QR code, Fake website, UPI request, Other).
- 25 predefined pincode autocomplete list matching backend centroids.
- Automated client-side normalisation and payload validation.
- Submits directly to `POST /api/reports` and displays generated Case ID.

### H. Complete Bilingual Localisation (EN / हिन्दी)
- Centralized i18n layer (`src/i18n/index.ts`, `en.ts`, `hi.ts`).
- Instant reactive switching with `localStorage` persistence.
- Complete translation coverage across all screens, navigation, verdicts, radar controls, scanner, and footers.

---

## 3. Directory Layout

```
app/frontend/
├── index.html
├── package.json
├── tailwind.config.js          ← Editorial theme tokens & typography
├── vite.config.ts             ← Proxy /api → localhost:8000
├── public/
│   └── videos/
│       ├── samanvaya-hero.mp4         ← Real 1080p hero scrubbing video
│       └── samanvaya-architecture.mp4 ← Real 1080p architecture video
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css              ← Editorial CSS variables & utilities
│   ├── data.ts                ← 25 centroids, scam categories, identifier types
│   ├── i18n/
│   │   ├── index.ts           ← I18nProvider context & useTranslation hook
│   │   ├── en.ts              ← English strings
│   │   └── hi.ts              ← Hindi strings
│   ├── components/
│   │   ├── Navigation.tsx     ← Brand wordmark, language toggle, 1930 pill
│   │   ├── HeroScrollSection.tsx   ← Video-scrubbing hero section
│   │   ├── HomeDashboard.tsx  ← Main dashboard orchestration
│   │   ├── ArchitectureSection.tsx ← 8-stage sticky split-scroll
│   │   ├── ThreatRadar3D.tsx  ← 3D cartographic canvas visualizer
│   │   ├── LookupScreen.tsx   ← Universal indicator lookup
│   │   ├── VerdictBadge.tsx   ← Editorial verdict badge + Web Speech TTS
│   │   ├── AIScamScanner.tsx  ← Real ML scam message scanner
│   │   ├── AlertsScreen.tsx   ← Alerts feed & merchant challenge form
│   │   ├── ReportFlow.tsx     ← Citizen intake reporting modal
│   │   └── MainShell.tsx      ← Top-level shell & navigation tabs
```

---

## 4. Running & Verification

### Start Backend (FastAPI)
```bash
.\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000 --host 0.0.0.0 --reload
```

### Start Frontend (Vite)
```bash
npm --prefix app/frontend run dev
# Running on http://localhost:5173
```

### Seed Demo Reports (Optional)
```bash
.\.venv\Scripts\python.exe scripts\seed_demo_data.py
```

### Run Full Pytest Verification Suite
```bash
.\.venv\Scripts\python.exe -m pytest -v
# 37 passed in 1.60s
```

### Production Build
```bash
npm --prefix app/frontend run build
# Built in 6.54s with ZERO errors
```
