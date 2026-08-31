import {
  isEconomyPriceSnapshotResponse,
  type EconomyPriceSnapshotResponse
} from '@exile-toolkit/contracts';
import { disenchantDataset } from '@exile-toolkit/data/disenchant';
import {
  applyDisenchantItemLevel,
  calculateDustPerGold,
  calculateDustPerTotalCost,
  estimateDisenchantGoldFee,
  joinDisenchantCandidates,
  priceSnapshotFreshness,
  type DisenchantCandidate,
  type DustUnavailableItem,
  type PricedDisenchantCandidate,
  type WorkspaceLeague
} from '@exile-toolkit/domain';
import { useCreateAtom, useSelector } from '@tanstack/react-store';
import { useTable } from '@tanstack/react-table';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import { DisenchantDataSummary } from '@/components/disenchant/disenchant-data-summary';
import {
  rankingColumns,
  rankingTableFeatures,
  type RankingRow,
  type RankingTable
} from '@/components/disenchant/disenchant-ranking-model';
import {
  DisenchantPagination,
  DisenchantRankingTable
} from '@/components/disenchant/disenchant-ranking-table';
import { DisenchantToolbar } from '@/components/disenchant/disenchant-toolbar';
import type { WorkspaceOutletContext } from '@/components/workspace-shell';
import {
  fromColumnFilters,
  isDisenchantPageSize,
  toColumnFilters,
  useDisenchantTableState
} from '@/hooks/use-disenchant-table-state';
import { apiBaseUrl } from '@/lib/api-config';
import {
  readEconomyPriceSnapshot,
  writeEconomyPriceSnapshot
} from '@/lib/economy-price-snapshot-cache';

