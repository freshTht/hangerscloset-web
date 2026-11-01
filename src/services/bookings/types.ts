import type {
  Booking,
  BookingItemStatus,
  BookingTransactionDates,
} from '../../types/booking';

export type BookingProviderType = 'mock' | 'firebase';

export type NewBookingInput = Omit<
  Booking,
  'id' | 'createdAt' | 'updatedAt' | 'transactionDates'
> & {
  transactionDates?: BookingTransactionDates;
  createdAt?: string;
  updatedAt?: string;
};

export interface IBookingRepository {
  readonly providerName: BookingProviderType;
  subscribe(callback: (bookings: Booking[]) => void): () => void;
  getAll(): Promise<Booking[]>;
  addBooking(booking: NewBookingInput): Promise<string>;
  updateBooking(
    id: string,
    booking: Partial<Omit<Booking, 'id'>>
  ): Promise<void>;
  updateItemStatus(
    bookingId: string,
    itemId: string,
    status: BookingItemStatus,
    conditionNote?: string | null,
    effectiveDate?: string
  ): Promise<void>;
  deleteBooking(id: string): Promise<void>;
}
