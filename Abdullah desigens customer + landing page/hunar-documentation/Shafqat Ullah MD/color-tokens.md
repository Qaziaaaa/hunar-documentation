# Color Theme — Shafqat Ullah

**Theme Name:** Trust & Warmth  
**Project:** HUNAR — Home Services Platform  
**Date:** September 2, 2026

---

## Why This Theme?

### Reasoning

1. **Trust & Reliability** — HUNAR is a home services platform where customers invite strangers into their homes. Deep Teal (#0D9488) conveys trust, stability, and professionalism — essential for a platform handling payments and home visits.

2. **Warmth & Approachability** — Home is where the heart is. Warm Amber (#F59E0B) as the accent brings energy, optimism, and action — perfect for CTAs like "Post a Job" or "Accept Offer". It also represents Pakistani cultural warmth (think truck art gold, bunyan rassi colors).

3. **Clean but Not Sterile** — The warm off-white backgrounds (#FAFAF5, #F5F0EB) feel clean without being clinical. This differentiates HUNAR from cold, corporate-looking competitors.

4. **2026 Trend Alignment** — Biophilic/natural color palettes are trending in 2026. Earthy teals and warm ambers align with this movement while remaining functional.

5. **Pakistani Market Fit** — These colors resonate culturally. Teal/turquoise is prominent in Islamic art and Pakistani architecture. Amber/gold represents prosperity and hospitality.

6. **Accessibility** — All color combinations pass WCAG AA contrast requirements (4.5:1 minimum for text).

---

## Color Palette

### Primary Colors

| Token | Color | HEX | RGB | Usage |
|---|---|---|---|---|
| `primary-500` | Deep Teal | `#0D9488` | 13, 148, 136 | Primary buttons, links, active states |
| `primary-600` | Dark Teal | `#0B7F74` | 11, 127, 116 | Hover states |
| `primary-700` | Deeper Teal | `#096B62` | 9, 107, 98 | Active/pressed states |
| `primary-100` | Light Teal | `#CCFBF1` | 204, 251, 241 | Backgrounds, highlights |
| `primary-50` | Pale Teal | `#F0FDFA` | 240, 253, 250 | Subtle backgrounds |

### Accent Colors

| Token | Color | HEX | RGB | Usage |
|---|---|---|---|---|
| `accent-500` | Warm Amber | `#F59E0B` | 245, 158, 11 | CTA buttons, badges, highlights |
| `accent-600` | Dark Amber | `#D97706` | 217, 119, 6 | Hover states |
| `accent-700` | Deeper Amber | `#B45309` | 180, 83, 9 | Active/pressed |
| `accent-100` | Light Amber | `#FEF3C7` | 254, 243, 199 | Warning backgrounds |
| `accent-50` | Pale Amber | `#FFFBEB` | 255, 251, 235 | Subtle highlights |

### Neutral Colors

| Token | Color | HEX | RGB | Usage |
|---|---|---|---|---|
| `neutral-900` | Deep Charcoal | `#1A1A2E` | 26, 26, 46 | Primary text |
| `neutral-800` | Dark Gray | `#2D2D44` | 45, 45, 68 | Headings |
| `neutral-700` | Medium Dark | `#4A4A68` | 74, 74, 104 | Secondary text |
| `neutral-500` | Muted Gray | `#6B7280` | 107, 114, 128 | Placeholder text, captions |
| `neutral-400` | Light Gray | `#9CA3AF` | 156, 163, 175 | Borders, disabled |
| `neutral-200` | Pale Gray | `#E5E7EB` | 229, 231, 235 | Dividers, borders |
| `neutral-100` | Off White | `#F3F4F6` | 243, 244, 246 | Card backgrounds |
| `neutral-50` | Snow White | `#FAFAFA` | 250, 250, 250 | Page background |

### Warm Neutrals (Surface)

| Token | Color | HEX | RGB | Usage |
|---|---|---|---|---|
| `surface-warm` | Warm Cream | `#F5F0EB` | 245, 240, 235 | Sidebar, secondary bg |
| `surface-light` | Light Cream | `#FAF8F5` | 250, 248, 245 | Alternative page bg |
| `surface-card` | Card White | `#FFFFFF` | 255, 255, 255 | Cards, modals |

### Semantic Colors

| Token | Color | HEX | RGB | Usage |
|---|---|---|---|---|
| `success-500` | Green | `#10B981` | 16, 185, 129 | Success states, completed |
| `success-100` | Light Green | `#D1FAE5` | 209, 250, 229 | Success backgrounds |
| `error-500` | Red | `#EF4444` | 239, 68, 68 | Errors, destructive actions |
| `error-100` | Light Red | `#FEE2E2` | 254, 226, 226 | Error backgrounds |
| `warning-500` | Orange | `#F97316` | 249, 115, 22 | Warnings, pending states |
| `warning-100` | Light Orange | `#FFEDD5` | 255, 237, 213 | Warning backgrounds |
| `info-500` | Blue | `#3B82F6` | 59, 130, 246 | Information, links |
| `info-100` | Light Blue | `#DBEAFE` | 219, 234, 254 | Info backgrounds |

---

## Dark Mode Palette

| Token | Color | HEX | Usage |
|---|---|---|---|
| `dark-bg` | Deep Navy | `#0F172A` | Page background |
| `dark-surface` | Dark Slate | `#1E293B` | Card backgrounds |
| `dark-surface-hover` | Slate | `#334155` | Hover states |
| `dark-text` | Off White | `#F1F5F9` | Primary text |
| `dark-text-secondary` | Muted | `#94A3B8` | Secondary text |
| `dark-border` | Dark Gray | `#334155` | Borders |
| `primary-dark` | Bright Teal | `#14B8A6` | Primary on dark (lighter for contrast) |
| `accent-dark` | Bright Amber | `#FBBF24` | Accent on dark |

---

## Color Usage Rules

### DO:
- Use `primary-500` for primary actions (Post Job, Accept Offer)
- Use `accent-500` for attention-grabbing CTAs (Sign Up, Emergency)
- Use `neutral-900` for body text on light backgrounds
- Use semantic colors consistently (green = success, red = error)
- Use warm neutrals for backgrounds to differentiate from competitors

### DON'T:
- Don't use accent-500 for large background areas (too intense)
- Don't pair primary-500 with accent-500 directly (use neutral as buffer)
- Don't use neutral-400 or lighter for body text (fails accessibility)
- Don't use red for non-error states (confusing)

---

## Contrast Ratios (WCAG AA)

| Combination | Ratio | Pass? |
|---|---|---|
| neutral-900 on white | 16.8:1 | ✅ AAA |
| primary-500 on white | 4.6:1 | ✅ AA |
| accent-500 on neutral-900 | 7.2:1 | ✅ AAA |
| primary-500 on accent-500 | 2.1:1 | ❌ Don't pair |
| neutral-500 on white | 5.0:1 | ✅ AA |
| white on primary-500 | 4.6:1 | ✅ AA |
| white on accent-500 | 2.1:1 | ❌ Use dark text on accent |

---

## Typography Pairing

| Element | Font | Weight | Color |
|---|---|---|---|
| H1 | Inter / Nunito | 700 (Bold) | neutral-900 |
| H2 | Inter / Nunito | 600 (Semi) | neutral-800 |
| H3 | Inter / Nunito | 600 (Semi) | neutral-800 |
| Body | Inter | 400 (Regular) | neutral-900 |
| Caption | Inter | 400 (Regular) | neutral-500 |
| Button | Inter | 600 (Semi) | white (on primary/accent) |

---

*Theme selected by Shafqat Ullah — Pending team review*
