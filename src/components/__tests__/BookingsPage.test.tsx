import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookingsPage } from '../../pages/BookingsPage';

describe('BookingsPage Component', () => {
  it('renders status filter chips and active bookings by default', () => {
    render(<BookingsPage />);

    expect(
      screen.getByRole('tab', { name: /กำลังดำเนินการ/i })
    ).toHaveAttribute('aria-selected', 'true');

    // Active bookings from mockBookings should be visible
    expect(screen.getAllByText('คุณพลอย รัตนากร').length).toBeGreaterThan(0);
    expect(screen.getByText('คุณมายด์ พิมพ์ชนก')).toBeInTheDocument();
  });

  it('filters bookings when clicking status filter chips', () => {
    render(<BookingsPage />);

    const laundryTab = screen.getByRole('tab', { name: /ส่งซัก/i });
    fireEvent.click(laundryTab);

    expect(laundryTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('คุณเนย วริศรา')).toBeInTheDocument();
  });

  it('advances an item status with 1-tap button on BookingCard', async () => {
    render(<BookingsPage />);

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
