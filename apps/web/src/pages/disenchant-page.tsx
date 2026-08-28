import {
  isDisenchantPriceSnapshotResponse,
  type DisenchantPriceSnapshotResponse
} from '@exile-toolkit/contracts';
import { disenchantDataset } from '@exile-toolkit/data/disenchant';
import {
  joinDisenchantCandidates,
  priceSnapshotFreshness,
  type DisenchantCandidate,
  type DustUnavailableItem,
  type PricedDisenchantCandidate
} from '@exile-toolkit/domain';
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  useTable,
  type ReactTable
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Info,
  PackageOpen,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  disenchantPageSizes,
  disenchantSortColumnIds,
  disenchantVisibleColumnIds,
  isDisenchantPageSize,
  toColumnFilters,
  useDisenchantTableState,
  type DisenchantCategoryFilter,
  type DisenchantSortColumnId,
  type DisenchantTableState
} from '@/hooks/use-disenchant-table-state';
import { apiBaseUrl } from '@/lib/api-config';
import {
  readDisenchantPriceSnapshot,
  writeDisenchantPriceSnapshot
} from '@/lib/disenchant-price-snapshot-cache';

type RankingRow =
  | { readonly kind: 'priced'; readonly candidate: PricedDisenchantCandidate }
  | { readonly kind: 'unpriced'; readonly candidate: DisenchantCandidate }
  | {
      readonly kind: 'dust-unavailable';
      readonly candidate: DustUnavailableItem;
    };
type MarketState = RankingRow['kind'];
type RankingColumnId =
  DisenchantSortColumnId | 'category' | 'assumption' | 'marketState';

const rankingTableFeatures = tableFeatures({
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  columnVisibilityFeature
});
const rankingColumnHelper = createColumnHelper<
  typeof rankingTableFeatures,
  RankingRow
>();
const rankingColumns = rankingColumnHelper.columns([
  rankingColumnHelper.accessor(row => row.candidate.name, {
    id: 'name',
    header: 'Unique',
    filterFn: 'includesString',
    sortFn: 'alphanumeric',
    enableHiding: false
  }),
  rankingColumnHelper.accessor(row => row.candidate.category, {
    id: 'category',
    header: 'Category',
    enableSorting: false,
    filterFn: (row, columnId, value: DisenchantCategoryFilter) =>
      value === 'all' || row.getValue(columnId) === value
  }),
  rankingColumnHelper.accessor(
    row =>
      row.kind === 'dust-unavailable' ? undefined : row.candidate.dustValue,
    {
      id: 'dustValue',
      header: 'Dust value',
      sortUndefined: 'last',
      sortFn: 'basic',
      filterFn: (row, columnId, minimum: number | undefined) =>
        minimum === undefined ||
        (typeof row.getValue(columnId) === 'number' &&
          (row.getValue(columnId) as number) >= minimum)
    }
  ),
  rankingColumnHelper.accessor(
    row =>
      row.kind === 'priced'
        ? row.candidate.price.chaosValue
        : row.kind === 'dust-unavailable'
          ? row.candidate.chaosValue
          : undefined,
    {
      id: 'chaosValue',
      header: 'Chaos price',
      sortUndefined: 'last',
      sortFn: 'basic',
      filterFn: (row, columnId, maximum: number | undefined) =>
        maximum === undefined ||
        (typeof row.getValue(columnId) === 'number' &&
          (row.getValue(columnId) as number) <= maximum)
    }
  ),
  rankingColumnHelper.accessor(
    row => (row.kind === 'priced' ? row.candidate.dustPerChaos : undefined),
    {
      id: 'dustPerChaos',
      header: 'Dust / Chaos',
      sortUndefined: 'last',
      sortFn: 'basic'
    }
  ),
  rankingColumnHelper.accessor(
    row =>
      row.kind === 'dust-unavailable'
        ? undefined
        : `ilvl ${row.candidate.itemLevel}, q${row.candidate.quality}`,
    {
      id: 'assumption',
      header: 'Assumption',
      enableSorting: false,
      enableHiding: false
    }
  ),
  rankingColumnHelper.accessor(row => row.kind, {
    id: 'marketState',
    header: 'Market state',
    enableSorting: false,
    enableHiding: false,
    filterFn: (
      row,
      columnId,
      shown: { showUnpriced: boolean; showDustUnavailable: boolean }
    ) => {
      const marketState = row.getValue<MarketState>(columnId);
      return (
        marketState === 'priced' ||
        (marketState === 'unpriced' && shown.showUnpriced) ||
        (marketState === 'dust-unavailable' && shown.showDustUnavailable)
      );
    }
  })
]);

