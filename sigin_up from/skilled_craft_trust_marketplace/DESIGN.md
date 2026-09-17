---
name: Skilled Craft & Trust Marketplace
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
    fontFamily: plusJakartaSans
    fontSize: 3.5rem
    fontWeight: '800'
    lineHeight: '1.15'
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: plusJakartaSans
    fontSize: 2.25rem
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.025em
  headline-xl:
    fontFamily: plusJakartaSans
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: '1.25'
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: plusJakartaSans
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: plusJakartaSans
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.015em
  headline-md:
    fontFamily: plusJakartaSans
    fontSize: 1.375rem
    fontWeight: '600'
    lineHeight: '1.35'
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: plusJakartaSans
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.005em
  body-lg:
    fontFamily: inter
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: -0.005em
  body-md:
    fontFamily: inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: '1.55'
    letterSpacing: 0em
  body-sm:
    fontFamily: inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0.005em
  label-lg:
    fontFamily: plusJakartaSans
    fontSize: 1rem
    fontWeight: '600'
    lineHeight: '1.25'
    letterSpacing: 0.01em
  label-md:
    fontFamily: plusJakartaSans
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: '1.25'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: plusJakartaSans
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4.5rem
  gutter-mobile: 1rem
  gutter-desktop: 1.5rem
  container-max: 80rem
---

## Brand & Style

This design system establishes a high-trust, service-driven marketplace connecting skilled trades and professionals with clients. The aesthetic communicates reliability, technical competence, and seamless accessibility. The visual balance pairs an authoritative, institutional depth with an inviting, modern interaction layer.

The visual direction follows a **Modern Professional & Tactile Trust** style:
- Crisp white surfaces floating above a tinted, soft slate canvas to ensure visual breathing room and distinct structural grouping.
- High-contrast typography that conveys institutional stability alongside energetic interactive accents.
- Soft, generous curves (`rounded-xl` and `rounded-2xl`) combined with micro-diffused ambient elevations to feel welcoming and approachable rather than bureaucratic or cold.
- Structured card-based modularity designed for fast scanning of profiles, service tiers, verified credentials, and real-time transaction states.

## Colors

The palette employs distinct functional roles to ensure instant visual clarity across complex workflows, verification states, and booking flows.

### Core Roles
- **Primary Trust & Identity (`#1A1A2E`):** Deep navy reserved for branding elements, top-level navigation identity, high-order headings, structural dividers, and verified institutional markers.
- **Primary Action & Interactive (`#0F766E`):** Deep marine teal utilized exclusively for calls-to-action (CTAs), primary flow triggers, active tab states, selection controls, interactive pills, and verified provider badges.
- **Attention & Highlight (`#F59E0B`):** Warm amber applied deliberately to review ratings, active milestones, pending alerts, discount/offer banners, and promotional indicators.
- **Neutral Core (`#64748B`):** Slate gray dedicated to subheadings, meta descriptions, icons, inactive indicators, and input placeholder values.

### Surface & Typography Mapping
- **Canvas Base:** `#F8FAFC` (Soft slate background)
- **Container / Surface:** `#FFFFFF` (Pure white cards, elevated modals, sticky headers, popovers)
- **Text Primary:** `#1A1A2E` (Deep slate for body text, table data, and form labels, delivering WCAG AAA compliance against white surfaces)
- **Text Secondary / Subdued:** `#64748B`

### Status & Feedback Tokens
- **Success:** `#16A34A` (Bookings completed, ID verified, professional online)
- **Success Surface:** `#16A34A15` (Subtle tinted success backgrounds)
- **Danger / Error:** `#DC2626` (Cancellations, validation errors, expired services)
- **Danger Surface:** `#DC262615` (Soft error container backgrounds)
- **Warning Surface:** `#F59E0B15` (Pending escrow, awaiting response alerts)

## Typography

Typography establishes an intentional cadence between branded authority and dense operational utility. 

- **Display & Headings (Plus Jakarta Sans):** Brings a geometric yet friendly modernism. Display sizes demand tight line-heights and negative letter spacing to preserve punchiness.
- **Body & Data Content (Inter):** Maximizes reading efficiency across multi-column service specs, reviews, transactional invoices, and real-time chat.
- **Labels & Interactive Elements (Plus Jakarta Sans):** Selected for high legibility at micro sizes on buttons, badge chips, and form section tags.
- **Responsive Handling:** Desktop headings scale down smoothly on mobile breakpoints using the specified `-mobile` alternates to eliminate awkward line breaks in narrow viewports.

## Layout & Spacing

The layout is built on a responsive 12-column grid adhering to a strict 8pt rhythm (with 4pt sub-steps for micro-components).

