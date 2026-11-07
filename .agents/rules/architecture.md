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
    ├── index.css               # Global responsive tweaks & core variables
    ├── components/             # Reusable UI components with colocated .css
    │   ├── BookingCalendar.tsx # Monthly grid calendar with rental/cleaning turns
    │   ├── BookingCard.tsx     # Booking item card with line items and status progression
    │   ├── BookingInventoryCard.tsx # Unified inventory status & reserve/booking card
    │   ├── BookingSheet.tsx    # Multi-step booking creation & edit modal wizard
    │   ├── CustomerPicker.tsx  # Customer selection and inline creation dropdown
    │   ├── EmptyState.tsx      # Standardized empty state presentation
    │   ├── GoogleSignInButton.tsx # Material design Google sign-in button
    │   ├── Header.tsx          # Top app bar (mobile) & rail branding
    │   ├── InventoryCard.tsx   # Card component displaying a single inventory item
    │   ├── InventoryFilterSheet.tsx # Advanced inventory filter bottom/side sheet
    │   ├── InventorySheet.tsx  # Add/Edit clothing item responsive side/bottom sheet
    │   ├── InventorySortDialog.tsx  # Inventory sorting dialog
    │   ├── Layout.tsx          # App shell layout (Header + responsive main content)
    │   ├── LazyImage.tsx       # Intersection-observer lazy loaded image with shimmer
    │   ├── MaterialShapesBackground.tsx # Organic material decorative background shapes
    │   ├── ModeBadge.tsx       # Subtle badge visible only in mock data mode
    │   ├── OptionPicker.tsx    # Docked single-select picker with dynamic adding
    │   ├── ProtectedRoute.tsx  # Auth & allowlist access guard
    │   ├── Skeleton.tsx        # Responsive skeleton shimmer loading placeholder
    │   ├── Stack.tsx           # Flexbox stack component (orientation, gap, margin/padding)
    │   ├── StatusBadge.tsx     # Color-coded rental lifecycle status badge
    │   └── TagPicker.tsx       # Docked multi-tag picker with chip tags
    ├── contexts/               # React contexts (AuthContext, RepositoryContext)
    ├── hooks/                  # Custom hooks (useBookings, useInventory, useCustomers, useIsMobile)
    ├── lib/                    # Shared utilities (firebase, date helpers, image resizing)
    ├── data/
    │   └── mockInventory.ts    # Pre-populated mock clothing item records
    ├── types/
    │   ├── booking.ts          # Booking domain models, statuses & lifecycle transitions
    │   ├── customer.ts         # Customer domain model
    │   └── inventory.ts        # Types: InventoryItem, InventoryStatus, RentalPrices
    ├── services/               # Service layer & repository pattern (Mock & Firebase)
    └── pages/
        ├── HomePage.tsx        # Placeholder home page ('/')
        ├── BookingsPage.tsx    # Bookings list and calendar view ('/bookings')
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
  - `/bookings` &rarr; `BookingsPage`: Rental bookings management with List and Calendar views.
  - `/inventory` &rarr; `InventoryPage`: Responsive grid of rental clothing items with floating add toolbar.
  - `/settings` &rarr; `SettingsPage`: App preferences containing dark mode switch.
  - `/login` &rarr; `LoginPage`: Google authentication page.
  - `/unauthorized` &rarr; `UnauthorizedPage`: Access restricted page.
  - `*` &rarr; Fallback redirect to `/` via `<Navigate to="/" replace />`.

## Navigation Model & Android 12 Two-Tone Layout
- **Android 12 Two-Tone Shell**:
  - The outer viewport shell and navigation bars are always solid pitch black (`#000000`).
  - The content area (`main.responsive`) uses dynamic theme surface (`var(--surface)`), filling full height and width with internal scrolling (`overflow-y: auto`), clipped to smooth Material 3 / Android 12 border-radii (`28px`).
  - **Full-Viewport Modal & Sheet Scrim**: Modals, bottom sheets, and their backdrop overlays (`.overlay`, `dialog::backdrop`) render at `z-index: 1000+`, covering the entire viewport including the black top bar / left rail, following native Android 12 UX.
- **Small Screens ($\le 600\text{px}$)**:
  - Mobile Top Navigation Bar (`<header className="top s hc-top-header">`) is always black (`#000000`) with tabs (`.tabs.s`).
  - Content area (`main.responsive`) takes full remaining height (`flex: 1; min-height: 0;`), with top corners clipped to `border-top-left-radius: 28px; border-top-right-radius: 28px;`.
  - No left navigation rail is shown.
- **Medium & Large Screens ($> 600\text{px}$)**:
  - Top header is hidden.
  - Navigation switches to a Left Navigation Rail (`<nav className="left m l">`) which is always black (`#000000`).
  - Hanger icon (`checkroom`) is top-aligned, and tab navigation links are centered vertically.
  - Content area (`main.responsive`) takes full height (`100dvh`) and remaining width (`flex: 1; min-width: 0;`), with left corners facing the rail clipped to `border-top-left-radius: 28px; border-bottom-left-radius: 28px;`.
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
