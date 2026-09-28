# Cloud Account Deletion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the sole admin permanently delete a cloud account while preserving shared ledger history and transferring owned shared ledgers.

**Architecture:** Keep the existing admin shell and introduce a focused account-deletion screen. Add a dedicated backend deletion service with preview and execution endpoints; perform relationship changes and physical deletion in one database transaction. Preserve shared transaction history by allowing anonymous historical actors, and make clients render those records clearly.

**Tech Stack:** React 19, TypeScript, TanStack Query, Spring Boot 3, MyBatis-Plus, MySQL, Sa-Token, Flutter.

**Design:** `../specs/2026-09-28-cloud-account-deletion-design.md`

---

## File map and scope

- `simon-ledger-api/sql/006_anonymize_deleted_accounts.sql`: nullable historical actor foreign keys.
- `simon-ledger-api/src/main/java/com/simon/ledger/service/impl/AdminAccountDeletionService.java`: preview, validated transfer, anonymous history, cleanup, transaction boundary.
- `simon-ledger-api/src/main/java/com/simon/ledger/dto/{req,resp}/AdminAccountDeletion*.java`: request/response contract, with UUID-only account targeting.
- `simon-ledger-api/src/main/java/com/simon/ledger/controller/AdminController.java`: two thin routes; keep deletion out of `AdminServiceImpl`.
- `simon-ledger-api/src/main/java/com/simon/ledger/config/web/WebConfig.java`: reject ordinary App requests whose account row no longer exists.
- `simon-ledger-api/src/main/java/com/simon/ledger/service/impl/{ChangeLogServiceImpl,TransactionServiceImpl}.java`: nullable historical actor reads and anonymous label.
- `simon-ledger-admin/src/lib/{api,types,AuthProvider}.ts(x)`: DELETE request, preview types, authentication error distinction.
- `simon-ledger-admin/src/pages/{UsersPage,AccountDeletionPage}.tsx`: pagination, preview, explicit successors, typed confirmation.
- `simon-ledger-admin/src/App.tsx`: user deletion route.
- `simon_ledger_flutter/lib/features/transactions/presentation/widgets/transaction_detail_sheet.dart`: readable anonymous attribution.

Do not restructure `AdminShell`, dashboard, ledger list, audit, or system pages. The hard-coded ledger sync state is a separate follow-up.

### Task 1: Database contract and historical actor handling

- [ ] Write a test for nullable `created_by_user_id` and `operator_user_id` response mapping. For a transaction or change log with no actor, expect a null user UUID and a visible “已注销用户” label in transaction response.
- [ ] Run the targeted tests and confirm the new anonymous-actor case fails.
- [ ] Add `sql/006_anonymize_deleted_accounts.sql` with explicit foreign-key drop, nullable column alteration, and foreign-key re-add for `ledger_transaction.created_by_user_id` and `ledger_change_log.operator_user_id`. Keep `last_modified_by_user_id` nullable.
- [ ] Update actor lookup and response mapping in `TransactionServiceImpl` and `ChangeLogServiceImpl`: exclude null IDs from mapper `IN` queries, return null UUID for anonymous actors, and use the deleted-user display label. Verify unique transaction operation constraints still behave for active users.
- [ ] Run targeted tests and `mvn test`; commit API changes.

### Task 2: Deletion preview and validation

- [ ] Add tests covering one account with a solo owned ledger, a shared owned ledger, and membership in another owner's ledger. The preview must include already soft-deleted owned ledgers, active successor candidates, and the counts shown to the admin.
- [ ] Run those tests and confirm they fail before implementation.
- [ ] Add a `GET /api/admin/users/{uuid}/deletion-preview` controller contract and response DTO. Put the query logic in `AdminAccountDeletionService`; use the existing admin-login check rather than a new role system.
- [ ] Return a deterministic preview fingerprint based on target account, affected ledger/member IDs and their versions, so execution can reject changed previews. Exclude personal data from the fingerprint returned to the browser.
- [ ] Run targeted tests and commit API changes.

### Task 3: Atomic account deletion

- [ ] Add service tests for all three deletion paths: detach a participant from another owner's ledger without changing amounts; transfer each owned shared ledger to the selected active member; physically delete a solo owned ledger and all its children, including soft-deleted rows.
- [ ] Add failure tests for missing successor, stale preview, concurrent membership change, and failure during child deletion. Assert no user deletion or ownership transfer survives rollback. Add a controller test that requires target UUID and validates the request body.
- [ ] Run targeted tests and confirm failure before implementation.
- [ ] Add `DELETE /api/admin/users/{uuid}` accepting the preview fingerprint and `successors: [{ledgerUuid, userUuid}]`. Re-read and lock target and affected ledgers in stable ID order; reject stale preview and incomplete/invalid successor maps.
- [ ] Transfer owner ID and member role, detach retained people, clear retained transaction and change-log actor IDs, delete invites and idempotency rows, then delete solo-ledger child tables in foreign-key order, remaining user memberships, and finally `user_account`. Record sync change events for surviving ledgers. Use one transaction for all database changes.
- [ ] Write an admin audit event without deleted account identifiers. Revoke the deleted account's Sa-Token sessions after successful commit; make ordinary App requests check account existence even if a token remains.
- [ ] Run targeted tests and `mvn test`; commit API changes.

### Task 4: Admin client preparation

- [ ] Add a small test for auth restoration: network timeout keeps the stored admin token; an actual unauthorized response removes it. Add a test for JSON-body `DELETE` and API conflict errors.
- [ ] Run those tests and confirm failure before implementation. Add only the test runner needed for these cases.
- [ ] Add `adminDelete` to `src/lib/api.ts`; add exact preview/request types to `src/lib/types.ts` and remove unused draft-only types. Update `AuthProvider` to clear credentials only on unauthorized responses; clear cached admin queries on logout.
- [ ] Run tests, `npm run lint`, and `npm run build`; commit admin changes.

### Task 5: Admin deletion flow

- [ ] Add a focused test for successor selection: every active owned shared ledger needs one candidate, while solo and soft-deleted ledgers need none. Test that a stale preview or failed deletion retains the admin's selections and shows the server error.
- [ ] Run the test and confirm failure before implementation.
- [ ] Update `UsersPage` to use the server's `page`, `pageSize`, and `total` rather than fixing `page: 1, pageSize: 50`; add a route to `AccountDeletionPage` for each user.
- [ ] Build `AccountDeletionPage` with loading/error states, affected-ledger summary, one selector per transferable ledger, UUID confirmation, mutation progress, and a success route back to the user list. Disable submission until all successors are valid and the UUID matches. Invalidate user, ledger, dashboard, and audit queries on success.
- [ ] Run tests, `npm run lint`, and `npm run build`; manually inspect narrow and desktop widths; commit admin changes.

### Task 6: Flutter compatibility and end-to-end verification

- [ ] Add a widget test for a transaction with null creator UUID/nickname and retained participant/amount; expect “已注销用户” where author attribution is displayed.
- [ ] Run the test and confirm failure before implementation. Update only the transaction attribution UI needed for the new API response.
- [ ] Run `flutter analyze` and relevant Flutter tests; commit Flutter changes.
- [ ] Run API tests, admin tests/lint/build, and Flutter tests again after all changes. Verify delete preview and execution against disposable MySQL/Redis test data, including old-token rejection, owner transfer, no orphaned foreign keys, preserved shared amounts, and sync visibility on a second member's client.
- [ ] Update the admin README with the migration and deletion workflow. Keep production deployment and production deletion outside implementation verification.
