// @vitest-environment jsdom
import { QueryClient, QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, test, vi } from 'vitest';
import { AccountDeletionPage } from '../pages/AccountDeletionPage';
import { AuthProvider } from '../lib/AuthProvider';
import { adminGet, readAdminToken, saveAdminToken } from '../lib/api';
import { useAuth } from '../lib/useAuth';

function response(data: unknown, status = 200) { return new Response(JSON.stringify({ code: status === 200 ? 0 : 401001, message: status === 200 ? 'ok' : '未登录', data }), {status, headers:{'content-type':'application/json'}}); }
afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.localStorage.clear(); focusManager.setFocused(undefined); onlineManager.setOnline(true); });

test.each(['focus', 'reconnect'])('requires fresh confirmation when %s refresh changes a transfer into deletion', async (trigger) => {
  let revision = 1;
  const deletedRequests: unknown[] = [];
  const successor = { userUuid: 'successor', nickname: '成员', role: 'editor' };
  const fetch = vi.fn().mockImplementation((_url, init) => {
    if (init.method === 'DELETE') { deletedRequests.push(JSON.parse(init.body)); return Promise.resolve(response(null)); }
    const transfer = revision === 1;
    return Promise.resolve(response({ userUuid: 'target', nickname: '用户', account: 'target@example.test', fingerprint: `v${revision}`,
      ownedLedgers: [{ uuid:'ledger', name:'共享账本', deleted:false, action: transfer ? 'TRANSFER' : 'DELETE', memberCount: transfer ? 2 : 1, personCount:2, transactionCount:10, retainedMemberCount:transfer ? 1 : 0, deletedMemberCount:1, retainedPersonCount:transfer ? 2 : 0, deletedPersonCount:transfer ? 0 : 2, retainedTransactionCount:transfer ? 10 : 0, deletedTransactionCount:transfer ? 0 : 10, activeMembers: transfer ? [successor] : [], successors: transfer ? [successor] : [] }],
      joinedLedgers:[], summary:{ledgersToTransfer:transfer ? 1 : 0, ledgersToDelete:transfer ? 0 : 1, otherLedgers:0,peopleToKeep:transfer ? 2 : 0,peopleToDelete:transfer ? 0 : 2,transactionsToKeep:transfer ? 10 : 0,transactionsToDelete:transfer ? 0 : 10}
    }));
  });
  vi.stubGlobal('fetch', fetch);
  const client = new QueryClient({ defaultOptions:{queries:{retry:false},mutations:{retry:false}}});
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/users/target/delete']}><Routes><Route path='/users/:userUuid/delete' element={<AccountDeletionPage/>}/><Route path='/users' element={<p>done</p>}/></Routes></MemoryRouter></QueryClientProvider>);
  await screen.findByLabelText('接手人：共享账本');
  fireEvent.change(screen.getByLabelText('接手人：共享账本'), {target:{value:'successor'}});
  fireEvent.change(screen.getByLabelText('输入用户 UUID 确认'), {target:{value:'target'}});
  expect(screen.getByRole('button',{name:'永久删除云端账号'}).hasAttribute('disabled')).toBe(false);
  revision = 2;
  act(() => {
    if (trigger === 'focus') { focusManager.setFocused(false); focusManager.setFocused(true); }
    else { onlineManager.setOnline(false); onlineManager.setOnline(true); }
  });
  await screen.findByText('保留 0 条流水 · 删除 10 条流水');
  expect((screen.getByLabelText('输入用户 UUID 确认') as HTMLInputElement).value).toBe('');
  expect(screen.getByRole('button',{name:'永久删除云端账号'}).hasAttribute('disabled')).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'永久删除云端账号'}));
  expect(deletedRequests).toEqual([]);
});

function Probe() { const { token, bootstrapping } = useAuth(); return <><p>{bootstrapping ? 'loading' : token ? 'signed-in' : 'signed-out'}</p><button onClick={() => void adminGet('/api/admin/users').catch(() => {})}>load-users</button></>; }
test('clears authenticated UI and token after a later API 401', async () => {
  saveAdminToken({name:'simon-ledger',value:'expired-later'});
  const fetch = vi.fn().mockImplementation((url) => Promise.resolve(url.includes('/auth/me') ? response({uuid:'admin',account:'admin',nickname:'管理员',role:'super_admin',status:1}) : response(null,401)));
  vi.stubGlobal('fetch',fetch);
  const client = new QueryClient();
  client.setQueryData(['private-records'], ['sensitive']);
  render(<QueryClientProvider client={client}><AuthProvider><Probe/></AuthProvider></QueryClientProvider>);
  await screen.findByText('signed-in');
  fireEvent.click(screen.getByRole('button',{name:'load-users'}));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  await act(async () => { await Promise.resolve(); });
  expect(readAdminToken()).toBeNull();
  expect(client.getQueryData(['private-records'])).toBeUndefined();
  expect(screen.getByText('signed-out')).toBeTruthy();
});

import { UsersPage } from '../pages/UsersPage';
import { LoginPage } from '../pages/LoginPage';
import { AuthContext } from '../lib/auth-context';

test('preserves leading and trailing spaces in a valid login password', async () => {
  const login = vi.fn().mockResolvedValue(undefined);
  render(<AuthContext.Provider value={{ user:null, token:null, bootstrapping:false, login, logout:vi.fn() }}><LoginPage/></AuthContext.Provider>);
  fireEvent.change(screen.getByLabelText('账号'),{target:{value:'admin'}});
  fireEvent.change(screen.getByLabelText('密码'),{target:{value:' secret with spaces '}});
  fireEvent.click(screen.getByRole('button',{name:'登录'}));
  await waitFor(() => expect(login).toHaveBeenCalledWith('admin',' secret with spaces '));
});

test('keeps each grant pending and its error when another row succeeds', async () => {
  let failA: (r: Response) => void = () => {};
  let succeedB: (r: Response) => void = () => {};
  const fetch = vi.fn().mockImplementation((url, init) => {
    if (init.method === 'PUT') return new Promise<Response>(resolve => { if (url.includes('/user-a/')) failA=resolve; else succeedB=resolve; });
    return Promise.resolve(response({page:1,pageSize:20,total:2,records:['a','b'].map(suffix=>({uuid:`user-${suffix}`,nickname:`用户${suffix}`,account:`${suffix}@example.test`,status:1,aiBookkeepingEnabled:false,ledgerCount:0,joinedCount:0,createdAt:'2026-09-28T10:00:00',updatedAt:'2026-09-28T10:00:00'}))}));
  });
  vi.stubGlobal('fetch',fetch);
  render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter><UsersPage/></MemoryRouter></QueryClientProvider>);
  const buttons = await screen.findAllByRole('button',{name:'授权 AI 记账'});
  fireEvent.click(buttons[0]);
  await waitFor(() => expect(buttons[0].hasAttribute('disabled')).toBe(true));
  fireEvent.click(buttons[1]);
  await waitFor(() => expect(buttons[1].hasAttribute('disabled')).toBe(true));
  expect(buttons[0].hasAttribute('disabled')).toBe(true);
  await act(async () => { failA(new Response(JSON.stringify({code:500001,message:'A authorization failed'}),{status:500,headers:{'content-type':'application/json'}})); succeedB(response(null)); });
  await waitFor(() => expect(buttons[1].hasAttribute('disabled')).toBe(false));
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.getByText(/A authorization failed/)).toBeTruthy();
});
