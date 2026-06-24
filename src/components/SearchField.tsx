import { MagnifyingGlass, X } from '@phosphor-icons/react';

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

export function SearchField({
  value,
  onChange,
  placeholder,
}: SearchFieldProps) {
  return (
    <label className="block">
      <span className="sr-only">搜索</span>
      <span className="relative block">
        <MagnifyingGlass
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-ledger-500 focus:ring-4 focus:ring-ledger-100"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 active:scale-95"
            aria-label="清空搜索"
          >
            <X size={16} />
          </button>
        ) : null}
      </span>
    </label>
  );
}
