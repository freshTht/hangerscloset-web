import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockBookingRepository } from '../mockBookingRepository';
import {
  getBookingStatusOnDate,
  getConflictingBookingsForItem,
  getSubsequentStatusBlock,
  isBookingFullyReturned,
  type Booking,
} from '../../../types/booking';

const sampleBookings: Booking[] = [
  {
    id: 'b1',
    customerId: 'c1',
    customerName: 'คุณพลอย รัตนากร',
    customerPhone: '081-234-5678',
    customerLineId: '@ploy_r',
    items: [
      {
        itemId: 'item-1',
        itemCode: 'DIA01',
        itemName: 'Dieu Ann Dress',
        itemImageUrl: '/dia01.png',
        conditionNote: null,
      },
      {
        itemId: 'item-2',
        itemCode: 'SH01',
        itemName: 'Boots',
        itemImageUrl: '/sh01.jpg',
        conditionNote: null,
      },
    ],
    transactionDates: {
      reserved: '2026-03-01',
      pending_delivery: '2026-03-10',
    },
    startDate: '2026-03-10',
    endDate: '2026-03-12',
    cleaningEndDate: '2026-03-14',
    durationDays: 3,
    rentalPrice: 380,
    deposit: 1000,
    depositRefunded: false,
    note: null,
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
  },
];

