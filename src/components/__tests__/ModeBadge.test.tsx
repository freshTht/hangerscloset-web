import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModeBadge } from '../ModeBadge';
import { AuthProvider } from '../../contexts/AuthContext';
import { MockAuthService } from '../../services/auth/mockAuthService';

describe('ModeBadge', () => {
  it('renders MOCK badge when provider is mock', () => {
    const mockService = new MockAuthService();
    render(
      <AuthProvider service={mockService}>
        <ModeBadge />
      </AuthProvider>
    );

    expect(screen.getByText('MOCK')).toBeInTheDocument();
  });

  it('renders nothing when provider is firebase', () => {
    render(
      <AuthProvider>
        <ModeBadge provider="firebase" />
      </AuthProvider>
    );

    expect(screen.queryByText('MOCK')).not.toBeInTheDocument();
  });

  it('allows overriding provider via prop', () => {
    render(
      <AuthProvider>
        <ModeBadge provider="mock" />
      </AuthProvider>
    );

    expect(screen.getByText('MOCK')).toBeInTheDocument();
  });
});
