import React, { Suspense } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const UnauthorizedPage = React.lazy(() =>
  import('../pages/UnauthorizedPage').then((m) => ({ default: m.UnauthorizedPage }))
);

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, isAuthorized, checkingAccess } = useAuth();
  const location = useLocation();

  if (loading || checkingAccess) {
    return (
      <div
        className="center-align middle-align padding"
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          className="shape loading-indicator extra"
          role="status"
          aria-label="กำลังตรวจสอบสิทธิ์"
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAuthorized) {
    return (
      <Suspense
        fallback={
          <div
            className="center-align middle-align padding"
            style={{
              minHeight: '100dvh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <div
              className="shape loading-indicator extra"
              role="status"
              aria-label="กำลังโหลด"
            />
          </div>
        }
      >
        <UnauthorizedPage />
      </Suspense>
    );
  }

  return children ? <>{children}</> : null;
};
