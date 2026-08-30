import type { DisenchantPriceSnapshotResponse } from '@exile-toolkit/contracts';
import { disenchantDataset } from '@exile-toolkit/data/disenchant';
import {
  joinDisenchantCandidates,
  priceSnapshotFreshness
} from '@exile-toolkit/domain';
import { Database, EyeOff, type LucideIcon } from 'lucide-react';
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
  const provenance = disenchantDataset.entries[0]?.provenance;

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
        <p className="font-medium text-stone-200">Market data</p>
        {response && retrievedAt ? (
          <>
            <p className="mt-1">{response.snapshot.activeLeague} league</p>
            <p>Updated {retrievedAt.toLocaleString()}</p>
            <p>
              1 Divine = {response.snapshot.divineToChaos.toLocaleString()}{' '}
              Chaos
            </p>
            {freshness === 'stale' ? (
              <>
                <p className="mt-2 font-medium text-amber-200">
                  Stale prices are fallback market data. Rankings remain usable
                  for up to 24 hours.
                </p>
                <p className="mt-1 text-stone-500">Stale snapshot</p>
              </>
            ) : (
              <p className="mt-2 capitalize">{freshness} snapshot</p>
            )}
          </>
        ) : (
          <p className="mt-1">The reviewed Dust dataset remains available.</p>
        )}
        <p className="mt-2">Dust dataset {disenchantDataset.version}</p>
        <p className="mt-1">
          Dust uses the selected Trade item level and shown quality, includes
          imported influence counts, and assumes no corruption bonus.
        </p>
        {provenance ? (
          <p className="mt-1 flex gap-3">
            <a
              className="text-amber-200 underline"
              href={provenance.source.url}
            >
              {provenance.source.name}
            </a>
            <a
              className="text-amber-200 underline"
              href={provenance.license.url}
            >
              {provenance.license.name}
            </a>
          </p>
        ) : null}
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
        className="absolute right-0 top-full z-50 mt-2 hidden w-72 rounded-lg border border-white/10 bg-stone-950 p-3 text-left text-xs leading-5 text-stone-400 shadow-2xl group-hover:block group-focus-within:block"
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
