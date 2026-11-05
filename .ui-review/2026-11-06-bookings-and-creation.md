The Bookings tab and 3-step creation flow have strong domain logic (conflict detection, turnaround dates, and suggested pricing), but 4 blocking layout and accessibility issues—most notably overlapping calendar day cells at 390px, vertically stacked wizard footer buttons on Steps 2 and 3, an unstyled light-on-light status `<select>` in dark mode, and escaped focus behind open bottom sheets—should be fixed before shipping.

Ready to ship: no — 4 blocking findings

---

## 1. Review record

- **Scope**: Bookings tab (`/bookings` — items list view, orders list view, calendar view, top date/filter bar, filter & sort bottom sheet, floating bottom toolbar) and Booking creation/edit flow (`BookingSheet` — Step 1 outfit & date selection, Step 2 customer & pricing, Step 3 review & submit, `จองชุดนี้` quick-reserve entry, and Edit mode).
- **How opened**: Local Vite dev server (`pnpm dev --port 5173`, bound to `http://localhost:5175/bookings` in mock mode) driven via headless Chromium CDP.
- **Widths & themes checked**: `390px` (mobile narrowest) and `1280px` (desktop widest) across `dark` and `light` themes.
- **Installed design-system rules loaded**: `.agents/rules/ui.md`, `.agents/rules/architecture.md`, `.agents/rules/references/beercss.md`.
- **Lint command**: `pnpm lint` (`eslint .`) — **exit code `0`** (0 errors, 5 warnings; 3 warnings in scoped file `src/components/BookingFilterSheet.tsx:17,26,34` for `react-refresh/only-export-components`).
- **Saved captures & artifacts in `.ui-review/`**:
  - `bookings-items-390.png`, `bookings-items-1280.png`, `bookings-items-light-390.png`, `bookings-items-light-1280.png`
  - `bookings-orders-390.png`, `bookings-orders-1280.png`
  - `bookings-calendar-390.png`, `bookings-calendar-1280.png`
  - `bookings-filter-sheet-390.png`, `bookings-filter-sheet-1280.png`
  - `booking-create-step1-390.png`, `booking-create-step1-selected-390.png`, `booking-create-step1-1280.png`, `booking-create-empty-search-390.png`
  - `booking-create-step2-390.png`, `booking-create-step2-customer-error-390.png`, `booking-create-step2-1280.png`
  - `booking-create-step3-390.png`, `booking-create-step3-1280.png`
  - `booking-reserve-from-card-390.png`
  - `booking-edit-sheet-390.png`, `booking-edit-sheet-1280.png`
  - Accessibility trees: `ax-tree-bookings-items-390.json`, `ax-tree-booking-filter-sheet-390.json`, `ax-tree-booking-create-step1-390.json`, `ax-tree-booking-create-step2-390.json`, `ax-tree-booking-create-step3-390.json`, `ax-tree-booking-edit-sheet-390.json`
  - Measured probes: `probe-results.json`

---

## 2. Findings

### Blocking

#### B1. Calendar day cells overflow their 7-column tracks on mobile, causing adjacent day numbers and booking counts to collide
- **Raised by**: `review`
- **Location**: `button 'วันที่ 2026-11-01'` through `button 'วันที่ 2026-11-30'` (`bookings-calendar-390.png`), `src/components/BookingCalendar.tsx:226-298`, `src/components/BookingCalendar.css:16-44`
- **Width**: `390px`
- **Criterion**: **8. Responsive & adaptive** / **1. Eye path & grouping**
- **Why it matters**: At `390px`, each column in the 7-column calendar grid is ~41px wide, but BeerCSS's default `button` minimum width and pill border-radius (`round`) force each `.hc-booking-calendar-day-btn` to render wider than its track (~55px). As a result, Day 1's item count (`2`) overlaps Day 2's date label (`2 2`), Day 2's count overlaps Day 3 (`2 3`), and the selected highlight ring on Day 6 visually bleeds over Days 5 and 7. Staff cannot tell which number is a date and which is a booking count.
- **Evidence**: `bookings-calendar-390.png` (row 1 renders `1   2 2   2 3   3 4   3 5   5 6   5 7   5` with overlapping pills); `src/components/BookingCalendar.tsx:231` uses BeerCSS `round` (pill radius) on `<button className="round no-margin hc-booking-calendar-day-btn">`.
- **Fix (verifiable check)**: Override BeerCSS button sizing on `.hc-booking-calendar-day-btn` (`min-inline-size: 0; max-inline-size: 100%; border-radius: 10px; box-sizing: border-box; overflow: hidden;`) and replace `round` with a medium corner radius so that at `390px`, every `.hc-booking-calendar-day-btn` has `getBoundingClientRect().width <= 45px` and zero horizontal overlap (`rect[i].right <= rect[i+1].left`) across all 7 columns.

