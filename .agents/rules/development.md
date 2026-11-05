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
- `pnpm lint`: Runs ESLint across all TypeScript and React files (`eslint .`).
- `pnpm lint:fix`: Automatically fixes fixable lint violations (`eslint . --fix`).
- `pnpm preview`: Locally previews the production build.
- `pnpm update:beercss-docs`: Synchronizes version-bound Beer CSS documentation into `.agents/rules/references/beercss.md`. Runs automatically on `postinstall`.

## Code Quality & Verification
- **Validation**: After modifying code, always verify by running `pnpm lint && pnpm test && pnpm build` to ensure linting, unit tests, and production bundling pass without errors.
- **TypeScript & Code Style Standards**:
  - **No Nested Ternaries**: Strictly avoid nested ternary expressions (`a ? b ? c : d : e`). Mechanically enforced via ESLint's `no-nested-ternary: "error"`. Replace nested conditions with:
    - Pure helper functions with `switch-case` (e.g. for discrete status, duration, or tier values).
    - Guard clauses with early returns (`if (...) return ...;`).
  - **Component Render Trees**: Avoid deep top-level JSX conditional rendering trees (e.g. `loading ? <Skeleton /> : error ? <Error /> : ...`). Extract dedicated sub-render helper functions like `renderContent()` that use early returns for loading, error, and view-mode branches.
  - **Zero Double Type Assertions**: Avoid `as unknown as Type` casts. Model types accurately with union types, discriminated unions, or optional legacy fields on incoming data objects.
  - **TypeScript Strict Mode**: TypeScript is configured in strict mode (`tsconfig.json`).
  - **Component Architecture**: Prefer functional components with typed props; keep components modular and single-responsibility.
  - **Module Imports**: Maintain path aliases and standard module imports.

## Environment Variables & Security
- **Follow `environment-and-security.md`**: Refer to [`.agents/rules/environment-and-security.md`](environment-and-security.md) for full policy.
- **Rule for New Env Vars**: Any agent proposing to add a new environment variable MUST research sensitivity, formulate client vs. server exposure recommendations, and confirm with the human author before adding it.
- **`VITE_*` Variables**: Shipped to client bundle. Only public configuration (e.g. Firebase client keys, provider flags) are permitted. Never use `VITE_` for secret keys.

## Git Conventions & Branching Strategy
- **No Auto-Committing**: Do NOT automatically commit changes at the end of each turn. Only make git commits when explicitly requested by the user.
- **Production Branch (`production/netlify`)**:
  - `production/netlify` is the dedicated production deployment branch connected to Netlify hosting (builds via `pnpm run build:firebase`).
  - **Never commit directly** to `production/netlify`, as any push to this branch triggers an automated live deployment.
  - **Never merge feature branches directly** into `production/netlify`.
  - **Always merge feature branches into `main` first**, verify tests and builds on `main`, and only then merge `main` into `production/netlify`.
  - **Keep `main` and `production/netlify` in sync**: `production/netlify` should mirror `main` once features on `main` are approved for production.
- Maintain a clean working directory.
- Avoid committing build artifacts (`dist/`, `*.tsbuildinfo`, `node_modules`).
- Commit messages should follow conventional commit formatting:
  - `feat: ...` for new features
  - `fix: ...` for bug fixes
  - `docs: ...` for documentation
  - `refactor: ...` for refactoring without behavior change
  - `style: ...` for UI/CSS adjustments
  - `test: ...` for adding or updating tests
