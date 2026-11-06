import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  BookingFilterSheet,
  type BookingFilterTab,
  type BookingSortKey,
} from '../BookingFilterSheet';

describe('BookingFilterSheet Component', () => {
  const defaultCounts: Record<BookingFilterTab, number> = {
    all: 10,
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

  it('renders correctly when open with status options in 2-column grid', () => {
    render(<BookingFilterSheet {...defaultProps} />);

    expect(screen.getByRole('dialog', { name: /ตัวกรองสถานะการจอง/i })).toBeInTheDocument();
    expect(screen.getByText('ตัวกรองสถานะ')).toBeInTheDocument();

    // Check all filter options are present as checkboxes
    expect(screen.getByRole('checkbox', { name: /ทั้งหมด/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /ว่าง \(พร้อมเช่า\)/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /จองแล้ว/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /รอส่งมอบ/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /ส่งมอบแล้ว/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /รอรับคืน/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /ส่งซัก/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /รับคืนเสร็จสิ้น/i })).toBeInTheDocument();

    // "ทั้งหมด" checkbox has aria-checked true by default
    expect(screen.getByRole('checkbox', { name: /ทั้งหมด/i })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  it('does not render when isOpen is false', () => {
    render(<BookingFilterSheet {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onSelectFilter when a filter checkbox is clicked', () => {
    const onSelectFilter = vi.fn();

    render(
      <BookingFilterSheet
        {...defaultProps}
        onSelectFilter={onSelectFilter}
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: /ส่งซัก/i }));
    expect(onSelectFilter).toHaveBeenCalledWith(['in_laundry']);
  });

  it('allows selecting multiple filters', () => {
    const onSelectFilter = vi.fn();

    render(
      <BookingFilterSheet
        {...defaultProps}
        selectedFilters={['reserved']}
        onSelectFilter={onSelectFilter}
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: /ส่งซัก/i }));
    expect(onSelectFilter).toHaveBeenCalledWith(['reserved', 'in_laundry']);
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

  it('renders reset button when customized and resets filter when clicked', () => {
    const onSelectFilter = vi.fn();

    render(
      <BookingFilterSheet
        {...defaultProps}
        selectedFilters={['in_laundry']}
        onSelectFilter={onSelectFilter}
      />
    );

    const resetBtn = screen.getByRole('button', { name: /รีเซ็ต/i });
    expect(resetBtn).toBeEnabled();

    fireEvent.click(resetBtn);
    expect(onSelectFilter).toHaveBeenCalledWith(['all']);
  });
});
