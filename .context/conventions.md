# Development Conventions & Workflows

## Package Management
- **Strictly use `pnpm`**: Do not use `npm` or `yarn` directly to avoid inconsistent lockfiles.
- Dependency commands:
  - Install dependencies: `pnpm install`
  - Add dependency: `pnpm add <package>`
  - Add dev dependency: `pnpm add -D <package>`

## Development Scripts
- `pnpm dev`: Starts the Vite development server with hot module replacement (HMR).
- `pnpm build`: Runs `tsc -b` (TypeScript typecheck) followed by `vite build` to generate the production bundle in `dist/`.
- `pnpm preview`: Locally previews the production build.

## TypeScript Standards
- TypeScript is configured in strict mode (`tsconfig.json`).
- Prefer functional components with explicit `React.FC` typings or typed props.
- Keep components modular and single-responsibility.
- Path aliases: standard relative imports or Vite-configured paths.

## UI & Styling Conventions
- **Beer CSS First**: Always check and use what Beer CSS provides out-of-the-box before introducing custom CSS.
- Combine Beer CSS semantic elements (`<header>`, `<nav>`, `<main>`, `<article>`) and utility classes (`fixed`, `bottom`, `center`, `margin`, `front`, `elevate`, `space`, `extra-space`) to achieve layouts and floating controls.
- **No Manual `fontSize` in Style Attributes**: Do NOT use `fontSize` (or font sizing styles) inside inline `style={{ ... }}` attributes. Always use Beer CSS typography classes (`h1`–`h6`, `.small`, `.large`, `.small-text`, `.medium-text`, `.large-text`) or pre-declared generic CSS classes (e.g. `.micro-text`, `.status-badge.small`) in stylesheet files so typography remains consistent and reusable.
- Do NOT write custom CSS overrides or classes when Beer CSS utility helpers exist for the use case.

## Git Conventions
- **No Auto-Committing**: Do NOT automatically commit changes at the end of each turn. Only make git commits when explicitly requested by the user.
- Maintain a clean working directory.
- Avoid committing build artifacts (`dist/`, `*.tsbuildinfo`, `node_modules`).
- Commit messages should follow conventional commit formatting:
  - `feat: ...` for new features
  - `fix: ...` for bug fixes
  - `docs: ...` for documentation
  - `refactor: ...` for refactoring without behavior change
  - `style: ...` for UI/CSS adjustments
