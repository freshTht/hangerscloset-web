import React, { useState, useEffect } from 'react';
import ui from 'beercss';
import { useAuth } from '../contexts/AuthContext';
import { ModeBadge } from '../components/ModeBadge';
import { LazyImage } from '../components/LazyImage';
import './SettingsPage.css';

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
    <div>
      {/* User Profile Card */}
      {user && (
        <article className="border round hc-medium-padding margin-bottom surface-container-low">
          <div className="row">
            {user.photoURL ? (
              <LazyImage
                src={user.photoURL}
                alt={user.displayName || 'ผู้ใช้งาน'}
                className="circle large"
                fallbackIcon="person"
                containerClassName="hc-settings-avatar"
              />
            ) : (
              <i className="extra circle surface-container-high primary-text">person</i>
            )}
            <div className="max hc-settings-user-info">
              <div className="row no-margin hc-settings-user-row">
                <h6 className="bold no-margin truncate">
                  {user.displayName || 'ผู้ใช้งาน'}
                </h6>
                <ModeBadge />
              </div>
              <p className="no-margin secondary-text small-text truncate">
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
                <div className="shape loading-indicator small" role="status" />
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
                <div className="shape loading-indicator small" role="status" />
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
      <article className="border round hc-medium-padding">
        <div className="row">
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
