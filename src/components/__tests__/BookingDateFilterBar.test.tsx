import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookingDateFilterBar } from '../BookingDateFilterBar';
import { formatDateThaiShortWithYear } from '../../lib/bookingAvailability';

describe('BookingDateFilterBar Component', () => {
  const defaultProps = {
    startDate: '2026-11-12',
    durationDays: 3,
    endDate: '2026-11-14',
    cleaningEndDate: '2026-11-16',
    onStartDateChange: vi.fn(),
    onDurationChange: vi.fn(),
    onEndDateChange: vi.fn(),
  };

  it('renders dates matching reference layout in Thai BE year format and schedule turnaround', () => {
    render(<BookingDateFilterBar {...defaultProps} />);

    // Pickup date card
    expect(screen.getByText('วันรับชุด')).toBeInTheDocument();
    expect(screen.getByText(formatDateThaiShortWithYear('2026-11-12'))).toBeInTheDocument();

    // Duration pill
    expect(screen.getByText('ระยะเวลา')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ระยะเวลา: 3 วัน/i })).toBeInTheDocument();

    // Return date card
    expect(screen.getByText('วันส่งคืน')).toBeInTheDocument();
    expect(screen.getByText(formatDateThaiShortWithYear('2026-11-14'))).toBeInTheDocument();

    // Turnaround schedule note
    expect(screen.getByText(/พร้อมให้เช่าต่อ:/)).toBeInTheDocument();
    expect(screen.getByText(formatDateThaiShortWithYear('2026-11-16'))).toBeInTheDocument();
    expect(screen.getByText(/รวมเวลาซัก 2 วัน/)).toBeInTheDocument();
  });

  it('calls onStartDateChange when pickup date input changes', () => {
    const onStartDateChange = vi.fn();
    render(
      <BookingDateFilterBar {...defaultProps} onStartDateChange={onStartDateChange} />
    );

    const input = screen.getByLabelText('เลือกวันรับชุด');
    fireEvent.change(input, { target: { value: '2026-11-15' } });

    expect(onStartDateChange).toHaveBeenCalledWith('2026-11-15');
  });

  it('calls onEndDateChange when return date input changes', () => {
    const onEndDateChange = vi.fn();
    render(
      <BookingDateFilterBar {...defaultProps} onEndDateChange={onEndDateChange} />
    );

    const input = screen.getByLabelText('เลือกวันส่งคืน');
    fireEvent.change(input, { target: { value: '2026-11-18' } });

    expect(onEndDateChange).toHaveBeenCalledWith('2026-11-18');
  });

  it('toggles duration picker drawer and selects quick duration option', () => {
    const onDurationChange = vi.fn();
    render(
      <BookingDateFilterBar {...defaultProps} onDurationChange={onDurationChange} />
    );

    const durationBtn = screen.getByRole('button', { name: /ระยะเวลา: 3 วัน/i });
    expect(screen.queryByTestId('duration-picker-drawer')).not.toBeInTheDocument();

    // Open drawer
    fireEvent.click(durationBtn);
    expect(screen.getByTestId('duration-picker-drawer')).toBeInTheDocument();

    // Click 5 days chip
    const chip5 = screen.getByRole('button', { name: '5 วัน' });
    fireEvent.click(chip5);

    expect(onDurationChange).toHaveBeenCalledWith(5);
    // Drawer closes after selection
    expect(screen.queryByTestId('duration-picker-drawer')).not.toBeInTheDocument();
  });
});
