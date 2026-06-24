import { ShieldCheck } from '@phosphor-icons/react';
import { FormEvent, useState } from 'react';

import { useAuth } from '../lib/useAuth';

export function LoginPage() {
  const { login } = useAuth();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedAccount = account.trim();
    const normalizedPassword = password.trim();
    if (!normalizedAccount || !normalizedPassword || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      await login(normalizedAccount, normalizedPassword);
    } catch (e) {
      setError(e instanceof Error ? e.message : '登录失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4 py-8">
      <section className="w-full max-w-md rounded-[1.6rem] border border-slate-200/80 bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-ledger-50 p-3 text-ledger-700">
            <ShieldCheck size={24} weight="duotone" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink-950">
              Simon Ledger 后台
            </h1>
            <p className="mt-1 text-sm text-slate-500">使用后台管理员账号登录</p>
          </div>
        </div>

        <form className="mt-6 grid gap-4" onSubmit={submit}>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-ink-800">账号</span>
            <input
              value={account}
              onChange={(event) => setAccount(event.target.value)}
              className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none transition focus:border-ledger-500 focus:ring-4 focus:ring-ledger-100"
              autoComplete="username"
              autoFocus
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-ink-800">密码</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none transition focus:border-ledger-500 focus:ring-4 focus:ring-ledger-100"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </label>
          {error && (
            <p id="login-error" role="alert" className="text-sm text-rose-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || !account.trim() || !password.trim()}
            aria-busy={submitting}
            className="h-11 rounded-2xl bg-ledger-600 px-4 text-sm font-semibold text-white transition hover:bg-ledger-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitting ? '正在登录' : '登录'}
          </button>
        </form>
      </section>
    </main>
  );
}
