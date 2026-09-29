# Simon Ledger Admin

Simon Ledger 的后台管理 Web，供单个管理员核查云端数据并处理账号删除。

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
- 用户：按昵称、账号、UUID 搜索和分页查看用户；预览并永久删除云端账号。
- 账本：按账本名、owner、UUID 搜索账本，查看成员、参与人、流水和同步状态。
- 审计：查看后台操作和同步异常日志。
- 系统：查看 API 地址、服务健康、数据库和 Redis 状态。

当前页面已接入后端 `/api/admin/*` 独立接口。后台登录态与普通 App 用户登录态隔离，前端会保存后端返回的 Sa-Token，并在后续请求中使用 `simon-ledger` 请求头访问管理接口。

## 后端接口

```text
POST /api/admin/auth/login
POST /api/admin/auth/logout
GET  /api/admin/auth/me

GET  /api/admin/dashboard
GET  /api/admin/users?keyword=&page=&pageSize=
GET  /api/admin/users/{uuid}/deletion-preview
DELETE /api/admin/users/{uuid}
GET  /api/admin/ledgers?keyword=&page=&pageSize=
GET  /api/admin/audit-logs
GET  /api/admin/system/health
```

首次启用后台前，需要在 API 数据库执行：

```text
simon-ledger-api/sql/003_add_admin_console.sql
```

该 SQL 只创建 `admin_user` 和 `admin_operation_log`，不会默认写入管理员账号。首个管理员需要生成 BCrypt 密码 hash 后手动插入 `admin_user` 表。

启用账号删除前，还必须在 API 数据库执行 `simon-ledger-api/sql/006_anonymize_deleted_accounts.sql`，并部署配套的新 API；该迁移将历史流水创建人和变更日志操作者改为可空。不要让新版后台连接到未迁移的旧 API。

删除流程先显示影响范围。仍有其他有效成员的自有账本必须逐本指定接手人；没有其他有效成员或已软删除的自有账本会整本物理删除。他人账本中的参与人名称、分摊和流水保留，但账号关联与头像清除。管理员输入目标 UUID 并提交后不可恢复。删除只作用于云端，不会清理离线设备、本地未上传数据、数据库备份或既有服务器日志。执行生产删除前应按运维流程备份并确认目标与接手人。

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
npm test
npm run build
```

## 部署

后台使用 nginx 静态容器部署。本地脚本位于工作区根目录：

```bash
bash deploy_admin.sh
```

本地脚本会执行：

1. `npm ci`
2. `VITE_API_BASE_URL=... npm run build`
3. 打包 `dist`、`Dockerfile`、`nginx.conf` 为 `admin.tar.gz`
4. 上传到服务器 `/apps/simon_ledger/admin.tar.gz`
5. 默认执行服务器上已有的 `/apps/simon_ledger/scripts/deploy_admin.sh`

可用环境变量：

```bash
PROJECT_ROOT=/path/to/simon-ledger-admin
REMOTE_USER=root
REMOTE_HOST=simon996.com
REMOTE_DIR=/apps/simon_ledger
API_BASE_URL=https://ledger-api.simon996.com
RUN_REMOTE_DEPLOY=true
INSTALL_REMOTE_SCRIPT=false
SERVER_SCRIPT_SOURCE=/path/to/deploy_admin_server.sh
```

默认情况下，本地不需要存在服务器部署脚本。如果需要从本地重新安装服务器部署脚本，再设置：

```bash
INSTALL_REMOTE_SCRIPT=true SERVER_SCRIPT_SOURCE=/path/to/deploy_admin_server.sh bash deploy_admin.sh
```

服务器部署脚本默认路径为：

```text
/apps/simon_ledger/scripts/deploy_admin.sh
```

如果设置 `RUN_REMOTE_DEPLOY=false`，上传后可在服务器手动执行：

```bash
HOST_PORT=18082 bash /apps/simon_ledger/scripts/deploy_admin.sh
```

默认宿主机端口为 `18082`，可覆盖：

```bash
HOST_PORT=18083 bash deploy_admin_server.sh
```

## 目录结构

```text
src/
  App.tsx
  main.tsx
  components/       # 后台壳子、搜索框、状态标签、数据面板
  lib/              # API 客户端、认证上下文、类型和格式化工具
  pages/            # 总览、用户、账本、审计、系统
  styles/           # Tailwind 入口
```

## Git

- Remote: `git@github.com:simon-996/simon-ledger-admin.git`
- Default branch: `master`
- Commit message style: `feat: ...`、`fix: ...`、`docs: ...`
