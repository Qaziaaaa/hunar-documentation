---
name: Craft & Precision
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
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: plusJakartaSans
    fontSize: 30px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: plusJakartaSans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: plusJakartaSans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: plusJakartaSans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: plusJakartaSans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: plusJakartaSans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: plusJakartaSans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: plusJakartaSans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: plusJakartaSans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: plusJakartaSans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: plusJakartaSans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: plusJakartaSans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 2.5rem
  space-3xl: 3rem
  gutter-mobile: 1rem
  gutter-desktop: 1.5rem
  card-padding-mobile: 1.25rem
  card-padding-desktop: 2rem
  wizard-max-width: 38rem
---

## Brand & Style

This design system drives an empowering, dignity-centered onboarding wizard for vocational, trade, and craft workers. It elevates blue-collar craftsmanship into high-value professional mastery through an aesthetic that blends industrial precision with organic vitality.

The emotional signature is grounded, clear, and reassuring. Registration workflows for skilled workers (technicians, carpenters, electricians, fabricators) often introduce cognitive friction and document fatigue. The interface responds with high-legibility surfaces, tactile verification steps, and unmistakable affordances that instill confidence at every tap.

The design movement combines **Modern High-Contrast Functionalism** with **Deep Tonal Layering**:
- Deep, atmospheric forest and pine foundations anchor the primary application shell, providing immersive focus.
- Brilliant mint and emerald indicators inject momentum, rewarding forward progress.
- Crisp ivory and neutral slate containers preserve high readability within multi-step data entry forms.
- Generous, rounded pill geometries eliminate visual sharpness, replacing it with an approachable, human touch.

## Colors

The palette balances authoritative deep-forest tones with luminous neon-mint action cues to sustain high contrast and clarity.

- **Primary (`#1A1A2E` & `#1A1A2E`)**: Deep Forest Teal. Forms the baseline header atmosphere, primary typography, and unyielding structural anchors. It evokes stability, institutional respect, and professional weight.
- **Secondary (`#0F766E`)**: Energetic Mint. Used sparingly for high-impact confirmation cues, key conversion buttons, active step indicators, and verified badges.
- **Tertiary (`#16A34A`)**: Emerald Deep Accent. Serves as the interactive hover/pressed state for secondary controls, supporting data visualizations, and field validation success checks.
- **Neutral (`#64748B` slate base)**: Scaled from soft oyster backgrounds (`#F8FAFC`, `#F8FAFC`) to precise border lines (`#E2E8F0`) and deep legible body slate (`#1A1A2E`).

### Roles & Contrast Rules
- Form surfaces rest on pure white (`#FFFFFF`) or pale slate (`#F8FAFC`) cards to ensure inputs pass WCAG AAA contrast standards against dark text.
- Accent Mint (`#0F766E`) is paired strictly with Deep Forest Teal (`#1A1A2E`) text for buttons to avoid low-contrast white-on-mint issues.
- Error validation uses crisp carmine (`#DC2626`), while pending or certification warnings leverage amber craft gold (`#F59E0B`).

## Typography

**Plus Jakarta Sans** governs the typography hierarchy across all platforms. Its open geometric aperture, generous x-height, and warm terminals offer instant legibility under varied lighting, low-tier mobile display resolutions, or outdoors on job sites.

- **Display & Headlines**: Heavy weights (700 and 800) create firm orientation at the start of each onboarding milestone (e.g., "Personal Credentials", "Skill Certification", "Tool Inventory").
- **Body**: Rendered at medium and regular weights with balanced line heights to facilitate effortless parsing of multi-language prompts, licensing criteria, and verification disclaimers.
- **Labels**: Capitalized or weighted semi-bold to bold, ensuring form field prompts, badge status markers, and stepper tags remain crisp at glance speed.

## Layout & Spacing

The onboarding framework operates on an intentional mobile-first single-column containment strategy. Multi-column forms introduce scanning errors for trade workers on hand-held devices; therefore, interactive components flow linearly.

- **Grid Architecture**: 
  - **Mobile (< 640px)**: 4-column fluid layout with `16px` margins. Inputs expand to 100% card width. Action triggers pin dynamically to the lower thumb zone.
  - **Tablet & Desktop (≥ 640px)**: The onboarding canvas locks into a centered `38rem` (608px) high-focus column. A persistent step navigation track or breadcrumb rail frames the form container.
