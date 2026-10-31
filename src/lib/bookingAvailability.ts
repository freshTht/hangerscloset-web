import type { Booking, BookingItemStatus } from '../types/booking';

export const BOOKING_STATUS_ORDER: BookingItemStatus[] = [
  'reserved',
  'pending_delivery',
  'delivered',
  'pending_return',
  'in_laundry',
  'returned',
];

export const BOOKING_STATUS_META: Record<
  BookingItemStatus,
  {
    label: string;
    nextStatus?: BookingItemStatus;
    nextActionLabel?: string;
    chipClass: string;
  }
> = {
  reserved: {
    label: 'จองแล้ว',
    nextStatus: 'pending_delivery',
    nextActionLabel: 'รอส่งมอบ',
    chipClass: 'status-badge-reserved',
  },
  pending_delivery: {
    label: 'รอส่งมอบ',
    nextStatus: 'delivered',
    nextActionLabel: 'ส่งมอบแล้ว',
    chipClass: 'tertiary-container',
  },
  delivered: {
    label: 'ส่งมอบแล้ว',
    nextStatus: 'pending_return',
    nextActionLabel: 'รอรับคืน',
    chipClass: 'primary-container',
  },
  pending_return: {
    label: 'รอรับคืน',
    nextStatus: 'in_laundry',
    nextActionLabel: 'ส่งซัก',
    chipClass: 'error-container',
  },
  in_laundry: {
    label: 'ส่งซัก',
    nextStatus: 'returned',
    nextActionLabel: 'รับคืนเสร็จสิ้น',
    chipClass: 'status-badge-laundry',
  },
  returned: {
    label: 'รับคืนเสร็จสิ้น',
    chipClass: 'status-badge-available',
  },
};

export function isBookingFullyReturned(booking: Booking): boolean {
  return (
    booking.items.length > 0 &&
    booking.items.every((item) => item.status === 'returned')
  );
}

export function getConflictingBookingsForItem(
  itemId: string,
  targetStart: string,
  targetCleaningEnd: string,
  bookings: Booking[],
  excludeBookingId?: string
): Booking[] {
  if (!itemId || !targetStart || !targetCleaningEnd) {
    return [];
  }

  return bookings.filter((b) => {
    if (excludeBookingId && b.id === excludeBookingId) {
      return false;
    }
    const hasActiveItem = b.items.some(
      (li) => li.itemId === itemId && li.status !== 'returned'
    );
    if (!hasActiveItem) {
      return false;
    }
    return targetStart <= b.cleaningEndDate && targetCleaningEnd >= b.startDate;
  });
}

export function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysISO(isoDate: string, daysToAdd: number): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return isoDate;
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  date.setUTCDate(date.getUTCDate() + daysToAdd);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function diffDaysInclusiveISO(startIso: string, endIso: string): number {
  const s = startIso.split('-').map(Number);
  const e = endIso.split('-').map(Number);
  if (s.length !== 3 || e.length !== 3 || s.some(isNaN) || e.some(isNaN)) {
    return 1;
  }
  const startMs = Date.UTC(s[0], s[1] - 1, s[2]);
  const endMs = Date.UTC(e[0], e[1] - 1, e[2]);
  const diff = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diff);
}

const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

export function formatDateThaiShort(isoDate: string): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return isoDate;
  const [, month, day] = parts;
  const monthLabel = THAI_MONTHS_SHORT[month - 1] ?? '';
  return `${day} ${monthLabel}`;
}
