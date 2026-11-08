import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookingSheet } from '../BookingSheet';
import type { InventoryItem } from '../../types/inventory';
import type { Customer } from '../../types/customer';
import type { Booking } from '../../types/booking';
import { addDaysISO, getTodayISO } from '../../lib/bookingAvailability';

const today = getTodayISO();

const sampleInventory: InventoryItem[] = [
  {
    id: 'inv-1',
    code: 'AVL01',
    name: 'Avaalene Beach Set',
    brand: 'Avaalene',
    color: 'Pink',
    size: 'S',
    imageUrl: 'https://example.com/avl01.jpg',
    rentalPrices: [
      { durationDays: 1, price: 80 },
      { durationDays: 3, price: 120 },
      { durationDays: 5, price: 150 },
      { durationDays: 7, price: 200 },
    ],
    status: 'available',
  },
  {
    id: 'inv-2',
    code: 'DIA01',
    name: 'Dieu Ann Dress',
    brand: 'Dieu Ann',
    color: 'Beige',
    size: 'M',
    imageUrl: '',
    rentalPrices: [
      { durationDays: 1, price: 280 },
      { durationDays: 3, price: 300 },
      { durationDays: 5, price: 420 },
      { durationDays: 7, price: 550 },
    ],
    status: 'available',
  },
];

const sampleCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'คุณพลอย รัตนากร',
    phone: '081-234-5678',
    lineId: '@ploy_r',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

function createMockBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'mock-booking-id',
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerLineId: null,
    startDate: today,
    endDate: addDaysISO(today, 2),
    cleaningEndDate: addDaysISO(today, 4),
    durationDays: 3,
    rentalPrice: 0,
    deposit: 0,
    depositRefunded: false,
    note: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    transactionDates: { reserved: today },
    items: [],
    ...overrides,
  };
}

const conflictingBookings: Booking[] = [
  createMockBooking({
    id: 'existing-booking',
    customerId: 'cust-99',
    customerName: 'คุณสมชาย ใจดี',
    customerPhone: '089-999-9999',
    items: [
      {
        itemId: 'inv-2',
        itemCode: 'DIA01',
        itemName: 'Dieu Ann Dress',
        itemImageUrl: '',
      },
    ],
    rentalPrice: 300,
  }),
];

