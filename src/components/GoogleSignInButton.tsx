import React from 'react';

export function getAuthErrorInfo(rawError: string): { message: string; isCancellation: boolean } {
  if (rawError.includes('popup-closed-by-user')) {
    return { message: 'การเข้าสู่ระบบถูกยกเลิก', isCancellation: true };
  }
  if (rawError.includes('popup-blocked')) {
    return {
      message: 'เบราว์เซอร์บล็อกป๊อปอัป กรุณาอนุญาตป๊อปอัปแล้วลองใหม่อีกครั้ง',
      isCancellation: false,
    };
  }
  if (rawError.includes('network-request-failed')) {
    return {
      message: 'การเชื่อมต่อขัดข้อง โปรดตรวจสอบอินเทอร์เน็ตแล้วลองใหม่',
      isCancellation: false,
    };
  }
  const cleaned = rawError.replace(/^Firebase:\s*Error\s*\((.*?)\)\.?/i, '$1');
  return { message: cleaned || rawError, isCancellation: false };
}

export interface GoogleSignInButtonProps {
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  errorMessage?: string | null;
  text?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onClick,
  disabled = false,
  errorMessage,
  text = 'เข้าสู่ระบบด้วย Google',
  className = '',
  style,
}) => {
  return (
    <div className={`center-align ${className}`.trim()} style={style}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="border round"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          height: '48px',
          padding: '0 24px',
          minWidth: '240px',
          cursor: disabled ? 'default' : 'pointer',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          fontWeight: 500,
          boxShadow: 'var(--elevate1)',
        }}
      >
        {/* Official 4-Color Google "G" Logo */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={{ flexShrink: 0 }}
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            fill="#EA4335"
          />
        </svg>
        <span>{text}</span>
      </button>

      {/* Subtle error state (no red background) */}
      {errorMessage && (() => {
        const errorInfo = getAuthErrorInfo(errorMessage);
        return (
          <div
            className="row center-align items-center justify-center"
            style={{
              marginTop: '16px',
              gap: '6px',
              opacity: 0.85,
            }}
          >
            <i
              className={`small ${errorInfo.isCancellation ? 'secondary-text' : 'error-text'}`}
            >
              {errorInfo.isCancellation ? 'info' : 'error'}
            </i>
            <span
              className={`small-text ${errorInfo.isCancellation ? 'secondary-text' : 'error-text'}`}
            >
              {errorInfo.message}
            </span>
          </div>
        );
      })()}
    </div>
  );
};
