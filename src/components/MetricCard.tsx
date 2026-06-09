import type { Icon } from '@phosphor-icons/react';

type MetricCardProps = {
  title: string;
  value: string;
  helper: string;
  icon: Icon;
};

export function MetricCard({
  title,
  value,
  helper,
  icon: IconComponent,
}: MetricCardProps) {
  return (
    <section className="rounded-[1.4rem] border border-slate-200/80 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-3 font-mono text-3xl font-semibold tracking-tight text-ink-950">
            {value}
          </p>
        </div>
        <div className="rounded-2xl bg-ledger-50 p-3 text-ledger-700">
          <IconComponent size={22} weight="duotone" />
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-500">{helper}</p>
    </section>
  );
}
