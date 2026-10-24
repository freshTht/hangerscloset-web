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
        ├── HomePage.tsx        # Home tab placeholder ('/')
        ├── InventoryPage.tsx   # Inventory grid — renders InventoryCard for each item ('/inventory')
        └── SettingsPage.tsx    # Settings tab with dark mode switch ('/settings')
```

## Routing Setup
Routing is managed by `react-router-dom` using `BrowserRouter`.

- Root layout route: `Layout` component wraps all view routes.
- Child routes:
  - `/` &rarr; `HomePage`: Default landing page and activity overview.
  - `/inventory` &rarr; `InventoryPage`: Responsive grid of rental clothing items, each rendered as an `InventoryCard`.
  - `/settings` &rarr; `SettingsPage`: App preferences, account, and configuration.
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
  code: string;       // e.g. "HC-001"
  brand: string;
  color: string;
  size: string;       // e.g. "XS", "S", "M", "L"
  imageUrl: string;
  rentalPrices: RentalPrices;
  status: InventoryStatus;
}
```

### Mock Data (`src/data/mockInventory.ts`)
- 30 pre-populated `InventoryItem` records representing rental clothing (dresses, gowns, suits, jumpsuits, etc.).
- Brands include: Asava, Disaya, Sretsis, Kloset, Self-Portrait, Zimmermann, Reformation, Theory, etc.
- Prices are in Thai Baht (฿), ranging from ฿700 to ฿7,600 depending on duration.
- Statuses are mixed: `available`, `reserved`, `laundry`.

### InventoryCard Component (`src/components/InventoryCard.tsx`)
Displays a single item card with:
- **Photo**: Lazy-loaded image (`loading="lazy"`) from Unsplash.
- **Name & Code**: Item name as `h5`, item code as secondary text.
- **Attributes**: Brand (แบรนด์), Color (สี), Size (ไซส์) in a label/value row layout.
- **Rental Prices (ราคาเช่า)**: Formatted in Thai Baht (฿) for 1 วัน, 3 วัน, and 5 วัน durations.
- **Status Chip**: Beer CSS color chip (`green`, `orange`, `blue`) for `พร้อมเช่า` (available), `จองแล้ว` (reserved), `ส่งซัก` (laundry) respectively.

### InventoryPage (`src/pages/InventoryPage.tsx`)
- Renders a Beer CSS responsive grid (`<div className="grid">`).
- Column sizing: `s12 m6 l4` — full width on mobile, 2-col on medium, 3-col on large.
- Displays item count from `mockInventory.length` in the page header (ทั้งหมด X ชุดในตู้เสื้อผ้า).
