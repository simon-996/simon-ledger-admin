import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { DataPanel } from '../components/DataPanel';
import { PageHeader } from '../components/PageHeader';
import { SearchField } from '../components/SearchField';
import { StatusPill } from '../components/StatusPill';
import { adminGet, adminRequest } from '../lib/api';
import { formatDateTime } from '../lib/format';
import { useDebouncedValue } from '../lib/useDebouncedValue';
import type { AdminUserRecordResp, PageResponse } from '../lib/types';

export function UsersPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const users = useQuery({
    queryKey: ['admin-users', debouncedQuery, page],
    queryFn: () =>
      adminGet<PageResponse<AdminUserRecordResp>>('/api/admin/users', {
        keyword: debouncedQuery,
        page,
        pageSize: 20,
      }),
  });
  const grant = useMutation({
    mutationFn: ({ uuid, enabled }: { uuid: string; enabled: boolean }) =>
      adminRequest<void>(`/api/admin/users/${encodeURIComponent(uuid)}/ai-bookkeeping-access`, {
        method: 'PUT',
        body: JSON.stringify({ enabled }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <>
      <PageHeader
        title="用户管理"
        description="搜索用户、管理 AI 记账授权，并预览关联数据后删除云端账号。"
        action={
          <div className="w-full sm:w-80">
            <SearchField
              value={query}
              onChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              placeholder="搜索昵称、账号或 UUID"
            />
          </div>
        }
      />

      {users.isLoading && <LoadingState title="正在加载用户列表" />}
      {users.isError && (
        <ErrorState title="用户加载失败" message={users.error.message} />
      )}
      {users.data?.records.length === 0 && (
        <EmptyState title="没有找到用户" message="换一个关键词再试。" />
      )}
      {users.data && users.data.records.length > 0 && (
        <DataPanel title={`用户列表 · ${users.data.total}`}>
          {users.data.records.map((user) => (
            <article
              key={user.uuid}
              className="grid gap-4 px-5 py-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto] lg:items-center"
            >
              <div>
                <p className="font-medium text-ink-950">{user.nickname}</p>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  {user.uuid}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">账号</p>
                <p className="mt-1 text-sm text-ink-800">{user.account}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 lg:block">
                <p className="text-sm text-slate-500">账本</p>
                <p className="mt-1 font-mono text-sm text-ink-800">
                  拥有 {user.ledgerCount} · 加入 {user.joinedCount}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 lg:block lg:text-right">
                <div>
                  <StatusPill tone={user.status === 1 ? 'success' : 'danger'}>
                    {user.status === 1 ? '正常' : '已禁用'}
                  </StatusPill>
                  <p className="mt-2 text-xs text-slate-500">
                    AI 记账：{user.aiBookkeepingEnabled ? '已授权' : '未授权'}
                  </p>
                  <p className="mt-0 font-mono text-xs text-slate-400 lg:mt-2">
                    {formatDateTime(user.updatedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={grant.isPending && grant.variables?.uuid === user.uuid}
                  onClick={() => grant.mutate({ uuid: user.uuid, enabled: !user.aiBookkeepingEnabled })}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink-800 transition hover:border-ledger-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 lg:mt-2"
                >
                  {user.aiBookkeepingEnabled ? '撤销 AI 记账授权' : '授权 AI 记账'}
                </button>
                {grant.isError && grant.variables?.uuid === user.uuid && (
                  <p role="alert" className="mt-1 text-xs text-rose-700">
                    授权更新失败：{grant.error.message}
                  </p>
                )}
                <Link
                  to={`/users/${encodeURIComponent(user.uuid)}/delete`}
                  aria-label={`删除${user.nickname}的云端账号`}
                  className="text-sm font-medium text-rose-700 underline-offset-4 hover:underline lg:mt-2 lg:inline-block"
                >
                  删除账号
                </Link>
              </div>
            </article>
          ))}
        </DataPanel>
      )}
      {users.data && users.data.total > users.data.pageSize && (
        <nav className="mt-4 flex items-center justify-between gap-3" aria-label="用户列表分页">
          <p className="text-sm text-slate-500">
            第 {users.data.page} 页 · 共 {Math.ceil(users.data.total / users.data.pageSize)} 页
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-ink-800 transition hover:border-slate-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              上一页
            </button>
            <button
              type="button"
              onClick={() => setPage((value) => value + 1)}
              disabled={page * users.data.pageSize >= users.data.total}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-ink-800 transition hover:border-slate-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        </nav>
      )}
    </>
  );
}
