# Hanger's Closet Web — Agent Guidelines

All canonical rules, conventions, and architectural standards live in [`.agents/rules/`](.agents/rules/). 

AI assistants must read the relevant module before writing or modifying code:

| Rule Module | Scope & Topics |
| :--- | :--- |
| **[Overview](.agents/rules/overview.md)** | Tech stack (React 19, Vite 6, Beer CSS 3), philosophy, and modes (`mock` vs `firebase`). |
| **[UI Guidelines](.agents/rules/ui.md)** | Beer CSS native-first, `hc-*` namespace, `pt`/`px` units, loading states, and $\ge 48\text{px}$ touch targets. |
| **[Development Conventions](.agents/rules/development.md)** | Strict `pnpm`, verification (`pnpm lint && pnpm test && pnpm build`), TypeScript standards, and git policy. |
| **[Environment & Security](.agents/rules/environment-and-security.md)** | Env variable rules, public `VITE_*` limits, secret prevention, and zero-trust data access. |
| **[Architecture](.agents/rules/architecture.md)** | App shell, responsive navigation ($\le 600\text{px}$ vs $> 600\text{px}$), routing, and service factories. |
| **[Beer CSS Reference](.agents/rules/references/beercss.md)** | Version-pinned Beer CSS semantic elements, helpers, and utility classes. |

> **Universal Rule**: Always verify your changes by running `pnpm lint`, `pnpm test`, and `pnpm build` before completing any task. Do not auto-commit changes.
