import {
  calculateDustPerGold,
  createDisenchantTradeUrl,
  disenchantLowStockThreshold,
  type DisenchantCandidate
} from '@exile-toolkit/domain';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  PackageMinus
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  disenchantPageSizes,
  type DisenchantTableState
} from '@/hooks/use-disenchant-table-state';

import {
  estimatedGoldFeeFor,
  type RankingColumnId,
  type RankingRow,
  type RankingTable
} from './disenchant-ranking-model';

const dustIconUrl =
  'https://web.poecdn.com/image/Art/2DItems/Currency/Settlers/DisenchantedMagicDust.png';
const chaosIconUrl =
  'https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyRerollRare.png';

export function DisenchantRankingTable({
  table,
  priceRankingAvailable,
  rankingMode,
  activeLeague,
  minimumItemLevel
}: {
  table: RankingTable;
  priceRankingAvailable: boolean;
  rankingMode: DisenchantTableState['rankingMode'];
  activeLeague: string | undefined;
  minimumItemLevel: number;
}) {
  return (
    <div className="overflow-x-auto rounded-b-xl">
      <table className="hidden min-w-[860px] w-full table-fixed text-left md:table">
        <thead className="border-b border-white/8 bg-black/15 text-xs text-stone-500">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  style={{ width: header.getSize() }}
                  className={`h-11 overflow-hidden px-3 font-medium ${header.column.id === 'name' ? 'text-left' : 'text-right'}`}
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
                      className="inline-flex max-w-full items-center gap-1 rounded outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50"
                      aria-label={`Sort by ${String(header.column.columnDef.header)}`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span className="truncate">
                        <table.FlexRender header={header} />
                      </span>
                      <ArrowUpDown
                        className="size-3.5 shrink-0"
                        aria-hidden="true"
                      />
                    </button>
                  ) : (
                    <span className="block truncate">
                      <table.FlexRender header={header} />
                    </span>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-white/6">
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="h-14 text-sm hover:bg-white/[0.018]">
              {row.getVisibleCells().map(cell => (
                <td
                  key={cell.id}
                  style={{ width: cell.column.getSize() }}
                  className={`overflow-hidden px-3 py-2 ${cell.column.id === 'name' ? 'text-left' : 'text-right'}`}
                >
                  <RankingCell
                    columnId={cell.column.id as RankingColumnId}
                    row={row.original}
                    activeLeague={activeLeague}
                    minimumItemLevel={minimumItemLevel}
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
          rankingMode === 'dust-per-gold'
            ? 'Dust per Gold ranking'
            : priceRankingAvailable
              ? 'Dust per Chaos ranking'
              : 'Unpriced candidates'
        }
      >
        {table.getRowModel().rows.map(row => (
          <li key={row.id} className="p-4">
            <CandidateName row={row.original} />
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {table
                .getVisibleLeafColumns()
                .filter(column => column.id !== 'name')
                .map(column => (
                  <div key={column.id} className="min-w-0">
                    <dt className="truncate text-xs text-stone-600">
                      {String(column.columnDef.header)}
                    </dt>
                    <dd className="mt-1 text-stone-400">
                      <RankingCell
                        columnId={column.id as RankingColumnId}
                        row={row.original}
                        activeLeague={activeLeague}
                        minimumItemLevel={minimumItemLevel}
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
  row,
  activeLeague,
  minimumItemLevel
}: {
  columnId: RankingColumnId;
  row: RankingRow;
  activeLeague: string | undefined;
  minimumItemLevel: number;
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
        <span className="inline-flex items-center justify-end gap-1.5 font-medium tabular-nums text-amber-100">
          <CompactNumber value={row.candidate.dustValue} />
          <CurrencyIcon src={dustIconUrl} label="Thaumaturgic Dust" />
          <span className="text-xs font-normal text-stone-500">
            (ilvl {row.candidate.itemLevel} · q{row.candidate.quality})
          </span>
        </span>
      );
    case 'chaosValue': {
      if (row.kind === 'unpriced') return <UnpricedBadge />;
      const value =
        row.kind === 'priced'
          ? row.candidate.price.chaosValue
          : row.candidate.chaosValue;
      return (
        <span className="inline-flex items-center justify-end gap-1.5 tabular-nums text-stone-300">
          <CompactNumber value={value} maximumFractionDigits={2} />
          <CurrencyIcon src={chaosIconUrl} label="Chaos Orb" />
        </span>
      );
    }
    case 'dustPerChaos':
      return row.kind === 'priced' ? (
        <span className="inline-flex items-center justify-end gap-1 font-medium tabular-nums text-emerald-200">
          <CompactNumber value={row.candidate.dustPerChaos} />
          <CurrencyIcon src={dustIconUrl} label="Thaumaturgic Dust" />
          <span className="text-stone-600">/</span>
          <CurrencyIcon src={chaosIconUrl} label="Chaos Orb" />
        </span>
      ) : row.kind === 'dust-unavailable' ? (
        <DustUnavailableBadge />
      ) : (
        <UnpricedBadge />
      );
    case 'estimatedGoldFee': {
      const fee = estimatedGoldFeeFor(row);
      return fee === undefined ? (
        <DustUnavailableBadge />
      ) : (
        <span
          className="tabular-nums text-stone-300"
          title="Estimated asynchronous Trade fee. The actual charge may differ."
        >
          <CompactNumber value={fee} /> Gold
        </span>
      );
    }
    case 'dustPerGold': {
      const fee = estimatedGoldFeeFor(row);
      const value =
        row.kind === 'dust-unavailable'
          ? undefined
          : calculateDustPerGold(row.candidate.dustValue, fee);
      return value === undefined ? (
        <DustUnavailableBadge />
      ) : (
        <span className="inline-flex items-center justify-end gap-1.5 font-medium tabular-nums text-emerald-200">
          <CompactNumber value={value} maximumFractionDigits={1} />
          <CurrencyIcon src={dustIconUrl} label="Thaumaturgic Dust" />
        </span>
      );
    }
    case 'trade':
      return (
        <TradeAction
          row={row}
          activeLeague={activeLeague}
          minimumItemLevel={minimumItemLevel}
        />
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

function CompactNumber({
  value,
  maximumFractionDigits = 1
}: {
  value: number;
  maximumFractionDigits?: number;
}) {
  const compact = new Intl.NumberFormat('en', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits
  }).format(value);
  const full = value.toLocaleString('en', { maximumFractionDigits });
  if (Math.abs(value) < 1_000) return <span>{full}</span>;

  return (
    <span className="group/number relative cursor-help">
      <span title={full}>{compact}</span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 hidden whitespace-nowrap rounded-md border border-white/10 bg-stone-950 px-2 py-1 text-xs font-normal text-stone-200 shadow-xl group-hover/number:block"
      >
        {full}
      </span>
    </span>
  );
}

function CurrencyIcon({ src, label }: { src: string; label: string }) {
  return (
    <img
      src={src}
      alt={label}
      title={label}
      className="size-[18px] shrink-0 object-contain"
    />
  );
}

function TradeAction({
  row,
  activeLeague,
  minimumItemLevel
}: {
  row: RankingRow;
  activeLeague: string | undefined;
  minimumItemLevel: number;
}) {
  const url = activeLeague
    ? createDisenchantTradeUrl({
        league: activeLeague,
        name: row.candidate.name,
        baseType: row.candidate.baseType,
        minimumItemLevel
      })
    : undefined;
  if (!url) return <span className="text-xs text-stone-600">Unavailable</span>;

  const listingCount =
    row.kind === 'priced'
      ? row.candidate.price.listingCount
      : row.kind === 'dust-unavailable'
        ? row.candidate.listingCount
        : undefined;
  const lowStock =
    listingCount !== undefined && listingCount < disenchantLowStockThreshold;

  return (
    <span className="group relative inline-flex">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="relative inline-flex size-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-stone-300 outline-none hover:border-amber-300/30 hover:bg-amber-300/10 hover:text-amber-200 focus-visible:ring-2 focus-visible:ring-amber-300/50"
        aria-label={`Open Trade search for ${row.candidate.name} in a new tab${lowStock ? ', low stock' : ''}`}
      >
        <ExternalLink className="size-4" aria-hidden="true" />
        {lowStock ? (
          <PackageMinus
            className="absolute -right-1 -top-1 size-3.5 rounded-full bg-stone-950 text-amber-300"
            aria-hidden="true"
          />
        ) : null}
      </a>
      {lowStock ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute right-0 top-full z-40 mt-2 hidden w-64 rounded-lg border border-white/10 bg-stone-950 p-3 text-left text-xs leading-5 text-stone-400 shadow-2xl group-hover:block group-focus-within:block"
        >
          <span className="block font-medium text-amber-200">Low stock</span>
          poe.ninja reported {listingCount.toLocaleString()} listings. The
          warning starts below {disenchantLowStockThreshold} listings.
        </span>
      ) : null}
    </span>
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
        data-testid="candidate-icon-frame"
        className="grid size-9 shrink-0 place-items-center text-stone-500"
        aria-hidden="true"
      >
        <CandidateIcon iconUrl={iconUrl} label={candidate.name} />
      </span>
      <span className="min-w-0 overflow-hidden">
        <span
          className="block truncate font-medium text-stone-200"
          title={`${candidate.name}${'variant' in candidate && candidate.variant ? `, ${candidate.variant}` : ''}`}
        >
          {candidate.name}
          {'variant' in candidate && candidate.variant
            ? `, ${candidate.variant}`
            : ''}
        </span>
        <span
          className="mt-0.5 block truncate text-xs text-stone-500"
          title={candidate.baseType}
        >
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
  if (!iconUrl || failed) {
    return (
      <span className="text-xs font-semibold text-stone-400">
        {label.slice(0, 1)}
      </span>
    );
  }
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
  return <>ilvl {candidate.itemLevel}</>;
}

function UnpricedBadge() {
  return <span className="text-xs text-stone-500">Unpriced</span>;
}

function DustUnavailableBadge() {
  return <span className="text-xs text-amber-200">Dust unavailable</span>;
}

export function DisenchantPagination({ table }: { table: RankingTable }) {
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
