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
import type { AdminLedgerRecordResp, PageResponse } from '../lib/types';

type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

const ledgerStatusMeta: Record<string, { label: string; tone: StatusTone }> = {
  synced: { label: '已同步', tone: 'success' },
  pending: { label: '同步中', tone: 'warning' },
  failed: { label: '同步异常', tone: 'danger' },
};

function ledgerStatus(status: string) {
  return ledgerStatusMeta[status] ?? { label: status || '未知', tone: 'neutral' };
}

export function LedgersPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 300);
  const ledgers = useQuery({
    queryKey: ['admin-ledgers', debouncedQuery],
    queryFn: () =>
      adminGet<PageResponse<AdminLedgerRecordResp>>('/api/admin/ledgers', {
        keyword: debouncedQuery,
        page: 1,
        pageSize: 50,
      }),
  });

  return (
    <>
      <PageHeader
        title="账本管理"
        description="客服排查的核心入口。优先看 owner、成员数、流水数、同步状态和更新时间。"
        action={
          <div className="w-full sm:w-80">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="搜索账本或 UUID"
            />
          </div>
        }
      />

      {ledgers.isLoading && <LoadingState title="正在加载账本列表" />}
      {ledgers.isError && (
        <ErrorState title="账本加载失败" message={ledgers.error.message} />
      )}
      {ledgers.data?.records.length === 0 && (
        <EmptyState title="没有找到账本" message="换一个关键词再试。" />
      )}
      {ledgers.data && ledgers.data.records.length > 0 && (
        <DataPanel title={`账本列表 · ${ledgers.data.total}`}>
          {ledgers.data.records.map((ledger) => {
            const status = ledgerStatus(ledger.status);
            return (
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
                  <StatusPill tone={status.tone}>{status.label}</StatusPill>
                  <p className="mt-0 font-mono text-xs text-slate-400 xl:mt-2">
                    {formatDateTime(ledger.updatedAt)}
                  </p>
                </div>
              </article>
            );
          })}
        </DataPanel>
      )}
    </>
  );
}
