// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, test, vi } from 'vitest';

import { UsersPage } from './UsersPage';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('grants AI bookkeeping access only after a successful server update', async () => {
  const requests: Array<{ url: string; method: string; body?: string }> = [];
  let enabled = false;
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, options?: RequestInit) => {
    const method = options?.method ?? 'GET';
    requests.push({ url, method, body: options?.body as string | undefined });
    if (method === 'PUT') {
      enabled = JSON.parse(options?.body as string).enabled as boolean;
      return Promise.resolve(new Response(JSON.stringify({ code: 0, message: 'ok' }), { status: 200, headers: { 'content-type': 'application/json' } }));
    }
    return Promise.resolve(new Response(JSON.stringify({
      code: 0, message: 'ok',
      data: { page: 1, pageSize: 20, total: 1, records: [{
        uuid: 'user-1', nickname: '测试用户', account: 'user@example.test', status: 1,
        aiBookkeepingEnabled: enabled, ledgerCount: 0, joinedCount: 0,
        createdAt: '2026-09-28T10:00:00', updatedAt: '2026-09-28T10:00:00',
      }] },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
  }));

  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter><UsersPage /></MemoryRouter>
  </QueryClientProvider>);

  fireEvent.click(await screen.findByRole('button', { name: '授权 AI 记账' }));
  await waitFor(() => expect(screen.getByRole('button', { name: '撤销 AI 记账授权' })).toBeTruthy());
  expect(requests.some((request) => request.method === 'PUT'
    && request.url.endsWith('/api/admin/users/user-1/ai-bookkeeping-access')
    && request.body === '{"enabled":true}')).toBe(true);
});

test('keeps the previous grant state visible when revocation fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, options?: RequestInit) => {
    if (options?.method === 'PUT') {
      return Promise.resolve(new Response(JSON.stringify({ code: 500001, message: '暂时无法修改' }),
        { status: 500, headers: { 'content-type': 'application/json' } }));
    }
    return Promise.resolve(new Response(JSON.stringify({ code: 0, message: 'ok', data: {
      page: 1, pageSize: 20, total: 1, records: [{
        uuid: 'user-2', nickname: '测试用户二', account: 'user2@example.test', status: 1,
        aiBookkeepingEnabled: true, ledgerCount: 1, joinedCount: 0,
        createdAt: '2026-09-28T10:00:00', updatedAt: '2026-09-28T10:00:00',
      }],
    } }), { status: 200, headers: { 'content-type': 'application/json' } }));
  }));
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter><UsersPage /></MemoryRouter>
  </QueryClientProvider>);
  fireEvent.click(await screen.findByRole('button', { name: '撤销 AI 记账授权' }));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('暂时无法修改'));
  expect(screen.getByRole('button', { name: '撤销 AI 记账授权' })).toBeTruthy();
  expect(screen.getByText('AI 记账：已授权')).toBeTruthy();
});

test('moves from the first server page to the next user page', async () => {
  const requestedPages: string[] = [];
  vi.stubGlobal('fetch', vi.fn().mockImplementation((rawUrl: string) => {
    const page = new URL(rawUrl).searchParams.get('page') ?? '1';
    requestedPages.push(page);
    return Promise.resolve(new Response(JSON.stringify({
      code: 0,
      message: 'ok',
      data: {
        page: Number(page), pageSize: 1, total: 2,
        records: [{
          uuid: `user-${page}`, nickname: page === '1' ? '第一位用户' : '第二位用户',
          account: `user${page}@example.test`, status: 1, ledgerCount: 0,
          joinedCount: 0, createdAt: '2026-09-28T10:00:00', updatedAt: '2026-09-28T10:00:00',
        }],
      },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
  }));

  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter><UsersPage /></MemoryRouter>
  </QueryClientProvider>);

  await waitFor(() => expect(screen.getByText('第一位用户')).toBeTruthy());
  expect(screen.getByRole('link', { name: '删除第一位用户的云端账号' }).getAttribute('href'))
    .toBe('/users/user-1/delete');
  fireEvent.click(screen.getByRole('button', { name: '下一页' }));
  await waitFor(() => expect(screen.getByText('第二位用户')).toBeTruthy());
  expect(requestedPages).toEqual(['1', '2']);
});
