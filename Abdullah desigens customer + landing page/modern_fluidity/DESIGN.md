---
name: Modern Fluidity
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
  display-hero:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.025em
  display-hero-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.011em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.006em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.005em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter-mobile: 1rem
  gutter-desktop: 1.5rem
  margin-mobile: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  card-padding-sm: 1.25rem
  card-padding-md: 1.5rem
  card-padding-lg: 2rem
---

## Brand & Style

This design system delivers an ultra-clean, high-trust marketplace and SaaS experience engineered around airy compositions, organic roundness, and surgical visual hierarchy. It strips away heavy borders, boxed enclosures, and utilitarian rigidity in favor of architectural breathing room, floating depth planes, and sophisticated micro-interactions.

The visual style blends modern corporate authority with contemporary product elegance:
- **Spatial Generosity:** Dense, border-heavy containers are replaced with expansive negative space (`p-6` to `p-8` default paddings), letting content self-segment naturally.
- **Tonal Weight & Restraint:** Deep Navy anchors structural stability while Crisp Teal acts as an intentional, high-contrast action catalyst. Surfaces remain pure white over a light, slate-tinted canvas, avoiding decorative pale washes.
- **Subtle Layering:** Interaction states and structural layers prioritize frosted glass accents (`backdrop-blur-md bg-white/90`) and diffused, navy-tinted ambient illumination over hard lines.

## Colors

The palette establishes unambiguous contrast between informational structure, actionable commands, and system feedback. 

- **Primary / Brand (`#1A1A2E`):** Deep Navy anchors top-level branding, critical headers, active tabs, and tonal shadows. It conveys institutional durability and enterprise-grade reliability.
- **Primary Action (`#0F766E`):** Saturated Teal reserved exclusively for high-intent interactive drivers: primary buttons, active toggles, critical links, and progress indicators.
- **Accent / Alert (`#F59E0B`):** Warm Amber highlights status alerts, ratings, pending badges, and contextual highlights.
- **Base Canvas & Surfaces:** Canvas is set to `#F8FAFC` (Soft Gray-Blue), creating a soft foundation against which pure `#FFFFFF` floating card surfaces project distinct, natural contrast.
- **Text Hierarchy:** Text follows a strict dual-tier model: `#1A1A2E` (Dark Navy) for headlines and high-priority data points; `#64748B` (Slate Gray) for secondary meta-information, captions, and muted labels.
- **Borders & Dividers:** Rigid outlines are strictly forbidden. Structural division utilizes hairline micro-borders (`#F8FAFC` and `#E2E8F0` at 60–100% opacity).
- **Negative Constraint:** Light cyan or pale teal background washes (e.g., `#0F766E15`) are entirely banned. Active and interactive states rely instead on tonal navy tints (`rgba(18, 59, 93, 0.04)`), muted neutral fills (`#F8FAFC`), or direct high-contrast Teal fills.

## Typography

Typography pairs the structural refinement of **Plus Jakarta Sans** for headlines, labels, and statistics with the utilitarian legibility of **Inter** for dense transactional UI, tabular readouts, and long-form marketplace copy.

- **Headline Treatment:** Plus Jakarta Sans employs optical negative tracking (`-0.015em` to `-0.025em`) at scale to maintain typographic cohesion. Headers must retain tight, intentional leading without collision.
- **Section Eyebrows & Overlines:** Use `label-caps` styled with `text-transform: uppercase`, `letter-spacing: 0.08em`, and a muted `#64748B` tone to organize dashboard panels cleanly.
- **Readability Rules:** Body text relies on `Inter` with generous line-heights (`1.6x` for long copy, `1.5x` for UI components) to guarantee effortless optical parsing within wide dashboard panels.

## Layout & Spacing

The layout model is built on an 8pt architectural rhythm using an adaptable 12-column fluid grid system bounded by maximum container constraints (`max-w-7xl` / `1280px`).

- **Breathing Room:** Crowded containers are avoided. Standard dashboard panels, metrics wrappers, and feed items implement `p-6` (`1.5rem`) to `p-8` (`2rem`) internal padding.
- **Grid Adaptability:**
  - **Mobile (< 640px):** Single-column stack with `1rem` screen gutters, `1rem` outer margins, and horizontal swipe-carousels for metric sets.
  - **Tablet (640px – 1024px):** 6-column grid with `1.5rem` gutters and `2rem` screen margins. Metric widgets shift to 2-column or 3-column splits.
  - **Desktop (≥ 1024px):** 12-column system with fixed `1.5rem` gutters and expansive outer framing (`3rem`). Core dashboards use asymmetrical modular configurations (e.g., 8-column primary work surface, 4-column contextual panel).

## Elevation & Depth

Visual hierarchy abandons opaque Drop Shadows and heavy outlines in favor of ambient navy-tinted illumination, subtle optical separation, and frosted glass layers.

