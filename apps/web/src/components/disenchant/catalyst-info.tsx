import { DollarSign, Orbit } from 'lucide-react';

export function CatalystInfo() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Orbit className="size-4 text-purple-400" aria-hidden="true" />
        <h4 className="text-sm font-semibold">Catalyst Recommendation</h4>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm leading-relaxed">
          This jewellery item should be valuable enough to justify catalyst
          investment.
        </p>
        <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-2">
          <div>
            <span className="rounded-md bg-stone-800 px-2 py-0.5 text-xs font-medium">
              Investment
            </span>
          </div>
          <div>
            <span className="rounded-md border border-white/10 bg-black/30 px-2 py-0.5 text-xs font-medium">
              20 Catalysts
            </span>
          </div>
          <div>
            <span className="rounded-md bg-stone-800 px-2 py-0.5 text-xs font-medium">
              Returns
            </span>
          </div>
          <div>
            <span className="rounded-md border border-emerald-500/30 bg-emerald-950 px-2 py-0.5 text-xs font-medium text-emerald-300">
              +40% Dust
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <DollarSign
          className="mt-0.5 size-4 flex-none text-emerald-400"
          aria-hidden="true"
        />
        <p className="text-xs leading-relaxed text-pretty text-stone-400">
          Use cheapest catalyst available on the market.
        </p>
      </div>
    </div>
  );
}
