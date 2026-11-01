import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { ModeBadge } from '../components/ModeBadge';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const { user, loading, signInWithGoogle } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const fromLocation =
    (location.state as { from?: { pathname: string } } | undefined)?.from
      ?.pathname || '/inventory';

  if (!loading && user) {
    return <Navigate to={fromLocation} replace />;
  }

  const handleLogin = async () => {
    try {
      setErrorMessage(null);
      setSubmitting(true);
      await signInWithGoogle();
      navigate(fromLocation, { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ โปรดลองใหม่อีกครั้ง';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="center-align middle-align padding hc-login-page-container">
      {submitting ? (
        <div
          className="shape loading-indicator extra"
          role="status"
          aria-label="กำลังเข้าสู่ระบบ"
        />
      ) : (
        /* Ultra-minimal foreground: App name, simple badge, and Google sign-in button */
        <div className="hc-login-page-content">
          {/* App Name & Simple Mode Badge */}
          <div className="row center-align hc-login-page-title-row">
            <h3 className="bold no-margin">Hanger's Closet</h3>
            <ModeBadge />
          </div>

          <div className="large-space"></div>

          {/* Google Sign-In Button with integrated subtle error notification */}
          <GoogleSignInButton
            onClick={handleLogin}
            disabled={submitting || loading}
            errorMessage={errorMessage}
          />
        </div>
      )}
    </div>
  );
};
