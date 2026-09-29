# AI Bookkeeping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give explicitly authorized cloud-ledger members text and voice AI bookkeeping that creates multiple locally resumable drafts and saves only individually confirmed transactions.

**Architecture:** The existing Spring API is the only caller of DeepSeek and Tencent ASR and the authority for account/ledger access. React admin changes the account-level default-deny grant. Flutter owns the per-account draft queue and reuses its current local-first, idempotent transaction save path. Phase 1 delivers text; phase 2 adds voice before the same parser.

**Tech Stack:** Java 21, Spring Boot 3, MyBatis-Plus, Sa-Token, MySQL, Redis, DeepSeek Responses API, Tencent Cloud ASR Java SDK, React 19, TypeScript, Vitest, Flutter/Dart, Riverpod, Dio.

---

## Workspaces and file boundaries

This folder contains three separate Git repositories. Execute each task in its stated repository and commit there; never use a single cross-repository `git add`. Before code work, use `using-git-worktrees`, inspect `git status`, and reuse a clean isolated checkout per repository. Preserve the admin repository's pre-existing untracked `admin.tar.gz`. No repository has `.codegraph/` as of this plan; re-check before code search. Production API keys are unavailable and must not be added to any repo or test fixture. Do not deploy, push, or enable paid provider calls without a separate request.

### Planned files

| Repo | File | Single responsibility |
| --- | --- | --- |
| API | `sql/007_add_ai_bookkeeping_access.sql` | Default-deny account migration |
| API | `src/main/java/com/simon/ledger/entity/UserAccount.java` | Persist grant |
| API | `src/main/java/com/simon/ledger/controller/AdminController.java`, `dto/req/AdminAiAccessReq.java`, `dto/resp/AdminUserRecordResp.java`, `service/impl/AdminServiceImpl.java` | Admin grant, readback, audit |
| API | `src/main/java/com/simon/ledger/controller/AiBookkeepingController.java`, `dto/req/AiParseReq.java`, `dto/resp/AiDraftResp.java` | Capability/parse/transcribe HTTP contracts |
| API | `src/main/java/com/simon/ledger/service/impl/AiBookkeepingAccess.java`, `AiDraftValidator.java`, `AiBookkeepingService.java` | Auth, model-result validation, orchestration |
| API | `src/main/java/com/simon/ledger/infrastructure/ai/DeepSeekDraftClient.java`, `TencentSpeechClient.java`, `AiProviderConfig.java` | Outbound provider adapters and server-only configuration |
| API | `src/main/resources/application-prod.yml.example`, `README.md` | Empty-key deployment example and operator steps |
| Admin | `src/lib/types.ts`, `src/pages/UsersPage.tsx` | Grant UI and optimistic-state safety |
| Flutter | `lib/core/repositories/ai_bookkeeping_repository.dart` | Typed API client |
| Flutter | `lib/core/services/ai_draft_queue.dart` | Per-account, per-ledger persisted queue and recovery |
| Flutter | `lib/features/transactions/presentation/widgets/ai_bookkeeping_flow.dart`, `ai_draft_review.dart` | Input, transcribe review, multi-draft review |
| Flutter | `lib/features/transactions/presentation/widgets/bookkeeping_tab.dart` | Small entry hook and adapter to existing form/save |
| Flutter | `lib/core/di/providers.dart`, `pubspec.yaml`, platform microphone manifests | Injection, recorder dependency and permission metadata |

Place new tests next to the equivalent existing API, admin and Flutter tests. Keep `BookkeepingTab` changes limited to opening the AI flow, applying an approved draft, and invoking its current save path; extract a small reusable save adapter if this cannot be done without duplicating `_saveTransaction`.

## Phase 1 — grant and text

### Task 1: Default-deny grant and admin API (API repo)

**Files:** Create `sql/007_add_ai_bookkeeping_access.sql`, `dto/req/AdminAiAccessReq.java`, `src/test/java/com/simon/ledger/controller/AdminAiAccessContractTests.java`, `src/test/java/com/simon/ledger/service/impl/AiGrantMySqlIntegrationTests.java`; modify `entity/UserAccount.java`, `dto/resp/AdminUserRecordResp.java`, `controller/AdminController.java`, `service/AdminService.java`, `service/impl/AdminServiceImpl.java`.

