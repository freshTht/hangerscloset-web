import { mockBookings } from '../../data/mockBookings';
import {
  getSubsequentStatusBlock,
  getTodayISO,
  normalizeTransactionDates,
  type Booking,
  type BookingItemStatus,
} from '../../types/booking';
import type { IBookingRepository, NewBookingInput } from './types';

export class MockBookingRepository implements IBookingRepository {
  readonly providerName = 'mock' as const;
  private bookings: Booking[];
  private listeners: Set<(bookings: Booking[]) => void> = new Set();
  private idCounter = 0;

  constructor(initialBookings: Booking[] = mockBookings) {
    this.bookings = initialBookings.map((b) => ({
      ...b,
      customerLineId: b.customerLineId ?? null,
      note: b.note ?? null,
      transactionDates: normalizeTransactionDates(
        b.transactionDates,
        b.startDate,
        b.items
      ),
      items: b.items.map((item) => ({
        itemId: item.itemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        itemImageUrl: item.itemImageUrl,
        conditionNote: item.conditionNote ?? null,
      })),
    }));
  }

  private cloneBookings(): Booking[] {
    return this.bookings.map((b) => ({
      ...b,
      transactionDates: { ...(b.transactionDates ?? {}) },
      items: b.items.map((item) => ({ ...item })),
    }));
  }

  private notifyListeners(): void {
    const snapshot = this.cloneBookings();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  subscribe(callback: (bookings: Booking[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.cloneBookings());

    return () => {
      this.listeners.delete(callback);
    };
  }

  async getAll(): Promise<Booking[]> {
    return this.cloneBookings();
  }

  async addBooking(bookingData: NewBookingInput): Promise<string> {
    this.idCounter += 1;
    const nowIso = new Date().toISOString();
    const today = getTodayISO();
    const defaultReservedDate =
      bookingData.startDate && bookingData.startDate < today
        ? bookingData.startDate
        : today;
    const newId = `book-${Date.now()}-${this.idCounter}`;
    const newBooking: Booking = {
      ...bookingData,
      id: newId,
      customerLineId: bookingData.customerLineId ?? null,
      note: bookingData.note ?? null,
      transactionDates: normalizeTransactionDates(
        bookingData.transactionDates ?? { reserved: defaultReservedDate },
        defaultReservedDate
      ),
      items: bookingData.items.map((item) => ({
        itemId: item.itemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        itemImageUrl: item.itemImageUrl,
        conditionNote: item.conditionNote ?? null,
      })),
      createdAt: bookingData.createdAt ?? nowIso,
      updatedAt: bookingData.updatedAt ?? nowIso,
    };

    this.bookings = [newBooking, ...this.bookings];
    this.notifyListeners();
    return newId;
  }

  async updateBooking(
    id: string,
    bookingData: Partial<Omit<Booking, 'id'>>
  ): Promise<void> {
    const index = this.bookings.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new Error(`Booking with id "${id}" not found.`);
    }

    const existing = this.bookings[index];
    const updated: Booking = {
      ...existing,
      ...bookingData,
      id,
      transactionDates: bookingData.transactionDates
        ? { ...bookingData.transactionDates }
        : { ...existing.transactionDates },
      items: bookingData.items
        ? bookingData.items.map((item) => ({
            itemId: item.itemId,
            itemCode: item.itemCode,
            itemName: item.itemName,
            itemImageUrl: item.itemImageUrl,
            conditionNote: item.conditionNote ?? null,
          }))
        : existing.items,
      updatedAt: bookingData.updatedAt ?? new Date().toISOString(),
    };

    this.bookings = [
      ...this.bookings.slice(0, index),
      updated,
      ...this.bookings.slice(index + 1),
    ];
    this.notifyListeners();
  }

  async updateItemStatus(
    bookingId: string,
    itemId: string,
    status: BookingItemStatus,
    conditionNote?: string | null,
    effectiveDate?: string
  ): Promise<void> {
    const index = this.bookings.findIndex((b) => b.id === bookingId);
    if (index === -1) {
      throw new Error(`Booking with id "${bookingId}" not found.`);
    }

    const existing = this.bookings[index];
    const itemExists = existing.items.some((li) => li.itemId === itemId);
    if (!itemExists) {
      throw new Error(
        `Item with id "${itemId}" not found in booking "${bookingId}".`
      );
    }

    const targetDate = effectiveDate ?? getTodayISO();
    const block = getSubsequentStatusBlock(existing, targetDate, status);
    if (block) {
      throw new Error(
        `Cannot change status on ${targetDate} because a subsequent date (${block.date}) already moved the booking to "${block.status}".`
      );
    }

    const updatedItems = existing.items.map((li) => {
      if (li.itemId !== itemId) return li;
      return {
        ...li,
        conditionNote:
          conditionNote !== undefined ? conditionNote : li.conditionNote ?? null,
      };
    });

    const updatedBooking: Booking = {
      ...existing,
      transactionDates: {
        ...existing.transactionDates,
        [status]: targetDate,
      },
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };

    this.bookings = [
      ...this.bookings.slice(0, index),
      updatedBooking,
      ...this.bookings.slice(index + 1),
    ];
    this.notifyListeners();
  }

  async deleteBooking(id: string): Promise<void> {
    const index = this.bookings.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new Error(`Booking with id "${id}" not found.`);
    }

    this.bookings = [
      ...this.bookings.slice(0, index),
      ...this.bookings.slice(index + 1),
    ];
    this.notifyListeners();
  }
}

export const mockBookingRepository = new MockBookingRepository();
