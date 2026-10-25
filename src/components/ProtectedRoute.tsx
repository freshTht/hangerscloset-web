import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, isAuthorized, checkingAccess } = useAuth();
  const location = useLocation();

  if (loading || checkingAccess) {
    return (
      <div className="center-align middle-align padding" style={{ minHeight: '60vh' }}>
        <div className="center-align">
          <progress className="circle large"></progress>
          <div className="space"></div>
          <p className="secondary-text">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAuthorized) {
    return <UnauthorizedPage />;
  }

  return children ? <>{children}</> : null;
};
