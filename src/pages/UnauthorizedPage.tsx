import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div
      className="center-align middle-align padding"
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Google Pixel / Material You decorative ambient shapes (uncovered) */}
      <div
        className="shape flower slow-rotate primary-container"
        style={{
          position: 'absolute',
          top: '8%',
          left: '5%',
          width: '16rem',
          height: '16rem',
          opacity: 0.12,
          pointerEvents: 'none',
          zIndex: 0,
        }}
        aria-hidden="true"
      />
      <div
        className="shape wavy-circle rotate tertiary-container"
        style={{
          position: 'absolute',
          bottom: '8%',
          right: '5%',
          width: '18rem',
          height: '18rem',
          opacity: 0.12,
          pointerEvents: 'none',
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* Main Content Layout (without outer covering card) */}
      <div
        style={{
          maxWidth: '380px',
          width: '100%',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header Title */}
        <div className="center-align">
          <h5 className="bold no-margin">คุณไม่มีสิทธิ์เข้าถึง</h5>
          <div className="tiny-space"></div>
          <p className="secondary-text small-text no-margin">หากมีข้อสงสัยเพิ่มเติม โปรดติดต่อ admin</p>
        </div>

        <div className="large-space"></div>

        {/* User account info card */}
        <div className="card surface-container-high round padding center-align">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'ผู้ใช้งาน'}
              className="circle medium margin-bottom"
              style={{ width: '56px', height: '56px', objectFit: 'cover' }}
            />
          ) : (
            <i className="large circle secondary-text">account_circle</i>
          )}
          <h6 className="bold no-margin">{user?.displayName || 'ผู้ใช้งาน'}</h6>
          <p className="secondary-text small-text no-margin">{user?.email || 'ไม่มีอีเมล'}</p>
        </div>

        <div className="space"></div>

        {/* Single logout button */}
        <div className="center-align">
          <button
            type="button"
            className="border round responsive"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? (
              <progress className="circle small"></progress>
            ) : (
              <>
                <i>logout</i>
                <span>ออกจากระบบ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
