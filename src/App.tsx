import { Navigate, Route, Routes } from 'react-router-dom';

import { AdminShell } from './components/AdminShell';
import { AuditPage } from './pages/AuditPage';
import { AccountDeletionPage } from './pages/AccountDeletionPage';
import { DashboardPage } from './pages/DashboardPage';
import { LedgersPage } from './pages/LedgersPage';
import { SystemPage } from './pages/SystemPage';
import { UsersPage } from './pages/UsersPage';
import { LoginPage } from './pages/LoginPage';
import { useAuth } from './lib/useAuth';
import { LoadingState } from './components/AsyncState';

export function App() {
  const { token, bootstrapping } = useAuth();

  if (bootstrapping) {
    return (
      <main className="min-h-[100dvh] bg-slate-50 p-4">
        <LoadingState title="正在恢复后台登录态" />
      </main>
    );
  }

  if (!token) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route element={<AdminShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:userUuid/delete" element={<AccountDeletionPage />} />
        <Route path="ledgers" element={<LedgersPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="system" element={<SystemPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
