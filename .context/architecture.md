# Architecture & Project Structure

## Directory Structure
```
hangerscloset-web/
├── .context/                   # Agent-agnostic project context documentation
│   ├── overview.md             # High-level overview & tech stack
│   ├── architecture.md         # Directory structure & routing architecture
│   ├── ui-guidelines.md        # Beer CSS patterns & responsive design rules
│   └── conventions.md          # Tooling, package management & development rules
├── GEMINI.md                   # Antigravity-specific workspace rules & context loader
├── AGENTS.md                   # Agent-agnostic workspace context loader
├── index.html                  # HTML entry point with viewport & theme setup
├── package.json                # Dependencies, scripts, and build configuration
├── pnpm-lock.yaml              # Strict dependency lockfile
├── tsconfig.json               # TypeScript compiler configuration
├── vite.config.ts              # Vite bundler configuration
└── src/
    ├── main.tsx                # Application bootstrap (Beer CSS & root render)
    ├── App.tsx                 # Router definition & route mapping
    ├── index.css               # Global responsive tweaks & animations
    ├── components/
    │   ├── Header.tsx          # Top bar with simple text brand & Navigation tabbed
    │   └── Layout.tsx          # App shell layout (Header + responsive main content)
    └── pages/
        ├── HomePage.tsx        # Home tab placeholder ('/')
        ├── InventoryPage.tsx   # Inventory tab placeholder ('/inventory')
        └── SettingsPage.tsx    # Settings tab with dark mode switch ('/settings')
```

## Routing Setup
Routing is managed by `react-router-dom` using `BrowserRouter`.

- Root layout route: `Layout` component wraps all view routes.
- Child routes:
  - `/` &rarr; `HomePage`: Default landing page and activity overview.
  - `/inventory` &rarr; `InventoryPage`: Wardrobe items, categories, and inventory controls.
  - `/settings` &rarr; `SettingsPage`: App preferences, account, and configuration.
  - `*` &rarr; Fallback redirect to `/` via `<Navigate to="/" replace />`.

## Navigation Model
- **Small Screens ($\le 600\text{px}$)**:
  - Mobile Top App Bar with fixed sticky behavior (`<header className="fixed surface top s">`).
  - Displays centered hanger icon (`checkroom`) in the top app bar and Beer CSS default tabs (`<nav className="tabs s">`) below with active indicator underlines.
  - No left navigation rail is shown.
- **Medium Screens ($601\text{px} \text{ and above}$)**:
  - Top header is hidden.
  - Navigation switches to a compact Left Navigation Rail (`<nav className="left m">`).
  - Hanger icon (`checkroom`) is top-aligned, while tab navigation links are middle-aligned in the center of the rail.
- **Theme Switching**: Dark mode toggle is located in the Settings page (`SettingsPage.tsx`) using Beer CSS's `<label className="switch icon">`.
