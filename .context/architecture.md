# Architecture & Project Structure

## Directory Structure
```
hangerscloset-web/
├── .context/                   # Agent-agnostic project context documentation
│   ├── overview.md             # High-level overview & tech stack
│   ├── architecture.md         # Directory structure & routing architecture
│   ├── ui-guidelines.md        # Beer CSS patterns & responsive design rules
│   └── conventions.md          # Tooling, package management & development rules
├── .cursor/rules/              # Cursor project rules that @-link into .context/
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
    │   ├── InventoryCard.tsx   # Card component displaying a single inventory item
    │   └── Layout.tsx          # App shell layout (Header + responsive main content)
    ├── data/
    │   └── mockInventory.ts    # 30 mock InventoryItem records (dresses, gowns, suits, etc.)
    ├── types/
    │   └── inventory.ts        # TypeScript types: InventoryItem, InventoryStatus, RentalPrices
    └── pages/
        ├── HomePage.tsx        # Simple "Coming soon" placeholder ('/')
        ├── InventoryPage.tsx   # Inventory grid with floating add toolbar ('/inventory')
        └── SettingsPage.tsx    # Settings tab with dark mode switch ('/settings')
```

## Routing Setup
Routing is managed by `react-router-dom` using `BrowserRouter`.

- Root layout route: `Layout` component wraps all view routes.
- Child routes:
  - `/` &rarr; `HomePage`: Simple "Coming soon" placeholder.
  - `/inventory` &rarr; `InventoryPage`: Responsive grid of rental clothing items with bottom floating add toolbar.
  - `/settings` &rarr; `SettingsPage`: App preferences containing dark mode switch.
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

## Inventory Feature

### Data Model (`src/types/inventory.ts`)
```ts
type InventoryStatus = 'available' | 'reserved' | 'laundry';

interface RentalPrices {
  oneDay: number;
  threeDays: number;
  fiveDays: number;
}

interface InventoryItem {
  id: string;
  name: string;
  code: string;       // e.g. "AVL01"
  brand: string;
  color: string;
  size: string;       // e.g. "XS", "S", "M", "L"
  type?: string;      // e.g. "Dress", "Beach set2"
  accessories?: string | null;
  owner?: string | null;
  imageFile?: string; // original source filename
  imageUrl: string;
  rentalPrices: RentalPrices;
  status: InventoryStatus;
}
```

### Mock Data (`src/data/mockInventory.ts`)
- 43 pre-populated `InventoryItem` records extracted from stock data.
- Brands include: Avaalene, Bikini Girl, Chau Hy, Dieu Ann, Duex, Feelfree, Serlyn, Glitmon, Mellow, MHA, NaryStudio, Rudy.co, TBB, etc.
- Extracted local asset files in `src/assets/images/` imported statically (Vite asset pipeline with hashed filenames for caching).
- Statuses: `available` (ว่าง) and `reserved` (รอของ).

### InventoryCard Component (`src/components/InventoryCard.tsx`)
Displays a single item card with React-bound responsive layout adaptation (`useIsMobile` hook) and 100% native Beer CSS typography/styling (no custom CSS):
- **Responsive Hook (`src/hooks/useIsMobile.ts`)**: Uses `useSyncExternalStore` listening to `window.matchMedia('(max-width: 600px)')` for clean, reactive viewport adaptation.
- **Mobile (`s` $\le 600\text{px}$)**: Horizontal row layout (`article.no-padding.round.row.no-space`, dynamic height with `minHeight: 160px`) with fixed 120px width photo on the left filling full row height (`alignSelf: 'stretch'`, `objectFit: 'cover'`, matching 3:4 aspect ratio at minimum height), top block (Code + dark-mode blended Status badge, and 2-line clamped title), and bottom-aligned group (`marginTop: 'auto'`) containing wrapped Brand/Color/Size attributes and connected rental price buttons.
- **Medium & Large (`m / l` $> 600\text{px}$)**: Vertical card using native Beer CSS `<article className="no-padding round vertical">` with 1:1 square aspect ratio edge-to-edge top photo (`top-round`, `aspectRatio: '1 / 1'`), flex-stretched content body (`flex: 1`), semantic `<h6>` title, attributes, and connected rental prices buttons bottom-aligned via `marginTop: 'auto'`.
- **Typography & Beer CSS Helpers**:
  - **Title**: Semantic `<h6>` (with `small bold` on mobile) avoiding clipping.
  - **Smaller Texts**: Beer CSS `small-text` and `small` modifiers for item code, attributes with Material Symbols (`sell` for Brand, `palette` for Color, `height` for Size), and pricing labels.
  - **Status Badges**: Dual-theme adaptive badges (`.status-badge-available`, `.status-badge-reserved`, `.status-badge-laundry`) with soft translucent tints in dark mode to prevent glare.
  - **Rental Prices**: Connected button group (`nav.group.connected.max`) with `small fill` buttons (`button.small.fill`) and individual dummy click actions on each rental duration.

### InventoryPage (`src/pages/InventoryPage.tsx`)
- Renders a Beer CSS responsive grid (`<div className="grid">`).
- Column sizing: 1 col on `s` ($\le 600px$), 2 cols on medium (`m6`, 601–992px, e.g. iPad Mini portrait and landscape), 3 cols on large (`l4`, $\ge 993px$).
- Top header text removed for a clean catalog presentation.
- Bottom floating toolbar using 100% native Beer CSS classes: centered on small screens (`.fixed.bottom.center.margin.front.s`) and right-aligned on medium/large screens (`.fixed.bottom.right.margin.front.m.l`), pairing a toolbar pill (total item count `{count} ชุด`, edit button `edit`, and sorting button `sort`) with a circular primary Add FAB (`add`).
- Responsive placeholder dialog: displays as a bottom sheet (`dialog.bottom.medium-padding.s`) on small screens and as a default centered modal dialog (`dialog.medium-padding.m.l`) on medium/large screens.
