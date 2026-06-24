import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import {
  adminGet,
  adminPost,
  clearAdminToken,
  readAdminToken,
  saveAdminToken,
} from './api';
import { AuthContext } from './auth-context';
import type { AdminLoginResult, AdminToken, AdminUser } from './types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<AdminToken | null>(() => readAdminToken());
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadCurrentUser() {
      if (!token) {
        setBootstrapping(false);
        return;
      }
      try {
        const current = await adminGet<AdminUser>('/api/admin/auth/me');
        if (active) setUser(current);
      } catch {
        clearAdminToken();
        if (active) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) setBootstrapping(false);
      }
    }
    loadCurrentUser();
    return () => {
      active = false;
    };
  }, [token]);

  const login = useCallback(async (account: string, password: string) => {
    const result = await adminPost<AdminLoginResult>(
      '/api/admin/auth/login',
      {
        account,
        password,
      },
      {
        timeoutMs: 8000,
      },
    );
    const nextToken = {
      name: result.tokenName,
      value: result.tokenValue,
    };
    saveAdminToken(nextToken);
    setToken(nextToken);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminPost<void>('/api/admin/auth/logout');
    } finally {
      clearAdminToken();
      setToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, token, bootstrapping, login, logout }),
    [user, token, bootstrapping, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
