import { HandCoins, Orbit } from 'lucide-react';

import { Separator } from '@/components/ui/separator';

interface TotalCostInfoProps {
  readonly acquisitionChaosCost: number;
  readonly goldCost: number;
  readonly goldValueChaosPer10k: number;
  readonly shouldCatalyst: boolean;
}

const numberFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 1
});

function DetailBadge({
  children,
  tone = 'neutral'
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'outline' | 'amber' | 'blue' | 'green';
}) {
  const tones = {
    neutral: 'bg-white/[0.07] text-stone-200',
    outline: 'border border-white/10 bg-black/30 text-stone-100',
    amber: 'border border-amber-500/50 bg-amber-950 text-amber-300',
    blue: 'border border-blue-500/50 bg-blue-950 text-blue-300',
    green: 'border border-emerald-500/50 bg-emerald-950 text-emerald-300'
  } as const;
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold leading-4 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function TotalCostInfo({
  acquisitionChaosCost,
  goldCost,
  goldValueChaosPer10k,
  shouldCatalyst
}: TotalCostInfoProps) {
  const goldChaosCost = goldCost * (goldValueChaosPer10k / 10_000);
  const effectiveChaosCost = acquisitionChaosCost + goldChaosCost;

  return (
    <div className="flex flex-col gap-3 text-wrap">
      <div className="flex items-center gap-2">
        <HandCoins className="size-4 text-blue-400" aria-hidden="true" />
        <h4 className="text-sm font-semibold">Total Cost Breakdown</h4>
      </div>
      <p className="text-sm leading-relaxed">
        Total Cost combines item Price with your selected Chaos valuation of the
        Gold Fee.
      </p>
      <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-2">
        <div>
          <DetailBadge>Price</DetailBadge>
        </div>
        <div>
          <DetailBadge tone="outline">
            {numberFormatter.format(acquisitionChaosCost)} Chaos
          </DetailBadge>
        </div>
        <div>
          <DetailBadge>Gold Fee</DetailBadge>
        </div>
        <div>
          <DetailBadge tone="amber">
            {numberFormatter.format(goldCost)} Gold
          </DetailBadge>
        </div>
        <div>
          <DetailBadge>Gold Equivalent</DetailBadge>
        </div>
        <div>
          <DetailBadge tone="blue">
            {numberFormatter.format(goldChaosCost)} Chaos
          </DetailBadge>
        </div>
        <div>
          <DetailBadge>Total Cost</DetailBadge>
        </div>
        <div>
          <DetailBadge tone="green">
            {numberFormatter.format(effectiveChaosCost)} Chaos
          </DetailBadge>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-stone-400">
        Gold is valued at {numberFormatter.format(goldValueChaosPer10k)} Chaos
        per 10,000 Gold. Fees are estimates and may vary for individual
        listings.
      </p>

      {shouldCatalyst ? (
        <>
          <Separator />
          <div className="flex items-center gap-2">
            <Orbit className="size-4 text-purple-400" aria-hidden="true" />
            <h4 className="text-sm font-semibold">Catalyst Recommendation</h4>
          </div>
          <p className="text-sm leading-relaxed">
            As this jewellery item has a recommended Catalyst usage, Price also
            includes the cost of 20 Catalysts.
          </p>
        </>
      ) : null}
    </div>
  );
}
