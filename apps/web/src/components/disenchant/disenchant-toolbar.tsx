import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  Clock,
  Coins,
  Filter,
  Gauge,
  Settings,
  Tally1,
  Tally2,
  Tally3,
  Tally4,
  Users,
  Zap,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  disenchantItemLevelRange,
  workspaceCurrencyDisplays,
  type WorkspaceCurrencyDisplay
} from '@exile-toolkit/domain';
import { useSelector } from '@tanstack/react-store';
import type { ColumnFiltersState } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle
} from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  disenchantTableDefaults,
  disenchantSortColumnIds,
  type DisenchantSortColumnId,
  type DisenchantTableState,
  type useDisenchantTableState
} from '@/hooks/use-disenchant-table-state';
import type { RankingTable } from './disenchant-ranking-model';

type Panel = 'filters' | 'efficiency' | 'trade';
type FilterTab = 'price' | 'dust' | 'gold';
type RangeValue = { min?: number; max?: number };
type TableStateChanges = {
  -readonly [
    Key in keyof Omit<DisenchantTableState, 'version'>
  ]?: DisenchantTableState[Key];
};
type RangeBoundKey =
  | 'minChaosPrice'
  | 'maxChaosPrice'
  | 'minDustValue'
  | 'maxDustValue'
  | 'minEstimatedGoldFee'
  | 'maxEstimatedGoldFee';

function getColumnFilterValue<T>(
  filters: ColumnFiltersState,
  columnId: string
) {
  return filters.find(filter => filter.id === columnId)?.value as T | undefined;
}

function updateRangeFilter(
  table: RankingTable,
  columnId: string,
  current: RangeValue | undefined,
  changes: TableStateChanges,
  remaining: TableStateChanges,
  minKey: RangeBoundKey,
  maxKey: RangeBoundKey
) {
  if (!(minKey in changes) && !(maxKey in changes)) return;
  const next = {
    min: minKey in changes ? changes[minKey] : current?.min,
    max: maxKey in changes ? changes[maxKey] : current?.max
  };
  table
    .getColumn(columnId)
    ?.setFilterValue(
      next.min === undefined && next.max === undefined ? undefined : next
    );
  delete remaining[minKey];
  delete remaining[maxKey];
}

const filterCurrencyIcons = {
  chaos: {
    label: 'Chaos Orb',
    src: 'https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyRerollRare.png'
  },
  dust: {
    label: 'Thaumaturgic Dust',
    src: 'https://web.poecdn.com/image/Art/2DItems/Currency/Settlers/DisenchantedMagicDust.png'
  },
  gold: {
    label: 'Gold',
    src: 'https://web.poecdn.com/image/Art/2DItems/Currency/Ruthless/CoinPileTier2.png'
  }
} as const;

function FilterCurrencyIcon({
  kind
}: {
  kind: keyof typeof filterCurrencyIcons;
}) {
  const icon = filterCurrencyIcons[kind];
  return (
    <img
      src={icon.src}
      alt={icon.label}
      title={icon.label}
      className="inline-block size-[18px] object-contain"
      referrerPolicy="no-referrer"
      decoding="async"
      loading="lazy"
    />
  );
}

