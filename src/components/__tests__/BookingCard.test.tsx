import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookingCard } from '../BookingCard';
import type { Booking } from '../../types/booking';
import type { InventoryItem } from '../../types/inventory';

const mockInventoryMap = new Map<string, InventoryItem>([
  [
    'inv-1',
    {
      id: 'inv-1',
      code: 'DIA01',
      name: 'Dieu Ann Dress',
      brand: 'Dieu Ann',
      color: 'Beige',
      size: 'M',
      imageUrl: '/dia01.jpg',
      rentalPrices: [
        { durationDays: 3, price: 300 },
        { durationDays: 5, price: 420 },
      ],
      status: 'available',
    },
  ],
  [
    'inv-2',
    {
      id: 'inv-2',
      code: 'SH01',
      name: 'Boots',
      brand: 'Zara',
      color: 'Black',
      size: '38',
      imageUrl: '',
      rentalPrices: [{ durationDays: 3, price: 150 }],
      status: 'available',
    },
  ],
]);

function createTestBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'book-101',
    customerId: 'cust-1',
    customerName: 'คุณพลอย รัตนากร',
    customerPhone: '081-234-5678',
    customerLineId: '@ploy_r',
    startDate: '2026-03-10',
    endDate: '2026-03-12',
    cleaningEndDate: '2026-03-14',
    durationDays: 3,
    rentalPrice: 450,
    deposit: 500,
    depositRefunded: false,
    note: 'ส่งแมสเซนเจอร์ช่วงเช้า',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    transactionDates: {
      reserved: '2026-03-01',
      pending_delivery: '2026-03-10',
      delivered: '2026-03-11',
    },
    items: [
      {
        itemId: 'inv-1',
        itemCode: 'DIA01',
        itemName: 'Dieu Ann Dress',
        itemImageUrl: '/dia01.jpg',
        conditionNote: null,
      },
      {
        itemId: 'inv-2',
        itemCode: 'SH01',
        itemName: 'Boots',
        itemImageUrl: '',
        conditionNote: null,
      },
    ],
    ...overrides,
  };
}

