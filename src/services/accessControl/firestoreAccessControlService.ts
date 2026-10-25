import { doc, getDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import type { IAccessControlService } from './types';

export class FirestoreAccessControlService implements IAccessControlService {
  async checkIsAuthorized(email: string | null): Promise<boolean> {
    if (!email) return false;

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check local environment variable override if provided
    const envEmails = (import.meta.env.VITE_ALLOWED_EMAILS || '')
      .split(',')
      .map((e: string) => e.trim().toLowerCase())
      .filter(Boolean);

    if (envEmails.includes(normalizedEmail)) {
      return true;
    }

    // 2. Query Firestore collection 'allowed_users'
    if (!isFirebaseConfigured || !db) {
      console.warn('[AccessControl] Firebase db not available, denying access.');
      return false;
    }

    try {
      const docRef = doc(db, 'allowed_users', normalizedEmail);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return false;
      }

      const data = snapshot.data();
      // If document exists, check if disabled explicitly
      return data.enabled !== false;
    } catch (error) {
      console.error('[AccessControl] Error checking authorization:', error);
      return false;
    }
  }
}

export const firestoreAccessControlService = new FirestoreAccessControlService();
