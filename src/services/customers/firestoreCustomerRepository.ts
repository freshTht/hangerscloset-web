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
import type { Customer } from '../../types/customer';
import { matchesCustomerQuery } from './mockCustomerRepository';
import type { ICustomerRepository, NewCustomerInput } from './types';

const COLLECTION_NAME = 'customers';

function stripUndefined<T extends object>(data: T): T {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as T;
}

function docToCustomer(id: string, data: DocumentData): Customer {
  return {
    id,
    name: String(data.name ?? ''),
    phone: String(data.phone ?? ''),
    lineId: data.lineId ?? null,
    note: data.note ?? null,
    createdAt: String(data.createdAt ?? new Date().toISOString()),
  };
}

export class FirestoreCustomerRepository implements ICustomerRepository {
  readonly providerName = 'firebase' as const;

  subscribe(callback: (customers: Customer[]) => void): () => void {
    if (!isFirebaseConfigured || !db) {
      console.warn('[Firestore] Not configured, subscribe returning empty customers list.');
      callback([]);
      return () => {};
    }

    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const customers = snapshot.docs.map((docSnap) =>
          docToCustomer(docSnap.id, docSnap.data())
        );
        callback(customers);
      },
      (error) => {
        console.error('[Firestore] customers onSnapshot error:', error);
      }
    );

    return unsubscribe;
  }

  async getAll(): Promise<Customer[]> {
    if (!isFirebaseConfigured || !db) {
      return [];
    }

    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((docSnap) =>
      docToCustomer(docSnap.id, docSnap.data())
    );
  }

  async searchByPhoneOrName(searchQuery: string): Promise<Customer[]> {
    const all = await this.getAll();
    return all.filter((c) => matchesCustomerQuery(c, searchQuery));
  }

  async addCustomer(customerData: NewCustomerInput): Promise<string> {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firestore is not configured.');
    }

    const payload = stripUndefined({
      name: customerData.name.trim(),
      phone: customerData.phone.trim(),
      lineId: customerData.lineId?.trim() || null,
      note: customerData.note?.trim() || null,
      createdAt: customerData.createdAt ?? new Date().toISOString(),
    });

    const colRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(colRef, payload);
    return docRef.id;
  }

  async updateCustomer(
    id: string,
    customerData: Partial<Omit<Customer, 'id'>>
  ): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firestore is not configured.');
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, stripUndefined(customerData));
  }

  async deleteCustomer(id: string): Promise<void> {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firestore is not configured.');
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
}

export const firestoreCustomerRepository = new FirestoreCustomerRepository();
