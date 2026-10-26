import { mockInventory } from '../../data/mockInventory';
import type { InventoryItem, InventoryStatus } from '../../types/inventory';
import type { IInventoryRepository } from './types';

export class MockInventoryRepository implements IInventoryRepository {
  readonly providerName = 'mock' as const;
  private items: InventoryItem[];
  private listeners: Set<(items: InventoryItem[]) => void> = new Set();

  constructor(initialItems: InventoryItem[] = mockInventory) {
    // Clone array to avoid mutating source
    this.items = [...initialItems];
  }

  private notifyListeners(): void {
    const snapshot = [...this.items];
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  subscribe(callback: (items: InventoryItem[]) => void): () => void {
    this.listeners.add(callback);
    // Emit current state immediately
    callback([...this.items]);

    return () => {
      this.listeners.delete(callback);
    };
  }

  async getAll(): Promise<InventoryItem[]> {
    return [...this.items];
  }

  async updateStatus(id: string, status: InventoryStatus): Promise<void> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Item with id "${id}" not found.`);
    }

    const updated = { ...this.items[index], status };
    this.items = [
      ...this.items.slice(0, index),
      updated,
      ...this.items.slice(index + 1),
    ];

    this.notifyListeners();
  }

  async addItem(itemData: Omit<InventoryItem, 'id'>): Promise<string> {
    const newId = String(Date.now());
    const newItem: InventoryItem = {
      ...itemData,
      id: newId,
    };

    this.items = [newItem, ...this.items];
    this.notifyListeners();
    return newId;
  }

  async updateItem(
    id: string,
    itemData: Partial<Omit<InventoryItem, 'id'>>
  ): Promise<void> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Item with id "${id}" not found.`);
    }

    const updated: InventoryItem = {
      ...this.items[index],
      ...itemData,
      id, // ensure ID is never overridden
      rentalPrices: itemData.rentalPrices
        ? { ...this.items[index].rentalPrices, ...itemData.rentalPrices }
        : this.items[index].rentalPrices,
    };

    this.items = [
      ...this.items.slice(0, index),
      updated,
      ...this.items.slice(index + 1),
    ];
    this.notifyListeners();
  }

  async deleteItem(id: string): Promise<void> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Item with id "${id}" not found.`);
    }

    this.items = [
      ...this.items.slice(0, index),
      ...this.items.slice(index + 1),
    ];
    this.notifyListeners();
  }
}

export const mockInventoryRepository = new MockInventoryRepository();
