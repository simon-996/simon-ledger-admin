# Simon Ledger Admin

Simon Ledger 的后台管理 Web。第一版定位为运维、客服和数据核查控制台，优先提供只读排查能力和少量止损操作，避免直接破坏用户账本数据。

## 技术栈

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- TanStack Table
- Recharts
- zod
- Phosphor Icons

## 当前页面

- 总览：用户、账本、待同步、同步失败和系统健康摘要。
- 用户：按昵称、账号、UUID 搜索用户，查看账号状态和账本数量。
- 账本：按账本名、owner、UUID 搜索账本，查看成员、参与人、流水和同步状态。
- 审计：查看后台操作和同步异常日志。
- 系统：查看 API 地址、服务健康、数据库和 Redis 状态。

当前数据是前端 mock，页面结构和 API 客户端入口已预留。后续接入后端时优先使用 `/api/admin/*` 独立接口，避免复用普通 App 用户权限。

## 推荐后台接口

```text
POST /api/admin/auth/login
POST /api/admin/auth/logout
GET  /api/admin/auth/me

GET  /api/admin/users
GET  /api/admin/users/{userUuid}
PUT  /api/admin/users/{userUuid}/status

GET  /api/admin/ledgers
GET  /api/admin/ledgers/{ledgerUuid}
GET  /api/admin/ledgers/{ledgerUuid}/transactions
GET  /api/admin/ledgers/{ledgerUuid}/changes

GET  /api/admin/invites
PUT  /api/admin/invites/{inviteUuid}/disable

GET  /api/admin/audit-logs
GET  /api/admin/system/health
```

## 本地运行

```bash
npm install
npm run dev
```

默认端口：

```text
http://127.0.0.1:5174
```

API 地址可通过 `.env` 覆盖：

```bash
VITE_API_BASE_URL=https://ledger-api.simon996.com
```

## 校验

```bash
npm run lint
npm run build
```

## 目录结构

```text
src/
  App.tsx
  main.tsx
  components/       # 后台壳子、搜索框、状态标签、数据面板
  lib/              # API 客户端、mock 数据、类型
  pages/            # 总览、用户、账本、审计、系统
  styles/           # Tailwind 入口
```

## Git

- Remote: `git@github.com:simon-996/simon-ledger-admin.git`
- Default branch: `master`
- Commit message style: `feat: ...`、`fix: ...`、`docs: ...`
