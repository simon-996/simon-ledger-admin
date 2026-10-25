// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { LedgersPage } from './LedgersPage';
import { AuditPage } from './AuditPage';
import { DashboardPage } from './DashboardPage';

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify({ code: status === 200 ? 0 : 500001, message: status === 200 ? 'ok' : 'health unavailable', data }), { status, headers: { 'content-type': 'application/json' } });
}
function show(element: React.ReactNode) {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{element}</QueryClientProvider>);
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test.each(['ledgers', 'audit'] as const)('%s exposes the 51st record and a way back from an empty page', async (kind) => {
  let empty = false;
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    const page = Number(new URL(url).searchParams.get('page'));
    const record = kind === 'ledgers'
      ? { uuid: `ledger-${page}`, name: `账本第${page}页`, owner: 'owner', memberCount: 1, personCount: 1, transactionCount: 1, status: 'synced', updatedAt: '2026-10-25T10:00:00' }
      : { uuid: `audit-${page}`, actor: 'admin', action: `事件第${page}页`, target: '授权', targetUuid: 'user-51', targetAccount: 'target@example.test', previousValue: false, newValue: true, createdAt: '2026-10-25T10:00:00' };
    return Promise.resolve(response({ page, pageSize: 50, total: 51, records: empty && page === 2 ? [] : [record] }));
  }));
  show(kind === 'ledgers' ? <LedgersPage /> : <AuditPage />);
  const next = await screen.findByRole('button', { name: '下一页' });
  expect(screen.getByRole('button', { name: '上一页' }).hasAttribute('disabled')).toBe(true);
  fireEvent.click(next);
  await screen.findByText(kind === 'ledgers' ? '账本第2页' : '事件第2页');
  expect(screen.getByRole('button', { name: '下一页' }).hasAttribute('disabled')).toBe(true);
  if (kind === 'ledgers') {
    expect(screen.getByText('云端已保存')).toBeTruthy();
    expect(screen.queryByText('已同步')).toBeNull();
  } else {
    expect(screen.getByText(/target@example.test/)).toBeTruthy();
    expect(screen.getByText(/user-51/)).toBeTruthy();
    expect(screen.getByText('未授权 → 已授权')).toBeTruthy();
  }
  fireEvent.click(screen.getByRole('button', { name: '上一页' }));
  await screen.findByText(kind === 'ledgers' ? '账本第1页' : '事件第1页');
  await waitFor(() => expect(screen.getByRole('button', { name: '下一页' }).hasAttribute('disabled')).toBe(false));
  empty = true;
  fireEvent.click(screen.getByRole('button', { name: '下一页' }));
  await screen.findByText(kind === 'ledgers' ? '没有找到账本' : '暂无审计日志');
  expect(screen.getByRole('button', { name: '上一页' }).hasAttribute('disabled')).toBe(false);
});

test('dashboard exposes health loading and failure independently of summary data', async () => {
  let completeHealth: (value: Response) => void = () => {};
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    if (url.includes('/health')) return new Promise<Response>((resolve) => { completeHealth = resolve; });
    return Promise.resolve(response(url.includes('/dashboard') ? { userCount: 1, ledgerCount: 1, recentChangeCount: 0, disabledUserCount: 0 } : { records: [], total: 0 }));
  }));
  show(<DashboardPage />);
  await screen.findByText('运营总览');
  expect(screen.getByText('正在加载系统健康')).toBeTruthy();
  completeHealth(response(null, 500));
  await waitFor(() => expect(screen.getByText('系统健康加载失败')).toBeTruthy());
  expect(screen.getByText('health unavailable')).toBeTruthy();
});

test('ledger search resets pagination before displaying its new results', async () => {
  const requests: Array<{ page: number; keyword: string }> = [];
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    const params = new URL(url).searchParams;
    const page = Number(params.get('page'));
    const keyword = params.get('keyword') ?? '';
    requests.push({ page, keyword });
    return Promise.resolve(response({ page, pageSize: 50, total: 51, records: [{ uuid: `ledger-${page}`, name: `${keyword || '全部'}账本${page}`, owner: 'owner', memberCount: 1, personCount: 1, transactionCount: 1, status: 'cloud_saved', updatedAt: '2026-10-25T10:00:00' }] }));
  }));
  show(<LedgersPage />);
  fireEvent.click(await screen.findByRole('button', { name: '下一页' }));
  await screen.findByText('全部账本2');
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '家庭' } });
  await screen.findByText('家庭账本1');
  expect(requests[requests.length - 1]).toEqual({ page: 1, keyword: '家庭' });
});
