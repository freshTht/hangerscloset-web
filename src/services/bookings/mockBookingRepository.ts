import { mockBookings } from '../../data/mockBookings';
import {
  addDaysISO,
  getConflictingBookingsForItem,
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
    this.bookings = initialBookings.map((b) => {
      const isReturnedBooking = b.transactionDates?.returned !== undefined;
      return {
        ...b,
        customerLineId: b.customerLineId ?? null,
        note: b.note ?? null,
        transactionDates: normalizeTransactionDates(
          b.transactionDates,
          b.startDate,
          b.items
        ),
        items: b.items.map((item) => {
          const status = item.status ?? (isReturnedBooking ? 'returned' : null);
          const returnedDate =
            item.returnedDate ??
            (isReturnedBooking ? (b.transactionDates.returned ?? null) : null);
          const cleaningEndDate =
            item.cleaningEndDate ??
            (returnedDate ? addDaysISO(returnedDate, 2) : null);

          return {
            itemId: item.itemId,
            itemCode: item.itemCode,
            itemName: item.itemName,
            itemImageUrl: item.itemImageUrl,
            conditionNote: item.conditionNote ?? null,
            status,
            returnedDate,
            cleaningEndDate,
          };
        }),
      };
    });
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
    // Pre-save conflict checking
    for (const item of bookingData.items) {
      const conflicts = getConflictingBookingsForItem(
        item.itemId,
        bookingData.startDate,
        bookingData.cleaningEndDate,
        this.bookings
      );
      if (conflicts.length > 0) {
        throw new Error(
          `ชุดรหัส "${item.itemCode || item.itemId}" ติดจองในช่วงเวลาดังกล่าว (${conflicts[0].customerName})`
        );
      }
    }

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
        status: item.status ?? null,
        returnedDate: item.returnedDate ?? null,
        cleaningEndDate: item.cleaningEndDate ?? null,
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
    const targetStart = bookingData.startDate ?? existing.startDate;
    const targetCleaningEnd =
      bookingData.cleaningEndDate ?? existing.cleaningEndDate;
    const itemsToCheck = bookingData.items ?? existing.items;

    // Pre-save conflict checking (excluding this booking)
    for (const item of itemsToCheck) {
      const conflicts = getConflictingBookingsForItem(
        item.itemId,
        targetStart,
        targetCleaningEnd,
        this.bookings,
        id
      );
      if (conflicts.length > 0) {
        throw new Error(
          `ชุดรหัส "${item.itemCode || item.itemId}" ติดจองในช่วงเวลาดังกล่าว (${conflicts[0].customerName})`
        );
      }
    }

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
            status: item.status ?? null,
            returnedDate: item.returnedDate ?? null,
            cleaningEndDate: item.cleaningEndDate ?? null,
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

  async updateBookingStatus(
    bookingId: string,
    status: BookingItemStatus,
    effectiveDate?: string
  ): Promise<void> {
    const index = this.bookings.findIndex((b) => b.id === bookingId);
    if (index === -1) {
      throw new Error(`Booking with id "${bookingId}" not found.`);
    }

    const existing = this.bookings[index];
    const targetDate = effectiveDate ?? getTodayISO();
    const block = getSubsequentStatusBlock(existing, targetDate, status);
    if (block) {
      throw new Error(
        `Cannot change status on ${targetDate} because a subsequent date (${block.date}) already moved the booking to "${block.status}".`
      );
    }

    const isReturning = status === 'returned';
    const updatedItems = existing.items.map((li) => {
      if (li.status === 'returned' && !isReturning) {
        return li;
      }
      return {
        ...li,
        status,
        returnedDate: isReturning
          ? (li.returnedDate ?? targetDate)
          : li.returnedDate ?? null,
        cleaningEndDate: isReturning
          ? (li.cleaningEndDate ?? addDaysISO(targetDate, 2))
          : li.cleaningEndDate ?? null,
      };
    });

    const updatedBooking: Booking = {
      ...existing,
      transactionDates: {
        ...existing.transactionDates,
        [status]: targetDate,
      },
      cleaningEndDate: isReturning
        ? addDaysISO(targetDate, 2)
        : existing.cleaningEndDate,
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
    const itemExists = existing.items.some(
      (li) => li.itemId === itemId || (li.itemCode && li.itemCode === itemId)
    );
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

    const isReturning = status === 'returned';
    const updatedItems = existing.items.map((li) => {
      if (li.itemId !== itemId && li.itemCode !== itemId) return li;
      return {
        ...li,
        status,
        conditionNote:
          conditionNote !== undefined ? conditionNote : li.conditionNote ?? null,
        returnedDate: isReturning ? targetDate : li.returnedDate ?? null,
        cleaningEndDate: isReturning
          ? addDaysISO(targetDate, 2)
          : li.cleaningEndDate ?? null,
      };
    });

    const allReturned =
      updatedItems.length > 0 &&
      updatedItems.every((li) => li.status === 'returned');

    const updatedTransactionDates = {
      ...existing.transactionDates,
    };

    if (allReturned) {
      updatedTransactionDates.returned = targetDate;
    } else if (status !== 'returned') {
      updatedTransactionDates[status] = targetDate;
    }

    const updatedBooking: Booking = {
      ...existing,
      transactionDates: updatedTransactionDates,
      cleaningEndDate: allReturned
        ? addDaysISO(targetDate, 2)
        : existing.cleaningEndDate,
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
