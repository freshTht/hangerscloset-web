import React from 'react';
import { NavLink } from 'react-router-dom';

export const Header: React.FC = () => {
  return (
    <header className="top s hc-top-header">
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
    </header>
  );
};
