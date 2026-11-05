import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BookingDateBar, type BookingDateBarProps } from '../BookingDateBar';

describe('BookingDateBar Component', () => {
  const defaultTabCounts = {
    active: 43,
    available: 37,
    reserved: 0,
    pending_delivery: 1,
    delivered: 2,
    pending_return: 1,
    in_laundry: 2,
    returned: 1,
  };

  const defaultProps: BookingDateBarProps = {
    selectedDate: '2026-11-01',
    today: '2026-11-01',
    isAllDates: false,
    statusFilter: 'active',
    tabCounts: defaultTabCounts,
    filterSheetOpen: false,
    onDateChange: vi.fn(),
    onFilterClick: vi.fn(),
  };

  it('renders BeerCSS toolbar container with date navigation and filter dropdown', () => {
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

    // Filter dropdown displays default label and count
    const filterBtn = screen.getByTestId('booking-filter-dropdown');
    expect(filterBtn).toBeInTheDocument();
    expect(filterBtn).toHaveTextContent('ตัวกรอง');
    expect(filterBtn).toHaveTextContent('43');
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

  it('triggers onFilterClick when filter dropdown is clicked', () => {
    const onFilterClick = vi.fn();
    render(<BookingDateBar {...defaultProps} onFilterClick={onFilterClick} />);

    fireEvent.click(screen.getByTestId('booking-filter-dropdown'));
    expect(onFilterClick).toHaveBeenCalledTimes(1);
  });

  it('updates label and badge style when a non-active status filter is selected', () => {
    render(
      <BookingDateBar
        {...defaultProps}
        statusFilter="in_laundry"
      />
    );

    const filterBtn = screen.getByTestId('booking-filter-dropdown');
    expect(filterBtn).toHaveTextContent('ส่งซัก');
    expect(filterBtn).toHaveTextContent('2');
    expect(filterBtn).toHaveClass('primary');
  });
});