- **Hairline Definition:** Structural surfaces utilize hairline borders (`1px solid rgba(226, 232, 240, 0.6)`) that visually ground elements without producing harsh outlines.
- **Tonal Ambient Shadows:** Shadows are tinted with Deep Navy (`#1A1A2E`) rather than raw black, producing luminous, physical depth:
  - **Resting Flat/Surface:** `box-shadow: 0 1px 3px 0 rgba(18, 59, 93, 0.03), 0 1px 2px -1px rgba(18, 59, 93, 0.03)`
  - **Floating Card:** `box-shadow: 0 4px 20px -2px rgba(18, 59, 93, 0.05), 0 2px 6px -1px rgba(18, 59, 93, 0.02)`
  - **Hover Elevated:** `box-shadow: 0 12px 28px -4px rgba(18, 59, 93, 0.08), 0 4px 12px -2px rgba(18, 59, 93, 0.03)`
  - **Overlay / Modal:** `box-shadow: 0 24px 48px -8px rgba(18, 59, 93, 0.12), 0 8px 16px -4px rgba(18, 59, 93, 0.04)`
- **Frosted Translucency:** Top navigation bars, sticky action docks, and flyout filters leverage `background: rgba(255, 255, 255, 0.90)` combined with `backdrop-filter: blur(12px)` and a bottom hairline divider (`#F8FAFC`).

## Shapes

The design system uses generous, refined geometric curvatures to deliver an accessible, sleek silhouette.

- **Surfaces & Cards:** Defined with `rounded-2xl` (`16px` to `20px`), softening container edges and emphasizing fluid movement across the canvas.
- **Buttons & Form Fields:** Standardized at `rounded-xl` (`12px`) to strike an optimal balance between human touch ergonomics and structural authority.
- **Pills & Chips:** Set to `rounded-full` (`9999px`) for status indicators, micro-badges, category markers, and avatars.
- **Icon Containers:** Soft squares with `rounded-2xl` (`14px`–`16px`) utilizing a subtle `#F8FAFC` background or faint primary tint, providing floating cradles for visual assets.

## Components

### Buttons
- **Primary Action:** Solid `#0F766E` background, `#FFFFFF` text, `font-semibold`, `rounded-xl` (`12px`), with horizontal padding `px-5 py-2.5`. Hover state scales micro-subtly (`translate-y-[-1px]`) with background `#115E59` and shadow `0 4px 14px rgba(15, 139, 141, 0.25)`.
- **Secondary / Surface Action:** Solid `#FFFFFF`, hairline border `1px solid #E2E8F0`, `#1A1A2E` text. On hover: border color `#E2E8F0`, background `#F8FAFC`.
- **Ghost / Tertiary:** Transparent background, `#1A1A2E` text, hover background `rgba(18, 59, 93, 0.05)`.
- **Floating Action Button (FAB):** `rounded-full`, elevated shadow `0 8px 24px rgba(15, 139, 141, 0.3)`, high-contrast teal icon or primary label.

### Cards & Metrics
- **Metric Cards:** `#FFFFFF` background, `rounded-2xl`, hairline border `1px solid rgba(226, 232, 240, 0.6)`, ambient shadow `0 4px 20px -2px rgba(18, 59, 93, 0.05)`. Padding set to `p-6`.
- **Icon Pods:** Features a floating icon container inside metrics cards: `w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-[#0F766E] border border-slate-100`.

### Chips & Badges
- **Status Pills:** `rounded-full`, padding `px-3 py-1`, text `label-md` or `text-xs font-semibold`.
  - *Active / Success:* Hairline ring `ring-1 ring-emerald-600/20`, background `bg-emerald-50`, text `text-emerald-700`.
  - *Pending / Accent:* Hairline ring `ring-1 ring-amber-500/20`, background `bg-amber-50`, text `text-amber-700`.
  - *Neutral:* Hairline ring `ring-1 ring-slate-200`, background `bg-slate-50`, text `text-slate-600`.
  - *Forbidden:* Never apply light teal washes (`#0F766E15`) to chips.

### Inputs & Controls
- **Text Inputs:** `#FFFFFF` background, border `1px solid #E2E8F0`, `rounded-xl`, `px-4 py-3`, text `#1A1A2E`, placeholder `#64748B`. Active focus ring: `outline-none ring-2 ring-[#0F766E]/20 border-[#0F766E]`.
- **Checkboxes & Radios:** `rounded-md` (checkbox) or `rounded-full` (radio). Inactive: border `1.5px solid #E2E8F0`, background `#FFFFFF`. Active: background `#0F766E`, border `#0F766E`, checkmark `#FFFFFF`.

### Navigation & Headers
- **Top Bar:** Translucent `bg-white/90 backdrop-blur-md`, hairline bottom border `border-b border-slate-100`, persistent height `h-16`, integrated search bar with internal muted keyboard shortcut badge (`Cmd+K`).
- **Sidebar:** Clean, borderless separation with subtle hairline division `border-r border-slate-100`, item active state highlighted via `bg-slate-100/70 text-[#1A1A2E] font-semibold rounded-xl px-3 py-2.5`.

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
