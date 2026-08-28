import React from 'react';
import { NavLink, Route } from 'react-router-dom';
import { AnimationRoutes, App, ZMPRouter } from 'zmp-ui';
import QrPage from './pages/qr';
import SettingsPage from './pages/settings';
import TransactionsPage from './pages/transactions';

function Navigation() {
  return (
    <nav className="bottom-nav" aria-label="Điều hướng chính">
      <NavLink to="/" end>Tạo QR</NavLink>
      <NavLink to="/transactions">Giao dịch</NavLink>
      <NavLink to="/settings">Cấu hình</NavLink>
    </nav>
  );
}

export default function MonaPayApp() {
  return (
    <App>
      <ZMPRouter>
        <main className="app-shell">
          <AnimationRoutes>
            <Route path="/" element={<QrPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </AnimationRoutes>
          <Navigation />
        </main>
      </ZMPRouter>
    </App>
  );
}
