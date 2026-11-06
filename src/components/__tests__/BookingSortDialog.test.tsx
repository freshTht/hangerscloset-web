import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookingSortDialog } from '../BookingSortDialog';

describe('BookingSortDialog Component', () => {
  const defaultProps = {
    isOpen: true,
    selectedSort: 'startDate_asc' as const,
    onSelectSort: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders correctly when open with all sort options', () => {
    render(<BookingSortDialog {...defaultProps} />);

    expect(screen.getByRole('dialog', { name: /จัดเรียงรายการจอง/i })).toBeInTheDocument();
    expect(screen.getByText('จัดเรียงรายการจอง')).toBeInTheDocument();

    // Check all options
    expect(screen.getByRole('radio', { name: /วันรับชุด \(ใกล้สุดก่อน\)/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /วันรับชุด \(ไกลสุดก่อน\)/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /รหัสชุด \(A-Z\)/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /รหัสชุด \(Z-A\)/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /วันที่ทำรายการล่าสุด/i })).toBeInTheDocument();

    // Check aria-checked for current selection
    expect(
      screen.getByRole('radio', { name: /วันรับชุด \(ใกล้สุดก่อน\)/i })
    ).toHaveAttribute('aria-checked', 'true');
  });

  it('does not render dialog content when isOpen is false', () => {
    render(<BookingSortDialog {...defaultProps} isOpen={false} />);
    const dialog = screen.getByTestId('booking-sort-dialog');
    expect(dialog).not.toHaveClass('active');
  });

  it('calls onSelectSort and onClose when an option is clicked', () => {
    const onSelectSort = vi.fn();
    const onClose = vi.fn();
    render(
      <BookingSortDialog
        {...defaultProps}
        onSelectSort={onSelectSort}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole('radio', { name: /รหัสชุด \(Z-A\)/i }));
    expect(onSelectSort).toHaveBeenCalledWith('code_desc');
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape key press and close button click', () => {
    const onClose = vi.fn();
    render(<BookingSortDialog {...defaultProps} onClose={onClose} />);

    // Click close button
    fireEvent.click(screen.getByRole('button', { name: /ปิดหน้าต่างจัดเรียง/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
