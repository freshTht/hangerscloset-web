import { isFirebaseConfigured } from '../../lib/firebase';
import { firestoreCustomerRepository } from './firestoreCustomerRepository';
import { mockCustomerRepository } from './mockCustomerRepository';
import type { ICustomerRepository, CustomerProviderType } from './types';

export function resolveCustomerProvider(): CustomerProviderType {
  const envProvider = import.meta.env.VITE_DATA_PROVIDER;
  if (envProvider === 'firebase') {
    if (isFirebaseConfigured) {
      return 'firebase';
    }
    console.warn(
      '[Customers] VITE_DATA_PROVIDER is set to "firebase", but Firebase credentials are missing. Falling back to "mock" customer repository.'
    );
  }
  return 'mock';
}

export function createCustomerRepository(
  provider: CustomerProviderType = resolveCustomerProvider()
): ICustomerRepository {
  return provider === 'firebase'
    ? firestoreCustomerRepository
    : mockCustomerRepository;
}

export const customerRepository: ICustomerRepository = createCustomerRepository();
export const activeCustomerProvider: CustomerProviderType =
  customerRepository.providerName;

export * from './types';
export {
  mockCustomerRepository,
  MockCustomerRepository,
  matchesCustomerQuery,
} from './mockCustomerRepository';
export {
  firestoreCustomerRepository,
  FirestoreCustomerRepository,
} from './firestoreCustomerRepository';
