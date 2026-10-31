# UI & Design System Guidelines

<!-- BEERCSS_VERSION -->
**Current Version**: `v3.13.3` ([Full LLM Reference](./references/beercss.md))
<!-- /BEERCSS_VERSION -->

The project uses [Beer CSS](https://www.beercss.com/) which implements Material Design 3. Instead of heavy JavaScript component libraries, UI components are styled using semantic HTML, pure CSS triggers, and Beer CSS utility classes.

---

## 1. The 3 Pure Ingredients of Beer CSS
Beer CSS is built around 3 core concepts:
1. **Settings**: Document-level CSS variables, theme palettes (surfaces, primary, secondary, tertiary, error), safe-area insets, and resets.
2. **Elements**: Semantic HTML tags and component primitives: `<button>`, `<dialog>`, `<nav>`, `<header>`, `<main>`, `<article>`, `<table>`, `<progress>`, `<details>`, etc.
3. **Helpers**: Scalable classes modifying elements:
   - **Colors**: `primary`, `secondary`, `tertiary`, `surface`, `surface-container-low`, `surface-container`, `surface-container-high`, `surface-container-highest`, `error`.
   - **Sizes**: `tiny`, `small`, `medium`, `large`, `extra`.
   - **Spacing**: `no-space`, `small-space`, `medium-space`, `large-space`, `extra-space`.
   - **Margins**: `no-margin`, `small-margin`, `medium-margin`, `large-margin`, `extra-margin`, `top-margin`, `bottom-margin`, etc.
   - **Padding**: `no-padding`, `tiny-padding`, `small-padding`, `padding` (16px), `medium-padding` (20px), `large-padding` (24px), `extra-padding`.
   - **Alignments**: `left-align`, `right-align`, `center-align`, `top-align`, `middle-align`, `bottom-align`.
   - **Elevations**: `no-elevate`, `small-elevate`, `elevate`, `medium-elevate`, `large-elevate`.
   - **Shapes**: `round`, `square`, `circle`.
   - **Layout**: `row`, `column`, `wrap`, `max`, `min`, `front`, `back`.

---

## 2. Core Operational Rules

### A. Beer CSS Native-First Rule
> [!IMPORTANT]
> Always explore and use what Beer CSS provides natively out-of-the-box before writing custom CSS. Leverage Beer CSS semantic elements, helpers, padding classes (`medium-padding`), and depth (`front`). Avoid custom CSS unless Beer CSS fundamentally lacks the capability (then keep custom styles minimal).

### B. Custom Style Units Rule
> [!IMPORTANT]
> For any custom styling, strictly use **`pt`** for font sizes and **`px`** for everything else (margins, padding, dimensions, widths, heights). Avoid **`rem`** unless really necessary, and ask for user confirmation before doing so.

### C. Typography Standards
- **No Manual `fontSize` in Style Attributes**: Do NOT use `fontSize` (or font sizing styles) inside inline `style={{ ... }}` attributes.
- Use Beer CSS typography classes (`h1`–`h6`, `.small`, `.large`, `.small-text`, `.medium-text`, `.large-text`) or pre-declared generic CSS classes (e.g. `.micro-text`, `.status-badge.small`) in stylesheet files.

---

## 3. Component & Layout Patterns

### Form Elements & Floating Labels
- Wrap inputs in `.field` with `.label`, `.border`, `.round`, etc.
- **Pure CSS Floating Label**: Always include `placeholder=" "` on inputs and textareas so that `:placeholder-shown` automatically raises and lowers labels without needing extra JavaScript.
- **Trailing / Leading Icons**: Place Material Symbol `<i>` inside `.field` (Beer CSS centers and positions it automatically).
- **Field Sizes**: Use `.field.small` (`--_input: 2.5rem;`), standard, or `.field.large`.

### Containers, Cards & Modals
- **Cards**: `<article className="border round">` (content card) or `<article className="no-padding round">` (edge-to-edge media with `<img className="responsive small top-round">`).
- **Container Highlights**: Use `.round.secondary-container.medium-padding` or `.round.tertiary-container.medium-padding` for grouped form sections (e.g. pricing, tags).
- **Dialogs & Sheets**: Use native HTML `<dialog>`. For mobile bottom sheets with desktop side sheets, combine responsive position helpers: `<dialog className="bottom s right m l">`.

### Responsive Layout & Breakpoints
Beer CSS uses 3 standard breakpoints:
- `s` (Small, $\le 600\text{px}$): Mobile layout.
- `m` (Medium, $601\text{px} - 960\text{px}$): Tablet / compact desktop.
- `l` (Large, $> 960\text{px}$): Desktop.
- Combine with grid columns: `<div className="s12 m6 l4">`.

---

## 4. Iconography & Theme Management
- **Icons**: Material Symbols Outlined via `<i>icon_name</i>` (bundled locally via Beer CSS).
- **Theme**: Managed via Beer CSS JavaScript API:
  ```ts
  import ui from 'beercss';

  ui('mode', 'dark');  // Switch to dark
  ui('mode', 'light'); // Switch to light
  ```
- **Declarative Triggers**: Use `data-ui="#targetId"` on buttons to toggle `active` on dialogs, menus, overlays, and snackbars without imperative JS.

---

## 5. Domain & Accessibility Standards
1. **Mode Badge**: `<ModeBadge />` only displays in **`mock`** data mode (subtle red chip). Hidden in production / **`firebase`** mode.
2. **Neutral Logout Button**: Use clean neutral outlined buttons (`button.border.round`) rather than solid red fills (`.error`).
3. **Loading States**: Never use radial spinners (`progress.circle`). Build responsive **Skeleton Loaders** for content views, or use Beer CSS's animated shape indicator (`<div className="shape loading-indicator extra" role="status" />`) for generic transitions.
4. **Touch Targets**: Minimum $48\text{px} \times 48\text{px}$ touch target area for mobile usability.
5. **Safe Areas**: Honor `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.