- [ ] **Step 1: Write failing tests.** `AdminAiAccessContractTests` must assert unauthenticated ordinary tokens cannot update grants; admin enable/disable changes the user response and writes exactly one audit row for a real state transition; repeated identical PUT is a no-op; missing/deleted account is 404. The MySQL migration test must insert an old account and assert `ai_bookkeeping_enabled = 0` after running 007.
- [ ] **Step 2: Prove red.** Run `mvn -q -Dtest=AdminAiAccessContractTests test` from `simon-ledger-api`; expect a failing/missing endpoint test. Run the existing opt-in MySQL integration harness with disposable MySQL for the migration test; do not use any real account database.
- [ ] **Step 3: Implement.** Migration contains `ALTER TABLE user_account ADD COLUMN ai_bookkeeping_enabled TINYINT(1) NOT NULL DEFAULT 0;`. Add `Boolean aiBookkeepingEnabled` to `UserAccount` and `AdminUserRecordResp`. Add `PUT /api/admin/users/{uuid}/ai-bookkeeping-access` with a `@NotNull Boolean enabled` request. `AdminServiceImpl` calls `currentAdmin()`, loads only a non-deleted user, compares old/new value, updates only when changed, and writes `admin_operation_log` with action `ai_bookkeeping_grant` or `ai_bookkeeping_revoke`, target type `user_account` and no key/input data. Map null legacy values to `false` on read.
- [ ] **Step 4: Prove green and regressions.** Run `mvn -q -Dtest=AdminAiAccessContractTests test`, the MySQL migration test, then `mvn -q test`; all commands must exit 0.
- [ ] **Step 5: Commit only API changes.** `git add sql/007_add_ai_bookkeeping_access.sql src/main/java/com/simon/ledger src/test/java/com/simon/ledger && git commit -m "feat: gate AI bookkeeping by admin grant"`.

The migration and admin request body are exactly:

```sql
USE simon_ledger;
ALTER TABLE user_account ADD COLUMN ai_bookkeeping_enabled TINYINT(1) NOT NULL DEFAULT 0;
```

```json
{"enabled":true}
```

### Task 2: Grant switch in user list (admin repo)

**Files:** Modify `src/lib/types.ts`, `src/pages/UsersPage.tsx`, `src/pages/UsersPage.test.tsx`.

- [ ] **Step 1: Write failing tests.** Add a user row with `aiBookkeepingEnabled: false`; assert the button says `授权 AI 记账`, calls `PUT /api/admin/users/{uuid}/ai-bookkeeping-access` with `{ enabled: true }`, and refetches the list after success. Add a failure case that leaves the previous status visible and shows an error; add a disable case. Keep the existing pagination test.
- [ ] **Step 2: Prove red.** `npm test -- src/pages/UsersPage.test.tsx` must fail on the missing button/operation.
- [ ] **Step 3: Implement.** Extend `AdminUserRecordResp` with `aiBookkeepingEnabled: boolean`. In `UsersPage`, use `useMutation` and the existing authenticated `adminRequest`/`adminPost` style with `method: 'PUT'` to the exact API path. Disable the row's control while its request is in flight; on success invalidate `['admin-users']`, on error retain the last server value. Show grant status separately from account status and keep the destructive delete action visually distinct.
- [ ] **Step 4: Prove green.** `npm test`, `npm run lint`, `npm run build` all exit 0.
- [ ] **Step 5: Commit only admin UI files.** `git add src/lib/types.ts src/pages/UsersPage.tsx src/pages/UsersPage.test.tsx && git commit -m "feat: manage AI bookkeeping grants"`.

The new UI mutation uses the authenticated request helper and never updates the displayed flag until the server succeeds:

```tsx
const grant = useMutation({
  mutationFn: ({ uuid, enabled }: { uuid: string; enabled: boolean }) =>
    adminRequest<void>(`/api/admin/users/${encodeURIComponent(uuid)}/ai-bookkeeping-access`, {
      method: 'PUT', body: JSON.stringify({ enabled }),
    }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
});
```

### Task 3: Capability, access and limits (API repo)

