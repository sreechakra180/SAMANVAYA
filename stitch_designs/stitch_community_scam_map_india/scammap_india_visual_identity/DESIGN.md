---
name: ScamMap India Visual Identity
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#410004'
  on-tertiary-container: '#ef4444'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Inter
    fontSize: 3rem
    fontWeight: '600'
    lineHeight: 3.5rem
    letterSpacing: -0.035em
  headline-lg:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: 2.5rem
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.625rem
    letterSpacing: -0.011em
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
    letterSpacing: -0.006em
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
    letterSpacing: -0.006em
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.01em
  caption:
    fontFamily: Inter
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.04em
  mono-data:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: 1.25rem
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 2rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

### Personality & Positioning
The design system projects sovereign-grade authority, rigorous precision, and operational calm. Built as an intelligence-first defense surface, it rejects decorative filler, hyper-saturated gradients, and emotional hyperbole. The visual language conveys institutional trust, forensic transparency, and immediate operational utility—balancing the restrained developer ergonomics of Linear with the institutional polish of Stripe.

### Target Audience & Emotional Mandate
Engineered for fraud investigators, compliance officers, risk intelligence analysts, and citizens seeking verification. The UI evokes:
- **Quiet Confidence:** Monochromatic discipline signals rock-solid reliability.
- **Forensic Clarity:** Dense tabular data and telemetry remain effortless to parse under high-stress conditions.
- **Sovereign Trust:** Utilitarian surfaces evoke state-level security clearinghouses rather than transient consumer fintech.

### Aesthetic Principles
- **Micro-Structured Surfaces:** 1px hairline borders define modular bounding boxes without optical heaviness.
- **Maximum Signal-to-Noise Ratio:** Chromatic accents are reserved strictly for verification states and threat vectors.
- **Subtractive Elegance:** Every pixel must serve data hierarchy, navigational velocity, or cryptographic certainty.

## Colors

### Palette Architecture
The foundational color architecture relies on high-contrast, razor-sharp light-mode surfaces punctuated by deep slate-navy structural anchors and categorical threat indicators.

- **Canvas & Structural Foundations:**
  - `bg-canvas`: `#FFFFFF` — Primary application plane.
  - `bg-subtle`: `#F8FAFC` — Secondary paneling, data tables, and telemetry viewports.
  - `bg-inset`: `#F1F5F9` — Input backgrounds, track indicators, and disabled segments.
  - `border-subtle`: `#E2E8F0` — Standard 1px perimeter dividers.
  - `border-strong`: `#CBD5E1` — Active states, focused perimeters, and modular card bounds.

- **Primary Anchor (`#0F172A` - Slate 900):**
  - Serves as the primary typographic driver, key call-to-action surfaces, and high-impact structural panels. Conveys institutional gravity.

- **Status & Threat Telemetry:**
  - **Verified / Safe (`#10B981` - Emerald 500):** Reserved exclusively for verified merchant routes, authentic bank handles, validated nodal paths, and 0-risk indicators.
  - **Elevated Warning (`#F59E0B` - Amber 500):** Signals suspicious velocity, unverified routing patterns, and flagged UPI entities under review.
  - **Severe / Threat Alert (`#EF4444` - Red 500):** Denotes active scam vectors, blacklisted accounts, frozen nodes, and critical vector anomalies.

### Chromatic Rules
- Background fills for status tags must maintain subtle, low-saturation tinted backings (`rgba(16, 185, 129, 0.08)` for emerald; `rgba(239, 68, 68, 0.08)` for crimson) paired with saturated micro-borders to maintain maximum optical clarity.
- Interactive controls never use vibrant primary fills outside of confirmed security actions; the primary interface driver remains stark `#0F172A`.

## Typography

### Structural Precision
Inter is utilized across all typographic roles to maintain structural uniformity, predictable vertical metric alignment, and uncompromised legibility across complex dashboard topologies.

### Typographic Rules
- **Tabular Numerics:** Enable OpenType tabular figures (`font-variant-numeric: tabular-nums; tnum`) across all telemetry, financial transaction figures, geographic coordinates, and time stamps.
- **Negative Tracking:** Apply aggressive tracking tightening on large titles (`-0.035em` on display, `-0.025em` on headline levels) to create compact, authoritative headlines common in elite fintech software.
- **Data Density Over Scale:** Use `body-sm` (12px) and `mono-data` (13px) for forensic audit logs, entity IDs, and ledger balances, ensuring high-density layouts remain crisp without visual fatigue.
- **Micro-Labels:** Use uppercase tracking (`0.04em`) on `caption` tokens for data table column headers, metadata tags, and metric subtitles.

## Layout & Spacing

### Layout Architecture
The design system operates on an absolute 4px/8px coordinate system optimized for multi-pane analytical dashboards, threat intelligence feeds, and spatial risk topologies.

- **Grid Systems:**
  - **Analytical Cockpit (Desktop):** 12-column variable grid with a rigid 280px navigation rail and 360px contextual inspection sidebar. Main canvas scales fluidly between columns with a `gutter-lg` of 24px (`1.5rem`).
  - **Forensic Tables & Feeds:** Full-width fluid container with `gutter` of 16px (`1rem`), maximizing viewport width for uninterrupted horizontally scrollable data grids.
  - **Mobile:** 4-column fluid layout with an edge canvas margin of 16px (`1rem`). Side panels collapse into layered bottom sheets.

