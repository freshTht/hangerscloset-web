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
  );
};
