import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BookingDateBar, type BookingDateBarProps } from '../BookingDateBar';

describe('BookingDateBar Component', () => {
  const defaultProps: BookingDateBarProps = {
    selectedDate: '2026-11-01',
    today: '2026-11-01',
    isAllDates: false,
    onDateChange: vi.fn(),
  };

  it('renders BeerCSS toolbar container with date navigation', () => {
    render(<BookingDateBar {...defaultProps} />);

    const bar = screen.getByTestId('bookings-date-bar');
    expect(bar).toBeInTheDocument();
    expect(bar.tagName.toLowerCase()).toBe('nav');
    expect(bar).toHaveClass('toolbar');

    expect(screen.getByRole('button', { name: /วันก่อนหน้า/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /วันถัดไป/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /เลือกวันที่/i })).toHaveTextContent('1 พ.ย. (วันนี้)');

    // "วันนี้" quick jump should NOT be rendered when selectedDate is today
    expect(screen.queryByRole('button', { name: /กลับไปวันนี้/i })).not.toBeInTheDocument();
  });

  it('navigates to previous day on previous button click', () => {
    const onDateChange = vi.fn();
    render(<BookingDateBar {...defaultProps} onDateChange={onDateChange} />);

    fireEvent.click(screen.getByRole('button', { name: /วันก่อนหน้า/i }));
    expect(onDateChange).toHaveBeenCalledWith('2026-10-31');
  });

  it('navigates to next day on next button click', () => {
    const onDateChange = vi.fn();
    render(<BookingDateBar {...defaultProps} onDateChange={onDateChange} />);

    fireEvent.click(screen.getByRole('button', { name: /วันถัดไป/i }));
    expect(onDateChange).toHaveBeenCalledWith('2026-11-02');
  });

  it('renders "วันนี้" jump button when selectedDate is not today and jumps to today when clicked', () => {
    const onDateChange = vi.fn();
    render(
      <BookingDateBar
        {...defaultProps}
        selectedDate="2026-11-02"
        today="2026-11-01"
        onDateChange={onDateChange}
      />
    );

    const todayJumpBtn = screen.getByRole('button', { name: /กลับไปวันนี้/i });
    expect(todayJumpBtn).toBeInTheDocument();

    fireEvent.click(todayJumpBtn);
    expect(onDateChange).toHaveBeenCalledWith('2026-11-01');
  });

  it('triggers onCalendarClick when date picker button is clicked', () => {
    const onCalendarClick = vi.fn();
    render(
      <BookingDateBar {...defaultProps} onCalendarClick={onCalendarClick} />
    );

    fireEvent.click(screen.getByRole('button', { name: /เลือกวันที่/i }));
    expect(onCalendarClick).toHaveBeenCalledTimes(1);
  });

  it('renders view switcher connected buttons and calls onViewModeChange when clicked', () => {
    const onViewModeChange = vi.fn();
    render(
      <BookingDateBar
        {...defaultProps}
        viewMode="items"
        onViewModeChange={onViewModeChange}
      />
    );

    const switcher = screen.getByTestId('booking-view-switcher');
    expect(switcher).toBeInTheDocument();

    const itemsBtn = screen.getByRole('button', { name: /สลับเป็นมุมมองรายชุด/i });
    const ordersBtn = screen.getByRole('button', { name: /สลับเป็นมุมมองใบจอง/i });

    expect(itemsBtn).toHaveClass('active');
    expect(ordersBtn).not.toHaveClass('active');

    fireEvent.click(ordersBtn);
    expect(onViewModeChange).toHaveBeenCalledWith('orders');
  });
});
