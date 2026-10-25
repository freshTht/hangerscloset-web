import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { AuthProvider } from '../../contexts/AuthContext';
import type { IAuthService, AuthUser } from '../../services/auth';
import type { IAccessControlService } from '../../services/accessControl';

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

class TestAccessControl implements IAccessControlService {
  private allowed: boolean;
  constructor(allowed = true) {
    this.allowed = allowed;
  }
  async checkIsAuthorized(): Promise<boolean> {
    return this.allowed;
  }
}

describe('ProtectedRoute', () => {
  it('renders loading indicator while authentication status is resolving', () => {
    const testService = new TestAuthService(null, true);

    render(
      <AuthProvider service={testService} accessControl={new TestAccessControl(true)}>
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
      <AuthProvider service={testService} accessControl={new TestAccessControl(true)}>
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

  it('renders UnauthorizedPage when user is authenticated but not in allowlist', async () => {
    const testUser: AuthUser = {
      uid: 'user-unauth',
      displayName: 'Unapproved User',
      email: 'intruder@example.com',
      photoURL: null,
    };
    const testService = new TestAuthService(testUser, false);
    const testAccess = new TestAccessControl(false);

    render(
      <AuthProvider service={testService} accessControl={testAccess}>
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

    await waitFor(() => {
      expect(screen.getByText('คุณไม่มีสิทธิ์เข้าถึง')).toBeInTheDocument();
    });
    expect(screen.getByText('หากมีข้อสงสัยเพิ่มเติม โปรดติดต่อ admin')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  it('renders protected child component when user is authenticated and authorized', async () => {
    const testUser: AuthUser = {
      uid: 'user-1',
      displayName: 'Allowed User',
      email: 'allowed@example.com',
      photoURL: null,
    };
    const testService = new TestAuthService(testUser, false);
    const testAccess = new TestAccessControl(true);

    render(
      <AuthProvider service={testService} accessControl={testAccess}>
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

    await waitFor(() => {
      expect(screen.getByText('Secret Content')).toBeInTheDocument();
    });
  });
});
