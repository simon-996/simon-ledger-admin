import type {
  AuditLog,
  LedgerRecord,
  SystemHealthItem,
  UserRecord,
} from './types';

export const users: UserRecord[] = [
  {
    uuid: 'u_8c0a91f4',
    nickname: '林知远',
    account: 'linzy@example.com',
    status: 'active',
    ledgerCount: 7,
    joinedCount: 4,
    createdAt: '2026-05-08 18:42',
    lastSeenAt: '2026-06-09 15:18',
  },
  {
    uuid: 'u_29bc6e10',
    nickname: '许清禾',
    account: 'qinghe@example.com',
    status: 'active',
    ledgerCount: 3,
    joinedCount: 9,
    createdAt: '2026-05-16 09:11',
    lastSeenAt: '2026-06-09 14:03',
  },
  {
    uuid: 'u_b512aa77',
    nickname: '周维宁',
    account: 'zhouwn@example.com',
    status: 'disabled',
    ledgerCount: 1,
    joinedCount: 0,
    createdAt: '2026-04-27 21:35',
    lastSeenAt: '2026-05-30 20:46',
  },
];

export const ledgers: LedgerRecord[] = [
  {
    uuid: 'f4a8c97b1f22416c96800e04a4d1d3aa',
    name: '东京六月旅行',
    owner: '林知远',
    memberCount: 4,
    personCount: 6,
    transactionCount: 187,
    status: 'synced',
    updatedAt: '2026-06-09 15:22',
  },
  {
    uuid: 'c06ec49ec9b44eb2a2805f96424a71d2',
    name: '家庭日常账本',
    owner: '许清禾',
    memberCount: 3,
    personCount: 5,
    transactionCount: 436,
    status: 'pending',
    updatedAt: '2026-06-09 12:17',
  },
  {
    uuid: 'b79eb9062dc1436d8d62c9ef53d8448b',
    name: '办公室午餐',
    owner: '沈洛',
    memberCount: 8,
    personCount: 10,
    transactionCount: 92,
    status: 'failed',
    updatedAt: '2026-06-08 19:51',
  },
];

export const auditLogs: AuditLog[] = [
  {
    id: 'log_3941',
    actor: 'support@ledger',
    action: '禁用过期邀请码',
    target: '东京六月旅行',
    level: 'info',
    createdAt: '2026-06-09 15:41',
  },
  {
    id: 'log_3940',
    actor: 'system',
    action: '同步冲突告警',
    target: '办公室午餐',
    level: 'warning',
    createdAt: '2026-06-09 15:08',
  },
  {
    id: 'log_3939',
    actor: 'support@ledger',
    action: '查看用户账本',
    target: '许清禾',
    level: 'info',
    createdAt: '2026-06-09 14:12',
  },
];

export const systemHealth: SystemHealthItem[] = [
  {
    name: 'API 服务',
    status: 'healthy',
    latency: '48 ms',
    detail: '版本 0.0.1-SNAPSHOT',
  },
  {
    name: 'MySQL',
    status: 'healthy',
    latency: '17 ms',
    detail: '连接池正常',
  },
  {
    name: 'Redis',
    status: 'warning',
    latency: '91 ms',
    detail: '延迟略高，建议观察',
  },
];
