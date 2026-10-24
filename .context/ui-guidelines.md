# UI & Design Guidelines

## Beer CSS Design System
The project uses [Beer CSS](https://www.beercss.com/) which implements Material Design 3. Instead of heavy JavaScript component libraries, UI components are styled using semantic HTML and Beer CSS utility classes.

### Common Semantic Elements & Classes
- **Surfaces & Cards**:
  - `<article className="border round">` &mdash; Outlined content card container.
  - `<div className="card fill surface-container-low round padding">` &mdash; Elevated card.
- **Grids & Layouts**:
  - `<div className="grid">` with responsive columns like `<div className="s12 m6">` (full width on small screens, half width on medium+ screens).
  - `<main className="responsive">` &mdash; Constrains max width on large viewports and applies standard responsive margins.
- **Buttons**:
  - `<button className="circle transparent">` &mdash; Circular icon button.
  - `<button className="primary">` &mdash; Filled primary action button.
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

## Mobile Usability Rules
1. **Tap Targets**: Every interactive element (tabs, buttons, links) must have at least $48\text{px} \times 48\text{px}$ touch target area.
2. **Tab Bar**:
   - On screens $\le 600\text{px}$, tabs display icon stacked on top of text for compact width and easy thumb reach.
   - On wider screens, icon and text sit side by side.
3. **Safe Areas**: Viewport is configured with `viewport-fit=cover`, respecting safe area insets (`env(safe-area-inset-top)` / `env(safe-area-inset-bottom)`).
4. **Scrolling & Stickiness**: The header remains fixed at the top (`position: sticky`), maintaining context without eating vertical screen real estate.
