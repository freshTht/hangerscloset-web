import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InventorySheet } from '../InventorySheet';
import type { InventoryItem } from '../../types/inventory';
import type { IStorageService } from '../../services/storage';
import * as resizeImageModule from '../../lib/resizeImage';

const mockItem: InventoryItem = {
  id: '123',
  code: 'AVL01',
  name: 'Avaalene Dress',
  brand: 'Avaalene',
  color: 'Blue',
  size: 'M',
  status: 'available',
  tags: ['เดรส', 'ไปทะเล'],
  note: 'มีรอยเล็กน้อยที่ชายกระโปรง',
  rentalPrices: [
    { durationDays: 1, price: 300 },
    { durationDays: 3, price: 500 },
    { durationDays: 5, price: 700 },
  ],
  imageUrl: 'https://example.com/dress.jpg',
};

describe('InventorySheet Component', () => {
  it('is closed when isOpen is false', () => {
    render(
      <InventorySheet
        isOpen={false}
        mode="add"
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    const dialog = document.getElementById('inventory-sheet');
    expect(dialog).not.toHaveClass('active');
    expect(dialog).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders in Add mode with blank form and submit button', () => {
    render(
      <InventorySheet
        isOpen={true}
        mode="add"
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /เพิ่มชุด/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/รหัสสินค้า/i)).toHaveValue('');
    expect(screen.getByLabelText(/ชื่อสินค้า/i)).toHaveValue('');
    expect(screen.getByText('เพิ่มชุดใหม่')).toBeInTheDocument();
    expect(screen.queryByLabelText(/URL รูปภาพ/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'เปลี่ยน' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'ลบรูปภาพ' })).not.toBeInTheDocument();
  });

  it('does not show the add title in Edit mode', () => {
    render(
      <InventorySheet
        isOpen={true}
        mode="edit"
        item={mockItem}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.queryByText('เพิ่มชุดใหม่')).not.toBeInTheDocument();
  });

  it('removes the image via the overlay remove button', () => {
    render(
      <InventorySheet
        isOpen={true}
        mode="edit"
        item={mockItem}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'ลบรูปภาพ' }));
    expect(screen.queryByRole('button', { name: 'ลบรูปภาพ' })).not.toBeInTheDocument();
  });

  it('clears and hides the form after the sheet is closed', async () => {
    const { rerender } = render(
      <InventorySheet
        isOpen={true}
        mode="edit"
        item={mockItem}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/รหัสสินค้า/i)).toHaveValue('AVL01');

    rerender(
      <InventorySheet
        isOpen={false}
        mode="edit"
        item={mockItem}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    await waitFor(() => {
      expect(screen.queryByLabelText(/รหัสสินค้า/i)).not.toBeInTheDocument();
    });
  });

  it('renders in Edit mode pre-filled with item data and image at top', () => {
    render(
      <InventorySheet
        isOpen={true}
        mode="edit"
        item={mockItem}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    // Shows SKU badge
    expect(screen.getByText('AVL01')).toBeInTheDocument();
    expect(screen.getByLabelText(/รหัสสินค้า/i)).toHaveValue('AVL01');
    expect(screen.getByLabelText(/ชื่อสินค้า/i)).toHaveValue('Avaalene Dress');
    expect(screen.getByLabelText(/แบรนด์/i)).toHaveValue('Avaalene');
    expect(screen.getByLabelText(/สี/i)).toHaveValue('Blue');
    expect(screen.getByLabelText(/ไซส์/i)).toHaveValue('M');
    expect(screen.getByText('เดรส')).toBeInTheDocument();
    expect(screen.getByText('ไปทะเล')).toBeInTheDocument();
    expect(screen.getByLabelText(/โน๊ต/i)).toHaveValue('มีรอยเล็กน้อยที่ชายกระโปรง');
    expect(screen.getByAltText('Avaalene Dress')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /บันทึก/i })).toBeInTheDocument();
  });

  it('configures price fields as numeric inputs with numpad keyboard', () => {
    render(
      <InventorySheet
        isOpen={true}
        mode="add"
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    const price1Day = screen.getByLabelText(/ราคา 1 วัน/i);
    const price3Days = screen.getByLabelText(/ราคา 3 วัน/i);
    const price5Days = screen.getByLabelText(/ราคา 5 วัน/i);

    [price1Day, price3Days, price5Days].forEach((input) => {
      expect(input).toHaveAttribute('type', 'number');
      expect(input).toHaveAttribute('inputmode', 'numeric');
      expect(input).toHaveAttribute('pattern', '[0-9]*');
    });
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

    // Add a tag via TagPicker
    const tagInput = screen.getByLabelText(/เพิ่มแท็ก/i);
    fireEvent.change(tagInput, { target: { value: 'ปาร์ตี้' } });
    fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter' });

    // Add note
    fireEvent.change(screen.getByLabelText(/โน๊ต/i), { target: { value: 'ซักแห้งเท่านั้น' } });

    fireEvent.change(screen.getByLabelText(/ราคา 1 วัน/i), { target: { value: '250' } });
    fireEvent.change(screen.getByLabelText(/ราคา 3 วัน/i), { target: { value: '450' } });
    fireEvent.change(screen.getByLabelText(/ราคา 5 วัน/i), { target: { value: '650' } });

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
        tags: ['ปาร์ตี้'],
        type: 'ปาร์ตี้',
        note: 'ซักแห้งเท่านั้น',
        rentalPrices: [
          { durationDays: 1, price: 250 },
          { durationDays: 3, price: 450 },
          { durationDays: 5, price: 650 },
        ],
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

  it('allows adding and removing dynamic rental price tiers', () => {
    render(
      <InventorySheet
        isOpen={true}
        mode="add"
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    // Initial 3 tiers (1, 3, 5 days)
    const addTierBtn = screen.getByRole('button', { name: /เพิ่มระยะเวลา/i });
    expect(addTierBtn).toBeInTheDocument();

    // Add a 4th tier (defaults to 7 days)
    fireEvent.click(addTierBtn);
    expect(screen.getByLabelText(/ราคา 7 วัน/i)).toBeInTheDocument();

    // Remove the 7 days tier
    const deleteBtn = screen.getByRole('button', { name: /ลบราคาเช่า 7 วัน/i });
    fireEvent.click(deleteBtn);
    expect(screen.queryByLabelText(/ราคา 7 วัน/i)).not.toBeInTheDocument();
  });

  it('shows error when duplicate duration days are entered', async () => {
    const { container } = render(
      <InventorySheet
        isOpen={true}
        mode="add"
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/รหัสสินค้า/i), { target: { value: 'TEST01' } });
    fireEvent.change(screen.getByLabelText(/ชื่อสินค้า/i), { target: { value: 'Test Dress' } });
    fireEvent.change(screen.getByLabelText(/แบรนด์/i), { target: { value: 'TestBrand' } });
    fireEvent.change(screen.getByLabelText(/สี/i), { target: { value: 'Pink' } });
    fireEvent.change(screen.getByLabelText(/ไซส์/i), { target: { value: 'S' } });

    // Fill prices so they are valid numbers
    fireEvent.change(screen.getByLabelText(/ราคา 1 วัน/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/ราคา 3 วัน/i), { target: { value: '200' } });
    fireEvent.change(screen.getByLabelText(/ราคา 5 วัน/i), { target: { value: '300' } });

    // Set duration of 2nd tier to 1 (same as 1st tier)
    const durationInputs = screen.getAllByLabelText('จำนวนวัน');
    fireEvent.change(durationInputs[1], { target: { value: '1' } });

    const form = container.querySelector('#inventory-form')!;
    fireEvent.submit(form);

    expect(await screen.findByText(/ระยะเวลาเช่า 1 วัน ซ้ำกัน/i)).toBeInTheDocument();
  });

  it('compresses and uploads selected image via storageService and cleans up old image on edit submit', async () => {
    vi.spyOn(resizeImageModule, 'compressImageToBlob').mockResolvedValueOnce(
      new Blob(['compressed-webp'], { type: 'image/webp' })
    );

    const fakeStorageService: IStorageService = {
      providerName: 'mock',
      uploadItemImage: vi.fn().mockImplementation(async (_blob, _code, onProgress) => {
        onProgress?.(50);
        return 'https://firebasestorage.googleapis.com/v0/b/test/o/new.webp';
      }),
      deleteImage: vi.fn().mockResolvedValue(undefined),
    };

    const onSubmitSpy = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <InventorySheet
        isOpen={true}
        mode="edit"
        item={mockItem}
        storageService={fakeStorageService}
        onClose={vi.fn()}
        onSubmit={onSubmitSpy}
      />
    );

    const fileInput = screen.getByTestId('image-file-input');
    const file = new File(['raw-photo'], 'dress.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(fakeStorageService.uploadItemImage).toHaveBeenCalledTimes(1);
    });

    const form = container.querySelector('#inventory-form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(onSubmitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: 'https://firebasestorage.googleapis.com/v0/b/test/o/new.webp',
        })
      );
    });

    expect(fakeStorageService.deleteImage).toHaveBeenCalledWith(mockItem.imageUrl);
  });
});
