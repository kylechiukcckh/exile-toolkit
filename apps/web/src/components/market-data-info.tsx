import type { EconomyPriceSnapshotResponse } from '@exile-toolkit/contracts';
import { priceSnapshotFreshness } from '@exile-toolkit/domain';
import { Database, TriangleAlert } from 'lucide-react';

import { CompactInfo } from '@/components/compact-info';

export function MarketDataInfo({
  id,
  response,
  loading,
  now,
  freshness,
  unavailableMessage
}: {
  id: string;
  response: EconomyPriceSnapshotResponse | undefined;
  loading: boolean;
  now: number;
  freshness: ReturnType<typeof priceSnapshotFreshness> | undefined;
  unavailableMessage: string;
}) {
  const retrievedAt = response
    ? new Date(response.snapshot.retrievedAt)
    : undefined;

  return (
    <CompactInfo
      id={id}
      icon={Database}
      label={
        freshness === 'stale' ? (
          <>
            <span>Stale prices</span>
            <span aria-hidden="true">·</span>
            {retrievedAt ? relativeTime(retrievedAt.getTime(), now) : ''}
          </>
        ) : response && retrievedAt && freshness !== 'expired' ? (
          `poe.ninja · ${relativeTime(retrievedAt.getTime(), now)}`
        ) : freshness === 'expired' ? (
          'Prices expired'
        ) : loading ? (
          'Loading prices'
        ) : (
          'Prices unavailable'
        )
      }
      tone={freshness === 'stale' ? 'warning' : 'default'}
    >
      <p
        className={`flex items-center gap-1.5 font-medium ${freshness === 'stale' ? 'text-amber-200' : 'text-stone-200'}`}
      >
        {freshness === 'stale' ? (
          <>
            <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
            Market data - Stale Snapshot
          </>
        ) : (
          <>Market data</>
        )}
      </p>
      {response && retrievedAt ? (
        <>
          <p className="mt-1">Source: {response.snapshot.source}</p>
          <p>{response.snapshot.activeLeague} league</p>
          <p>Updated {retrievedAt.toLocaleString()}</p>
          <p>
            1 Divine = {response.snapshot.divineToChaos.toLocaleString()} Chaos
          </p>
        </>
      ) : (
        <p className="mt-1">{unavailableMessage}</p>
      )}
    </CompactInfo>
  );
}

function relativeTime(retrievedAt: number, now: number) {
  const minutes = Math.max(0, Math.floor((now - retrievedAt) / 60_000));
  return minutes === 0
    ? 'just now'
    : `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
}
