import { BookOpen, CloudWarning, Users, WarningCircle } from '@phosphor-icons/react';

import { DataPanel } from '../components/DataPanel';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { StatusPill } from '../components/StatusPill';
import { auditLogs, ledgers, systemHealth, users } from '../lib/mockData';

export function DashboardPage() {
  const failedLedgers = ledgers.filter((ledger) => ledger.status === 'failed');
  const pendingLedgers = ledgers.filter((ledger) => ledger.status === 'pending');

  return (
    <>
      <PageHeader
        title="运营总览"
        description="先把用户、账本、同步风险和系统健康放在一个可扫读的视图里。当前数据是前端 mock，后续接入后台接口。"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="注册用户"
          value={String(users.length)}
          helper="含正常和禁用账号"
          icon={Users}
        />
        <MetricCard
          title="云端账本"
          value={String(ledgers.length)}
          helper="共享账本优先排查"
          icon={BookOpen}
        />
        <MetricCard
          title="待同步账本"
          value={String(pendingLedgers.length)}
          helper="本地已保存，等待上云"
          icon={CloudWarning}
        />
        <MetricCard
          title="同步失败"
          value={String(failedLedgers.length)}
          helper="需要客服或用户重试"
          icon={WarningCircle}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <DataPanel title="最近审计事件">
          {auditLogs.map((log) => (
            <div
              key={log.id}
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
                {log.createdAt}
              </p>
            </div>
          ))}
        </DataPanel>

        <DataPanel title="系统健康">
          {systemHealth.map((item) => (
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
                  tone={item.status === 'healthy' ? 'success' : 'warning'}
                >
                  {item.status === 'healthy' ? '正常' : '关注'}
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
