import React, { useState, useEffect } from 'react';
import ui from 'beercss';
import { useAuth } from '../contexts/AuthContext';
import { ModeBadge } from '../components/ModeBadge';
import { LazyImage } from '../components/LazyImage';
import {
  AVAILABLE_FONTS,
  getSavedFontId,
  applyFont,
} from '../lib/fontManager';
import './SettingsPage.css';

export const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.body.classList.contains('dark');
  });
  const [selectedFontId, setSelectedFontId] = useState<string>(() => getSavedFontId());
  const [loadingFontId, setLoadingFontId] = useState<string | null>(null);

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

  const handleFontChange = async (fontId: string) => {
    if (fontId === selectedFontId) return;
    try {
      setLoadingFontId(fontId);
      setSelectedFontId(fontId);
      await applyFont(fontId);
    } catch (error) {
      console.error('Failed to apply font:', error);
    } finally {
      setLoadingFontId(null);
    }
  };

  return (
    <div className="hc-settings-page">
      {/* User Profile Card — Vertical & Center-Aligned */}
      {user && (
        <article className="border round surface-container-low hc-settings-user-card">
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

          <div className="hc-settings-user-info">
            <div className="hc-settings-user-row">
              <h6 className="bold truncate hc-settings-user-name">
                {user.displayName || 'ผู้ใช้งาน'}
              </h6>
              <ModeBadge />
            </div>
            <p className="secondary-text truncate hc-settings-user-email">
              {user.email || 'ไม่มีอีเมล'}
            </p>
          </div>

          <button
            type="button"
            className="border round hc-settings-logout-btn"
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
        </article>
      )}

      {/* Combined Appearance Section Card (Dark Mode + Fonts) */}
      <article className="border round no-padding hc-settings-section-card">
        {/* Compact Dark Mode Row */}
        <div className="hc-settings-compact-row">
          <div className="hc-settings-row-lead">
            <i className="small primary-text">dark_mode</i>
            <span className="hc-settings-row-title">ธีมมืด</span>
          </div>
          <label className="switch icon no-margin">
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

        <div className="divider no-margin" />

        {/* Compact Horizontal Fonts Block */}
        <div className="hc-settings-fonts-block">
          <div className="hc-settings-fonts-header">
            <div className="hc-settings-row-lead">
              <i className="small primary-text">font_download</i>
              <span className="hc-settings-row-title">แบบอักษร</span>
            </div>
            {loadingFontId && (
              <div
                className="shape loading-indicator tiny"
                role="status"
                aria-label="กำลังโหลดฟอนต์..."
                title="กำลังโหลดฟอนต์..."
              />
            )}
          </div>

          <div className="hc-settings-font-list">
            {AVAILABLE_FONTS.map((font) => {
              const isSelected = selectedFontId === font.id;

              return (
                <div
                  key={font.id}
                  className={`hc-settings-font-option ${
                    isSelected ? 'hc-settings-font-option-active' : ''
                  }`}
                  onClick={() => handleFontChange(font.id)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleFontChange(font.id);
                    }
                  }}
                >
                  <input
                    type="radio"
                    name="settings-app-font"
                    className="hc-sr-only"
                    checked={isSelected}
                    onChange={() => handleFontChange(font.id)}
                    aria-label={font.label}
                  />

                  {/* Preview Box Container */}
                  <div className="hc-settings-font-box">
                    <img
                      src={font.previewImage}
                      alt={`ตัวอย่างฟอนต์ ${font.label}`}
                      className="hc-settings-font-preview-img"
                    />
                  </div>

                  {/* Font Name outside the box */}
                  <span className="hc-settings-font-name">
                    {font.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </article>
    </div>
  );
};
