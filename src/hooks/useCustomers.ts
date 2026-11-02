import { useEffect, useState, useCallback } from 'react';
import {
  customerRepository as defaultRepo,
  type ICustomerRepository,
  type CustomerProviderType,
  type NewCustomerInput,
} from '../services/customers';
import type { Customer } from '../types/customer';

interface UseCustomersResult {
  customers: Customer[];
  loading: boolean;
  error: Error | null;
  provider: CustomerProviderType;
  searchByPhoneOrName: (query: string) => Promise<Customer[]>;
  addCustomer: (customer: NewCustomerInput) => Promise<string>;
  updateCustomer: (
    id: string,
    customer: Partial<Omit<Customer, 'id'>>
  ) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
}

export function useCustomers(
  repository: ICustomerRepository = defaultRepo
): UseCustomersResult {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = repository.subscribe((updatedCustomers) => {
      setCustomers(updatedCustomers);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [repository]);

  const toError = (err: unknown, fallback: string): Error =>
    err instanceof Error ? err : new Error(fallback);

  const searchByPhoneOrName = useCallback(
    async (query: string) => {
      try {
        return await repository.searchByPhoneOrName(query);
      } catch (err: unknown) {
        throw toError(err, 'Failed to search customers');
      }
    },
    [repository]
  );

  const addCustomer = useCallback(
    async (customerData: NewCustomerInput) => {
      try {
        return await repository.addCustomer(customerData);
      } catch (err: unknown) {
        throw toError(err, 'Failed to add customer');
      }
    },
    [repository]
  );

  const updateCustomer = useCallback(
    async (id: string, customerData: Partial<Omit<Customer, 'id'>>) => {
      try {
        await repository.updateCustomer(id, customerData);
      } catch (err: unknown) {
        throw toError(err, 'Failed to update customer');
      }
    },
    [repository]
  );

  const deleteCustomer = useCallback(
    async (id: string) => {
      try {
        await repository.deleteCustomer(id);
      } catch (err: unknown) {
        throw toError(err, 'Failed to delete customer');
      }
    },
    [repository]
  );

  return {
    customers,
    loading,
    error,
    provider: repository.providerName,
    searchByPhoneOrName,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
