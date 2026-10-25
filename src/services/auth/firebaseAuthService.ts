import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../../lib/firebase';
import type { AuthUser, IAuthService } from './types';

function mapFirebaseUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
}

export class FirebaseAuthService implements IAuthService {
  readonly providerName = 'firebase' as const;

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    if (!isFirebaseConfigured || !auth) {
      callback(null);
      return () => {};
    }

    return firebaseOnAuthStateChanged(auth, (firebaseUser) => {
      callback(mapFirebaseUser(firebaseUser));
    });
  }

  async signInWithGoogle(): Promise<AuthUser> {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      throw new Error(
        'Firebase is not configured. Please supply VITE_FIREBASE_* credentials in your environment.'
      );
    }

    const result = await signInWithPopup(auth, googleProvider);
    const user = mapFirebaseUser(result.user);
    if (!user) {
      throw new Error('Sign-in succeeded but failed to map Firebase user.');
    }
    return user;
  }

  async signOut(): Promise<void> {
    if (!isFirebaseConfigured || !auth) {
      return;
    }
    await firebaseSignOut(auth);
  }

  getCurrentUser(): AuthUser | null {
    if (!isFirebaseConfigured || !auth) {
      return null;
    }
    return mapFirebaseUser(auth.currentUser);
  }
}

export const firebaseAuthService = new FirebaseAuthService();
