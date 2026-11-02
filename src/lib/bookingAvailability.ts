import type {
  Booking,
  BookingItemStatus,
  BookingTransactionDates,
} from '../types/booking';

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
    chipClass: 'hc-status-badge-reserved',
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
    chipClass: 'hc-status-badge-laundry',
  },
  returned: {
    label: 'รับคืนเสร็จสิ้น',
    chipClass: 'hc-status-badge-available',
  },
};

export function normalizeTransactionDates(
  rawTxDates: unknown,
  startDate: string,
  legacyItems?: Array<{ status?: BookingItemStatus }>
): BookingTransactionDates {
  const txDates: BookingTransactionDates = {};
  if (rawTxDates && typeof rawTxDates === 'object') {
    for (const st of BOOKING_STATUS_ORDER) {
      const val = (rawTxDates as Record<string, unknown>)[st];
      if (typeof val === 'string' && val.trim().length > 0) {
        txDates[st] = val.trim();
      }
    }
  }

  if (Object.keys(txDates).length === 0) {
    const fallbackDate = startDate || getTodayISO();
    txDates.reserved = fallbackDate;
    const legacyStatus = legacyItems?.find((i) => i.status)?.status;
    if (legacyStatus && legacyStatus !== 'reserved') {
      txDates[legacyStatus] = fallbackDate;
    }
  }

  return txDates;
}

/**
 * Computes the booking's active status on a specific ISO date ("YYYY-MM-DD")
 * from `booking.transactionDates`.
 */
export function getBookingStatusOnDate(
  booking: Pick<Booking, 'transactionDates'>,
  targetDate: string
): BookingItemStatus {
  let matchedStatus: BookingItemStatus = 'reserved';
  const txDates = booking.transactionDates ?? {};

  for (const status of BOOKING_STATUS_ORDER) {
    const activeDate = txDates[status];
    if (activeDate && activeDate <= targetDate) {
      matchedStatus = status;
    }
  }

  return matchedStatus;
}

/**
 * Computes the latest status reached by the booking across all recorded transaction dates.
 */
export function getLatestBookingStatus(
  booking: Pick<Booking, 'transactionDates'>
): BookingItemStatus {
  let latestStatus: BookingItemStatus = 'reserved';
  const txDates = booking.transactionDates ?? {};

  for (const status of BOOKING_STATUS_ORDER) {
    if (txDates[status]) {
      latestStatus = status;
    }
  }

  return latestStatus;
}

/**
 * Returns the effective status for display depending on whether "All Dates" mode is active.
 */
export function getEffectiveBookingStatus(
  booking: Pick<Booking, 'transactionDates'>,
  selectedDate: string,
  isAllDates = false
): BookingItemStatus {
  return isAllDates
    ? getLatestBookingStatus(booking)
    : getBookingStatusOnDate(booking, selectedDate);
}

/**
 * Checks whether modifying the booking status on `targetDate` is disallowed because
 * a subsequent date (`> targetDate`) has already moved the booking to a new status
 * further down the status flow.
 */
export function getSubsequentStatusBlock(
  booking: Pick<Booking, 'transactionDates'>,
  targetDate: string,
  nextStatus?: BookingItemStatus
): { status: BookingItemStatus; date: string } | null {
  const txDates = booking.transactionDates ?? {};
  const currentStatus = getBookingStatusOnDate(booking, targetDate);
  const currentIndex = BOOKING_STATUS_ORDER.indexOf(currentStatus);

  for (let i = currentIndex + 1; i < BOOKING_STATUS_ORDER.length; i += 1) {
    const st = BOOKING_STATUS_ORDER[i];
    const stDate = txDates[st];
    if (stDate && stDate > targetDate) {
      return { status: st, date: stDate };
    }
  }

  if (nextStatus) {
    const nextIndex = BOOKING_STATUS_ORDER.indexOf(nextStatus);
    for (let i = nextIndex + 1; i < BOOKING_STATUS_ORDER.length; i += 1) {
      const st = BOOKING_STATUS_ORDER[i];
      const stDate = txDates[st];
      if (stDate && stDate >= targetDate) {
        return { status: st, date: stDate };
      }
    }
  }

  return null;
}

export function isBookingFullyReturned(
  booking: Booking,
  onDate?: string
): boolean {
  if (booking.items.length === 0) return false;
  if (onDate) {
    return getBookingStatusOnDate(booking, onDate) === 'returned';
  }
  return getLatestBookingStatus(booking) === 'returned';
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
    if (isBookingFullyReturned(b)) {
      return false;
    }
    const hasItem = b.items.some((li) => li.itemId === itemId);
    if (!hasItem) {
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

export function formatDateThaiShortWithYear(isoDate: string): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return isoDate;
  const [year, month, day] = parts;
  const monthLabel = THAI_MONTHS_SHORT[month - 1] ?? '';
  const thaiYear = String((year + 543) % 100).padStart(2, '0');
  return `${day} ${monthLabel} ${thaiYear}`;
}

export function formatDateThaiFull(isoDate: string): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return isoDate;
  const [year, month, day] = parts;
  const monthLabel = THAI_MONTHS_SHORT[month - 1] ?? '';
  const thaiYear = year + 543;
  return `${day} ${monthLabel} ${thaiYear}`;
}

