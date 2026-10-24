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
2. **UI Framework**: Use [Beer CSS](https://www.beercss.com/) semantic classes and Material Design 3 patterns. Avoid adding arbitrary external styling libraries unless requested.
3. **Icons**: Use Material Symbols via `<i>icon_name</i>` (e.g., `home`, `inventory_2`, `settings`, `checkroom`).
4. **Mobile First**: Prioritize responsive touch targets ($\ge 48\text{px}$), adaptive tab layouts, and safe areas on mobile screens.
5. **Validation**: After modifying code, always verify by running `pnpm build` (`tsc -b && vite build`) to ensure type safety and bundling pass without errors.
