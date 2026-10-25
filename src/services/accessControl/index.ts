import { resolveAuthProvider } from '../auth';
import { firestoreAccessControlService } from './firestoreAccessControlService';
import { mockAccessControlService } from './mockAccessControlService';
import type { IAccessControlService } from './types';

export function createAccessControlService(): IAccessControlService {
  const provider = resolveAuthProvider();
  return provider === 'firebase'
    ? firestoreAccessControlService
    : mockAccessControlService;
}

export const accessControlService: IAccessControlService = createAccessControlService();

export * from './types';
export { mockAccessControlService } from './mockAccessControlService';
export { firestoreAccessControlService } from './firestoreAccessControlService';
