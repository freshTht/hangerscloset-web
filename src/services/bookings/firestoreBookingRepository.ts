import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  type DocumentData,
  type QuerySnapshot,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import {
  addDaysISO,
  getConflictingBookingsForItem,
  getSubsequentStatusBlock,
  getTodayISO,
  normalizeTransactionDates,
  type Booking,
  type BookingItemStatus,
  type BookingLineItem,
} from '../../types/booking';
import type { IBookingRepository, NewBookingInput } from './types';

const COLLECTION_NAME = 'bookings';

function stripUndefined<T extends object>(data: T): T {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as T;
}

function docToBooking(id: string, data: DocumentData): Booking {
  const isReturnedBooking = data.transactionDates?.returned !== undefined;
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items: BookingLineItem[] = rawItems.map(
    (raw: Record<string, unknown>) => {
      let returnedDate: string | null = null;
      if (raw?.returnedDate) {
        returnedDate = String(raw.returnedDate);
      } else if (isReturnedBooking && data.transactionDates?.returned) {
        returnedDate = String(data.transactionDates.returned);
      }

      let cleaningEndDate: string | null = null;
      if (raw?.cleaningEndDate) {
        cleaningEndDate = String(raw.cleaningEndDate);
      } else if (returnedDate) {
        cleaningEndDate = addDaysISO(returnedDate, 2);
      }

      return {
        itemId: String(raw?.itemId ?? ''),
        itemCode: String(raw?.itemCode ?? ''),
        itemName: String(raw?.itemName ?? ''),
        itemImageUrl: String(raw?.itemImageUrl ?? ''),
        conditionNote:
          raw?.conditionNote !== undefined && raw?.conditionNote !== null
            ? String(raw.conditionNote)
            : null,
        status: (raw?.status as BookingItemStatus) ?? (isReturnedBooking ? 'returned' : null),
        returnedDate,
        cleaningEndDate,
      };
    }
  );

  const startDate = String(data.startDate ?? '');
  const transactionDates = normalizeTransactionDates(
    data.transactionDates,
    startDate,
    rawItems as Array<{ status?: BookingItemStatus }>
  );

  const nowIso = new Date().toISOString();

  return {
    id,
    customerId: String(data.customerId ?? ''),
    customerName: String(data.customerName ?? ''),
    customerPhone: String(data.customerPhone ?? ''),
    customerLineId: data.customerLineId ?? null,
    items,
    transactionDates,
    startDate,
    endDate: String(data.endDate ?? ''),
    cleaningEndDate: String(data.cleaningEndDate ?? ''),
    durationDays: Number(data.durationDays ?? 1),
    rentalPrice: Number(data.rentalPrice ?? 0),
    deposit: Number(data.deposit ?? 0),
    depositRefunded: Boolean(data.depositRefunded),
    note: data.note ?? null,
    createdAt: String(data.createdAt ?? nowIso),
    updatedAt: String(data.updatedAt ?? nowIso),
  };
}

export class FirestoreBookingRepository implements IBookingRepository {
  readonly providerName = 'firebase' as const;

  subscribe(callback: (bookings: Booking[]) => void): () => void {
    if (!isFirebaseConfigured || !db) {
      console.warn('[Firestore] Not configured, subscribe returning empty bookings list.');
      callback([]);
      return () => {};
    }

    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, orderBy('startDate', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const bookings = snapshot.docs.map((docSnap) =>
          docToBooking(docSnap.id, docSnap.data())
        );
        callback(bookings);
      },
      (error) => {
        console.error('[Firestore] bookings onSnapshot error:', error);
      }
    );

