import {
  createDisenchantTradeUrl,
  disenchantLowStockThreshold,
  type DisenchantCandidate,
  type WorkspaceCurrencyDisplay
} from '@exile-toolkit/domain';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  PackageMinus,
  Star,
  TriangleAlert
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

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
const divineIconUrl =
  'https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyModValues.png';

interface RankingTableProps {
  readonly table: RankingTable;
  readonly priceRankingAvailable: boolean;
  readonly rankingMode: DisenchantTableState['rankingMode'];
  readonly activeLeague: string | undefined;
  readonly minimumItemLevel: number;
  readonly currencyDisplay: WorkspaceCurrencyDisplay;
  readonly divineToChaos: number | undefined;
  readonly tradeSettings: DisenchantTableState;
  readonly favorites: readonly string[];
  readonly onToggleFavorite: (favoriteKey: string) => void;
}

export function DisenchantRankingTable(props: RankingTableProps) {
  const { table, rankingMode, favorites } = props;
  return (
    <div className="overflow-x-auto rounded-b-xl">
      <table className="hidden w-full min-w-[900px] table-fixed text-left md:table">
        <thead className="border-b border-white/8 bg-black/15 text-xs text-stone-500">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                const label =
                  header.column.id === 'efficiency'
                    ? `Efficiency - ${rankingMode === 'total-cost' ? 'Total Cost' : 'Gold'}`
                    : String(header.column.columnDef.header);
                return (
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
                    {header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="inline-flex max-w-full items-center gap-1 rounded outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50"
                        aria-label={`Sort by ${label}`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span className="truncate">{label}</span>
                        <ArrowUpDown
                          className="size-3.5 shrink-0"
                          aria-hidden="true"
                        />
                      </button>
                    ) : (
                      <span className="block truncate">{label}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-white/6">
          {table.getRowModel().rows.map(row => (
            <tr
              key={row.id}
              className={`h-14 text-sm hover:bg-white/[0.018] ${favorites.includes(row.original.favoriteKey) ? 'bg-amber-300/[0.055]' : ''}`}
            >
              {row.getVisibleCells().map(cell => (
                <td
                  key={cell.id}
                  style={{ width: cell.column.getSize() }}
                  className={`overflow-hidden px-3 py-2 ${cell.column.id === 'name' ? 'text-left' : 'text-right'}`}
                >
                  <RankingCell
                    columnId={cell.column.id as RankingColumnId}
                    row={row.original}
                    {...props}
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
            : props.priceRankingAvailable
              ? 'Dust per Total Cost ranking'
              : 'Unpriced candidates'
        }
      >
        {table.getRowModel().rows.map(row => (
          <li
            key={row.id}
            className={`p-4 ${favorites.includes(row.original.favoriteKey) ? 'bg-amber-300/[0.055]' : ''}`}
          >
            <CandidateName
              row={row.original}
              onToggleFavorite={props.onToggleFavorite}
            />
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {table
                .getVisibleLeafColumns()
                .filter(column => column.id !== 'name')
                .map(column => (
                  <div key={column.id} className="min-w-0">
                    <dt className="truncate text-xs text-stone-600">
                      {column.id === 'efficiency'
                        ? `Efficiency - ${rankingMode === 'total-cost' ? 'Total Cost' : 'Gold'}`
                        : String(column.columnDef.header)}
                    </dt>
                    <dd className="mt-1 text-stone-400">
                      <RankingCell
                        columnId={column.id as RankingColumnId}
                        row={row.original}
                        {...props}
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
  minimumItemLevel,
  rankingMode,
  currencyDisplay,
  divineToChaos,
  tradeSettings,
  onToggleFavorite
}: RankingTableProps & {
  readonly columnId: RankingColumnId;
  readonly row: RankingRow;
}) {
  switch (columnId) {
    case 'name':
      return <CandidateName row={row} onToggleFavorite={onToggleFavorite} />;
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
        <span className="inline-flex flex-wrap items-center justify-end gap-1.5 font-medium tabular-nums text-amber-100">
          <CompactNumber value={row.candidate.dustValue} />
          <CurrencyIcon src={dustIconUrl} label="Thaumaturgic Dust" />
          <span className="text-xs font-normal text-stone-500">
            (ilvl {row.candidate.itemLevel}, q{row.candidate.quality})
          </span>
          {row.kind === 'priced' && row.candidate.shouldCatalyst ? (
            <InlineTooltip
              content={`Catalyst choice. 20 catalysts add ${row.candidate.catalystChaosCost.toLocaleString()} Chaos to acquisition cost.`}
            >
              <span className="rounded-full border border-purple-400/30 bg-purple-400/10 px-1.5 py-0.5 text-[10px] text-purple-200">
                Catalyst
              </span>
            </InlineTooltip>
          ) : null}
        </span>
      );
    case 'chaosValue': {
      if (row.kind === 'unpriced') return <UnpricedBadge />;
      const value =
        row.kind === 'priced'
          ? row.candidate.price.chaosValue
          : row.candidate.chaosValue;
      if (!Number.isFinite(value) || value <= 0) return <UnpricedBadge />;
      return (
        <PriceValue
          value={value}
          mode={currencyDisplay}
          divineToChaos={divineToChaos}
        />
      );
    }
    case 'dustPerChaos':
      return row.kind === 'priced' ? (
        <MetricValue value={row.candidate.dustPerChaos} unit="Chaos" />
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
    case 'efficiency':
      return row.rankingValue === undefined ? (
        row.kind === 'dust-unavailable' ? (
          <DustUnavailableBadge />
        ) : (
          <UnpricedBadge />
        )
      ) : (
        <MetricValue
          value={row.rankingValue}
          unit={rankingMode === 'total-cost' ? 'Total Cost' : 'Gold'}
        />
      );
    case 'trade':
      return (
        <TradeAction
          row={row}
          activeLeague={activeLeague}
          minimumItemLevel={minimumItemLevel}
          tradeSettings={tradeSettings}
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
    case 'favoriteRank':
      return null;
  }
}

function MetricValue({ value, unit }: { value: number; unit: string }) {
  return (
    <span className="inline-flex items-center justify-end gap-1 font-medium tabular-nums text-emerald-200">
      <CompactNumber value={value} />
      <CurrencyIcon src={dustIconUrl} label="Thaumaturgic Dust" />
      <span className="text-stone-600">/</span>
      <span className="text-xs text-stone-400">{unit}</span>
    </span>
  );
}

function PriceValue({
  value,
  mode,
  divineToChaos
}: {
  value: number;
  mode: WorkspaceCurrencyDisplay;
  divineToChaos: number | undefined;
}) {
  const useDivine =
    divineToChaos !== undefined &&
    divineToChaos > 0 &&
    (mode === 'divine' || (mode === 'smart' && value >= divineToChaos));
  return (
    <span className="inline-flex items-center justify-end gap-1.5 tabular-nums text-stone-300">
      <CompactNumber
        value={useDivine ? value / divineToChaos : value}
        maximumFractionDigits={2}
      />
      <CurrencyIcon
        src={useDivine ? divineIconUrl : chaosIconUrl}
        label={useDivine ? 'Divine Orb' : 'Chaos Orb'}
      />
    </span>
  );
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
  return (
    <InlineTooltip content={full}>
      <span>{Math.abs(value) < 1_000 ? full : compact}</span>
    </InlineTooltip>
  );
}

function CurrencyIcon({ src, label }: { src: string; label: string }) {
  return (
    <img
      src={src}
      alt={label}
      referrerPolicy="no-referrer"
      className="size-[18px] shrink-0 object-contain"
    />
  );
}

function TradeAction({
  row,
  activeLeague,
  minimumItemLevel,
  tradeSettings
}: {
  row: RankingRow;
  activeLeague: string | undefined;
  minimumItemLevel: number;
  tradeSettings: DisenchantTableState;
}) {
  const url = activeLeague
    ? createDisenchantTradeUrl({
        league: activeLeague,
        name: row.candidate.name,
        baseType: row.candidate.baseType,
        minimumItemLevel,
        includeCorrupted: tradeSettings.includeCorrupted,
        onlineStatus: tradeSettings.onlineStatus,
        listingTime: tradeSettings.listingTime
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
  const corruptionRisk =
    tradeSettings.includeCorrupted &&
    row.kind !== 'dust-unavailable' &&
    (row.candidate.category === 'weapon' ||
      row.candidate.category === 'armour');
  return (
    <span className="group relative inline-flex">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="relative inline-flex size-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-stone-300 outline-none hover:border-amber-300/30 hover:bg-amber-300/10 hover:text-amber-200 focus-visible:ring-2 focus-visible:ring-amber-300/50"
        aria-label={`Open Trade search for ${row.candidate.name} in a new tab${lowStock ? ', low stock' : ''}${corruptionRisk ? ', corrupted item quality warning' : ''}`}
      >
        <ExternalLink className="size-4" aria-hidden="true" />
        {lowStock ? (
          <PackageMinus
            className="absolute -right-1 -top-1 size-3.5 rounded-full bg-stone-950 text-amber-300"
            aria-hidden="true"
          />
        ) : null}
        {corruptionRisk ? (
          <TriangleAlert
            className="absolute -left-1 -top-1 size-3.5 rounded-full bg-stone-950 text-amber-300"
            aria-hidden="true"
          />
        ) : null}
      </a>
      {lowStock || corruptionRisk ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute right-0 top-full z-40 mt-2 hidden w-64 rounded-lg border border-white/10 bg-stone-950 p-3 text-left text-xs leading-5 text-stone-400 shadow-2xl group-hover:block group-focus-within:block"
        >
          {lowStock ? (
            <>
              <span className="block font-medium text-amber-200">
                Low stock
              </span>
              poe.ninja reported {listingCount?.toLocaleString()} listings. The
              warning starts below {disenchantLowStockThreshold} listings.
            </>
          ) : null}
          {corruptionRisk ? (
            <span className={lowStock ? 'mt-2 block' : 'block'}>
              <span className="block font-medium text-amber-200">
                Quality warning
              </span>
              This Dust value assumes q20. Corrupted listings below q20 may
              return less Dust.
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}

function CandidateName({
  row,
  onToggleFavorite
}: {
  row: RankingRow;
  onToggleFavorite: (favoriteKey: string) => void;
}) {
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
      <span className="min-w-0 flex-1 overflow-hidden">
        <span
          className="block truncate font-medium text-stone-200"
          title={candidate.name}
        >
          {candidate.name}
        </span>
        <span
          className="mt-0.5 block truncate text-xs text-stone-500"
          title={candidate.baseType}
        >
          {candidate.baseType}
        </span>
      </span>
      <button
        type="button"
        aria-label={`${row.favoriteRank > 0 ? 'Remove' : 'Add'} ${candidate.name} ${row.favoriteRank > 0 ? 'from' : 'to'} favorites`}
        aria-pressed={row.favoriteRank > 0}
        className="grid size-8 shrink-0 place-items-center rounded-md text-stone-600 outline-none hover:text-amber-300 focus-visible:ring-2 focus-visible:ring-amber-300/50 aria-pressed:text-amber-300"
        onClick={() => onToggleFavorite(row.favoriteKey)}
      >
        <Star
          className="size-4"
          fill={row.favoriteRank > 0 ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
      </button>
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
      <span className="text-xs font-semibold text-stone-400">
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
  return <span className="text-xs text-stone-500">Unpriced</span>;
}

function DustUnavailableBadge() {
  return (
    <a
      className="text-xs text-amber-200 underline decoration-amber-200/40 underline-offset-2 hover:text-amber-100"
      href="/data-sources#corrections"
    >
      Dust unavailable
    </a>
  );
}

function InlineTooltip({
  content,
  children
}: {
  content: string;
  children: ReactNode;
}) {
  return (
    <span
      tabIndex={0}
      aria-label={content}
      className="group/tooltip relative inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50"
    >
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-max max-w-64 -translate-x-1/2 rounded-md border border-white/10 bg-stone-950 px-2 py-1 text-center text-xs font-normal text-stone-300 shadow-xl group-hover/tooltip:block group-focus/tooltip:block"
      >
        {content}
      </span>
    </span>
  );
}

export function DisenchantPagination({ table }: { table: RankingTable }) {
  const total = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();
  const { pageIndex, pageSize } = table.state.pagination;
  const start = total === 0 ? 0 : pageIndex * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(total, start + pageSize - 1);
  if (total === 0) return null;
  return (
    <nav
      className="mt-5 flex items-baseline justify-between px-3 py-2"
      aria-label="Candidate pages"
      data-testid="pagination-container"
    >
      <div
        className="min-w-24 text-sm text-stone-500 tabular-nums"
        aria-live="polite"
        data-testid="pagination-summary"
      >
        Showing {start}&ndash;{end} of {total} items.
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 md:gap-6 lg:gap-10">
        <label className="hidden items-center gap-2 text-sm font-semibold text-stone-300 lg:flex">
          Candidates per page
          <select
            className="h-8 w-[70px] rounded-md border border-white/10 bg-stone-900 px-2 text-stone-200 outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40"
            value={pageSize}
            onChange={event => table.setPageSize(Number(event.target.value))}
          >
            {disenchantPageSizes.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className="flex w-[100px] items-center justify-center text-sm font-semibold text-stone-300 tabular-nums">
          Page {pageIndex + 1} of {pageCount}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="hidden size-8 md:flex"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.setPageIndex(0)}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="hidden size-8 md:flex"
            disabled={!table.getCanNextPage()}
            onClick={() => table.setPageIndex(pageCount - 1)}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
