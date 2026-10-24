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

## Git Conventions
- Maintain a clean working directory.
- Avoid committing build artifacts (`dist/`, `*.tsbuildinfo`, `node_modules`).
- Commit messages should follow conventional commit formatting:
  - `feat: ...` for new features
  - `fix: ...` for bug fixes
  - `docs: ...` for documentation
  - `refactor: ...` for refactoring without behavior change
  - `style: ...` for UI/CSS adjustments
