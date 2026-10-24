import React from 'react';
import { NavLink } from 'react-router-dom';

export const Header: React.FC = () => {
  return (
    <header className="fixed blur surface top s">
      {/* Top App Bar with Hanger Icon (Small screens) */}
      <nav className="top-app-bar center-align">
        <i className="extra primary-text">checkroom</i>
      </nav>

      {/* Default Tabs on small screens */}
      <div className="tabs s">
        <NavLink
          to="/"
          end
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          <i>home</i>
          <span>หน้าหลัก</span>
        </NavLink>
        <NavLink
          to="/inventory"
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          <i>inventory_2</i>
          <span>คลังสินค้า</span>
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          <i>settings</i>
          <span>การตั้งค่า</span>
        </NavLink>
      </div>
    </header>
  );
};
