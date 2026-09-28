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
  fireEvent.click(screen.getByRole('button', { name: '下一页' }));
  await waitFor(() => expect(screen.getByText('第二位用户')).toBeTruthy());
  expect(requestedPages).toEqual(['1', '2']);
});
