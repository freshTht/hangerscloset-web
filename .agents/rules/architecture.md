# Architecture & Project Structure

## Directory Structure
```
hangerscloset-web/
├── .agents/                    # Centralized workspace agent customizations
│   ├── rules/                  # Modular agent rules & single source of truth
│   │   ├── overview.md         # Project summary, tech stack & environment modes
│   │   ├── ui.md               # Beer CSS native-first, custom units & styling standards
│   │   ├── development.md      # pnpm, validation tests, TypeScript & git rules
│   │   ├── environment-and-security.md # Env var rules, public VITE_ keys & secret prevention
│   │   └── architecture.md     # Layout shell, routing & data architecture
│   └── skills/                 # Workspace Firebase & development skills
├── .cursor/rules/              # Thin Cursor IDE adapters delegating to .agents/rules/
├── .context/
│   └── pending-features/      # Scored feature specifications & roadmap backlog
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
    │   ├── InventorySheet.tsx  # Add/Edit clothing item responsive side/bottom sheet
    │   ├── OptionPicker.tsx    # Docked single-select picker with dynamic adding
    │   ├── TagPicker.tsx       # Docked multi-tag picker with chip tags
    │   ├── Stack.tsx           # Flexbox stack component (orientation, gap, Beer CSS margin/padding)
    │   └── Layout.tsx          # App shell layout (Header + responsive main content)
    ├── data/
    │   └── mockInventory.ts    # Pre-populated mock clothing item records
    ├── types/
    │   └── inventory.ts        # Types: InventoryItem, InventoryStatus, RentalPrices
    ├── services/               # Service layer & repository pattern (Mock & Firebase)
    └── pages/
        ├── HomePage.tsx        # Placeholder home page ('/')
        ├── InventoryPage.tsx   # Inventory grid with floating add toolbar ('/inventory')
        ├── SettingsPage.tsx    # App preferences with dark mode switch ('/settings')
        ├── LoginPage.tsx       # Google sign-in page ('/login')
        └── UnauthorizedPage.tsx# Access-denied page ('/unauthorized')
```

## Routing & App Shell
Routing is managed by `react-router-dom` using `BrowserRouter`.

- Root layout route: `Layout` component wraps all view routes.
- Child routes:
  - `/` &rarr; `HomePage`: Simple placeholder.
  - `/inventory` &rarr; `InventoryPage`: Responsive grid of rental clothing items with floating add toolbar.
  - `/settings` &rarr; `SettingsPage`: App preferences containing dark mode switch.
  - `/login` &rarr; `LoginPage`: Google authentication page.
  - `/unauthorized` &rarr; `UnauthorizedPage`: Access restricted page.
  - `*` &rarr; Fallback redirect to `/` via `<Navigate to="/" replace />`.

## Navigation Model
- **Small Screens ($\le 600\text{px}$)**:
  - Mobile Top App Bar with fixed sticky behavior (`<header className="fixed surface top s">`).
  - Displays centered hanger icon (`checkroom`) in top app bar and Beer CSS default tabs (`<nav className="tabs s">`) below with active indicator underlines.
  - No left navigation rail is shown.
- **Medium & Large Screens ($> 600\text{px}$)**:
  - Top header is hidden.
  - Navigation switches to a compact Left Navigation Rail (`<nav className="left m">`).
  - Hanger icon (`checkroom`) is top-aligned, while tab navigation links are centered in the rail.
- **Theme Switching**: Dark mode toggle is located in Settings (`SettingsPage.tsx`) using Beer CSS's `<label className="switch icon">`.

- **Data Layer & Status Model**:
  Components consume inventory and auth through environment-switched service factories (`src/services/environmentFactory.ts`) rather than direct SDK calls, enabling seamless swapping between mock memory storage and live Firebase.
- **Rental Price Model**:
  ```ts
  interface RentalPriceTier {
    durationDays: number; // e.g. 1, 3, 5, 7
    price: number;        // in Thai Baht (฿)
  }
  type RentalPrices = RentalPriceTier[];
  ```
  Apparel items support arbitrary rental durations sorted by days ascending. The Add/Edit sheet provides dynamic tier controls (add, edit, remove) with preset defaults (`1`, `3`, `5` days).
- **Status Model**:
  ```ts
  type InventoryStatus = 'available' | 'reserved' | 'laundry';
  ```
  - `available` (พร้อมเช่า): Available for booking.
  - `reserved` (จองแล้ว / รอของ): Currently booked or on hold.
  - `laundry` (ส่งซัก / รอตรวจ): In inspection or cleaning lifecycle (reserved for feature [`feat-06`](file:///Users/fresh/Developers/_projects/_web/hangerscloset-web/.context/pending-features/06-return-laundry-and-inspection-lifecycle.md)).