    return unsubscribe;
  }

  async getAll(): Promise<Booking[]> {
    if (!isFirebaseConfigured || !db) {
      return [];
    }

    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((docSnap) =>
      docToBooking(docSnap.id, docSnap.data())
    );
  }

  async addBooking(bookingData: NewBookingInput): Promise<string> {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firestore is not configured.');
    }

    // Pre-save conflict checking
    const existingBookings = await this.getAll();
    for (const item of bookingData.items) {
      const conflicts = getConflictingBookingsForItem(
        item.itemId,
        bookingData.startDate,
        bookingData.cleaningEndDate,
        existingBookings
      );
      if (conflicts.length > 0) {
        throw new Error(
          `ชุดรหัส "${item.itemCode || item.itemId}" ติดจองในช่วงเวลาดังกล่าว (${conflicts[0].customerName})`
        );
      }
    }

    const nowIso = new Date().toISOString();
    const today = getTodayISO();
    const defaultReservedDate =
      bookingData.startDate && bookingData.startDate < today
        ? bookingData.startDate
        : today;

    const payload = stripUndefined({
      ...bookingData,
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
    });

    const colRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(colRef, payload);
    return docRef.id;
  }

  async updateBooking(
    id: string,
    bookingData: Partial<Omit<Booking, 'id'>>
  ): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firestore is not configured.');
    }

    const docRef = doc(db, COLLECTION_NAME, id);

    // Pre-save conflict checking if items or dates are being modified
    if (bookingData.items || bookingData.startDate || bookingData.cleaningEndDate) {
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        throw new Error(`Booking with id "${id}" not found.`);
      }
      const current = docToBooking(snap.id, snap.data());
      const allBookings = await this.getAll();
      const targetStart = bookingData.startDate ?? current.startDate;
      const targetCleaningEnd =
        bookingData.cleaningEndDate ?? current.cleaningEndDate;
      const itemsToCheck = bookingData.items ?? current.items;

      for (const item of itemsToCheck) {
        const conflicts = getConflictingBookingsForItem(
          item.itemId,
          targetStart,
          targetCleaningEnd,
          allBookings,
          id
        );
        if (conflicts.length > 0) {
          throw new Error(
            `ชุดรหัส "${item.itemCode || item.itemId}" ติดจองในช่วงเวลาดังกล่าว (${conflicts[0].customerName})`
          );
        }
      }
    }

    const payload = stripUndefined({
      ...bookingData,
      updatedAt: bookingData.updatedAt ?? new Date().toISOString(),
    });
    await updateDoc(docRef, payload);
  }

  async updateBookingStatus(
    bookingId: string,
    status: BookingItemStatus,
    effectiveDate?: string
  ): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firestore is not configured.');
    }

    const docRef = doc(db, COLLECTION_NAME, bookingId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error(`Booking with id "${bookingId}" not found.`);
    }

    const current = docToBooking(snap.id, snap.data());
    const targetDate = effectiveDate ?? getTodayISO();
    const block = getSubsequentStatusBlock(current, targetDate, status);
    if (block) {
      throw new Error(
        `Cannot change status on ${targetDate} because a subsequent date (${block.date}) already moved the booking to "${block.status}".`
      );
    }

    const isReturning = status === 'returned';
    const isCancelling = status === 'cancelled';
    const updatedItems = current.items.map((li) => {
      if (li.status === 'returned' && !isReturning && !isCancelling) {
        return li;
      }
      let cleaningEnd: string | null = li.cleaningEndDate ?? null;
      if (isReturning) {
        cleaningEnd = li.cleaningEndDate ?? addDaysISO(targetDate, 2);
      } else if (isCancelling) {
        cleaningEnd = null;
      }

      return {
        ...li,
        status,
        returnedDate: isReturning
          ? (li.returnedDate ?? targetDate)
          : li.returnedDate ?? null,
        cleaningEndDate: cleaningEnd,
      };
    });

    const updatedTransactionDates = {
      ...current.transactionDates,
      [status]: targetDate,
    };

    await updateDoc(docRef, {
      transactionDates: updatedTransactionDates,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
      ...(isReturning ? { cleaningEndDate: addDaysISO(targetDate, 2) } : {}),
    });
  }

  async updateItemStatus(
    bookingId: string,
    itemId: string,
    status: BookingItemStatus,
    conditionNote?: string | null,
    effectiveDate?: string
  ): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firestore is not configured.');
    }

    const docRef = doc(db, COLLECTION_NAME, bookingId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error(`Booking with id "${bookingId}" not found.`);
    }

    const current = docToBooking(snap.id, snap.data());
    const targetDate = effectiveDate ?? getTodayISO();
    const block = getSubsequentStatusBlock(current, targetDate, status);
    if (block) {
      throw new Error(
        `Cannot change status on ${targetDate} because a subsequent date (${block.date}) already moved the booking to "${block.status}".`
      );
    }

    const isReturning = status === 'returned';
    const updatedItems = current.items.map((li) => {
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
      ...current.transactionDates,
    };

    if (allReturned) {
      updatedTransactionDates.returned = targetDate;
    } else if (status !== 'returned') {
      updatedTransactionDates[status] = targetDate;
    }

    await updateDoc(docRef, {
      transactionDates: updatedTransactionDates,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
      ...(allReturned ? { cleaningEndDate: addDaysISO(targetDate, 2) } : {}),
    });
  }

  async deleteBooking(id: string): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firestore is not configured.');
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
}

export const firestoreBookingRepository = new FirestoreBookingRepository();
