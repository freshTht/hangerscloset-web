import { isFirebaseConfigured } from '../../lib/firebase';
import { firestoreMetadataRepository } from './firestoreMetadataRepository';
import { mockMetadataRepository } from './mockMetadataRepository';
import type { IMetadataRepository } from './types';

export function resolveMetadataProvider(): 'mock' | 'firebase' {
  const envProvider = import.meta.env.VITE_DATA_PROVIDER;
  if (envProvider === 'firebase') {
    if (isFirebaseConfigured) {
      return 'firebase';
    }
  }
  return 'mock';
}

export function createMetadataRepository(): IMetadataRepository {
  return resolveMetadataProvider() === 'firebase'
    ? firestoreMetadataRepository
    : mockMetadataRepository;
}

export const metadataRepository: IMetadataRepository = createMetadataRepository();

export * from './types';
export { mockMetadataRepository } from './mockMetadataRepository';
export { firestoreMetadataRepository } from './firestoreMetadataRepository';
