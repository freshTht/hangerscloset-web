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
import type {
  Booking,
  BookingItemStatus,
  BookingLineItem,
} from '../../types/booking';
import type { IBookingRepository, NewBookingInput } from './types';

const COLLECTION_NAME = 'bookings';

function stripUndefined<T extends object>(data: T): T {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as T;
}

function docToBooking(id: string, data: DocumentData): Booking {
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items: BookingLineItem[] = rawItems.map(
    (raw: Record<string, unknown>) => ({
      itemId: String(raw?.itemId ?? ''),
      itemCode: String(raw?.itemCode ?? ''),
      itemName: String(raw?.itemName ?? ''),
      itemImageUrl: String(raw?.itemImageUrl ?? ''),
      status: (raw?.status as BookingItemStatus) ?? 'reserved',
      conditionNote:
        raw?.conditionNote !== undefined && raw?.conditionNote !== null
          ? String(raw.conditionNote)
          : null,
    })
  );

  const nowIso = new Date().toISOString();

  return {
    id,
    customerId: String(data.customerId ?? ''),
    customerName: String(data.customerName ?? ''),
    customerPhone: String(data.customerPhone ?? ''),
    customerLineId: data.customerLineId ?? null,
    items,
    startDate: String(data.startDate ?? ''),
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

    const nowIso = new Date().toISOString();
    const payload = stripUndefined({
      ...bookingData,
      customerLineId: bookingData.customerLineId ?? null,
      note: bookingData.note ?? null,
      items: bookingData.items.map((item) => ({
        itemId: item.itemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        itemImageUrl: item.itemImageUrl,
        status: item.status,
        conditionNote: item.conditionNote ?? null,
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
    const payload = stripUndefined({
      ...bookingData,
      updatedAt: bookingData.updatedAt ?? new Date().toISOString(),
    });
    await updateDoc(docRef, payload);
  }

  async updateItemStatus(
    bookingId: string,
    itemId: string,
    status: BookingItemStatus,
    conditionNote?: string | null
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
    const updatedItems = current.items.map((li) => {
      if (li.itemId !== itemId) return li;
      return {
        ...li,
        status,
        conditionNote:
          conditionNote !== undefined ? conditionNote : li.conditionNote ?? null,
      };
    });

    await updateDoc(docRef, {
      items: updatedItems,
      updatedAt: new Date().toISOString(),
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
