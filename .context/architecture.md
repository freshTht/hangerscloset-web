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
Displays a single item card with responsive layout adaptation:
- **Mobile (`s`)**: Compact horizontal row card (160px in height) with photo on the left (120px * 160px at 3:4 aspect ratio, full height) and compacted metadata on the right.
- **Desktop (`m / l`)**: Vertical card in responsive grid with photo on top (3:4 aspect ratio) and metadata below.
- **Card Content**:
  - **Photo**: Lazy-loaded image (`loading="lazy"`) from Unsplash with exact 3:4 aspect ratio on both mobile and desktop.
  - **Header**: Top row with item code (`secondary-text`) and status chip (`พร้อมเช่า`, `จองแล้ว`, `ส่งซัก`), followed by outfit name across the full width without rounded corner clipping.
  - **Attributes**: Brand (แบรนด์), Color (สี), Size (ไซส์) in a clean inline attribute list.
  - **Rental Prices**: Compact 3-column pill for 1 วัน, 3 วัน, and 5 วัน rental durations.

### InventoryPage (`src/pages/InventoryPage.tsx`)
- Renders a Beer CSS responsive grid (`<div className="grid">`).
- Column sizing: 1 col on `s` ($\le 600px$), 2 cols on $601-767px$, 3 cols starting at 768px, 4 cols on large screens ($\ge 993px$).
- Top header text removed for a clean catalog presentation.
- Bottom floating toolbar using 100% native Beer CSS classes: centered on small screens (`.fixed.bottom.center.margin.front.s`) and right-aligned on medium/large screens (`.fixed.bottom.right.margin.front.m.l`), pairing a toolbar pill (total item count `{count} ชุด`, edit button `edit`, and sorting button `sort`) with a circular primary Add FAB (`add`).
- Responsive placeholder dialog: displays as a bottom sheet (`dialog.bottom.medium-padding.s`) on small screens and as a default centered modal dialog (`dialog.medium-padding.m.l`) on medium/large screens.
