import { describe, it, expect } from 'vitest';
import {
  createAuthService,
  mockAuthService,
  resolveAuthProvider,
} from '../auth';
import {
  createInventoryRepository,
  mockInventoryRepository,
  resolveInventoryProvider,
} from '../inventory';

describe('Environment Factories', () => {
  it('createAuthService returns mockAuthService for mock provider', () => {
    const service = createAuthService('mock');
    expect(service).toBe(mockAuthService);
    expect(service.providerName).toBe('mock');
  });

  it('createInventoryRepository returns mockInventoryRepository for mock provider', () => {
    const repo = createInventoryRepository('mock');
    expect(repo).toBe(mockInventoryRepository);
    expect(repo.providerName).toBe('mock');
  });

  it('resolves to mock provider by default when Firebase keys are absent', () => {
    expect(resolveAuthProvider()).toBe('mock');
    expect(resolveInventoryProvider()).toBe('mock');
  });
});
