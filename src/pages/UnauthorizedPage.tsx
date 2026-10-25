import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LazyImage } from '../components/LazyImage';

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
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {/* Main Content Layout */}
      <div
        style={{
          maxWidth: '380px',
          width: '100%',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div className="center-align">
          <h5 className="bold no-margin">คุณไม่มีสิทธิ์เข้าถึง</h5>
          <div className="tiny-space"></div>
          <p className="secondary-text small-text no-margin">หากมีข้อสงสัยเพิ่มเติม โปรดติดต่อ admin</p>
        </div>

        <div className="large-space"></div>

        {/* User account info card */}
        <div className="card surface-container-high round padding center-align">
          {user?.photoURL ? (
            <LazyImage
              src={user.photoURL}
              alt={user.displayName || 'ผู้ใช้งาน'}
              className="circle medium"
              fallbackIcon="account_circle"
              containerStyle={{ width: '56px', height: '56px', margin: '0 auto 12px auto' }}
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
              <div className="shape loading-indicator small" role="status" />
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
