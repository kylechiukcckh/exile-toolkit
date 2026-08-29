import {
  ChevronDown,
  Gauge,
  Settings,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useState } from 'react';
import { disenchantItemLevelRange } from '@exile-toolkit/domain';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
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

  function togglePanel(panel: Panel) {
    setOpenPanel(current => (current === panel ? undefined : panel));
  }

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
          <ToolbarButton
            active={openPanel === 'filters'}
            controls="disenchant-filters"
            onClick={() => togglePanel('filters')}
          >
            <span
              className={`rounded-full p-1 ${activeFilterCount ? 'bg-amber-300/20 text-amber-200' : ''}`}
            >
              <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            </span>
            Filters
            {activeFilterCount ? (
              <span className="text-xs tabular-nums text-amber-200">
                {activeFilterCount}
              </span>
            ) : null}
          </ToolbarButton>
          <span
            className="text-xs tabular-nums text-stone-500"
            aria-live="polite"
          >
            {table.getFilteredRowModel().rows.length.toLocaleString()} matching
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-2 xl:justify-end">
          <ToolbarButton
            active={openPanel === 'efficiency'}
            controls="disenchant-efficiency"
            onClick={() => togglePanel('efficiency')}
          >
            <Gauge className="size-4" aria-hidden="true" /> Efficiency
          </ToolbarButton>
          <ToolbarButton
            active={openPanel === 'trade'}
            controls="disenchant-trade-settings"
            onClick={() => togglePanel('trade')}
          >
            <Settings className="size-4" aria-hidden="true" /> Trade
          </ToolbarButton>
        </div>
      </div>

      {openPanel === 'filters' ? (
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
      ) : null}
      {openPanel === 'efficiency' ? (
        <EfficiencyPanel
          state={state}
          update={update}
          close={() => setOpenPanel(undefined)}
        />
      ) : null}
      {openPanel === 'trade' ? (
        <TradePanel
          activeLeague={activeLeague}
          state={state}
          update={update}
          close={() => setOpenPanel(undefined)}
        />
      ) : null}

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
  onClick,
  children
}: {
  active: boolean;
  controls: string;
  onClick: () => void;
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
      onClick={onClick}
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
    {
      id: 'gold',
      label: 'Gold',
      disabled: state.rankingMode !== 'dust-per-gold'
    }
  ] as const;

  return (
    <PopoverPanel
      id="disenchant-filters"
      align="left"
      title="Filter candidates"
      close={close}
    >
      <p className="text-sm text-stone-500">
        Filter by price, Dust value, or gold fee. Saved locally.
      </p>
      <div
        className="mt-4 grid grid-cols-3 rounded-md bg-black/25 p-1"
        role="tablist"
        aria-label="Filter metric"
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            disabled={tab.disabled}
            aria-selected={activeTab === tab.id}
            className="rounded px-2 py-2 text-xs text-stone-500 disabled:opacity-35 aria-selected:bg-white/8 aria-selected:text-stone-100"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {activeTab === 'price' ? (
          <div className="grid grid-cols-2 gap-3">
            <NumericFilter
              label="Minimum Chaos price"
              value={state.minChaosPrice}
              disabled={!priceRankingAvailable}
              onChange={minChaosPrice => update({ minChaosPrice })}
            />
            <NumericFilter
              label="Maximum Chaos price"
              value={state.maxChaosPrice}
              disabled={!priceRankingAvailable}
              onChange={maxChaosPrice => update({ maxChaosPrice })}
            />
          </div>
        ) : activeTab === 'dust' ? (
          <div className="grid grid-cols-2 gap-3">
            <NumericFilter
              label="Minimum Dust value"
              value={state.minDustValue}
              onChange={minDustValue => update({ minDustValue })}
            />
            <NumericFilter
              label="Maximum Dust value"
              value={state.maxDustValue}
              onChange={maxDustValue => update({ maxDustValue })}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <NumericFilter
              label="Minimum Estimated gold fee"
              value={state.minEstimatedGoldFee}
              disabled={state.rankingMode !== 'dust-per-gold'}
              onChange={minEstimatedGoldFee => update({ minEstimatedGoldFee })}
            />
            <NumericFilter
              label="Maximum Estimated gold fee"
              value={state.maxEstimatedGoldFee}
              disabled={state.rankingMode !== 'dust-per-gold'}
              onChange={maxEstimatedGoldFee => update({ maxEstimatedGoldFee })}
            />
          </div>
        )}
      </div>
      <label className="mt-4 block text-xs text-stone-500">
        Category
        <select
          id="disenchant-category"
          className="mt-2 h-9 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm text-stone-200 outline-none"
          value={state.category}
          onChange={event =>
            update({ category: event.target.value as DisenchantCategoryFilter })
          }
        >
          <option value="all">All categories</option>
          <option value="weapon">Weapon</option>
          <option value="armour">Armour</option>
          <option value="accessory">Accessory</option>
        </select>
      </label>
      {priceRankingAvailable ? (
        <fieldset className="mt-4 space-y-2 border-t border-white/8 pt-4">
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
      <fieldset className="mt-4 space-y-2 border-t border-white/8 pt-4">
        <legend className="mb-2 text-xs text-stone-500">Visible columns</legend>
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
              !['dustPerChaos', 'estimatedGoldFee', 'dustPerGold'].includes(
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
      <div className="mt-4 flex gap-2 border-t border-white/8 pt-4">
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
          Clear all ({activeFilterCount})
        </Button>
        <Button type="button" size="sm" className="flex-1" onClick={close}>
          Done
        </Button>
      </div>
    </PopoverPanel>
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
    <PopoverPanel
      id="disenchant-efficiency"
      align="right"
      title="Efficiency metric"
      close={close}
    >
      <p className="text-sm text-stone-500">
        Choose the value used to rank each item.
      </p>
      <fieldset className="mt-4 space-y-2">
        <legend className="sr-only">Efficiency metric</legend>
        {(
          [
            {
              value: 'dust-per-chaos',
              label: 'Dust / Chaos',
              note: 'Dust returned for each Chaos spent.'
            },
            {
              value: 'dust-per-gold',
              label: 'Dust / Gold',
              note: 'Dust returned for the estimated gold fee.'
            }
          ] as const
        ).map(option => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-white/8 p-3 hover:bg-white/[0.03] has-[:checked]:border-amber-300/30 has-[:checked]:bg-amber-300/[0.04]"
          >
            <input
              type="radio"
              name="disenchant-efficiency"
              value={option.value}
              checked={state.rankingMode === option.value}
              onChange={() =>
                update({
                  rankingMode: option.value,
                  sorting: [
                    {
                      id:
                        option.value === 'dust-per-gold'
                          ? 'dustPerGold'
                          : 'dustPerChaos',
                      desc: true
                    }
                  ]
                })
              }
            />
            <span>
              <span className="block text-sm font-medium text-stone-200">
                {option.label}
              </span>
              <span className="mt-1 block text-xs text-stone-500">
                {option.note}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      <Button type="button" size="sm" className="mt-4 w-full" onClick={close}>
        Done
      </Button>
    </PopoverPanel>
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
  return (
    <PopoverPanel
      id="disenchant-trade-settings"
      align="right"
      title="Trade settings"
      badge={activeLeague ?? 'No live league'}
      close={close}
    >
      <p className="text-sm text-stone-500">
        The minimum item level updates Dust values and every official Trade
        link.
      </p>
      <dl className="mt-4 divide-y divide-white/8 rounded-md border border-white/8 px-3 text-sm">
        <Setting label="League" value={activeLeague ?? 'Unavailable'} />
        <Setting label="Item" value="Exact unique and base" />
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-2.5">
          <dt>
            <label
              htmlFor="disenchant-minimum-item-level"
              className="text-stone-500"
            >
              Minimum item level
            </label>
          </dt>
          <dd>
            <input
              id="disenchant-minimum-item-level"
              type="number"
              min={disenchantItemLevelRange.min}
              max={disenchantItemLevelRange.max}
              step="1"
              className="h-8 w-20 rounded-md border border-white/10 bg-black/20 px-2 text-right tabular-nums text-stone-200 outline-none"
              value={state.minItemLevel}
              onChange={event => {
                const value = event.target.valueAsNumber;
                if (
                  Number.isInteger(value) &&
                  value >= disenchantItemLevelRange.min &&
                  value <= disenchantItemLevelRange.max
                ) {
                  update({ minItemLevel: value });
                }
              }}
            />
          </dd>
        </div>
        <Setting label="Seller status" value="Online" />
        <Setting label="Corrupted items" value="Allowed" />
        <Setting label="Maximum price" value="None" />
      </dl>
      <Button type="button" size="sm" className="mt-4 w-full" onClick={close}>
        Done
      </Button>
    </PopoverPanel>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 py-2.5">
      <dt className="text-stone-500">{label}</dt>
      <dd className="max-w-40 text-right text-stone-200">{value}</dd>
    </div>
  );
}

function PopoverPanel({
  id,
  align,
  title,
  badge,
  close,
  children
}: {
  id: string;
  align: 'left' | 'right';
  title: string;
  badge?: string;
  close: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-full z-30 mt-2 w-[min(20rem,calc(100vw-2.5rem))] rounded-lg border border-white/10 bg-stone-950 p-4 shadow-2xl shadow-black/60`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="font-semibold text-stone-100">{title}</h3>
          {badge ? (
            <span className="truncate rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-stone-400">
              {badge}
            </span>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Close ${title}`}
          onClick={close}
        >
          <X aria-hidden="true" />
        </Button>
      </div>
      {children}
    </div>
  );
}

function NumericFilter({
  label,
  value,
  disabled = false,
  onChange
}: {
  label: string;
  value: number | undefined;
  disabled?: boolean;
  onChange: (value: number | undefined) => void;
}) {
  const id = controlId(label);
  return (
    <label htmlFor={id} className="block text-xs text-stone-500">
      {label}
      <input
        id={id}
        type="number"
        min="0"
        step="any"
        disabled={disabled}
        className="mt-2 h-9 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm tabular-nums text-stone-200 outline-none disabled:opacity-40"
        value={value ?? ''}
        onChange={event => {
          const next = event.target.valueAsNumber;
          onChange(Number.isFinite(next) && next >= 0 ? next : undefined);
        }}
      />
    </label>
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
    id === 'dustPerGold'
      ? state.rankingMode === 'dust-per-gold'
      : !['dustPerChaos', 'chaosValue'].includes(id) || priceRankingAvailable
  );
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/8 pt-4 md:hidden">
      <label className="text-xs text-stone-500">
        Sort by
        <select
          className="mt-2 h-9 w-full rounded-md border border-white/10 bg-black/20 px-2 text-sm text-stone-200"
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
      dustPerGold: 'Dust per Gold'
    } as const
  )[id];
}

function controlId(label: string) {
  return `disenchant-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`;
}
