import type { EconomyPriceSnapshotResponse } from '@exile-toolkit/contracts';
import {
  joinDisenchantCandidates,
  priceSnapshotFreshness
} from '@exile-toolkit/domain';
import { EyeOff } from 'lucide-react';

import { CompactInfo } from '@/components/compact-info';
import { MarketDataInfo } from '@/components/market-data-info';

export function DisenchantDataSummary({
  response,
  loading,
  join,
  total,
  now,
  freshness
}: {
  response: EconomyPriceSnapshotResponse | undefined;
  loading: boolean;
  join: ReturnType<typeof joinDisenchantCandidates> | undefined;
  total: number;
  now: number;
  freshness: ReturnType<typeof priceSnapshotFreshness> | undefined;
}) {
  const hidden = join
    ? join.unpriced.length + join.dustUnavailable.length
    : total;

  return (
    <div className="flex flex-wrap items-center gap-1 lg:max-w-sm lg:justify-end">
      <MarketDataInfo
        id="disenchant-market-info"
        response={response}
        loading={loading}
        freshness={freshness}
        now={now}
        unavailableMessage="The reviewed Dust dataset remains available."
      />
      <CompactInfo
        id="disenchant-hidden-info"
        icon={EyeOff}
        label={`${hidden.toLocaleString()} data gaps`}
      >
        <p className="font-medium text-stone-200">Market coverage</p>
        <p className="mt-1">
          {join
            ? `${join.unpriced.length.toLocaleString()} unpriced and ${join.dustUnavailable.length.toLocaleString()} without Dust data.`
            : `${total.toLocaleString()} candidates have no current price snapshot.`}
        </p>
      </CompactInfo>
    </div>
  );
}
