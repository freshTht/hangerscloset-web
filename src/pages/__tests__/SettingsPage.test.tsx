import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('beercss', () => ({
  default: vi.fn(),
}));

import { SettingsPage } from '../SettingsPage';
import { AuthProvider } from '../../contexts/AuthContext';
import type { IAuthService, AuthUser } from '../../services/auth';
import { resetFontForTesting, APP_FONT_STORAGE_KEY } from '../../lib/fontManager';

class MockTestAuthService implements IAuthService {
  readonly providerName = 'mock' as const;
  private user: AuthUser | null;

  constructor(user: AuthUser | null = null) {
    this.user = user;
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    callback(this.user);
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

describe('SettingsPage', () => {
  beforeEach(() => {
    resetFontForTesting();
    localStorage.clear();
    document.body.className = 'light';
    document.head.innerHTML = '';
  });

  afterEach(() => {
    resetFontForTesting();
    vi.restoreAllMocks();
  });

  it('renders combined section card with compact dark mode row and horizontal font cards', () => {
    const authService = new MockTestAuthService(null);
    render(
      <AuthProvider service={authService}>
        <SettingsPage />
      </AuthProvider>
    );

    // Theme toggle exists
    expect(screen.getByText('ธีมมืด')).toBeInTheDocument();
    expect(screen.getByLabelText('สลับธีมมืด')).toBeInTheDocument();

    // Font section exists in the same card
    expect(screen.getByText('แบบอักษร')).toBeInTheDocument();

    // Each horizontal card has preview image on top and font name text below
    expect(screen.getByAltText('ตัวอย่างฟอนต์ Sarabun')).toBeInTheDocument();
    expect(screen.getByText('Sarabun')).toBeInTheDocument();
    expect(screen.getByAltText('ตัวอย่างฟอนต์ IBM Plex Sans')).toBeInTheDocument();
    expect(screen.getByText('IBM Plex Sans')).toBeInTheDocument();
    expect(screen.getByAltText('ตัวอย่างฟอนต์ Playpen')).toBeInTheDocument();
    expect(screen.getByText('Playpen')).toBeInTheDocument();

    // Default radio is Sarabun
    expect(screen.getByRole('radio', { name: 'Sarabun' })).toBeChecked();
  });

  it('renders vertical center-aligned user card when user is logged in and handles sign out', async () => {
    const mockUser: AuthUser = {
      uid: 'user-1',
      displayName: 'สมหญิง แฟชั่น',
      email: 'somying@example.com',
      photoURL: '',
    };
    const authService = new MockTestAuthService(mockUser);
    const signOutSpy = vi.spyOn(authService, 'signOut');

    render(
      <AuthProvider service={authService}>
        <SettingsPage />
      </AuthProvider>
    );

    expect(screen.getByText('สมหญิง แฟชั่น')).toBeInTheDocument();
    expect(screen.getByText('somying@example.com')).toBeInTheDocument();

    const logoutBtn = screen.getByRole('button', { name: /ออกจากระบบ/i });
    expect(logoutBtn).toBeInTheDocument();

    fireEvent.click(logoutBtn);
    await waitFor(() => {
      expect(signOutSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('toggles theme when switch input is clicked', () => {
    const authService = new MockTestAuthService(null);
    render(
      <AuthProvider service={authService}>
        <SettingsPage />
      </AuthProvider>
    );

    const themeCheckbox = screen.getByLabelText('สลับธีมมืด') as HTMLInputElement;
    expect(themeCheckbox.checked).toBe(false);

    fireEvent.click(themeCheckbox);
    expect(themeCheckbox.checked).toBe(true);
    expect(localStorage.getItem('theme-mode')).toBe('dark');
  });

  it('selects a font and lazy loads it from Google Fonts', async () => {
    const authService = new MockTestAuthService(null);
    render(
      <AuthProvider service={authService}>
        <SettingsPage />
      </AuthProvider>
    );

    // Click on IBM Plex Sans radio
    const ibmRadio = screen.getByRole('radio', { name: 'IBM Plex Sans' });
    fireEvent.click(ibmRadio);

    // Verify localStorage updated
    expect(localStorage.getItem(APP_FONT_STORAGE_KEY)).toBe('ibm-plex-sans');

    // Link tag should be injected for IBM Plex Sans Thai
    const fontLink = document.getElementById('hc-font-ibm-plex-sans') as HTMLLinkElement | null;
    expect(fontLink).not.toBeNull();
    expect(fontLink?.href).toContain('IBM+Plex+Sans+Thai');

    // Simulate onload for stylesheet
    fontLink?.onload?.(new Event('load'));

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'IBM Plex Sans' })).toBeChecked();
    });
  });

  it('allows selecting fonts using keyboard navigation (Enter key)', async () => {
    const authService = new MockTestAuthService(null);
    render(
      <AuthProvider service={authService}>
        <SettingsPage />
      </AuthProvider>
    );

    const playpenImg = screen.getByAltText('ตัวอย่างฟอนต์ Playpen');
    const playpenCard = playpenImg.closest('[role="button"]')!;
    fireEvent.keyDown(playpenCard, { key: 'Enter', code: 'Enter' });

    expect(localStorage.getItem(APP_FONT_STORAGE_KEY)).toBe('playpen');
  });
});