**Files:** Create `controller/AiBookkeepingController.java`, `service/impl/AiBookkeepingAccess.java`, `dto/resp/AiCapabilityResp.java`, `src/test/java/com/simon/ledger/service/impl/AiBookkeepingAccessTests.java`; modify `src/main/resources/application.yml` only for non-secret limit defaults.

- [ ] **Step 1: Write failing tests.** Cover account grant false, deleted/disabled account, absent/deleted ledger, viewer vs owner/admin/editor roles, grant revocation between capability and parse, Redis-backed per-user/global limits, and missing provider configuration. Capability response must distinguish text and voice availability without disclosing secrets.
- [ ] **Step 2: Prove red.** `mvn -q -Dtest=AiBookkeepingAccessTests test` fails before the service exists.
- [ ] **Step 3: Implement.** `AiBookkeepingAccess.requireAllowed(ledgerUuid)` re-reads the current ordinary account and active ledger member on **each** AI request, using `LedgerRoles.canCreateTransaction`; never trust a client capability flag. Return capability `{textAvailable, voiceAvailable, reason}`. Fail closed when the corresponding key is missing. Use atomic Redis counters with expiry for daily limits: default 30 parse calls and 30 transcribe calls per user, and 1000 of each globally per day; settings are configurable. Increment before outbound calls so parallel requests cannot bypass limits. Do not put raw input or account identity in metric log messages.
- [ ] **Step 4: Prove green.** Run focused test and `mvn -q test`; both exit 0.
- [ ] **Step 5: Commit.** Stage only these API sources and tests; `git commit -m "feat: enforce AI bookkeeping access and usage limits"`.

Access tests should include the key guard, not merely a hidden Flutter button:

```java
assertThrows(BusinessException.class, () -> access.requireAllowed(ledgerUuid));
verifyNoInteractions(deepSeekDraftClient);
```

### Task 4: DeepSeek parse, strict draft validation (API repo)

**Files:** Create `dto/req/AiParseReq.java`, `dto/resp/AiDraftResp.java`, `service/impl/AiDraftValidator.java`, `service/impl/AiBookkeepingService.java`, `infrastructure/ai/DeepSeekDraftClient.java`, `infrastructure/ai/AiProviderConfig.java`, `src/test/java/com/simon/ledger/service/impl/AiDraftValidatorTests.java`, `src/test/java/com/simon/ledger/controller/AiParseContractTests.java`; modify `AiBookkeepingController.java`.

- [ ] **Step 1: Write failing tests.** For one request, fake DeepSeek returning two entries and assert stable order plus no transaction row written. Reject >1000 Unicode characters, >10 entries, malformed JSON, negative/zero amount, invented participant UUID, invalid currency, impossible date and missing required type/amount. A duplicated person name maps to an unresolved candidate, never an arbitrary UUID. Provider timeout/5xx leaves the request text recoverable on the client and returns a safe error without provider payload.
- [ ] **Step 2: Prove red.** `mvn -q -Dtest=AiDraftValidatorTests,AiParseContractTests test` fails before implementation.
- [ ] **Step 3: Implement provider boundary.** `DeepSeekDraftClient.parse(text, zone, currency)` calls `POST https://api.deepseek.com/responses` with a server-configured model (default `deepseek-flash`) and JSON-schema format. Set finite connect/read timeouts; get `DEEPSEEK_API_KEY` only from the deployment environment via `AiProviderConfig`, never from mobile input. The schema's top-level shape is `{ "entries": [{ "sourceText": "...", "type": 0, "amount": "86.00", "currencyCode": "CNY", "categorySuggestion": "餐饮", "note": "...", "happenedAt": "2026-09-29T18:00:00", "payerName": "我", "personNames": ["小王"] }] }`. Prompt the model to leave unsupported facts null, never fabricate identifiers, and treat user text as data rather than instructions.
- [ ] **Step 4: Implement server validation.** `AiDraftValidator` parses amounts with `BigDecimal`, allows only type 0/1, checks supported ledger currencies and ISO local time in the submitted IANA zone, caps `note` to 512 and category suggestion to 64 chars, resolves only uniquely matching active `ledger_person` names and current user's linked person for `我`, and emits unresolved fields instead of guessing. Treat client-supplied local category candidates only as suggestions, never authority. `POST /api/ledgers/{ledgerUuid}/ai-bookkeeping/parse` calls access/limit checks first, then the provider/validator, then returns drafts; it must not call `TransactionService.create`.
- [ ] **Step 5: Prove green.** Run focused tests, `mvn -q test`, and the disposable MySQL integration tests for real member/person mapping; all exit 0.
- [ ] **Step 6: Commit.** Stage only API parse sources/tests; `git commit -m "feat: parse AI bookkeeping text into validated drafts"`.

