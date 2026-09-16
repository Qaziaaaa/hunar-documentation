---
name: Pakistani Trades & Services
colors:
  primary: '#0F766E'
  primary-dark: '#115E59'
  navy: '#1A1A2E'
  gray: '#64748B'
  background: '#F8FAFC'
  surface: '#FFFFFF'
  border: '#E2E8F0'
  orange: '#F59E0B'
  success: '#16A34A'
  error: '#DC2626'
  on-primary: '#FFFFFF'
  on-surface: '#1A1A2E'
  on-background: '#1A1A2E'
typography:
  display-kpi:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  display-kpi-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-page:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-page-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-section:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-subsection:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-default:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-compact:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-strong:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: 0em
  label-regular:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-badge:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-xxs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4rem
  gutter-mobile: 1rem
  gutter-desktop: 1.5rem
  margin-mobile: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
---

## Brand & Style

This design system establishes a high-trust, functional, and authoritative digital standard for home services and skilled vocational trades across Pakistan. It balances structural clarity with executive restraint, steering strictly away from ornamental startup cliches, pastel washes, or generic gig-economy styling.

The visual direction follows **Corporate / Modern Precision**:
- **Dignified Professionalism:** High-contrast, deeply grounded tones signal accountability, security, and verification (NADRA CNIC verification, trade certifications, structured guarantees).
- **Tactile Utility:** Information architecture prioritizes transparent pricing (PKR), verified technician profiles, service tiering, and instantaneous transaction tracking (JazzCash, Easypaisa, Raast, direct bank transfers).
- **Geographic Nuance:** Purpose-built for urban density and regional hubs—spanning DHA, Gulberg, and Bahria Town in Lahore to F-6/F-7 in Islamabad, Clifton/DHA in Karachi, and University Town in Peshawar.
- **Visual Discipline:** Razor-sharp typography hierarchy, structured hairline partitions, and deliberate negative space eliminate friction for both high-end homeowners and professional trade contractors.

## Colors

The color architecture is built around clear visual authority, functional cues, and localized trust mechanisms:

- **Primary Brand Navy (`#1A1A2E`):** The foundational anchor. Used for primary typography, authoritative brand headers, executive metric titles, dark service summary drawers, and structural anchor elements.
- **Primary Accent Teal (`#0F766E`):** Action-oriented interactive color. Reserved strictly for primary action buttons, key quantitative metrics, verified badges, active navigation states, and confirmed links. 
  - *Hover State:* Deep Teal (`#115E59`). Never wash backgrounds in diluted cyan or pale teal tints.
- **Secondary Accent Amber (`#F59E0B`):** Utility attention color. Reserved for service review ratings, ongoing/pending trade bookings, escrow payment states, and critical trade alert pills.
- **Neutral Core:**
  - **Marketplace Background:** `#F8FAFC` provides a grounded canvas that prevents optical eye fatigue.
  - **Card / Primary Surface:** `#FFFFFF` creates crisp visual isolation from the background.
  - **Subtle Offset Surface:** `#F8FAFC` for nested rows, calculation matrices, and sub-panels.
  - **Dark Promotional Surface:** `#1A1A2E` for high-tier master craftsman spotlights and enterprise guarantees.
  - **Structural Borders:** Hairline `#E2E8F0` keeps tables and cards cleanly delineated.
  - **Secondary & Muted Copy:** `#64748B` delivers WCAG AAA contrast compliance against light cards for metadata, sub-labels, and timestamps.
- **Semantic Feedback:**
  - **Success / Completed:** `#16A34A` (Verified CNIC, job complete, payment released).
  - **Error / Dispute:** `#DC2626` (Disputed invoice, cancelled visit, unverified credential).
  - **Warning / Action Pending:** `#F59E0B` (Technician en route, estimate review pending).

## Typography

The typography system uses **Inter** across all structural tiers to maintain surgical precision, cross-platform performance, and legibility when displaying dense tabular data, job logs, and Urdu-transliterated names.