#### B2. Wizard Step 2 and Step 3 footers stack "ย้อนกลับ" vertically above the primary CTA instead of side-by-side
- **Raised by**: `review`
- **Location**: `button 'arrow_back ย้อนกลับ'` and `button 'ถัดไป: ตรวจสอบ arrow_forward'` (`booking-create-step2-390.png`, `booking-create-step2-1280.png`), `button 'ยืนยันการจอง'` (`booking-create-step3-390.png`, `booking-create-step3-1280.png`), `src/components/BookingSheet.tsx:1237,1411`, `src/components/BookingSheet.css:269-293`
- **Width**: `390px` and `1280px`
- **Criterion**: **2. Alignment & grid** / **6. Progressive disclosure**
- **Why it matters**: In Step 1 (`booking-create-step1-390.png`), `.hc-booking-sheet-footer-row` is a child inside `.hc-booking-sheet-step-footer`, placing the action buttons horizontally on one row. In Step 2 (`BookingSheet.tsx:1237`) and Step 3 (`BookingSheet.tsx:1411`), both classes are applied to the same element (`className="hc-booking-sheet-footer-row hc-booking-sheet-step-footer"`). Because `.hc-booking-sheet-step-footer` declares `flex-direction: column` and `.hc-booking-sheet-footer-row` omits `flex-direction: row`, `column` wins—stacking "ย้อนกลับ" above "ถัดไป: ตรวจสอบ" / "ยืนยันการจอง" in the center, consuming ~108px of vertical space, and clipping the scroll area above it.
- **Evidence**: `booking-create-step2-390.png`, `booking-create-step2-1280.png`, `booking-create-step3-390.png`, `booking-create-step3-1280.png`; `src/components/BookingSheet.tsx:1237` and `1411`.
- **Fix (verifiable check)**: Explicitly set `flex-direction: row` on `.hc-booking-sheet-step-footer.hc-booking-sheet-footer-row` (or nest `.hc-booking-sheet-footer-row` inside `.hc-booking-sheet-step-footer` matching Step 1) and remove BeerCSS dialog child border-radius bleeding on the footer so "ย้อนกลับ" sits on the left and the primary CTA sits on the right on the same horizontal row (`Math.abs(prevBtn.top - nextBtn.top) < 4px`) at both `390px` and `1280px`.

#### B3. Edit Booking status `<select>` renders with a raw white system background and illegible light-grey text in Dark Mode
- **Raised by**: `installed design-system rules (.agents/rules/ui.md)` and `review`
- **Location**: `combobox 'สถานะการจอง'` (`booking-edit-sheet-390.png`, `booking-edit-sheet-1280.png`), `src/components/BookingSheet.tsx:1576-1592`, `src/components/BookingSheet.css:486-490`
- **Width**: `390px` and `1280px` (Dark Mode)
- **Criterion**: **3. Typography & contrast** / **`.agents/rules/ui.md` §1 (Beer CSS Native-First)**
- **Why it matters**: In Edit mode, `<select aria-label="สถานะการจอง" className="hc-booking-sheet-status-select">` is rendered as a bare native `<select>` outside a BeerCSS `.field` container and without `background-color` / `color` theme tokens. In dark mode (especially when disabled due to a subsequent status date), Chromium renders a bright white box with pale grey text (`ส่งซัก`), failing WCAG AA 4.5:1 contrast and breaking dark mode visual hierarchy.
- **Evidence**: `booking-edit-sheet-390.png` and `booking-edit-sheet-1280.png` (middle card `สถานะการจอง (6 พ.ย.)` shows a stark white rectangle with faint `ส่งซัก` text); `src/components/BookingSheet.css:486-490`.
- **Fix (verifiable check)**: Wrap the status `<select>` in a BeerCSS `.field.small.border.round.no-margin` (with `<i>arrow_drop_down</i>`) or style `.hc-booking-sheet-status-select` with `background-color: var(--surface-container-high); color: var(--on-surface); border: 1px solid var(--outline-variant);` so that in dark mode its text contrast ratio against its background is `>= 4.5:1`.

