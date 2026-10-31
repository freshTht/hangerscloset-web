# Development & Workflow Conventions

## Package Management
- **Strictly use `pnpm`**: Do not use `npm` or `yarn` directly to avoid inconsistent lockfiles.
- Dependency commands:
  - Install dependencies: `pnpm install`
  - Add dependency: `pnpm add <package>`
  - Add dev dependency: `pnpm add -D <package>`

## Development Scripts
- `pnpm dev`: Starts the Vite development server in mock mode with hot module replacement (HMR).
- `pnpm dev:mock`: Starts Vite explicitly in mock mode.
- `pnpm dev:firebase`: Starts Vite in Firebase mode.
- `pnpm build`: Runs `tsc -b` followed by `vite build --mode mock`.
- `pnpm build:mock`: Production build against mock data.
- `pnpm build:firebase`: Production build against Firebase.
- `pnpm test`: Runs Vitest test suites once (`vitest run`).
- `pnpm test:watch`: Runs Vitest in interactive watch mode.
- `pnpm preview`: Locally previews the production build.
- `pnpm update:beercss-docs`: Synchronizes version-bound Beer CSS documentation into `.agents/rules/references/beercss.md`. Runs automatically on `postinstall`.

## Code Quality & Verification
- **Validation**: After modifying code, always verify by running `pnpm test` and `pnpm build` (`tsc -b && vite build`) to ensure type safety and bundling pass without errors.
- **TypeScript Standards**:
  - TypeScript is configured in strict mode (`tsconfig.json`).
  - Prefer functional components with typed props.
  - Keep components modular and single-responsibility.
  - Maintain path aliases and standard module imports.

## Environment Variables & Security
- **Follow `environment-and-security.md`**: Refer to [`.agents/rules/environment-and-security.md`](environment-and-security.md) for full policy.
- **Rule for New Env Vars**: Any agent proposing to add a new environment variable MUST research sensitivity, formulate client vs. server exposure recommendations, and confirm with the human author before adding it.
- **`VITE_*` Variables**: Shipped to client bundle. Only public configuration (e.g. Firebase client keys, provider flags) are permitted. Never use `VITE_` for secret keys.

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
  - `test: ...` for adding or updating tests
