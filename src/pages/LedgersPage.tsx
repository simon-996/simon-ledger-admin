import { useMemo, useState } from 'react';

import { DataPanel } from '../components/DataPanel';
import { PageHeader } from '../components/PageHeader';
import { SearchField } from '../components/SearchField';
import { StatusPill } from '../components/StatusPill';
import { ledgers } from '../lib/mockData';
import type { SyncStatus } from '../lib/types';

const syncLabel: Record<SyncStatus, string> = {
  synced: '已同步',
  pending: '待同步',
  failed: '同步失败',
};

const syncTone: Record<SyncStatus, 'success' | 'warning' | 'danger'> = {
  synced: 'success',
  pending: 'warning',
  failed: 'danger',
};

export function LedgersPage() {
  const [query, setQuery] = useState('');
  const filteredLedgers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return ledgers;
    return ledgers.filter((ledger) => {
      return [ledger.name, ledger.owner, ledger.uuid].some((value) =>
        value.toLowerCase().includes(normalized),
      );
    });
  }, [query]);

  return (
    <>
      <PageHeader
        title="账本管理"
        description="客服排查的核心入口。这里优先看 owner、成员数、流水数、同步状态和更新时间。"
        action={
          <div className="w-full sm:w-80">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="搜索账本、owner 或 UUID"
            />
          </div>
        }
      />

      <DataPanel title="账本列表">
        {filteredLedgers.map((ledger) => (
          <article
            key={ledger.uuid}
            className="grid gap-4 px-5 py-4 xl:grid-cols-[1.2fr_0.7fr_1fr_auto] xl:items-center"
          >
            <div>
              <p className="font-medium text-ink-950">{ledger.name}</p>
              <p className="mt-1 font-mono text-xs text-slate-500">
                {ledger.uuid}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Owner</p>
              <p className="mt-1 text-sm text-ink-800">{ledger.owner}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-slate-500">成员</p>
                <p className="mt-1 font-mono text-sm text-ink-950">
                  {ledger.memberCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">参与人</p>
                <p className="mt-1 font-mono text-sm text-ink-950">
                  {ledger.personCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">流水</p>
                <p className="mt-1 font-mono text-sm text-ink-950">
                  {ledger.transactionCount}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 xl:block xl:text-right">
              <StatusPill tone={syncTone[ledger.status]}>
                {syncLabel[ledger.status]}
              </StatusPill>
              <p className="mt-0 font-mono text-xs text-slate-400 xl:mt-2">
                {ledger.updatedAt}
              </p>
            </div>
          </article>
        ))}
      </DataPanel>
    </>
  );
}