- **Spacing Rhythm**: Built upon an uncompromising `8px` spatial grid (`4px` for tight icon/label clusters). Every card, input field, and progress indicator adheres strictly to standard step intervals.

## Elevation & Depth

Visual hierarchy uses **Tactile Tonal Layering** paired with calibrated, ambient teal-tinted dropshadows. Rather than relying on standard neutral gray blurs, elevation in this design system carries color temperature.

1. **Base Layer (Canvas)**: Tinted deep teal (`#1A1A2E` on hero steps or onboarding splash) transitioning to soft slate (`#F8FAFC`) on prolonged input surfaces.
2. **Surface Layer (Cards)**: Pure white (`#FFFFFF`) with a structural 1px border (`#E2E8F0`) and a resting ambient shadow:
   `0 1px 3px rgba(6, 39, 35, 0.04), 0 6px 16px rgba(6, 39, 35, 0.03)`.
3. **Interactive & Floating Layer (Selectable Skill Cards & Bottom Sticky Actions)**:
   Elevated on touch or hover to `0 8px 24px rgba(6, 39, 35, 0.08)`, accented by a glowing perimeter highlight `0 0 0 2px #0F766E` when active.
4. **Modals & Bottom Drawers (Document & Certificate Uploaders)**:
   Deep elevation backed by an 80% opacity dark teal backdrop (`#1A1A2E`) and an upward projection shadow: `0 -8px 32px rgba(6, 39, 35, 0.16)`.

## Shapes

The interface embraces a **pill-shaped (level 3)** standard for touchable actions and status indicators, paired with harmonized rounded corners on cards and modular input containers.

- **Buttons & Chips**: Formed with complete pill radiuses (`9999px` / `rounded-full`). This makes interactive buttons unmistakably distinct from rectangular input slots and informational cards.
- **Form Input Fields & Panels**: Use `1rem` (16px) corner radiuses, balancing structure with touch ergonomics.
- **Parent Cards & Step Wrappers**: Constructed with `1.5rem` to `2rem` (24px to 32px) soft boundaries, establishing friendly, non-threatening card silhouettes.

## Components

### 1. Primary & Secondary Buttons
- **Primary Pill**: Full-width on mobile. Background is Mint (`#0F766E`) with Deep Forest Teal (`#1A1A2E`) text in `label-lg` weight. Height is `52px` to accommodate work-roughened hands and hurried thumb taps. Active state transitions to Emerald (`#16A34A`) with white text.
- **Secondary Pill**: Transparent with a `1.5px` border in `#E2E8F0` or dark teal tint (`#1A1A2E`). Slate text with an optional craft icon aligned to the leading edge.

### 2. Form Inputs & Document Capture
- **Text & Phone Inputs**: Minimal `52px` height, `#FFFFFF` fill, bordered with `#E2E8F0`. On focus, the border transitions cleanly to `#0F766E` with a soft 3px outer ring in `rgba(0, 223, 129, 0.2)`. Floating labels use `label-md`.
- **Media / License File Dropzone**: Outlined with a 2px dashed border in `#64748B`. Contains a circular mint-tinted icon badge (`#0F766E15`) displaying a friendly camera or certificate emblem, followed by clear single-tap upload wording.

### 3. Trade & Craft Skill Selector Tiles
- Large selectable block cards representing vocations (e.g., Plumbing, Electrical, Masonry, Welding).
- Composed of an illustrated friendly craft badge (48x48px container), a bold title (`title-md`), and a brief skill qualifier.
- Unselected: Crisp white background, `#E2E8F0` border.
- Selected: Tinted forest-mint fill (`#0F766E15`), surrounded by a 2px stroke in `#0F766E`, accompanied by a solid mint checkmark pin at the top-right corner.

### 4. Step Indicator & Onboarding Progress
- Progress is visually tracked via a partitioned pill meter spanning the top header. Completed milestones turn energetic mint (`#0F766E`), the current step pulses slightly, and future steps remain muted slate (`#E2E8F0`).
- Accompanied by plain-language step labels (e.g., "Step 2 of 4: Experience & Skills") in `label-md`.

### 5. Checkboxes & Radio Pills
- Radios and checkboxes scale to a comfortable 22x22px tap area.
- Radio buttons feature a concentric mint target dot (`#0F766E`) on forest background selection. Checkboxes display a clean white check on an emerald fill upon confirmation.

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
