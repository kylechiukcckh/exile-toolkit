import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function CompactInfo({
  id,
  icon: Icon,
  label,
  children,
  tone = 'default'
}: {
  id: string;
  icon: LucideIcon;
  label: ReactNode;
  children: ReactNode;
  tone?: 'default' | 'warning';
}) {
  return (
    <span className="group relative">
      <button
        type="button"
        className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs outline-none hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-amber-300/40 ${tone === 'warning' ? 'border border-amber-300/25 bg-amber-300/10 text-amber-200' : 'text-stone-500 hover:text-stone-300'}`}
        aria-describedby={id}
      >
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </button>
      <span
        id={id}
        role="tooltip"
        className={`absolute right-0 top-full z-50 mt-2 hidden w-72 rounded-lg border bg-stone-950 p-3 text-left text-xs leading-5 shadow-2xl group-hover:block group-focus-within:block ${tone === 'warning' ? 'border-amber-300/25 text-amber-200' : 'border-white/10 text-stone-400'}`}
      >
        {children}
      </span>
    </span>
  );
}
