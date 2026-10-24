import React from 'react';
import { NavLink } from 'react-router-dom';

export const Header: React.FC = () => {
  return (
    <header className="fixed surface top">
      <div className="header-content responsive">
        <div className="header-brand">
          <h5 className="no-margin bold primary-text">Hanger's Closet</h5>
        </div>

        {/* Navigation tabbed from Beer CSS NAVIGATION.md */}
        <nav className="tabbed">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <i>home</i>
            <div>Home</div>
          </NavLink>
          <NavLink
            to="/inventory"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <i>inventory_2</i>
            <div>Inventory</div>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <i>settings</i>
            <div>Settings</div>
          </NavLink>
        </nav>
      </div>
    </header>
  );
};
