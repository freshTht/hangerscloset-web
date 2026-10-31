# Feature 06: Return, Laundry & Inspection Lifecycle

- **Priority**: Rank #6 (Quality & Maintenance)
- **RICE Score**: **5.4** (Reach: 8, Impact: 2, Confidence: 85%, Effort: 2.5)
- **Status**: Ready for `/plan`

---

## 1. Problem Statement & Business Benefit
Garments returned from rental events cannot immediately be handed to the next customer. They must go through:
1. **Inspection**: Checking for makeup stains, wine spills, torn hemlines, or missing accessories.
2. **Deposit Settlement**: Releasing the full deposit or deducting repair/cleaning fees.
3. **Laundry & Dry Cleaning**: Dispatching to professional cleaners, which takes 2–4 business days.
4. **Restock**: Receiving clean garments back and marking them `available`.

Currently, the data model has `status: 'laundry'`, but there is no operational workflow to track dry cleaner batches, turnaround times, or damage documentation.

### Key Benefits:
- **Flaw & Damage History**: Records garment condition photos and notes directly onto the item's history.
- **Dry Cleaning Batch Management**: Tracks which laundry vendor has which dresses and when they are promised back.
- **Guaranteed Clean Inventory**: Items remain blocked from new reservations while in dry cleaning.

---

## 2. User Scenarios & UX Flow

### A. Return & Inspection Check-in
1. When a dress arrives back at the shop, staff clicks **"บันทึกรับคืน (Check In Return)"**.
2. Inspection checklist appears:
   - Condition rating: `สภาพสมบูรณ์ (Perfect)`, `มีคราบซักออกได้ (Minor Stain)`, `ชำรุดต้องซ่อม (Damaged)`.
   - Optional photo upload of stain/flaw (appended to item notes).
   - Deposit action: **"คืนเงินมัดจำเต็มจำนวน (Full Refund)"** or **"หักค่าซัก/ซ่อม (Deduct Fee)"**.
3. Staff selects **"ส่งซักแห้ง (Send to Laundry)"**; item status automatically updates to `'laundry'`.

### B. Laundry Management Hub
1. Staff views the Laundry tab / view:
   - Displays all items currently in dry cleaning with their expected return dates.
2. When dry cleaning arrives back, staff taps **"รับผ้ากลับแล้ว (Mark Ready)"**.
3. Item status transitions back to `'available'`.

---

## 3. Data Model

### Collection: `laundry_batches`
```ts
export interface LaundryLog {
  id: string;
  itemId: string;
  itemCode: string;
  orderId?: string;
  sentDate: string;           // "YYYY-MM-DD"
  expectedReturnDate: string; // "YYYY-MM-DD"
  actualReturnDate?: string;
  cleanerName: string;        // e.g. "Clean & Care Dry Cleaner"
  cost: number;
  conditionNotes?: string;
  status: 'sent' | 'cleaning' | 'returned_ready';
}
```

---

## 4. UI Implementation Guidelines (Beer CSS)
- **Status Chips**:
  - `laundry`: `<span className="chip fill blue"><i>local_laundry_service</i> ซักแห้ง</span>`
- **Return Dialog**:
  - Modal dialog with quick condition radio toggles and inspection note textarea.
- **Vendor Dropdown**:
  - Reuses [`OptionPicker`](file:///Users/fresh/Developers/_projects/_web/hangerscloset-web/src/components/OptionPicker.tsx) for laundry vendor selection with add-on-the-fly.

---

## 5. Acceptance Criteria
- [ ] Return workflow prompts for garment inspection and deposit reconciliation.
- [ ] Marking an item as sent to laundry updates its status to `'laundry'`.
- [ ] Laundry view lists all dresses currently with dry cleaners and highlights overdue cleanings.
- [ ] Checking items back in restores their status to `'available'`.
- [ ] Complete history log of cleanings and repair notes maintained for each dress.

---

## 6. Agent Kickoff Prompt
```text
Please implement Feature 06: Return, Laundry & Inspection Lifecycle as detailed in .context/pending-features/06-return-laundry-and-inspection-lifecycle.md.
First, run /plan to design the inspection checklist modal, laundry batch repository, and status transition integration with InventoryPage and Orders. Ensure strict adherence to Beer CSS semantic conventions.
```