describe('BookingSheet Component (Stepless Card-Based)', () => {
  it('renders the 4 card sections cleanly without wizard steps or stepper bar', () => {
    render(
      <BookingSheet
        isOpen={true}
        mode="add"
        booking={createMockBooking({
          rentalPrice: 120,
          items: [
            {
              itemId: 'inv-1',
              itemCode: 'AVL01',
              itemName: 'Avaalene Beach Set',
              itemImageUrl: '',
            },
          ],
        })}
        bookings={[]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    // No stepper bar or wizard next/prev buttons
    expect(screen.queryByTestId('wizard-stepper')).not.toBeInTheDocument();
    expect(screen.queryByTestId('wizard-next-step-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('wizard-prev-step-2')).not.toBeInTheDocument();

    // Card sections exist (unified Grouped Booking Card, Customer info, Payment)
    expect(screen.getByTestId('grouped-booking-card-mock-booking-id')).toBeInTheDocument();
    expect(screen.getByText(/ข้อมูลลูกค้า/)).toBeInTheDocument();
    expect(screen.getByText(/การชำระเงิน/)).toBeInTheDocument();

    // Deposit field is completely removed
    expect(screen.queryByLabelText(/เงินมัดจำ/i)).not.toBeInTheDocument();
  });

  it('displays dates, turnaround date, and suggested prices based on booking durationDays prop', () => {
    render(
      <BookingSheet
        isOpen={true}
        mode="add"
        booking={createMockBooking({
          durationDays: 5,
          rentalPrice: 570,
          items: [
            {
              itemId: 'inv-1',
              itemCode: 'AVL01',
              itemName: 'Avaalene Beach Set',
              itemImageUrl: '',
            },
            {
              itemId: 'inv-2',
              itemCode: 'DIA01',
              itemName: 'Dieu Ann Dress',
              itemImageUrl: '',
            },
          ],
        })}
        bookings={[]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    // 5 days: AVL01=150, DIA01=420 -> Total = 570
    const priceInput = screen.getByLabelText(/ราคาเช่ารวม/i);
    expect(priceInput).toHaveValue(570);
    expect(screen.getByText('฿570')).toBeInTheDocument();
    expect(screen.getByTestId('grouped-outfit-card-AVL01')).toBeInTheDocument();
    expect(screen.getByTestId('grouped-outfit-card-DIA01')).toBeInTheDocument();
  });

  it('displays outfit thumbnail, code, size, color, and status badge in BookingCard carousel', () => {
    render(
      <BookingSheet
        isOpen={true}
        mode="add"
        booking={createMockBooking({
          rentalPrice: 120,
          items: [
            {
              itemId: 'inv-1',
              itemCode: 'AVL01',
              itemName: 'Avaalene Beach Set',
              itemImageUrl: 'https://example.com/avl01.jpg',
            },
          ],
        })}
        bookings={[]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByTestId('grouped-outfit-card-AVL01')).toBeInTheDocument();
    expect(screen.getByText('AVL01')).toBeInTheDocument();
    expect(screen.getByText('Avaalene Beach Set')).toBeInTheDocument();
    expect(screen.getByText('Avaalene')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('Pink')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge-AVL01')).toHaveTextContent('จองแล้ว');
    expect(screen.getByText('฿120')).toBeInTheDocument();
  });

  it('detects conflicting preselected outfits and disables booking creation', () => {
    render(
      <BookingSheet
        isOpen={true}
        mode="add"
        booking={createMockBooking({
          customerId: 'cust-1',
          customerName: 'คุณพลอย รัตนากร',
          customerPhone: '081-234-5678',
          rentalPrice: 300,
          items: [
            {
              itemId: 'inv-2',
              itemCode: 'DIA01',
              itemName: 'Dieu Ann Dress',
              itemImageUrl: '',
            },
          ],
        })}
        bookings={conflictingBookings}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(
      screen.getByText(/ติดจองช่วงเวลานี้ \(คุณสมชาย ใจดี\)/i)
    ).toBeInTheDocument();

    const submitBtn = screen.getByTestId('submit-booking-button');
    expect(submitBtn).toBeDisabled();
  });

  it('allows removing an outfit directly from the carousel to resolve conflict or update selection', () => {
    render(
      <BookingSheet
        isOpen={true}
        mode="add"
        booking={createMockBooking({
          customerId: 'cust-1',
          customerName: 'คุณพลอย รัตนากร',
          customerPhone: '081-234-5678',
          rentalPrice: 420,
          items: [
            {
              itemId: 'inv-1',
              itemCode: 'AVL01',
              itemName: 'Avaalene Beach Set',
              itemImageUrl: '',
            },
            {
              itemId: 'inv-2',
              itemCode: 'DIA01',
              itemName: 'Dieu Ann Dress',
              itemImageUrl: '',
            },
          ],
        })}
        bookings={conflictingBookings}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    // DIA01 has a conflict
    expect(screen.getByTestId('grouped-outfit-card-DIA01')).toBeInTheDocument();
    expect(screen.getByTestId('submit-booking-button')).toBeDisabled();

    // Click remove button on DIA01
    const removeDiaBtn = screen.getByTestId('remove-outfit-btn-DIA01');
    fireEvent.click(removeDiaBtn);

    // DIA01 is removed, conflict is gone, submit button becomes enabled
    expect(screen.queryByTestId('grouped-outfit-card-DIA01')).not.toBeInTheDocument();
    expect(screen.getByTestId('grouped-outfit-card-AVL01')).toBeInTheDocument();
    expect(screen.getByTestId('submit-booking-button')).not.toBeDisabled();
  });

  it('displays discount text directly below rental price input when price is reduced below suggested total', () => {
    render(
      <BookingSheet
        isOpen={true}
        mode="add"
        booking={createMockBooking({
          rentalPrice: 300,
          items: [
            {
              itemId: 'inv-2',
              itemCode: 'DIA01',
              itemName: 'Dieu Ann Dress',
              itemImageUrl: '',
            },
          ],
        })}
        bookings={[]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    const priceInput = screen.getByLabelText(/ราคาเช่ารวม/i);
    expect(priceInput).toHaveValue(300);
    expect(screen.queryByTestId('booking-discount-text')).not.toBeInTheDocument();

    // Edit price from 300 to 250 (50 baht discount)
    fireEvent.change(priceInput, { target: { value: '250' } });
    expect(screen.getByTestId('booking-discount-text')).toHaveTextContent('ลดราคา 50 ฿');

    // Reset button appears
    const resetBtn = screen.getByRole('button', { name: /ใช้ราคาแนะนำ/i });
    expect(resetBtn).toBeInTheDocument();
    fireEvent.click(resetBtn);

    expect(priceInput).toHaveValue(300);
    expect(screen.queryByTestId('booking-discount-text')).not.toBeInTheDocument();
  });

  it('disables submit button when no customer is selected or price is invalid', () => {
    render(
      <BookingSheet
        isOpen={true}
        mode="add"
        booking={createMockBooking({
          rentalPrice: 120,
          items: [
            {
              itemId: 'inv-1',
              itemCode: 'AVL01',
              itemName: 'Avaalene Beach Set',
              itemImageUrl: '',
            },
          ],
        })}
        bookings={[]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    const submitBtn = screen.getByTestId('submit-booking-button');
    // Disabled initially because no customer is selected
    expect(submitBtn).toBeDisabled();

    // Select customer
    const customerInput = screen.getByLabelText(/ค้นหาลูกค้า/i);
    fireEvent.focus(customerInput);
    fireEvent.click(screen.getByText('คุณพลอย รัตนากร'));

    // Now submit button is enabled
    expect(submitBtn).not.toBeDisabled();

    // Change rental price to negative
    const priceInput = screen.getByLabelText(/ราคาเช่ารวม/i);
    fireEvent.change(priceInput, { target: { value: '-50' } });
    expect(submitBtn).toBeDisabled();

    // Restore valid price
    fireEvent.change(priceInput, { target: { value: '100' } });
    expect(submitBtn).not.toBeDisabled();
  });

  it('opens confirmation modal on submit, allows dismissing with "ยกเลิก", and submits on "ยืนยัน"', async () => {
    const onSubmitSpy = vi.fn().mockResolvedValue(undefined);
    const onCloseSpy = vi.fn();

    render(
      <BookingSheet
        isOpen={true}
        mode="add"
        booking={createMockBooking({
          rentalPrice: 120,
          items: [
            {
              itemId: 'inv-1',
              itemCode: 'AVL01',
              itemName: 'Avaalene Beach Set',
              itemImageUrl: '',
            },
          ],
        })}
        bookings={[]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={onCloseSpy}
        onSubmit={onSubmitSpy}
      />
    );

    // Select customer
    const customerInput = screen.getByLabelText(/ค้นหาลูกค้า/i);
    fireEvent.focus(customerInput);
    fireEvent.click(screen.getByText('คุณพลอย รัตนากร'));

    // Click submit button in footer
    const submitBtn = screen.getByTestId('submit-booking-button');
    fireEvent.click(submitBtn);

    // Compact confirmation modal appears
    const confirmDialog = screen.getByTestId('confirm-booking-dialog');
    expect(confirmDialog).toBeInTheDocument();
    expect(confirmDialog).toHaveTextContent(
      'ยืนยันการจอง 1 ชุด สำหรับ คุณพลอย รัตนากร ยอดชำระ ฿120?'
    );

    // Dismiss with "ยกเลิก" in modal
    const cancelModalBtn = screen.getByTestId('confirm-booking-cancel');
    fireEvent.click(cancelModalBtn);

    expect(screen.queryByTestId('confirm-booking-dialog')).not.toBeInTheDocument();
    expect(onSubmitSpy).not.toHaveBeenCalled();

    // Click submit again and confirm
    fireEvent.click(submitBtn);
    const confirmModalBtn = screen.getByTestId('confirm-booking-submit');
    fireEvent.click(confirmModalBtn);

    await waitFor(() => {
      expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    });

    expect(onSubmitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'cust-1',
        customerName: 'คุณพลอย รัตนากร',
        customerPhone: '081-234-5678',
        durationDays: 3,
        rentalPrice: 120,
        deposit: 0,
      })
    );
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
  });

  it('supports inline customer creation in Card 3', async () => {
    const onAddCustomerSpy = vi.fn().mockResolvedValue('new-cust-55');
    const onSubmitSpy = vi.fn().mockResolvedValue(undefined);

    render(
      <BookingSheet
        isOpen={true}
        mode="add"
        booking={createMockBooking({
          rentalPrice: 120,
          items: [
            {
              itemId: 'inv-1',
              itemCode: 'AVL01',
              itemName: 'Avaalene Beach Set',
              itemImageUrl: '',
            },
          ],
        })}
        bookings={[]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onAddCustomer={onAddCustomerSpy}
        onClose={vi.fn()}
        onSubmit={onSubmitSpy}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /\+ เพิ่มลูกค้าใหม่/i }));

    fireEvent.change(screen.getByLabelText(/ชื่อลูกค้า \*/i), {
      target: { value: 'คุณนภา รุ่งโรจน์' },
    });
    fireEvent.change(screen.getByLabelText(/เบอร์โทรศัพท์ \*/i), {
      target: { value: '089-111-2233' },
    });

    fireEvent.click(screen.getByRole('button', { name: /บันทึกลูกค้าใหม่/i }));

    await waitFor(() => {
      expect(onAddCustomerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'คุณนภา รุ่งโรจน์',
          phone: '089-111-2233',
        })
      );
    });

    // Customer profile chip is shown (in CustomerPicker and BookingCard preview)
    expect(screen.getAllByText('คุณนภา รุ่งโรจน์').length).toBeGreaterThan(0);

    // Submit booking
    fireEvent.click(screen.getByTestId('submit-booking-button'));
    fireEvent.click(screen.getByTestId('confirm-booking-submit'));

    await waitFor(() => {
      expect(onSubmitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'new-cust-55',
          customerName: 'คุณนภา รุ่งโรจน์',
          customerPhone: '089-111-2233',
        })
      );
    });
  });

  it('renders correctly in edit mode with "บันทึกการแก้ไข" and handles deletion', async () => {
    const onDeleteSpy = vi.fn().mockResolvedValue(undefined);
    const existingBooking: Booking = createMockBooking({
      id: 'book-edit-99',
      customerId: 'cust-1',
      customerName: 'คุณพลอย รัตนากร',
      customerPhone: '081-234-5678',
      rentalPrice: 120,
      note: 'นัดรับที่ร้าน',
      items: [
        {
          itemId: 'inv-1',
          itemCode: 'AVL01',
          itemName: 'Avaalene Beach Set',
          itemImageUrl: '',
        },
      ],
    });

    render(
      <BookingSheet
        isOpen={true}
        mode="edit"
        booking={existingBooking}
        bookings={[existingBooking]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onDelete={onDeleteSpy}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'แก้ไขการจอง' })).toBeInTheDocument();
    expect(screen.getByTestId('submit-booking-button')).toHaveTextContent('บันทึกการแก้ไข');

    // Delete button exists
    const deleteBtn = screen.getByTestId('delete-booking-button');
    expect(deleteBtn).toBeInTheDocument();
    fireEvent.click(deleteBtn);

    // Cancel confirmation appears
    expect(screen.getByText(/ยืนยันการยกเลิกการจองนี้/i)).toBeInTheDocument();
    const confirmDeleteBtn = screen.getByTestId('confirm-delete-button');
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(onDeleteSpy).toHaveBeenCalledWith('book-edit-99');
    });
  });

  it('renders read-only view sheet when mode is view and supports "ปิด" and "แก้ไขการจอง"', () => {
    const onCloseSpy = vi.fn();
    const onEditBookingSpy = vi.fn();

    const sampleBooking: Booking = createMockBooking({
      id: 'book-view-1',
      customerId: 'cust-1',
      customerName: 'คุณพลอย รัตนากร',
      customerPhone: '081-234-5678',
      rentalPrice: 300,
      note: 'คืนชุดเรียบร้อย',
      items: [
        {
          itemId: 'inv-2',
          itemCode: 'DIA01',
          itemName: 'Dieu Ann Dress',
          itemImageUrl: '',
        },
      ],
    });

    render(
      <BookingSheet
        isOpen={true}
        mode="view"
        booking={sampleBooking}
        bookings={[sampleBooking]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={onCloseSpy}
        onSubmit={vi.fn()}
        onEditBooking={onEditBookingSpy}
      />
    );

    expect(screen.getByRole('heading', { name: 'รายละเอียดการจอง' })).toBeInTheDocument();

    // Inputs disabled
    expect(screen.getByLabelText(/ราคาเช่ารวม/i)).toBeDisabled();
    expect(screen.getByLabelText(/หมายเหตุการจอง \/ จัดส่ง/i)).toBeDisabled();

    // Footer has "ปิด" and "แก้ไขการจอง"
    const closeBtn = screen.getByRole('button', { name: 'ปิด' });
    expect(closeBtn).toBeInTheDocument();

    const editBtn = screen.getByRole('button', { name: /แก้ไขการจอง/i });
    expect(editBtn).toBeInTheDocument();
    fireEvent.click(editBtn);

    expect(onEditBookingSpy).toHaveBeenCalledWith(sampleBooking);

    fireEvent.click(closeBtn);
    expect(onCloseSpy).toHaveBeenCalled();
  });

  it('displays accurate suggested price when opened in edit mode', () => {
    const bookingAtSuggestedPrice: Booking = createMockBooking({
      id: 'book-suggested-1',
      customerId: 'cust-1',
      customerName: 'คุณพลอย รัตนากร',
      customerPhone: '081-234-5678',
      durationDays: 5,
      rentalPrice: 150, // AVL01 5-day suggested price is 150
      items: [
        {
          itemId: 'inv-1',
          itemCode: 'AVL01',
          itemName: 'Avaalene Beach Set',
          itemImageUrl: '',
        },
      ],
    });

    render(
      <BookingSheet
        isOpen={true}
        mode="edit"
        booking={bookingAtSuggestedPrice}
        bookings={[bookingAtSuggestedPrice]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    const priceInput = screen.getByLabelText(/ราคาเช่ารวม/i);
    expect(priceInput).toHaveValue(150);
    expect(screen.queryByTestId('booking-discount-text')).not.toBeInTheDocument();
  });

  it('renders read-only placeholder in Card 3 when in view mode and customer is null', () => {
    const bookingWithoutCustomer: Booking = createMockBooking({
      id: 'book-nocust-1',
      customerId: '',
      customerName: '',
      customerPhone: '',
      items: [
        {
          itemId: 'inv-1',
          itemCode: 'AVL01',
          itemName: 'Avaalene Beach Set',
          itemImageUrl: '',
        },
      ],
    });

    render(
      <BookingSheet
        isOpen={true}
        mode="view"
        booking={bookingWithoutCustomer}
        bookings={[bookingWithoutCustomer]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    // Shows read-only text without rendering search input or "+ เพิ่มลูกค้าใหม่" button
    expect(screen.getByText('ไม่มีข้อมูลลูกค้า')).toBeInTheDocument();
    expect(screen.queryByLabelText(/ค้นหาลูกค้า/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /\+ เพิ่มลูกค้าใหม่/i })).not.toBeInTheDocument();
  });

  it('shows loading indicator on confirm button while submitting and disables actions until completion', async () => {
    let resolveSubmit: () => void = () => {};
    const submitPromise = new Promise<void>((resolve) => {
      resolveSubmit = resolve;
    });
    const onSubmitSpy = vi.fn().mockReturnValue(submitPromise);
    const onCloseSpy = vi.fn();

    render(
      <BookingSheet
        isOpen={true}
        mode="add"
        booking={createMockBooking({
          customerId: 'cust-1',
          customerName: 'คุณพลอย รัตนากร',
          customerPhone: '081-234-5678',
          rentalPrice: 120,
          items: [
            {
              itemId: 'inv-1',
              itemCode: 'AVL01',
              itemName: 'Avaalene Beach Set',
              itemImageUrl: '',
            },
          ],
        })}
        bookings={[]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={onCloseSpy}
        onSubmit={onSubmitSpy}
      />
    );

    // Click submit in sheet footer
    fireEvent.click(screen.getByTestId('submit-booking-button'));

    // Confirmation dialog appears
    const confirmModal = screen.getByTestId('confirm-booking-dialog');
    expect(confirmModal).toBeInTheDocument();

    // Click confirm in modal
    const confirmBtn = screen.getByTestId('confirm-booking-submit');
    const cancelBtn = screen.getByTestId('confirm-booking-cancel');
    fireEvent.click(confirmBtn);

    // Modal stays visible and buttons are disabled with loading indicator
    expect(confirmBtn).toBeDisabled();
    expect(cancelBtn).toBeDisabled();
    expect(confirmBtn.querySelector('.loading-indicator')).toBeInTheDocument();
    expect(onCloseSpy).not.toHaveBeenCalled();

    // Resolve submission
    resolveSubmit();

    await waitFor(() => {
      expect(screen.queryByTestId('confirm-booking-dialog')).not.toBeInTheDocument();
      expect(onCloseSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('renders confirmation dialog properly with long customer name and emoji', () => {
    render(
      <BookingSheet
        isOpen={true}
        mode="add"
        booking={createMockBooking({
          customerId: 'cust-long',
          customerName: 'คุณอภิสิทธิ์ วรวงศ์ตระกูลไพศาล 🌸 (VIP)',
          customerPhone: '089-999-8888',
          rentalPrice: 120,
          items: [
            {
              itemId: 'inv-1',
              itemCode: 'AVL01',
              itemName: 'Avaalene Beach Set',
              itemImageUrl: '',
            },
          ],
        })}
        bookings={[]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('submit-booking-button'));
    const confirmModal = screen.getByTestId('confirm-booking-dialog');
    expect(confirmModal).toBeInTheDocument();
    expect(confirmModal).toHaveTextContent(
      'ยืนยันการจอง 1 ชุด สำหรับ คุณอภิสิทธิ์ วรวงศ์ตระกูลไพศาล 🌸 (VIP) ยอดชำระ ฿120?'
    );
  });

  it('makes customer, price, and outfit items read-only in edit mode, while allowing status and note updates', async () => {
    const onSubmitSpy = vi.fn().mockResolvedValue(undefined);
    const existingBooking = createMockBooking({
      id: 'book-ro-1',
      customerId: 'cust-1',
      customerName: 'คุณพลอย รัตนากร',
      rentalPrice: 300,
      note: 'โน้ตเดิม',
      items: [
        {
          itemId: 'inv-1',
          itemCode: 'AVL01',
          itemName: 'Avaalene Beach Set',
          itemImageUrl: '',
        },
      ],
    });

    render(
      <BookingSheet
        isOpen={true}
        mode="edit"
        booking={existingBooking}
        bookings={[existingBooking]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={vi.fn()}
        onSubmit={onSubmitSpy}
      />
    );

    // Customer cannot be changed (picker input is not shown, customer is displayed as read-only)
    expect(screen.getAllByText('คุณพลอย รัตนากร').length).toBeGreaterThan(0);
    expect(screen.queryByLabelText(/ค้นหาลูกค้า/i)).not.toBeInTheDocument();

    // Rental price input is disabled
    const priceInput = screen.getByLabelText(/ราคาเช่ารวม/i);
    expect(priceInput).toBeDisabled();

    // Outfit remove button is not rendered
    expect(screen.queryByTestId('remove-outfit-btn-AVL01')).not.toBeInTheDocument();

    // Status select is available and can be changed
    const statusSelect = screen.getByTestId('booking-status-select');
    expect(statusSelect).toBeInTheDocument();
    fireEvent.change(statusSelect, { target: { value: 'delivered' } });

    // Note textarea is editable
    const noteInput = screen.getByLabelText(/หมายเหตุการจอง/i);
    expect(noteInput).not.toBeDisabled();
    fireEvent.change(noteInput, { target: { value: 'โน้ตใหม่ อัปเดตแล้ว' } });

    // Submit saves updated status and note
    fireEvent.click(screen.getByTestId('submit-booking-button'));

    await waitFor(() => {
      expect(onSubmitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'cust-1',
          rentalPrice: 300,
          note: 'โน้ตใหม่ อัปเดตแล้ว',
          items: [
            expect.objectContaining({
              itemId: 'inv-1',
              status: 'delivered',
            }),
          ],
        })
      );
    });
  });

  it('locks down editing completely when isPastDate is true', () => {
    const existingBooking = createMockBooking({
      id: 'book-past-1',
      customerId: 'cust-1',
      customerName: 'คุณพลอย รัตนากร',
      rentalPrice: 300,
      note: 'บันทึกในอดีต',
      items: [
        {
          itemId: 'inv-1',
          itemCode: 'AVL01',
          itemName: 'Avaalene Beach Set',
          itemImageUrl: '',
        },
      ],
    });

    render(
      <BookingSheet
        isOpen={true}
        mode="edit"
        isPastDate={true}
        booking={existingBooking}
        bookings={[existingBooking]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    // Status select is not rendered (shows badge instead)
    expect(screen.queryByTestId('booking-status-select')).not.toBeInTheDocument();

    // Note is disabled
    const noteInput = screen.getByLabelText(/หมายเหตุการจอง/i);
    expect(noteInput).toBeDisabled();

    // Delete/cancel button is not rendered
    expect(screen.queryByTestId('delete-booking-button')).not.toBeInTheDocument();

    // Save button is not rendered; only "ปิด" button
    expect(screen.queryByTestId('submit-booking-button')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ปิด' })).toBeInTheDocument();
  });
});
