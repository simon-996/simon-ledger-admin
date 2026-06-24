import {
  BookOpen,
  Gauge,
  List,
  Pulse,
  ShieldCheck,
  SignOut,
  UserCircle,
  X,
} from '@phosphor-icons/react';
import clsx from 'clsx';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';

const navItems = [
  { to: '/', label: '总览', icon: Gauge },
  { to: '/users', label: '用户', icon: UserCircle },
  { to: '/ledgers', label: '账本', icon: BookOpen },
  { to: '/audit', label: '审计', icon: ShieldCheck },
  { to: '/system', label: '系统', icon: Pulse },
];

export function AdminShell() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-ink-950">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur md:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <div>
            <p className="text-sm font-semibold">Simon Ledger</p>
            <p className="text-xs text-slate-500">Admin Console</p>
          </div>
          <button
            type="button"
            className="rounded-full bg-slate-100 p-2 text-slate-700 transition active:scale-95"
            onClick={() => setOpen((value) => !value)}
            aria-label="切换导航"
          >
            {open ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1440px] md:grid-cols-[248px_minmax(0,1fr)]">
        <aside
          className={clsx(
            'border-r border-slate-200/80 bg-white px-4 py-5 md:sticky md:top-0 md:block md:min-h-[100dvh]',
            open ? 'block' : 'hidden',
          )}
        >
          <div className="hidden px-3 pb-8 md:block">
            <p className="text-base font-semibold">Simon Ledger</p>
            <p className="mt-1 text-sm text-slate-500">后台管理</p>
          </div>
          <nav className="grid gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition active:scale-[0.98]',
                      isActive
                        ? 'bg-ledger-50 text-ledger-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-ink-950',
                    )
                  }
                >
                  <Icon size={20} weight="duotone" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-medium text-ink-950">
              {user?.nickname ?? '后台管理员'}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-500">
              {user?.account}
            </p>
            <button
              type="button"
              onClick={() => void logout()}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-rose-600 active:scale-[0.98]"
            >
              <SignOut size={16} />
              退出登录
            </button>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
