import type {
  ColumnFiltersState,
  ColumnVisibilityState,
  SortingState
} from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type DisenchantCategoryFilter =
  'all' | 'weapon' | 'armour' | 'accessory';
export const disenchantPageSizes = [10, 20, 30, 40, 50] as const;
export type DisenchantPageSize = (typeof disenchantPageSizes)[number];
export const disenchantSortColumnIds = [
  'name',
  'chaosValue',
  'dustValue',
  'dustPerChaos'
] as const;
export type DisenchantSortColumnId = (typeof disenchantSortColumnIds)[number];
export const disenchantVisibleColumnIds = [
  'category',
  'dustValue',
  'chaosValue',
  'dustPerChaos'
] as const;
export type DisenchantVisibleColumnId =
  (typeof disenchantVisibleColumnIds)[number];

export interface DisenchantTableState {
  readonly version: 1;
  readonly rankingMode: 'dust-per-chaos';
  readonly search: string;
  readonly category: DisenchantCategoryFilter;
  readonly maxChaosPrice: number | undefined;
  readonly minDustValue: number | undefined;
  readonly showUnpriced: boolean;
  readonly showDustUnavailable: boolean;
  readonly sorting: SortingState;
  readonly columnVisibility: ColumnVisibilityState;
  readonly pageSize: DisenchantPageSize;
}

const storageKey = 'exile-toolkit.disenchant-state.v1';
const sortableColumns = new Set<string>(disenchantSortColumnIds);
const visibleColumns = new Set<string>(disenchantVisibleColumnIds);
const pageSizes = new Set<number>(disenchantPageSizes);

export const disenchantTableDefaults: DisenchantTableState = {
  version: 1,
  rankingMode: 'dust-per-chaos',
  search: '',
  category: 'all',
  maxChaosPrice: undefined,
  minDustValue: undefined,
  showUnpriced: false,
  showDustUnavailable: false,
  sorting: [{ id: 'dustPerChaos', desc: true }],
  columnVisibility: {},
  pageSize: 10
};

export function useDisenchantTableState() {
  const initial = useMemo(loadState, []);
  const [state, setState] = useState(initial.state);
  const [issues, setIssues] = useState(initial.issues);
  const stateRef = useRef(initial.state);

  useEffect(() => {
    if (initial.issues.length === 0) return;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      setIssues(current => [
        ...current,
        'Could not reset saved Disenchant table settings in this browser.'
      ]);
    }
  }, [initial.issues]);

  const update = useCallback(
    (changes: Partial<Omit<DisenchantTableState, 'version'>>) => {
      const next = { ...stateRef.current, ...changes };
      stateRef.current = next;
      setState(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        setIssues(current => [
          ...current,
          'Could not save Disenchant table settings in this browser.'
        ]);
      }
    },
    []
  );

  return { state, issues, update };
}

export function toColumnFilters(
  state: DisenchantTableState
): ColumnFiltersState {
  return [
    { id: 'name', value: state.search },
    { id: 'category', value: state.category },
    { id: 'chaosValue', value: state.maxChaosPrice },
    { id: 'dustValue', value: state.minDustValue }
  ].filter(filter => filter.value !== undefined && filter.value !== '');
}

export function isDisenchantPageSize(
  value: number
): value is DisenchantPageSize {
  return pageSizes.has(value);
}

function loadState(): {
  readonly state: DisenchantTableState;
  readonly issues: readonly string[];
} {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return { state: disenchantTableDefaults, issues: [] };
    const state = sanitizeState(JSON.parse(saved));
    return state
      ? { state, issues: [] }
      : {
          state: disenchantTableDefaults,
          issues: ['Saved Disenchant table settings were reset.']
        };
  } catch {
    return {
      state: disenchantTableDefaults,
      issues: ['Saved Disenchant table settings were reset.']
    };
  }
}

function sanitizeState(value: unknown): DisenchantTableState | undefined {
  if (!isRecord(value) || value.version !== 1) return undefined;
  if (value.rankingMode !== 'dust-per-chaos') return undefined;
  if (typeof value.search !== 'string' || value.search.length > 100) {
    return undefined;
  }
  if (!isCategory(value.category)) return undefined;
  if (!isOptionalNonNegativeNumber(value.maxChaosPrice)) return undefined;
  if (!isOptionalNonNegativeNumber(value.minDustValue)) return undefined;
  if (typeof value.showUnpriced !== 'boolean') return undefined;
  if (typeof value.showDustUnavailable !== 'boolean') return undefined;
  if (!isSorting(value.sorting)) return undefined;
  if (!isVisibility(value.columnVisibility)) return undefined;
  if (typeof value.pageSize !== 'number' || !pageSizes.has(value.pageSize)) {
    return undefined;
  }

  return {
    version: 1,
    rankingMode: 'dust-per-chaos',
    search: value.search,
    category: value.category,
    maxChaosPrice: value.maxChaosPrice as number | undefined,
    minDustValue: value.minDustValue as number | undefined,
    showUnpriced: value.showUnpriced,
    showDustUnavailable: value.showDustUnavailable,
    sorting: value.sorting,
    columnVisibility: value.columnVisibility,
    pageSize: value.pageSize as DisenchantTableState['pageSize']
  };
}

function isSorting(value: unknown): value is SortingState {
  return (
    Array.isArray(value) &&
    value.length === 1 &&
    isRecord(value[0]) &&
    typeof value[0].id === 'string' &&
    sortableColumns.has(value[0].id) &&
    typeof value[0].desc === 'boolean'
  );
}

function isVisibility(value: unknown): value is ColumnVisibilityState {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([key, visible]) =>
        visibleColumns.has(key) && typeof visible === 'boolean'
    )
  );
}

function isCategory(value: unknown): value is DisenchantCategoryFilter {
  return (
    value === 'all' ||
    value === 'weapon' ||
    value === 'armour' ||
    value === 'accessory'
  );
}

function isOptionalNonNegativeNumber(value: unknown) {
  return (
    value === undefined ||
    (typeof value === 'number' && Number.isFinite(value) && value >= 0)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