The provider/schema boundary returns an array, not a transaction command. The test double returns this exact shape and the controller must never call `TransactionService.create`:

```json
{"entries":[{"sourceText":"早餐花了18元","type":0,"amount":"18.00","currencyCode":"CNY","categorySuggestion":"餐饮","note":null,"happenedAt":null,"payerName":null,"personNames":[]},{"sourceText":"晚饭花了36元","type":0,"amount":"36.00","currencyCode":"CNY","categorySuggestion":"餐饮","note":null,"happenedAt":null,"payerName":null,"personNames":[]}]}
```

### Task 5: Account-scoped queue and typed AI API (Flutter repo)

**Files:** Create `lib/core/repositories/ai_bookkeeping_repository.dart`, `lib/core/services/ai_draft_queue.dart`, `test/ai_bookkeeping_repository_test.dart`, `test/ai_draft_queue_test.dart`; modify `lib/core/di/providers.dart`.

- [ ] **Step 1: Write failing tests.** Fake `ApiClient` for capability and multi-draft parse. Queue tests cover two different `LocalDataScope.account` values and ledgers, app restart, confirmation, skipping, restoring after save-before-queue-update, stale participant/category state and preserving unconfirmed text. Confirmed entries have a stable UUID and `clientOperationId` before saving.
- [ ] **Step 2: Prove red.** `flutter test --no-pub test/ai_bookkeeping_repository_test.dart test/ai_draft_queue_test.dart` fails because the types/store do not exist.
- [ ] **Step 3: Implement.** `AiBookkeepingRepository` uses existing `ApiClient.get/post` and typed JSON decoders. `AiDraftQueue(scope: LocalDataScope)` persists a versioned JSON array under a scope-specific key plus ledger UUID; it does not reuse `BookkeepingDraftPreference`. The persisted entry contains source text, normalized draft fields, stable local transaction UUID/operation ID and state. Before presenting an entry after restart, compare its operation ID against the account-scoped local transaction repository; if already saved, remove/mark confirmed rather than submitting again. Do not persist audio bytes or provider keys.
- [ ] **Step 4: Prove green.** Run focused tests and `flutter analyze --no-pub`; both exit 0.
- [ ] **Step 5: Commit.** Stage only Flutter API/queue files/tests; `git commit -m "feat: persist account-scoped AI transaction drafts"`.

The queue key and operation identity are explicit, so recovery cannot accidentally mix accounts or resubmit a saved item:

```dart
String queueKey(LocalDataScope scope, String ledgerUuid) =>
    'ai_draft_queue.v1.${scope.storageKey}.$ledgerUuid';
// Assign once while inserting the draft, then persist both values.
final operationId = draft.clientOperationId ?? draft.uuid;
```

### Task 6: Text input and sequential review (Flutter repo)

**Files:** Create `lib/features/transactions/presentation/widgets/ai_bookkeeping_flow.dart`, `ai_draft_review.dart`, `test/ai_bookkeeping_flow_test.dart`; modify `bookkeeping_tab.dart`.

- [ ] **Step 1: Write failing widget tests.** Assert the AI entry is absent for guest, local ledger, viewer and server-denied grant; it is visible for an authorized cloud editor. Parse a two-entry response; edit the first, confirm it, skip the second, then assert exactly one call to the existing transaction notifier. Close and reopen with pending entries and assert the resume prompt. Test grant revocation: no new parse, but an old draft can still be manually confirmed when ledger write access remains. First use must show third-party disclosure before either provider call.
- [ ] **Step 2: Prove red.** `flutter test --no-pub test/ai_bookkeeping_flow_test.dart` fails before the widget exists.
- [ ] **Step 3: Implement.** `AiBookkeepingFlow` owns input and queue navigation; `AiDraftReview` owns editable fields and shows `第 N/M 笔`, original span and unresolved-field warnings. Make save an injected callback that builds the same `TransactionRecord` as manual entry, with the queue's stable UUID/operation ID, and invokes the existing `transactionProvider(ledgerUuid).notifier.addTransaction` once. Await success before marking a queue item confirmed. Keep failed item and input. Validate current ledger/person/category options again at review time. Add a small button/entry and resume notice in `BookkeepingTab`; avoid copying the 1600-line form.
- [ ] **Step 4: Prove green.** Run focused test, full `flutter test --no-pub`, and `flutter analyze --no-pub`; all exit 0.
- [ ] **Step 5: Commit.** Stage only Flutter text-flow files/tests; `git commit -m "feat: review and save multiple AI bookkeeping drafts"`.