#### B4. Open `BookingFilterSheet` and `BookingSheet` dialogs do not trap keyboard focus or restore focus to the trigger on close
- **Raised by**: `review` (Keyboard Path & Focus After Close probes)
- **Location**: `dialog 'ตัวกรองและจัดเรียงรายการจอง'` (`bookings-filter-sheet-390.png`, `src/components/BookingFilterSheet.tsx:100-120`) and `dialog 'สร้างการจองใหม่'` (`booking-create-step1-390.png`, `src/components/BookingSheet.tsx:714-720`)
- **Width**: `390px` and `1280px`
- **Criterion**: **10. Accessibility**
- **Why it matters**: Both sheets open by toggling the `open` attribute on `<dialog>` rather than calling `dialog.showModal()` or managing focus.
  1. When `BookingFilterSheet` opens, pressing `Tab` steps through background cards (`แก้ไขการจอง SEL01`, `ปรับสถานะ SEL01...`) behind the backdrop instead of moving into the filter sheet (`insideFilterDialog: false` for all 6 Tab stops in `probe-results.json`).
  2. `BookingSheet` (`#booking-sheet`) is missing `aria-modal="true"`, and when closed with `Escape`, `document.activeElement` drops to `<body>` instead of returning to the trigger button (`สร้างการจองใหม่` or `แก้ไขการจอง`).
- **Evidence**: `probe-results.json` (`keyboardProbes.filterSheetTabStops` shows all 6 `Tab` presses land on background card buttons with `insideFilterDialog: false`; `focusAfterCloseProbes.afterBookingSheetEscape` shows `activeTag: "BODY"`).
- **Fix (verifiable check)**: Add `aria-modal="true"` to `#booking-sheet`, move initial focus into the dialog when `isOpen` becomes `true`, trap `Tab` / `Shift+Tab` within the active `<dialog>`, and restore focus to the previously focused trigger element upon close so `document.activeElement` is inside the dialog on first `Tab` and returns to the trigger button after `Escape`.

---

### Should-Fix

#### S1. Booked item cards (`BookingInventoryCard`) render two identical "แก้ไขการจอง" icon buttons on the same card
- **Raised by**: `review`
- **Location**: `button 'แก้ไขการจอง SEL01'` (top-right header and bottom-right action row in `bookings-items-390.png` and `bookings-items-1280.png`), `src/components/BookingInventoryCard.tsx:115-128` and `228-246`
- **Width**: `390px` and `1280px`
- **Criterion**: **4. Visual weight & emphasis** / **10. Accessibility**
- **Why it matters**: Every booked item card in the default "Items" view renders an edit pencil button in the top-right header (`BookingInventoryCard.tsx:115`) AND a second identical edit pencil button in the bottom-right footer (`BookingInventoryCard.tsx:229`) with the exact same `aria-label="แก้ไขการจอง ${item.code}"` and `onClick` handler. This doubles the Tab stops per card for keyboard/screen-reader users and adds visual clutter next to the primary status-advance CTA.
- **Evidence**: `bookings-items-390.png`, `bookings-items-1280.png`; `probe-results.json` (`duplicateControls.bookingsItemsView` lists 2 instances each for `SEL01`, `SEL02`, `MHA01`, `DIA01`, `SH01`).
- **Fix (verifiable check)**: Remove the redundant bottom-right edit icon button in `src/components/BookingInventoryCard.tsx:228-246` (keeping the top-right header edit button consistent with `BookingCard.tsx`), leaving exactly 1 button matching `aria-label="แก้ไขการจอง <CODE>"` per card and giving the primary status-advance button full footer width.

