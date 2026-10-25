import { isFirebaseConfigured } from '../../lib/firebase';
import { firebaseAuthService } from './firebaseAuthService';
import { mockAuthService } from './mockAuthService';
import type { AuthProviderType, IAuthService } from './types';

export function resolveAuthProvider(): AuthProviderType {
  const envProvider = import.meta.env.VITE_DATA_PROVIDER;
  if (envProvider === 'firebase') {
    if (isFirebaseConfigured) {
      return 'firebase';
    }
    console.warn(
      '[Auth] VITE_DATA_PROVIDER is set to "firebase", but Firebase credentials are missing. Falling back to "mock" auth provider.'
    );
  }
  return 'mock';
}

export function createAuthService(provider: AuthProviderType = resolveAuthProvider()): IAuthService {
  return provider === 'firebase' ? firebaseAuthService : mockAuthService;
}

export const authService: IAuthService = createAuthService();
export const activeAuthProvider: AuthProviderType = authService.providerName;

export * from './types';
export { mockAuthService } from './mockAuthService';
export { firebaseAuthService } from './firebaseAuthService';