The per-card save order is fixed:

```dart
await ref.read(transactionProvider(ledgerUuid).notifier).addTransaction(record);
await queue.markConfirmed(draft.uuid);
// Never mark confirmed before addTransaction returns; recovery checks the stable operation ID.
```

## Phase 2 — voice before the same parser

### Task 7: Tencent server-side transcription (API repo)

**Files:** Create `infrastructure/ai/TencentSpeechClient.java`, `dto/resp/AiTranscriptionResp.java`, `src/test/java/com/simon/ledger/controller/AiTranscribeContractTests.java`, `src/test/java/com/simon/ledger/infrastructure/ai/TencentSpeechClientTests.java`; modify `pom.xml`, `AiBookkeepingController.java`, `AiProviderConfig.java`, `src/main/resources/application-prod.yml.example`, `README.md`.

- [ ] **Step 1: Write failing tests.** Assert no-grant/member denial happens before provider invocation; 61-second, Base64-encoded >3 MB, unsupported-format, corrupt-format and empty recordings are rejected; fake Tencent success returns only text; timeout and vendor errors do not return secret IDs or raw audio. When Tencent credentials are absent, text capability can remain true but voice capability is false.
- [ ] **Step 2: Prove red.** `mvn -q -Dtest=AiTranscribeContractTests,TencentSpeechClientTests test` fails before the endpoint/adapter exists.
- [ ] **Step 3: Implement.** Add the official `com.tencentcloudapi:tencentcloud-sdk-java-asr:3.1.1500` dependency, load `TENCENT_ASR_SECRET_ID` and `TENCENT_ASR_SECRET_KEY` only from server environment, and call `SentenceRecognition` using `SourceType=1`, `VoiceFormat=pcm`, `EngSerViceType=16k_zh`, `Data` as Base64 and `DataLen` as original byte length. Use `POST /api/ledgers/{ledgerUuid}/ai-bookkeeping/transcribe`; check access and limit before invoking the adapter, validate 16 kHz mono PCM byte length/duration, cap at 60 seconds and 3 MB after Base64 encoding, and do not persist audio. Return `{ "text": "..." }`; never create a transaction or call DeepSeek in this endpoint. Put only empty-value environment references in `application-prod.yml.example` and document server-only rotation.
- [ ] **Step 4: Prove green.** Run focused tests, `mvn -q test`, `mvn -q package`; all exit 0. Search tracked sources and built frontend for key-like literals; none present.
- [ ] **Step 5: Commit.** Stage only API transcription/config/docs files; `git commit -m "feat: transcribe authorized bookkeeping audio"`.

The Tencent request uses direct body data; it must not create a public audio URL or object-store copy:

```java
request.setSourceType(1L);
request.setVoiceFormat("pcm");
request.setEngSerViceType("16k_zh");
request.setData(Base64.getEncoder().encodeToString(pcmBytes));
request.setDataLen((long) pcmBytes.length);
```

### Task 8: Record, review transcript and discard audio (Flutter repo)

**Files:** Modify `pubspec.yaml`, lockfile and Android/iOS microphone metadata; modify `lib/core/network/api_client.dart`, `lib/core/repositories/ai_bookkeeping_repository.dart`, `ai_bookkeeping_flow.dart`; create `lib/core/services/ai_audio_recorder.dart`, `test/ai_audio_recorder_test.dart`; extend `test/ai_bookkeeping_flow_test.dart`.

