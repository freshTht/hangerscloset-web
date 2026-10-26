import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InventorySheet } from '../InventorySheet';
import type { InventoryItem } from '../../types/inventory';

const mockItem: InventoryItem = {
  id: '123',
  code: 'AVL01',
  name: 'Avaalene Dress',
  brand: 'Avaalene',
  color: 'Blue',
  size: 'M',
  status: 'available',
  rentalPrices: {
    oneDay: 300,
    threeDays: 500,
    fiveDays: 700,
  },
  imageUrl: 'https://example.com/dress.jpg',
};

describe('InventorySheet Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <InventorySheet
        isOpen={false}
        mode="add"
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders in Add mode with blank form and title', () => {
    render(
      <InventorySheet
        isOpen={true}
        mode="add"
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText('เพิ่มชุดใหม่')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /เพิ่มชุด/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/รหัสสินค้า/i)).toHaveValue('');
    expect(screen.getByLabelText(/ชื่อสินค้า/i)).toHaveValue('');
  });

  it('renders in Edit mode pre-filled with item data', () => {
    render(
      <InventorySheet
        isOpen={true}
        mode="edit"
        item={mockItem}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText(/แก้ไขชุด: AVL01/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/รหัสสินค้า/i)).toHaveValue('AVL01');
    expect(screen.getByLabelText(/ชื่อสินค้า/i)).toHaveValue('Avaalene Dress');
    expect(screen.getByLabelText(/แบรนด์/i)).toHaveValue('Avaalene');
    expect(screen.getByLabelText(/สี/i)).toHaveValue('Blue');
    expect(screen.getByLabelText(/ไซส์/i)).toHaveValue('M');
  });

  it('validates required fields on submit and displays error', async () => {
    const onSubmitSpy = vi.fn();
    const { container } = render(
      <InventorySheet
        isOpen={true}
        mode="add"
        onClose={vi.fn()}
        onSubmit={onSubmitSpy}
      />
    );

    const form = container.querySelector('#inventory-form')!;
    fireEvent.submit(form);

    expect(
      await screen.findByText('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน')
    ).toBeInTheDocument();
    expect(onSubmitSpy).not.toHaveBeenCalled();
  });

  it('submits valid form data in Add mode', async () => {
    const onSubmitSpy = vi.fn().mockResolvedValue(undefined);
    const onCloseSpy = vi.fn();

    const { container } = render(
      <InventorySheet
        isOpen={true}
        mode="add"
        onClose={onCloseSpy}
        onSubmit={onSubmitSpy}
      />
    );

    fireEvent.change(screen.getByLabelText(/รหัสสินค้า/i), { target: { value: 'TEST01' } });
    fireEvent.change(screen.getByLabelText(/ชื่อสินค้า/i), { target: { value: 'Test Dress' } });
    fireEvent.change(screen.getByLabelText(/แบรนด์/i), { target: { value: 'TestBrand' } });
    fireEvent.change(screen.getByLabelText(/สี/i), { target: { value: 'Pink' } });
    fireEvent.change(screen.getByLabelText(/ไซส์/i), { target: { value: 'S' } });
    fireEvent.change(screen.getByLabelText('1 วัน'), { target: { value: '250' } });
    fireEvent.change(screen.getByLabelText('3 วัน'), { target: { value: '450' } });
    fireEvent.change(screen.getByLabelText('5 วัน'), { target: { value: '650' } });

    const form = container.querySelector('#inventory-form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    });

    expect(onSubmitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'TEST01',
        name: 'Test Dress',
        brand: 'TestBrand',
        color: 'Pink',
        size: 'S',
        rentalPrices: {
          oneDay: 250,
          threeDays: 450,
          fiveDays: 650,
        },
      })
    );
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
  });

  it('triggers delete flow in Edit mode with confirmation', async () => {
    const onDeleteSpy = vi.fn().mockResolvedValue(undefined);
    const onCloseSpy = vi.fn();

    render(
      <InventorySheet
        isOpen={true}
        mode="edit"
        item={mockItem}
        onClose={onCloseSpy}
        onSubmit={vi.fn()}
        onDelete={onDeleteSpy}
      />
    );

    // Initial delete button
    const deleteBtn = screen.getByRole('button', { name: /ลบชุด/i });
    fireEvent.click(deleteBtn);

    // Confirmation appears
    expect(screen.getByText('ยืนยันการลบรายการนี้?')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /ยืนยันลบ/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onDeleteSpy).toHaveBeenCalledWith('123');
    });
    expect(onCloseSpy).toHaveBeenCalledTimes(1);
  });

  it('closes sheet when cancel or close button is clicked', () => {
    const onCloseSpy = vi.fn();
    render(
      <InventorySheet
        isOpen={true}
        mode="add"
        onClose={onCloseSpy}
        onSubmit={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /ยกเลิก/i });
    fireEvent.click(cancelBtn);
    expect(onCloseSpy).toHaveBeenCalledTimes(1);

    const closeHeaderBtn = screen.getByLabelText('ปิดหน้าต่าง');
    fireEvent.click(closeHeaderBtn);
    expect(onCloseSpy).toHaveBeenCalledTimes(2);
  });
});
