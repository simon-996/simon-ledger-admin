// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';

import * as api from './api';

type DeleteRequest = <T>(path: string, data: unknown) => Promise<T>;

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

test('sends account deletion as an authenticated JSON DELETE request', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(
    JSON.stringify({ code: 0, message: 'ok', data: { deleted: true } }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  ));
  vi.stubGlobal('fetch', fetch);
  api.saveAdminToken({ name: 'simon-ledger', value: 'admin-token' });
  const adminDelete = (api as unknown as { adminDelete: DeleteRequest }).adminDelete;
  expect(adminDelete).toBeTypeOf('function');

  const data = await adminDelete<{ deleted: boolean }>('/api/admin/users/user-uuid', {
    fingerprint: 'fingerprint', successors: [], confirmUuid: 'user-uuid',
  });

  expect(data.deleted).toBe(true);
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining('/api/admin/users/user-uuid'),
    expect.objectContaining({
      method: 'DELETE',
      body: JSON.stringify({ fingerprint: 'fingerprint', successors: [], confirmUuid: 'user-uuid' }),
      headers: expect.any(Headers),
    }),
  );
  const headers = fetch.mock.calls[0][1].headers as Headers;
  expect(headers.get('simon-ledger')).toBe('admin-token');
});

test('surfaces a stale deletion preview as a conflict', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
    JSON.stringify({ code: 409001, message: '预览已过期', data: null }),
    { status: 409, headers: { 'content-type': 'application/json' } },
  )));
  const adminDelete = (api as unknown as { adminDelete: DeleteRequest }).adminDelete;
  expect(adminDelete).toBeTypeOf('function');

  await expect(adminDelete('/api/admin/users/user-uuid', {
    fingerprint: 'stale', successors: [], confirmUuid: 'user-uuid',
  })).rejects.toMatchObject({ status: 409, code: 409001, message: '预览已过期' });
});

test.each(['GET', 'PUT'])('rejects an old session %s result after switching accounts', async (method) => {
  let finish: (value: Response) => void = () => {};
  vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise<Response>((resolve) => { finish = resolve; })));
  api.saveAdminToken({ name: 'simon-ledger', value: 'old' });
  const result = api.adminRequest('/api/admin/users', { method });
  api.clearAdminToken();
  api.saveAdminToken({ name: 'simon-ledger', value: 'new' });
  finish(new Response(JSON.stringify({ code: 0, data: { private: 'old user' } }), { status: 200, headers: { 'content-type': 'application/json' } }));
  await expect(result).rejects.toMatchObject({ message: '登录会话已变更，请重新操作' });
  expect(api.readAdminToken()?.value).toBe('new');
});

test('does not expire a newer session for an old request 401', async () => {
  let finish: (value: Response) => void = () => {};
  vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise<Response>((resolve) => { finish = resolve; })));
  api.saveAdminToken({ name: 'simon-ledger', value: 'old' });
  const result = api.adminGet('/api/admin/users');
  api.saveAdminToken({ name: 'simon-ledger', value: 'new' });
  finish(new Response('', { status: 401 }));
  await expect(result).rejects.toBeInstanceOf(api.ApiError);
  expect(api.readAdminToken()?.value).toBe('new');
});

test('keeps a valid session for a business permission rejection', async () => {
  api.saveAdminToken({ name: 'simon-ledger', value: 'current' });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 403001, message: '没有此操作权限' }), { status: 403, headers: { 'content-type': 'application/json' } })));
  await expect(api.adminGet('/api/admin/users')).rejects.toMatchObject({ status: 403 });
  expect(api.readAdminToken()?.value).toBe('current');
});