#### S2. Primary interactive touch targets on mobile (`390px`) fall below the required `48px × 48px` minimum, and `CustomerPicker` explicitly shrinks its button on mobile
- **Raised by**: `installed design-system rules (.agents/rules/ui.md §2.D)` and `review`
- **Location**:
  - `BookingInventoryCard` CTA (`จองชุดนี้` `32px` high, status advance button `34px` high, edit button `32×32px`) in `src/components/BookingInventoryCard.tsx:118,207-216,232-243,253` (`bookings-items-390.png`)
  - `BookingDateBar` controls (`วันก่อนหน้า` `32×32px`, `เลือกวันที่` `32px` high, `ตัวกรอง` `32px` high) in `src/components/BookingDateBar.css:2-6,33-34,66-67` (`bookings-items-390.png`)
  - `FloatingBottomToolbar` action buttons (`ค้นหา`, view toggles `40×40px`) in `src/components/FloatingBottomToolbar.css:62-65` (`bookings-items-390.png`)
  - `CustomerPicker` "+ เพิ่มลูกค้าใหม่" button (`.hc-customer-add-btn.mobile` shrinks from `48px` on desktop to `38px` on mobile) in `src/components/CustomerPicker.css:119-133` (`booking-create-step2-390.png`)
  - `BookingFilterSheet` close button (`36×36px`), status tabs (`40px` high), and sort chips (`34px` high) in `src/components/BookingFilterSheet.tsx:146-152,202,291-292` (`bookings-filter-sheet-390.png`)
- **Width**: `390px`
- **Criterion**: **7. Interactive states & touch targets** / **`.agents/rules/ui.md` §2.D (`>= 48px × 48px`)**
- **Why it matters**: Staff operate this app on phones while handling garments in the shop. Buttons at `28px–34px` height (and icon buttons at `32×32px` without a `48×48px` hit-area pseudo-element like the one already used on `.hc-booking-sheet-close-btn::before` in `BookingSheet.css:55-63`) are error-prone to tap with a thumb.
- **Evidence**: `probe-results.json` (`touchTargetViolations390` measurements at `390px`).
- **Fix (verifiable check)**: Add a `48px × 48px` `::before` touch-target expansion on compact icon/chip buttons under `@media (pointer: coarse), (max-width: 600px)` (matching `BookingSheet.css:54-64`), raise card primary CTA buttons and `.hc-customer-add-btn.mobile` to `min-height: 44px–48px`, and verify via `measureInteractiveControlsInPage` that effective hit areas are `>= 48px` on mobile.

#### S3. `BookingFilterSheet` is anchored to the bottom-left corner on desktop (`1280px`) instead of centered or right-sheet aligned
- **Raised by**: `review`
- **Location**: `dialog 'ตัวกรองและจัดเรียงรายการจอง'` (`bookings-filter-sheet-1280.png`), `src/components/BookingFilterSheet.tsx:100-120`
- **Width**: `1280px`
- **Criterion**: **8. Responsive & adaptive** / **2. Alignment & grid**
- **Why it matters**: When clicking the "ตัวกรอง" button at the top-right of the `1280px` desktop screen, `dialog#booking-filter-sheet` (`className="bottom active"`, `maxWidth: '540px'`) appears flush against the bottom-left edge of the viewport (overlapping the left navigation rail) because BeerCSS's `dialog.bottom` positioning overrides inline `margin: '0 auto'`. The user's pointer and eye must travel from the top-right filter button all the way to the bottom-left corner of the window.
- **Evidence**: `bookings-filter-sheet-1280.png`.
- **Fix (verifiable check)**: Use `left: 50%; transform: translateX(-50%);` on `dialog.bottom` at `> 600px` (or switch to a right side-sheet `right medium` / anchored popover on desktop matching `BookingSheet.tsx:702-704`) so the dialog is horizontally centered or right-aligned on `1280px`.

