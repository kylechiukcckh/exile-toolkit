import {
  type DisenchantCandidate,
  type DustUnavailableItem,
  type PricedDisenchantCandidate
} from '@exile-toolkit/domain';
import {
  columnFilteringFeature,
  columnSizingFeature,
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
  type ReactTable
} from '@tanstack/react-table';

import type {
  DisenchantCategoryFilter,
  DisenchantSortColumnId
} from '@/hooks/use-disenchant-table-state';

interface RankingValues {
  readonly favoriteKey: string;
  readonly favoriteRank: number;
  readonly rankingValue?: number;
  readonly estimatedGoldFee?: number;
  readonly dustPerGold?: number;
}

export type RankingRow = RankingValues &
  (
    | { readonly kind: 'priced'; readonly candidate: PricedDisenchantCandidate }
    | { readonly kind: 'unpriced'; readonly candidate: DisenchantCandidate }
    | {
        readonly kind: 'dust-unavailable';
        readonly candidate: DustUnavailableItem;
      }
  );

export type RankingColumnId =
  | DisenchantSortColumnId
  | 'category'
  | 'estimatedGoldFee'
  | 'favoriteRank'
  | 'item'
  | 'favorite'
  | 'trade';

interface NumberRange {
  readonly min?: number;
  readonly max?: number;
}

function isWithinRange(value: unknown, range: NumberRange) {
  return (
    typeof value === 'number' &&
    (range.min === undefined || value >= range.min) &&
    (range.max === undefined || value <= range.max)
  );
}

export function estimatedGoldFeeFor(row: RankingRow) {
  return row.estimatedGoldFee;
}

export const rankingTableFeatures = tableFeatures({
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  columnSizingFeature,
  columnVisibilityFeature
});

const columnHelper = createColumnHelper<
  typeof rankingTableFeatures,
  RankingRow
>();

export const rankingColumns = columnHelper.columns([
  columnHelper.accessor(row => row.candidate.name, {
    id: 'item',
    header: '',
    size: 44,
    enableSorting: false,
    enableHiding: false
  }),
  columnHelper.accessor(
    row =>
      `${row.candidate.name} ${row.kind === 'priced' ? (row.candidate.variant ?? '') : row.kind === 'dust-unavailable' ? (row.candidate.variant ?? '') : ''}`,
    {
      id: 'name',
      header: 'Name',
      size: 150,
      filterFn: 'includesString',
      sortFn: 'alphanumeric',
      enableHiding: false
    }
  ),
  columnHelper.accessor(
    row =>
      row.kind === 'priced'
        ? row.candidate.price.chaosValue
        : row.kind === 'dust-unavailable'
          ? row.candidate.chaosValue
          : undefined,
    {
      id: 'chaosValue',
      header: 'Price',
      size: 82,
      sortUndefined: 'last',
      sortFn: 'basic',
      filterFn: (row, columnId, range: NumberRange) =>
        isWithinRange(row.getValue(columnId), range)
    }
  ),
  columnHelper.accessor(
    row =>
      row.kind === 'dust-unavailable' ? undefined : row.candidate.dustValue,
    {
      id: 'dustValue',
      header: 'Dust Value',
      size: 125,
      sortUndefined: 'last',
      sortFn: 'basic',
      filterFn: (row, columnId, range: NumberRange) =>
        isWithinRange(row.getValue(columnId), range)
    }
  ),
  columnHelper.accessor(
    row => (row.kind === 'priced' ? row.candidate.dustPerChaos : undefined),
    {
      id: 'dustPerChaos',
      header: 'Dust / Chaos',
      size: 115,
      sortUndefined: 'last',
      sortFn: 'basic'
    }
  ),
  columnHelper.accessor(row => row.rankingValue, {
    id: 'efficiency',
    header: 'Efficiency',
    size: 150,
    sortUndefined: 'last',
    sortFn: 'basic'
  }),
  columnHelper.accessor(row => estimatedGoldFeeFor(row), {
    id: 'estimatedGoldFee',
    header: 'Estimated gold fee',
    size: 110,
    sortUndefined: 'last',
    sortFn: 'basic',
    filterFn: (row, columnId, range: NumberRange) =>
      isWithinRange(row.getValue(columnId), range)
  }),
  columnHelper.accessor(row => row.candidate.name, {
    id: 'trade',
    header: 'Trade Link',
    size: 72,
    enableSorting: false,
    enableHiding: false
  }),
  columnHelper.accessor(row => row.favoriteRank, {
    id: 'favorite',
    header: 'Favorite',
    size: 58,
    enableSorting: false,
    enableHiding: false
  }),
  columnHelper.accessor(row => row.favoriteRank, {
    id: 'favoriteRank',
    header: 'Favorite rank',
    enableHiding: false,
    sortFn: 'basic'
  }),
  columnHelper.accessor(row => row.candidate.category, {
    id: 'category',
    header: 'Category',
    size: 105,
    enableSorting: false,
    filterFn: (row, columnId, value: DisenchantCategoryFilter) =>
      value === 'all' || row.getValue(columnId) === value
  })
]);

export type RankingTable = ReactTable<typeof rankingTableFeatures, RankingRow>;
