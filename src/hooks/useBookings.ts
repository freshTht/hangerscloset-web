import { useEffect, useState, useCallback } from 'react';
import {
  bookingRepository as defaultRepo,
  type IBookingRepository,
  type BookingProviderType,
  type NewBookingInput,
} from '../services/bookings';
import type { Booking, BookingItemStatus } from '../types/booking';

interface UseBookingsResult {
  bookings: Booking[];
  loading: boolean;
  error: Error | null;
  provider: BookingProviderType;
  addBooking: (booking: NewBookingInput) => Promise<string>;
  updateBooking: (
    id: string,
    booking: Partial<Omit<Booking, 'id'>>
  ) => Promise<void>;
  updateItemStatus: (
    bookingId: string,
    itemId: string,
    status: BookingItemStatus,
    conditionNote?: string | null
  ) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
}

export function useBookings(
  repository: IBookingRepository = defaultRepo
): UseBookingsResult {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = repository.subscribe((updatedBookings) => {
      setBookings(updatedBookings);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [repository]);

  const toError = (err: unknown, fallback: string): Error =>
    err instanceof Error ? err : new Error(fallback);

  const addBooking = useCallback(
    async (bookingData: NewBookingInput) => {
      try {
        return await repository.addBooking(bookingData);
      } catch (err: unknown) {
        throw toError(err, 'Failed to add booking');
      }
    },
    [repository]
  );

  const updateBooking = useCallback(
    async (id: string, bookingData: Partial<Omit<Booking, 'id'>>) => {
      try {
        await repository.updateBooking(id, bookingData);
      } catch (err: unknown) {
        throw toError(err, 'Failed to update booking');
      }
    },
    [repository]
  );

  const updateItemStatus = useCallback(
    async (
      bookingId: string,
      itemId: string,
      status: BookingItemStatus,
      conditionNote?: string | null
    ) => {
      try {
        await repository.updateItemStatus(
          bookingId,
          itemId,
          status,
          conditionNote
        );
      } catch (err: unknown) {
        throw toError(err, 'Failed to update item status');
      }
    },
    [repository]
  );

  const deleteBooking = useCallback(
    async (id: string) => {
      try {
        await repository.deleteBooking(id);
      } catch (err: unknown) {
        throw toError(err, 'Failed to delete booking');
      }
    },
    [repository]
  );

  return {
    bookings,
    loading,
    error,
    provider: repository.providerName,
    addBooking,
    updateBooking,
    updateItemStatus,
    deleteBooking,
  };
}
