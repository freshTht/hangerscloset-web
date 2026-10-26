import { useEffect, useState, useCallback } from 'react';
import {
  inventoryRepository as defaultRepo,
  type IInventoryRepository,
  type InventoryProviderType,
} from '../services/inventory';
import type { InventoryItem, InventoryStatus } from '../types/inventory';

interface UseInventoryResult {
  items: InventoryItem[];
  loading: boolean;
  error: Error | null;
  provider: InventoryProviderType;
  updateStatus: (id: string, status: InventoryStatus) => Promise<void>;
  addItem: (item: Omit<InventoryItem, 'id'>) => Promise<string>;
  updateItem: (id: string, item: Partial<Omit<InventoryItem, 'id'>>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export function useInventory(
  repository: IInventoryRepository = defaultRepo
): UseInventoryResult {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = repository.subscribe((updatedItems) => {
      setItems(updatedItems);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [repository]);

  const updateStatus = useCallback(
    async (id: string, status: InventoryStatus) => {
      try {
        await repository.updateStatus(id, status);
      } catch (err: unknown) {
        const errorObj =
          err instanceof Error ? err : new Error('Failed to update status');
        setError(errorObj);
        throw errorObj;
      }
    },
    [repository]
  );

  const addItem = useCallback(
    async (itemData: Omit<InventoryItem, 'id'>) => {
      try {
        const newId = await repository.addItem(itemData);
        return newId;
      } catch (err: unknown) {
        const errorObj =
          err instanceof Error ? err : new Error('Failed to add item');
        setError(errorObj);
        throw errorObj;
      }
    },
    [repository]
  );

  const updateItem = useCallback(
    async (id: string, itemData: Partial<Omit<InventoryItem, 'id'>>) => {
      try {
        await repository.updateItem(id, itemData);
      } catch (err: unknown) {
        const errorObj =
          err instanceof Error ? err : new Error('Failed to update item');
        setError(errorObj);
        throw errorObj;
      }
    },
    [repository]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      try {
        await repository.deleteItem(id);
      } catch (err: unknown) {
        const errorObj =
          err instanceof Error ? err : new Error('Failed to delete item');
        setError(errorObj);
        throw errorObj;
      }
    },
    [repository]
  );

  return {
    items,
    loading,
    error,
    provider: repository.providerName,
    updateStatus,
    addItem,
    updateItem,
    deleteItem,
  };
}
