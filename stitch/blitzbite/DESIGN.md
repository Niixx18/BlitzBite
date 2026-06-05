---
name: BlitzBite
colors:
  surface: '#fff8f6'
  surface-dim: '#f1d4ca'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1ec'
  surface-container: '#ffe9e2'
  surface-container-high: '#ffe2d8'
  surface-container-highest: '#fadcd2'
  on-surface: '#271812'
  on-surface-variant: '#5b4137'
  inverse-surface: '#3e2c26'
  inverse-on-surface: '#ffede7'
  outline: '#8f7065'
  outline-variant: '#e4beb1'
  surface-tint: '#a73a00'
  primary: '#a73a00'
  on-primary: '#ffffff'
  primary-container: '#ff5c00'
  on-primary-container: '#521800'
  inverse-primary: '#ffb59a'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e5e2e1'
  on-secondary-container: '#656464'
  tertiary: '#5d5f5f'
  on-tertiary: '#ffffff'
  tertiary-container: '#929393'
  on-tertiary-container: '#2a2c2c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbce'
  primary-fixed-dim: '#ffb59a'
  on-primary-fixed: '#370e00'
  on-primary-fixed-variant: '#802a00'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#fff8f6'
  on-background: '#271812'
  surface-variant: '#fadcd2'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
  stack-xl: 48px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style

The design system is engineered to evoke high-velocity precision and culinary excellence. It targets urban professionals and food enthusiasts who value both speed and curation. The visual identity sits at the intersection of **Corporate Modern** and **High-Contrast Bold**, blending the structural reliability of enterprise software with the vibrant energy of the food service industry.

The UI should feel "high-definition"—crisp edges, intentional whitespace, and a sophisticated use of dark surfaces to make food imagery appear more appetizing and premium. Every interaction must feel instantaneous, reinforcing the brand's commitment to "Blitz" speed without sacrificing a high-end, curated feel.

## Colors

The palette revolves around **Blitz Orange**, a high-chroma, energetic hue that stimulates appetite and signals urgency. This is anchored by **Deep Charcoal**, which provides a premium, grounded contrast, moving away from the typical "cheap" feel of pure black.

- **Primary (Blitz Orange):** Used for primary actions, progress indicators, and brand-critical touchpoints.
- **Secondary (Deep Charcoal):** Reserved for text, headers, and high-contrast button states to ensure a professional, sophisticated aesthetic.
- **Tonal Neutrals:** A series of cool grays that handle surface layering and secondary text.
- **Dark Mode Strategy:** In dark mode, the Deep Charcoal becomes the base layer, while Blitz Orange maintains its vibrancy to ensure accessibility and "pop."

## Typography

This design system utilizes **Geist** for its technical precision and modern, monolinear construction. It bridges the gap between a developer-centric font and a lifestyle brand, providing a clean, "tech-forward" feel that differentiates the product from more organic-leaning competitors.

For marketing-heavy sections, use `display-lg` with tight tracking. For utility-heavy sections like checkout and tracking, rely on `label-md` for high legibility. All headlines feature negative letter-spacing to maintain a compact, premium look at larger scales.

## Layout & Spacing

The layout is built on a strict **4px baseline grid**. This ensures mathematical harmony across all components.

- **Mobile:** A 4-column fluid grid with 16px margins. Components should prioritize vertical stacking.
- **Desktop:** A 12-column fixed grid (max-width 1280px) with 24px gutters. 
- **Rhythm:** Use "Stack" spacing for vertical relationships (e.g., 8px between a label and input, 24px between card groups). This tight spacing creates a dense, information-rich environment that feels efficient and professional.

## Elevation & Depth

We utilize **Ambient Shadows** to create a sense of physical layering without clutter. Depth is expressed through three primary tiers:

1.  **Level 0 (Base):** The canvas background.
2.  **Level 1 (Cards):** Low-offset, highly diffused shadows (e.g., 0px 4px 20px rgba(0,0,0,0.05)). These "float" the food items above the background.
3.  **Level 2 (Overlays/Search):** Higher contrast shadows with a larger spread to indicate modals, dropdowns, or the active search bar.

In Dark Mode, depth is communicated through **Tonal Layers** (lighter shades of charcoal) rather than shadows, ensuring the UI remains clean and readable.

## Shapes

The shape language is defined by **large, modern radii**. This softens the technical nature of Geist typography and adds a friendly, approachable quality to the interface.

- **Standard Elements (Buttons, Small Cards):** 12px (`rounded-md`).
- **Container Elements (Promotional Banners, Main Cards):** 24px (`rounded-xl`).
- **Interactive Elements:** Use the `rounded-lg` (16px) for a balanced feel that accommodates both text and imagery comfortably.

## Components

### Card System
Cards are the primary vehicle for food discovery. They feature a 24px corner radius and a subtle 1px border in a light-neutral shade. On hover, cards should slightly scale (1.02x) and the shadow should deepen, providing tactile feedback.

### Button System
- **Primary:** Blitz Orange background with White or Charcoal text. High contrast is mandatory.
- **Secondary (Ghost):** Charcoal outline (1px) with no fill. Used for "Cancel" or "View All" actions.
- **Tertiary:** Pure text with an icon, used for low-priority navigation.

### Form System
Inputs use a "Soft-Focus" state. When inactive, they have a light gray fill and no border. On focus, the background turns white and gains a 2px Blitz Orange border. Validation states (Error/Success) change only the border color and helper text.

### Search System
The search bar is the centerpiece of the "Blitz" experience. It should be pinned to the top on mobile, featuring a prominent search icon and a glassmorphic background blur when scrolling. It uses micro-interactions (e.g., expanding when tapped) to command the user's focus.

### Chips & Tags
Used for dietary labels (e.g., "Vegan," "Fastest") with a 50% opacity Blitz Orange background and 100% opacity text for a modern, layered look.