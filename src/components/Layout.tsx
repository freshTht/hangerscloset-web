import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Header } from './Header';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { to: '/bookings', label: 'การจอง', icon: 'event_note' },
  { to: '/inventory', label: 'คลังสินค้า', icon: 'inventory_2' },
  { to: '/settings', label: 'การตั้งค่า', icon: 'settings' },
];

export const Layout: React.FC = () => {
  const renderNavLinks = () => (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => (isActive ? 'active' : '')}
          title={item.label}
        >
          <i>{item.icon}</i>
          <div>{item.label}</div>
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="app-container">
      {/* Compact Rail on medium & large screens (601px and above) */}
      <nav className="left m l">
        <div className="rail-top">
          <i className="extra primary-text">checkroom</i>
        </div>
        <div className="max"></div>
        {renderNavLinks()}
        <div className="max"></div>
        <div className="rail-bottom-spacer" aria-hidden="true"></div>
      </nav>

      {/* Mobile Top App Bar with sticky fixed behavior (Small screens only) */}
      <Header />

      {/* Main Content Area */}
      <main className="responsive">
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
