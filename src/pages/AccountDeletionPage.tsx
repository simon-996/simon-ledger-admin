import { ArrowLeft, WarningCircle } from '@phosphor-icons/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ErrorState, LoadingState } from '../components/AsyncState';
import { DataPanel } from '../components/DataPanel';
import { PageHeader } from '../components/PageHeader';
import { adminDelete, adminGet } from '../lib/api';
import type { AccountDeletionPreview, AccountDeletionRequest, DeletionLedger } from '../lib/types';

function LedgerCounts({ ledger }: { ledger: DeletionLedger }) {
  return (
    <div className="mt-2 space-y-1 text-xs text-slate-500">
      <p className="font-mono">成员 {ledger.memberCount} · 参与人 {ledger.personCount} · 流水 {ledger.transactionCount}</p>
      <p>保留参与人 {ledger.retainedPersonCount} · 删除参与人 {ledger.deletedPersonCount} · 保留流水 {ledger.retainedTransactionCount} · 删除流水 {ledger.deletedTransactionCount}</p>
      {ledger.activeMembers.length > 0 && (
        <p>有效成员：{ledger.activeMembers.map((member) => member.nickname).join('、')}</p>
      )}
    </div>
  );
}

export function AccountDeletionPage() {
  const { userUuid } = useParams<{ userUuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedSuccessors, setSelectedSuccessors] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState('');
  const previewQuery = useQuery({
    queryKey: ['admin-account-deletion-preview', userUuid],
    queryFn: () => adminGet<AccountDeletionPreview>(
      `/api/admin/users/${encodeURIComponent(userUuid!)}/deletion-preview`,
    ),
    enabled: Boolean(userUuid),
    staleTime: 0,
  });
  const deletion = useMutation({
    mutationFn: ({ preview, request }: { preview: AccountDeletionPreview; request: AccountDeletionRequest }) =>
      adminDelete<unknown>(`/api/admin/users/${encodeURIComponent(preview.userUuid)}`, request),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-ledgers'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] }),
      ]);
      navigate('/users', { replace: true });
    },
  });

  if (!userUuid) {
    return <ErrorState title="用户地址无效" message="请从用户列表重新进入。" />;
  }
  if (previewQuery.isLoading) {
    return <LoadingState title="正在检查云端关联数据" />;
  }
  if (previewQuery.isError) {
    return <ErrorState title="删除预览加载失败" message={previewQuery.error.message} />;
  }
  const preview = previewQuery.data;
  if (!preview) {
    return <ErrorState title="删除预览不可用" message="请从用户列表重新进入。" />;
  }

  const transferable = preview.ownedLedgers.filter((ledger) => ledger.action === 'TRANSFER');
  const deletable = preview.ownedLedgers.filter((ledger) => ledger.action === 'DELETE');
  const allSuccessorsValid = transferable.every((ledger) =>
    ledger.successors.some((candidate) => candidate.userUuid === selectedSuccessors[ledger.uuid]),
  );
  const canDelete = confirmation === preview.userUuid && allSuccessorsValid && !deletion.isPending;

  function submit() {
    const currentPreview = previewQuery.data;
    if (!canDelete || !currentPreview) return;
    deletion.mutate({
      preview: currentPreview,
      request: {
        fingerprint: currentPreview.fingerprint,
        confirmUuid: currentPreview.userUuid,
        successors: transferable.map((ledger) => ({
          ledgerUuid: ledger.uuid,
          userUuid: selectedSuccessors[ledger.uuid],
        })),
      },
    });
  }

  return (
    <>
      <Link to="/users" className="mb-5 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-ink-950">
        <ArrowLeft size={16} /> 返回用户列表
      </Link>
      <PageHeader
        title="删除云端账号"
        description="确认账本接手人和保留范围后，永久清除该账号的云端资料。"
      />

      <section className="mb-5 border-l-4 border-rose-400 bg-rose-50 px-5 py-4 text-sm text-rose-900">
        <div className="flex items-start gap-3">
          <WarningCircle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">此操作不可撤销</p>
            <p className="mt-1 leading-6">仅删除云端数据。未上传的设备本地数据不在此次操作范围内。</p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
        <div className="min-w-0 space-y-5">
          <DataPanel title="目标账号">
            <div className="px-5 py-4">
              <p className="text-base font-semibold text-ink-950">{preview.nickname}</p>
              <p className="mt-1 text-sm text-slate-600">{preview.account}</p>
              <p className="mt-2 break-all font-mono text-xs text-slate-500">{preview.userUuid}</p>
            </div>
          </DataPanel>

          <DataPanel title={`转交的账本 · ${transferable.length}`}>
            {transferable.length === 0 && <p className="px-5 py-4 text-sm text-slate-500">没有需要转交的账本。</p>}
            {transferable.map((ledger) => (
              <div key={ledger.uuid} className="border-b border-slate-100 px-5 py-4 last:border-b-0">
                <p className="font-medium text-ink-950">{ledger.name}</p>
                <LedgerCounts ledger={ledger} />
                <label className="mt-4 grid gap-2 text-sm font-medium text-ink-800">
                  接手人：{ledger.name}
                  <select
                    value={selectedSuccessors[ledger.uuid] ?? ''}
                    onChange={(event) => setSelectedSuccessors((current) => ({
                      ...current, [ledger.uuid]: event.target.value,
                    }))}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-ledger-500 focus:ring-4 focus:ring-ledger-100"
                  >
                    <option value="">选择接手成员</option>
                    {ledger.successors.map((candidate) => (
                      <option key={candidate.userUuid} value={candidate.userUuid}>
                        {candidate.nickname} · {candidate.role}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
          </DataPanel>

          <DataPanel title={`彻底删除的账本 · ${deletable.length}`}>
            {deletable.length === 0 && <p className="px-5 py-4 text-sm text-slate-500">没有整本删除的账本。</p>}
            {deletable.map((ledger) => (
              <div key={ledger.uuid} className="border-b border-slate-100 px-5 py-4 last:border-b-0">
                <p className="font-medium text-ink-950">{ledger.name}</p>
                <p className="mt-1 text-xs text-rose-700">{ledger.deleted ? '已删除账本将清理' : '没有其他有效成员'}</p>
                <LedgerCounts ledger={ledger} />
              </div>
            ))}
          </DataPanel>

          <DataPanel title={`保留的他人账本 · ${preview.joinedLedgers.length}`}>
            {preview.joinedLedgers.length === 0 && <p className="px-5 py-4 text-sm text-slate-500">该账号未加入其他人的账本。</p>}
            {preview.joinedLedgers.map((ledger) => (
              <div key={ledger.uuid} className="border-b border-slate-100 px-5 py-4 last:border-b-0">
                <p className="font-medium text-ink-950">{ledger.name}</p>
                <p className="mt-1 text-xs text-slate-500">历史参与人及流水保留，账号关联移除</p>
                <LedgerCounts ledger={ledger} />
              </div>
            ))}
          </DataPanel>
        </div>

        <div className="min-w-0">
          <section className="rounded-[1.4rem] border border-slate-200 bg-white p-5 xl:sticky xl:top-8">
            <h2 className="text-base font-semibold text-ink-950">最终确认</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              将删除账号资料，转交 {transferable.length} 本账，彻底删除 {deletable.length} 本账。
              他人账本中的参与人和流水继续保留。
            </p>
            <p className="mt-2 text-sm font-medium text-ink-800">
              保留 {preview.summary.transactionsToKeep} 条流水 · 删除 {preview.summary.transactionsToDelete} 条流水
            </p>
            <label className="mt-5 grid gap-2 text-sm font-medium text-ink-800">
              输入用户 UUID 确认
              <input
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 font-mono text-sm outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
              />
            </label>
            {deletion.isError && (
              <p role="alert" className="mt-4 text-sm leading-6 text-rose-700">
                {deletion.error.message}
                {' '}请检查当前预览后重试。
              </p>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={!canDelete}
              className="mt-5 h-11 w-full rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white transition hover:bg-rose-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {deletion.isPending ? '正在删除' : '永久删除云端账号'}
            </button>
            <button
              type="button"
              onClick={() => void previewQuery.refetch()}
              disabled={previewQuery.isFetching || deletion.isPending}
              className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              重新获取预览
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
