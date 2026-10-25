import type { AdminAuditLogResp } from '../lib/types';

export function AuditTarget({ log }: { log: AdminAuditLogResp }) {
  return <div className="mt-1 break-all text-sm text-slate-500">
    <p>{log.target}</p>
    {(log.targetUuid || log.targetAccount) && <p className="mt-1">目标：{[log.targetAccount, log.targetUuid].filter(Boolean).join(' · ')}</p>}
    {typeof log.previousValue === 'boolean' && typeof log.newValue === 'boolean' && <p className="mt-1">{log.previousValue ? '已授权' : '未授权'} → {log.newValue ? '已授权' : '未授权'}</p>}
  </div>;
}
