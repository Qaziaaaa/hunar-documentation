---
name: Precision Marketplace
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
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.005em
  data-mono-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.02em
  data-mono-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.01em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-base: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4rem
  gutter-mobile: 1rem
  gutter-desktop: 1.5rem
  margin-mobile: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.5rem
---

## Brand & Style

This design system establishes an institutional, high-trust environment tailored for the skilled-worker economy. It bridges the gap between field-level manual mastery and enterprise procurement governance. The visual language rejects decorative clutter, ornamental shadows, and transient digital trends in favor of **Clean Architectural Minimalism**: a rigorous, data-dense, grid-bound aesthetic reminiscent of structural schematics, financial ledgers, and institutional terminal software.

### Brand Personality & Philosophy
- **Authoritative & Verified:** Interactions convey stability, contractual transparency, and legal finality.
- **Architectural Clarity:** Layouts treat space as functional scaffolding—surfaces align with mathematical discipline, hairline dividers separate operational domains, and every datum earns its place.
- **Dignified Utility:** Both enterprise hirers and independent skilled operators interact with tools designed for speed, legible audits, and uncompromised financial visibility.

### Design Principles
1. **Hairline Precision:** Spatial boundaries rely on disciplined 1px borders rather than heavy drop-shadows or elevation tiers.
2. **Scannable Ledger Density:** Numeric values, rates, ledger entries, and state transitions are formatted for immediate parsing using tabular alignment and robust contrast.
3. **Restrained Signpost Accents:** Color operates as an operational indicator—primary teal denotes affirmative execution and state commitment, amber highlights pending verification, and muted slate supports peripheral metadata.

## Colors

The palette is engineered for prolonged viewing, high-contrast operational scanning, and high-stakes financial validation. It anchors on deep architectural teal, supported by dark cyan-teal interactive states, crisp slate-tinted whites, and a high-density midnight navy foundation for copy and figures.

### Core Roles
- **Primary (`#0F766E`):** The operational driver. Used for primary call-to-actions, finalized transaction status tags, verified skill insignias, and selected tab states.
- **Primary Dark (`#115E59`):** Interactive depth layer. Used for pressed/hover button states, dense active table header fills, and focused navigation anchors.
- **Tertiary / Warning (`#F59E0B`):** Actionable attention. Designates escrow holding phases, milestone approvals pending review, and temporary skill certificate holds.
- **Neutral Foreground (`#1A1A2E`):** High-density ink. Used for all primary numbers, financial figures, headings, and data labels to provide crisp legibility against bright backgrounds.

### Structural & Semantic Assignments
- **App Background (`#F8FAFC`):** A clinical slate canvas providing soft separation behind bright surfaces without visual fatigue.
- **Surface Canvas (`#FFFFFF`):** High-clarity cards, data grid containers, modal sheets, and side panels.
- **Border / Hairline (`#E2E8F0`):** Single-pixel perimeter rules, cell separators, nested breakdown boundaries, and input borders.
- **Secondary Slate (`#64748B`):** Secondary audit details, timestamps, breakdown sub-labels, unit counts, and inactive iconography.
- **Semantic Success (`#16A34A`):** Settled escrow payouts, contract completion banners, and verified worker certifications.
- **Semantic Error (`#DC2626`):** Dispute filings, depleted escrow accounts, rejected milestones, and input validation failures.

## Typography

Typography relies uniformly on **Inter** to maintain systematic legibility across complex multi-column layouts and compact viewport environments.

### Numerical & Tabular Data Formatting
All numeric entries—including billing ledgers, hourly wage quotes, tax breakdowns, milestone counts, and audit logs—must enforce OpenType tabular figures (`font-variant-numeric: tabular-nums;` or `font-feature-settings: "tnum" 1`). This guarantees strict vertical column alignment across nested invoice rows and data tables.

### Hierarchy & Application Rules
- **Display & Headline Levels:** Tightly tracked with negative letter spacing (`-0.025em` to `-0.01em`) to create dense, authoritative titles that align crisply with perimeter grid borders.
- **Labels (`label-sm`):** Typically transformed to uppercase (`text-transform: uppercase`) when applied to table column headers, audit metadata descriptors, and escrow balance sub-headers to establish structural anchors.
- **Body & Data Text:** Configured with balanced line heights to prevent accidental misreading of critical service agreements, job scopes, and fee breakdowns.

## Layout & Spacing

The layout is built on a 12-column responsive fluid grid rooted in a strict 4px/8px incremental spacing rhythm. Content is organized around compact, modular modules that prevent visual sprawl while maintaining clear scan paths.

### Breakpoints & Grid Scaffolding
- **Desktop (≥ 1280px):** 12-column grid, max container width 1440px, 24px (`space-lg`) gutters, 40px (`margin-desktop`) margins. Side navigation and audit context panels remain pinned.
- **Tablet (768px – 1279px):** 8-column grid, 16px (`space-base`) gutters, 24px (`margin-tablet`) margins. Right-hand financial breakdowns collapse into tabbed segments or stacked modules.
- **Mobile (< 768px):** 4-column fluid grid, 16px gutters, 16px (`margin-mobile`) margins. Tables reflow into structured card units with horizontal detail splits.

### Density Tiers
- **Table Cells & Ledger Rows:** Fixed vertical heights of 40px (compact) or 48px (standard), padded with `space-md` horizontally, maximizing visible rows per display.
- **Payment Breakdown Modules:** Spaced with tight internal gaps (`space-sm` to `space-base`) to reinforce the relationship between subtotal items, deductions, taxes, and net disbursements.

