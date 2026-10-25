import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { AuthProvider } from '../../contexts/AuthContext';
import type { IAuthService, AuthUser } from '../../services/auth';

class TestAuthService implements IAuthService {
  readonly providerName = 'mock' as const;
  private user: AuthUser | null;
  private shouldWait: boolean;

  constructor(user: AuthUser | null, shouldWait = false) {
    this.user = user;
    this.shouldWait = shouldWait;
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    if (!this.shouldWait) {
      callback(this.user);
    }
    return () => {};
  }

  async signInWithGoogle(): Promise<AuthUser> {
    return this.user!;
  }

  async signOut(): Promise<void> {
    this.user = null;
  }

  getCurrentUser(): AuthUser | null {
    return this.user;
  }
}

describe('ProtectedRoute', () => {
  it('renders loading indicator while authentication status is resolving', () => {
    const testService = new TestAuthService(null, true);

    render(
      <AuthProvider service={testService}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Secret Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('กำลังตรวจสอบสิทธิ์...')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to /login', () => {
    const testService = new TestAuthService(null, false);

    render(
      <AuthProvider service={testService}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Secret Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  it('renders protected child component when user is authenticated', () => {
    const testUser: AuthUser = {
      uid: 'user-1',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null,
    };
    const testService = new TestAuthService(testUser, false);

    render(
      <AuthProvider service={testService}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Secret Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Secret Content')).toBeInTheDocument();
    expect(screen.queryByText('กำลังตรวจสอบสิทธิ์...')).not.toBeInTheDocument();
  });
});