#### S4. Inline `style={{ ... }}` and manual `fontSize` in `BookingInventoryCard.tsx` and `BookingFilterSheet.tsx` violate project UI rules
- **Raised by**: `installed design-system rules (.agents/rules/ui.md §2.C & §2.E)` and `lint`
- **Location**: `src/components/BookingInventoryCard.tsx:106,118,125,134-156,162-194,200,210-222,234-243` and `src/components/BookingFilterSheet.tsx:97,106-152,159-367`
- **Width**: `390px` and `1280px`
- **Criterion**: **`.agents/rules/ui.md` §2.C (No Manual `fontSize` in `style`) & §2.E (Colocation over Inline Styles)**
- **Why it matters**: `BookingInventoryCard.tsx:215` sets `style={{ ..., fontSize: '12px' }}` and `BookingFilterSheet.tsx:219,225,239,304,309` sets manual `fontSize` in inline `style` objects, bypassing BeerCSS typography helpers (`small-text`, `hc-micro-text`) and colocated `.css` files. Additionally, `BookingFilterSheet.tsx` triggers 3 ESLint warnings (`react-refresh/only-export-components`) by exporting `FILTER_TABS`, `SORT_OPTIONS`, and `getBookingFilterIcon` from the component file.
- **Evidence**: `src/components/BookingInventoryCard.tsx:210-216`, `src/components/BookingFilterSheet.tsx:17,26,34,219-309`, `pnpm lint` output, and `probe-results.json` (`hasInlineFontSize: true`, `hasInlineStyle: true`).
- **Fix (verifiable check)**: Move static inline styles in `BookingInventoryCard.tsx` and `BookingFilterSheet.tsx` into colocated `BookingInventoryCard.css` and `BookingFilterSheet.css` files using `hc-*` classes and BeerCSS helpers (`small-text`, `hc-micro-text`), so `pnpm lint` reports 0 warnings in `BookingFilterSheet.tsx` and zero elements have `el.style.fontSize` set.

---

### Note

#### N1. Clicking "จองชุดนี้" (`onReserve`) on an available item card opens `BookingSheet` on Step 1 instead of advancing directly to Step 2
- **Raised by**: `review`
- **Location**: `button 'จองชุด AVL01'` (`bookings-items-390.png`) -> `dialog 'สร้างการจองใหม่'` (`booking-reserve-from-card-390.png`), `src/pages/BookingsPage.tsx:522-558`
- **Width**: `390px` and `1280px`
- **Criterion**: **6. Progressive disclosure**
- **Why it matters**: When the user already picked a specific date on `BookingDateBar` and clicked `จองชุดนี้` on an available outfit card (e.g., `AVL01`), `BookingSheet` opens at Step 1 (`เลือกชุด`) with `AVL01` already selected at the top of the list, requiring an extra tap on `ถัดไป ->` before entering the customer details. `BookingSheetProps` already supports `initialStep?: number` (`BookingSheet.tsx:39`), and `BookingsPage.test.tsx` already tests `initialStep` behavior.
- **Evidence**: `booking-reserve-from-card-390.png` and `probe-results.json` (`reserveFromCardState.openedAtStep: "1\nเลือกชุด"`).
- **Fix (verifiable check)**: See Section 4 ("For a person to decide")—if single-item bookings are the common case for `จองชุดนี้`, pass `initialStep={2}` when opening via `handleReserveItem` (while keeping Step 1 accessible via the clickable `✓ เลือกชุด` stepper pill if they want to add a second outfit).

#### N2. Hidden native `<input type="date">` in `BookingDateFilterBar` shows no visible focus ring when navigated via keyboard `Tab`
- **Raised by**: `review` (Keyboard Path probe)
- **Location**: `input 'เลือกวันรับชุด'` and `input 'เลือกวันส่งคืน'` (`booking-create-step1-390.png`), `src/components/BookingDateFilterBar.tsx:45-56,115-126`, `src/components/BookingDateFilterBar.css:16-24`
- **Width**: `390px` and `1280px`
- **Criterion**: **10. Accessibility**
- **Why it matters**: `.hc-date-filter-native-input` uses `opacity: 0` over `.hc-date-filter-card` so tapping anywhere on the card opens the native date picker. However, when a keyboard user presses `Tab` through the date input's day/month/year subfields (`tabStops` 5–8 and 10 in `probe-results.json`), the focus ring is invisible because the `<input>` has `opacity: 0` and `.hc-date-filter-card` lacks a `:focus-within` outline.
- **Evidence**: `probe-results.json` (`bookingSheetStep1.tabStops` entries for `INPUT 'เลือกวันรับชุด'` and `INPUT 'เลือกวันส่งคืน'` have `outlineStyle: "none", outlineWidth: "0px"` on an `opacity: 0` element).
- **Fix (verifiable check)**: Add `.hc-date-filter-card:focus-within { outline: 2px solid var(--primary); outline-offset: 2px; }` in `src/components/BookingDateFilterBar.css` so keyboard focus on the date cards is clearly visible.

