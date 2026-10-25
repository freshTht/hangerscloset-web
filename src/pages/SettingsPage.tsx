import React, { useState, useEffect } from 'react';
import ui from 'beercss';
import { useAuth } from '../contexts/AuthContext';
import { ModeBadge } from '../components/ModeBadge';

export const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.body.classList.contains('dark');
  });

  useEffect(() => {
    setIsDark(document.body.classList.contains('dark'));
  }, []);

  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const nextMode = checked ? 'dark' : 'light';
    ui('mode', nextMode);
    localStorage.setItem('theme-mode', nextMode);
    setIsDark(checked);
  };

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="settings-page">
      {/* User Profile Card */}
      {user && (
        <article className="border round medium-padding margin-bottom surface-container-low">
          <div className="row items-center">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'ผู้ใช้งาน'}
                className="circle large"
                style={{ width: '56px', height: '56px', objectFit: 'cover' }}
              />
            ) : (
              <i className="extra circle surface-container-high primary-text">person</i>
            )}
            <div className="max" style={{ minWidth: 0 }}>
              <div className="row items-center no-margin" style={{ gap: '8px' }}>
                <h6
                  className="bold no-margin"
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {user.displayName || 'ผู้ใช้งาน'}
                </h6>
                <ModeBadge />
              </div>
              <p
                className="no-margin secondary-text small-text"
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {user.email || 'ไม่มีอีเมล'}
              </p>
            </div>

            {/* Logout Button on medium/large screens (Neutral outlined, no red) */}
            <button
              type="button"
              className="border round m l"
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

          {/* Full-width Logout Button on small mobile screens (Neutral outlined, no red) */}
          <div className="s margin-top">
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
        </article>
      )}

      {/* Theme Toggle Card */}
      <article className="border round medium-padding">
        <div className="row items-center">
          <div className="max">
            <h6 className="bold no-margin">ธีมมืด</h6>
            <p className="no-margin secondary-text">
              {isDark ? 'ใช้งานธีมมืดอยู่' : 'ใช้งานธีมสว่างอยู่'}
            </p>
          </div>
          <label className="switch icon">
            <input
              type="checkbox"
              checked={isDark}
              onChange={handleThemeChange}
              aria-label="สลับธีมมืด"
            />
            <span>
              <i>dark_mode</i>
            </span>
          </label>
        </div>
      </article>
    </div>
  );
};
