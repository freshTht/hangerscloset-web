# Feature 09: Consignor & Owner Revenue Tracking

- **Priority**: Rank #9 (Consignment Business Model)
- **RICE Score**: **2.7** (Reach: 5, Impact: 2, Confidence: 80%, Effort: 3.0)
- **Status**: Ready for `/plan`

---

## 1. Problem Statement & Business Benefit
High-end clothing rental boutiques often source luxury gowns through **consignment (ฝากเช่า)**: customers or influencers deposit expensive designer dresses with Hanger's Closet, and the store splits rental revenue (e.g. 60% to owner, 40% to store) while managing storage, dry cleaning, and customer bookings.

The `InventoryItem` data model already includes the field:
`owner?: string | null; // Consignor / owner indicator`

However, there is currently no system to calculate consignment earnings, generate monthly owner payout reports, or track consignment terms.

### Key Benefits:
- **Automatic Revenue Split**: Calculates owner share vs. boutique commission for each completed rental.
- **Owner Payout Statements**: Generates monthly payout summaries per consignor with 1 click.
- **Inventory Performance by Consignor**: Owners can see how many times their dress has been rented and their total earnings.

---

## 2. User Scenarios & UX Flow

### A. Assigning Consignment Terms
1. When adding or editing an inventory item in `InventorySheet`:
   - Under **"เจ้าของชุด (Owner)"**, staff selects or enters the consignor's name.
   - Sets the consignment split percentage (e.g. `60% เจ้าของ / 40% ร้าน`).
   - Sets bank transfer account details for monthly payouts.

### B. Consignment Payout Summary Tab
1. In Settings or a dedicated Management view (`/consignors`):
   - Lists all registered dress owners with their active garments, total rentals this month, and pending payouts.
2. Clicking **"สร้างใบสรุปยอด (Generate Statement)"** produces a downloadable or shareable PDF/image summary showing:
   - Garment codes rented (e.g. `DIA01 - 2 times (1,000฿)`, `CHA01 - 1 time (500฿)`).
   - Deductions for laundry/cleaning fees if agreed in contract.
   - Net payout amount and bank transfer receipt attachment.

---

## 3. Data Model

### Collection: `consignors`
```ts
export interface Consignor {
  id: string;
  name: string;
  phone: string;
  lineId?: string;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  commissionRate: number;     // e.g. 0.60 (60% to owner)
  cleaningFeeDeduction: number; // e.g. 100฿ per rental
  activeItemCodes: string[];
  createdAt: string;
}

export interface ConsignorPayout {
  id: string;
  consignorId: string;
  period: string;             // "YYYY-MM" (e.g. "2026-10")
  totalRentalsCount: number;
  grossRentalRevenue: number;
  ownerShareAmount: number;
  laundryDeductions: number;
  netPayoutAmount: number;
  status: 'pending' | 'paid';
  paidAt?: string;
  transferSlipUrl?: string;
}
```

---

## 4. UI Implementation Guidelines (Beer CSS)
- **Consignor Selection**:
  - Reuses [`OptionPicker`](file:///Users/fresh/Developers/_projects/_web/hangerscloset-web/src/components/OptionPicker.tsx) for consignor selection in `InventorySheet`.
- **Payout Table**:
  - Uses native Beer CSS `table.border.stripes.responsive` with clean number alignment.
- **Payout Status Badges**:
  - `pending`: `<span className="chip fill orange small">รอโอน</span>`
  - `paid`: `<span className="chip fill green small">โอนแล้ว</span>`

---

## 5. Acceptance Criteria
- [ ] Items can be linked to a registered consignor with custom revenue split percentages.
- [ ] Completed rental orders automatically log earnings to the respective consignor's ledger.
- [ ] Staff can view monthly earnings per consignor and mark payouts as completed.
- [ ] Summary statements can be copied or downloaded for Line chat communication with owners.

---

## 6. Agent Kickoff Prompt
```text
Please implement Feature 09: Consignor & Owner Revenue Tracking as specified in .context/pending-features/09-consignor-and-owner-revenue-tracking.md.
First, run /plan to design the consignor schema, ledger calculation service, owner detail view, and payout report generator. Adhere strictly to Beer CSS and dual-mode architecture.
```
