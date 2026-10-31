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
import {
  createStorageService,
  mockStorageService,
  resolveStorageProvider,
} from '../storage';

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

  it('createStorageService returns mockStorageService for mock provider', () => {
    const storage = createStorageService('mock');
    expect(storage).toBe(mockStorageService);
    expect(storage.providerName).toBe('mock');
  });

  it('resolves to mock provider by default when Firebase keys are absent', () => {
    expect(resolveAuthProvider()).toBe('mock');
    expect(resolveInventoryProvider()).toBe('mock');
    expect(resolveStorageProvider()).toBe('mock');
  });
});
