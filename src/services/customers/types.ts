import type { Customer } from '../../types/customer';

export type CustomerProviderType = 'mock' | 'firebase';

export type NewCustomerInput = Omit<Customer, 'id' | 'createdAt'> & {
  createdAt?: string;
};

export interface ICustomerRepository {
  readonly providerName: CustomerProviderType;
  subscribe(callback: (customers: Customer[]) => void): () => void;
  getAll(): Promise<Customer[]>;
  searchByPhoneOrName(query: string): Promise<Customer[]>;
  addCustomer(customer: NewCustomerInput): Promise<string>;
  updateCustomer(
    id: string,
    customer: Partial<Omit<Customer, 'id'>>
  ): Promise<void>;
  deleteCustomer(id: string): Promise<void>;
}
