---
name: Premium Service Marketplace
colors:
  surface: '#f8fafc'
  surface-dim: '#f1f5f9'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8fafc'
  surface-container: '#f1f5f9'
  surface-container-high: '#e2e8f0'
  surface-container-highest: '#cbd5e1'
  on-surface: '#172033'
  on-surface-variant: '#64748b'
  inverse-surface: '#123b5d'
  inverse-on-surface: '#f8fafc'
  outline: '#94a3b8'
  outline-variant: '#e2e8f0'
  surface-tint: '#123b5d'
  primary: '#123b5d'
  on-primary: '#ffffff'
  primary-container: '#0f2e4a'
  on-primary-container: '#ffffff'
  inverse-primary: '#82a5cd'
  secondary: '#0f8b8d'
  on-secondary: '#ffffff'
  secondary-container: '#e6f7f7'
  on-secondary-container: '#0f8b8d'
  tertiary: '#f59e0b'
  on-tertiary: '#ffffff'
  tertiary-container: '#fef3c7'
  on-tertiary-container: '#92400e'
  error: '#dc2626'
  on-error: '#ffffff'
  error-container: '#fee2e2'
  on-error-container: '#991b1b'
  primary-fixed: '#d0e4ff'
  primary-fixed-dim: '#a6caf3'
  on-primary-fixed: '#001d34'
  on-primary-fixed-variant: '#123b5d'
  secondary-fixed: '#e6f7f7'
  secondary-fixed-dim: '#ccfbf1'
  on-secondary-fixed: '#096b62'
  on-secondary-fixed-variant: '#0d7a7c'
  tertiary-fixed: '#fef3c7'
  tertiary-fixed-dim: '#fde68a'
  on-tertiary-fixed: '#78350f'
  on-tertiary-fixed-variant: '#92400e'
  background: '#ffffff'
  on-background: '#172033'
  surface-variant: '#f1f5f9'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  button-text:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  stat-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
  section-gap: 80px
---

## Brand & Style
The design system is rooted in the "Premium Professional" aesthetic, prioritizing clarity, efficiency, and high-end utility. It targets a discerning audience looking for reliable home services through a sophisticated digital experience.

The visual language balances the structured reliability of enterprise-grade software with the approachability of a lifestyle marketplace. The style is **Minimalist and Modern**, utilizing significant whitespace (breathability), high-contrast typography for clear information hierarchy, and subtle depth to indicate interactivity. The emotional goal is to establish immediate trust and perceived high value.

## Colors
The palette is designed to convey authority and precision. 

- **Primary (Navy):** Used for branding, major headings, and primary navigation elements to anchor the UI.
- **Secondary (Teal):** Reserved for primary actions, links, and interactive states to drive conversion.
- **Accent (Orange):** Applied sparingly for high-attention elements like ratings, promotional banners, and status notifications.
- **Neutral/Background:** A clean pure white background (#FFFFFF) for a crisp, high-contrast digital workspace.
- **Semantic:** Green and Red are used strictly for feedback (success/error) and follow standard accessibility contrast ratios.

## Typography
The system uses **Inter** exclusively to ensure a systematic, utilitarian feel that scales perfectly from small labels to large displays. 

- **Headings:** Use Bold (700) and ExtraBold (800) for high-impact sections and statistics.
- **Body Text:** Standardized at 400 weight for maximum legibility in service descriptions.
- **Interactive Elements:** Buttons and navigation links use SemiBold (600) to distinguish them from static text.
- **Tightened Kerning:** For display sizes (32px+), use a slight negative letter-spacing (-0.01em to -0.02em) to maintain a premium, "locked-in" look.

## Layout & Spacing
The spacing model follows a strict **8px linear scale**. This creates a predictable rhythm across all pages.

- **Grid:** A 12-column fluid grid is used for desktop (1280px max-width), transitioning to a single-column stack on mobile devices.
- **Margins:** Desktop layouts utilize generous 40px outer margins to enhance the "Premium/Spacious" feel. Mobile reduces this to 16px to maximize screen real estate.
- **Vertical Rhythm:** Sections are separated by large gaps (80px) to provide visual breathing room, mimicking the "editorial" feel of premium marketplaces.

## Elevation & Depth
This design system uses a **Tonal Layering** approach combined with **Ambient Shadows**.

1.  **Level 0 (Background):** #FFFFFF - Pure white canvas.
2.  **Level 1 (Surfaces/Cards):** #FFFFFF - Pure white containers with subtle borders and shadows.
3.  **Shadows:** Use a single, highly diffused shadow style for cards: `0px 4px 20px rgba(23, 32, 51, 0.05)`. This creates a soft lift without looking heavy or dated.
4.  **Borders:** All cards and inputs must feature a subtle 1px border (`#E2E8F0`) to maintain structural definition, even on high-brightness displays.

## Shapes
The shape language is "Rounded," striking a balance between the friendliness of a consumer app and the precision of a professional tool.

- **Standard Elements:** Buttons, input fields, and small UI components use a 0.5rem (8px) radius.
- **Containers:** Service cards and modal overlays use a larger 1rem (16px) radius to feel more approachable and modern.
- **Icons:** Use Lucide-style outline icons with a 2px stroke width and slightly rounded caps to match the UI's geometry.

## Components
- **Buttons:** 
  - *Primary:* Teal background, white text, 600 weight. 
  - *Secondary:* Navy outline, Navy text. 
  - *Tertiary:* Ghost style, Navy text, subtle gray hover state.
- **Cards:** White background, 1px neutral border, soft shadow, 16px corner radius. Padding inside cards should be 24px for desktop.
- **Input Fields:** 1px border (#E2E8F0), 8px radius, Inter 400. Focus state uses a 2px Teal ring with 4px offset.
- **Chips/Badges:** Light Teal (#E6F7F7) backgrounds with Teal (#0F8B8D) text for service categories or status tags.
- **Lists:** Clean rows with 1px bottom borders, using 16px vertical padding. Iconography should be placed to the left of the text for quick scanning.
- **Ratings:** Use the Orange (#F59E0B) color for star icons and numerical values to signify quality and trust.