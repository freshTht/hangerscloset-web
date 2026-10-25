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
    rentalPrices: { oneDay: 100, threeDays: 200, fiveDays: 300 },
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
    rentalPrices: { oneDay: 200, threeDays: 350, fiveDays: 500 },
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
      rentalPrices: { oneDay: 300, threeDays: 500, fiveDays: 700 },
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
});
