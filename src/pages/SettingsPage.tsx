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
          <h5 className="no-margin bold">การตั้งค่า</h5>
          <p className="no-margin secondary-text">ปรับแต่งแอปและการตั้งค่าส่วนตัว</p>
        </div>
      </div>

      <div className="space"></div>

      {/* Dark Mode Switch Setting */}
      <div className="card fill surface-container-low round padding">
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
      </div>

      <div className="space"></div>

      <div className="grid">
        <div className="s12 m6">
          <div className="card fill surface-container-low round padding">
            <h6 className="bold">ข้อมูลโปรไฟล์</h6>
            <p className="secondary-text">ตั้งค่าบัญชีผู้ใช้และข้อมูลส่วนตัว</p>
          </div>
        </div>
        <div className="s12 m6">
          <div className="card fill surface-container-low round padding">
            <h6 className="bold">การตั้งค่าแอป</h6>
            <p className="secondary-text">ซิงค์ข้อมูล การแจ้งเตือน และตัวเลือกส่งออก</p>
          </div>
        </div>
      </div>
    </article>
  );
};
