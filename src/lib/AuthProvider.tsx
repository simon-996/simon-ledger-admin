import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import {
  ApiError,
  adminGet,
  adminPost,
  clearAdminToken,
  readAdminToken,
  saveAdminToken,
  sessionExpiredEvent,
} from './api';
import { AuthContext } from './auth-context';
import type { AdminLoginResult, AdminToken, AdminUser } from './types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<AdminToken | null>(() => readAdminToken());
  const [bootstrapping, setBootstrapping] = useState(true);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  useEffect(() => {
    const expire = () => {
      void queryClient.cancelQueries();
      queryClient.clear();
      setUser(null);
      setToken(null);
      setBootstrapping(false);
      setSessionMessage('登录已失效，请重新登录');
    };
    window.addEventListener(sessionExpiredEvent, expire);
    return () => window.removeEventListener(sessionExpiredEvent, expire);
  }, [queryClient]);

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
      } catch (error) {
        if (active && error instanceof ApiError && error.status === 403
          && readAdminToken()?.value === token?.value) {
          clearAdminToken();
          void queryClient.cancelQueries();
          queryClient.clear();
          setToken(null);
          setUser(null);
          setSessionMessage('管理员权限已失效，请重新登录');
        }
      } finally {
        if (active) setBootstrapping(false);
      }
    }
    loadCurrentUser();
    return () => {
      active = false;
    };
  }, [token, queryClient]);

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
    queryClient.clear();
    saveAdminToken(nextToken);
    setSessionMessage(null);
    setToken(nextToken);
    setUser(result.user);
  }, [queryClient]);

  const logout = useCallback(async () => {
    const request = adminPost<void>('/api/admin/auth/logout');
    clearAdminToken();
    void queryClient.cancelQueries();
    queryClient.clear();
    setToken(null);
    setUser(null);
    setSessionMessage(null);
    // Local logout takes effect immediately, including while the server is offline.
    await request.catch(() => {});
  }, [queryClient]);

  const value = useMemo(
    () => ({ user, token, bootstrapping, login, logout, sessionMessage }),
    [user, token, bootstrapping, login, logout, sessionMessage],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
