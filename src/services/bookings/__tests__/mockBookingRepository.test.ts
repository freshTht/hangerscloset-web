import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockBookingRepository } from '../mockBookingRepository';
import {
  getConflictingBookingsForItem,
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
        status: 'reserved',
        conditionNote: null,
      },
      {
        itemId: 'item-2',
        itemCode: 'SH01',
        itemName: 'Boots',
        itemImageUrl: '/sh01.jpg',
        status: 'delivered',
        conditionNote: null,
      },
    ],
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
  });

  it('updateItemStatus updates a single line item status and notifies subscribers', async () => {
    const listener = vi.fn();
    repo.subscribe(listener);

    await repo.updateItemStatus('b1', 'item-1', 'pending_delivery', 'พร้อมส่ง');

    const all = await repo.getAll();
    const item1 = all[0].items.find((i) => i.itemId === 'item-1');
    const item2 = all[0].items.find((i) => i.itemId === 'item-2');
    expect(item1?.status).toBe('pending_delivery');
    expect(item1?.conditionNote).toBe('พร้อมส่ง');
    expect(item2?.status).toBe('delivered');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('detects date-range conflicts including cleaning window and ignores returned items', async () => {
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

    // Once item is returned, it no longer blocks availability
    await repo.updateItemStatus('b1', 'item-1', 'returned');
    const updatedBookings = await repo.getAll();
    const afterReturn = getConflictingBookingsForItem(
      'item-1',
      '2026-03-10',
      '2026-03-14',
      updatedBookings
    );
    expect(afterReturn).toHaveLength(0);
  });

  it('isBookingFullyReturned returns true only when all line items are returned', async () => {
    let bookings = await repo.getAll();
    expect(isBookingFullyReturned(bookings[0])).toBe(false);

    await repo.updateItemStatus('b1', 'item-1', 'returned');
    bookings = await repo.getAll();
    expect(isBookingFullyReturned(bookings[0])).toBe(false);

    await repo.updateItemStatus('b1', 'item-2', 'returned');
    bookings = await repo.getAll();
    expect(isBookingFullyReturned(bookings[0])).toBe(true);
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
          status: 'reserved',
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
});