export function DisenchantToolbar({
  table,
  priceRankingAvailable,
  currencyDisplay,
  onCurrencyDisplayChange,
  state,
  issues,
  update
}: {
  table: RankingTable;
  priceRankingAvailable: boolean;
  currencyDisplay: WorkspaceCurrencyDisplay;
  onCurrencyDisplayChange: (currency: WorkspaceCurrencyDisplay) => void;
  state: DisenchantTableState;
  issues: readonly string[];
  update: ReturnType<typeof useDisenchantTableState>['update'];
}) {
  const [openPanel, setOpenPanel] = useState<Panel>();
  const [filterTab, setFilterTab] = useState<FilterTab>('price');
  const columnFilters = useSelector(table.atoms.columnFilters);
  const search = getColumnFilterValue<string>(columnFilters, 'name') ?? '';
  const priceRange = getColumnFilterValue<RangeValue>(
    columnFilters,
    'chaosValue'
  );
  const dustRange = getColumnFilterValue<RangeValue>(
    columnFilters,
    'dustValue'
  );
  const goldRange = getColumnFilterValue<RangeValue>(
    columnFilters,
    'estimatedGoldFee'
  );
  const displayedState = {
    ...state,
    search,
    minChaosPrice: priceRange?.min,
    maxChaosPrice: priceRange?.max,
    minDustValue: dustRange?.min,
    maxDustValue: dustRange?.max,
    minEstimatedGoldFee: goldRange?.min,
    maxEstimatedGoldFee: goldRange?.max
  };
  const updateThroughTable = (changes: TableStateChanges) => {
    const remaining: TableStateChanges = { ...changes };
    if ('search' in changes) {
      table.getColumn('name')?.setFilterValue(changes.search || undefined);
      delete remaining.search;
    }
    updateRangeFilter(
      table,
      'chaosValue',
      priceRange,
      changes,
      remaining,
      'minChaosPrice',
      'maxChaosPrice'
    );
    updateRangeFilter(
      table,
      'dustValue',
      dustRange,
      changes,
      remaining,
      'minDustValue',
      'maxDustValue'
    );
    updateRangeFilter(
      table,
      'estimatedGoldFee',
      goldRange,
      changes,
      remaining,
      'minEstimatedGoldFee',
      'maxEstimatedGoldFee'
    );
    if (Object.keys(remaining).length > 0) update(remaining);
  };
  const activeFilterCount = [
    displayedState.minChaosPrice !== undefined,
    displayedState.maxChaosPrice !== undefined,
    displayedState.minDustValue !== undefined,
    displayedState.maxDustValue !== undefined,
    displayedState.minEstimatedGoldFee !== undefined,
    displayedState.maxEstimatedGoldFee !== undefined
  ].filter(Boolean).length;

  return (
    <div className="relative">
      <div className="grid grid-cols-6 gap-2 border-b border-white/8 bg-black/15 p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-3">
        <div className="contents lg:flex lg:min-w-0 lg:flex-wrap lg:items-center lg:gap-3">
          <div className="relative order-5 col-span-6 flex w-full min-w-0 lg:order-none lg:w-64">
            <label htmlFor="disenchant-search" className="sr-only">
              Search unique items
            </label>
            <input
              id="disenchant-search"
              type="search"
              className="h-9 min-w-0 flex-1 rounded-md border border-white/10 bg-black/20 px-3 pr-9 text-sm text-stone-200 outline-none placeholder:text-stone-600 focus-visible:border-amber-300/60 focus-visible:ring-2 focus-visible:ring-amber-300/20"
              placeholder="Filter by name or variant..."
              value={displayedState.search}
              maxLength={50}
              onChange={event =>
                updateThroughTable({ search: event.target.value })
              }
            />
            {displayedState.search ? (
              <button
                type="button"
                className="absolute right-1 top-1 inline-flex size-7 items-center justify-center rounded text-stone-500 hover:bg-white/5 hover:text-stone-200"
                aria-label="Clear unique search"
                onClick={() => updateThroughTable({ search: '' })}
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <div className="order-1 col-span-3 lg:order-none lg:col-auto">
            <Popover
              open={openPanel === 'filters'}
              onOpenChange={open => setOpenPanel(open ? 'filters' : undefined)}
            >
              <PopoverTrigger asChild>
                <ToolbarButton
                  active={openPanel === 'filters'}
                  controls="disenchant-filters"
                  className="group h-9 w-full gap-2 lg:w-auto"
                >
                  <span
                    className={`rounded-full p-1 transition-colors ${activeFilterCount ? 'bg-primary/80 text-primary-foreground' : ''}`}
                  >
                    <Filter className="size-4" aria-hidden="true" />
                  </span>
                  Filters
                  {activeFilterCount ? (
                    <span className="inline-flex size-3.5 items-center justify-center rounded-full bg-stone-800 text-[10px] font-bold leading-none text-amber-300 tabular-nums">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </ToolbarButton>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <FilterPanel
                  activeTab={filterTab}
                  setActiveTab={setFilterTab}
                  priceRankingAvailable={priceRankingAvailable}
                  state={displayedState}
                  update={updateThroughTable}
                  activeFilterCount={activeFilterCount}
                  close={() => setOpenPanel(undefined)}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="order-6 col-span-6 lg:order-none lg:col-auto">
            <FilterChips state={displayedState} update={updateThroughTable} />
          </div>
        </div>

        <div className="order-2 col-span-3 lg:hidden">
          <MobileSortingControl
            state={state}
            priceRankingAvailable={priceRankingAvailable}
            update={update}
          />
        </div>

        <div className="contents lg:flex lg:min-w-0 lg:items-center lg:justify-end lg:gap-2">
          <div className="order-3 col-span-3 lg:order-none lg:col-auto">
            <Popover
              open={openPanel === 'efficiency'}
              onOpenChange={open =>
                setOpenPanel(open ? 'efficiency' : undefined)
              }
            >
              <PopoverTrigger asChild>
                <ToolbarButton
                  active={openPanel === 'efficiency'}
                  controls="disenchant-efficiency"
                  className="group h-9 w-full gap-2 lg:w-auto"
                >
                  <Gauge className="size-4" aria-hidden="true" /> Efficiency
                </ToolbarButton>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <EfficiencyPanel
                  state={state}
                  update={update}
                  close={() => setOpenPanel(undefined)}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="order-4 col-span-3 lg:order-none lg:col-auto">
            <Popover
              open={openPanel === 'trade'}
              onOpenChange={open => setOpenPanel(open ? 'trade' : undefined)}
            >
              <PopoverTrigger asChild>
                <ToolbarButton
                  active={openPanel === 'trade'}
                  controls="disenchant-trade-settings"
                  className="group h-9 w-full gap-2 lg:w-auto"
                >
                  <Settings className="size-4" aria-hidden="true" /> Trade
                </ToolbarButton>
              </PopoverTrigger>
              <PopoverContent
                className="w-96 max-w-[calc(100vw-2rem)] overflow-hidden p-0"
                align="end"
              >
                <TradePanel
                  state={state}
                  update={update}
                  currencyDisplay={currencyDisplay}
                  onCurrencyDisplayChange={onCurrencyDisplayChange}
                  close={() => setOpenPanel(undefined)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {issues.map(issue => (
        <p
          key={issue}
          role="status"
          className="px-3 py-2 text-sm text-amber-200"
        >
          {issue}
        </p>
      ))}
    </div>
  );
}

function FilterChips({
  state,
  update
}: {
  state: DisenchantTableState;
  update: ReturnType<typeof useDisenchantTableState>['update'];
}) {
  const chips = [
    state.search
      ? {
          key: 'name',
          label: `Name: ${state.search}`,
          clear: () => update({ search: '' })
        }
      : undefined,
    rangeChip('Price', state.minChaosPrice, state.maxChaosPrice, 'chaos', () =>
      update({ minChaosPrice: undefined, maxChaosPrice: undefined })
    ),
    rangeChip('Dust', state.minDustValue, state.maxDustValue, 'dust', () =>
      update({ minDustValue: undefined, maxDustValue: undefined })
    ),
    rangeChip(
      'Gold',
      state.minEstimatedGoldFee,
      state.maxEstimatedGoldFee,
      'gold',
      () =>
        update({
          minEstimatedGoldFee: undefined,
          maxEstimatedGoldFee: undefined
        })
    )
  ].filter(chip => chip !== undefined);

  if (chips.length === 0) return null;
  return (
    <div className="flex min-w-0 flex-wrap gap-1">
      {chips.map(chip => (
        <span
          key={chip.key}
          data-testid={`${chip.key}-filter-chip`}
          className="inline-flex h-7 min-w-0 items-center gap-1 rounded-md border border-white/10 px-3 text-xs text-stone-300"
        >
          <span className="truncate">{chip.label}</span>
          {'kind' in chip ? <FilterCurrencyIcon kind={chip.kind} /> : null}
          <button
            type="button"
            className="grid size-4 shrink-0 place-items-center rounded-sm text-stone-500 hover:text-stone-100"
            aria-label={`Clear ${chip.key} filter`}
            onClick={chip.clear}
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </span>
      ))}
    </div>
  );
}

function rangeChip(
  key: string,
  min: number | undefined,
  max: number | undefined,
  kind: keyof typeof filterCurrencyIcons,
  clear: () => void
) {
  if (min === undefined && max === undefined) return undefined;
  const range =
    min === undefined
      ? `≤${max?.toLocaleString()}`
      : max === undefined
        ? `≥${min.toLocaleString()}`
        : `${min.toLocaleString()}–${max.toLocaleString()}`;
  return { key: key.toLowerCase(), label: `${key} ${range}`, kind, clear };
}

function ToolbarButton({
  active,
  controls,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'children'> & {
  active: boolean;
  controls: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="group h-9 gap-2"
      aria-expanded={active}
      aria-controls={controls}
      {...props}
    >
      {children}
      <ChevronDown
        className={`size-3 transition-transform ${active ? 'rotate-180' : ''}`}
        aria-hidden="true"
      />
    </Button>
  );
}

function MobileSortingControl({
  state,
  priceRankingAvailable,
  update
}: {
  state: DisenchantTableState;
  priceRankingAvailable: boolean;
  update: ReturnType<typeof useDisenchantTableState>['update'];
}) {
  const [open, setOpen] = useState(false);
  const current = state.sorting[0];
  const available = disenchantSortColumnIds.filter(id =>
    id === 'efficiency'
      ? priceRankingAvailable || state.rankingMode === 'dust-per-gold'
      : !['dustPerChaos', 'chaosValue'].includes(id) || priceRankingAvailable
  );
  const labels: Record<DisenchantSortColumnId, string> = {
    name: 'Name',
    chaosValue: 'Price',
    dustValue: 'Dust Value',
    dustPerChaos: 'Dust / Chaos',
    efficiency: `Efficiency · ${state.rankingMode === 'total-cost' ? 'Total Cost' : 'Gold'}`
  };
  const Direction = current?.desc ? ArrowDown : ArrowUp;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full gap-3 lg:hidden"
          aria-label={`Sort options${current ? `. Current: ${labels[current.id as DisenchantSortColumnId]}, ${current.desc ? 'descending' : 'ascending'}` : ''}`}
        >
          <ArrowUpDown className="size-4" aria-hidden="true" />
          Sort
          <Direction className="size-4 text-stone-500" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[270px] p-1" align="end">
        <div className="grid gap-1" aria-label="Sort options">
          {available.map(id => {
            const active = current?.id === id;
            return (
              <button
                key={id}
                type="button"
                className={`flex h-10 items-center justify-between rounded-md px-3 text-sm hover:bg-white/5 ${active ? 'text-amber-200' : 'text-stone-300'}`}
                onClick={() => {
                  update({
                    sorting: [
                      {
                        id,
                        desc: !active || current?.desc === false
                      }
                    ]
                  });
                  setOpen(false);
                }}
              >
                {labels[id]}
                {active ? (
                  <Direction className="size-4" aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FilterPanel({
  activeTab,
  setActiveTab,
  priceRankingAvailable,
  state,
  update,
  activeFilterCount,
  close
}: {
  activeTab: FilterTab;
  setActiveTab: (tab: FilterTab) => void;
  priceRankingAvailable: boolean;
  state: DisenchantTableState;
  update: ReturnType<typeof useDisenchantTableState>['update'];
  activeFilterCount: number;
  close: () => void;
}) {
  const tabs = [
    { id: 'price', label: 'Price', disabled: !priceRankingAvailable },
    { id: 'dust', label: 'Dust', disabled: false },
    { id: 'gold', label: 'Gold', disabled: false }
  ] as const;
  const visibleTab = activeTab;

  const rangeConfigs = {
    price: {
      title: 'Price',
      icon: <FilterCurrencyIcon kind="chaos" />,
      dotPattern: 'bg-radial-[var(--color-amber-300)_1px,transparent_1px]',
      min: 0,
      max: 500,
      step: 1,
      lower: state.minChaosPrice,
      upper: state.maxChaosPrice,
      disabled: !priceRankingAvailable,
      setLower: (minChaosPrice: number | undefined) =>
        update({ minChaosPrice }),
      setUpper: (maxChaosPrice: number | undefined) => update({ maxChaosPrice })
    },
    dust: {
      title: 'Dust Value',
      icon: <FilterCurrencyIcon kind="dust" />,
      dotPattern: 'bg-radial-[var(--color-indigo-300)_1px,transparent_1px]',
      min: 2_000,
      max: 5_000_000,
      step: 50_000,
      lower: state.minDustValue,
      upper: state.maxDustValue,
      disabled: false,
      setLower: (minDustValue: number | undefined) => update({ minDustValue }),
      setUpper: (maxDustValue: number | undefined) => update({ maxDustValue })
    },
    gold: {
      title: 'Gold Fee',
      icon: <FilterCurrencyIcon kind="gold" />,
      dotPattern: 'bg-radial-[var(--color-yellow-300)_1px,transparent_1px]',
      min: 1_500,
      max: 80_000,
      step: 500,
      lower: state.minEstimatedGoldFee,
      upper: state.maxEstimatedGoldFee,
      disabled: false,
      setLower: (minEstimatedGoldFee: number | undefined) =>
        update({ minEstimatedGoldFee }),
      setUpper: (maxEstimatedGoldFee: number | undefined) =>
        update({ maxEstimatedGoldFee })
    }
  } as const;
  const currentRange = rangeConfigs[visibleTab];

  return (
    <div id="disenchant-filters" className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-semibold">Apply Filter</h4>
        <p className="text-sm text-stone-400 text-pretty">
          Filter items by price, dust value, or gold fee. Saved locally.
        </p>
      </div>

      <Tabs
        value={visibleTab}
        onValueChange={value => setActiveTab(value as FilterTab)}
        className="relative"
      >
        <div
          className={`pointer-events-none absolute inset-0 z-0 -mx-1 -my-1.5 ${currentRange.dotPattern} bg-size-[3px_3px] opacity-30 mask-[radial-gradient(circle_at_center,white_0%,rgba(255,255,255,0.3)_60%,rgba(255,255,255,0.12)_80%,transparent_100%)]`}
        />
        <TabsList className="z-10 w-full">
          {tabs.map(tab => {
            const config = rangeConfigs[tab.id];
            const count =
              Number(config.lower !== undefined) +
              Number(config.upper !== undefined);
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                disabled={tab.disabled}
                aria-label={`Open ${tab.label.toLowerCase()} filter tab`}
                className="gap-2"
              >
                <span className={count ? '' : 'grayscale-80'}>
                  {config.icon}
                </span>
                <span className="relative inline-flex items-center text-xs leading-none">
                  {tab.label}
                  {count ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="absolute -top-1 left-full ml-0.5 inline-flex size-3.5 items-center justify-center rounded-full bg-stone-800 text-[10px] font-bold leading-none text-amber-300"
                      >
                        {count}
                      </span>
                      <span className="sr-only">
                        ({count} active {tab.label.toLowerCase()} filter bounds)
                      </span>
                    </>
                  ) : null}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        <TabsContent value={visibleTab} className="z-10 space-y-4">
          <RangeFilterPanel {...currentRange} />
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="flex-1"
          disabled={!activeFilterCount}
          onClick={() =>
            update({
              minChaosPrice: undefined,
              maxChaosPrice: undefined,
              minDustValue: undefined,
              maxDustValue: undefined,
              minEstimatedGoldFee: undefined,
              maxEstimatedGoldFee: undefined
            })
          }
        >
          Clear All ({activeFilterCount})
        </Button>
        <Button type="button" size="sm" className="flex-1" onClick={close}>
          Close
        </Button>
      </div>
    </div>
  );
}

function RangeFilterPanel({
  title,
  icon,
  min,
  max,
  step,
  lower,
  upper,
  disabled,
  setLower,
  setUpper
}: {
  title: string;
  icon: React.ReactNode;
  dotPattern: string;
  min: number;
  max: number;
  step: number;
  lower: number | undefined;
  upper: number | undefined;
  disabled: boolean;
  setLower: (value: number | undefined) => void;
  setUpper: (value: number | undefined) => void;
}) {
  const hasLower = lower !== undefined;
  const hasUpper = upper !== undefined;
  const active = hasLower || hasUpper;
  const format = (value: number) => value.toLocaleString();
  const handleLowerBoundKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (event.key === 'Home' || event.key === 'End') return;
    const smallStep = 1;
    const largeStep = 10;
    let delta: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        delta = event.shiftKey ? largeStep : smallStep;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        delta = event.shiftKey ? -largeStep : -smallStep;
        break;
      case 'PageUp':
        delta = largeStep;
        break;
      case 'PageDown':
        delta = -largeStep;
        break;
      default:
        return;
    }
    event.preventDefault();
    const next = Math.round(
      Math.min(Math.max((lower ?? min) + delta, min), upper ?? max)
    );
    setLower(next === min ? undefined : next);
  };

  return (
    <div
      className={`space-y-3 ${disabled ? 'pointer-events-none opacity-40' : ''}`}
    >
      <div className="flex items-center justify-between border-b border-white/10 leading-8 font-semibold">
        <div className="inline-flex items-center gap-2">
          {icon}
          {title}
        </div>
        <Badge variant={active ? 'default' : 'secondary'} className="text-xs">
          {active ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      <div className="space-y-2">
        <Label htmlFor="lower-bound" className="text-sm">
          Lower Bound
        </Label>
        <div className="px-2">
          <Slider
            disabled={disabled}
            id="lower-bound"
            min={0}
            max={100}
            step={1}
            value={[linearToLog(lower ?? min, min, upper ?? max)]}
            onValueChange={([value]) => {
              if (value === undefined) return;
              const next = logToLinear(value, min, upper ?? max);
              setLower(next === min ? undefined : next);
            }}
            onKeyDown={handleLowerBoundKeyDown}
            className="w-full py-1.5"
            aria-label={`Lower bound ${title.toLowerCase()} filter`}
          />
        </div>
        <div className="grid grid-cols-3 text-xs text-stone-500">
          <span className="inline-flex items-center gap-1">
            <span className="leading-none">{format(min)}</span>
            {icon}
          </span>
          <div className="flex justify-center">
            <Button
              size="sm"
              variant="secondary"
              disabled={!hasLower}
              onClick={() => setLower(undefined)}
              className="h-6 text-xs"
              aria-label={`Clear lower bound ${title.toLowerCase()} filter`}
            >
              Clear
            </Button>
          </div>
          <span
            className={`inline-flex items-center justify-end gap-1 ${hasLower ? 'text-stone-100' : ''}`}
          >
            <span className="leading-none">
              {hasLower ? format(lower) : 'No limit'}
            </span>
            {hasLower ? icon : null}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="upper-bound" className="text-sm">
          Upper Bound
        </Label>
        <div className="px-2">
          <Slider
            disabled={disabled}
            id="upper-bound"
            min={lower ?? min}
            max={max}
            step={step}
            value={[upper ?? max]}
            onValueChange={([value]) => {
              if (value !== undefined) {
                setUpper(value === max ? undefined : value);
              }
            }}
            className={`w-full py-1.5 ${hasUpper ? '' : 'opacity-60'}`}
            aria-label={`Upper bound ${title.toLowerCase()} filter`}
          />
        </div>
        <div className="grid grid-cols-3 text-xs text-stone-500">
          <span
            className={`inline-flex items-center gap-1 ${hasUpper ? 'text-stone-100' : ''}`}
          >
            <span className="leading-none">
              {hasUpper ? format(upper) : 'No limit'}
            </span>
            {hasUpper ? icon : null}
          </span>
          <div className="flex justify-center">
            <Button
              size="sm"
              variant="secondary"
              disabled={!hasUpper}
              onClick={() => setUpper(undefined)}
              className="h-6 text-xs"
              aria-label={`Clear upper bound ${title.toLowerCase()} filter`}
            >
              Clear
            </Button>
          </div>
          <span className="inline-flex items-center justify-end gap-1">
            <span className="leading-none">{format(max)}</span>
            {icon}
          </span>
        </div>
      </div>
      <div className="min-h-5 border-t border-white/10 pt-2 text-xs leading-[18px] text-stone-500">
        {hasLower && hasUpper ? (
          <>
            Showing items between {format(lower)} {icon} and{' '}
            <span className="inline-flex items-center gap-1">
              {format(upper)} {icon}.
            </span>
          </>
        ) : hasLower ? (
          <>
            Showing items{' '}
            <span className="inline-flex items-center gap-1">
              {format(lower)} {icon}
            </span>{' '}
            and above.
          </>
        ) : hasUpper ? (
          <>
            Showing items{' '}
            <span className="inline-flex items-center gap-1">
              {format(upper)} {icon}
            </span>{' '}
            and below.
          </>
        ) : (
          <>No {title.toLowerCase()} filter applied.</>
        )}
      </div>
    </div>
  );
}

function linearToLog(value: number, min: number, max: number) {
  if (value <= min || max <= min) return 0;
  const logMin = Math.log(min + 1);
  const logMax = Math.log(max + 1);
  return ((Math.log(value + 1) - logMin) / (logMax - logMin)) * 100;
}

function logToLinear(value: number, min: number, max: number) {
  const logMin = Math.log(min + 1);
  const logMax = Math.log(max + 1);
  return Math.round(Math.exp(logMin + (value / 100) * (logMax - logMin)) - 1);
}

function EfficiencyPanel({
  state,
  update,
  close
}: {
  state: DisenchantTableState;
  update: ReturnType<typeof useDisenchantTableState>['update'];
  close: () => void;
}) {
  const [draftGoldValue, setDraftGoldValue] = useState(
    state.goldValueChaosPer10k
  );

  useEffect(() => {
    setDraftGoldValue(state.goldValueChaosPer10k);
  }, [state.goldValueChaosPer10k]);

  const handleResetGoldValue = () => {
    setDraftGoldValue(5);
    update({ goldValueChaosPer10k: 5 });
  };

  return (
    <div id="disenchant-efficiency" className="space-y-4">
      <div className="space-y-1">
        <h4 className="font-semibold">Efficiency Metric</h4>
        <p className="text-sm leading-relaxed text-stone-400">
          Select the calculation used by the Efficiency column.
        </p>
      </div>
      <RadioGroup
        value={state.rankingMode}
        onValueChange={value =>
          update({
            rankingMode: value as DisenchantTableState['rankingMode'],
            sorting: [{ id: 'efficiency', desc: true }]
          })
        }
        aria-label="Efficiency metric"
      >
        {(
          [
            {
              value: 'total-cost',
              label: 'Dust / Total Cost',
              note: 'Adds your Gold valuation and catalyst cost to the item price.'
            },
            {
              value: 'dust-per-gold',
              label: 'Dust / Gold',
              note: 'Dust returned for the estimated gold fee.'
            }
          ] as const
        ).map(option => (
          <FieldLabel key={option.value} htmlFor={`efficiency-${option.value}`}>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>{option.label}</FieldTitle>
                <FieldDescription className="text-xs">
                  {option.note}
                </FieldDescription>
              </FieldContent>
              <RadioGroupItem
                id={`efficiency-${option.value}`}
                value={option.value}
              />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
      {state.rankingMode === 'total-cost' ? (
        <div className="space-y-3 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="gold-valuation-slider" className="text-sm">
              Gold valuation
            </Label>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums">
              {draftGoldValue.toLocaleString(undefined, {
                maximumFractionDigits: 0
              })}
              <FilterCurrencyIcon kind="chaos" />
              <span className="font-normal text-stone-500">per 10 K</span>
              <FilterCurrencyIcon kind="gold" />
            </span>
          </div>
          <Slider
            id="gold-valuation-slider"
            min={0}
            max={50}
            step={1}
            aria-label="Chaos value per ten thousand Gold"
            value={[draftGoldValue]}
            onValueChange={([value]) => {
              if (value !== undefined) setDraftGoldValue(value);
            }}
            onValueCommit={([value]) => {
              if (value !== undefined) update({ goldValueChaosPer10k: value });
            }}
            aria-describedby="gold-valuation-description"
          />
          <div className="grid grid-cols-3 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1">
              0 <FilterCurrencyIcon kind="chaos" />
            </span>
            <div className="flex justify-center">
              <Button
                size="sm"
                variant="secondary"
                className="h-6 text-xs"
                disabled={state.goldValueChaosPer10k === 5}
                onClick={handleResetGoldValue}
                aria-label="Reset gold valuation to default"
              >
                Reset
              </Button>
            </div>
            <span className="inline-flex items-center justify-end gap-1">
              50 <FilterCurrencyIcon kind="chaos" />
            </span>
          </div>
          <p
            id="gold-valuation-description"
            className="text-xs leading-relaxed text-stone-500"
          >
            Sets how much 10,000 Gold is worth to you in Chaos. This value is
            added to the item price when calculating Total Cost.
          </p>
        </div>
      ) : null}
      <Button type="button" size="sm" className="w-full" onClick={close}>
        Close
      </Button>
    </div>
  );
}

function TradePanel({
  state,
  update,
  currencyDisplay,
  onCurrencyDisplayChange,
  close
}: {
  state: DisenchantTableState;
  update: ReturnType<typeof useDisenchantTableState>['update'];
  currencyDisplay: WorkspaceCurrencyDisplay;
  onCurrencyDisplayChange: (currency: WorkspaceCurrencyDisplay) => void;
  close: () => void;
}) {
  const levelIcon =
    state.minItemLevel < 70 ? (
      <Tally1 className="size-4 text-red-400" />
    ) : state.minItemLevel < 75 ? (
      <Tally2 className="size-4 text-amber-500" />
    ) : state.minItemLevel < 80 ? (
      <Tally3 className="size-4 text-amber-300" />
    ) : (
      <Tally4 className="size-4 text-emerald-400" />
    );
  const dustValueLoss = (disenchantItemLevelRange.max - state.minItemLevel) * 5;
  const tradeIsDefault =
    state.minItemLevel === disenchantTableDefaults.minItemLevel &&
    state.minItemQuality === disenchantTableDefaults.minItemQuality &&
    state.includeCorrupted === disenchantTableDefaults.includeCorrupted &&
    state.onlineStatus === disenchantTableDefaults.onlineStatus &&
    state.listingTime === disenchantTableDefaults.listingTime;

  return (
    <div
      id="disenchant-trade-settings"
      className="flex max-h-[calc(var(--radix-popover-content-available-height)-0.5rem)] flex-col"
    >
      <div
        id="disenchant-trade-settings-scroll"
        className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 pb-3"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-semibold">Trade Settings</h4>
            <span className="max-w-36 truncate rounded-full border border-white/10 px-2 py-0.5 text-xs text-stone-400">
              Live Data
            </span>
          </div>
          <p className="text-sm text-stone-400">
            Configure trade search filters for Path of Exile trade website.
            Saved locally.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Coins className="size-4 text-amber-300" />
            <Label htmlFor="disenchant-display-currency" className="text-sm">
              Display Currency
            </Label>
          </div>
          <Select
            value={currencyDisplay}
            onValueChange={value =>
              onCurrencyDisplayChange(value as WorkspaceCurrencyDisplay)
            }
          >
            <SelectTrigger id="disenchant-display-currency">
              <SelectValue placeholder="Select display currency" />
            </SelectTrigger>
            <SelectContent>
              {workspaceCurrencyDisplays.map(currency => (
                <SelectItem key={currency} value={currency}>
                  {currency[0]?.toUpperCase()}
                  {currency.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-stone-500">
            Sets how prices appear in the Ranking.
          </p>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {levelIcon}
              <Label id="min-item-level" className="text-sm">
                Minimum Item Level
              </Label>
            </div>
            <div className="px-2">
              <Slider
                aria-label="Minimum Item Level"
                min={disenchantItemLevelRange.min}
                max={disenchantItemLevelRange.max}
                step={1}
                value={[state.minItemLevel]}
                onValueChange={values => {
                  const minItemLevel = values[0];
                  if (minItemLevel !== undefined) update({ minItemLevel });
                }}
                className="w-full py-1"
              />
            </div>
            <div className="flex justify-between text-xs text-stone-500">
              <span>{disenchantItemLevelRange.min}</span>
              <span className="font-semibold text-stone-100 tabular-nums">
                {state.minItemLevel}
              </span>
              <span>{disenchantItemLevelRange.max}</span>
            </div>
            <p className="text-xs text-stone-500">
              Search will only include items with{' '}
              <span className="font-bold tabular-nums text-stone-300">
                {dustValueLoss === 0 ? 'no ' : `up to ${dustValueLoss}% `}
              </span>
              dust value loss.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Gauge className="size-4 text-cyan-400" />
              <Label id="min-item-quality" className="text-sm">
                Minimum Item Quality
              </Label>
            </div>
            <div className="px-2">
              <Slider
                aria-label="Minimum Item Quality"
                min={0}
                max={20}
                step={1}
                value={[state.minItemQuality]}
                onValueChange={values => {
                  const minItemQuality = values[0];
                  if (minItemQuality !== undefined) update({ minItemQuality });
                }}
                className="w-full py-1"
              />
            </div>
            <div className="flex justify-between text-xs text-stone-500">
              <span>0</span>
              <span className="font-semibold text-stone-100 tabular-nums">
                {state.minItemQuality}
              </span>
              <span>20</span>
            </div>
            <p className="text-xs text-stone-500">
              Search will only include items with at least this much quality.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-red-400" />
                <Label htmlFor="disenchant-corrupted" className="text-sm">
                  Include Corrupted Items
                </Label>
              </div>
              <Checkbox
                id="disenchant-corrupted"
                checked={state.includeCorrupted}
                onCheckedChange={value =>
                  update({ includeCorrupted: value === true })
                }
                className="size-5"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="whitespace-nowrap rounded-md bg-red-500/15 px-2 py-0.5 text-xs text-red-300">
                Cannot Add Quality
              </span>
              <span className="whitespace-nowrap rounded-md border border-white/10 px-2 py-0.5 text-xs text-stone-400">
                Tainted Currency Only
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Corrupted items below 20% quality may return less Dust because
              catalysts cannot be applied normally.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-emerald-400" />
              <Label htmlFor="disenchant-online-status" className="text-sm">
                Online Status
              </Label>
            </div>
            <Select
              value={state.onlineStatus}
              onValueChange={value =>
                update({
                  onlineStatus: value as DisenchantTableState['onlineStatus']
                })
              }
            >
              <SelectTrigger id="disenchant-online-status">
                <SelectValue placeholder="Select online status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">
                  Instant Buyout &amp; In Person
                </SelectItem>
                <SelectItem value="securable">Instant Buyout</SelectItem>
                <SelectItem value="onlineleague">Online in League</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="any">Any</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-stone-500">
              Filter trade listings by seller online status.
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-sky-400" />
            <Label htmlFor="disenchant-listing-time" className="text-sm">
              Listing Time
            </Label>
          </div>
          <Select
            value={state.listingTime}
            onValueChange={value =>
              update({
                listingTime: value as DisenchantTableState['listingTime']
              })
            }
          >
            <SelectTrigger id="disenchant-listing-time">
              <SelectValue placeholder="Select time filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any time</SelectItem>
              <SelectItem value="1hour">1 hour</SelectItem>
              <SelectItem value="3hours">3 hours</SelectItem>
              <SelectItem value="12hours">12 hours</SelectItem>
              <SelectItem value="1day">1 day</SelectItem>
              <SelectItem value="3days">3 days</SelectItem>
              <SelectItem value="1week">1 week</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-stone-500">
            Filter trade listings by when they were posted.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 gap-2 border-t border-white/10 bg-stone-950 p-4">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={tradeIsDefault}
          onClick={() =>
            update({
              minItemLevel: disenchantTableDefaults.minItemLevel,
              minItemQuality: disenchantTableDefaults.minItemQuality,
              includeCorrupted: disenchantTableDefaults.includeCorrupted,
              onlineStatus: disenchantTableDefaults.onlineStatus,
              listingTime: disenchantTableDefaults.listingTime
            })
          }
        >
          Reset
        </Button>
        <Button size="sm" className="flex-1" onClick={close}>
          Close
        </Button>
      </div>
    </div>
  );
}
