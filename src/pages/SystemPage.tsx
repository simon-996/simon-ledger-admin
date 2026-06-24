import { useQuery } from '@tanstack/react-query';

import { ErrorState, LoadingState } from '../components/AsyncState';
import { DataPanel } from '../components/DataPanel';
import { PageHeader } from '../components/PageHeader';
import { StatusPill } from '../components/StatusPill';
import { adminGet, apiBaseUrl } from '../lib/api';
import type { AdminSystemHealthResp } from '../lib/types';

export function SystemPage() {
  const health = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: () =>
      adminGet<AdminSystemHealthResp>('/api/admin/system/health'),
  });

  return (
    <>
      <PageHeader
        title="系统状态"
        description="用于确认后台 API、数据库、Redis 和版本信息。"
      />

      <div className="mb-5 rounded-[1.4rem] border border-slate-200/80 bg-white p-5 shadow-soft">
        <p className="text-sm text-slate-500">API 地址</p>
        <p className="mt-2 break-all font-mono text-sm text-ink-950">
          {apiBaseUrl}
        </p>
      </div>

      {health.isLoading && <LoadingState title="正在检查系统状态" />}
      {health.isError && (
        <ErrorState title="系统状态加载失败" message={health.error.message} />
      )}
      {health.data && (
        <DataPanel title="服务健康">
          {health.data.items.map((item) => (
            <article
              key={item.name}
              className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
            >
              <div>
                <p className="font-medium text-ink-950">{item.name}</p>
                <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
              </div>
              <p className="font-mono text-sm text-slate-500">
                {item.latency}
              </p>
              <StatusPill
                tone={item.status === 'healthy' ? 'success' : 'danger'}
              >
                {item.status === 'healthy' ? '正常' : '异常'}
              </StatusPill>
            </article>
          ))}
        </DataPanel>
      )}
    </>
  );
}
