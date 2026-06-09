export type RecordStatus = 'active' | 'disabled';

export type SyncStatus = 'synced' | 'pending' | 'failed';

export type HealthStatus = 'healthy' | 'warning' | 'down';

export type AuditLevel = 'info' | 'warning' | 'danger';

export type UserRecord = {
  uuid: string;
  nickname: string;
  account: string;
  status: RecordStatus;
  ledgerCount: number;
  joinedCount: number;
  createdAt: string;
  lastSeenAt: string;
};

export type LedgerRecord = {
  uuid: string;
  name: string;
  owner: string;
  memberCount: number;
  personCount: number;
  transactionCount: number;
  status: SyncStatus;
  updatedAt: string;
};

export type AuditLog = {
  id: string;
  actor: string;
  action: string;
  target: string;
  level: AuditLevel;
  createdAt: string;
};

export type SystemHealthItem = {
  name: string;
  status: HealthStatus;
  latency: string;
  detail: string;
};
