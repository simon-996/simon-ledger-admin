// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, test, vi } from 'vitest';

import { AccountDeletionPage } from './AccountDeletionPage';

const preview = {
  userUuid: 'target-user', nickname: '待删除用户', account: 'target@example.test',
  fingerprint: 'preview-fingerprint',
  ownedLedgers: [
    {
      uuid: 'shared-ledger', name: '家庭账本', deleted: false,
      memberCount: 3, personCount: 3, transactionCount: 8,
      successors: [
        { userUuid: 'next-owner', nickname: '接手成员', role: 'editor' },
        { userUuid: 'other-owner', nickname: '其他成员', role: 'viewer' },
      ],
    },
    {
      uuid: 'solo-ledger', name: '个人账本', deleted: false,
      memberCount: 1, personCount: 1, transactionCount: 2, successors: [],
    },
  ],
  joinedLedgers: [{
    uuid: 'joined-ledger', name: '他人账本', deleted: false,
    memberCount: 4, personCount: 4, transactionCount: 12,
  }],
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(<QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={['/users/target-user/delete']}>
      <Routes>
        <Route path="/users/:userUuid/delete" element={<AccountDeletionPage />} />
        <Route path="/users" element={<p>返回用户列表</p>} />
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('requires an explicit successor and UUID confirmation before deleting', async () => {
  const requests: Array<{ method: string; body?: string }> = [];
  vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, init: RequestInit) => {
    requests.push({ method: init.method ?? 'GET', body: init.body?.toString() });
    return Promise.resolve(new Response(JSON.stringify({
      code: 0, message: 'ok', data: init.method === 'DELETE' ? { deleted: true } : preview,
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
  }));

  renderPage();
  const submit = await screen.findByRole('button', { name: '永久删除云端账号' });
  expect(submit.hasAttribute('disabled')).toBe(true);
  fireEvent.change(screen.getByLabelText('接手人：家庭账本'), { target: { value: 'next-owner' } });
  fireEvent.change(screen.getByLabelText('输入用户 UUID 确认'), { target: { value: 'target-user' } });
  expect(submit.hasAttribute('disabled')).toBe(false);
  fireEvent.click(submit);

  await waitFor(() => expect(screen.getByText('返回用户列表')).toBeTruthy());
  const deletion = requests.find((request) => request.method === 'DELETE');
  expect(JSON.parse(deletion?.body ?? '{}')).toEqual({
    fingerprint: 'preview-fingerprint', confirmUuid: 'target-user',
    successors: [{ ledgerUuid: 'shared-ledger', userUuid: 'next-owner' }],
  });
});

test('keeps selected successors visible after a stale-preview conflict', async () => {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, init: RequestInit) => {
    const conflict = init.method === 'DELETE';
    return Promise.resolve(new Response(JSON.stringify({
      code: conflict ? 409001 : 0,
      message: conflict ? '预览已过期' : 'ok',
      data: conflict ? null : preview,
    }), { status: conflict ? 409 : 200, headers: { 'content-type': 'application/json' } }));
  }));

  renderPage();
  await screen.findByRole('button', { name: '永久删除云端账号' });
  fireEvent.change(screen.getByLabelText('接手人：家庭账本'), { target: { value: 'next-owner' } });
  fireEvent.change(screen.getByLabelText('输入用户 UUID 确认'), { target: { value: 'target-user' } });
  fireEvent.click(screen.getByRole('button', { name: '永久删除云端账号' }));

  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('预览已过期'));
  expect((screen.getByLabelText('接手人：家庭账本') as HTMLSelectElement).value).toBe('next-owner');
  expect((screen.getByLabelText('输入用户 UUID 确认') as HTMLInputElement).value).toBe('target-user');
});
