# UI & Design System Guidelines

## Beer CSS Design System
The project uses [Beer CSS](https://www.beercss.com/) which implements Material Design 3. Instead of heavy JavaScript component libraries, UI components are styled using semantic HTML and Beer CSS utility classes.

### 1. Beer CSS Native-First Rule
> [!IMPORTANT]
> **Native-First**: Always use what Beer CSS provides natively out-of-the-box before writing any custom CSS. Leverage Beer CSS semantic elements (`<nav class="toolbar">`), positioning helpers (`fixed`, `bottom`, `center`), margins, elevations (`medium-elevate`), padding helpers (`medium-padding`, `large-padding`), and depth (`front`). Avoid writing custom CSS unless Beer CSS fundamentally lacks the capability (then keep custom styles minimal).

### 2. Custom Style Units Rule
> [!IMPORTANT]
> **Units**: For any custom styling, strictly use **`pt`** for font sizes and **`px`** for everything else (margins, padding, dimensions, widths, heights). Avoid **`rem`** unless really necessary, and ask for user confirmation before doing so.

### 3. Typography Standards
- **No Manual `fontSize` in Style Attributes**: Do NOT use `fontSize` (or font sizing styles) inside inline `style={{ ... }}` attributes.
- Always use Beer CSS typography classes (`h1`–`h6`, `.small`, `.large`, `.small-text`, `.medium-text`, `.large-text`) or pre-declared generic CSS classes (e.g. `.micro-text`, `.status-badge.small`) in stylesheet files so typography remains consistent and reusable.

### 4. Common Semantic Elements & Classes
- **Surfaces & Cards**:
  - `<article className="border round">` &mdash; Outlined content card container.
  - `<article className="no-padding round">` &mdash; Standard card with edge-to-edge media (`<img className="responsive small top-round">`) and inner content.
  - `<div className="card fill surface-container-low round padding">` &mdash; Elevated container card.
  - Use `.secondary-container` or `.tertiary-container` with `.medium-padding` for highlighted form sections (e.g. tags, pricing).
- **Grids & Layouts**:
  - `<div className="grid">` with responsive column helpers like `<div className="s12 m6 l4">` (full width on small, 2-col on medium, 3-col on large).
  - `<main className="responsive">` &mdash; Constrains max width on large viewports and applies standard responsive margins.
- **Rows & Buttons**:
  - `<button className="circle transparent">` &mdash; Circular icon button.
  - `<button className="primary">` &mdash; Filled primary action button.
  - `<button className="border round">` &mdash; Outlined neutral button.

### 5. Iconography
Material Symbols Outlined are bundled locally with Beer CSS and used via the `<i>` tag:
```html
<i>home</i>
<i>inventory_2</i>
<i>settings</i>
<i>checkroom</i>
<i>sell</i>
<i>palette</i>
<i>height</i>
<i>payments</i>
<i>tag</i>
```

### 6. Theme Management
Theme switching is handled via Beer CSS's JS helper:
```ts
import ui from 'beercss';

ui('mode', 'dark');  // Switch to dark mode
ui('mode', 'light'); // Switch to light mode
```
Beer CSS automatically manages `body.light` / `body.dark` and recalculates CSS custom properties for surfaces, primary, secondary, and tertiary variables.

### 7. Mode Badge
- Mode indicators (e.g., `<ModeBadge />`) must **only** display when running in **`mock`** data mode (rendering a subtle red `MOCK` chip).
- In production / **`firebase`** mode, the badge is **hidden** entirely to keep the interface clean and professional.
- Always reuse the shared [`<ModeBadge />`](file:///Users/fresh/Developers/_projects/_web/hangerscloset-web/src/components/ModeBadge.tsx) component across views.

### 8. Destructive & Action Buttons
- Destructive or session-ending buttons such as logout should use the clean neutral outlined variant (`button.border.round`) rather than solid red fills (`.error`), keeping surface aesthetics calm and glare-free.

### 9. Loading State Standards
- **Never Use Radial Spinners**: Do NOT use radial circular spinners (`progress.circle` / `<progress className="circle">`) for page or content loading states.
- **Content Views (Catalogs / Grids / Lists)**: Always build and display responsive **Skeleton Loaders** (e.g. [`<InventoryCardSkeleton />`](file:///Users/fresh/Developers/_projects/_web/hangerscloset-web/src/components/InventoryCardSkeleton.tsx)) that mirror the exact layout, geometry, and responsive behavior of the content cards across all screen sizes (`s`, `m`, `l`) to prevent layout shift.
- **Generic / Full-Screen Transitions**: Use Beer CSS's Material You animated shape loading indicator (`<div className="shape loading-indicator extra" role="status" />`) centered in the viewport.

### 10. Mobile Usability Standards
1. **Tap Targets**: Every interactive element (tabs, buttons, links, icon buttons) must have at least $48\text{px} \times 48\text{px}$ touch target area.
2. **Safe Areas**: Viewport is configured with `viewport-fit=cover`, respecting safe area insets (`env(safe-area-inset-top)` / `env(safe-area-inset-bottom)`).
