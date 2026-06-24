import { createContext } from 'react';

import type { AdminToken, AdminUser } from './types';

export type AuthContextValue = {
  user: AdminUser | null;
  token: AdminToken | null;
  bootstrapping: boolean;
  login: (account: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
