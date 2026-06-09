import type { ReactNode } from 'react';

type DataPanelProps = {
  title: string;
  children: ReactNode;
};

export function DataPanel({ title, children }: DataPanelProps) {
  return (
    <section className="rounded-[1.4rem] border border-slate-200/80 bg-white shadow-soft">
      <div className="border-b border-slate-200/80 px-5 py-4">
        <h2 className="text-sm font-semibold text-ink-950">{title}</h2>
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </section>
  );
}