#### N3. `prefers-reduced-motion: reduce` is not respected on `<dialog id="booking-sheet">` slide transitions
- **Raised by**: `review` (Reduced Motion probe)
- **Location**: `dialog 'สร้างการจองใหม่'` (`src/components/BookingSheet.css:13-38`)
- **Width**: `390px` and `1280px`
- **Criterion**: **11. Performance & motion**
- **Why it matters**: While `HeaderToolbar.css` and `FloatingBottomToolbar.css` include `@media (prefers-reduced-motion: reduce) { transition: none; }`, BeerCSS's `<dialog>` transition (`0.3s`) remains active on `#booking-sheet` when `prefers-reduced-motion: reduce` is enabled.
- **Evidence**: `probe-results.json` (`reducedMotionProbes.dialogTransitionDuration: "0.3s, 0s"` when `prefers-reduced-motion: reduce` matches).
- **Fix (verifiable check)**: Add `@media (prefers-reduced-motion: reduce) { .hc-booking-sheet-dialog, .hc-booking-sheet-outfit-item { transition: none !important; } }` in `src/components/BookingSheet.css`.

---

## 3. Edge cases not shown

- **Empty search state (`BookingSheet` Step 1)**: Probed and captured in `booking-create-empty-search-390.png` (`ไม่พบชุดที่ตรงกับคำค้นหา` with `search_off` icon and a clear `×` button inside the search field)—works cleanly.
- **Inline new-customer validation error (`BookingSheet` Step 2)**: Probed and captured in `booking-create-step2-customer-error-390.png` (`กรุณากรอกชื่อลูกค้าและเบอร์โทรศัพท์` in `error-text`)—works cleanly, though the `input` fields could also set `aria-invalid="true"`.
- **Loading & error states (`/bookings`)**: Verified in code (`BookingsPage.tsx:709-745` renders a 4-card `Skeleton` grid with `aria-busy="true"` and an `error-container` banner on service error), not triggered visually because mock mode resolves synchronously from `localStorage`.
- **Throttled CPU (4× slowdown)**: Measured via `Emulation.setCPUThrottlingRate({ rate: 4 })` and `PerformanceObserver` on `event` entries (`probe-results.json`). Opening/closing `BookingSheet` and typing/tabbing with 43 inventory items produced `keydown` event durations up to `264ms` (`processingEnd - processingStart` was only `1–6ms`, with the remainder in presentation/paint of the 43-item list inside the dialog).

---

## 4. For a person to decide

1. **Quick-reserve (`จองชุดนี้`) starting step**:
   When a staff member clicks **`+ จองชุดนี้`** on an available outfit card in the Bookings list, should `BookingSheet` open at:
   - **Option A**: **Step 2 (`ลูกค้าและราคา`)** with that outfit and the currently selected date bar date pre-selected (saving 1 tap for single-outfit rentals, while still allowing them to tap `✓ เลือกชุด` in the stepper if they want to add more outfits), or
   - **Option B**: **Step 1 (`เลือกชุด`)** as it currently does (`booking-reserve-from-card-390.png`), so staff always confirm the rental duration (1 / 3 / 5 days) and additional outfits first?

2. **Desktop (`1280px`) presentation of `BookingFilterSheet`**:
   When clicking **`ตัวกรอง`** in the top right of the desktop toolbar, should the filter & sort panel open as:
   - **Option A**: A centered modal/bottom sheet (`max-width: 540px`, horizontally centered), or
   - **Option B**: A right-hand side sheet (`dialog.right.medium`, matching the `BookingSheet` drawer on desktop)?

---

## 5. Dismissed and left out

- **2 ESLint warnings outside scope (`src/components/GoogleSignInButton.tsx`, `src/contexts/AuthContext.tsx`)**: Left out because they are in authentication files outside the `/bookings` and creation flow scope.
- **Repeated per-card touch target entries in `probe-results.json`**: Raw DOM measurement reported 38 instances of `จองชุด <CODE>` (`height: 32px`) and 33 instances of `เลือกชุด <CODE>` (`height: 34px`), one per mock inventory item. Consolidated into single component-level finding **S2** rather than listing 71 duplicate rows.

Coverage: routes=[/bookings (items, orders, calendar, filter-sheet, create-step1..3, reserve-from-card, edit-sheet)] widths=[390, 1280] themes=[dark, light] probes_measured=[lint, touch-targets-390, duplicate-controls, keyboard-tab-path, focus-after-close, empty-search-state, inline-customer-error-state, throttled-cpu-4x, reduced-motion] probes_not_measured=[network-error-banner-live, screen-reader-voiceover-live]
