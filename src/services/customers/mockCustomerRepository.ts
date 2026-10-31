import { mockCustomers } from '../../data/mockCustomers';
import type { Customer } from '../../types/customer';
import type { ICustomerRepository, NewCustomerInput } from './types';

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/[\s-]/g, '').toLowerCase();
}

export function matchesCustomerQuery(
  customer: Customer,
  rawQuery: string
): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const qDigits = normalizePhoneDigits(q);
  const phoneDigits = normalizePhoneDigits(customer.phone);

  return (
    customer.name.toLowerCase().includes(q) ||
    customer.phone.toLowerCase().includes(q) ||
    (qDigits.length > 0 && phoneDigits.includes(qDigits)) ||
    Boolean(customer.lineId && customer.lineId.toLowerCase().includes(q))
  );
}

export class MockCustomerRepository implements ICustomerRepository {
  readonly providerName = 'mock' as const;
  private customers: Customer[];
  private listeners: Set<(customers: Customer[]) => void> = new Set();
  private idCounter = 0;

  constructor(initialCustomers: Customer[] = mockCustomers) {
    this.customers = initialCustomers.map((c) => ({
      ...c,
      lineId: c.lineId ?? null,
      note: c.note ?? null,
    }));
  }

  private notifyListeners(): void {
    const snapshot = [...this.customers];
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  subscribe(callback: (customers: Customer[]) => void): () => void {
    this.listeners.add(callback);
    callback([...this.customers]);

    return () => {
      this.listeners.delete(callback);
    };
  }

  async getAll(): Promise<Customer[]> {
    return [...this.customers];
  }

  async searchByPhoneOrName(query: string): Promise<Customer[]> {
    return this.customers.filter((c) => matchesCustomerQuery(c, query));
  }

  async addCustomer(customerData: NewCustomerInput): Promise<string> {
    this.idCounter += 1;
    const newId = `cust-${Date.now()}-${this.idCounter}`;
    const newCustomer: Customer = {
      id: newId,
      name: customerData.name.trim(),
      phone: customerData.phone.trim(),
      lineId: customerData.lineId?.trim() || null,
      note: customerData.note?.trim() || null,
      createdAt: customerData.createdAt ?? new Date().toISOString(),
    };

    this.customers = [newCustomer, ...this.customers];
    this.notifyListeners();
    return newId;
  }

  async updateCustomer(
    id: string,
    customerData: Partial<Omit<Customer, 'id'>>
  ): Promise<void> {
    const index = this.customers.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Customer with id "${id}" not found.`);
    }

    const updated: Customer = {
      ...this.customers[index],
      ...customerData,
      id,
    };

    this.customers = [
      ...this.customers.slice(0, index),
      updated,
      ...this.customers.slice(index + 1),
    ];
    this.notifyListeners();
  }

  async deleteCustomer(id: string): Promise<void> {
    const index = this.customers.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Customer with id "${id}" not found.`);
    }

    this.customers = [
      ...this.customers.slice(0, index),
      ...this.customers.slice(index + 1),
    ];
    this.notifyListeners();
  }
}

export const mockCustomerRepository = new MockCustomerRepository();
