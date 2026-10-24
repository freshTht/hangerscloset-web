import React, { useState, useEffect } from 'react';
import ui from 'beercss';

export const SettingsPage: React.FC = () => {
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

  return (
    <article className="border round">
      <div className="row items-center gap">
        <i className="extra primary-text">settings</i>
        <div className="max">
          <h5 className="no-margin bold">Settings</h5>
          <p className="no-margin secondary-text">App configuration and preferences</p>
        </div>
      </div>

      <div className="space"></div>

      {/* Dark Mode Switch Setting */}
      <div className="card fill surface-container-low round padding">
        <div className="row items-center">
          <div className="max">
            <h6 className="bold no-margin">Dark Theme</h6>
            <p className="no-margin secondary-text">
              {isDark ? 'Dark theme is currently active' : 'Light theme is currently active'}
            </p>
          </div>
          <label className="switch icon">
            <input
              type="checkbox"
              checked={isDark}
              onChange={handleThemeChange}
              aria-label="Toggle dark theme"
            />
            <span>
              <i>dark_mode</i>
            </span>
          </label>
        </div>
      </div>

      <div className="space"></div>

      <div className="grid">
        <div className="s12 m6">
          <div className="card fill surface-container-low round padding">
            <h6 className="bold">Profile Settings</h6>
            <p className="secondary-text">User account and details configuration.</p>
          </div>
        </div>
        <div className="s12 m6">
          <div className="card fill surface-container-low round padding">
            <h6 className="bold">App Preferences</h6>
            <p className="secondary-text">Data sync, notifications, and export options.</p>
          </div>
        </div>
      </div>
    </article>
  );
};
