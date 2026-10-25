import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockAuthService, DEFAULT_MOCK_USER } from '../mockAuthService';

describe('MockAuthService', () => {
  let authService: MockAuthService;

  beforeEach(() => {
    localStorage.clear();
    authService = new MockAuthService();
  });

  it('starts with no user if localStorage is empty', () => {
    expect(authService.getCurrentUser()).toBeNull();
  });

  it('signs in with mock user and notifies listeners', async () => {
    const listener = vi.fn();
    authService.onAuthStateChanged(listener);

    // Initial callback
    expect(listener).toHaveBeenCalledWith(null);

    const user = await authService.signInWithGoogle();
    expect(user.displayName).toBe(DEFAULT_MOCK_USER.displayName);
    expect(user.email).toBe(DEFAULT_MOCK_USER.email);
    expect(authService.getCurrentUser()).toEqual(user);

    // Listener was notified of the signed-in user
    expect(listener).toHaveBeenCalledWith(user);
  });

  it('persists signed-in user to localStorage', async () => {
    await authService.signInWithGoogle();

    // Instantiate a new service instance to verify persistence restoration
    const restoredService = new MockAuthService();
    expect(restoredService.getCurrentUser()).toEqual(
      expect.objectContaining({
        email: DEFAULT_MOCK_USER.email,
        displayName: DEFAULT_MOCK_USER.displayName,
      })
    );
  });

  it('signs out and clears user state and storage', async () => {
    const listener = vi.fn();
    await authService.signInWithGoogle();

    authService.onAuthStateChanged(listener);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ email: DEFAULT_MOCK_USER.email }));

    await authService.signOut();
    expect(authService.getCurrentUser()).toBeNull();
    expect(listener).toHaveBeenCalledWith(null);
    expect(localStorage.getItem('hangers_mock_auth_user')).toBeNull();
  });

  it('allows unsubscribing from auth state changes', async () => {
    const listener = vi.fn();
    const unsubscribe = authService.onAuthStateChanged(listener);
    listener.mockClear();

    unsubscribe();
    await authService.signInWithGoogle();

    expect(listener).not.toHaveBeenCalled();
  });
});
