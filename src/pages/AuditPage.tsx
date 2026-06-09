import { DataPanel } from '../components/DataPanel';
import { PageHeader } from '../components/PageHeader';
import { StatusPill } from '../components/StatusPill';
import { auditLogs } from '../lib/mockData';

export function AuditPage() {
  return (
    <>
      <PageHeader
        title="审计日志"
        description="后台操作、账本变更和同步异常都应该能追溯。后续可按账本 UUID、管理员、实体类型和时间范围过滤。"
      />

      <DataPanel title="最近日志">
        {auditLogs.map((log) => (
          <article
            key={log.id}
            className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_0.8fr_auto] md:items-center"
          >
            <div>
              <p className="text-sm font-medium text-ink-950">{log.action}</p>
              <p className="mt-1 text-sm text-slate-500">{log.target}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">执行者</p>
              <p className="mt-1 font-mono text-xs text-ink-800">
                {log.actor}
              </p>
            </div>
            <div className="flex items-center justify-between gap-4 md:block md:text-right">
              <StatusPill tone={log.level === 'warning' ? 'warning' : 'neutral'}>
                {log.level === 'warning' ? '关注' : '记录'}
              </StatusPill>
              <p className="mt-0 font-mono text-xs text-slate-400 md:mt-2">
                {log.createdAt}
              </p>
            </div>
          </article>
        ))}
      </DataPanel>
    </>
  );
}
