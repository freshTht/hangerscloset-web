# Feature 02: Inventory Search, Multi-Facet Filtering & Sorting

- **Priority**: Rank #2 (Quick Win / High Value)
- **RICE Score**: **9.5** (Reach: 10, Impact: 2, Confidence: 95%, Effort: 2.0)
- **Status**: Ready for `/plan`

---

## 1. Problem Statement & Business Benefit
As the wardrobe collection grows past 40+ items into hundreds of designer pieces, staff and customers struggle to find matching outfits for specific events (e.g. "Pink dress size S under 500฿" or "Avaalene beach dress"). Currently, the catalog is ordered strictly by item code, and the bottom toolbar `sort` button is a placeholder.

### Key Benefits:
- **Instant Discovery**: Enables real-time keyword search across SKU code, item name, brand, color, tags, and notes.
- **Multi-Facet Filter Sheet**: Filters simultaneously by multiple facets (Brands, Sizes, Colors, Tags, Price ranges).
- **Activates Sort Control**: Replaces the dummy toolbar `sort` button with comprehensive sorting (Code, Name, Price low/high, Most popular).
- **Active Filter Chips**: Displays dismissible filter chips at the top of the catalog with a "Clear all" button.

---

## 2. User Scenarios & UX Flow

### A. Searching
1. Staff types "Pink" or "Serlyn" in a top search bar or clicks search.
2. The catalog instantly filters matching items with 0ms network latency (client-side memoized filter for responsive feel).
3. Matched query highlights or count indicator updates (e.g. `แสดง 4 จาก 43 รายการ`).

### B. Multi-Facet Filter Sheet
1. User clicks the Filter button (`tune` icon) in the toolbar.
2. A responsive filter sheet opens:
   - On mobile (`s`): Bottom sheet (`dialog.bottom.s`).
   - On desktop (`m++`): Right-side sheet (`dialog.right.medium.m.l`) or centered dialog.
3. User selects multiple sizes (`[S] [M]`), color pills (`[Pink] [White]`), and maximum 1-day price (`< 500฿`).
4. User clicks **"ดูผลลัพธ์ (6 รายการ)"**; sheet closes and grid displays only matching items.

### C. Sorting
1. User taps the `sort` button in the bottom floating toolbar.
2. A bottom sheet or dropdown appears with options:
   - **รหัสสินค้า (A &rarr; Z)** (Default)
   - **ชื่อสินค้า (ก &rarr; ฮ / A &rarr; Z)**
   - **ราคาเช่า: ต่ำ &rarr; สูง** (1 วัน)
   - **ราคาเช่า: สูง &rarr; ต่ำ** (1 วัน)
   - **แบรนด์ (A &rarr; Z)**
3. Selecting an option immediately reorders the grid with smooth layout transition.

---

## 3. Data Structure & State Management

```ts
export type SortOption =
  | 'code_asc'
  | 'code_desc'
  | 'name_asc'
  | 'price_one_day_asc'
  | 'price_one_day_desc'
  | 'brand_asc';

export interface CatalogFilterState {
  searchQuery: string;
  selectedBrands: string[];
  selectedColors: string[];
  selectedSizes: string[];
  selectedTags: string[];
  maxPriceOneDay?: number;
  availableOnly?: boolean;
}
```

### Pure Selector Hook
```ts
export function useFilteredInventory(
  items: InventoryItem[],
  filter: CatalogFilterState,
  sort: SortOption
): InventoryItem[] {
  // Memoized multi-stage filtering: Search -> Facets -> Sort
}
```

---

## 4. UI Implementation Guidelines (Beer CSS)
- **Filter Sheet**:
  - Small screen (`s`): `<dialog className="bottom s active">`
  - Medium/Large (`m++`): `<dialog className="right medium m l active">`
- **Filter Chips**:
  - Multi-select chips for sizes and tags: `<span className="chip border ...">` toggling to `<span className="chip fill ...">`.
- **Toolbar Integration**:
  - Add filter count badge over the filter icon: e.g. `<i>tune</i><span className="badge circle small primary">3</span>`.
  - Connect the existing `sort` button in [`src/pages/InventoryPage.tsx`](file:///Users/fresh/Developers/_projects/_web/hangerscloset-web/src/pages/InventoryPage.tsx).

---

## 5. Acceptance Criteria
- [ ] Clicking the `sort` button in the floating toolbar displays sorting options and reorders items.
- [ ] Search query filters by SKU, name, brand, color, tags, and notes in real time.
- [ ] Multi-select facets (Size, Color, Brand, Tags) work combinatorially (AND/OR logic).
- [ ] Active filter chips are rendered above the catalog and can be cleared individually or all at once.
- [ ] Works identically across both mock mode and Firebase mode.
- [ ] Automated tests cover filtering and sorting permutations.

---

## 6. Agent Kickoff Prompt
```text
Please implement Feature 02: Inventory Search, Multi-Facet Filtering & Sorting as specified in .context/pending-features/02-inventory-search-sorting-and-filtering.md.
First, run /plan to design the filter state model, sorting selector hooks, toolbar integrations in InventoryPage, and the responsive FilterSheet dialog. Follow native Beer CSS classes and ensure all tests pass.
```
