import {
  disenchantItemLevelRange,
  type DisenchantCandidate
} from './disenchant-dataset';

export const disenchantLowStockThreshold = 150;

export function estimateDisenchantGoldFee(
  candidate: Pick<
    DisenchantCandidate,
    'baseDust' | 'quality' | 'influenceCount'
  >
): number | undefined {
  if (!Number.isFinite(candidate.baseDust) || candidate.baseDust <= 0) {
    return undefined;
  }
  if (candidate.quality !== 0 && candidate.quality !== 20) return undefined;

  const roundedBaseFactor =
    Math.round(Math.pow(candidate.baseDust, 0.45) * 100) / 100;
  const multiplier =
    1 + candidate.quality * 0.02 + candidate.influenceCount * 0.5;
  return Math.floor(2000 * roundedBaseFactor * multiplier);
}

export function calculateDustPerGold(
  dustValue: number,
  estimatedGoldFee: number | undefined
): number | undefined {
  if (
    !Number.isFinite(dustValue) ||
    dustValue <= 0 ||
    estimatedGoldFee === undefined ||
    !Number.isFinite(estimatedGoldFee) ||
    estimatedGoldFee <= 0
  ) {
    return undefined;
  }
  return dustValue / estimatedGoldFee;
}

export function calculateDustPerTotalCost(input: {
  readonly dustValue: number;
  readonly itemChaosCost: number;
  readonly catalystChaosCost: number;
  readonly estimatedGoldFee: number | undefined;
  readonly goldValueChaosPer10k: number;
}): number | undefined {
  if (
    !Number.isFinite(input.dustValue) ||
    input.dustValue <= 0 ||
    !Number.isFinite(input.itemChaosCost) ||
    input.itemChaosCost <= 0 ||
    !Number.isFinite(input.catalystChaosCost) ||
    input.catalystChaosCost < 0 ||
    input.estimatedGoldFee === undefined ||
    !Number.isFinite(input.estimatedGoldFee) ||
    input.estimatedGoldFee <= 0 ||
    !Number.isFinite(input.goldValueChaosPer10k) ||
    input.goldValueChaosPer10k < 0
  ) {
    return undefined;
  }

  const totalChaosCost =
    input.itemChaosCost +
    input.catalystChaosCost +
    input.estimatedGoldFee * (input.goldValueChaosPer10k / 10_000);
  return totalChaosCost > 0 ? input.dustValue / totalChaosCost : undefined;
}

export const disenchantOnlineStatuses = [
  'available',
  'securable',
  'onlineleague',
  'online',
  'any'
] as const;
export type DisenchantOnlineStatus = (typeof disenchantOnlineStatuses)[number];

export const disenchantListingTimes = [
  'any',
  '1hour',
  '3hours',
  '12hours',
  '1day',
  '3days',
  '1week'
] as const;
export type DisenchantListingTime = (typeof disenchantListingTimes)[number];

export function createDisenchantTradeUrl(input: {
  readonly league: string;
  readonly name: string;
  readonly baseType: string;
  readonly minimumItemLevel?: number;
  readonly includeCorrupted?: boolean;
  readonly onlineStatus?: DisenchantOnlineStatus;
  readonly listingTime?: DisenchantListingTime;
}): string | undefined {
  const league = input.league.trim();
  const name = input.name.trim();
  const baseType = input.baseType.trim();
  const minimumItemLevel =
    input.minimumItemLevel ?? disenchantItemLevelRange.max;
  const onlineStatus = input.onlineStatus ?? 'online';
  const listingTime = input.listingTime ?? 'any';
  if (
    !league ||
    !name ||
    !baseType ||
    !Number.isInteger(minimumItemLevel) ||
    minimumItemLevel < disenchantItemLevelRange.min ||
    minimumItemLevel > disenchantItemLevelRange.max ||
    !disenchantOnlineStatuses.includes(onlineStatus) ||
    !disenchantListingTimes.includes(listingTime)
  ) {
    return undefined;
  }

  const payload = {
    query: {
      status: { option: onlineStatus },
      name,
      type: baseType,
      stats: [{ type: 'and', filters: [] }],
      filters: {
        misc_filters: {
          filters: {
            ilvl: { min: minimumItemLevel },
            ...(input.includeCorrupted === undefined
              ? {}
              : {
                  corrupted: {
                    option: input.includeCorrupted ? 'any' : 'false'
                  }
                })
          }
        },
        ...(listingTime === 'any'
          ? {}
          : {
              trade_filters: {
                filters: { indexed: { option: listingTime } }
              }
            })
      }
    },
    sort: { price: 'asc' }
  };

  return `https://www.pathofexile.com/trade/search/${encodeURIComponent(league)}?q=${encodeURIComponent(JSON.stringify(payload))}`;
}
