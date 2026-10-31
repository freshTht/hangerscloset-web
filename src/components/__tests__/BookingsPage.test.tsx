import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookingsPage } from '../../pages/BookingsPage';

describe('BookingsPage Component', () => {
  it('renders status filter chips and active bookings by default, and date selection bar', () => {
    render(<BookingsPage />);

    expect(
      screen.getByRole('tab', { name: /กำลังดำเนินการ/i })
    ).toHaveAttribute('aria-selected', 'true');

    // Date selection bar is present
    expect(screen.getByTestId('bookings-date-bar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /วันก่อนหน้า/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /วันถัดไป/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /เลือกวันที่/i })).toBeInTheDocument();

    // Active booking active on today
    expect(screen.getAllByText('คุณพลอย รัตนากร').length).toBeGreaterThan(0);

    // Clicking "ทุกวัน" shows all active bookings including tomorrow's
    fireEvent.click(screen.getByRole('button', { name: /ทุกวัน/i }));
    expect(screen.getByText('คุณมายด์ พิมพ์ชนก')).toBeInTheDocument();
  });

  it('filters bookings when clicking status filter chips', () => {
    render(<BookingsPage />);

    fireEvent.click(screen.getByRole('button', { name: /ทุกวัน/i }));

    const laundryTab = screen.getByRole('tab', { name: /ส่งซัก/i });
    fireEvent.click(laundryTab);

    expect(laundryTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('คุณเนย วริศรา')).toBeInTheDocument();
  });

  it('advances an item status with 1-tap button on BookingCard', async () => {
    render(<BookingsPage />);

    fireEvent.click(screen.getByRole('button', { name: /ทุกวัน/i }));

    // BKN01 in book-2 starts as 'pending_delivery' (รอส่งมอบ), nextActionLabel is 'ส่งมอบแล้ว'
    const advanceBtn = screen.getByRole('button', {
      name: /ปรับสถานะ BKN01 เป็น ส่งมอบแล้ว/i,
    });
    fireEvent.click(advanceBtn);

    await waitFor(() => {
      expect(screen.getByTestId('status-badge-BKN01')).toHaveTextContent(
        'ส่งมอบแล้ว'
      );
    });
  });

  it('toggles between Card List View and Calendar View', () => {
    render(<BookingsPage />);

    const calendarToggleBtns = screen.getAllByRole('button', {
      name: /สลับเป็นมุมมองปฏิทิน/i,
    });
    fireEvent.click(calendarToggleBtns[0]);

    // Calendar view shows "วันนี้" button and weekday headers
    expect(screen.getByRole('button', { name: 'วันนี้' })).toBeInTheDocument();
    expect(screen.getByText('อา.')).toBeInTheDocument();
  });
});
