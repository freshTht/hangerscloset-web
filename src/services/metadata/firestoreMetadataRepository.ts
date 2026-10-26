import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  query,
  orderBy,
  type DocumentData,
  type QuerySnapshot,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import type { IMetadataRepository, MetadataCategory } from './types';

export class FirestoreMetadataRepository implements IMetadataRepository {
  readonly providerName = 'firebase' as const;
  private hasSeeded = false;

  private getColRef(category: MetadataCategory) {
    if (!db) return null;
    return collection(db, category);
  }

  // Fallback seed from inventory collection if metadata collections are empty
  private async autoSeedIfEmpty(): Promise<void> {
    if (!isFirebaseConfigured || !db || this.hasSeeded) return;
    this.hasSeeded = true;

    try {
      const invCol = collection(db, 'inventory');
      const invSnap = await getDocs(invCol);
      if (invSnap.empty) return;

      const sets: Record<MetadataCategory, Set<string>> = {
        brands: new Set(),
        colors: new Set(),
        sizes: new Set(['XS', 'S', 'M', 'L', 'XL', 'Free size']),
        tags: new Set(),
      };

      invSnap.docs.forEach((d) => {
        const data = d.data();
        if (data.brand?.trim() && data.brand.trim() !== '-') sets.brands.add(data.brand.trim());
        if (data.color?.trim()) sets.colors.add(data.color.trim());
        if (data.size?.trim()) sets.sizes.add(data.size.trim());
        if (Array.isArray(data.tags)) {
          data.tags.forEach((t: string) => {
            if (t?.trim()) sets.tags.add(t.trim());
          });
        } else if (data.type?.trim()) {
          sets.tags.add(data.type.trim());
        }
      });

      const categories: MetadataCategory[] = ['brands', 'colors', 'sizes', 'tags'];
      for (const cat of categories) {
        const catCol = collection(db, cat);
        const catSnap = await getDocs(catCol);
        if (catSnap.empty && sets[cat].size > 0) {
          const promises = Array.from(sets[cat]).map((name) => {
            const docId = encodeURIComponent(name.toLowerCase().replace(/[\/\s]+/g, '_'));
            return setDoc(doc(db!, cat, docId), { name });
          });
          await Promise.all(promises);
        }
      }
    } catch (err) {
      console.warn('[FirestoreMetadataRepository] autoSeed error (non-fatal):', err);
    }
  }

  async getOptions(category: MetadataCategory): Promise<string[]> {
    if (!isFirebaseConfigured || !db) return [];
    const colRef = this.getColRef(category);
    if (!colRef) return [];

    await this.autoSeedIfEmpty();
    const q = query(colRef, orderBy('name', 'asc'));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data().name as string)
      .filter(Boolean);
  }

  subscribe(
    category: MetadataCategory,
    callback: (options: string[]) => void
  ): () => void {
    if (!isFirebaseConfigured || !db) {
      callback([]);
      return () => {};
    }

    const colRef = this.getColRef(category);
    if (!colRef) {
      callback([]);
      return () => {};
    }

    // Trigger auto-seed check in background
    void this.autoSeedIfEmpty();

    const q = query(colRef, orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const options = snapshot.docs
          .map((d) => d.data().name as string)
          .filter(Boolean);
        callback(options);
      },
      (error) => {
        console.error(`[FirestoreMetadataRepository] onSnapshot error on ${category}:`, error);
      }
    );

    return unsubscribe;
  }

  async addOption(category: MetadataCategory, name: string): Promise<string> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('ชื่อตัวเลือกไม่สามารถเว้นว่างได้');
    }
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firestore is not configured.');
    }

    const docId = encodeURIComponent(trimmed.toLowerCase().replace(/[\/\s]+/g, '_'));
    const docRef = doc(db, category, docId);
    await setDoc(docRef, { name: trimmed }, { merge: true });
    return trimmed;
  }
}

export const firestoreMetadataRepository = new FirestoreMetadataRepository();
