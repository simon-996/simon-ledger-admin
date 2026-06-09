import { useMemo, useState } from 'react';

import { DataPanel } from '../components/DataPanel';
import { PageHeader } from '../components/PageHeader';
import { SearchField } from '../components/SearchField';
import { StatusPill } from '../components/StatusPill';
import { users } from '../lib/mockData';

export function UsersPage() {
  const [query, setQuery] = useState('');
  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter((user) => {
      return [user.nickname, user.account, user.uuid].some((value) =>
        value.toLowerCase().includes(normalized),
      );
    });
  }, [query]);

  return (
    <>
      <PageHeader
        title="用户管理"
        description="用于搜索用户、检查账号状态和定位用户关联的账本。初版建议以查看为主，禁用和恢复操作接入后台审计后再开放。"
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

      <DataPanel title="用户列表">
        {filteredUsers.map((user) => (
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
              <StatusPill tone={user.status === 'active' ? 'success' : 'danger'}>
                {user.status === 'active' ? '正常' : '已禁用'}
              </StatusPill>
              <p className="mt-0 font-mono text-xs text-slate-400 lg:mt-2">
                {user.lastSeenAt}
              </p>
            </div>
          </article>
        ))}
      </DataPanel>
    </>
  );
}
