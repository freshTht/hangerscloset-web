import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookingsPage } from '../../pages/BookingsPage';

describe('BookingsPage Component', () => {
  it('renders filter dropdown and active bookings by default, and date selection bar without all-day button', () => {
    render(<BookingsPage />);

    // Date selection bar is present
    expect(screen.getByTestId('bookings-date-bar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /วันก่อนหน้า/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /วันถัดไป/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /เลือกวันที่/i })).toBeInTheDocument();

    // The 'all day' ("ทุกวัน") button was removed from the date selector bar
    expect(screen.queryByRole('button', { name: /^ทุกวัน$/i })).not.toBeInTheDocument();

    // Filter dropdown button is on the date bar row
    const filterDropdown = screen.getByTestId('booking-filter-dropdown');
    expect(filterDropdown).toBeInTheDocument();
    expect(filterDropdown).toHaveTextContent('ตัวกรอง');

    // Active booking active on today
    expect(screen.getAllByText('คุณพลอย รัตนากร').length).toBeGreaterThan(0);

    // Clicking filter dropdown opens the bottom sheet
    fireEvent.click(filterDropdown);
    expect(screen.getByRole('dialog', { name: /ตัวกรองและจัดเรียงรายการจอง/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /กำลังดำเนินการ/i })).toHaveAttribute('aria-selected', 'true');

    // Close the sheet
    fireEvent.click(screen.getByRole('button', { name: /ปิดตัวกรอง/i }));

    // Navigating to tomorrow (+1 day) shows tomorrow's active booking
    fireEvent.click(screen.getByRole('button', { name: /วันถัดไป/i }));
    expect(screen.getByText('คุณมายด์ พิมพ์ชนก')).toBeInTheDocument();
  });

  it('filters bookings when selecting status from filter bottom sheet', () => {
    render(<BookingsPage />);

    // Open filter bottom sheet
    fireEvent.click(screen.getByTestId('booking-filter-dropdown'));

    // Open filter sheet and choose "ส่งซัก"
    const laundryTab = screen.getByRole('tab', { name: /ส่งซัก/i });
    fireEvent.click(laundryTab);

    // Filter dropdown button displays current filter
    expect(screen.getByTestId('booking-filter-dropdown')).toHaveTextContent('ส่งซัก');
    expect(screen.getAllByText('คุณเนย วริศรา').length).toBeGreaterThan(0);
  });

  it('changes booking sort order via the filter & sort bottom sheet', () => {
    render(<BookingsPage />);

    // Open filter & sort sheet
    fireEvent.click(screen.getByTestId('booking-filter-dropdown'));

    // Click sort by item code Z-A
    fireEvent.click(screen.getByRole('button', { name: /รหัสชุด \(Z-A\)/i }));

    // Close sheet
    fireEvent.click(screen.getByRole('button', { name: /ดูผลลัพธ์/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('advances an item status with 1-tap button on BookingCard', async () => {
    render(<BookingsPage />);

    // Navigate to tomorrow to view booking BKN01 (book-2 starts tomorrow)
    fireEvent.click(screen.getByRole('button', { name: /วันถัดไป/i }));

    // BKN01 in book-2 starts as 'pending_delivery' (รอส่งมอบ), nextActionLabel is 'ส่งมอบแล้ว'
    const advanceBtn = screen.getByRole('button', {
      name: /ปรับสถานะ BKN01 เป็น ส่งมอบแล้ว/i,
    });
    fireEvent.click(advanceBtn);

    // Confirm status change dialog since targetDate is tomorrow
    fireEvent.click(screen.getByTestId('confirm-status-date-submit'));

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

  it('computes different booking statuses across days and blocks status change when a subsequent date progressed further', () => {
    render(<BookingsPage />);

    // Today: DIA01 (book-1) has status 'delivered' (ส่งมอบแล้ว)
    expect(screen.getByTestId('status-badge-DIA01')).toHaveTextContent('ส่งมอบแล้ว');

    // Navigate to yesterday (-1 day): DIA01 was 'pending_delivery' (รอส่งมอบ),
    // and because today already moved it to 'delivered', advancing on yesterday is blocked!
    fireEvent.click(screen.getByRole('button', { name: /วันก่อนหน้า/i }));
    expect(screen.getByTestId('status-badge-DIA01')).toHaveTextContent('รอส่งมอบ');
    expect(screen.getByTestId('subsequent-block-msg-DIA01')).toBeInTheDocument();

    const blockedBtn = screen.getByRole('button', {
      name: /ปรับสถานะ DIA01 เป็น ส่งมอบแล้ว/i,
    });
    expect(blockedBtn).toBeDisabled();
  });

  it('shows confirmation dialog when changing booking status on a future/past date', async () => {
    render(<BookingsPage />);

    // Navigate to tomorrow (+1 day): DIA01 (book-1) is 'delivered' (ส่งมอบแล้ว) and has no subsequent status
    fireEvent.click(screen.getByRole('button', { name: /วันถัดไป/i }));
    expect(screen.getByTestId('status-badge-DIA01')).toHaveTextContent('ส่งมอบแล้ว');

    const advanceBtn = screen.getByRole('button', {
      name: /ปรับสถานะ DIA01 เป็น รอรับคืน/i,
    });
    expect(advanceBtn).not.toBeDisabled();
    fireEvent.click(advanceBtn);

    // Confirmation dialog appears because selectedDate !== today
    const dialog = screen.getByTestId('confirm-status-date-dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent(/ยืนยันการเปลี่ยนสถานะล่วงหน้า/i);

    // Confirm the status change
    fireEvent.click(screen.getByTestId('confirm-status-date-submit'));

    await waitFor(() => {
      expect(screen.queryByTestId('confirm-status-date-dialog')).not.toBeInTheDocument();
    });
  });
});
