---
name: Curated Minimal Monochrome
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e3e2e2'
  on-secondary-container: '#646464'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1a1c1c'
  on-tertiary-container: '#838484'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#e3e2e2'
  secondary-fixed-dim: '#c7c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.04em
  display-hero-mobile:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.03em
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.06em
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.1em
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1.25rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 4rem
---

## Brand & Style

This design system channels the refined, high-touch curation of Seoul's leading editorial commerce and culture platforms. It balances stark structural minimalism with literary sensibility. The aesthetic strips away decorative noise, placing uncompromised focus on high-fidelity photography, editorial pacing, and uncompromising typographic hierarchy.

The brand targets discerning lifestyle and fashion consumers who value understated luxury, sharp contrast, and purposeful negative space. The UI evokes a sense of walking through a quiet, immaculately lit contemporary gallery or browsing an independent art publication. Interactions are deliberate, transitions are crisp, and visual hierarchy is articulated through strict proportions rather than layered effects or vibrant accents.

## Colors

The palette is rigorously restrained, operating across pure pitched blacks, nuanced warm-grays, and crisp off-whites. 

- **Primary (`#111111`)**: Pitch black used for primary actions, authoritative headlines, structural frame dividers, and active icons.
- **Secondary (`#737373`)**: Balanced neutral mid-tone gray for metadata, secondary descriptions, passive borders, and subtle captions.
- **Tertiary (`#E5E5E5`)**: Hairline borders, dividers, subtle inactive states, and structured architectural lines.
- **Neutral (`#FAFAFA`)**: The dominant canvas background, ensuring product imagery and bold typography float on a warm, organic off-white rather than sterile digital white.
- **Pure Surface (`#FFFFFF`)**: Reserved strictly for high-contrast modal sheets, elevated cards, and highlighted editorial blocks against the `#FAFAFA` field.

## Typography

The typography system pairs the architectural precision of Space Grotesk for high-impact headlines with the clean, neutral readability of Hanken Grotesk for editorial reading and commerce copy. JetBrains Mono serves as an essential secondary voice, applied to SKU codes, technical specs, pricing indices, and editorial categorization tags to instill an archival, curated tone.

Headlines should lead with tight tracking (`-0.02em` to `-0.04em`) to establish gravity, while body copy maintains comfortable leading for deep editorial storytelling. Uppercase styles must always be paired with expanded letter spacing (`label-caps` and `label-mono`) to prevent visual crowding.

## Layout & Spacing

The layout philosophy follows a disciplined fluid editorial grid. Desktop layouts use a 12-column grid with generous outer margins (`3rem`) and crisp column gutters (`1.5rem`). Mobile platforms employ a dense, edge-conscious 4-column system with a `1.25rem` margin.

Generous vertical pacing (`space-xl` and `space-2xl`) separates distinct editorial features, allowing photography and typography to command the viewport without competition. Content blocks, lookbook spreads, and spec sheets align strictly to the grid vectors, emphasizing structural discipline over asymmetrical chaos.

## Elevation & Depth

This design system avoids traditional soft dropped shadows and blurred elevations. Spatial hierarchy is communicated through **tonal planes** and **micro-hairline borders**.

- **Level 0 (Base)**: `#FAFAFA` backdrop.
- **Level 1 (Surface Cards & Panels)**: `#FFFFFF` flat fills defined by a 1px solid `#E5E5E5` hairline border.
- **Level 2 (Overlays & Sticky Drawers)**: High-contrast white `#FFFFFF` or stark black `#111111` surfaces bordered by 1px solid high-contrast edges (`#111111` or `#E5E5E5`). No diffuse blur.
- **Focus / Dimming**: When contextual focus is required (such as modal sheets or cart panels), backgrounds are masked by an unblurred 40% pitch black `#111111` scrim.

## Shapes

The design system embraces an uncompromising **Sharp (`0`)** shape language. All cards, buttons, input fields, badges, and image frames feature strict `0px` border-radii. 

This brutalist, razor-sharp geometric precision references printed luxury publications, catalog layouts, and physical museum labels. It strips away digital softness in favor of deliberate architectural structure.

## Components

### Buttons
- **Primary**: Solid `#111111` fill, crisp `#FFFFFF` text, `0px` radius, uppercase `label-caps` tracking. Hover initiates an inverted shift to `#FFFFFF` background with a 1px solid `#111111` border and `#111111` text.
- **Secondary / Ghost**: Transparent fill, 1px solid `#111111` border, `#111111` text.
- **Text Action**: No borders, underline with an offset of 4px using a 1px solid `#111111` stroke.

### Chips & Tags
- Rectangular blocks with `0px` radius.
- Background in `#FFFFFF` with a 1px `#E5E5E5` perimeter border; typography set in `label-mono` at 11px.
- Selected state flips the chip to solid `#111111` with `#FFFFFF` text.

### Cards & Product Modules
- Card frames possess a pure `#FFFFFF` background floating on the `#FAFAFA` canvas, enclosed by a 1px `#E5E5E5` border or seamlessly borderless with photographic bleeding.
- Images inside cards adhere strictly to `3:4` or `1:1` aspect ratios with no corner radius.
- Metadata is presented systematically: category in `label-mono`, title in `body-md` (weight 500), and pricing in `Space Grotesk` tabular figures.

### Form Inputs
- Flat `#FFFFFF` fields with a 1px bottom border in `#111111` (minimal underline variant) or a full 1px solid perimeter in `#E5E5E5`.
- Active focus transitions the border directly to 1px solid `#111111` with zero box-shadow ring.
- Placeholder text is set in `#737373` at `body-md`.

### Checkboxes & Radios
- Checkboxes: Strict square `16x16px` with 1px solid `#111111` border; checked state displays a solid `#111111` box with a white checkmark.
- Radio buttons: Sharp square outline with an inner solid square indicator, maintaining the zero-curve architectural identity.

### Editorial Dividers & Index Headers
- Clean 1px solid `#E5E5E5` horizontal lines.
- Section indexes feature section numbering (e.g., `01 / CURATION`) in `label-mono` anchored directly to the divider line.