describe('BookingCard (Grouped Sub-Card Carousel)', () => {
  it('renders sub-card carousel with item status badges and compact footer with customer, price, and dates', () => {
    const booking = createTestBooking();

    render(
      <BookingCard
        booking={booking}
        inventoryMap={mockInventoryMap}
        selectedDate="2026-03-11"
        onAdvanceItemStatus={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    // Compact footer info
    expect(screen.getByText('คุณพลอย รัตนากร')).toBeInTheDocument();
    expect(screen.getByText('฿450')).toBeInTheDocument();
    expect(screen.getByText(/10 มี\.ค\. – 12 มี\.ค\./)).toBeInTheDocument();

    // Sub-cards in carousel
    expect(screen.getByTestId('grouped-outfit-card-DIA01')).toBeInTheDocument();
    expect(screen.getByTestId('grouped-outfit-card-SH01')).toBeInTheDocument();
    expect(screen.getByText('Dieu Ann')).toBeInTheDocument();
    expect(screen.getByText('Beige')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('Zara')).toBeInTheDocument();
    expect(screen.getByText('Black')).toBeInTheDocument();
    expect(screen.getByText('38')).toBeInTheDocument();

    // Item status badges inside sub-cards
    expect(screen.getByTestId('status-badge-DIA01')).toHaveTextContent('ส่งมอบแล้ว');
    expect(screen.getByTestId('status-badge-SH01')).toHaveTextContent('ส่งมอบแล้ว');
  });

  it('displays individual item status badges when some outfits are returned', () => {
    const booking = createTestBooking({
      items: [
        {
          itemId: 'inv-1',
          itemCode: 'DIA01',
          itemName: 'Dieu Ann Dress',
          itemImageUrl: '',
          status: 'returned',
          returnedDate: '2026-03-11',
          cleaningEndDate: '2026-03-13',
        },
        {
          itemId: 'inv-2',
          itemCode: 'SH01',
          itemName: 'Boots',
          itemImageUrl: '',
          status: 'delivered',
        },
      ],
    });

    render(
      <BookingCard
        booking={booking}
        inventoryMap={mockInventoryMap}
        selectedDate="2026-03-11"
        onAdvanceItemStatus={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    // Returned item shows 'รับคืนเสร็จสิ้น'
    expect(screen.getByTestId('status-badge-DIA01')).toHaveTextContent('รับคืนเสร็จสิ้น');
    // Active item shows 'ส่งมอบแล้ว'
    expect(screen.getByTestId('status-badge-SH01')).toHaveTextContent('ส่งมอบแล้ว');
  });

  it('advances booking via primary button in footer', async () => {
    const onAdvanceBooking = vi.fn().mockResolvedValue(undefined);
    const booking = createTestBooking();

    render(
      <BookingCard
        booking={booking}
        inventoryMap={mockInventoryMap}
        selectedDate="2026-03-11"
        onAdvanceBookingStatus={onAdvanceBooking}
        onAdvanceItemStatus={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    const advanceBtn = screen.getByRole('button', {
      name: /ปรับสถานะ DIA01 เป็น รอรับคืน/i,
    });
    expect(advanceBtn).toBeInTheDocument();
    expect(advanceBtn).toHaveTextContent('รอรับคืน');

    fireEvent.click(advanceBtn);

    await waitFor(() => {
      expect(onAdvanceBooking).toHaveBeenCalledWith(
        'book-101',
        'pending_return',
        '2026-03-11'
      );
    });
  });

  it('falls back to onAdvanceItemStatus for unreturned items when onAdvanceBookingStatus is not provided', async () => {
    const onAdvanceItem = vi.fn().mockResolvedValue(undefined);
    const booking = createTestBooking();

    render(
      <BookingCard
        booking={booking}
        inventoryMap={mockInventoryMap}
        selectedDate="2026-03-11"
        onAdvanceItemStatus={onAdvanceItem}
        onEdit={vi.fn()}
      />
    );

    const advanceBtn = screen.getByRole('button', {
      name: /ปรับสถานะ DIA01 เป็น รอรับคืน/i,
    });
    fireEvent.click(advanceBtn);

    await waitFor(() => {
      expect(onAdvanceItem).toHaveBeenCalledWith(
        'book-101',
        'inv-1',
        'pending_return',
        '2026-03-11'
      );
      expect(onAdvanceItem).toHaveBeenCalledWith(
        'book-101',
        'inv-2',
        'pending_return',
        '2026-03-11'
      );
    });
  });

  it('triggers onEdit from edit button when viewing all dates or future date', () => {
    const onEdit = vi.fn();
    const booking = createTestBooking();

    render(
      <BookingCard
        booking={booking}
        inventoryMap={mockInventoryMap}
        isAllDates={true}
        onEdit={onEdit}
        onAdvanceItemStatus={vi.fn()}
      />
    );

    const editBtn = screen.getByRole('button', {
      name: /แก้ไขการจองของ คุณพลอย รัตนากร/i,
    });
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledWith(booking);
  });

  it('renders info button and triggers onView for past date bookings', () => {
    const onView = vi.fn();
    const booking = createTestBooking();

    render(
      <BookingCard
        booking={booking}
        inventoryMap={mockInventoryMap}
        selectedDate="2026-03-11"
        onView={onView}
        onAdvanceItemStatus={vi.fn()}
      />
    );

    const infoBtn = screen.getByRole('button', {
      name: /ดูรายละเอียดการจองของ คุณพลอย รัตนากร/i,
    });
    expect(infoBtn).toBeInTheDocument();
    fireEvent.click(infoBtn);
    expect(onView).toHaveBeenCalledWith(booking);
  });

  it('renders single-item booking with clean 1-item layout and sr-only status badge', () => {
    const singleItemBooking = createTestBooking({
      items: [
        {
          itemId: 'inv-1',
          itemCode: 'DIA01',
          itemName: 'Dieu Ann Dress',
          itemImageUrl: '/dia01.jpg',
        },
      ],
    });

    render(
      <BookingCard
        booking={singleItemBooking}
        inventoryMap={mockInventoryMap}
        selectedDate="2026-03-11"
        onAdvanceItemStatus={vi.fn()}
      />
    );

    // Single item has carousel marked is-single
    expect(screen.getByRole('region')).toHaveClass('is-single');
    // Renders item count badge (always shown)
    expect(screen.getByTestId('item-count-book-101')).toHaveTextContent('1 ชุด');
    // Sub-card status badge is screen-reader accessible (sr-only) to avoid visual clutter
    const badge = screen.getByTestId('status-badge-DIA01');
    expect(badge).toHaveClass('sr-only');
    expect(badge).toHaveTextContent('ส่งมอบแล้ว');
  });

  it('renders multi-item booking with item count pill and visible status badges', () => {
    const multiItemBooking = createTestBooking();

    render(
      <BookingCard
        booking={multiItemBooking}
        inventoryMap={mockInventoryMap}
        selectedDate="2026-03-11"
        onAdvanceItemStatus={vi.fn()}
      />
    );

    // Carousel has is-multi
    expect(screen.getByRole('region')).toHaveClass('is-multi');
    // Renders item count badge
    const countBadge = screen.getByTestId('item-count-book-101');
    expect(countBadge).toBeInTheDocument();
    expect(countBadge).toHaveTextContent('2 ชุด');

    // Both badges are visual StatusBadge chips
    expect(screen.getByTestId('status-badge-DIA01')).toHaveClass('hc-status-badge');
    expect(screen.getByTestId('status-badge-SH01')).toHaveClass('hc-status-badge');
  });
});
