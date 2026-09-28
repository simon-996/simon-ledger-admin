export type HealthStatus = 'healthy' | 'warning' | 'down';

export type SystemHealthItem = {
  name: string;
  status: HealthStatus;
  latency: string;
  detail: string;
};

export type AdminUser = {
  uuid: string;
  account: string;
  nickname: string;
  role: string;
  status: number;
};

export type AdminToken = {
  name: string;
  value: string;
};

export type AdminLoginResult = {
  tokenName: string;
  tokenValue: string;
  user: AdminUser;
};

export type DashboardSummary = {
  userCount: number;
  ledgerCount: number;
  disabledUserCount: number;
  recentChangeCount: number;
};

export type AdminUserRecordResp = {
  uuid: string;
  nickname: string;
  account: string;
  status: number;
  ledgerCount: number;
  joinedCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminLedgerRecordResp = {
  uuid: string;
  name: string;
  owner: string;
  ownerUserUuid?: string | null;
  memberCount: number;
  personCount: number;
  transactionCount: number;
  status: string;
  updatedAt: string;
};

export type AdminAuditLogResp = {
  uuid: string;
  actor: string;
  action: string;
  target: string;
  level: string;
  createdAt: string;
};

export type AdminSystemHealthResp = {
  items: SystemHealthItem[];
};

export type PageResponse<T> = {
  page: number;
  pageSize: number;
  total: number;
  records: T[];
};
