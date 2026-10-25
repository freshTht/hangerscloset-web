import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  authService as defaultAuthService,
  type AuthUser,
  type IAuthService,
  type AuthProviderType,
} from '../services/auth';
import {
  accessControlService as defaultAccessControl,
  type IAccessControlService,
} from '../services/accessControl';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthorized: boolean;
  checkingAccess: boolean;
  error: string | null;
  provider: AuthProviderType;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  recheckAccess: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  service?: IAuthService;
  accessControl?: IAccessControlService;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  service = defaultAuthService,
  accessControl = defaultAccessControl,
}) => {
  const [user, setUser] = useState<AuthUser | null>(() => service.getCurrentUser());
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [checkingAccess, setCheckingAccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkUserAuthorization = useCallback(
    async (currentUser: AuthUser | null) => {
      if (!currentUser) {
        setIsAuthorized(false);
        setCheckingAccess(false);
        return;
      }

      setCheckingAccess(true);
      try {
        const authorized = await accessControl.checkIsAuthorized(currentUser.email);
        setIsAuthorized(authorized);
      } catch (err) {
        console.error('[AuthContext] Error verifying user access:', err);
        setIsAuthorized(false);
      } finally {
        setCheckingAccess(false);
      }
    },
    [accessControl]
  );

  useEffect(() => {
    setLoading(true);
    const unsubscribe = service.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      await checkUserAuthorization(currentUser);
    });

    return () => {
      unsubscribe();
    };
  }, [service, checkUserAuthorization]);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      const signedInUser = await service.signInWithGoogle();
      await checkUserAuthorization(signedInUser);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setLoading(true);
      await service.signOut();
      setIsAuthorized(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการออกจากระบบ';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const recheckAccess = async () => {
    await checkUserAuthorization(user);
  };

  const value: AuthContextValue = {
    user,
    loading,
    isAuthorized,
    checkingAccess,
    error,
    provider: service.providerName,
    signInWithGoogle,
    signOut,
    recheckAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
