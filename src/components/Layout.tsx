import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export const Layout: React.FC = () => {
  return (
    <div className="app-container">
      <Header />
      <main className="responsive">
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
