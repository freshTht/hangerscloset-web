export type BookingItemStatus =
  | 'reserved'          // จองแล้ว
  | 'pending_delivery'  // รอส่งมอบ (ชำระเงินแล้ว)
  | 'delivered'         // ส่งมอบแล้ว (กำลังเช่า)
  | 'pending_return'    // รอรับคืน
  | 'in_laundry'        // ส่งซัก
  | 'returned';         // รับคืนเสร็จสิ้น (พร้อมเช่าต่อ / ยกเลิก)

export interface BookingLineItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  itemImageUrl: string;
  status: BookingItemStatus;
  conditionNote?: string | null;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerLineId?: string | null;
  items: BookingLineItem[];
  startDate: string;        // ISO "YYYY-MM-DD"
  endDate: string;          // ISO "YYYY-MM-DD"
  cleaningEndDate: string;  // ISO "YYYY-MM-DD"
  durationDays: number;
  rentalPrice: number;
  deposit: number;
  depositRefunded: boolean;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export {
  BOOKING_STATUS_ORDER,
  BOOKING_STATUS_META,
  isBookingFullyReturned,
  getConflictingBookingsForItem,
  getTodayISO,
  addDaysISO,
  diffDaysInclusiveISO,
  formatDateThaiShort,
} from '../lib/bookingAvailability';
