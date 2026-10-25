import { isFirebaseConfigured } from '../../lib/firebase';
import { firestoreInventoryRepository } from './firestoreInventoryRepository';
import { mockInventoryRepository } from './mockInventoryRepository';
import type { IInventoryRepository, InventoryProviderType } from './types';

export function resolveInventoryProvider(): InventoryProviderType {
  const envProvider = import.meta.env.VITE_DATA_PROVIDER;
  if (envProvider === 'firebase') {
    if (isFirebaseConfigured) {
      return 'firebase';
    }
    console.warn(
      '[Inventory] VITE_DATA_PROVIDER is set to "firebase", but Firebase credentials are missing. Falling back to "mock" inventory repository.'
    );
  }
  return 'mock';
}

export function createInventoryRepository(
  provider: InventoryProviderType = resolveInventoryProvider()
): IInventoryRepository {
  return provider === 'firebase'
    ? firestoreInventoryRepository
    : mockInventoryRepository;
}

export const inventoryRepository: IInventoryRepository = createInventoryRepository();
export const activeInventoryProvider: InventoryProviderType = inventoryRepository.providerName;

export * from './types';
export { mockInventoryRepository } from './mockInventoryRepository';
export { firestoreInventoryRepository } from './firestoreInventoryRepository';
