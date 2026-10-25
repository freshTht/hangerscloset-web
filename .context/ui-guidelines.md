# UI & Design Guidelines

## Beer CSS Design System
The project uses [Beer CSS](https://www.beercss.com/) which implements Material Design 3. Instead of heavy JavaScript component libraries, UI components are styled using semantic HTML and Beer CSS utility classes.

> [!IMPORTANT]
> **Beer CSS Native-First Rule**: Always check and use what Beer CSS provides natively out-of-the-box before writing any custom CSS. Beer CSS includes semantic components (like `<nav class="toolbar">`), positioning helpers (`fixed`, `bottom`, `center`, `front`), spacing helpers (`space`, `large-space`, `extra-space`), and elevation helpers (`elevate`, `medium-elevate`). Custom CSS should only be written if Beer CSS fundamentally lacks the feature.

### Common Semantic Elements & Classes
- **Surfaces & Cards**:
  - `<article className="border round">` &mdash; Outlined content card container.
  - `<article className="no-padding round">` &mdash; Standard Beer CSS card with top-flush media (`<img className="responsive small top-round">`) and inner `<div className="padding">`.
  - `<div className="card fill surface-container-low round padding">` &mdash; Elevated settings/info card.
- **Grids & Layouts**:
  - `<div className="grid">` with responsive columns like `<div className="s12 m6 l4">` (full width on small, 2-col on medium, 3-col on large).
  - `<main className="responsive">` &mdash; Constrains max width on large viewports and applies standard responsive margins.
- **Rows**:
  - `<div className="row no-margin">` &mdash; Horizontal label/value pair row. Used for Brand, Color, Size, and rental price rows on InventoryCard.
- **Buttons**:
  - `<button className="circle transparent">` &mdash; Circular icon button.
  - `<button className="primary">` &mdash; Filled primary action button.
- **Chips**:
  - `<span className="chip fill green">` &mdash; Status chip: Available.
  - `<span className="chip fill orange">` &mdash; Status chip: Reserved.
  - `<span className="chip fill blue">` &mdash; Status chip: Laundry.
- **Spacing**:
  - `<div className="space"></div>` &mdash; Standard vertical spacing.
  - Helper classes: `padding`, `no-margin`, `gap`.

## Iconography
Material Symbols Outlined are bundled locally with Beer CSS and used via the `<i>` tag:
```html
<i>home</i>
<i>inventory_2</i>
<i>settings</i>
<i>checkroom</i>
<i>light_mode</i>
<i>dark_mode</i>
<i>sell</i>
<i>palette</i>
<i>height</i>
```

## Theme Management
Theme switching is handled via Beer CSS's JS helper:
```ts
import ui from 'beercss';

// Switch to dark mode
ui('mode', 'dark');

// Switch to light mode
ui('mode', 'light');
```
Beer CSS automatically manages the `body.light` / `body.dark` classes and dynamically recalculates CSS custom properties for surfaces, on-surfaces, primary, and secondary color variables.

## Mode Badge & Environment Indicators
- **Preferable Behavior**: Mode indicators (e.g., `<ModeBadge />`) must only display when running in **`mock`** data mode (rendering a subtle red `MOCK` chip). In production / **`firebase`** mode, the badge is **hidden** entirely to keep the interface clean, professional, and free of redundant clutter.
- **Shared Component**: Always reuse the shared [`<ModeBadge />`](../src/components/ModeBadge.tsx) component across all views (e.g. `LoginPage`, `SettingsPage`) rather than writing ad-hoc chip badges.

## Action Buttons & Danger States
- **Neutral Outlined Variant**: Destructive or session-ending buttons such as logout should prefer the clean outlined style (`button.border.round`) rather than high-contrast solid red fills (`.error`), keeping surface aesthetics calm and glare-free.

## Mobile Usability Rules
1. **Tap Targets**: Every interactive element (tabs, buttons, links) must have at least $48\text{px} \times 48\text{px}$ touch target area.
2. **Tab Bar**:
   - On screens $\le 600\text{px}$, tabs display icon stacked on top of text for compact width and easy thumb reach.
   - On wider screens, icon and text sit side by side.
3. **Safe Areas**: Viewport is configured with `viewport-fit=cover`, respecting safe area insets (`env(safe-area-inset-top)` / `env(safe-area-inset-bottom)`).
4. **Scrolling & Stickiness**: The header remains fixed at the top (`position: sticky`), maintaining context without eating vertical screen real estate.
