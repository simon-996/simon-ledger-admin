import { Navigate, Route, Routes } from 'react-router-dom';

import { AdminShell } from './components/AdminShell';
import { AuditPage } from './pages/AuditPage';
import { DashboardPage } from './pages/DashboardPage';
import { LedgersPage } from './pages/LedgersPage';
import { SystemPage } from './pages/SystemPage';
import { UsersPage } from './pages/UsersPage';

export function App() {
  return (
    <Routes>
      <Route element={<AdminShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="ledgers" element={<LedgersPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="system" element={<SystemPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
