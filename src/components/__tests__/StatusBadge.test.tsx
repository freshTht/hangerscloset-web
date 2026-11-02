import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge Component', () => {
  it('renders children with default classes', () => {
    render(<StatusBadge data-testid="status-badge">พร้อมเช่า</StatusBadge>);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('hc-status-badge');
    expect(badge).toHaveTextContent('พร้อมเช่า');
  });

  it('applies variant and small size classes', () => {
    render(
      <StatusBadge variant="reserved" size="small" data-testid="status-badge">
        จองแล้ว
      </StatusBadge>
    );
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('hc-status-badge', 'small', 'hc-status-badge-reserved');
  });

  it('supports custom className', () => {
    render(
      <StatusBadge className="custom-extra" data-testid="status-badge">
        ส่งซัก
      </StatusBadge>
    );
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('hc-status-badge', 'custom-extra');
  });
});
