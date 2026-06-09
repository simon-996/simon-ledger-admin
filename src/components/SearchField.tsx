import { MagnifyingGlass } from '@phosphor-icons/react';

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
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-ledger-500 focus:ring-4 focus:ring-ledger-100"
        />
      </span>
    </label>
  );
}
