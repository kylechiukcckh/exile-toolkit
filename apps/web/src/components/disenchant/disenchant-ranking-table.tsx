import {
  createDisenchantTradeUrl,
  disenchantLowStockThreshold,
  type WorkspaceCurrencyDisplay
} from '@exile-toolkit/domain';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  HandCoins,
  Info,
  PackageMinus,
  Star,
  TriangleAlert
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  disenchantPageSizes,
  type DisenchantTableState
} from '@/hooks/use-disenchant-table-state';

import { CatalystInfo } from './catalyst-info';
import {
  estimatedGoldFeeFor,
  type RankingColumnId,
  type RankingRow,
  type RankingTable
} from './disenchant-ranking-model';
import { DustInfo } from './dust-info';
import { GoldInfo } from './gold-info';
import { TotalCostInfo } from './total-cost-info';

const dustIconUrl =
  'https://web.poecdn.com/image/Art/2DItems/Currency/Settlers/DisenchantedMagicDust.png';
const chaosIconUrl =
  'https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyRerollRare.png';
const divineIconUrl =
  'https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyModValues.png';
const goldIconUrl =
  'https://web.poecdn.com/image/Art/2DItems/Currency/Ruthless/CoinPileTier2.png';
const catalystIconUrl =
  'https://web.poecdn.com/image/Art/2DItems/Currency/Catalysts/ImbuedCatalyst.png';

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
      <table className="hidden w-full min-w-[900px] table-fixed text-left lg:table">
        <thead className="border-b border-white/8 bg-black/15 text-xs text-stone-500">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                const label =
                  header.column.id === 'efficiency'
                    ? `Efficiency · ${rankingMode === 'total-cost' ? 'Total Cost' : 'Gold'}`
                    : header.column.id === 'estimatedGoldFee'
                      ? 'Gold Fee'
                      : String(header.column.columnDef.header);
                const isSorted = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    aria-label={
                      header.column.id === 'favorite' ? 'Favorite' : undefined
                    }
                    className={`h-11 overflow-hidden px-3 text-left font-normal transition-colors select-none ${isSorted ? 'text-amber-300' : 'text-stone-200'} ${header.column.getCanSort() ? 'hover:bg-white/[0.04]' : ''}`}
                    aria-sort={
                      header.column.getIsSorted() === 'asc'
                        ? 'ascending'
                        : header.column.getIsSorted() === 'desc'
                          ? 'descending'
                          : undefined
                    }
                  >
                    {header.column.getCanSort() ? (
                      <span className="flex w-full items-center gap-1">
                        <button
                          type="button"
                          className="inline-flex min-w-0 items-center gap-1 rounded py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
                          aria-label={`Sort by ${label}`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span className="truncate">{label}</span>
                          <ChevronDown
                            className={`size-3.5 shrink-0 transition-all ${isSorted ? '' : 'text-stone-500 opacity-80'} ${isSorted === 'asc' ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                          />
                        </button>
                        {header.column.id === 'dustValue' ? (
                          <span className="ml-auto">
                            <HeaderInfoButton kind="dust" />
                          </span>
                        ) : null}

                        {header.column.id === 'estimatedGoldFee' ? (
                          <span className="ml-auto">
                            <HeaderInfoButton kind="gold" />
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      <HeaderLabel id={header.column.id} label={label} />
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
              className={`h-14 text-sm even:bg-black/25 hover:bg-white/[0.025] ${favorites.includes(row.original.favoriteKey) ? 'bg-amber-300/[0.055]' : ''}`}
            >
              {row.getVisibleCells().map(cell => (
                <td
                  key={cell.id}
                  style={{ width: cell.column.getSize() }}
                  className={`overflow-hidden px-3 py-2 ${['item', 'name'].includes(cell.column.id) ? 'text-left' : 'text-right'} ${cell.column.id === 'dustPerChaos' ? 'border-l border-amber-300/10 bg-gradient-to-r from-amber-400/[0.025] to-transparent' : ''} ${cell.column.id === 'efficiency' ? 'border-l border-amber-300/10 bg-gradient-to-r from-amber-400/[0.045] to-transparent' : ''}`}
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
        className="grid grid-cols-1 gap-3 px-2 py-4 sm:px-3 md:grid-cols-2 lg:hidden"
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
            className={`flex min-w-78 flex-col gap-4 rounded-lg border border-white/10 bg-stone-950/35 p-5 ${favorites.includes(row.original.favoriteKey) ? 'border-amber-300/25 bg-amber-300/[0.055]' : ''}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <CandidateItemIcon row={row.original} large />
              <span className="min-w-0 flex-1">
                <CandidateName row={row.original} />
              </span>
              <FavoriteButton
                row={row.original}
                onToggleFavorite={props.onToggleFavorite}
              />
            </div>
            <div className="grid grid-cols-[0.8fr_1.25fr_1fr] gap-3 text-xs">
              <MobileMetric label="Price">
                <RankingCell
                  columnId="chaosValue"
                  row={row.original}
                  {...props}
                />
              </MobileMetric>
              <MobileMetric
                label="Dust Value"
                info={<MobileHeaderInfo kind="dust" />}
              >
                <RankingCell
                  columnId="dustValue"
                  row={row.original}
                  {...props}
                />
              </MobileMetric>
              <MobileMetric
                label="Gold Fee"
                info={<MobileHeaderInfo kind="gold" />}
                align="right"
              >
                <RankingCell
                  columnId="estimatedGoldFee"
                  row={row.original}
                  {...props}
                />
              </MobileMetric>
            </div>
            <div className="flex items-end justify-between gap-3">
              <MobileMetric label="Dust per Chaos" prominent>
                <RankingCell
                  columnId="dustPerChaos"
                  row={row.original}
                  {...props}
                />
              </MobileMetric>
              {row.original.kind === 'priced' &&
              row.original.candidate.shouldCatalyst ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Catalyst recommendation details"
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-purple-400/25 bg-purple-400/10 px-2 text-xs font-medium text-purple-300"
                    >
                      <CurrencyIcon src={catalystIconUrl} label="Catalyst" />{' '}
                      Catalyst
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[280px] p-4 text-left">
                    <CatalystInfo />
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
            <div className="flex items-end justify-between gap-3">
              <MobileMetric
                label={`Efficiency · ${rankingMode === 'total-cost' ? 'Total Cost' : 'Gold'}`}
              >
                <RankingCell
                  columnId="efficiency"
                  row={row.original}
                  {...props}
                />
              </MobileMetric>
              <MobileLowStock row={row.original} />
            </div>
            <div className="[&_a]:w-full [&_a]:gap-2 [&_a_.mobile-label]:inline">
              <RankingCell columnId="trade" row={row.original} {...props} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MobileMetric({
  label,
  info,
  align = 'left',
  prominent = false,
  children
}: {
  label: string;
  info?: ReactNode;
  align?: 'left' | 'right';
  prominent?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`min-w-0 ${align === 'right' ? 'text-right' : ''}`}>
      <div
        className={`flex h-6 items-center gap-1 text-xs text-stone-500 ${align === 'right' ? 'justify-end' : ''}`}
      >
        <span className="truncate">{label}</span>
        {info}
      </div>
      <div
        className={`mt-1 ${prominent ? 'text-lg font-bold' : 'font-semibold'} [&>span]:justify-start`}
      >
        {children}
      </div>
    </div>
  );
}

function MobileHeaderInfo({ kind }: { kind: 'dust' | 'gold' }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={kind === 'dust' ? 'About Dust Value' : 'About Gold Fee'}
          className="grid size-6 shrink-0 place-items-center rounded text-blue-400"
        >
          <Info className="size-4" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="w-[340px] max-w-[calc(100vw-2rem)] p-4 text-left">
        {kind === 'dust' ? <DustInfo /> : <GoldInfo />}
      </TooltipContent>
    </Tooltip>
  );
}

function MobileLowStock({ row }: { row: RankingRow }) {
  const listingCount =
    row.kind === 'priced'
      ? row.candidate.price.listingCount
      : row.kind === 'dust-unavailable'
        ? row.candidate.listingCount
        : undefined;
  if (listingCount === undefined || listingCount >= disenchantLowStockThreshold)
    return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`Low stock details for ${row.candidate.name}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-amber-400/25 bg-amber-400/10 px-2 text-xs font-medium text-amber-300"
        >
          <PackageMinus className="size-4" aria-hidden="true" /> Low Stock
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[280px] p-3 text-left text-xs leading-5 text-stone-400">
        <span className="block font-medium text-amber-200">Low stock</span>
        poe.ninja reported {listingCount.toLocaleString()} listings. The warning
        starts below {disenchantLowStockThreshold} listings.
      </TooltipContent>
    </Tooltip>
  );
}

function HeaderLabel({ id, label }: { id: string; label: string }) {
  if (id === 'item') return <span className="sr-only">Item icon</span>;
  const kind =
    id === 'dustValue' ? 'dust' : id === 'estimatedGoldFee' ? 'gold' : null;
  if (!kind) return <span className="block truncate">{label}</span>;
  return (
    <span className="flex w-full items-center justify-between gap-1.5">
      <span>{label}</span>
      <HeaderInfoButton kind={kind} />
    </span>
  );
}

function HeaderInfoButton({ kind }: { kind: 'dust' | 'gold' }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={kind === 'gold' ? 'About Gold Fee' : 'About Dust Value'}
          className="grid size-6 place-items-center rounded text-blue-400 outline-none hover:bg-blue-400/10 focus-visible:ring-2 focus-visible:ring-blue-400/50"
        >
          <Info className="size-4" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="w-[460px] max-w-[calc(100vw-2rem)] p-4 text-left text-sm">
        {kind === 'dust' ? <DustInfo /> : <GoldInfo />}
      </TooltipContent>
    </Tooltip>
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
    case 'item':
      return <CandidateItemIcon row={row} />;
    case 'name':
      return <CandidateName row={row} />;
    case 'favorite':
      return <FavoriteButton row={row} onToggleFavorite={onToggleFavorite} />;
    case 'category':
      return (
        <span className="capitalize text-stone-400">
          {row.candidate.category}
        </span>
      );
    case 'dustValue':
      return row.kind === 'dust-unavailable' ? (
        <DustUnavailableBadge />
      ) : row.kind === 'priced' && row.candidate.shouldCatalyst ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              tabIndex={0}
              aria-label="Catalyst recommendation details"
              className="flex w-full items-center justify-between bg-radial from-purple-400/30 to-transparent to-80% outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50"
            >
              <CurrencyIcon
                src={catalystIconUrl}
                label="Catalyst"
                size="large"
              />
              <span className="inline-flex items-center justify-end gap-1.5 font-medium tabular-nums text-amber-100">
                <CompactNumber value={row.candidate.dustValue} />
                <CurrencyIcon src={dustIconUrl} label="Thaumaturgic Dust" />
                <span className="w-8 text-left text-xs font-normal text-stone-500">
                  (q{row.candidate.quality})
                </span>
              </span>
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[290px] p-4 text-left">
            <CatalystInfo />
          </TooltipContent>
        </Tooltip>
      ) : (
        <span className="inline-flex flex-wrap items-center justify-end gap-1.5 font-medium tabular-nums text-amber-100">
          <CompactNumber value={row.candidate.dustValue} />
          <CurrencyIcon src={dustIconUrl} label="Thaumaturgic Dust" />
          <span className="text-xs font-normal text-stone-500">
            (q{row.candidate.quality})
          </span>
        </span>
      );
    case 'chaosValue': {
      if (row.kind === 'unpriced') return <UnpricedBadge />;
      const value =
        row.kind === 'priced'
          ? row.candidate.price.chaosValue
          : row.candidate.chaosValue;
      const divineValue =
        row.kind === 'priced'
          ? row.candidate.price.divineValue
          : row.candidate.divineValue;
      if (!Number.isFinite(value) || value <= 0) return <UnpricedBadge />;
      return (
        <PriceValue
          value={value}
          divineValue={divineValue}
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
        <span className="inline-flex items-center justify-end gap-1.5 tabular-nums text-stone-300">
          <CompactNumber value={fee} />
          <CurrencyIcon src={goldIconUrl} label="Gold" />
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
      ) : rankingMode === 'total-cost' && row.kind === 'priced' ? (
        <TotalCostMetric
          row={row}
          goldValueChaosPer10k={tradeSettings.goldValueChaosPer10k}
        />
      ) : (
        <MetricValue value={row.rankingValue} unit="Gold" />
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
    case 'favoriteRank':
      return null;
  }
}

function TotalCostMetric({
  row,
  goldValueChaosPer10k
}: {
  row: Extract<RankingRow, { kind: 'priced' }>;
  goldValueChaosPer10k: number;
}) {
  const goldCost = estimatedGoldFeeFor(row);
  if (row.rankingValue === undefined || goldCost === undefined) {
    return <UnpricedBadge />;
  }
  const acquisitionChaosCost =
    row.candidate.price.chaosValue + row.candidate.catalystChaosCost;

  return (
    <span className="flex w-full items-center justify-between gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`Show total cost breakdown for ${row.candidate.name}`}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded text-blue-400 outline-none hover:bg-blue-400/10 hover:text-blue-300 focus-visible:ring-2 focus-visible:ring-blue-400/50"
          >
            <Info className="size-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="w-[340px] max-w-[calc(100vw-2rem)] p-4 text-left">
          <TotalCostInfo
            acquisitionChaosCost={acquisitionChaosCost}
            goldCost={goldCost}
            goldValueChaosPer10k={goldValueChaosPer10k}
            shouldCatalyst={row.candidate.shouldCatalyst}
          />
        </TooltipContent>
      </Tooltip>
      <MetricValue value={row.rankingValue} unit="Total Cost" />
    </span>
  );
}

function MetricValue({
  value,
  unit
}: {
  value: number;
  unit: 'Chaos' | 'Gold' | 'Total Cost';
}) {
  return (
    <span className="inline-flex items-center justify-end gap-1 font-medium tabular-nums text-emerald-200">
      <CompactNumber value={value} />
      <CurrencyIcon src={dustIconUrl} label="Thaumaturgic Dust" />
      <span className="text-stone-600">/</span>
      {unit === 'Chaos' ? (
        <CurrencyIcon src={chaosIconUrl} label="Chaos Orb" />
      ) : unit === 'Gold' ? (
        <CurrencyIcon src={goldIconUrl} label="Gold" />
      ) : (
        <HandCoins
          className="size-[18px] text-blue-400"
          aria-label="Total Cost"
        />
      )}
    </span>
  );
}

function PriceValue({
  value,
  divineValue,
  mode,
  divineToChaos
}: {
  value: number;
  divineValue: number | undefined;
  mode: WorkspaceCurrencyDisplay;
  divineToChaos: number | undefined;
}) {
  const convertedDivine =
    divineToChaos !== undefined && divineToChaos > 0
      ? value / divineToChaos
      : undefined;
  const displayedDivine = divineValue ?? convertedDivine;
  const useDivine =
    displayedDivine !== undefined &&
    (mode === 'divine' ||
      (mode === 'smart' &&
        divineValue !== undefined &&
        divineToChaos !== undefined &&
        value >= divineToChaos));
  return (
    <span className="inline-flex items-center justify-end gap-1.5 tabular-nums text-stone-300">
      <CompactNumber
        value={useDivine ? displayedDivine : value}
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

function CurrencyIcon({
  src,
  label,
  size = 'normal'
}: {
  src: string;
  label: string;
  size?: 'normal' | 'large';
}) {
  return (
    <img
      src={src}
      alt={label}
      referrerPolicy="no-referrer"
      className={`${size === 'large' ? 'size-6' : 'size-[18px]'} shrink-0 object-contain`}
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
        minimumItemQuality: tradeSettings.minItemQuality,
        includeCorrupted: tradeSettings.includeCorrupted,
        onlineStatus: tradeSettings.onlineStatus,
        listingTime: tradeSettings.listingTime
      })
    : undefined;
  if (!url) return <span className="text-xs text-stone-600">Unavailable</span>;
  const qualityCannotBeAdded =
    tradeSettings.includeCorrupted &&
    tradeSettings.minItemQuality > 0 &&
    row.kind === 'priced' &&
    row.candidate.shouldCatalyst;
  if (qualityCannotBeAdded) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled
            className="relative inline-flex size-9 cursor-not-allowed items-center justify-center rounded-md bg-stone-800 text-stone-500"
            aria-label={`Trade search disabled for ${row.candidate.name}: quality must be added`}
          >
            <ExternalLink className="size-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="text-xs">
          Trade search disabled because this item needs added quality.
        </TooltipContent>
      </Tooltip>
    );
  }
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
  const action = (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="relative inline-flex size-9 items-center justify-center rounded-md bg-amber-500 text-stone-950 outline-none hover:bg-amber-400 focus-visible:ring-2 focus-visible:ring-amber-300/50"
      aria-label={`Open Trade search for ${row.candidate.name} in a new tab${lowStock ? ', low stock' : ''}${corruptionRisk ? ', corrupted item quality warning' : ''}`}
    >
      <ExternalLink className="size-4" aria-hidden="true" />
      <span className="mobile-label hidden">Trade Search</span>
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
  );
  return lowStock || corruptionRisk ? (
    <Tooltip>
      <TooltipTrigger asChild>{action}</TooltipTrigger>
      <TooltipContent className="w-64 p-3 text-left text-xs leading-5 text-stone-400">
        <span>
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
      </TooltipContent>
    </Tooltip>
  ) : (
    action
  );
}

function CandidateName({
  row
}: {
  row: RankingRow;
  onToggleFavorite?: (favoriteKey: string) => void;
}) {
  const { candidate } = row;
  const variant =
    row.kind === 'priced' || row.kind === 'dust-unavailable'
      ? row.candidate.variant
      : undefined;
  return (
    <span className="block min-w-0 overflow-hidden">
      <span
        className="block truncate font-medium text-stone-200"
        title={candidate.name}
      >
        {candidate.name}
      </span>
      {variant ? (
        <span
          className="mt-0.5 block truncate text-xs text-stone-500"
          title={variant}
        >
          {variant}
        </span>
      ) : null}
    </span>
  );
}

function CandidateItemIcon({
  row,
  large = false
}: {
  row: RankingRow;
  large?: boolean;
}) {
  const iconUrl =
    row.kind === 'priced'
      ? (row.candidate.price.iconUrl ?? row.candidate.iconUrl)
      : row.candidate.iconUrl;
  return (
    <span
      data-testid="candidate-icon-frame"
      className={`grid place-items-center text-stone-500 ${large ? 'size-14' : 'size-10'}`}
      aria-hidden="true"
    >
      <CandidateIcon
        iconUrl={iconUrl}
        label={row.candidate.name}
        large={large}
      />
    </span>
  );
}

function FavoriteButton({
  row,
  onToggleFavorite
}: {
  row: RankingRow;
  onToggleFavorite: (favoriteKey: string) => void;
}) {
  const active = row.favoriteRank > 0;
  return (
    <button
      type="button"
      aria-label={`${active ? 'Remove' : 'Add'} ${row.candidate.name} ${active ? 'from' : 'to'} favorites`}
      aria-pressed={active}
      className="mx-auto grid size-8 place-items-center rounded-md text-stone-600 outline-none hover:bg-amber-300/10 hover:text-amber-300 focus-visible:ring-2 focus-visible:ring-amber-300/50 aria-pressed:text-amber-300"
      onClick={() => onToggleFavorite(row.favoriteKey)}
    >
      <Star
        className="size-4"
        fill={active ? 'currentColor' : 'none'}
        aria-hidden="true"
      />
    </button>
  );
}

function CandidateIcon({
  iconUrl,
  label,
  large = false
}: {
  iconUrl: string | undefined;
  label: string;
  large?: boolean;
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
      className={`${large ? 'size-14' : 'size-8'} object-contain`}
      referrerPolicy="no-referrer"
      src={iconUrl}
      onError={() => setFailed(true)}
    />
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
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          aria-label={content}
          className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50"
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-center font-normal text-stone-300">
        {content}
      </TooltipContent>
    </Tooltip>
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
      className="flex items-baseline justify-between border-t border-white/8 px-3 py-2"
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
          Rows per page
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
