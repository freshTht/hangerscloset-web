# Project Context for AI Agents

Welcome to `hangerscloset-web`. Detailed project context and operational guides are organized modularly in the [`.context/`](.context/) directory. Cursor loads those modules through [`.cursor/rules/`](.cursor/rules/).

- [Project Overview](.context/overview.md) &mdash; Project summary, goals, and technology stack.
- [Architecture & Routing](.context/architecture.md) &mdash; Directory layout, React Router setup, and component hierarchy.
- [UI & Design Guidelines](.context/ui-guidelines.md) &mdash; Beer CSS (Material Design 3), theming, iconography, and mobile usability standards.
- [Development Conventions](.context/conventions.md) &mdash; Tooling, pnpm workflows, TypeScript standards, and git guidelines.

## Quick Summary
- **Stack**: Vite + React 19 + TypeScript + pnpm + Beer CSS + React Router v7
- **Pages**: Home (`/`), Inventory (`/inventory`), Settings (`/settings`)
- **Inventory**: 30 mock rental clothing items (`InventoryItem`), rendered as `InventoryCard` in a responsive `s12 m6 l4` grid. Statuses: `available` | `reserved` | `laundry`.
- **Theme**: Light / Dark mode via Beer CSS `ui('mode')`
- **Mobile First**: Prioritize touch targets ($\ge 48\text{px}$) and responsive tab layouts
- **No Auto-Committing**: Do NOT create git commits automatically unless explicitly requested by the user.
