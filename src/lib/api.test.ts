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
