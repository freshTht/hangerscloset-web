import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { user, loading, provider, signInWithGoogle } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect if already logged in
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
    <div
      className="center-align middle-align padding"
      style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <article
        className="border round medium-padding medium-elevate surface-container-low"
        style={{ maxWidth: '440px', width: '100%' }}
      >
        {/* Brand Icon & Heading */}
        <div className="center-align">
          <i className="extra primary-text" style={{ fontSize: '4rem' }}>
            checkroom
          </i>
          <h4 className="bold no-margin">Hanger's Closet</h4>
          <p className="secondary-text">ระบบจัดการคลังเสื้อผ้าให้เช่า</p>

          {/* Environment Mode Badge */}
          <div className="margin">
            {provider === 'mock' ? (
              <span className="chip fill secondary-container small">
                <i>science</i>
                <span>โหมดจำลอง (Mock Data)</span>
              </span>
            ) : (
              <span className="chip fill primary-container small">
                <i>cloud</i>
                <span>โหมดออนไลน์ (Firebase)</span>
              </span>
            )}
          </div>
        </div>

        <div className="space"></div>

        {/* Error notification if any */}
        {errorMessage && (
          <article className="border error-container round margin">
            <div className="row items-center">
              <i className="error-text">error</i>
              <div className="max">
                <p className="no-margin error-text">{errorMessage}</p>
              </div>
            </div>
          </article>
        )}

        {/* Action Button */}
        <div className="center-align">
          <button
            type="button"
            className="extra round elevate primary responsive"
            onClick={handleLogin}
            disabled={submitting || loading}
          >
            {submitting ? (
              <>
                <progress className="circle small"></progress>
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <>
                <i>login</i>
                <span>เข้าสู่ระบบด้วย Google</span>
              </>
            )}
          </button>
        </div>

        {/* Contextual guidance */}
        <div className="space"></div>
        {provider === 'mock' ? (
          <p className="center-align secondary-text small-text no-margin">
            💡 ในโหมด Mock คุณสามารถคลิกเข้าสู่ระบบได้ทันทีโดยไม่ต้องตั้งค่า Firebase
          </p>
        ) : (
          <p className="center-align secondary-text small-text no-margin">
            เข้าสู่ระบบด้วยบัญชี Google ที่ได้รับอนุญาต
          </p>
        )}
      </article>
    </div>
  );
};