## Elevation & Depth

Visual hierarchy does not rely on soft, atmospheric drop shadows. In this system, depth is established exclusively through **tonal layering** and **hairline perimeter boundaries**.

### The Layering Ladder
1. **Base Layer (`#F8FAFC`):** Application canvas underpinning dashboard screens, settings views, and directory feeds.
2. **Surface Layer (`#FFFFFF`):** Work surfaces, ledger grids, profile summaries, and action panels. Always delimited by a 1px solid `#E2E8F0` border.
3. **Inset / Recessed Layer (`#F8FAFC`):** Used inside breakdown cards to denote escrow holding bins, uneditable system fields, and calculated fee deductions.
4. **Overlay Modals & Drawers (`#FFFFFF` with `#1A1A2E` 20% scrim):** Used for dispute arbitration forms, credential inspection sheets, and wire transfer authorizations. These elements use a crisp, directional structural edge:
   - `box-shadow: 0 4px 6px -1px rgba(26, 26, 46, 0.05), 0 10px 15px -3px rgba(26, 26, 46, 0.07);`
   - Bound by a solid 1px `#E2E8F0` hairline border to prevent blur bleeds.

## Shapes

The interface embraces a low-radius, architectural geometry. Surfaces, inputs, chips, and modals use subtle corner rounding that feels constructed rather than playful, reflecting industrial accuracy and reliability.

### Radius Assignments
- **Base Components (`rounded` = 0.25rem / 4px):** Applied to form input fields, selection chips, table action buttons, badge containers, and verification stamps.
- **Container Elements (`rounded-lg` = 0.5rem / 8px):** Applied to main payment breakdown cards, audit feed wrappers, invoice frames, and system modal sheets.
- **Full Radius (`rounded-full`):** Reserved strictly for identity avatars, compact status presence pips, and circular step numbers.

## Components

### Buttons
- **Primary:** Filled with `#0F766E`, text `#FFFFFF` (`label-md`), 4px corner radius, standard height 36px (compact) or 40px (standard). Hover state transitions cleanly to `#115E59`. Zero outer shadow. Focus state shows a 2px `#0F766E` offset ring.
- **Secondary / Outline:** Background `#FFFFFF`, 1px solid border `#E2E8F0`, text `#1A1A2E`. Hover changes border to `#64748B` and surface to `#F8FAFC`.
- **Destructive:** Borderless or faint red outline, text `#DC2626`. On hover, background shifts to `#DC262615`.

### Status Badges & Skill Chips
- **Structural Tags:** Height 24px, 4px border radius, uppercase `label-sm`.
- **Verified Worker:** Light teal tint (`#0F766E15`) background, `#0F766E` text, and a crisp hairline `#0F766E15` border.
- **In Escrow / Pending:** Light amber tint (`#F59E0B15`) background, `#F59E0B` text, and a hairline `#F59E0B30` border.
- **Audit / Inactive:** Background `#F8FAFC`, `#64748B` text, `#E2E8F0` border.

### Scannable Financial Tables
- **Header:** Height 36px, background `#F8FAFC`, uppercase `label-sm` text in `#64748B`, bottom 1px border `#E2E8F0`.
- **Data Rows:** Height 44px, alternating backgrounds disallowed (pure `#FFFFFF` surfaces only), separated by 1px `#E2E8F0` horizontal hairline dividers. On row hover, subtle shift to `#F8FAFC`.
- **Alignment Rules:** Text aligns left, dates/status align center, financial metrics and balance amounts strictly right-align with tabular numerals.

### Payment Breakdown Cards
- **Architecture:** Bounded by 1px solid `#E2E8F0`, surface `#FFFFFF`, 8px corner radius.
- **Header Section:** Displays counterparty info and Milestone ID with a discreet `#F8FAFC` hairline divider below.
- **Ledger Lines:** Label in `#64748B` (`body-md`), numeric balance in `#1A1A2E` (`data-mono-md`). Hairline-indented fee deductions use `#DC2626` text with prepended minus signs.
- **Total Net Bar:** Encased in an inset container (`#F8FAFC`), separating the net payout with bold `data-mono-lg` typography in `#0F766E`.

### Audit Trails
- **Scaffold:** A continuous 1px vertical spine (`#E2E8F0`) with 8px circular nodes marking lifecycle milestones (Offer Created, Escrow Funded, Service Checked, Funds Released).
- **Node Semantics:** Settled nodes filled with `#0F766E`; pending steps outlined in `#F59E0B` on `#FFFFFF`; future steps muted in `#E2E8F0`.
- **Entry Structure:** Horizontal lockup: timestamp (`body-sm`, `#64748B`), initiator identity (`label-md`, `#1A1A2E`), and cryptographic transaction/action reference in tabular mono.

### Form Inputs & Checkboxes
- **Input Fields:** Height 40px, surface `#FFFFFF`, 1px solid border `#E2E8F0`, 4px radius. Focused state applies a 1px border `#0F766E` with an immediate 2px `#0F766E`/10% glow ring. Floating error notes render in `#DC2626` (`body-sm`).
- **Checkboxes & Radios:** 16x16px boxes, 2px radius (checkbox) or circular (radio), border `#64748B`. When checked: fill `#0F766E` with sharp white tick icon.

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
