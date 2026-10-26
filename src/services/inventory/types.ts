import type { InventoryItem, InventoryStatus } from '../../types/inventory';

export type InventoryProviderType = 'mock' | 'firebase';

export interface IInventoryRepository {
  readonly providerName: InventoryProviderType;
  subscribe(callback: (items: InventoryItem[]) => void): () => void;
  getAll(): Promise<InventoryItem[]>;
  updateStatus(id: string, status: InventoryStatus): Promise<void>;
  addItem(item: Omit<InventoryItem, 'id'>): Promise<string>;
  updateItem(id: string, item: Partial<Omit<InventoryItem, 'id'>>): Promise<void>;
  deleteItem(id: string): Promise<void>;
}
