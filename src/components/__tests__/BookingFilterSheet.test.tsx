import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  BookingFilterSheet,
  type BookingFilterTab,
  type BookingSortKey,
} from '../BookingFilterSheet';

describe('BookingFilterSheet Component', () => {
  const defaultCounts: Record<BookingFilterTab, number> = {
    active: 10,
    available: 4,
    reserved: 2,
    pending_delivery: 1,
    delivered: 3,
    pending_return: 0,
    in_laundry: 1,
    returned: 5,
  };

  const defaultProps = {
    isOpen: true,
    selectedFilter: 'active' as BookingFilterTab,
    tabCounts: defaultCounts,
    selectedSort: 'startDate_asc' as BookingSortKey,
    onSelectFilter: vi.fn(),
    onSelectSort: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders correctly when open with status options in 2-column grid and sort chips', () => {
    render(<BookingFilterSheet {...defaultProps} />);

    expect(screen.getByRole('dialog', { name: /ตัวกรองและจัดเรียงรายการจอง/i })).toBeInTheDocument();
    expect(screen.getByText('ตัวกรองและจัดเรียง')).toBeInTheDocument();

    // Check all filter tabs are present
    expect(screen.getByRole('tab', { name: /กำลังดำเนินการ/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /ว่าง \(พร้อมเช่า\)/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /จองแล้ว/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /รอส่งมอบ/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /ส่งมอบแล้ว/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /ส่งซัก/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /รับคืนเสร็จสิ้น/i })).toBeInTheDocument();

    // Selected status has aria-selected true
    expect(screen.getByRole('tab', { name: /กำลังดำเนินการ/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    // Check sort options are present
    expect(screen.getByRole('button', { name: /วันรับชุด \(ใกล้สุดก่อน\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /รหัสชุด \(A-Z\)/i })).toBeInTheDocument();

    // Redundant date section is excluded
    expect(screen.queryByText('ขอบเขตวันที่')).not.toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<BookingFilterSheet {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onSelectFilter when a filter tab is clicked', () => {
    const onSelectFilter = vi.fn();

    render(
      <BookingFilterSheet
        {...defaultProps}
        onSelectFilter={onSelectFilter}
      />
    );

    fireEvent.click(screen.getByRole('tab', { name: /ส่งซัก/i }));
    expect(onSelectFilter).toHaveBeenCalledWith('in_laundry');
  });

  it('calls onSelectSort when a sort chip is clicked', () => {
    const onSelectSort = vi.fn();

    render(
      <BookingFilterSheet
        {...defaultProps}
        onSelectSort={onSelectSort}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /รหัสชุด \(A-Z\)/i }));
    expect(onSelectSort).toHaveBeenCalledWith('code_asc');
  });

  it('closes on Escape key press, close button, and apply button', () => {
    const onClose = vi.fn();
    render(<BookingFilterSheet {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /ปิดตัวกรอง/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole('button', { name: /ดูผลลัพธ์/i }));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('renders reset button when customized and resets both filter and sort when clicked', () => {
    const onSelectFilter = vi.fn();
    const onSelectSort = vi.fn();

    render(
      <BookingFilterSheet
        {...defaultProps}
        selectedFilter="in_laundry"
        selectedSort="code_asc"
        onSelectFilter={onSelectFilter}
        onSelectSort={onSelectSort}
      />
    );

    const resetBtn = screen.getByRole('button', { name: /รีเซ็ต/i });
    expect(resetBtn).toBeEnabled();

    fireEvent.click(resetBtn);
    expect(onSelectFilter).toHaveBeenCalledWith('active');
    expect(onSelectSort).toHaveBeenCalledWith('startDate_asc');
  });
});