### Spacing Philosophy
- **Component Packaging:** Vertical and horizontal component padding (`space-xs` to `space-md`) is tightly calibrated to eliminate wasteful spatial bloat, prioritizing data display.
- **Structural Separation:** Section margins (`margin-md`, `margin-lg`) are applied purposefully between distinct functional surfaces, relying on 1px borders rather than wide empty voids to indicate scope.

## Elevation & Depth

### The Micro-Border Paradigm
Depth is defined primarily through tonal layering and 1px micro-borders rather than diffuse drop shadows. This evokes an architectural, tool-like precision.

### Layering Hierarchy
1. **Canvas Base (Level 0):** Pure `#FFFFFF` or structured `#F8FAFC`. Completely flat.
2. **Elevated Surfaces & Cards (Level 1):** `#FFFFFF` framed by a 1px border (`#E2E8F0`). Shadow is restrained to a hairline ambient occlusion:
   - `box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.05);`
3. **Interactive & Hover Panels (Level 2):** Subtle elevation gain with an enhanced border definition:
   - `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04);`
   - Border transitions to `#CBD5E1`.
4. **Modals, Flyouts & Overlays (Level 3):**
   - Backdrop: `rgba(15, 23, 42, 0.4)` with an optical blur of `backdrop-filter: blur(4px);`
   - Container: 1px border `#CBD5E1`, with shadow:
     - `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05);`

### Inset Well Architecture
Filter bars, search bars, and tabular code displays use an inset visual treatment:
- Background: `#F8FAFC`
- Internal stroke: 1px inner border (`box-shadow: inset 0 1px 2px 0 rgba(15, 23, 42, 0.04);`)

## Shapes

### Form Geometry
The shape language is strictly governed by `roundedness: 1` (0.25rem / 4px base radius). This produces an engineered, compact silhouette that prevents consumer-app softness and reinforces institutional rigor.

### Radius Scale Implementation
- **Micro Radii (`4px` / `0.25rem`):** Badges, tag chips, form fields, action buttons, table cell selections, and dropdown menu items.
- **Medium Radii (`8px` / `0.5rem`):** Modular analytical cards, map overlay panels, flyout tooltips, and data clusters.
- **Macro Radii (`12px` / `0.75rem`):** Major modal dialogues, full-screen map intelligence drawer containers.
- **Strict Prohibition:** Full pill shapes (`9999px`) are forbidden except for live telemetry indicators (pulsing operational status dots).

## Components

### Buttons
- **Primary:** Background `#0F172A`, text `#FFFFFF`, 1px border `#0F172A`. On hover, background shifts to `#1E293B`. Active: subtle downward scale (`transform: scale(0.99)`). 32px height for standard actions; 38px for primary workflow transitions.
- **Secondary:** Background `#FFFFFF`, text `#0F172A`, 1px border `#E2E8F0`. On hover, background `#F8FAFC` and border `#CBD5E1`.
- **Destructive:** Background `#FFFFFF`, text `#EF4444`, 1px border `rgba(239, 68, 68, 0.2)`. On hover, background `rgba(239, 68, 68, 0.04)`, border `#EF4444`.

### Chips & Threat Badges
- Compact height (20px–22px), font size `11px`, font weight `500`, uppercase tracking (`0.04em`).
- **Verified Entity:** Background `rgba(16, 185, 129, 0.08)`, border `1px solid rgba(16, 185, 129, 0.25)`, text `#047857`.
- **Under Investigation:** Background `rgba(245, 158, 11, 0.08)`, border `1px solid rgba(245, 158, 11, 0.25)`, text `#B45309`.
- **High-Risk Scam:** Background `rgba(239, 68, 68, 0.08)`, border `1px solid rgba(239, 68, 68, 0.25)`, text `#B91C1C`.

### Form Fields & Search Inputs
- Inset canvas `#F8FAFC` (or pure `#FFFFFF` within grey panels).
- Height: 36px. Border: 1px `#E2E8F0`. Text: 13px (`#0F172A`), placeholder `#94A3B8`.
- Focus state: Border color changes instantly to `#0F172A` with an outer ring: `box-shadow: 0 0 0 1px #0F172A;`. Zero colorful blur halos.

### Data Tables & Intelligence Lists
- Cell padding: 8px vertical, 12px horizontal.
- Headers: `#64748B`, 11px uppercase bold, bottom-bordered with 1px `#E2E8F0`.
- Rows: Bottom-bordered with 1px hairline `#F1F5F9`. Hover state initiates instantaneous background shift to `#F8FAFC`.
- Monospace styling strictly applied to phone identifiers, IFSC routing codes, UPI VPA handles, and cryptocurrency hash segments.

### Checkboxes & Radios
- Size: 14px x 14px. Border: 1px `#CBD5E1`. Radius: 3px (checkbox) / circular (radio).
- Checked state: `#0F172A` fill with high-contrast white check vector.

### Threat Cards
- Flat `#FFFFFF` container with a 1px `#E2E8F0` border.
- Split layout: Header containing the entity identifier, timestamp, and categorical risk chip; body containing forensic trail data; footer containing quick verification actions.
- No heavy divider lines: structural separation achieved strictly with `#F8FAFC` contrasting header/footer sub-panels.