import {
  isDisenchantPriceSnapshotResponse,
  type DisenchantPriceSnapshotResponse
} from '@exile-toolkit/contracts';
import { disenchantDataset } from '@exile-toolkit/data/disenchant';
import {
  applyDisenchantItemLevel,
  joinDisenchantCandidates,
  priceSnapshotFreshness
} from '@exile-toolkit/domain';
import { useTable } from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';

import { DisenchantDataSummary } from '@/components/disenchant/disenchant-data-summary';
import {
  rankingColumns,
  rankingTableFeatures,
  type RankingRow
} from '@/components/disenchant/disenchant-ranking-model';
import {
  DisenchantPagination,
  DisenchantRankingTable
} from '@/components/disenchant/disenchant-ranking-table';
import { DisenchantToolbar } from '@/components/disenchant/disenchant-toolbar';
import {
  isDisenchantPageSize,
  toColumnFilters,
  useDisenchantTableState
} from '@/hooks/use-disenchant-table-state';
import { apiBaseUrl } from '@/lib/api-config';
import {
  readDisenchantPriceSnapshot,
  writeDisenchantPriceSnapshot
} from '@/lib/disenchant-price-snapshot-cache';

export function DisenchantPage() {
  const [pageIndex, setPageIndex] = useState(0);
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
  const activeLeague = priceResponse?.snapshot.activeLeague;
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
    tableState.state.minChaosPrice,
    tableState.state.maxChaosPrice,
    tableState.state.minDustValue,
    tableState.state.maxDustValue,
    tableState.state.minEstimatedGoldFee,
    tableState.state.maxEstimatedGoldFee,
    tableState.state.rankingMode,
    tableState.state.minItemLevel,
    tableState.state.showUnpriced,
    tableState.state.showDustUnavailable,
    tableState.state.pageSize
  ]);

  const table = useTable({
    features: rankingTableFeatures,
    data: rows,
    columns: rankingColumns,
    state: {
      sorting:
        priceRankingAvailable ||
        tableState.state.rankingMode === 'dust-per-gold'
          ? tableState.state.sorting
          : [{ id: 'dustValue', desc: true }],
      columnFilters: [
        ...toColumnFilters(
          priceRankingAvailable
            ? tableState.state
            : {
                ...tableState.state,
                minChaosPrice: undefined,
                maxChaosPrice: undefined
              }
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
      columnVisibility: {
        ...tableState.state.columnVisibility,
        category: tableState.state.columnVisibility.category ?? false,
        chaosValue:
          priceRankingAvailable &&
          tableState.state.columnVisibility.chaosValue !== false,
        dustPerChaos:
          priceRankingAvailable &&
          tableState.state.rankingMode === 'dust-per-chaos' &&
          tableState.state.columnVisibility.dustPerChaos !== false,
        estimatedGoldFee: tableState.state.rankingMode === 'dust-per-gold',
        dustPerGold: tableState.state.rankingMode === 'dust-per-gold',
        assumption: !priceRankingAvailable,
        marketState: !priceRankingAvailable
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

  return (
    <article className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
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
            activeLeague={activeLeague}
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
            <DisenchantRankingTable
              table={table}
              priceRankingAvailable={priceRankingAvailable}
              rankingMode={tableState.state.rankingMode}
              activeLeague={activeLeague}
              minimumItemLevel={tableState.state.minItemLevel}
            />
          )}
        </div>
        <DisenchantPagination table={table} />
      </section>
    </article>
  );
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
