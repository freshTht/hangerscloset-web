# Feature 01: Date-Based Availability & Booking Calendar

- **Priority**: Rank #1 (Critical Core Feature)
- **RICE Score**: **9.0** (Reach: 10, Impact: 3, Confidence: 90%, Effort: 3.0)
- **Status**: Ready for `/plan`

---

## 1. Problem Statement & Business Benefit
In a clothing rental business, apparel items are not permanently "available" or "reserved". Availability is strictly a function of time: an item may be available this weekend (Oct 24–26), rented out next weekend (Nov 1–3), and in laundry (Nov 4–5).

### Key Benefits:
- **Zero Double-Bookings**: Prevents booking the same dress to two different customers during overlapping rental windows.
- **Dynamic Availability Badges**: Restores the `status` badge on `InventoryCard` based on a selected rental date range rather than a static hardcoded database string.
- **Turnaround Buffer**: Automatically adds a 1–2 day post-rental buffer period for dry cleaning and return transit before marking the dress available again.

---

## 2. User Scenarios & UX Flow

### A. Catalog Date Filter (Customer & Staff)
1. Staff or customer selects their desired event dates on the Inventory page (e.g. `14 พ.ย. - 16 พ.ย. (3 วัน)`).
2. The inventory grid dynamically updates:
   - Items with no conflicting bookings show a soft green badge: **"ว่างในช่วงนี้"** (`Available for selected dates`).
   - Items reserved during that window show an amber badge: **"ไม่ว่าง (ติดจอง)"** (`Reserved`).
   - Optionally, users can toggle `[ ] แสดงเฉพาะชุดที่ว่าง` to hide booked apparel.

### B. Item Detail / Sheet Booking Calendar
1. Inside the Item Sheet, a responsive calendar view displays the next 60–90 days.
2. Reserved dates appear blocked out in amber/red (`surface-container-high` or soft tint).
3. Laundry/buffer cleaning days appear in soft blue.
4. Available days are clickable to start a booking.

---

## 3. Data Model & Schema Extensions

### A. New Collection: `rentals`
```ts
export interface RentalBooking {
  id: string;
  itemId: string;           // Ref to inventory/{itemId}
  itemCode: string;         // e.g. "AVL01"
  customerName: string;
  customerContact?: string; // Line ID or phone
  startDate: string;        // ISO "YYYY-MM-DD" (rental pickup)
  endDate: string;          // ISO "YYYY-MM-DD" (rental return)
  cleaningEndDate: string;  // ISO "YYYY-MM-DD" (buffer after return)
  rentalDuration: 'oneDay' | 'threeDays' | 'fiveDays' | 'custom';
  price: number;
  deposit: number;
  status: 'booked' | 'active' | 'returned' | 'cancelled';
  createdAt: string;
}
```

### B. Dynamic Availability Helper Function
```ts
export function isItemAvailable(
  itemId: string,
  targetStart: string,
  targetEnd: string,
  bookings: RentalBooking[]
): boolean {
  return !bookings.some((b) => {
    if (b.itemId !== itemId || b.status === 'cancelled') return false;
    // Overlap check: startA <= endB && endA >= startB
    return targetStart <= b.cleaningEndDate && targetEnd >= b.startDate;
  });
}
```

---

## 4. UI Implementation Guidelines (Beer CSS)
- **Responsive Layout**:
  - Small screens (`s`): Date range picker rendered in a compact horizontal pill or sheet.
  - Medium/Large screens (`m++`): Calendar view rendered inside the right sheet.
- **Components**:
  - Use native `<input type="date">` with Beer CSS `.field.label.border.round`.
  - Date chips: `<span className="chip fill green">` for available, `<span className="chip fill orange">` for booked.
  - No radial progress spinners; use `.shape.loading-indicator` or `.skeleton` during availability queries.

---

## 5. Security Rules Impact (`firestore.rules`)
```javascript
match /rentals/{bookingId} {
  allow read: if isAllowedUser();
  allow create, update: if isAllowedUser() &&
    request.resource.data.itemId is string &&
    request.resource.data.startDate is string &&
    request.resource.data.endDate is string;
  allow delete: if isAllowedUser();
}
```

---

## 6. Acceptance Criteria
- [ ] Users can pick a start and end rental date range on `InventoryPage`.
- [ ] Inventory cards reflect real-time availability for the selected dates.
- [ ] Selecting dates filters out booked items when the "Only Available" toggle is active.
- [ ] Overlapping booking windows correctly account for cleaning buffer days.
- [ ] Mock repository provides simulated bookings for instant testing without Firebase.
- [ ] All unit tests pass (`pnpm test`) and typecheck passes (`pnpm build`).

---

## 7. Agent Kickoff Prompt
```text
Please implement Feature 01: Date-Based Availability & Booking Calendar as detailed in .context/pending-features/01-date-availability-and-booking-calendar.md.
First, run /plan to design the rental bookings data layer, mock repository fixtures, calendar UI components, and reactive availability hooks for InventoryCard and InventoryPage. Ensure full compliance with Beer CSS guidelines and strict type safety.
```