export function DisenchantPage() {
  const { workspace } = useOutletContext<WorkspaceOutletContext>();
  const activeLeague = workspace.state.activeLeague;
  const [pageIndex, setPageIndex] = useState(0);
  const [priceResponse, setPriceResponse] =
    useState<EconomyPriceSnapshotResponse>();
  const [priceLoading, setPriceLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const tableState = useDisenchantTableState();
  const columnFilters = useCreateAtom(toColumnFilters(tableState.state));

  useEffect(() => {
    let cancelled = false;
    setPriceLoading(true);
    setPriceResponse(undefined);
    void loadPriceSnapshot(activeLeague).then(response => {
      if (!cancelled) {
        setPriceResponse(response);
        setPriceLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeLeague]);

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
      void loadPriceSnapshot(activeLeague).then(response => {
        if (response) setPriceResponse(response);
      });
    }
    window.addEventListener('focus', refreshWhenStale);
    return () => window.removeEventListener('focus', refreshWhenStale);
  }, [activeLeague, priceResponse]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const candidates = useMemo(
    () =>
      disenchantDataset.entries
        .map(candidate =>
          applyDisenchantItemLevel(candidate, tableState.state.minItemLevel)
        )
        .sort((left, right) => right.dustValue - left.dustValue),
    [tableState.state.minItemLevel]
  );
  const priceJoin = useMemo(
    () =>
      priceResponse
        ? joinDisenchantCandidates(
            candidates,
            Object.values(priceResponse.snapshot.categories).flat(),
            priceResponse.snapshot.catalystToChaos === undefined
              ? {}
              : { catalystToChaos: priceResponse.snapshot.catalystToChaos }
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
        ? priceJoin.ranked.map(candidate =>
            createRankingRow(
              'priced',
              candidate,
              tableState.state.rankingMode,
              tableState.state.goldValueChaosPer10k,
              tableState.state.favorites
            )
          )
        : [],
    [
      candidates,
      priceJoin,
      priceRankingAvailable,
      tableState.state.favorites,
      tableState.state.goldValueChaosPer10k,
      tableState.state.rankingMode
    ]
  );

  useEffect(() => {
    setPageIndex(0);
  }, [
    tableState.state.search,
    tableState.state.category,
    tableState.state.minChaosPrice,
    tableState.state.maxChaosPrice,
    tableState.state.minDustValue,
    tableState.state.maxDustValue,
    tableState.state.minEstimatedGoldFee,
    tableState.state.maxEstimatedGoldFee,
    tableState.state.rankingMode,
    tableState.state.goldValueChaosPer10k,
    tableState.state.minItemLevel,
    tableState.state.showUnpriced,
    tableState.state.showDustUnavailable,
    tableState.state.pageSize
  ]);

  const table = useTable(
    {
      features: rankingTableFeatures,
      data: rows,
      columns: rankingColumns,
      state: {
        sorting:
          priceRankingAvailable ||
          tableState.state.rankingMode === 'dust-per-gold'
            ? [{ id: 'favoriteRank', desc: true }, ...tableState.state.sorting]
            : [
                { id: 'favoriteRank', desc: true },
                { id: 'dustValue', desc: true }
              ],
        columnVisibility: {
          favoriteRank: false,
          category: false,
          chaosValue: true,
          dustPerChaos: true,
          estimatedGoldFee: true,
          efficiency: true
        },
        pagination: { pageIndex, pageSize: tableState.state.pageSize }
      },
      atoms: { columnFilters },
      onSortingChange: updater => {
        const sorting =
          typeof updater === 'function'
            ? updater(tableState.state.sorting)
            : updater;
        tableState.update({ sorting });
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
    },
    state => ({
      sorting: state.sorting,
      columnFilters: state.columnFilters,
      columnSizing: state.columnSizing,
      columnVisibility: state.columnVisibility,
      pagination: state.pagination
    })
  );

  return (
    <article className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-stone-50 sm:text-5xl">
          Disenchant calculator
        </h1>

        <DisenchantDataSummary
          response={priceResponse}
          loading={priceLoading}
          freshness={freshness}
          now={now}
          join={priceRankingAvailable ? priceJoin : undefined}
          total={candidates.length}
        />
      </header>

      <section className="mt-8" aria-labelledby="candidate-heading">
        <div className="rounded-xl border border-white/8 bg-white/[0.025]">
          <DisenchantToolbar
            table={table}
            priceRankingAvailable={priceRankingAvailable}
            currencyDisplay={workspace.state.currencyDisplay}
            onCurrencyDisplayChange={workspace.setCurrencyDisplay}
            state={tableState.state}
            issues={tableState.issues}
            update={tableState.update}
          />
          <DisenchantFilterPersistence
            table={table}
            onChange={tableState.updatePersistedFilters}
          />
          {table.getFilteredRowModel().rows.length === 0 ? (
            <NoMatchingCandidates />
          ) : (
            <DisenchantRankingTable
              table={table}
              priceRankingAvailable={priceRankingAvailable}
              rankingMode={tableState.state.rankingMode}
              activeLeague={activeLeague}
              currencyDisplay={workspace.state.currencyDisplay}
              divineToChaos={priceResponse?.snapshot.divineToChaos}
              minimumItemLevel={tableState.state.minItemLevel}
              tradeSettings={tableState.state}
              favorites={tableState.state.favorites}
              onToggleFavorite={favoriteKey =>
                tableState.update({
                  favorites: tableState.state.favorites.includes(favoriteKey)
                    ? tableState.state.favorites.filter(
                        favorite => favorite !== favoriteKey
                      )
                    : [...tableState.state.favorites, favoriteKey]
                })
              }
            />
          )}
          <DisenchantPagination table={table} />
        </div>
      </section>
    </article>
  );
}

function DisenchantFilterPersistence({
  table,
  onChange
}: {
  table: RankingTable;
  onChange: ReturnType<
    typeof useDisenchantTableState
  >['updatePersistedFilters'];
}) {
  const tableRef = useRef(table);
  tableRef.current = table;
  const filters = useSelector(table.atoms.columnFilters);
  useEffect(() => {
    tableRef.current.setPageIndex(0);
    onChange(fromColumnFilters(filters));
  }, [filters, onChange]);
  return null;
}

function NoMatchingCandidates() {
  return (
    <div className="px-5 py-12 text-center">
      <h3 className="font-medium text-stone-200">No candidates match</h3>
      <p className="mt-2 text-sm text-stone-500">
        Clear or change one filter to see candidates.
      </p>
    </div>
  );
}

function createRankingRow(
  kind: 'priced',
  candidate: PricedDisenchantCandidate,
  rankingMode: 'total-cost' | 'dust-per-gold',
  goldValueChaosPer10k: number,
  favorites: readonly string[]
): RankingRow;
function createRankingRow(
  kind: 'unpriced',
  candidate: DisenchantCandidate,
  rankingMode: 'total-cost' | 'dust-per-gold',
  goldValueChaosPer10k: number,
  favorites: readonly string[]
): RankingRow;
function createRankingRow(
  kind: 'dust-unavailable',
  candidate: DustUnavailableItem,
  rankingMode: 'total-cost' | 'dust-per-gold',
  goldValueChaosPer10k: number,
  favorites: readonly string[]
): RankingRow;
function createRankingRow(
  kind: RankingRow['kind'],
  candidate:
    PricedDisenchantCandidate | DisenchantCandidate | DustUnavailableItem,
  rankingMode: 'total-cost' | 'dust-per-gold',
  goldValueChaosPer10k: number,
  favorites: readonly string[]
): RankingRow {
  const favoriteKey =
    kind === 'dust-unavailable'
      ? `price:${candidate.id}`
      : `dust:${candidate.id}`;
  const favorite = favorites.includes(favoriteKey);
  if (kind === 'dust-unavailable') {
    return {
      kind,
      candidate: candidate as DustUnavailableItem,
      favoriteKey,
      favoriteRank: favorite ? 1 : 0
    };
  }

  const dustCandidate = candidate as DisenchantCandidate;
  const estimatedGoldFee = estimateDisenchantGoldFee(dustCandidate);
  const dustPerGold = calculateDustPerGold(
    dustCandidate.dustValue,
    estimatedGoldFee
  );
  const rankingValue =
    rankingMode === 'dust-per-gold'
      ? dustPerGold
      : kind === 'priced'
        ? calculateDustPerTotalCost({
            dustValue: dustCandidate.dustValue,
            itemChaosCost: (candidate as PricedDisenchantCandidate).price
              .chaosValue,
            catalystChaosCost: (candidate as PricedDisenchantCandidate)
              .catalystChaosCost,
            estimatedGoldFee,
            goldValueChaosPer10k
          })
        : undefined;
  return {
    kind,
    candidate: candidate as PricedDisenchantCandidate & DisenchantCandidate,
    favoriteKey,
    favoriteRank: favorite ? (kind === 'priced' ? 3 : 2) : 0,
    rankingValue,
    estimatedGoldFee,
    dustPerGold
  } as RankingRow;
}

async function loadPriceSnapshot(activeLeague: WorkspaceLeague) {
  try {
    const url = new URL(`${apiBaseUrl}/price-snapshots/economy`, location.href);
    url.searchParams.set('league', activeLeague);
    const response = await fetch(url);
    if (!response.ok) return readEconomyPriceSnapshot(activeLeague);
    const body: unknown = await response.json();
    if (
      !isEconomyPriceSnapshotResponse(body) ||
      body.snapshot.activeLeague !== activeLeague
    ) {
      return readEconomyPriceSnapshot(activeLeague);
    }
    void writeEconomyPriceSnapshot(body);
    return body;
  } catch {
    return readEconomyPriceSnapshot(activeLeague);
  }
}
