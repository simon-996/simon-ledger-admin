type AsyncStateProps = {
  title: string;
  message?: string;
};

export function LoadingState({ title }: AsyncStateProps) {
  return (
    <div
      className="rounded-[1.4rem] border border-slate-200/80 bg-white p-5 shadow-soft"
      role="status"
      aria-live="polite"
    >
      <div className="h-4 w-36 rounded-full bg-slate-100" />
      <div className="mt-4 grid gap-3">
        <div className="h-12 rounded-2xl bg-slate-100" />
        <div className="h-12 rounded-2xl bg-slate-100" />
        <div className="h-12 rounded-2xl bg-slate-100" />
      </div>
      <p className="mt-4 text-sm text-slate-500">{title}</p>
    </div>
  );
}

export function ErrorState({ title, message }: AsyncStateProps) {
  return (
    <div
      className="rounded-[1.4rem] border border-rose-100 bg-white p-5 shadow-soft"
      role="alert"
    >
      <p className="text-sm font-semibold text-rose-700">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{message ?? '请稍后重试'}</p>
    </div>
  );
}

export function EmptyState({ title, message }: AsyncStateProps) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200/80 bg-white p-8 text-center shadow-soft">
      <p className="text-sm font-semibold text-ink-950">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
    </div>
  );
}
