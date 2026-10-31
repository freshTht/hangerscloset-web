import { isFirebaseConfigured } from '../../lib/firebase';
import { firebaseStorageService } from './firebaseStorageService';
import { mockStorageService } from './mockStorageService';
import type { IStorageService, StorageProviderType } from './types';

export function resolveStorageProvider(): StorageProviderType {
  const envProvider = import.meta.env.VITE_DATA_PROVIDER;
  if (envProvider === 'firebase') {
    if (isFirebaseConfigured) {
      return 'firebase';
    }
    console.warn(
      '[Storage] VITE_DATA_PROVIDER is set to "firebase", but Firebase credentials are missing. Falling back to "mock" storage service.'
    );
  }
  return 'mock';
}

export function createStorageService(
  provider: StorageProviderType = resolveStorageProvider()
): IStorageService {
  return provider === 'firebase'
    ? firebaseStorageService
    : mockStorageService;
}

export const storageService: IStorageService = createStorageService();
export const activeStorageProvider: StorageProviderType = storageService.providerName;

export * from './types';
export { mockStorageService } from './mockStorageService';
export { firebaseStorageService, isFirebaseStorageUrl } from './firebaseStorageService';
