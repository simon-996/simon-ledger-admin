// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { AuthProvider } from './AuthProvider';
import { readAdminToken, saveAdminToken } from './api';
import { useAuth } from './useAuth';

function AuthProbe() {
  const { token, bootstrapping, logout } = useAuth();
  return <>
    <span>{bootstrapping ? 'loading' : token ? 'signed-in' : 'signed-out'}</span>
    <button onClick={() => void logout()}>logout</button>
  </>;
}

function renderAuth(client = new QueryClient()) {
  return render(<QueryClientProvider client={client}>
    <AuthProvider><AuthProbe /></AuthProvider>
  </QueryClientProvider>);
}

beforeEach(() => {
  window.localStorage.clear();
  saveAdminToken({ name: 'simon-ledger', value: 'saved-token' });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

test('keeps the saved admin session when restoring it hits a network error', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

  renderAuth();

  await waitFor(() => expect(screen.getByText('signed-in')).toBeTruthy());
  expect(readAdminToken()?.value).toBe('saved-token');
});

test('clears the saved admin session when the server rejects it', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
    JSON.stringify({ code: 401, message: '未登录', data: null }),
    { status: 401, headers: { 'content-type': 'application/json' } },
  )));

  renderAuth();

  await waitFor(() => expect(screen.getByText('signed-out')).toBeTruthy());
  expect(readAdminToken()).toBeNull();
});

test('clears cached admin data on logout', async () => {
  const client = new QueryClient();
  client.setQueryData(['admin-users'], [{ account: 'private@example.test' }]);
  vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response(
    JSON.stringify({ code: 0, message: 'ok', data: {
      uuid: 'admin-uuid', account: 'admin', nickname: '管理员', role: 'super_admin', status: 1,
    } }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  ))));

  renderAuth(client);
  await waitFor(() => expect(screen.getByText('signed-in')).toBeTruthy());
  fireEvent.click(screen.getByText('logout'));

  await waitFor(() => expect(screen.getByText('signed-out')).toBeTruthy());
  expect(client.getQueryData(['admin-users'])).toBeUndefined();
});
