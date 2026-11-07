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
    imageUrl: '',
    rentalPrices: [
      { durationDays: 1, price: 80 },
      { durationDays: 3, price: 120 },
      { durationDays: 5, price: 150 },
    ],
    status: 'available',
  },
  {
    id: 'inv-2',
    code: 'DIA01',
    name: 'Dieu Ann Dress',
    brand: 'Dieu Ann',
    color: 'Beige',
    size: 'S',
    imageUrl: '',
    rentalPrices: [
      { durationDays: 1, price: 280 },
      { durationDays: 3, price: 300 },
      { durationDays: 5, price: 420 },
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

const conflictingBookings: Booking[] = [
  {
    id: 'existing-booking',
    customerId: 'cust-1',
    customerName: 'คุณพลอย รัตนากร',
    customerPhone: '081-234-5678',
    items: [
      {
        itemId: 'inv-2',
        itemCode: 'DIA01',
        itemName: 'Dieu Ann Dress',
        itemImageUrl: '',
      },
    ],
    transactionDates: {
      reserved: today,
    },
    startDate: today,
    endDate: addDaysISO(today, 2),
    cleaningEndDate: addDaysISO(today, 4),
    durationDays: 3,
    rentalPrice: 300,
    deposit: 1000,
    depositRefunded: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('BookingSheet Component', () => {
  it('blocks selecting items that have a conflicting booking in the chosen date range', () => {
    render(
      <BookingSheet
        isOpen={true}
        mode="add"
        bookings={conflictingBookings}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(
      screen.getByText(/ติดจองช่วงเวลานี้ \(คุณพลอย รัตนากร\)/i)
    ).toBeInTheDocument();

    const dia01Button = screen.getByRole('button', { name: /เลือกชุด DIA01/i });
    expect(dia01Button).toBeDisabled();

    const avl01Button = screen.getByRole('button', { name: /เลือกชุด AVL01/i });
    expect(avl01Button).not.toBeDisabled();
  });

  it('auto-calculates suggested rental price when items and duration are selected, and submits booking through wizard steps', async () => {
    const onSubmitSpy = vi.fn().mockResolvedValue(undefined);
    const onCloseSpy = vi.fn();

    render(
      <BookingSheet
        isOpen={true}
        mode="add"
        bookings={[]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={onCloseSpy}
        onSubmit={onSubmitSpy}
      />
    );

    // Step 1: Select outfits and duration
    fireEvent.click(screen.getByRole('button', { name: /เลือกชุด AVL01/i }));
    fireEvent.click(screen.getByRole('button', { name: /เลือกชุด DIA01/i }));

    // Change duration to 5 days
    fireEvent.click(screen.getByTestId('filter-duration-button'));
    fireEvent.click(screen.getByRole('button', { name: '5 วัน' }));

    // Advance to Step 2 (Customer & Price)
    fireEvent.click(screen.getByTestId('wizard-next-step-1'));

    // Step 2: Select customer
    const customerInput = screen.getByLabelText(/ค้นหาลูกค้า/i);
    fireEvent.focus(customerInput);
    fireEvent.click(screen.getByText('คุณพลอย รัตนากร'));

    // Check auto-calculated suggested price (5 days: 150 + 420 = 570)
    const priceInput = screen.getByLabelText(/ราคาเช่ารวม/i);
    expect(priceInput).toHaveValue(570);

    // Advance to Step 3 (Confirmation & Review)
    fireEvent.click(screen.getByTestId('wizard-next-step-2'));

    // Step 3: Review summary contains customer and item details
    expect(screen.getByText('สรุปยอดชำระ')).toBeInTheDocument();
    expect(screen.getByText(/5 วัน/)).toBeInTheDocument();

    // Confirm & Submit booking
    fireEvent.click(screen.getByTestId('wizard-submit-booking'));

    await waitFor(() => {
      expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    });

    expect(onSubmitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'cust-1',
        customerName: 'คุณพลอย รัตนากร',
        durationDays: 5,
        rentalPrice: 570,
        deposit: 1000,
      })
    );
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
  });

  it('supports inline creation of a new customer inside CustomerPicker during wizard step 2', async () => {
    const onAddCustomerSpy = vi.fn().mockResolvedValue('new-cust-99');
    const onSubmitSpy = vi.fn().mockResolvedValue(undefined);

    render(
      <BookingSheet
        isOpen={true}
        mode="add"
        bookings={[]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onAddCustomer={onAddCustomerSpy}
        onClose={vi.fn()}
        onSubmit={onSubmitSpy}
      />
    );

    // Step 1: Select an item and proceed to Step 2
    fireEvent.click(screen.getByRole('button', { name: /เลือกชุด AVL01/i }));
    fireEvent.click(screen.getByTestId('wizard-next-step-1'));

    // Step 2: Create new customer inline
    fireEvent.click(screen.getByRole('button', { name: /\+ เพิ่มลูกค้าใหม่/i }));

    fireEvent.change(screen.getByLabelText(/ชื่อลูกค้า \*/i), {
      target: { value: 'คุณโบว์ เมลดา' },
    });
    fireEvent.change(screen.getByLabelText(/เบอร์โทรศัพท์ \*/i), {
      target: { value: '082-333-4444' },
    });

    fireEvent.click(screen.getByRole('button', { name: /บันทึกลูกค้าใหม่/i }));

    await waitFor(() => {
      expect(onAddCustomerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'คุณโบว์ เมลดา',
          phone: '082-333-4444',
        })
      );
    });

    // Proceed to Step 3 and submit
    fireEvent.click(screen.getByTestId('wizard-next-step-2'));
    fireEvent.click(screen.getByTestId('wizard-submit-booking'));

    await waitFor(() => {
      expect(onSubmitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'new-cust-99',
          customerName: 'คุณโบว์ เมลดา',
          customerPhone: '082-333-4444',
        })
      );
    });
  });

  it('navigates backward and forward through wizard steps and responds to browser popstate', async () => {
    const onCloseSpy = vi.fn();
    render(
      <BookingSheet
        isOpen={true}
        mode="add"
        bookings={[]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={onCloseSpy}
        onSubmit={vi.fn()}
      />
    );

    // Starts on Step 1
    expect(screen.getByTestId('booking-date-filter-bar')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-outfit-list')).toBeInTheDocument();

    // Select item
    fireEvent.click(screen.getByRole('button', { name: /เลือกชุด AVL01/i }));

    // Advance to Step 2
    fireEvent.click(screen.getByTestId('wizard-next-step-1'));
    expect(screen.getByLabelText(/ค้นหาลูกค้า/i)).toBeInTheDocument();

    // Go back to Step 1 using in-wizard Prev button
    fireEvent.click(screen.getByTestId('wizard-prev-step-2'));
    expect(screen.getByTestId('booking-date-filter-bar')).toBeInTheDocument();

    // Advance back to Step 2
    fireEvent.click(screen.getByTestId('wizard-next-step-1'));
    expect(screen.getByLabelText(/ค้นหาลูกค้า/i)).toBeInTheDocument();

    // Simulate browser back button (popstate event with step 1)
    fireEvent(window, new PopStateEvent('popstate', { state: { bookingWizardStep: 1 } }));

    await waitFor(() => {
      expect(screen.getByTestId('booking-date-filter-bar')).toBeInTheDocument();
    });

    // Simulate browser back button past step 1 (popstate event without step)
    fireEvent(window, new PopStateEvent('popstate', { state: null }));

    await waitFor(() => {
      expect(onCloseSpy).toHaveBeenCalled();
    });
  });

  it('renders existing single-form layout when in edit mode', () => {
    const existingBooking: Booking = {
      id: 'book-edit-1',
      customerId: 'cust-1',
      customerName: 'คุณพลอย รัตนากร',
      customerPhone: '081-234-5678',
      items: [
        {
          itemId: 'inv-1',
          itemCode: 'AVL01',
          itemName: 'Avaalene Beach Set',
          itemImageUrl: '',
        },
      ],
      transactionDates: { reserved: today },
      startDate: today,
      endDate: addDaysISO(today, 2),
      cleaningEndDate: addDaysISO(today, 4),
      durationDays: 3,
      rentalPrice: 120,
      deposit: 1000,
      depositRefunded: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    render(
      <BookingSheet
        isOpen={true}
        mode="edit"
        booking={existingBooking}
        bookings={[]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    // In edit mode: heading is "แก้ไขการจอง" and wizard stepper is NOT rendered
    expect(screen.getByRole('heading', { name: /แก้ไขการจอง/i })).toBeInTheDocument();
    expect(screen.queryByTestId('wizard-stepper')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/วันรับชุด \*/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /บันทึก/i })).toBeInTheDocument();
  });

  it('unwinds browser history stack when closing wizard via close button so no ghost entries remain', () => {
    const historyGoSpy = vi.spyOn(window.history, 'go').mockImplementation(() => {});
    const onCloseSpy = vi.fn();

    render(
      <BookingSheet
        isOpen={true}
        mode="add"
        bookings={[]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={onCloseSpy}
        onSubmit={vi.fn()}
      />
    );

    // Advanced to step 2
    fireEvent.click(screen.getByRole('button', { name: /เลือกชุด AVL01/i }));
    fireEvent.click(screen.getByTestId('wizard-next-step-1'));

    // Click close button on step 2
    fireEvent.click(screen.getByRole('button', { name: /ปิดหน้าต่าง/i }));

    // Should call history.go(-2) to rewind both pushed steps
    expect(historyGoSpy).toHaveBeenCalledWith(-2);
    expect(onCloseSpy).toHaveBeenCalledTimes(1);

    historyGoSpy.mockRestore();
  });

  it('detects conflict and disables next button when date is changed to overlap existing booking', async () => {
    // Existing booking on today + 5 days for AVL01
    const futureBookingDate = addDaysISO(today, 5);
    const existingBookings: Booking[] = [
      {
        id: 'future-b1',
        customerId: 'cust-1',
        customerName: 'คุณสมชาย',
        customerPhone: '081-111-2222',
        items: [
          {
            itemId: 'inv-1',
            itemCode: 'AVL01',
            itemName: 'Avaalene Beach Set',
            itemImageUrl: '',
          },
        ],
        transactionDates: { reserved: futureBookingDate },
        startDate: futureBookingDate,
        endDate: addDaysISO(futureBookingDate, 2),
        cleaningEndDate: addDaysISO(futureBookingDate, 4),
        durationDays: 3,
        rentalPrice: 120,
        deposit: 1000,
        depositRefunded: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    render(
      <BookingSheet
        isOpen={true}
        mode="add"
        bookings={existingBookings}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    // Step 1: select AVL01 on today (no conflict initially)
    fireEvent.click(screen.getByRole('button', { name: /เลือกชุด AVL01/i }));
    const nextBtn = screen.getByTestId('wizard-next-step-1');
    expect(nextBtn).not.toBeDisabled();

    // Now change start date to futureBookingDate
    const startDateInput = screen.getByLabelText(/เลือกวันรับชุด/i);
    fireEvent.change(startDateInput, { target: { value: futureBookingDate } });

    // Next button should now be disabled because AVL01 is conflicted
    expect(nextBtn).toBeDisabled();
    expect(screen.getByText(/มีชุดที่ติดจองในช่วงเวลานี้ \(AVL01\)/i)).toBeInTheDocument();
    expect(screen.getByText(/ติดจอง \(คลิกเพื่อยกเลิก\)/i)).toBeInTheDocument();

    // Unselect AVL01 using footer chip
    const avlChip = screen.getByTitle('คลิกเพื่อยกเลิกการเลือกชุดนี้');
    fireEvent.click(avlChip);

    // Conflict banner disappears
    expect(screen.queryByText(/มีชุดที่ติดจองในช่วงเวลานี้/i)).not.toBeInTheDocument();
  });

  it('clamps return date so it cannot be before pickup date', () => {
    render(
      <BookingSheet
        isOpen={true}
        mode="add"
        bookings={[]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    // Attempt to set end date earlier than start date
    const endDateInput = screen.getByLabelText(/เลือกวันส่งคืน/i);
    const pastDate = addDaysISO(today, -5);
    fireEvent.change(endDateInput, { target: { value: pastDate } });

    // Input should be clamped to start date (today), not pastDate
    expect(endDateInput).toHaveValue(today);
  });

  it('preserves user input across parent re-renders while sheet is open', () => {
    const { rerender } = render(
      <BookingSheet
        isOpen={true}
        mode="add"
        bookings={[]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    // Select outfit and advance to Step 2
    fireEvent.click(screen.getByRole('button', { name: /เลือกชุด AVL01/i }));
    fireEvent.click(screen.getByTestId('wizard-next-step-1'));

    // User types in note in Step 2
    const noteInput = screen.getByLabelText(/หมายเหตุการจัดส่ง/i);
    fireEvent.change(noteInput, { target: { value: 'ส่งที่โรงแรมตอนเที่ยง' } });

    // Simulate parent re-render with new bookings/customers array references
    rerender(
      <BookingSheet
        isOpen={true}
        mode="add"
        bookings={[...conflictingBookings]}
        inventoryItems={[...sampleInventory]}
        customers={[...sampleCustomers]}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    // Still on Step 2 and note is preserved!
    expect(screen.getByLabelText(/หมายเหตุการจัดส่ง/i)).toHaveValue('ส่งที่โรงแรมตอนเที่ยง');
    expect(screen.getByTestId('wizard-prev-step-2')).toBeInTheDocument();
  });

  it('renders read-only view sheet when mode is view', () => {
    const handleClose = vi.fn();
    const sampleBooking: Booking = {
      id: 'book-view-1',
      customerId: 'cust-1',
      customerName: 'คุณพลอย รัตนากร',
      customerPhone: '081-234-5678',
      startDate: today,
      endDate: addDaysISO(today, 2),
      cleaningEndDate: addDaysISO(today, 4),
      durationDays: 3,
      rentalPrice: 300,
      deposit: 1000,
      depositRefunded: true,
      note: 'คืนชุดเรียบร้อย',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      transactionDates: { reserved: today, returned: addDaysISO(today, 2) },
      items: [
        {
          itemId: 'inv-2',
          itemCode: 'DIA01',
          itemName: 'Dieu Ann Dress',
          itemImageUrl: '',
          conditionNote: 'สภาพสมบูรณ์',
        },
      ],
    };

    render(
      <BookingSheet
        isOpen={true}
        mode="view"
        booking={sampleBooking}
        bookings={[sampleBooking]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={handleClose}
        onSubmit={vi.fn()}
      />
    );

    // Title should be "รายละเอียดการจอง"
    expect(screen.getByRole('heading', { name: 'รายละเอียดการจอง' })).toBeInTheDocument();

    // Inputs inside form should be disabled
    const noteInput = screen.getByLabelText(/หมายเหตุการจัดส่ง \/ การจอง/i);
    expect(noteInput).toBeDisabled();

    // Outfit picker / search should not be visible in view mode
    expect(screen.queryByLabelText(/ค้นหาชุดในคลัง/i)).not.toBeInTheDocument();

    // Delete button should not be visible
    expect(screen.queryByRole('button', { name: /ลบการจอง/i })).not.toBeInTheDocument();

    // Footer should display a single "ปิด" button
    const closeBtn = screen.getByRole('button', { name: 'ปิด' });
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it('locks navigation to Step 2 & 3 when lockStepMin=2 and closes cleanly on Step 1 stepper click', () => {
    const handleClose = vi.fn();
    const historyGoSpy = vi.spyOn(window.history, 'go').mockImplementation(() => {});

    render(
      <BookingSheet
        isOpen={true}
        mode="add"
        initialStep={2}
        lockStepMin={2}
        allowStepBackTo1={false}
        booking={{
          id: '',
          customerId: '',
          customerName: '',
          customerPhone: '',
          startDate: today,
          endDate: addDaysISO(today, 2),
          cleaningEndDate: addDaysISO(today, 4),
          durationDays: 3,
          rentalPrice: 120,
          deposit: 1000,
          depositRefunded: false,
          createdAt: '',
          updatedAt: '',
          transactionDates: { reserved: today },
          items: [
            {
              itemId: 'inv-1',
              itemCode: 'AVL01',
              itemName: 'Avaalene Beach Set',
              itemImageUrl: '',
            },
          ],
        }}
        bookings={[]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={handleClose}
        onSubmit={vi.fn()}
      />
    );

    // Initial step is Step 2
    expect(screen.getByLabelText(/ค้นหาลูกค้า/i)).toBeInTheDocument();

    // Step 1 stepper button reflects restriction with close icon
    const stepper = screen.getByTestId('wizard-stepper');
    expect(stepper).toBeInTheDocument();
    const step1Btn = screen.getByRole('button', { name: /เลือกชุด/i });
    expect(step1Btn.querySelector('i')).toHaveTextContent('close');

    // Tapping Step 1 stepper button closes the sheet
    fireEvent.click(step1Btn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    historyGoSpy.mockRestore();
  });

  it('closes cleanly when tapping "ย้อนกลับ" on Step 2 when lockStepMin=2', () => {
    const handleClose = vi.fn();
    const historyGoSpy = vi.spyOn(window.history, 'go').mockImplementation(() => {});

    render(
      <BookingSheet
        isOpen={true}
        mode="add"
        initialStep={2}
        lockStepMin={2}
        allowStepBackTo1={false}
        booking={{
          id: '',
          customerId: '',
          customerName: '',
          customerPhone: '',
          startDate: today,
          endDate: addDaysISO(today, 2),
          cleaningEndDate: addDaysISO(today, 4),
          durationDays: 3,
          rentalPrice: 120,
          deposit: 1000,
          depositRefunded: false,
          createdAt: '',
          updatedAt: '',
          transactionDates: { reserved: today },
          items: [
            {
              itemId: 'inv-1',
              itemCode: 'AVL01',
              itemName: 'Avaalene Beach Set',
              itemImageUrl: '',
            },
          ],
        }}
        bookings={[]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={handleClose}
        onSubmit={vi.fn()}
      />
    );

    // Tapping "ย้อนกลับ" on Step 2 calls handleCloseCleanly and closes the sheet
    const prevBtn = screen.getByTestId('wizard-prev-step-2');
    fireEvent.click(prevBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    historyGoSpy.mockRestore();
  });

  it('allows navigation between Step 2 and Step 3 when lockStepMin=2 and going back from Step 3 returns to Step 2', () => {
    render(
      <BookingSheet
        isOpen={true}
        mode="add"
        initialStep={2}
        lockStepMin={2}
        booking={{
          id: '',
          customerId: 'cust-1',
          customerName: 'คุณพลอย รัตนากร',
          customerPhone: '081-234-5678',
          startDate: today,
          endDate: addDaysISO(today, 2),
          cleaningEndDate: addDaysISO(today, 4),
          durationDays: 3,
          rentalPrice: 120,
          deposit: 1000,
          depositRefunded: false,
          createdAt: '',
          updatedAt: '',
          transactionDates: { reserved: today },
          items: [
            {
              itemId: 'inv-1',
              itemCode: 'AVL01',
              itemName: 'Avaalene Beach Set',
              itemImageUrl: '',
            },
          ],
        }}
        bookings={[]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    // Step 2 is active, select customer to enable Next button
    const customerInput = screen.getByLabelText(/ค้นหาลูกค้า/i);
    fireEvent.focus(customerInput);
    fireEvent.click(screen.getByText('คุณพลอย รัตนากร'));

    // Advance to Step 3
    fireEvent.click(screen.getByTestId('wizard-next-step-2'));
    expect(screen.getByText('สรุปยอดชำระ')).toBeInTheDocument();

    // On Step 3, clicking "ย้อนกลับ" navigates back to Step 2 (does not close)
    fireEvent.click(screen.getByTestId('wizard-prev-step-3'));
    expect(screen.getByTestId('wizard-next-step-2')).toBeInTheDocument();
    expect(screen.getByText('คุณพลอย รัตนากร')).toBeInTheDocument();
  });

  it('closes cleanly on browser popstate event when popping past lockStepMin', () => {
    const handleClose = vi.fn();
    render(
      <BookingSheet
        isOpen={true}
        mode="add"
        initialStep={2}
        lockStepMin={2}
        allowStepBackTo1={false}
        booking={{
          id: '',
          customerId: 'cust-1',
          customerName: 'คุณพลอย รัตนากร',
          customerPhone: '081-234-5678',
          startDate: today,
          endDate: addDaysISO(today, 2),
          cleaningEndDate: addDaysISO(today, 4),
          durationDays: 3,
          rentalPrice: 120,
          deposit: 1000,
          depositRefunded: false,
          createdAt: '',
          updatedAt: '',
          transactionDates: { reserved: today },
          items: [
            {
              itemId: 'inv-1',
              itemCode: 'AVL01',
              itemName: 'Avaalene Beach Set',
              itemImageUrl: '',
            },
          ],
        }}
        bookings={[]}
        inventoryItems={sampleInventory}
        customers={sampleCustomers}
        onClose={handleClose}
        onSubmit={vi.fn()}
      />
    );

    // Browser back dispatches popstate with step 1, which is below lockStepMin=2
    fireEvent(window, new PopStateEvent('popstate', { state: { bookingWizardStep: 1 } }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
