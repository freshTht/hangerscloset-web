import { isFirebaseConfigured } from '../../lib/firebase';
import { firestoreBookingRepository } from './firestoreBookingRepository';
import { mockBookingRepository } from './mockBookingRepository';
import type { IBookingRepository, BookingProviderType } from './types';

export function resolveBookingProvider(): BookingProviderType {
  const envProvider = import.meta.env.VITE_DATA_PROVIDER;
  if (envProvider === 'firebase') {
    if (isFirebaseConfigured) {
      return 'firebase';
    }
    console.warn(
      '[Bookings] VITE_DATA_PROVIDER is set to "firebase", but Firebase credentials are missing. Falling back to "mock" booking repository.'
    );
  }
  return 'mock';
}

export function createBookingRepository(
  provider: BookingProviderType = resolveBookingProvider()
): IBookingRepository {
  return provider === 'firebase'
    ? firestoreBookingRepository
    : mockBookingRepository;
}

export const bookingRepository: IBookingRepository = createBookingRepository();
export const activeBookingProvider: BookingProviderType =
  bookingRepository.providerName;

export * from './types';
export {
  mockBookingRepository,
  MockBookingRepository,
} from './mockBookingRepository';
export {
  firestoreBookingRepository,
  FirestoreBookingRepository,
} from './firestoreBookingRepository';