- [ ] **Step 1: Write failing tests.** Permission denial leaves text input available. Recording stops at 60 seconds, uploads once, shows editable returned text, calls parse only after user submits the edited transcript, and clears the in-memory audio buffer on success, failure, cancel and widget disposal. No recorded bytes are persisted to `AiDraftQueue`.
- [ ] **Step 2: Prove red.** `flutter test --no-pub test/ai_audio_recorder_test.dart test/ai_bookkeeping_flow_test.dart` fails on the absent recorder/voice action.
- [ ] **Step 3: Implement.** Add `record: ^6.2.1` (compatible with this repo's Dart `^3.11.3`) and lock it with `flutter pub get`; the platform-specific microphone permission strings must explain voice bookkeeping. `AiAudioRecorder` exposes `start`, `stop`, `dispose`, captures 16 kHz mono PCM16 via `AudioRecorder.startStream`, and yields an in-memory `Uint8List`; `AiBookkeepingRepository.transcribe` posts raw PCM bytes to the API with `Content-Type: application/octet-stream`, using a new `ApiClient.postBytes` method so the auth interceptor still applies. Both sides fix the format at signed 16-bit little-endian mono 16 kHz; no untrusted format header is accepted. Cap duration locally and recheck on the server. Display the transcript as editable text before calling the existing parse operation. Clear the byte buffer in `finally` for every exit path; never store it in the persistent draft queue.
- [ ] **Step 4: Prove green.** `flutter test --no-pub`, `flutter analyze --no-pub` and `flutter build apk --debug` exit 0. Manually inspect Android and iOS microphone permission prompts on devices or simulators before shipping; report any platform not verified.
- [ ] **Step 5: Commit.** Stage only Flutter voice files/tests/manifests/lockfile; `git commit -m "feat: add voice input to AI bookkeeping"`.

Configure a portable PCM stream rather than a platform-specific compressed file:

```dart
final chunks = await recorder.startStream(const RecordConfig(
  encoder: AudioEncoder.pcm16bits,
  sampleRate: 16000,
  numChannels: 1,
));
```

## Final integration and release gate

### Task 9: Contract, secret and migration verification (all three repos)

**Files:** Only targeted fixes discovered by tests, plus deployment documentation in API `README.md` if needed.

- [ ] **Step 1: Run API tests.** From API repo run `mvn -q test` and the opt-in real MySQL suite against a disposable database with migrations 001–007. Verify default deny, grant revocation, participant mapping, provider-failure rollback/no write and account deletion of a granted user.
- [ ] **Step 2: Run admin tests.** From admin repo run `npm test`, `npm run lint`, `npm run build`; verify grant UI and existing deletion UI both pass.
- [ ] **Step 3: Run Flutter tests.** From Flutter repo run `flutter test --no-pub`, `flutter analyze --no-pub`, `flutter build apk --debug`; verify both AI and manual bookkeeping tests.
- [ ] **Step 4: Prove no secrets shipped.** Inspect staged Git diffs for literal DeepSeek/Tencent keys; scan Flutter source, web `dist/` and APK strings for `DEEPSEEK_API_KEY`, `TENCENT_ASR_SECRET_KEY`, `sk-` and real test credentials. Only environment variable *names* and empty example values may be present. Do not print secret values in tool output.
- [ ] **Step 5: Manual failure/flow review.** With fake providers or designated test accounts, check grant on/off, one and multiple transactions, ambiguous people, queue restore, voice correction, service timeout, offline manual entry and stable operation IDs. Do not hit paid providers or production data during automated verification. Record which device/browser checks were actually performed.
- [ ] **Step 6: Review and integrate.** Use requesting-code-review before merge; resolve findings, repeat affected tests, then use finishing-a-development-branch to offer local merge/PR/retention choices. Do not push or deploy by inference.

## Source checks for external interfaces

- [DeepSeek Responses API structured output](https://api-docs.deepseek.com/zh-cn/api/create-response/)
- [Tencent SentenceRecognition request limits and fields](https://cloud.tencent.com/document/api/1093/35646)
- [Tencent ASR Java SDK artifact](https://central.sonatype.com/artifact/com.tencentcloudapi/tencentcloud-sdk-java-asr/3.1.1500)
- [`record` 6.2.1 supported platforms and PCM stream](https://pub.dev/packages/record/versions/6.2.1)
