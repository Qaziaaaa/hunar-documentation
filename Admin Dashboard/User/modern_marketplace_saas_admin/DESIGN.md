---
name: Modern Marketplace SaaS Admin
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
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
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
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  mono-num:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  gutter-desktop: 1.5rem
  gutter-mobile: 1rem
  margin-desktop: 2rem
  margin-mobile: 1rem
  sidebar-width: 16rem
  sidebar-collapsed-width: 4.5rem
---

## Brand & Style

This design system embodies an enterprise-grade, high-velocity administration environment for modern digital marketplaces. The visual philosophy couples razor-sharp utility with refined editorial restraint, minimizing cognitive overhead for platform operators managing massive data sets, catalog workflows, and transactional disputes.

### Visual Movement: Modern Flat & Systematic Utility
The system rejects heavy decorative shadows, high-gloss gradients, and novelty micro-interactions in favor of architectural clarity, structural precision, and hairline divisions. Information hierarchy is governed through strict typographic cadence, intentional contrast, and spatial density. The emotional tone is authoritative, highly organized, and reliable, instilling operational confidence during high-stakes marketplace actions.

## Colors

The color palette is built on strict data hierarchy and intentional contrast:

- **Primary (`#0F766E`)**: Anchors focal interactive workflows, batch status confirmations, primary action buttons, and active tabular filtering states.
- **Teal Dark (`#115E59`)**: Applied exclusively to focused interactions, pressed button states, and deep interactive emphasis.
- **Navy Headings (`#1A1A2E`)**: Delivers structural authority across viewports, reserved for titles, card headers, and table category partitions.
- **Canvas (`#F8FAFC`) & Surface (`#FFFFFF`)**: Establishes a pure, clinical base for complex dashboards and multi-column ledger tables.
- **Hairline Border (`#E2E8F0`)**: Provides structural geometry across elements without visual weight.
- **Text Primary (`#1A1A2E`) & Secondary (`#64748B`)**: Ensures WCAG AAA compliance for transactional details and metadata captions.
- **Semantic Feedback**: `#16A34A` (Verified, Active, Resolved), `#F59E0B` (Pending Review, Escrow Hold, Throttled), and `#DC2626` (Banned, Fraudulent, Failed Settlement).

## Typography

Inter serves as the foundational typeface across all typographic roles to ensure optimal tabular tracking, neutral legibility, and unified density:

- **Headings**: Rendered in Navy (`#1A1A2E`) with semi-bold weights and tight negative tracking (`-0.015em` to `-0.02em`) to eliminate visual bloat in information-dense dashboards.
- **Numeric & Metric Roles**: Utilize tabular numbers (`font-feature-settings: 'tnum' 1`) for transaction values, balances, ledger alignments, and inventory counts.
- **Labels & Micro-data**: Overline labels and table headers utilize uppercase tracking (`letter-spacing: 0.04em`) with medium-to-semibold weights for rapid visual scanning across dense rows.

## Layout & Spacing

The layout model implements an asymmetric fixed-fluid layout designed for rigorous multi-window enterprise workstations:

- **System Structure**: A persistent left-hand administrative navigation bar (`16rem` expanded, `4.5rem` icon-only collapsed) alongside a fluid multi-column content area spanning up to `1600px` before auto-centering on ultra-wide screens.
- **Grid Mechanics**: 
  - **Desktop (1280px+)**: 12-column responsive grid with `1.5rem` gutters and `2rem` screen edge margins.
  - **Tablet (768px - 1279px)**: 8-column layout with `1rem` gutters; navigation collapses into an overlay drawer.
  - **Mobile (<768px)**: 4-column layout with `1rem` margins and condensed card stacks replacing extensive data tables.
- **Spacing Cadence**: Driven by a base 4px/8px modular rhythm (`space-xs` through `space-2xl`) maintaining vertical rhythm without excessive empty space.

## Elevation & Depth

This design system avoids multi-tier drop shadows, diffuse glows, and pseudo-skeuomorphic overlays. Depth is communicated strictly through surface layering and hairline borders:

- **Ground Level (Canvas)**: Background canvas sits at `#F8FAFC`.
- **Level 1 (Data Surfaces & Panels)**: Tables, card sections, drawers, and headers use crisp `#FFFFFF` bounded by a 1px solid hairline border (`#E2E8F0`).
- **Level 2 (Popovers, Dropdowns, Tooltips)**: Contextual floating panels feature `#FFFFFF` with a single 1px hairline border (`#E2E8F0`) augmented by an ambient micro-shadow: `0 4px 12px rgba(15, 23, 42, 0.06)`.
- **Level 3 (Modal Modifiers & Danger Sheets)**: Centered action dialogs utilize a backdrop overlay of `#1A1A2E` at 40% opacity with zero blur, enforcing focus on critical transactional decisions.

## Shapes

The geometric framework follows a restrained "Soft" aesthetic (`roundedness: 1`), balancing compact utility with modern ergonomics:

- **Base Radius (0.25rem / 4px)**: Applied to input controls, badges, chips, table cell selectors, checkboxes, and buttons.
- **Medium Radius (0.5rem / 8px)**: Applied to modular cards, table wrappers, panels, popover menus, and alert banners.
- **Large Radius (0.75rem / 12px)**: Reserved exclusively for system dialogs, modal frames, and floating drawers.
- **Circular (9999px)**: Restricted entirely to status dot indicators, user presence avatars, and count badges.

## Components

### Buttons
- **Primary**: Background `#0F766E`, text `#FFFFFF`, border none, 4px border radius. Hover: `#115E59`. Active: `#115E59`. Focus ring: 2px offset with `#0F766E`.
- **Secondary / Outline**: Background `#FFFFFF`, text `#1A1A2E`, 1px border `#E2E8F0`. Hover: `#F8FAFC` and border `#E2E8F0`.
- **Destructive**: Background `#DC2626`, text `#FFFFFF`. Hover: `#DC2626`.
- **Ghost**: Background transparent, text `#64748B`. Hover: `#F8FAFC`, text `#1A1A2E`.

### Badges & Status Chips
- Pill or 4px soft corners, padding `2px 8px`, typography `label-sm`.
- **Success**: Background `#16A34A15`, text `#16A34A`.
- **Warning**: Background `#F59E0B15`, text `#F59E0B`.
- **Error / Suspended**: Background `#DC262615`, text `#DC2626`.
- **Neutral / Draft**: Background `#F8FAFC`, text `#64748B`.

### Input Fields & Controls
- Height: 36px (compact) to 40px (default). Background `#FFFFFF`, 1px border `#E2E8F0`, typography `body-md`.
- Active focus state: 1px border `#0F766E` accompanied by an immediate outline ring: `0 0 0 1px #0F766E`.
- Checkboxes and Radio buttons: 16px footprint, 1px border `#E2E8F0`. Checked state: `#0F766E` fill with sharp white glyph.

### Cards & Panels
- Background `#FFFFFF`, 1px border `#E2E8F0`, 8px corner radius.
- Padding options: dense (`1rem`), standard (`1.5rem`). No elevation shadows; separated strictly by border delineation against the `#F8FAFC` canvas.

### Data Tables (Core Marketplace Component)
- Table header row: background `#F8FAFC`, bottom border 1px `#E2E8F0`, text `#64748B`, uppercase 11px semi-bold tracking.
- Row items: background `#FFFFFF`, bottom border 1px `#E2E8F0`, height 48px, text `#1A1A2E`.
- Row hover: `#F8FAFC` transition (100ms ease-out). Numeric cells align right with `mono-num` styling.

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
