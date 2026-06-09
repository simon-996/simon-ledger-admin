import clsx from 'clsx';
import type { ReactNode } from 'react';

type StatusPillProps = {
  tone: 'success' | 'warning' | 'danger' | 'neutral';
  children: ReactNode;
};

export function StatusPill({ tone, children }: StatusPillProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        tone === 'success' && 'bg-ledger-50 text-ledger-700',
        tone === 'warning' && 'bg-amber-50 text-amber-700',
        tone === 'danger' && 'bg-rose-50 text-rose-700',
        tone === 'neutral' && 'bg-slate-100 text-slate-600',
      )}
    >
      {children}
    </span>
  );
}
