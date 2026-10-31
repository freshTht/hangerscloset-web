import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockCustomerRepository } from '../mockCustomerRepository';
import type { Customer } from '../../../types/customer';

const sampleCustomers: Customer[] = [
  {
    id: 'c1',
    name: 'คุณพลอย รัตนากร',
    phone: '081-234-5678',
    lineId: '@ploy_r',
    note: 'VIP',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'c2',
    name: 'คุณมายด์ พิมพ์ชนก',
    phone: '089-999-1234',
    lineId: 'mind.pim',
    note: null,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
];

describe('MockCustomerRepository', () => {
  let repo: MockCustomerRepository;

  beforeEach(() => {
    repo = new MockCustomerRepository(sampleCustomers);
  });

  it('getAll returns clone of initial customers', async () => {
    const customers = await repo.getAll();
    expect(customers).toHaveLength(2);
    expect(customers[0].name).toBe('คุณพลอย รัตนากร');
  });

  it('searchByPhoneOrName matches by name, formatted phone, or raw digits', async () => {
    const byName = await repo.searchByPhoneOrName('พลอย');
    expect(byName).toHaveLength(1);
    expect(byName[0].id).toBe('c1');

    const byDigits = await repo.searchByPhoneOrName('0899991234');
    expect(byDigits).toHaveLength(1);
    expect(byDigits[0].id).toBe('c2');

    const byLine = await repo.searchByPhoneOrName('@ploy_r');
    expect(byLine).toHaveLength(1);
    expect(byLine[0].id).toBe('c1');
  });

  it('addCustomer creates customer with auto-ID and notifies subscribers', async () => {
    const listener = vi.fn();
    const unsubscribe = repo.subscribe(listener);

    expect(listener).toHaveBeenCalledTimes(1);

    const newId = await repo.addCustomer({
      name: 'คุณแพรว สุภัสสรา',
      phone: '086-555-4321',
      lineId: 'praew_s',
      note: 'เชียงใหม่',
    });

    expect(newId).toBeDefined();
    expect(newId).not.toBe('086-555-4321');
    const all = await repo.getAll();
    expect(all).toHaveLength(3);
    expect(all[0].name).toBe('คุณแพรว สุภัสสรา');
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it('updateCustomer updates existing customer and notifies subscribers', async () => {
    await repo.updateCustomer('c1', { phone: '081-000-0000' });
    const all = await repo.getAll();
    const updated = all.find((c) => c.id === 'c1');
    expect(updated?.phone).toBe('081-000-0000');
  });

  it('updateCustomer throws error when customer does not exist', async () => {
    await expect(
      repo.updateCustomer('missing-id', { name: 'Test' })
    ).rejects.toThrow('Customer with id "missing-id" not found.');
  });

  it('deleteCustomer removes customer and notifies subscribers', async () => {
    await repo.deleteCustomer('c1');
    const all = await repo.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('c2');
  });
});
