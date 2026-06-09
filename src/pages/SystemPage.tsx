import { DataPanel } from '../components/DataPanel';
import { PageHeader } from '../components/PageHeader';
import { StatusPill } from '../components/StatusPill';
import { apiBaseUrl } from '../lib/api';
import { systemHealth } from '../lib/mockData';

export function SystemPage() {
  return (
    <>
      <PageHeader
        title="系统状态"
        description="用于确认后台 API、数据库、Redis 和版本信息。当前页面先预留健康检查结构。"
      />

      <div className="mb-5 rounded-[1.4rem] border border-slate-200/80 bg-white p-5 shadow-soft">
        <p className="text-sm text-slate-500">API 地址</p>
        <p className="mt-2 break-all font-mono text-sm text-ink-950">
          {apiBaseUrl}
        </p>
      </div>

      <DataPanel title="服务健康">
        {systemHealth.map((item) => (
          <article
            key={item.name}
            className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
          >
            <div>
              <p className="font-medium text-ink-950">{item.name}</p>
              <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
            </div>
            <p className="font-mono text-sm text-slate-500">{item.latency}</p>
            <StatusPill
              tone={item.status === 'healthy' ? 'success' : 'warning'}
            >
              {item.status === 'healthy' ? '正常' : '关注'}
            </StatusPill>
          </article>
        ))}
      </DataPanel>
    </>
  );
}
