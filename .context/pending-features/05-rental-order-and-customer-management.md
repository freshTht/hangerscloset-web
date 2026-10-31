# Feature 05: Rental Order & Customer Booking Workflow

- **Priority**: Rank #5 (Revenue & Operations)
- **RICE Score**: **5.7** (Reach: 9, Impact: 3, Confidence: 85%, Effort: 4.0)
- **Status**: Ready for `/plan`

---

## 1. Problem Statement & Business Benefit
While catalog browsing and availability checking are crucial, a clothing rental boutique operates on orders: tracking who rented which dress, their event date, pickup date, security deposit, payment status, and scheduled return date.

Currently, boutique staff often track these details manually via Line chat or paper notebooks, leading to forgotten returns, lost deposits, or schedule confusion.

### Key Benefits:
- **Centralized Rental Orders**: Records every booking with customer name, phone number, Line ID, fitting notes, and payment status.
- **Deposit Tracking**: Records refundable security deposits (e.g. 1,000฿ per gown) and tracks deposit refunds upon damage-free return.
- **Automated Duration & Pricing Calculation**: Selects 1-day, 3-day, or 5-day rental packages automatically based on the chosen dates.
- **Status Progression**: Guides orders smoothly through: `Booked` &rarr; `Picked Up / Active` &rarr; `Returned` &rarr; `Completed`.

---

## 2. User Scenarios & UX Flow

### A. Creating a Booking from Item Detail
1. Staff selects a dress and clicks **"สร้างการจอง (Book Item)"**.
2. A streamlined Booking Sheet opens:
   - **Customer Info**: Name, Phone, Line ID (with quick autocomplete for repeat customers).
   - **Dates**: Pickup Date & Return Date (preset shortcuts: `3 วัน (สุดสัปดาห์)`, `5 วัน`).
   - **Financials**:
     - Rental Price (auto-filled from item's `rentalPrices`).
     - Security Deposit (e.g. 1,000฿).
     - Delivery Method: `รับที่ร้าน (Store Pickup)`, `แมสเซนเจอร์ (Grab/Lineman)`, `ขนส่งพัสดุ (Kerry/Flash)`.
3. Staff clicks **"ยืนยันการจอง"**; booking is saved and item availability for those dates is instantly locked.

### B. Orders Dashboard / Management Tab
1. A new navigation tab or view (`/rentals` or `/orders`) lists active orders grouped by:
   - **รอรับชุด (Scheduled for Pickup Today/Tomorrow)**
   - **กำลังเช่า (Active Rentals with Customers)**
   - **รอส่งคืน (Due for Return Today/Overdue)**
2. Staff can tap an order to mark **"ลูกค้ารับชุดแล้ว (Mark Picked Up)"** or **"คืนชุดแล้ว (Mark Returned)"**.

---

## 3. Data Model

### Collection: `orders`
```ts
export type OrderStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'picked_up'
  | 'returned'
  | 'completed'
  | 'cancelled';

export interface RentalOrder {
  id: string;
  orderNumber: string;        // e.g. "HC-20261027-01"
  itemId: string;             // Reference to inventory item
  itemCode: string;           // e.g. "AVL01"
  itemName: string;
  itemImageUrl: string;
  customer: {
    name: string;
    phone: string;
    lineId?: string;
    address?: string;
  };
  dates: {
    startDate: string;        // "YYYY-MM-DD"
    endDate: string;          // "YYYY-MM-DD"
    returnDueDate: string;    // "YYYY-MM-DD"
    actualReturnDate?: string;
  };
  pricing: {
    duration: 'oneDay' | 'threeDays' | 'fiveDays' | 'custom';
    rentalFee: number;
    depositFee: number;
    totalAmount: number;
    depositRefunded?: boolean;
  };
  delivery: {
    method: 'pickup' | 'messenger' | 'shipping';
    trackingNumber?: string;
  };
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 4. UI Implementation Guidelines (Beer CSS)
- **Orders View**:
  - Filter tabs at top: `<nav className="tabs">` with categories `รอรับชุด`, `กำลังเช่า`, `รอคืน`, `ประวัติ`.
  - Responsive cards using `<article className="border round">` with status badges:
    - `confirmed`: `<span className="chip fill green">รอรับชุด</span>`
    - `picked_up`: `<span className="chip fill blue">กำลังเช่า</span>`
    - `overdue`: `<span className="chip fill error">เกินกำหนดคืน</span>`
- **Actions**:
  - Clean outlined action buttons (`button.border.round`) without solid red fills.

---

## 5. Acceptance Criteria
- [ ] Staff can create a new rental order linked to any inventory item.
- [ ] Rental pricing and duration are calculated automatically from dates.
- [ ] Deposit amounts and refund statuses are tracked transparently.
- [ ] Orders list provides real-time filters for upcoming pickups and returns.
- [ ] Order status updates smoothly transition between booking stages.
- [ ] Works in both mock mode and Firebase mode with full unit test coverage.

---

## 6. Agent Kickoff Prompt
```text
Please implement Feature 05: Rental Order & Customer Booking Workflow as described in .context/pending-features/05-rental-order-and-customer-management.md.
First, run /plan to design the order data types, order repository interfaces, customer booking form modal, and the Orders management page/tabs. Ensure strict compliance with Beer CSS and project architecture.
```
