import { describe, it, expect } from 'vitest';
import {
  addDaysISO,
  diffDaysInclusiveISO,
  formatDateThaiShort,
  formatDateThaiFull,
  getConflictingBookingsForItem,
  getItemStatusOnDate,
  getBookingReturnProgress,
  getEffectiveBookingStatusInfo,
  getEffectiveBookingStatus,
  isBookingFullyReturned,
} from '../bookingAvailability';
import type { Booking } from '../../types/booking';

function createTestBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'b-test-1',
    customerId: 'c1',
    customerName: 'คุณพลอย รัตนากร',
    customerPhone: '081-234-5678',
    customerLineId: '@ploy',
    startDate: '2026-03-10',
    endDate: '2026-03-12',
    cleaningEndDate: '2026-03-14',
    durationDays: 3,
    rentalPrice: 500,
    deposit: 0,
    depositRefunded: false,
    note: null,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    transactionDates: {
      reserved: '2026-03-01',
      pending_delivery: '2026-03-10',
      delivered: '2026-03-11',
    },
    items: [
      {
        itemId: 'item-1',
        itemCode: 'DIA01',
        itemName: 'Dieu Ann Dress',
        itemImageUrl: '',
      },
      {
        itemId: 'item-2',
        itemCode: 'SH01',
        itemName: 'Boots',
        itemImageUrl: '',
      },
    ],
    ...overrides,
  };
}

