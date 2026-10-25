import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { MaterialShapesBackground } from './components/MaterialShapesBackground';

// Lazy-loaded route components for improved initial page load performance
const LoginPage = React.lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const InventoryPage = React.lazy(() =>
  import('./pages/InventoryPage').then((m) => ({ default: m.InventoryPage }))
);
const SettingsPage = React.lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

const PageLoadingFallback: React.FC = () => (
  <div
    className="center-align middle-align padding"
    style={{
      minHeight: '80dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <div
      className="shape loading-indicator extra"
      role="status"
      aria-label="กำลังโหลดเนื้อหา"
    />
  </div>
);

const PersistentBackground: React.FC = () => {
  const { user, isAuthorized, loading, checkingAccess } = useAuth();
  // Persistent uninterrupted background during login, checking, and unauthorized states
  const showBg = !user || loading || checkingAccess || !isAuthorized;

  return <MaterialShapesBackground active={showBg} />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <PersistentBackground />
      <BrowserRouter>
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            {/* Public login route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/inventory" replace />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/inventory" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