- **Numerics & Monospace Conventions:** Numerical metrics (PKR costs, job IDs, CNIC digits, phone numbers) must strictly utilize tabular figures (`font-feature-settings: "tnum" 1`) to preserve tabular vertical alignment across payment logs and quotes.
- **Capitalization Discipline:** Sentence case is mandatory across headings, CTA buttons, and form labels. Badges and micro-status tags use concise uppercase or title case to prevent optical clutter.
- **Hierarchy Stacking:** Pair `headline-page` with adjacent `label-badge` indicators (e.g., "Verified Electrician • DHA Phase 5") to immediately clarify scope and trust factors.

## Layout & Spacing

Layouts follow a strict, disciplined grid model that allows rapid scannability across high-density directory listings, scheduling panels, and quote estimation engines:

- **Grid Structure:**
  - **Desktop (≥1024px):** 12-column layout with fixed `24px` (`1.5rem`) gutters and a max content boundary of `1280px`. Cards span cleanly across 3, 4, 6, or 12 column tracks.
  - **Tablet (768px – 1023px):** 8-column layout with `20px` gutters and `24px` exterior safe margins.
  - **Mobile (≤767px):** 4-column fluid layout with `16px` gutters and `16px` margins. Interactive elements adapt to full-width card stacks or edge-to-edge list groupings.
- **Rhythm & Padding:**
  - Standard card interior padding is locked to `24px` (`space-lg`) on desktop and `16px` (`space-md`) on mobile.
  - Dense tabular data surfaces and ledger rows utilize `12px` (`space-sm`) vertical padding to maximize information density without sacrificing finger-target accessibility.

## Elevation & Depth

This design system rejects heavy blurs, dramatic drop shadows, and neon lighting in favor of **Structural Hairline Layering**:

- **Low-Contrast Outlines:** The foundation of depth relies on crisp 1px borders (`#E2E8F0`) defining `#FFFFFF` surfaces against the `#F8FAFC` marketplace background.
- **Minimal Ambient Depth:** Where elevation is necessary for layering floating elements (e.g., sticky quote drawers, technician location dropdowns, date pickers), use an understated, tinted micro-shadow:
  - `box-shadow: 0 1px 3px 0 rgba(26, 26, 46, 0.05), 0 1px 2px -1px rgba(26, 26, 46, 0.05);`
  - Floating action modals use: `box-shadow: 0 4px 6px -1px rgba(26, 26, 46, 0.08), 0 2px 4px -2px rgba(26, 26, 46, 0.04);`
- **Surface Elevation via Tone:**
  - Level 0 (Base Canvas): `#F8FAFC`
  - Level 1 (Card & Section Surfaces): `#FFFFFF` with 1px border `#E2E8F0`
  - Level 2 (Nested Tables / Inputs / Calculations): `#F8FAFC` with 1px border `#E2E8F0`
  - Level 3 (Premium / Master Artisan Tiers): Solid `#1A1A2E` or `#1A1A2E` dark container with high-contrast white text and teal secondary accents.

## Shapes

The geometric framework emphasizes architectural stability, efficiency, and clarity:

- **Radius Standards:** 
  - Standard Cards, Panels, and Modals: `8px` (`0.5rem`).
  - Inputs, Buttons, Dropdowns, and Selectors: `6px` (`0.375rem`) to maintain sharp utility form factors.
  - Status Pills & Verification Tags: `4px` (`0.25rem`) for compact tags, or fully curved badges (`9999px`) strictly when used as discrete numeric counters.
- **Hairline Precision:** All structural divisions maintain 1px solid line-weights (`#E2E8F0`). Under no circumstances should rounded corners exceed `8px` for general layout components, maintaining a crisp, dependable posture.

## Components

### Buttons
- **Primary Action Button:** Background `#0F766E`, text `#FFFFFF`, border none, border-radius `6px`, font weight 600 (`14px`), padding `10px 18px`. Hover: `#115E59`. Active: `#115E59`. Focus: 2px ring offset with `#0F766E`.
- **Secondary Neutral Button:** Background `#FFFFFF`, text `#1A1A2E`, 1px border `#E2E8F0`, border-radius `6px`. Hover: Background `#F8FAFC`, border `#E2E8F0`.
- **Destructive Button:** Background `#FFFFFF`, text `#DC2626`, 1px border `#DC262630`. Hover: Background `#DC262615`.
- **Dark Brand CTA:** Background `#1A1A2E`, text `#FFFFFF`. Hover: Background `#1A1A2E`.

