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
    expect(screen.getAllByText('คุณเนย วริศรา').length).toBeGreaterThan(0);
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

  it('renders all inventory items with list view and supports reserving unbooked items', () => {
    render(<BookingsPage />);

    // In default list view, all inventory items are shown
    // AVL01 is unbooked today
    expect(screen.getByTestId('inventory-booking-card-AVL01')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge-AVL01')).toHaveTextContent('ว่าง (พร้อมเช่า)');

    // Unbooked item has "จองชุดนี้" button
    const reserveBtn = screen.getByRole('button', { name: /จองชุด AVL01/i });
    expect(reserveBtn).toBeInTheDocument();

    // Clicking reserve button opens BookingSheet
    fireEvent.click(reserveBtn);
    expect(screen.getByRole('dialog', { name: /สร้างการจองใหม่/i })).toBeInTheDocument();
  });

  it('toggles between Items list view and Orders list view', () => {
    render(<BookingsPage />);

    // Default is items list view
    expect(screen.getByTestId('inventory-booking-card-AVL01')).toBeInTheDocument();

    // Toggle to orders list view
    const toggleToOrdersBtns = screen.getAllByRole('button', {
      name: /สลับเป็นมุมมองใบจอง/i,
    });
    fireEvent.click(toggleToOrdersBtns[0]);

    // In orders list view, unbooked AVL01 is not rendered, but booked DIA01 order is rendered
    expect(screen.queryByTestId('inventory-booking-card-AVL01')).not.toBeInTheDocument();
    expect(screen.getAllByText('คุณพลอย รัตนากร').length).toBeGreaterThan(0);

    // Toggle back to items view
    const toggleToItemsBtns = screen.getAllByRole('button', {
      name: /สลับเป็นมุมมองรายชุด/i,
    });
    fireEvent.click(toggleToItemsBtns[0]);
    expect(screen.getByTestId('inventory-booking-card-AVL01')).toBeInTheDocument();
  });
});
