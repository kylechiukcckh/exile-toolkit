import type { DisenchantPriceSnapshotResponse } from '@exile-toolkit/contracts';
import {
  joinDisenchantCandidates,
  priceSnapshotFreshness
} from '@exile-toolkit/domain';
import { Database, EyeOff, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function DisenchantDataSummary({
  response,
  loading,
  join,
  total,
  now,
  freshness
}: {
  response: DisenchantPriceSnapshotResponse | undefined;
  loading: boolean;
  join: ReturnType<typeof joinDisenchantCandidates> | undefined;
  total: number;
  now: number;
  freshness: ReturnType<typeof priceSnapshotFreshness> | undefined;
}) {
  const retrievedAt = response
    ? new Date(response.snapshot.retrievedAt)
    : undefined;
  const hidden = join
    ? join.unpriced.length + join.dustUnavailable.length
    : total;

  return (
    <div className="flex flex-wrap items-center gap-1 lg:max-w-sm lg:justify-end">
      <CompactInfo
        id="disenchant-market-info"
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
            <p className="mt-1">{response.snapshot.activeLeague} league</p>
            <p>Updated {retrievedAt.toLocaleString()}</p>
            <p>
              1 Divine = {response.snapshot.divineToChaos.toLocaleString()}{' '}
              Chaos
            </p>
          </>
        ) : (
          <p className="mt-1">The reviewed Dust dataset remains available.</p>
        )}
      </CompactInfo>
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

function CompactInfo({
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

function relativeTime(retrievedAt: number, now: number) {
  const minutes = Math.max(0, Math.floor((now - retrievedAt) / 60_000));
  return minutes === 0
    ? 'just now'
    : `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
}