### Input Fields & Selects
- **Base Style:** Background `#FFFFFF`, height `42px`, 1px border `#E2E8F0`, border-radius `6px`, text `#1A1A2E`, typography `14px Inter`. Placeholder text in `#64748B`.
- **Focus State:** 1px border `#0F766E` with subtle outline ring `rgba(15, 118, 110, 0.15)`.
- **Input Groups:** Currency prefix ("PKR") locked inside a dedicated left-sided `#F8FAFC` container with right hairline border.

### Cards & Service Tiles
- **Standard Card:** Background `#FFFFFF`, border-radius `8px`, 1px border `#E2E8F0`, padding `20px` to `24px`. Zero ambient blur by default.
- **Verified Contractor Card:** Includes top-right identity metadata: NADRA CNIC Verified checkmark, localized district pill (e.g., "F-7 Islamabad", "Gulberg III, LHE"), and clear star rating block using `#F59E0B`.

### Badges & Status Indicators
- **Verified / Success Badge:** Background `#16A34A15`, text `#16A34A`, 1px border `#16A34A15`, radius `4px`, font weight 600 (`11px Inter`).
- **Pending / In-Progress Badge:** Background `#F59E0B15`, text `#F59E0B`, 1px border `#F59E0B30`, radius `4px`.
- **Disputed / Cancelled Badge:** Background `#DC262615`, text `#DC2626`, 1px border `#DC262630`, radius `4px`.
- **Area / Locality Tag:** Background `#F8FAFC`, text `#64748B`, radius `4px`, padding `2px 6px`.

### Lists & Data Tables
- **Table Structure:** Headers with `#F8FAFC` background, uppercase `11px Inter` (`#64748B`), 1px bottom border `#E2E8F0`.
- **Row Styling:** Row background `#FFFFFF`, alternating hover state `#F8FAFC`, cell padding `12px 16px`, standard text `13px Inter` (`#1A1A2E`).

### Checkboxes & Radios
- Checkbox container: `18px x 18px`, 1px border `#E2E8F0`, radius `4px`. When selected: Background `#0F766E`, icon white.
- Radio container: `18px x 18px`, fully circular, checked indicator uses `#0F766E` solid center dot.

### Specialized Marketplace Modules
- **Payment Split Bar (Escrow System):** Clear breakdown component for booking deposits, platform guarantee reserves, and technician payouts indicating JazzCash, Easypaisa, or direct IBAN channels with dedicated status ticks.
- **Service Scope Checklist:** Standardized verification item list with check/cross markers showing included materials vs. consumer-supplied hardware (e.g., copper piping for AC installation, DB breakers for electrical repair).

# HUNAR Design System Specifications (colors.md Compliant)

## Color Palette

| Color Token | Hex Code | Semantic Role & Usage |
| :--- | :--- | :--- |
| **Navy** | `#1A1A2E` | Brand identity, main logo, page titles, section headings, prices, primary text |
| **Teal** | `#0F766E` | Primary call-to-actions, Post Job, Accept Offer, Pay, Approve, Verified badges |
| **Teal Dark** | `#115E59` | Interactive button hover states, active states |
| **Orange** | `#F59E0B` | Attention, pending status, quotes/offers waiting, ratings & stars, warnings |
| **Success** | `#16A34A` | Completed jobs, verified badges, online indicators, successful transactions |
| **Error** | `#DC2626` | Cancelled jobs, rejected disputes, failed payments, destructive delete actions |
| **Gray** | `#64748B` | Secondary descriptions, timestamps, metadata labels, inactive icons |
| **Background** | `#F8FAFC` | Global page background, subtle table hover states |
| **White** | `#FFFFFF` | Cards, modals, sidebars, navigation bars, dropdowns |
| **Border** | `#E2E8F0` | Structural dividers, card borders, form input borders |

## Typography Rules
- **Font Family**: Inter, sans-serif
- **Primary Text**: `#1A1A2E`
- **Secondary Text**: `#64748B`