### Grid Structure
- **Desktop (≥ 1024px):** 12-column fluid grid, max width `80rem` (1280px), centered with `1.5rem` minimum page gutter. Column gutters are fixed at `1.5rem`.
- **Tablet (768px – 1023px):** 8-column fluid grid with `1.25rem` gutters and margins.
- **Mobile (< 768px):** 4-column fluid grid with `1rem` gutters and outer margins.

### Spacing Philosophy
- **Component Interiors:** Internal padding scales from `space-md` (`1rem`) on compact cards to `space-xl` (`2rem`) on full-service overviews.
- **Section Rhythm:** Sections on index pages breathe with `space-3xl` (`4.5rem`) desktop margins to prevent cognitive overload.

## Elevation & Depth

This system avoids harsh drop shadows and heavy outlines. Elevation is rendered using dual-step ambient diffusion tinted with `#1A1A2E`, imparting natural dimensional warmth.

### Elevation Hierarchy
- **Level 0 (Flat Ground):** `#F8FAFC` base canvas.
- **Level 1 (Default Surface / Rest State):** Pure `#FFFFFF` with a thin hairline border (`border: 1px solid #E2E8F0`) and subtle ambient shadow:
  `box-shadow: 0 1px 3px 0 rgba(18, 59, 93, 0.04), 0 1px 2px -1px rgba(18, 59, 93, 0.03)`.
- **Level 2 (Interactive Hover & Sticky Elements):** Used when service cards are hovered or filters stick during scroll:
  `box-shadow: 0 10px 15px -3px rgba(18, 59, 93, 0.07), 0 4px 6px -4px rgba(18, 59, 93, 0.04)`.
- **Level 3 (Floating Overlays & Modals):** Used for booking appointment sheets, professional verification modals, and global navigation dropdowns:
  `box-shadow: 0 20px 25px -5px rgba(18, 59, 93, 0.1), 0 8px 10px -6px rgba(18, 59, 93, 0.05)`.

## Shapes

The geometric identity balances modern softness with structured professionalism.

- **Primary Cards & Modals:** Standardized on `rounded-2xl` (`1rem` / 16px) to frame content blocks in a smooth, approachable perimeter.
- **Buttons, Inputs & Selection Controls:** Standardized on `rounded-xl` (`0.75rem` / 12px) to provide ample touch target comfort and contemporary appeal.
- **Pills, Verified Badges & Status Tags:** Fully rounded pill geometry (`rounded-full`) to delineate them from interactive rectangular buttons and structural containers.

## Components

### Buttons
- **Primary CTA:** Background `#0F766E`, text `#FFFFFF`, font `label-md`. Height 44px (default) or 52px (large booking flows). Border radius `0.75rem`. Hover state transitions to `#115E59` with a subtle elevation shift. Focus ring: 3px offset with `#0F766E` at 30% opacity.
- **Secondary (Authority/Identity):** Background `#1A1A2E`, text `#FFFFFF`. Used for "Post a Job" or high-priority profile actions. Hover transitions to `#1A1A2E`.
- **Outline / Ghost:** Pure white background, `1px solid #E2E8F0`, text `#1A1A2E`. Hover brings `#F8FAFC` background and `#0F766E` border.

### Input Fields & Forms
- **Field Container:** Background `#FFFFFF`, border `1px solid #E2E8F0`, border-radius `0.75rem`, text `#1A1A2E`. Height 48px with `1rem` horizontal padding.
- **Placeholder:** `#64748B`.
- **Focus State:** Border changes to `#0F766E` with a matching `0 0 0 3px rgba(15, 139, 141, 0.15)` glow.
- **Error State:** Border shifts to `#DC2626` with an accompanying warning label in `label-sm`.

### Cards & Service Tiles
- Pure `#FFFFFF` surface enclosed by `1px solid #E2E8F0`, rounded `1rem`. Internal padding of `1.5rem`.
- Smooth hover transition (`translate-y: -2px`) coupled with Elevation Level 2 shadow.

### Chips, Tags & Badges
- **Verified Pro Badge:** Pill shape (`rounded-full`), `#0F766E15` background with `#0F766E` text and a embedded checkmark icon.
- **Rating Tag:** Amber tint `#F59E0B15` background, `#F59E0B` star icon, `#F59E0B` text.
- **Status Pills:** Neutral/pending in slate (`#F8FAFC` / `#64748B`), Active/Online in green (`#16A34A15` / `#16A34A`).

### Checkboxes & Radios
- Size `1.25rem` x `1.25rem`. Unchecked: `1.5px solid #E2E8F0` with `#FFFFFF` background. Checked: `#0F766E` solid fill with white check/radio dot. Border radius: `0.375rem` for checkboxes, `9999px` for radios.

### Navigation Header
- `#FFFFFF` surface with a bottom border of `1px solid #F8FAFC`. Brand logo rendered in `#1A1A2E`. Active links underlined with `#0F766E` indicator.

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
