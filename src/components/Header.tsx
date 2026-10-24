import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import ui from 'beercss';

export const Header: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    // Check initial mode or system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      ui('mode', 'dark');
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const nextMode = isDark ? 'light' : 'dark';
    ui('mode', nextMode);
    setIsDark(!isDark);
  };

  return (
    <header className="fixed surface top shadow">
      {/* Brand & Action Bar */}
      <nav className="max">
        <div className="row items-center gap">
          <i className="extra primary-text">checkroom</i>
          <h5 className="no-margin bold primary-text">Hanger's Closet</h5>
        </div>
        <div className="max"></div>
        <button
          className="circle transparent"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <i>{isDark ? 'light_mode' : 'dark_mode'}</i>
        </button>
      </nav>

      {/* Responsive Navigation Tabs */}
      <nav className="tabs min max fill">
        <NavLink
          to="/"
          end
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          <i>home</i>
          <span>Home</span>
        </NavLink>
        <NavLink
          to="/inventory"
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          <i>inventory_2</i>
          <span>Inventory</span>
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          <i>settings</i>
          <span>Settings</span>
        </NavLink>
      </nav>
    </header>
  );
};
