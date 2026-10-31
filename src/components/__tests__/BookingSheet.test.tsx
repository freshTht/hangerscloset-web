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
        status: 'reserved',
      },
    ],
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

  it('auto-calculates suggested rental price when items and duration are selected, and submits booking', async () => {
    const onSubmitSpy = vi.fn().mockResolvedValue(undefined);
    const onCloseSpy = vi.fn();

    const { container } = render(
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

    // Select customer
    const customerInput = screen.getByLabelText(/ค้นหาลูกค้า/i);
    fireEvent.focus(customerInput);
    fireEvent.click(screen.getByText('คุณพลอย รัตนากร'));

    // Select both items (default duration is 3 days: 120 + 300 = 420)
    fireEvent.click(screen.getByRole('button', { name: /เลือกชุด AVL01/i }));
    fireEvent.click(screen.getByRole('button', { name: /เลือกชุด DIA01/i }));

    const priceInput = screen.getByLabelText(/ราคาเช่ารวม/i);
    expect(priceInput).toHaveValue(420);

    // Switch duration to 5 days (150 + 420 = 570)
    fireEvent.click(screen.getByRole('button', { name: '5 วัน' }));
    expect(priceInput).toHaveValue(570);

    const form = container.querySelector('#booking-form')!;
    fireEvent.submit(form);

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

  it('supports inline creation of a new customer inside CustomerPicker', async () => {
    const onAddCustomerSpy = vi.fn().mockResolvedValue('new-cust-99');
    const onSubmitSpy = vi.fn().mockResolvedValue(undefined);

    const { container } = render(
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

    // Select an item and submit
    fireEvent.click(screen.getByRole('button', { name: /เลือกชุด AVL01/i }));

    const form = container.querySelector('#booking-form')!;
    fireEvent.submit(form);

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
});
