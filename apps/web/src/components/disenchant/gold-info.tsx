import { Coins, TrendingUp } from 'lucide-react';

export function GoldInfo() {
  return (
    <div className="flex flex-col gap-3 text-wrap">
      <div className="flex items-center gap-2">
        <Coins className="size-4 text-yellow-400" aria-hidden="true" />
        <h4 className="text-sm font-semibold">Gold Fee</h4>
      </div>
      <p className="text-sm leading-relaxed">
        Gold fee for asynchronous trading, based on item value.
      </p>
      <div className="flex items-center gap-2">
        <TrendingUp className="size-4 text-red-400" aria-hidden="true" />
        <h4 className="text-sm font-semibold">Gold Fee Modifiers</h4>
      </div>
      <p className="text-xs leading-relaxed text-stone-400">
        Gold fee is increased by quality, influence types, and corruption.
      </p>
      <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-2 text-xs">
        <span className="rounded-md bg-white/7 px-2 py-1">Quality</span>
        <span className="rounded-md bg-emerald-500/15 px-2 py-1 font-medium text-emerald-300">
          +2% per 1%
        </span>
        <span className="rounded-md bg-white/7 px-2 py-1">
          Influence &amp; Corruption
        </span>
        <span className="rounded-md bg-amber-500/15 px-2 py-1 font-medium text-amber-300">
          +50% per modifier
        </span>
      </div>
    </div>
  );
}
