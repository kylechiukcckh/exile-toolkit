import {
  BadgeDollarSign,
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
import { useState } from 'react';
import { disenchantItemLevelRange } from '@exile-toolkit/domain';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  disenchantVisibleColumnIds,
  type DisenchantCategoryFilter,
  type DisenchantSortColumnId,
  type DisenchantTableState,
  type useDisenchantTableState
} from '@/hooks/use-disenchant-table-state';

import type { RankingTable } from './disenchant-ranking-model';

type Panel = 'filters' | 'efficiency' | 'trade';
type FilterTab = 'price' | 'dust' | 'gold';

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
  activeLeague,
  state,
  issues,
  hiddenCounts,
  update
}: {
  table: RankingTable;
  priceRankingAvailable: boolean;
  activeLeague: string | undefined;
  state: DisenchantTableState;
  issues: readonly string[];
  hiddenCounts: { readonly unpriced: number; readonly dustUnavailable: number };
  update: ReturnType<typeof useDisenchantTableState>['update'];
}) {
  const [openPanel, setOpenPanel] = useState<Panel>();
  const [filterTab, setFilterTab] = useState<FilterTab>('price');
  const activeFilterCount = [
    state.category !== 'all',
    state.minChaosPrice !== undefined,
    state.maxChaosPrice !== undefined,
    state.minDustValue !== undefined,
    state.maxDustValue !== undefined,
    state.minEstimatedGoldFee !== undefined,
    state.maxEstimatedGoldFee !== undefined,
    state.showUnpriced,
    state.showDustUnavailable
  ].filter(Boolean).length;

  return (
    <div className="relative">
      <div className="grid grid-cols-1 gap-3 border-b border-white/8 bg-black/15 p-3 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <div className="relative flex w-full min-w-0 sm:w-60">
            <label htmlFor="disenchant-search" className="sr-only">
              Search unique items
            </label>
            <input
              id="disenchant-search"
              type="search"
              className="h-9 min-w-0 flex-1 rounded-md border border-white/10 bg-black/20 px-3 pr-9 text-sm text-stone-200 outline-none placeholder:text-stone-600 focus-visible:border-amber-300/60 focus-visible:ring-2 focus-visible:ring-amber-300/20"
              placeholder="Filter by name..."
              value={state.search}
              maxLength={100}
              onChange={event => update({ search: event.target.value })}
            />
            {state.search ? (
              <button
                type="button"
                className="absolute right-1 top-1 inline-flex size-7 items-center justify-center rounded text-stone-500 hover:bg-white/5 hover:text-stone-200"
                aria-label="Clear unique search"
                onClick={() => update({ search: '' })}
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <Popover
            open={openPanel === 'filters'}
            onOpenChange={open => setOpenPanel(open ? 'filters' : undefined)}
          >
            <PopoverTrigger asChild>
              <ToolbarButton
                active={openPanel === 'filters'}
                controls="disenchant-filters"
              >
                <span
                  className={`rounded-full p-1 transition-colors ${activeFilterCount ? 'bg-amber-300/80 text-stone-950' : ''}`}
                >
                  <Filter className="size-4" aria-hidden="true" />
                </span>
                Filters
                {activeFilterCount ? (
                  <span className="text-xs tabular-nums text-amber-200">
                    {activeFilterCount}
                  </span>
                ) : null}
              </ToolbarButton>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <FilterPanel
                table={table}
                activeTab={filterTab}
                setActiveTab={setFilterTab}
                priceRankingAvailable={priceRankingAvailable}
                state={state}
                hiddenCounts={hiddenCounts}
                update={update}
                activeFilterCount={activeFilterCount}
                close={() => setOpenPanel(undefined)}
              />
            </PopoverContent>
          </Popover>
          <span
            className="text-xs tabular-nums text-stone-500"
            aria-live="polite"
          >
            {table.getFilteredRowModel().rows.length.toLocaleString()} matching
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-2 xl:justify-end">
          <Popover
            open={openPanel === 'efficiency'}
            onOpenChange={open => setOpenPanel(open ? 'efficiency' : undefined)}
          >
            <PopoverTrigger asChild>
              <ToolbarButton
                active={openPanel === 'efficiency'}
                controls="disenchant-efficiency"
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
          <Popover
            open={openPanel === 'trade'}
            onOpenChange={open => setOpenPanel(open ? 'trade' : undefined)}
          >
            <PopoverTrigger asChild>
              <ToolbarButton
                active={openPanel === 'trade'}
                controls="disenchant-trade-settings"
              >
                <Settings className="size-4" aria-hidden="true" /> Trade
              </ToolbarButton>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <TradePanel
                activeLeague={activeLeague}
                state={state}
                update={update}
                close={() => setOpenPanel(undefined)}
              />
            </PopoverContent>
          </Popover>
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

function FilterPanel({
  table,
  activeTab,
  setActiveTab,
  priceRankingAvailable,
  state,
  hiddenCounts,
  update,
  activeFilterCount,
  close
}: {
  table: RankingTable;
  activeTab: FilterTab;
  setActiveTab: (tab: FilterTab) => void;
  priceRankingAvailable: boolean;
  state: DisenchantTableState;
  hiddenCounts: { readonly unpriced: number; readonly dustUnavailable: number };
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
                    <span className="absolute -right-2.5 -top-2 size-2 rounded-full bg-amber-300 ring-2 ring-stone-900" />
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

      <details className="rounded-md border border-white/8 bg-black/10 px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium text-stone-300">
          Table options
        </summary>
        <div className="mt-3 space-y-3 border-t border-white/8 pt-3">
          <label className="block text-xs text-stone-400">
            Category
            <select
              id="disenchant-category"
              className="mt-2 h-9 w-full rounded-md border border-white/10 bg-stone-900 px-3 text-sm text-stone-200 outline-none"
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
          </label>
          {priceRankingAvailable ? (
            <fieldset className="space-y-2">
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
          <fieldset className="space-y-2">
            <legend className="mb-2 text-xs text-stone-500">
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
                    column.id === 'dustValue') &&
                  !['dustPerChaos', 'estimatedGoldFee', 'efficiency'].includes(
                    column.id
                  )
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
          <MobileSorting
            state={state}
            priceRankingAvailable={priceRankingAvailable}
            update={update}
          />
        </div>
      </details>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="flex-1"
          disabled={!activeFilterCount}
          onClick={() =>
            update({
              category: 'all',
              minChaosPrice: undefined,
              maxChaosPrice: undefined,
              minDustValue: undefined,
              maxDustValue: undefined,
              minEstimatedGoldFee: undefined,
              maxEstimatedGoldFee: undefined,
              showUnpriced: false,
              showDustUnavailable: false
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

  return (
    <div
      className={`space-y-3 ${disabled ? 'pointer-events-none opacity-40' : ''}`}
    >
      <div className="flex items-center justify-between border-b border-white/10 leading-8 font-semibold">
        <div className="inline-flex items-center gap-2">
          {icon}
          {title}
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-amber-300 text-stone-950' : 'bg-stone-800 text-stone-400'}`}
        >
          {active ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="space-y-2">
        <Label className="text-sm">Lower Bound</Label>
        <div className="px-2">
          <Slider
            disabled={disabled}
            min={min}
            max={upper ?? max}
            step={step}
            value={[lower ?? min]}
            onValueChange={([value]) =>
              setLower(value === min ? undefined : value)
            }
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
        <Label className="text-sm">Upper Bound</Label>
        <div className="px-2">
          <Slider
            disabled={disabled}
            min={lower ?? min}
            max={max}
            step={step}
            value={[upper ?? max]}
            onValueChange={([value]) =>
              setUpper(value === max ? undefined : value)
            }
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

function EfficiencyPanel({
  state,
  update,
  close
}: {
  state: DisenchantTableState;
  update: ReturnType<typeof useDisenchantTableState>['update'];
  close: () => void;
}) {
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
        className="gap-2"
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
          <Label
            key={option.value}
            htmlFor={`efficiency-${option.value}`}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-white/10 p-3 hover:bg-white/[0.03] has-[[data-state=checked]]:border-amber-300/40 has-[[data-state=checked]]:bg-amber-300/[0.05]"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-stone-200">
                {option.label}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-stone-500">
                {option.note}
              </span>
            </span>
            <RadioGroupItem
              id={`efficiency-${option.value}`}
              value={option.value}
            />
          </Label>
        ))}
      </RadioGroup>
      {state.rankingMode === 'total-cost' ? (
        <div className="space-y-3 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="gold-valuation-slider" className="text-sm">
              Gold valuation
            </Label>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums">
              {state.goldValueChaosPer10k}
              <BadgeDollarSign className="size-4 text-amber-300" />
              <span className="font-normal text-stone-500">per 10 K</span>
              <Coins className="size-4 text-amber-300" />
            </span>
          </div>
          <Slider
            id="gold-valuation-slider"
            min={0}
            max={50}
            step={1}
            aria-label="Chaos value per ten thousand Gold"
            value={[state.goldValueChaosPer10k]}
            onValueChange={values => {
              const goldValueChaosPer10k = values[0];
              if (goldValueChaosPer10k !== undefined) {
                update({ goldValueChaosPer10k });
              }
            }}
          />
          <div className="grid grid-cols-3 text-xs text-stone-500">
            <span>0</span>
            <div className="flex justify-center">
              <Button
                size="sm"
                variant="secondary"
                className="h-6 text-xs"
                disabled={state.goldValueChaosPer10k === 5}
                onClick={() => update({ goldValueChaosPer10k: 5 })}
                aria-label="Reset gold valuation to default"
              >
                Reset
              </Button>
            </div>
            <span className="text-right">50</span>
          </div>
          <p className="text-xs leading-relaxed text-stone-500">
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
  activeLeague,
  state,
  update,
  close
}: {
  activeLeague: string | undefined;
  state: DisenchantTableState;
  update: ReturnType<typeof useDisenchantTableState>['update'];
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
    state.includeCorrupted === disenchantTableDefaults.includeCorrupted &&
    state.onlineStatus === disenchantTableDefaults.onlineStatus &&
    state.listingTime === disenchantTableDefaults.listingTime;

  return (
    <div id="disenchant-trade-settings" className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-semibold">Trade Settings</h4>
          <span className="max-w-36 truncate rounded-full border border-white/10 px-2 py-0.5 text-xs text-stone-400">
            {activeLeague ?? 'No live league'}
          </span>
        </div>
        <p className="text-sm text-stone-400">
          Configure trade search filters for Path of Exile trade website. Saved
          locally.
        </p>
      </div>

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
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-xs text-red-300">
              Cannot Add Quality
            </span>
            <span className="rounded-md border border-white/10 px-2 py-0.5 text-xs text-stone-400">
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

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={tradeIsDefault}
          onClick={() =>
            update({
              minItemLevel: disenchantTableDefaults.minItemLevel,
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

function CheckControl({
  label,
  checked,
  onCheckedChange
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = controlId(label);
  return (
    <span className="flex min-w-0 items-start gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={value => onCheckedChange(value === true)}
      />
      <label htmlFor={id} className="min-w-0 text-sm text-stone-400">
        {label}
      </label>
    </span>
  );
}

function MobileSorting({
  state,
  priceRankingAvailable,
  update
}: {
  state: DisenchantTableState;
  priceRankingAvailable: boolean;
  update: ReturnType<typeof useDisenchantTableState>['update'];
}) {
  const available = disenchantSortColumnIds.filter(id =>
    id === 'efficiency'
      ? priceRankingAvailable || state.rankingMode === 'dust-per-gold'
      : !['dustPerChaos', 'chaosValue'].includes(id) || priceRankingAvailable
  );
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/8 pt-4 md:hidden">
      <label className="text-xs text-stone-500">
        Sort by
        <select
          className="mt-2 h-9 w-full rounded-md border border-white/10 bg-black/20 px-2 text-sm text-stone-200"
          value={state.sorting[0]?.id ?? 'efficiency'}
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
          {available.map(id => (
            <option key={id} value={id}>
              {sortLabel(id)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-stone-500">
        Direction
        <select
          className="mt-2 h-9 w-full rounded-md border border-white/10 bg-black/20 px-2 text-sm text-stone-200"
          value={state.sorting[0]?.desc ? 'descending' : 'ascending'}
          onChange={event =>
            update({
              sorting: [
                {
                  id: (state.sorting[0]?.id ??
                    'dustValue') as DisenchantSortColumnId,
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
  );
}

function sortLabel(id: DisenchantSortColumnId) {
  return (
    {
      name: 'Unique name',
      chaosValue: 'Chaos price',
      dustValue: 'Dust value',
      dustPerChaos: 'Dust per Chaos',
      efficiency: 'Efficiency'
    } as const
  )[id];
}

function controlId(label: string) {
  return `disenchant-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`;
}
