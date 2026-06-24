import { useQuery } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from '../components/AsyncState';
import { DataPanel } from '../components/DataPanel';
import { PageHeader } from '../components/PageHeader';
import { StatusPill } from '../components/StatusPill';
import { adminGet } from '../lib/api';
import { formatDateTime } from '../lib/format';
import type { AdminAuditLogResp, PageResponse } from '../lib/types';

export function AuditPage() {
  const auditLogs = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () =>
      adminGet<PageResponse<AdminAuditLogResp>>('/api/admin/audit-logs', {
        page: 1,
        pageSize: 50,
      }),
  });

  return (
    <>
      <PageHeader
        title="审计日志"
        description="后台登录、退出和后续管理操作都会记录在这里。"
      />

      {auditLogs.isLoading && <LoadingState title="正在加载审计日志" />}
      {auditLogs.isError && (
        <ErrorState title="审计日志加载失败" message={auditLogs.error.message} />
      )}
      {auditLogs.data?.records.length === 0 && (
        <EmptyState title="暂无审计日志" message="后台操作会出现在这里。" />
      )}
      {auditLogs.data && auditLogs.data.records.length > 0 && (
        <DataPanel title={`最近日志 · ${auditLogs.data.total}`}>
          {auditLogs.data.records.map((log) => (
            <article
              key={log.uuid}
              className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_0.8fr_auto] md:items-center"
            >
              <div>
                <p className="text-sm font-medium text-ink-950">
                  {log.action}
                </p>
                <p className="mt-1 text-sm text-slate-500">{log.target}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">执行者</p>
                <p className="mt-1 font-mono text-xs text-ink-800">
                  {log.actor}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 md:block md:text-right">
                <StatusPill tone="neutral">记录</StatusPill>
                <p className="mt-0 font-mono text-xs text-slate-400 md:mt-2">
                  {formatDateTime(log.createdAt)}
                </p>
              </div>
            </article>
          ))}
        </DataPanel>
      )}
    </>
  );
}
