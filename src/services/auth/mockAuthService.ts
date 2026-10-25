import type { AuthUser, IAuthService } from './types';

export const DEFAULT_MOCK_USER: AuthUser = {
  uid: 'mock-user-001',
  displayName: 'ทีมงาน Hanger\'s Closet',
  email: 'staff@hangerscloset.com',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces',
};

const STORAGE_KEY = 'hangers_mock_auth_user';

export class MockAuthService implements IAuthService {
  readonly providerName = 'mock' as const;
  private currentUser: AuthUser | null = null;
  private listeners: Set<(user: AuthUser | null) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.currentUser = JSON.parse(stored) as AuthUser;
        }
      }
    } catch {
      this.currentUser = null;
    }
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.currentUser);
    }
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.add(callback);
    // Asynchronously or immediately call with current state
    callback(this.currentUser);

    return () => {
      this.listeners.delete(callback);
    };
  }

  async signInWithGoogle(): Promise<AuthUser> {
    // Simulate brief latency for realistic UI feedback
    await new Promise((resolve) => setTimeout(resolve, 200));

    this.currentUser = { ...DEFAULT_MOCK_USER };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentUser));
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }

    this.notifyListeners();
    return this.currentUser;
  }

  async signOut(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.currentUser = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }

    this.notifyListeners();
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }
}

export const mockAuthService = new MockAuthService();
