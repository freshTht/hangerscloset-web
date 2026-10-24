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
- The navigation bar is placed inside `<header className="fixed surface top">`.
- It consists of:
  1. **Brand Title**: Simple text ("Hanger's Closet") without icon (ready for future logo image).
  2. **Navigation Tabbed**: Follows Beer CSS's `<nav className="tabbed">` pattern with React Router's `<NavLink>`. Active route styling is handled automatically via `.active` class assignment.
- **Theme Switching**: Dark mode toggle is located in the Settings page (`SettingsPage.tsx`) using Beer CSS's `<label className="switch icon">`.
