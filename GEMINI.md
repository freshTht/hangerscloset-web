# Hanger's Closet Web - Antigravity Agent Context

This file serves as the workspace context and operational guide for Antigravity agents working on `hangerscloset-web`.

Detailed, agent-agnostic project documentation is maintained in the [`.context/`](.context/) directory. Refer to the linked context modules below:

## Context Modules
- @[Project Overview](.context/overview.md) &mdash; [Overview](.context/overview.md)
- @[Architecture & Routing](.context/architecture.md) &mdash; [Architecture](.context/architecture.md)
- @[UI & Design Guidelines](.context/ui-guidelines.md) &mdash; [UI Guidelines](.context/ui-guidelines.md)
- @[Development Conventions](.context/conventions.md) &mdash; [Conventions](.context/conventions.md)

---

## Agent Operational Quick Rules
1. **Package Manager**: Always use `pnpm` (`pnpm install`, `pnpm add`, `pnpm dev`, `pnpm build`).
2. **UI Framework & Native First**: Always explore and use what [Beer CSS](https://www.beercss.com/) provides natively before writing any custom CSS. Leverage Beer CSS semantic elements (`<nav class="toolbar">`), positioning helpers (`fixed`, `bottom`, `center`), margins, elevations (`medium-elevate`), and depth (`front`). Avoid writing custom CSS unless Beer CSS fundamentally lacks the capability.
3. **Icons**: Use Material Symbols via `<i>icon_name</i>` (e.g., `home`, `inventory_2`, `settings`, `checkroom`).
4. **Mobile First**: Prioritize responsive touch targets ($\ge 48\text{px}$), adaptive tab layouts, and safe areas on mobile screens.
5. **Validation**: After modifying code, always verify by running `pnpm build` (`tsc -b && vite build`) to ensure type safety and bundling pass without errors.
6. **Git Commits**: Do NOT auto-commit changes at the end of turns. Only create git commits when the user explicitly requests one.
7. **Mode Badge**: Only show for mock data mode (`<ModeBadge />`). In Firebase/production mode, it remains hidden to keep the UI clean.
8. **Logout Button**: Use the clean neutral outlined variant (`button.border.round`) without red fill.
9. **Loading States**: Never use radial spinners (`progress.circle`). Either build a responsive Skeleton Loader matching the content cards geometry across all screen sizes or use Beer CSS `.shape.loading-indicator` for generic/transition loading.
