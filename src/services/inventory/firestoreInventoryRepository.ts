import {
  collection,
  doc,
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
import type { InventoryItem, InventoryStatus } from '../../types/inventory';
import type { IInventoryRepository } from './types';

const COLLECTION_NAME = 'inventory';

// Firestore rejects `undefined` field values; drop them before writing.
function stripUndefined<T extends object>(data: T): T {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as T;
}

function docToInventoryItem(id: string, data: DocumentData): InventoryItem {
  const tags: string[] = Array.isArray(data.tags)
    ? data.tags
    : typeof data.type === 'string' && data.type.trim()
    ? [data.type.trim()]
    : [];

  return {
    id,
    name: data.name ?? '',
    code: data.code ?? '',
    brand: data.brand ?? '',
    color: data.color ?? '',
    size: data.size ?? '',
    type: data.type ?? (tags[0] ?? undefined),
    tags,
    note: data.note ?? null,
    accessories: data.accessories ?? null,
    owner: data.owner ?? null,
    imageFile: data.imageFile ?? undefined,
    imageUrl: data.imageUrl ?? '',
    rentalPrices: {
      oneDay: data.rentalPrices?.oneDay ?? 0,
      threeDays: data.rentalPrices?.threeDays ?? 0,
      fiveDays: data.rentalPrices?.fiveDays ?? 0,
    },
    status: (data.status as InventoryStatus) ?? 'available',
  };
}

export class FirestoreInventoryRepository implements IInventoryRepository {
  readonly providerName = 'firebase' as const;

  subscribe(callback: (items: InventoryItem[]) => void): () => void {
    if (!isFirebaseConfigured || !db) {
      console.warn('[Firestore] Not configured, subscribe returning empty list.');
      callback([]);
      return () => {};
    }

    const colRef = collection(db, COLLECTION_NAME);
    // Order by code ascending if possible, otherwise raw
    const q = query(colRef, orderBy('code', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items = snapshot.docs.map((docSnap) =>
          docToInventoryItem(docSnap.id, docSnap.data())
        );
        callback(items);
      },
      (error) => {
        console.error('[Firestore] onSnapshot error:', error);
      }
    );

    return unsubscribe;
  }

  async getAll(): Promise<InventoryItem[]> {
    if (!isFirebaseConfigured || !db) {
      return [];
    }

    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((docSnap) =>
      docToInventoryItem(docSnap.id, docSnap.data())
    );
  }

  async updateStatus(id: string, status: InventoryStatus): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firestore is not configured.');
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { status });
  }

  async addItem(itemData: Omit<InventoryItem, 'id'>): Promise<string> {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firestore is not configured.');
    }

    const colRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(colRef, stripUndefined(itemData));
    return docRef.id;
  }

  async updateItem(
    id: string,
    itemData: Partial<Omit<InventoryItem, 'id'>>
  ): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firestore is not configured.');
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, stripUndefined(itemData));
  }

  async deleteItem(id: string): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firestore is not configured.');
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
}

export const firestoreInventoryRepository = new FirestoreInventoryRepository();