describe('bookingAvailability library', () => {
  describe('date utility helpers', () => {
    it('addDaysISO increments and decrements dates accurately across month and leap boundaries', () => {
      expect(addDaysISO('2026-02-28', 1)).toBe('2026-03-01');
      expect(addDaysISO('2026-03-01', -1)).toBe('2026-02-28');
      expect(addDaysISO('2024-02-28', 1)).toBe('2024-02-29'); // Leap year 2024
      expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01');
    });

    it('formatDateThaiShort formats ISO dates with Thai month abbreviation', () => {
      expect(formatDateThaiShort('2026-03-15')).toBe('15 มี.ค.');
      expect(formatDateThaiShort('2026-11-01')).toBe('1 พ.ย.');
    });

    it('formatDateThaiFull formats ISO dates with Thai Buddhist Era year', () => {
      expect(formatDateThaiFull('2026-03-15')).toBe('15 มี.ค. 2569');
    });

    it('diffDaysInclusiveISO calculates inclusive duration between dates', () => {
      expect(diffDaysInclusiveISO('2026-03-10', '2026-03-12')).toBe(3);
      expect(diffDaysInclusiveISO('2026-03-10', '2026-03-10')).toBe(1);
    });
  });

  describe('isBookingFullyReturned & getBookingReturnProgress', () => {
    it('accurately identifies partial and full returns across multiple line items', () => {
      const booking = createTestBooking();
      expect(isBookingFullyReturned(booking)).toBe(false);

      const progressInitial = getBookingReturnProgress(booking);
      expect(progressInitial.totalCount).toBe(2);
      expect(progressInitial.returnedCount).toBe(0);
      expect(progressInitial.isPartiallyReturned).toBe(false);

      // Return 1 of 2 items
      booking.items[0].status = 'returned';
      booking.items[0].returnedDate = '2026-03-12';
      booking.items[0].cleaningEndDate = '2026-03-14';

      expect(isBookingFullyReturned(booking)).toBe(false);
      const progressPartial = getBookingReturnProgress(booking);
      expect(progressPartial.returnedCount).toBe(1);
      expect(progressPartial.totalCount).toBe(2);
      expect(progressPartial.isPartiallyReturned).toBe(true);

      // Return second item
      booking.items[1].status = 'returned';
      booking.items[1].returnedDate = '2026-03-12';
      booking.items[1].cleaningEndDate = '2026-03-14';

      expect(isBookingFullyReturned(booking)).toBe(true);
      const progressFull = getBookingReturnProgress(booking);
      expect(progressFull.returnedCount).toBe(2);
      expect(progressFull.totalCount).toBe(2);
      expect(progressFull.isPartiallyReturned).toBe(false);
    });
  });

  describe('getEffectiveBookingStatusInfo & getEffectiveBookingStatus', () => {
    it('returns returned status when fully returned', () => {
      const booking = createTestBooking({
        items: [
          {
            itemId: 'item-1',
            itemCode: 'DIA01',
            itemName: 'Dress',
            itemImageUrl: '',
            status: 'returned',
          },
        ],
      });
      const info = getEffectiveBookingStatusInfo(booking, '2026-03-11');
      expect(info.status).toBe('returned');
      expect(getEffectiveBookingStatus(booking, '2026-03-11')).toBe('returned');
    });

    it('returns active status with partial return metadata when partially returned', () => {
      const booking = createTestBooking({
        items: [
          {
            itemId: 'item-1',
            itemCode: 'DIA01',
            itemName: 'Dress',
            itemImageUrl: '',
            status: 'returned',
          },
          {
            itemId: 'item-2',
            itemCode: 'SH01',
            itemName: 'Boots',
            itemImageUrl: '',
            status: 'delivered',
          },
        ],
      });
      const info = getEffectiveBookingStatusInfo(booking, '2026-03-11');
      expect(info.status).toBe('delivered');
      expect(info.isPartiallyReturned).toBe(true);
      expect(info.returnedCount).toBe(1);
      expect(info.totalCount).toBe(2);
    });
  });

  describe('getItemStatusOnDate', () => {
    it('returns normal booking status before item return date', () => {
      const booking = createTestBooking();
      const lineItem = booking.items[0];
      lineItem.status = 'returned';
      lineItem.returnedDate = '2026-03-12';
      lineItem.cleaningEndDate = '2026-03-14';

      // On 2026-03-10, status is pending_delivery
      expect(getItemStatusOnDate(booking, lineItem, '2026-03-10')).toBe('pending_delivery');
      // On 2026-03-11, status is delivered
      expect(getItemStatusOnDate(booking, lineItem, '2026-03-11')).toBe('delivered');
    });

    it('returns returned status from item return date onwards', () => {
      const booking = createTestBooking();
      const lineItem = booking.items[0];
      lineItem.status = 'returned';
      lineItem.returnedDate = '2026-03-12';
      lineItem.cleaningEndDate = '2026-03-14';

      expect(getItemStatusOnDate(booking, lineItem, '2026-03-12')).toBe('returned');
      expect(getItemStatusOnDate(booking, lineItem, '2026-03-13')).toBe('returned');
    });

    it('reverts to past booking status when viewing date before item.status took effect', () => {
      const booking = createTestBooking({
        transactionDates: {
          reserved: '2026-03-01',
          pending_delivery: '2026-03-10',
          delivered: '2026-03-12',
        },
      });
      const lineItem = booking.items[0];
      lineItem.status = 'delivered';

      // On 2026-03-05, booking was only reserved
      expect(getItemStatusOnDate(booking, lineItem, '2026-03-05')).toBe('reserved');
      // On 2026-03-10, booking was pending_delivery
      expect(getItemStatusOnDate(booking, lineItem, '2026-03-10')).toBe('pending_delivery');
      // On 2026-03-12, delivered
      expect(getItemStatusOnDate(booking, lineItem, '2026-03-12')).toBe('delivered');
    });
  });

  describe('getConflictingBookingsForItem with early item return guardrails', () => {
    it('detects overlap during active rental and cleaning period', () => {
      const booking = createTestBooking();
      const bookings = [booking];

      // Target booking overlapping with startDate -> conflict
      const conflicts = getConflictingBookingsForItem(
        'item-1',
        '2026-03-11',
        '2026-03-15',
        bookings
      );
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].id).toBe('b-test-1');
    });

    it('matches line item by itemCode when itemId differs', () => {
      const booking = createTestBooking();
      const bookings = [booking];

      const conflicts = getConflictingBookingsForItem(
        'DIA01',
        '2026-03-11',
        '2026-03-15',
        bookings
      );
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].id).toBe('b-test-1');
    });

    it('uses b.transactionDates.returned as fallback cleaning end for legacy returned bookings', () => {
      const legacyBooking = createTestBooking({
        startDate: '2026-03-10',
        endDate: '2026-03-20',
        cleaningEndDate: '2026-03-22',
        transactionDates: {
          reserved: '2026-03-01',
          returned: '2026-03-12',
        },
        items: [
          {
            itemId: 'item-1',
            itemCode: 'DIA01',
            itemName: 'Dress',
            itemImageUrl: '',
            status: null, // legacy data where item.status was not set
          },
        ],
      });

      // Target on 2026-03-15 (after 2026-03-12 + 2 days = 2026-03-14) is free
      const conflicts = getConflictingBookingsForItem(
        'item-1',
        '2026-03-15',
        '2026-03-18',
        [legacyBooking]
      );
      expect(conflicts).toHaveLength(0);
    });

    it('ends blocking window at lineItem.cleaningEndDate when item was returned early', () => {
      const booking = createTestBooking({
        startDate: '2026-03-10',
        endDate: '2026-03-15',
        cleaningEndDate: '2026-03-17',
      });
      // Item was returned early on 2026-03-12, so cleaning ends on 2026-03-14
      booking.items[0].status = 'returned';
      booking.items[0].returnedDate = '2026-03-12';
      booking.items[0].cleaningEndDate = '2026-03-14';

      const bookings = [booking];

      // Target booking starting on 2026-03-15 (after 2026-03-14) is completely free!
      const afterCleaning = getConflictingBookingsForItem(
        'item-1',
        '2026-03-15',
        '2026-03-18',
        bookings
      );
      expect(afterCleaning).toHaveLength(0);

      // Target booking on 2026-03-13 is during the cleaning window -> still conflicts
      const duringCleaning = getConflictingBookingsForItem(
        'item-1',
        '2026-03-13',
        '2026-03-16',
        bookings
      );
      expect(duringCleaning).toHaveLength(1);
    });

    it('ignores excluded booking id when updating an existing booking', () => {
      const booking = createTestBooking();
      const bookings = [booking];

      const conflicts = getConflictingBookingsForItem(
        'item-1',
        '2026-03-10',
        '2026-03-14',
        bookings,
        'b-test-1'
      );
      expect(conflicts).toHaveLength(0);
    });

    it('excludes cancelled bookings so outfits can be rebooked immediately', () => {
      const cancelledBooking = createTestBooking({
        transactionDates: {
          reserved: '2026-03-01',
          cancelled: '2026-03-05',
        },
        items: [
          {
            itemId: 'item-1',
            itemCode: 'DIA01',
            itemName: 'Dress',
            itemImageUrl: '',
            status: 'cancelled',
          },
        ],
      });

      expect(getEffectiveBookingStatus(cancelledBooking, '2026-03-10')).toBe('cancelled');
      expect(getItemStatusOnDate(cancelledBooking, cancelledBooking.items[0], '2026-03-10')).toBe(
        'cancelled'
      );

      // Same date range has zero conflicts
      const conflicts = getConflictingBookingsForItem(
        'item-1',
        '2026-03-10',
        '2026-03-14',
        [cancelledBooking]
      );
      expect(conflicts).toHaveLength(0);
    });
  });
});