describe('MockBookingRepository & Availability Helpers', () => {
  let repo: MockBookingRepository;

  beforeEach(() => {
    repo = new MockBookingRepository(sampleBookings);
  });

  it('getAll returns clone of initial bookings', async () => {
    const all = await repo.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].items).toHaveLength(2);
    expect(all[0].transactionDates).toEqual({
      reserved: '2026-03-01',
      pending_delivery: '2026-03-10',
    });
  });

  it('computes different booking statuses on different dates from transactionDates', async () => {
    await repo.updateItemStatus('b1', 'item-1', 'delivered', 'ส่งแล้ว', '2026-03-11');
    await repo.updateItemStatus('b1', 'item-1', 'in_laundry', undefined, '2026-03-13');

    const [booking] = await repo.getAll();
    expect(getBookingStatusOnDate(booking, '2026-03-09')).toBe('reserved');
    expect(getBookingStatusOnDate(booking, '2026-03-10')).toBe('pending_delivery');
    expect(getBookingStatusOnDate(booking, '2026-03-11')).toBe('delivered');
    expect(getBookingStatusOnDate(booking, '2026-03-12')).toBe('delivered');
    expect(getBookingStatusOnDate(booking, '2026-03-13')).toBe('in_laundry');
  });

  it('disallows changing status on an earlier date when a subsequent date has progressed further', async () => {
    const listener = vi.fn();
    repo.subscribe(listener);

    // Move booking to delivered on 2026-03-12
    await repo.updateItemStatus('b1', 'item-1', 'delivered', 'พร้อมส่ง', '2026-03-12');

    const [booking] = await repo.getAll();
    // On 2026-03-10, status is pending_delivery, but 2026-03-12 already moved to delivered
    const block = getSubsequentStatusBlock(booking, '2026-03-10', 'delivered');
    expect(block).toEqual({ status: 'delivered', date: '2026-03-12' });

    await expect(
      repo.updateItemStatus('b1', 'item-1', 'delivered', undefined, '2026-03-10')
    ).rejects.toThrow(/Cannot change status on 2026-03-10/);
  });

  it('detects date-range conflicts including cleaning window and ignores returned bookings', async () => {
    const bookings = await repo.getAll();

    // Overlapping during cleaning window (2026-03-13 to 2026-03-14)
    const conflictInCleaning = getConflictingBookingsForItem(
      'item-1',
      '2026-03-14',
      '2026-03-18',
      bookings
    );
    expect(conflictInCleaning).toHaveLength(1);

    // Non-overlapping after cleaningEndDate
    const noConflictAfter = getConflictingBookingsForItem(
      'item-1',
      '2026-03-15',
      '2026-03-19',
      bookings
    );
    expect(noConflictAfter).toHaveLength(0);

    // Exclude same booking when editing
    const excludedSelf = getConflictingBookingsForItem(
      'item-1',
      '2026-03-10',
      '2026-03-14',
      bookings,
      'b1'
    );
    expect(excludedSelf).toHaveLength(0);

    // When item-1 is returned on 2026-03-14, its cleaning window is until 2026-03-16
    await repo.updateItemStatus('b1', 'item-1', 'returned', undefined, '2026-03-14');
    const updatedBookings = await repo.getAll();
    // After cleaningEndDate (2026-03-17 onwards), it is available!
    const afterCleaning = getConflictingBookingsForItem(
      'item-1',
      '2026-03-17',
      '2026-03-20',
      updatedBookings
    );
    expect(afterCleaning).toHaveLength(0);

    // During its cleaning window (2026-03-15 to 2026-03-16), it still conflicts
    const duringCleaning = getConflictingBookingsForItem(
      'item-1',
      '2026-03-15',
      '2026-03-17',
      updatedBookings
    );
    expect(duringCleaning).toHaveLength(1);
  });

  it('isBookingFullyReturned tracks partial and full returns accurately', async () => {
    let bookings = await repo.getAll();
    expect(isBookingFullyReturned(bookings[0])).toBe(false);

    // b1 has 2 items: item-1 and item-2. Returning only item-1 leaves b1 partially returned
    await repo.updateItemStatus('b1', 'item-1', 'returned', undefined, '2026-03-14');
    bookings = await repo.getAll();
    expect(isBookingFullyReturned(bookings[0])).toBe(false);

    // Returning item-2 marks the booking fully returned and sets transactionDates.returned and cleaningEndDate
    await repo.updateItemStatus('b1', 'item-2', 'returned', undefined, '2026-03-14');
    bookings = await repo.getAll();
    expect(isBookingFullyReturned(bookings[0])).toBe(true);
    expect(bookings[0].transactionDates.returned).toBe('2026-03-14');
    expect(bookings[0].cleaningEndDate).toBe('2026-03-16');
  });

  it('updateItemStatus supports matching by itemCode as well as itemId', async () => {
    // b1 has item-1 with itemCode 'DIA01'
    await repo.updateItemStatus('b1', 'DIA01', 'pending_return', 'หมายเหตุ', '2026-03-12');
    const [booking] = await repo.getAll();
    const item1 = booking.items.find((it) => it.itemId === 'item-1');
    expect(item1?.status).toBe('pending_return');
    expect(item1?.conditionNote).toBe('หมายเหตุ');
  });

  it('updateBookingStatus atomically advances all remaining items and updates cleaningEndDate on return', async () => {
    await repo.updateBookingStatus('b1', 'returned', '2026-03-14');
    const [booking] = await repo.getAll();
    expect(isBookingFullyReturned(booking)).toBe(true);
    expect(booking.items.every((it) => it.status === 'returned')).toBe(true);
    expect(booking.transactionDates.returned).toBe('2026-03-14');
    expect(booking.cleaningEndDate).toBe('2026-03-16');
  });

  it('addBooking throws an error when attempting to double-book an item during an active booking window', async () => {
    await expect(
      repo.addBooking({
        customerId: 'c99',
        customerName: 'คุณทดสอบ',
        customerPhone: '081-111-2222',
        items: [
          {
            itemId: 'item-1',
            itemCode: 'DIA01',
            itemName: 'Dieu Ann Dress',
            itemImageUrl: '',
          },
        ],
        startDate: '2026-03-11',
        endDate: '2026-03-13',
        cleaningEndDate: '2026-03-15',
        durationDays: 3,
        rentalPrice: 300,
        deposit: 0,
        depositRefunded: false,
      })
    ).rejects.toThrow(/ติดจองในช่วงเวลาดังกล่าว/);
  });

  it('addBooking and deleteBooking work and notify subscribers', async () => {
    const newId = await repo.addBooking({
      customerId: 'c2',
      customerName: 'คุณมายด์',
      customerPhone: '089-999-1234',
      items: [
        {
          itemId: 'item-3',
          itemCode: 'BKN01',
          itemName: 'Bikini Set',
          itemImageUrl: '',
        },
      ],
      startDate: '2026-03-20',
      endDate: '2026-03-22',
      cleaningEndDate: '2026-03-24',
      durationDays: 3,
      rentalPrice: 80,
      deposit: 500,
      depositRefunded: false,
    });

    expect(newId).toBeDefined();
    expect(await repo.getAll()).toHaveLength(2);

    await repo.deleteBooking(newId);
    expect(await repo.getAll()).toHaveLength(1);
  });

  it('updateBookingStatus with "cancelled" updates transactionDates and line items status to cancelled', async () => {
    await repo.updateBookingStatus('b1', 'cancelled', '2026-03-05');
    const [booking] = await repo.getAll();
    expect(booking.transactionDates?.cancelled).toBe('2026-03-05');
    expect(booking.items.every((it) => it.status === 'cancelled')).toBe(true);

    // After cancellation, outfit item-1 is free for new bookings during original dates
    const conflicts = getConflictingBookingsForItem(
      'item-1',
      '2026-03-10',
      '2026-03-14',
      await repo.getAll()
    );
    expect(conflicts).toHaveLength(0);
  });
});
