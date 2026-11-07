import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookingInventoryCard } from '../BookingInventoryCard';
import type { InventoryItem } from '../../types/inventory';
import type { Booking } from '../../types/booking';

describe('BookingInventoryCard Component', () => {
  const sampleItem: InventoryItem = {
    id: 'inv-1',
    code: 'DIA01',
    name: 'Dieu Ann Dress',
    brand: 'Dieu Ann',
    color: 'Beige',
    size: 'S',
    imageUrl: '',
    rentalPrices: [{ durationDays: 3, price: 300 }],
    status: 'available',
  };

  const sampleBooking: Booking = {
    id: 'booking-1',
    customerId: 'cust-1',
    customerName: 'คุณพลอย รัตนากร',
    customerPhone: '081-234-5678',
    startDate: '2026-05-10',
    endDate: '2026-05-12',
    cleaningEndDate: '2026-05-14',
    durationDays: 3,
    rentalPrice: 300,
    deposit: 1000,
    depositRefunded: false,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    transactionDates: { reserved: '2026-05-10' },
    items: [
      {
        itemId: 'inv-1',
        itemCode: 'DIA01',
        itemName: 'Dieu Ann Dress',
        itemImageUrl: '',
      },
    ],
  };

  it('renders available unselected state with outlined "เลือก" button and toggles on click', () => {
    const handleToggleSelect = vi.fn();
    const { container } = render(
      <BookingInventoryCard
        item={sampleItem}
        booking={null}
        lineItem={null}
        selectedDate="2026-05-10"
        isAllDates={false}
        isSelected={false}
        onToggleSelect={handleToggleSelect}
        onEditBooking={vi.fn()}
        onAdvanceItemStatus={vi.fn()}
      />
    );

    expect(screen.getByTestId('status-badge-DIA01')).toHaveClass('sr-only');
    expect(screen.getByTestId('status-badge-DIA01')).toHaveTextContent('ว่าง (พร้อมเช่า)');
    const cardArticle = screen.getByTestId('inventory-booking-card-DIA01');
    expect(cardArticle).toHaveClass('border');
    expect(cardArticle).not.toHaveClass('is-selected');

    // Price should be on the left side of the outer card footer
    const priceSlot = container.querySelector(
      '.hc-booking-inv-card-outer-actions .hc-booking-inv-card-price'
    );
    expect(priceSlot).toBeInTheDocument();
    expect(priceSlot).toHaveTextContent('฿300');

    // Inner card should have no footer
    expect(container.querySelector('.hc-common-inv-card-footer')).not.toBeInTheDocument();

    const selectBtn = screen.getByRole('button', { name: 'เลือกชุด DIA01' });
    expect(selectBtn).toBeInTheDocument();
    expect(selectBtn).toHaveAttribute('aria-pressed', 'false');
    expect(selectBtn).toHaveClass('border');
    expect(selectBtn).toHaveClass('primary');
    expect(selectBtn.querySelector('i')).toHaveTextContent('add');
    expect(selectBtn).toHaveTextContent('เลือก');

    fireEvent.click(selectBtn);
    expect(handleToggleSelect).toHaveBeenCalledTimes(1);
    expect(handleToggleSelect).toHaveBeenCalledWith(sampleItem);

    // Clicking card body remains neutral and does not invoke onToggleSelect again
    fireEvent.click(cardArticle);
    expect(handleToggleSelect).toHaveBeenCalledTimes(1);
  });

  it('renders available selected state with filled "เลือกแล้ว" button and is-selected class', () => {
    const handleToggleSelect = vi.fn();
    render(
      <BookingInventoryCard
        item={sampleItem}
        booking={null}
        lineItem={null}
        selectedDate="2026-05-10"
        isAllDates={false}
        isSelected={true}
        onToggleSelect={handleToggleSelect}
        onEditBooking={vi.fn()}
        onAdvanceItemStatus={vi.fn()}
      />
    );

    const cardArticle = screen.getByTestId('inventory-booking-card-DIA01');
    expect(cardArticle).toHaveClass('is-selected');

    const selectBtn = screen.getByRole('button', { name: 'เลือกแล้ว DIA01' });
    expect(selectBtn).toBeInTheDocument();
    expect(selectBtn).toHaveAttribute('aria-pressed', 'true');
    expect(selectBtn).toHaveClass('fill');
    expect(selectBtn).toHaveClass('primary');
    expect(selectBtn.querySelector('i')).toHaveTextContent('check');
    expect(selectBtn).toHaveTextContent('เลือกแล้ว');

    fireEvent.click(selectBtn);
    expect(handleToggleSelect).toHaveBeenCalledTimes(1);
    expect(handleToggleSelect).toHaveBeenCalledWith(sampleItem);
  });

  it('renders active booked state with edit button and advance status button on the right', () => {
    const handleEdit = vi.fn();
    const handleAdvance = vi.fn();

    render(
      <BookingInventoryCard
        item={sampleItem}
        booking={sampleBooking}
        lineItem={sampleBooking.items[0]}
        selectedDate="2026-05-10"
        isAllDates={false}
        onReserve={vi.fn()}
        onEditBooking={handleEdit}
        onAdvanceItemStatus={handleAdvance}
      />
    );

    expect(screen.getByText('คุณพลอย รัตนากร')).toBeInTheDocument();
    const editBtn = screen.getByRole('button', { name: 'แก้ไขการจอง DIA01' });
    expect(editBtn).toBeInTheDocument();
    expect(editBtn).toHaveClass('circle');
    expect(editBtn).toHaveClass('primary-container');
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledWith(sampleBooking);

    const advanceBtn = screen.getByRole('button', { name: /ปรับสถานะ DIA01 เป็น รอส่งมอบ/i });
    expect(advanceBtn).toBeInTheDocument();
  });

  it('renders returned state with info button that opens view mode and no advance button', () => {
    const handleView = vi.fn();
    const handleEdit = vi.fn();

    const returnedBooking: Booking = {
      ...sampleBooking,
      transactionDates: { reserved: '2026-05-10', returned: '2026-05-12' },
      items: [
        {
          itemId: 'inv-1',
          itemCode: 'DIA01',
          itemName: 'Dieu Ann Dress',
          itemImageUrl: '',
        },
      ],
    };

    render(
      <BookingInventoryCard
        item={sampleItem}
        booking={returnedBooking}
        lineItem={returnedBooking.items[0]}
        selectedDate="2026-05-12"
        isAllDates={false}
        onReserve={vi.fn()}
        onEditBooking={handleEdit}
        onViewBooking={handleView}
        onAdvanceItemStatus={vi.fn()}
      />
    );

    // Edit button should NOT be rendered
    expect(screen.queryByRole('button', { name: 'แก้ไขการจอง DIA01' })).not.toBeInTheDocument();

    // Advance button should NOT be rendered
    expect(screen.queryByRole('button', { name: /ปรับสถานะ/i })).not.toBeInTheDocument();

    // Info button SHOULD be rendered with circle primary-container
    const infoBtn = screen.getByRole('button', { name: 'ดูรายละเอียดการจอง DIA01' });
    expect(infoBtn).toBeInTheDocument();
    expect(infoBtn).toHaveAttribute('title', 'ดูรายละเอียดการจอง');
    expect(infoBtn).toHaveClass('circle');
    expect(infoBtn).toHaveClass('primary-container');
    expect(infoBtn.querySelector('i')).toHaveTextContent('info');

    fireEvent.click(infoBtn);
    expect(handleView).toHaveBeenCalledWith(returnedBooking);
    expect(handleEdit).not.toHaveBeenCalled();
  });

  it('renders outer card with medium-round and inner card with small-round class', () => {
    const { container } = render(
      <BookingInventoryCard
        item={sampleItem}
        booking={null}
        lineItem={null}
        selectedDate="2026-05-10"
        isAllDates={false}
        onReserve={vi.fn()}
        onEditBooking={vi.fn()}
        onAdvanceItemStatus={vi.fn()}
      />
    );

    const outerCard = screen.getByTestId('inventory-booking-card-DIA01');
    expect(outerCard).toHaveClass('medium-round');

    const innerCard = container.querySelector('.hc-booking-inv-card-inner');
    expect(innerCard).toBeInTheDocument();
    expect(innerCard).toHaveClass('small-round');
  });

  it('renders booking date in the outer footer left alongside price', () => {
    const { container } = render(
      <BookingInventoryCard
        item={sampleItem}
        booking={sampleBooking}
        lineItem={sampleBooking.items[0]}
        selectedDate="2026-05-10"
        isAllDates={false}
        onReserve={vi.fn()}
        onEditBooking={vi.fn()}
        onAdvanceItemStatus={vi.fn()}
      />
    );

    // Date pill should be in footer left alongside price
    const footerDatePill = container.querySelector(
      '.hc-booking-inv-card-footer-left .hc-booking-inv-card-date-pill'
    );
    expect(footerDatePill).toBeInTheDocument();
    expect(footerDatePill).toHaveTextContent(/10 พ\.ค\. – 12 พ\.ค\./);

    // Header should not contain date pill
    const headerDatePill = container.querySelector(
      '.hc-booking-inv-card-outer-header .hc-booking-inv-card-date-pill'
    );
    expect(headerDatePill).not.toBeInTheDocument();
  });

  it('omits outfit condition note on card surface to keep card streamlined (kept in sheet)', () => {
    const sampleLineItem = {
      ...sampleBooking.items[0],
      conditionNote:
        'มีเข็มกลัดเพชรให้ พร้อมเครื่องประดับมุกครบชุด ลูกค้าขอยาวพิเศษ มีรอยเปื้อนเล็กน้อยที่ชายกระโปรงด้านหลัง ตรวจสอบแล้วซักออกได้',
    };

    const { container } = render(
      <BookingInventoryCard
        item={sampleItem}
        booking={sampleBooking}
        lineItem={sampleLineItem}
        selectedDate="2026-05-10"
        isAllDates={false}
        onReserve={vi.fn()}
        onEditBooking={vi.fn()}
        onAdvanceItemStatus={vi.fn()}
      />
    );

    // Outfit condition note is omitted on the card surface
    expect(screen.queryByTestId('condition-note-DIA01')).not.toBeInTheDocument();

    // Right action buttons must still be intact in .hc-booking-inv-card-footer-right
    const footerRight = container.querySelector('.hc-booking-inv-card-footer-right');
    expect(footerRight).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'แก้ไขการจอง DIA01' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /ปรับสถานะ DIA01 เป็น รอส่งมอบ/i })
    ).toBeInTheDocument();
  });

  it('omits booking note on the card footer to keep card surface clean (kept in sheet)', () => {
    const bookingWithNote: Booking = {
      ...sampleBooking,
      note: 'ลูกค้ารับชุดตอนเช้า 9:00',
    };

    render(
      <BookingInventoryCard
        item={sampleItem}
        booking={bookingWithNote}
        lineItem={sampleBooking.items[0]}
        selectedDate="2026-05-10"
        isAllDates={false}
        onReserve={vi.fn()}
        onEditBooking={vi.fn()}
        onAdvanceItemStatus={vi.fn()}
      />
    );

    expect(screen.queryByTestId('booking-note-DIA01')).not.toBeInTheDocument();
  });

  it('renders customer name in the first row of outer footer without redundant status badge or phone', () => {
    const { container } = render(
      <BookingInventoryCard
        item={sampleItem}
        booking={sampleBooking}
        lineItem={sampleBooking.items[0]}
        selectedDate="2026-05-10"
        isAllDates={false}
        onReserve={vi.fn()}
        onEditBooking={vi.fn()}
        onAdvanceItemStatus={vi.fn()}
      />
    );

    const outerFooter = container.querySelector('.hc-booking-inv-card-outer-footer');
    expect(outerFooter).toBeInTheDocument();

    const outerInfo = outerFooter?.querySelector('.hc-booking-inv-card-outer-info');
    expect(outerInfo).toBeInTheDocument();

    // Visible status badge is removed from card footer to avoid repeating status section header
    expect(outerInfo?.querySelector('.badge')).toBeNull();

    const customerPill = outerInfo?.querySelector('.hc-booking-inv-card-customer-pill');
    expect(customerPill).toBeInTheDocument();
    expect(customerPill).toHaveTextContent('คุณพลอย รัตนากร');
    // Phone number is omitted from card surface
    expect(customerPill).not.toHaveTextContent('081-234-5678');
  });
});