type RankingTable = ReactTable<typeof rankingTableFeatures, RankingRow>;

export function DisenchantPage() {
  const [pageIndex, setPageIndex] = useState(0);
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  const [priceResponse, setPriceResponse] =
    useState<DisenchantPriceSnapshotResponse>();
  const [priceLoading, setPriceLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const tableState = useDisenchantTableState();

  useEffect(() => {
    let cancelled = false;
    void loadPriceSnapshot().then(response => {
      if (!cancelled) {
        setPriceResponse(response);
        setPriceLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function refreshWhenStale() {
      if (
        !priceResponse ||
        priceSnapshotFreshness(
          new Date(priceResponse.snapshot.retrievedAt).getTime(),
          Date.now()
        ) === 'fresh'
      ) {
        return;
      }
      void loadPriceSnapshot().then(response => {
        if (response) setPriceResponse(response);
      });
    }
    window.addEventListener('focus', refreshWhenStale);
    return () => window.removeEventListener('focus', refreshWhenStale);
  }, [priceResponse]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const candidates = useMemo(
    () =>
      [...disenchantDataset.entries].sort(
        (left, right) => right.dustValue - left.dustValue
      ),
    []
  );
  const priceJoin = useMemo(
    () =>
      priceResponse
        ? joinDisenchantCandidates(
            candidates,
            Object.values(priceResponse.snapshot.categories).flat()
          )
        : undefined,
    [candidates, priceResponse]
  );
  const freshness = priceResponse
    ? priceSnapshotFreshness(
        new Date(priceResponse.snapshot.retrievedAt).getTime(),
        now
      )
    : undefined;
  const priceRankingAvailable = Boolean(priceJoin && freshness !== 'expired');
  const rows = useMemo<RankingRow[]>(
    () =>
      priceRankingAvailable && priceJoin
        ? [
            ...priceJoin.ranked.map(
              candidate => ({ kind: 'priced', candidate }) as const
            ),
            ...priceJoin.unpriced.map(
              candidate => ({ kind: 'unpriced', candidate }) as const
            ),
            ...priceJoin.dustUnavailable.map(
              candidate => ({ kind: 'dust-unavailable', candidate }) as const
            )
          ]
        : candidates.map(
            candidate => ({ kind: 'unpriced', candidate }) as const
          ),
    [candidates, priceJoin, priceRankingAvailable]
  );
  useEffect(() => {
    setPageIndex(0);
  }, [
    tableState.state.search,
    tableState.state.category,
    tableState.state.maxChaosPrice,
    tableState.state.minDustValue,
    tableState.state.showUnpriced,
    tableState.state.showDustUnavailable,
    tableState.state.pageSize
  ]);
  const table = useTable({
    features: rankingTableFeatures,
    data: rows,
    columns: rankingColumns,
    state: {
      sorting: priceRankingAvailable
        ? tableState.state.sorting
        : [{ id: 'dustValue', desc: true }],
      columnFilters: [
        ...toColumnFilters(
          priceRankingAvailable
            ? tableState.state
            : { ...tableState.state, maxChaosPrice: undefined }
        ),
        ...(priceRankingAvailable
          ? [
              {
                id: 'marketState',
                value: {
                  showUnpriced: tableState.state.showUnpriced,
                  showDustUnavailable: tableState.state.showDustUnavailable
                }
              }
            ]
          : [])
      ],
      columnVisibility: priceRankingAvailable
        ? {
            ...tableState.state.columnVisibility,
            assumption: false,
            marketState: false
          }
        : {
            ...tableState.state.columnVisibility,
            chaosValue: false,
            dustPerChaos: false,
            assumption: true,
            marketState: true
          },
      pagination: { pageIndex, pageSize: tableState.state.pageSize }
    },
    onSortingChange: updater => {
      const sorting =
        typeof updater === 'function'
          ? updater(tableState.state.sorting)
          : updater;
      tableState.update({ sorting });
    },
    onColumnVisibilityChange: updater => {
      const columnVisibility =
        typeof updater === 'function'
          ? updater(tableState.state.columnVisibility)
          : updater;
      tableState.update({ columnVisibility });
    },
    onPaginationChange: updater => {
      const pagination =
        typeof updater === 'function'
          ? updater({ pageIndex, pageSize: tableState.state.pageSize })
          : updater;
      setPageIndex(pagination.pageIndex);
      if (
        pagination.pageSize !== tableState.state.pageSize &&
        isDisenchantPageSize(pagination.pageSize)
      ) {
        tableState.update({ pageSize: pagination.pageSize });
      }
    },
    enableSortingRemoval: false,
    autoResetPageIndex: false
  });
  const provenance = disenchantDataset.entries[0]?.provenance;

  return (
    <article className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
      <header className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-300/70">
          Reviewed Dust dataset
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-stone-50 sm:text-5xl">
          Disenchant calculator
        </h1>
        <p className="mt-5 text-lg leading-8 text-stone-400">
          {priceRankingAvailable
            ? 'Compare reviewed Dust values against current-league poe.ninja prices.'
            : 'Browse supported unique items before market prices are available. Every candidate stays visible, including items without a usable price.'}
        </p>
      </header>

      {priceRankingAvailable && priceResponse ? (
        <PriceSnapshotStatus
          response={priceResponse}
          now={now}
          freshness={freshness === 'stale' ? 'stale' : 'fresh'}
        />
      ) : (
        <UnavailablePriceStatus loading={priceLoading} />
      )}

      <section
        className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto]"
        aria-label="Dataset status"
      >
        <MarketCoverageCard
          join={priceRankingAvailable ? priceJoin : undefined}
          total={candidates.length}
        />
        <div className="rounded-xl border border-white/8 bg-white/[0.025] p-5 lg:max-w-sm">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">
            Dataset coverage
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-300">
            {disenchantDataset.coverage}
          </p>
          <p className="mt-2 text-xs text-stone-500">
            Version {disenchantDataset.version}
          </p>
          {provenance ? <DatasetProvenance provenance={provenance} /> : null}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="candidate-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="candidate-heading"
              className="text-xl font-semibold text-stone-100"
            >
              {priceRankingAvailable
                ? 'Dust per Chaos ranking'
                : 'Unpriced candidates'}
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              {priceRankingAvailable
                ? 'Highest Dust per Chaos first. Same-item price variants are grouped at the cheapest price.'
                : 'Sorted by Dust value for browsing only. This is not a price Ranking.'}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            aria-expanded={assumptionsOpen}
            aria-controls="disenchant-assumptions"
            onClick={() => setAssumptionsOpen(open => !open)}
          >
            <Info aria-hidden="true" /> Dust assumptions
          </Button>
        </div>
        {assumptionsOpen ? <DustAssumptions /> : null}
        <RankingControls
          table={table}
          priceRankingAvailable={priceRankingAvailable}
          state={tableState.state}
          issues={tableState.issues}
          hiddenCounts={{
            unpriced: priceJoin?.unpriced.length ?? 0,
            dustUnavailable: priceJoin?.dustUnavailable.length ?? 0
          }}
          update={tableState.update}
        />
        {table.getFilteredRowModel().rows.length === 0 ? (
          <NoMatchingCandidates />
        ) : (
          <CandidateList
            table={table}
            priceRankingAvailable={priceRankingAvailable}
          />
        )}
        <Pagination table={table} />
      </section>
    </article>
  );
}

function UnavailablePriceStatus({ loading }: { loading: boolean }) {
  return (
    <section
      className="mt-9 rounded-xl border border-amber-300/20 bg-amber-300/[0.045] p-5"
      aria-labelledby="market-data-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="market-data-heading" className="font-medium text-amber-100">
            {loading
              ? 'Loading market prices'
              : 'Market prices are unavailable'}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-400">
            The reviewed Dust dataset remains available. Dust per Chaos and
            other price Rankings stay disabled until a complete Price snapshot
            is available.
          </p>
        </div>
        <Button type="button" variant="outline" disabled>
          Price Ranking unavailable
        </Button>
      </div>
    </section>
  );
}

function PriceSnapshotStatus({
  response,
  now,
  freshness
}: {
  response: DisenchantPriceSnapshotResponse;
  now: number;
  freshness: 'fresh' | 'stale';
}) {
  const retrievedAt = new Date(response.snapshot.retrievedAt);
  return (
    <section
      className={`mt-9 rounded-xl border p-5 ${
        freshness === 'stale'
          ? 'border-amber-300/30 bg-amber-300/[0.045]'
          : 'border-emerald-300/20 bg-emerald-300/[0.045]'
      }`}
      aria-labelledby="market-data-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            id="market-data-heading"
            className={`font-medium ${
              freshness === 'stale' ? 'text-amber-100' : 'text-emerald-100'
            }`}
          >
            {freshness === 'stale'
              ? 'Stale prices'
              : 'poe.ninja Price snapshot'}
          </h2>
          <span
            className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
              freshness === 'stale'
                ? 'bg-amber-300/15 text-amber-100'
                : 'bg-emerald-300/15 text-emerald-100'
            }`}
          >
            {freshness === 'stale' ? 'Stale prices' : 'Fresh prices'}
          </span>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-400">
            {response.snapshot.activeLeague} league. Divine is worth{' '}
            {response.snapshot.divineToChaos.toLocaleString()} Chaos in this
            snapshot.
          </p>
          {freshness === 'stale' ? (
            <p className="mt-2 text-sm leading-6 text-amber-100/80">
              poe.ninja could not provide a newer complete Price snapshot. This
              Ranking remains usable, but it is not current.
            </p>
          ) : null}
        </div>
        <p
          className="text-sm text-stone-400"
          title={retrievedAt.toLocaleString()}
          aria-label={`Retrieved ${retrievedAt.toLocaleString()}`}
        >
          Updated {relativeTime(retrievedAt.getTime(), now)}
        </p>
      </div>
      <p className="mt-3 text-xs text-stone-500">
        Dust dataset version {response.dustDatasetVersion}
      </p>
    </section>
  );
}

function MarketCoverageCard({
  join,
  total
}: {
  join: ReturnType<typeof joinDisenchantCandidates> | undefined;
  total: number;
}) {
  const title = join ? 'Hidden from this ranking' : 'Unpriced candidates';
  const hidden = join
    ? join.unpriced.length + join.dustUnavailable.length
    : total;
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.025] p-5">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">
        {title}
      </p>
      <p className="mt-2 text-2xl font-semibold text-stone-100">
        {hidden.toLocaleString()}
      </p>
      <p className="mt-2 text-sm leading-6 text-stone-500">
        {join
          ? `${join.unpriced.length.toLocaleString()} Unpriced and ${join.dustUnavailable.length.toLocaleString()} Dust unavailable.`
          : 'The full Dataset is shown because no Price snapshot is available.'}
      </p>
    </div>
  );
}

function RankingControls({
  table,
  priceRankingAvailable,
  state,
  issues,
  hiddenCounts,
  update
}: {
  table: RankingTable;
  priceRankingAvailable: boolean;
  state: DisenchantTableState;
  issues: readonly string[];
  hiddenCounts: { readonly unpriced: number; readonly dustUnavailable: number };
  update: ReturnType<typeof useDisenchantTableState>['update'];
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const inputClass =
    'h-10 min-w-0 flex-1 rounded-md border border-white/10 bg-black/20 px-3 text-sm text-stone-200 outline-none placeholder:text-stone-600 focus-visible:border-amber-300/60 focus-visible:ring-2 focus-visible:ring-amber-300/20';
  const activeFilterCount = [
    state.category !== 'all',
    state.maxChaosPrice !== undefined,
    state.minDustValue !== undefined,
    state.showUnpriced,
    state.showDustUnavailable
  ].filter(Boolean).length;
  return (
    <div className="relative mt-5">
      <div className="flex flex-col gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-2 sm:max-w-md">
          <label htmlFor="disenchant-search" className="sr-only">
            Search unique items
          </label>
          <input
            id="disenchant-search"
            type="search"
            className={inputClass}
            placeholder="Filter by unique name"
            value={state.search}
            maxLength={100}
            onChange={event => update({ search: event.target.value })}
          />
          {state.search ? (
            <ClearFilter
              label="Clear unique search"
              onClick={() => update({ search: '' })}
            />
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-10"
            aria-expanded={filtersOpen}
            aria-controls="disenchant-filters"
            onClick={() => setFiltersOpen(open => !open)}
          >
            <SlidersHorizontal aria-hidden="true" />
            Filters
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-amber-300/15 px-1.5 py-0.5 text-xs text-amber-100">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
          <p
            className="whitespace-nowrap text-sm text-stone-500"
            aria-live="polite"
          >
            {table.getFilteredRowModel().rows.length.toLocaleString()} matching
          </p>
        </div>
      </div>

      {filtersOpen ? (
        <div
          id="disenchant-filters"
          className="absolute left-0 top-full z-30 mt-2 w-full max-w-2xl rounded-xl border border-white/10 bg-stone-950 p-4 shadow-2xl shadow-black/60"
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-4">
            <div>
              <h3 className="font-medium text-stone-100">Filter candidates</h3>
              <p className="mt-1 text-sm text-stone-500">
                Narrow the ranking by item type, price, or Dust value.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Close filters"
              onClick={() => setFiltersOpen(false)}
            >
              <X aria-hidden="true" />
            </Button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="min-w-0">
              <label
                htmlFor="disenchant-category"
                className="text-sm text-stone-400"
              >
                Category
              </label>
              <div className="mt-2 flex min-w-0 gap-2">
                <select
                  id="disenchant-category"
                  className={inputClass}
                  value={state.category}
                  onChange={event =>
                    update({
                      category: event.target.value as DisenchantCategoryFilter
                    })
                  }
                >
                  <option value="all">All categories</option>
                  <option value="weapon">Weapon</option>
                  <option value="armour">Armour</option>
                  <option value="accessory">Accessory</option>
                </select>
                {state.category !== 'all' ? (
                  <ClearFilter
                    label="Clear category filter"
                    onClick={() => update({ category: 'all' })}
                  />
                ) : null}
              </div>
            </div>
            <NumericFilter
              label="Maximum Chaos price"
              value={state.maxChaosPrice}
              disabled={!priceRankingAvailable}
              onChange={maxChaosPrice => update({ maxChaosPrice })}
              onClear={() => update({ maxChaosPrice: undefined })}
            />
            <NumericFilter
              label="Minimum Dust value"
              value={state.minDustValue}
              onChange={minDustValue => update({ minDustValue })}
              onClear={() => update({ minDustValue: undefined })}
            />
          </div>

          {priceRankingAvailable ? (
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/8 pt-4 md:hidden">
              <label className="text-sm text-stone-400">
                Sort by
                <select
                  className={`${inputClass} mt-2 w-full`}
                  value={state.sorting[0]?.id ?? 'dustPerChaos'}
                  onChange={event =>
                    update({
                      sorting: [
                        {
                          id: event.target.value as DisenchantSortColumnId,
                          desc: state.sorting[0]?.desc ?? true
                        }
                      ]
                    })
                  }
                >
                  {disenchantSortColumnIds.map(columnId => (
                    <option key={columnId} value={columnId}>
                      {sortColumnLabel(columnId)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-stone-400">
                Sort direction
                <select
                  className={`${inputClass} mt-2 w-full`}
                  value={state.sorting[0]?.desc ? 'descending' : 'ascending'}
                  onChange={event =>
                    update({
                      sorting: [
                        {
                          id: (state.sorting[0]?.id ??
                            'dustPerChaos') as DisenchantSortColumnId,
                          desc: event.target.value === 'descending'
                        }
                      ]
                    })
                  }
                >
                  <option value="descending">Descending</option>
                  <option value="ascending">Ascending</option>
                </select>
              </label>
            </div>
          ) : null}

          {priceRankingAvailable ? (
            <fieldset className="mt-4 min-w-0 flex-wrap gap-x-6 gap-y-3 border-t border-white/8 pt-4 sm:flex">
              <legend className="sr-only">Hidden market states</legend>
              <CheckControl
                label={`Show Unpriced (${hiddenCounts.unpriced.toLocaleString()})`}
                checked={state.showUnpriced}
                onCheckedChange={showUnpriced => update({ showUnpriced })}
              />
              <CheckControl
                label={`Show Dust unavailable (${hiddenCounts.dustUnavailable.toLocaleString()})`}
                checked={state.showDustUnavailable}
                onCheckedChange={showDustUnavailable =>
                  update({ showDustUnavailable })
                }
              />
            </fieldset>
          ) : null}

          <fieldset className="mt-4 min-w-0 flex-wrap gap-x-6 gap-y-3 border-t border-white/8 pt-4 sm:flex">
            <legend className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-stone-500">
              Visible columns
            </legend>
            {table
              .getAllLeafColumns()
              .filter(
                column =>
                  disenchantVisibleColumnIds.includes(
                    column.id as (typeof disenchantVisibleColumnIds)[number]
                  ) &&
                  (priceRankingAvailable ||
                    column.id === 'category' ||
                    column.id === 'dustValue')
              )
              .map(column => (
                <CheckControl
                  key={column.id}
                  label={`Show ${String(column.columnDef.header)}`}
                  checked={column.getIsVisible()}
                  onCheckedChange={visible => column.toggleVisibility(visible)}
                />
              ))}
          </fieldset>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={activeFilterCount === 0}
              onClick={() =>
                update({
                  category: 'all',
                  maxChaosPrice: undefined,
                  minDustValue: undefined,
                  showUnpriced: false,
                  showDustUnavailable: false
                })
              }
            >
              Clear filters
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setFiltersOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      ) : null}

      {issues.map(issue => (
        <p key={issue} role="status" className="mt-2 text-sm text-amber-200">
          {issue}
        </p>
      ))}
    </div>
  );
}

function sortColumnLabel(columnId: DisenchantSortColumnId) {
  switch (columnId) {
    case 'name':
      return 'Unique name';
    case 'chaosValue':
      return 'Chaos price';
    case 'dustValue':
      return 'Dust value';
    case 'dustPerChaos':
      return 'Dust per Chaos';
  }
}

function NumericFilter({
  label,
  value,
  disabled = false,
  onChange,
  onClear
}: {
  label: string;
  value: number | undefined;
  disabled?: boolean;
  onChange: (value: number | undefined) => void;
  onClear: () => void;
}) {
  const id = disenchantControlId(label);
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="text-sm text-stone-400">
        {label}
      </label>
      <div className="mt-2 flex min-w-0 gap-2">
        <input
          id={id}
          type="number"
          min="0"
          step="any"
          disabled={disabled}
          className="h-10 min-w-0 flex-1 rounded-md border border-white/10 bg-black/20 px-3 text-sm tabular-nums text-stone-200 outline-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-amber-300/60 focus-visible:ring-2 focus-visible:ring-amber-300/20"
          value={value ?? ''}
          onChange={event => {
            const next = event.target.valueAsNumber;
            onChange(Number.isFinite(next) && next >= 0 ? next : undefined);
          }}
        />
        {value !== undefined ? (
          <ClearFilter label={`Clear ${label}`} onClick={onClear} />
        ) : null}
      </div>
    </div>
  );
}

function ClearFilter({
  label,
  onClick
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      onClick={onClick}
    >
      <X aria-hidden="true" />
    </Button>
  );
}

function CheckControl({
  label,
  checked,
  onCheckedChange
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = disenchantControlId(label);
  return (
    <span className="mb-3 flex min-w-0 items-start gap-2 sm:mb-0">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={value => onCheckedChange(value === true)}
      />
      <label
        htmlFor={id}
        className="min-w-0 break-words text-sm text-stone-400"
      >
        {label}
      </label>
    </span>
  );
}

function disenchantControlId(label: string) {
  return `disenchant-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`;
}

function NoMatchingCandidates() {
  return (
    <div className="mt-5 rounded-xl border border-white/8 bg-white/[0.025] px-5 py-10 text-center">
      <h3 className="font-medium text-stone-200">No candidates match</h3>
      <p className="mt-2 text-sm text-stone-500">
        Clear or change one filter above to see candidates.
      </p>
    </div>
  );
}

function CandidateList({
  table,
  priceRankingAvailable
}: {
  table: RankingTable;
  priceRankingAvailable: boolean;
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-white/8 bg-white/[0.025]">
      <table className="hidden w-full text-left md:table">
        <thead className="border-b border-white/8 bg-black/15 text-xs uppercase tracking-[0.14em] text-stone-500">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className="px-5 py-3 font-medium"
                  aria-sort={
                    header.column.getIsSorted() === 'asc'
                      ? 'ascending'
                      : header.column.getIsSorted() === 'desc'
                        ? 'descending'
                        : undefined
                  }
                >
                  {header.isPlaceholder ? null : header.column.getCanSort() ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50"
                      aria-label={`Sort by ${String(header.column.columnDef.header)}`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <table.FlexRender header={header} />
                      <ArrowUpDown className="size-3.5" aria-hidden="true" />
                    </button>
                  ) : (
                    <table.FlexRender header={header} />
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-white/6">
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="text-sm">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-5 py-4">
                  <RankingCell
                    columnId={cell.column.id as RankingColumnId}
                    row={row.original}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ul
        className="divide-y divide-white/6 md:hidden"
        aria-label={
          priceRankingAvailable
            ? 'Dust per Chaos ranking'
            : 'Unpriced candidates'
        }
      >
        {table.getRowModel().rows.map(row => (
          <li key={row.id} className="p-4">
            <div className="flex items-start gap-4">
              <CandidateName row={row.original} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {table
                .getVisibleLeafColumns()
                .filter(column => column.id !== 'name')
                .map(column => (
                  <div key={column.id}>
                    <dt className="text-xs uppercase tracking-[0.14em] text-stone-600">
                      {String(column.columnDef.header)}
                    </dt>
                    <dd className="mt-1 text-stone-400">
                      <RankingCell
                        columnId={column.id as RankingColumnId}
                        row={row.original}
                      />
                    </dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RankingCell({
  columnId,
  row
}: {
  columnId: RankingColumnId;
  row: RankingRow;
}) {
  switch (columnId) {
    case 'name':
      return <CandidateName row={row} />;
    case 'category':
      return (
        <span className="capitalize text-stone-400">
          {row.candidate.category}
        </span>
      );
    case 'dustValue':
      return row.kind === 'dust-unavailable' ? (
        <DustUnavailableBadge />
      ) : (
        <span className="font-medium tabular-nums text-amber-100">
          {row.candidate.dustValue.toLocaleString()}
        </span>
      );
    case 'chaosValue':
      return row.kind === 'unpriced' ? (
        <UnpricedBadge />
      ) : (
        <span className="tabular-nums text-stone-300">
          {(row.kind === 'priced'
            ? row.candidate.price.chaosValue
            : row.candidate.chaosValue
          ).toLocaleString()}{' '}
          c
        </span>
      );
    case 'dustPerChaos':
      return row.kind === 'priced' ? (
        <span className="font-medium tabular-nums text-emerald-200">
          {row.candidate.dustPerChaos.toLocaleString(undefined, {
            maximumFractionDigits: 0
          })}
        </span>
      ) : row.kind === 'dust-unavailable' ? (
        <DustUnavailableBadge />
      ) : (
        <UnpricedBadge />
      );
    case 'assumption':
      return row.kind === 'dust-unavailable' ? null : (
        <AssumptionLabel candidate={row.candidate} />
      );
    case 'marketState':
      return row.kind === 'priced' ? (
        <span className="text-stone-400">Priced</span>
      ) : row.kind === 'dust-unavailable' ? (
        <DustUnavailableBadge />
      ) : (
        <UnpricedBadge />
      );
  }
}

function DatasetProvenance({
  provenance
}: {
  provenance: DisenchantCandidate['provenance'];
}) {
  return (
    <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-stone-500">
      <dt>Source</dt>
      <dd>
        <a className="text-amber-200 underline" href={provenance.source.url}>
          {provenance.source.name}
        </a>
      </dd>
      <dt>Game</dt>
      <dd>Path of Exile {provenance.gameVersion}</dd>
      <dt>Verification</dt>
      <dd>Reviewed</dd>
      <dt>License</dt>
      <dd>
        <a className="text-amber-200 underline" href={provenance.license.url}>
          {provenance.license.name}
        </a>
      </dd>
      <dt>Updated</dt>
      <dd>{provenance.updatedAt.slice(0, 10)}</dd>
    </dl>
  );
}
function CandidateName({ row }: { row: RankingRow }) {
  const { candidate } = row;
  const iconUrl =
    row.kind === 'priced'
      ? (row.candidate.price.iconUrl ?? row.candidate.iconUrl)
      : candidate.iconUrl;
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/8 bg-black/20 text-stone-500"
        aria-hidden="true"
      >
        <CandidateIcon iconUrl={iconUrl} label={candidate.name} />
      </span>
      <span className="min-w-0">
        <span className="block font-medium text-stone-200">
          {candidate.name}
          {'variant' in candidate && candidate.variant
            ? `, ${candidate.variant}`
            : ''}
        </span>
        <span className="mt-0.5 block truncate text-xs text-stone-500">
          {candidate.baseType}
        </span>
      </span>
    </div>
  );
}
function CandidateIcon({
  iconUrl,
  label
}: {
  iconUrl: string | undefined;
  label: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!iconUrl || failed)
    return (
      <span className="text-xs font-semibold text-stone-400" aria-hidden="true">
        {label.slice(0, 1)}
      </span>
    );
  return (
    <img
      alt=""
      className="size-8 object-contain"
      referrerPolicy="no-referrer"
      src={iconUrl}
      onError={() => setFailed(true)}
    />
  );
}
function AssumptionLabel({ candidate }: { candidate: DisenchantCandidate }) {
  return (
    <>
      ilvl {candidate.itemLevel}, q{candidate.quality}
    </>
  );
}
function UnpricedBadge() {
  return (
    <span className="inline-flex rounded-full border border-white/10 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
      Unpriced
    </span>
  );
}
function DustUnavailableBadge() {
  return (
    <span className="inline-flex rounded-full border border-amber-300/20 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-amber-200">
      Dust unavailable
    </span>
  );
}
function DustAssumptions() {
  return (
    <aside
      id="disenchant-assumptions"
      className="mt-5 rounded-xl border border-white/8 bg-black/15 p-5"
      aria-label="Dust assumptions"
    >
      <div className="flex gap-3">
        <PackageOpen
          className="mt-0.5 size-5 shrink-0 text-amber-300"
          aria-hidden="true"
        />
        <div className="text-sm leading-6 text-stone-400">
          <p>
            Dust values use item level 85. Weapons and armour use q20.
            Jewellery, quivers, and items that cannot gain quality use q0.
          </p>
          <p className="mt-3">
            The Dataset assumes no influence and no corruption implicit. A
            purchased item may return more Dust, while a corrupted weapon or
            armour below q20 may return less.
          </p>
          <p className="mt-3">
            This view uses Dataset version {disenchantDataset.version}. It does
            not promise a market price or buying result.
          </p>
        </div>
      </div>
    </aside>
  );
}
function Pagination({ table }: { table: RankingTable }) {
  const pageCount = table.getPageCount();
  if (table.getFilteredRowModel().rows.length === 0) return null;
  return (
    <nav
      className="mt-5 flex flex-wrap items-center justify-between gap-4"
      aria-label="Candidate pages"
    >
      <label className="flex items-center gap-2 text-sm text-stone-500">
        Candidates per page
        <select
          className="h-9 rounded-md border border-white/10 bg-black/20 px-2 text-stone-200 outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40"
          value={table.state.pagination.pageSize}
          onChange={event => table.setPageSize(Number(event.target.value))}
        >
          {disenchantPageSizes.map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-3">
        <p className="text-sm text-stone-500">
          Page {table.state.pagination.pageIndex + 1} of {pageCount}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Previous page"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          <ChevronLeft aria-hidden="true" /> Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Next page"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          Next <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}

async function loadPriceSnapshot() {
  try {
    const response = await fetch(`${apiBaseUrl}/price-snapshots/disenchant`);
    if (!response.ok) return readDisenchantPriceSnapshot();
    const body: unknown = await response.json();
    if (!isDisenchantPriceSnapshotResponse(body)) {
      return readDisenchantPriceSnapshot();
    }
    void writeDisenchantPriceSnapshot(body);
    return body;
  } catch {
    return readDisenchantPriceSnapshot();
  }
}
function relativeTime(retrievedAt: number, now: number) {
  const minutes = Math.max(0, Math.floor((now - retrievedAt) / 60_000));
  return minutes === 0
    ? 'just now'
    : `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
}
