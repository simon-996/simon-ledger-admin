type PaginationProps = {
  label: string;
  page: number;
  pageSize: number;
  total: number;
  busy?: boolean;
  onChange: (page: number) => void;
};

export function Pagination({ label, page, pageSize, total, busy, onChange }: PaginationProps) {
  if (total <= pageSize && page <= 1) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const buttonClass = 'min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-ink-800 transition hover:border-slate-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40';
  return <nav className="mt-4 flex flex-wrap items-center justify-between gap-3" aria-label={label} aria-busy={busy}>
    <p className="text-sm text-slate-500" aria-live="polite">第 {page} 页 · 共 {pages} 页</p>
    <div className="flex gap-2">
      <button type="button" className={buttonClass} disabled={page <= 1 || busy} onClick={() => onChange(Math.max(1, page - 1))}>上一页</button>
      <button type="button" className={buttonClass} disabled={page >= pages || busy} onClick={() => onChange(page + 1)}>下一页</button>
    </div>
  </nav>;
}
