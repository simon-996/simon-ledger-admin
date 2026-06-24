import {
  BookOpen,
  CloudWarning,
  Users,
  WarningCircle,
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';

import { ErrorState, LoadingState } from '../components/AsyncState';
import { DataPanel } from '../components/DataPanel';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { StatusPill } from '../components/StatusPill';
import { adminGet } from '../lib/api';
import { formatDateTime } from '../lib/format';
import type {
  AdminAuditLogResp,
  AdminSystemHealthResp,
  DashboardSummary,
  PageResponse,
} from '../lib/types';

export function DashboardPage() {
  const dashboard = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminGet<DashboardSummary>('/api/admin/dashboard'),
  });
  const auditLogs = useQuery({
    queryKey: ['admin-audit-logs', 'dashboard'],
    queryFn: () =>
      adminGet<PageResponse<AdminAuditLogResp>>('/api/admin/audit-logs', {
        page: 1,
        pageSize: 5,
      }),
  });
  const health = useQuery({
    queryKey: ['admin-system-health', 'dashboard'],
    queryFn: () =>
      adminGet<AdminSystemHealthResp>('/api/admin/system/health'),
  });

  if (dashboard.isLoading) {
    return <LoadingState title="正在加载后台总览" />;
  }

  if (dashboard.isError) {
    return (
      <ErrorState
        title="总览加载失败"
        message={dashboard.error.message}
      />
    );
  }

  const summary = dashboard.data;
  if (!summary) {
    return <LoadingState title="正在加载后台总览" />;
  }

  return (
    <>
      <PageHeader
        title="运营总览"
        description="用户、账本、变更和系统健康汇总，用于快速判断后台需要优先排查的范围。"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="注册用户"
          value={String(summary.userCount)}
          helper="未软删除用户总数"
          icon={Users}
        />
        <MetricCard
          title="云端账本"
          value={String(summary.ledgerCount)}
          helper="未软删除账本总数"
          icon={BookOpen}
        />
        <MetricCard
          title="最近变更"
          value={String(summary.recentChangeCount)}
          helper="近 7 天变更日志"
          icon={CloudWarning}
        />
        <MetricCard
          title="禁用用户"
          value={String(summary.disabledUserCount)}
          helper="需要关注的账号状态"
          icon={WarningCircle}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <DataPanel title="最近审计事件">
          {auditLogs.isLoading && (
            <div className="px-5 py-4 text-sm text-slate-500">正在加载</div>
          )}
          {auditLogs.isError && (
            <div className="px-5 py-4 text-sm text-rose-600">
              {auditLogs.error.message}
            </div>
          )}
          {auditLogs.data?.records.map((log) => (
            <div
              key={log.uuid}
              className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <p className="text-sm font-medium text-ink-950">
                  {log.action}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {log.actor} · {log.target}
                </p>
              </div>
              <p className="font-mono text-xs text-slate-400">
                {formatDateTime(log.createdAt)}
              </p>
            </div>
          ))}
        </DataPanel>

        <DataPanel title="系统健康">
          {health.data?.items.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <div>
                <p className="text-sm font-medium text-ink-950">{item.name}</p>
                <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
              </div>
              <div className="text-right">
                <StatusPill
                  tone={item.status === 'healthy' ? 'success' : 'danger'}
                >
                  {item.status === 'healthy' ? '正常' : '异常'}
                </StatusPill>
                <p className="mt-2 font-mono text-xs text-slate-400">
                  {item.latency}
                </p>
              </div>
            </div>
          ))}
        </DataPanel>
      </div>
    </>
  );
}
