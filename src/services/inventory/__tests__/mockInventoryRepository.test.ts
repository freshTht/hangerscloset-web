import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockInventoryRepository } from '../mockInventoryRepository';
import type { InventoryItem } from '../../../types/inventory';

const sampleItems: InventoryItem[] = [
  {
    id: '1',
    name: 'Dress A',
    code: 'DRS01',
    brand: 'BrandX',
    color: 'Red',
    size: 'S',
    imageUrl: '/test-img.jpg',
    rentalPrices: [
      { durationDays: 1, price: 100 },
      { durationDays: 3, price: 200 },
      { durationDays: 5, price: 300 },
    ],
    status: 'available',
  },
  {
    id: '2',
    name: 'Suit B',
    code: 'SUT02',
    brand: 'BrandY',
    color: 'Black',
    size: 'M',
    imageUrl: '/test-img2.jpg',
    rentalPrices: [
      { durationDays: 1, price: 200 },
      { durationDays: 3, price: 350 },
      { durationDays: 5, price: 500 },
    ],
    status: 'reserved',
  },
];

describe('MockInventoryRepository', () => {
  let repo: MockInventoryRepository;

  beforeEach(() => {
    repo = new MockInventoryRepository(sampleItems);
  });

  it('getAll returns clone of initial items', async () => {
    const items = await repo.getAll();
    expect(items).toHaveLength(2);
    expect(items[0].code).toBe('DRS01');
  });

  it('subscribe receives initial snapshot and subsequent updates', async () => {
    const listener = vi.fn();
    const unsubscribe = repo.subscribe(listener);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ code: 'DRS01' })]));

    await repo.updateStatus('1', 'laundry');
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: '1', status: 'laundry' })])
    );

    unsubscribe();
  });

  it('updateStatus throws an error when item ID does not exist', async () => {
    await expect(repo.updateStatus('non-existent-id', 'available')).rejects.toThrow(
      'Item with id "non-existent-id" not found.'
    );
  });

  it('addItem prepends a new item and notifies subscribers', async () => {
    const listener = vi.fn();
    repo.subscribe(listener);

    const newId = await repo.addItem({
      name: 'New Gown',
      code: 'GWN03',
      brand: 'BrandZ',
      color: 'Blue',
      size: 'L',
      imageUrl: '/gown.jpg',
      rentalPrices: [
        { durationDays: 1, price: 300 },
        { durationDays: 3, price: 500 },
        { durationDays: 5, price: 700 },
      ],
      status: 'available',
    });

    expect(newId).toBeDefined();
    const all = await repo.getAll();
    expect(all).toHaveLength(3);
    expect(all[0].code).toBe('GWN03');
    expect(listener).toHaveBeenLastCalledWith(
      expect.arrayContaining([expect.objectContaining({ code: 'GWN03' })])
    );
  });

  it('updateItem updates existing item and notifies subscribers', async () => {
    const listener = vi.fn();
    repo.subscribe(listener);

    await repo.updateItem('1', {
      name: 'Updated Dress A',
      rentalPrices: [
        { durationDays: 1, price: 150 },
        { durationDays: 3, price: 250 },
        { durationDays: 5, price: 350 },
      ],
      color: 'Emerald',
    });

    const items = await repo.getAll();
    const updated = items.find((i) => i.id === '1');
    expect(updated?.name).toBe('Updated Dress A');
    expect(updated?.color).toBe('Emerald');
    expect(updated?.rentalPrices[0].price).toBe(150);
    expect(listener).toHaveBeenLastCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: '1', name: 'Updated Dress A' })])
    );
  });

  it('updateItem throws error if item not found', async () => {
    await expect(repo.updateItem('unknown-id', { name: 'X' })).rejects.toThrow(
      'Item with id "unknown-id" not found.'
    );
  });

  it('deleteItem removes item and notifies subscribers', async () => {
    const listener = vi.fn();
    repo.subscribe(listener);

    await repo.deleteItem('1');

    const items = await repo.getAll();
    expect(items).toHaveLength(1);
    expect(items.find((i) => i.id === '1')).toBeUndefined();
    expect(listener).toHaveBeenLastCalledWith(
      expect.not.arrayContaining([expect.objectContaining({ id: '1' })])
    );
  });

  it('deleteItem throws error if item not found', async () => {
    await expect(repo.deleteItem('unknown-id')).rejects.toThrow(
      'Item with id "unknown-id" not found.'
    );
  });
});
