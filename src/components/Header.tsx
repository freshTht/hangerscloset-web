import React from 'react';
import { NavLink } from 'react-router-dom';

export const Header: React.FC = () => {
  return (
    <header className="fixed surface top app-header">
      {/* Top App Bar with Hanger Icon (Small screens only) */}
      <nav className="top-app-bar center-align s">
        <i className="extra primary-text">checkroom</i>
      </nav>

      {/* Default Tabs on small screens */}
      <div className="tabs s">
        <NavLink
          to="/bookings"
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          <i>event_note</i>
          <span>การจอง</span>
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

      {/* Dynamic slot for page-specific headers / sticky filter bars */}
      <div id="page-header-slot" className="page-header-slot" />
    </header>
  );
};
