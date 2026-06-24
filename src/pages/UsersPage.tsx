import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { DataPanel } from '../components/DataPanel';
import { PageHeader } from '../components/PageHeader';
import { SearchField } from '../components/SearchField';
import { StatusPill } from '../components/StatusPill';
import { adminGet } from '../lib/api';
import { formatDateTime } from '../lib/format';
import { useDebouncedValue } from '../lib/useDebouncedValue';
import type { AdminUserRecordResp, PageResponse } from '../lib/types';

export function UsersPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const users = useQuery({
    queryKey: ['admin-users', debouncedQuery],
    queryFn: () =>
      adminGet<PageResponse<AdminUserRecordResp>>('/api/admin/users', {
        keyword: debouncedQuery,
        page: 1,
        pageSize: 50,
      }),
  });

  return (
    <>
      <PageHeader
        title="用户管理"
        description="搜索用户、检查账号状态和定位用户关联的账本。初版以查看为主。"
        action={
          <div className="w-full sm:w-80">
            <SearchField
              value={query}
              onChange={setQuery}
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
                <StatusPill tone={user.status === 1 ? 'success' : 'danger'}>
                  {user.status === 1 ? '正常' : '已禁用'}
                </StatusPill>
                <p className="mt-0 font-mono text-xs text-slate-400 lg:mt-2">
                  {formatDateTime(user.updatedAt)}
                </p>
              </div>
            </article>
          ))}
        </DataPanel>
      )}
    </>
  );
}
