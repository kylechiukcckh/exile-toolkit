import {
  disenchantItemLevelRange,
  type DisenchantCandidate
} from './disenchant-dataset';

export const disenchantLowStockThreshold = 150;

export function estimateDisenchantGoldFee(
  candidate: Pick<DisenchantCandidate, 'baseDust' | 'quality'>
): number | undefined {
  if (!Number.isFinite(candidate.baseDust) || candidate.baseDust <= 0) {
    return undefined;
  }
  if (candidate.quality !== 0 && candidate.quality !== 20) return undefined;

  const roundedBaseFactor =
    Math.round(Math.pow(candidate.baseDust, 0.45) * 100) / 100;
  return Math.floor(2000 * roundedBaseFactor);
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

export function createDisenchantTradeUrl(input: {
  readonly league: string;
  readonly name: string;
  readonly baseType: string;
  readonly minimumItemLevel?: number;
}): string | undefined {
  const league = input.league.trim();
  const name = input.name.trim();
  const baseType = input.baseType.trim();
  const minimumItemLevel =
    input.minimumItemLevel ?? disenchantItemLevelRange.max;
  if (
    !league ||
    !name ||
    !baseType ||
    !Number.isInteger(minimumItemLevel) ||
    minimumItemLevel < disenchantItemLevelRange.min ||
    minimumItemLevel > disenchantItemLevelRange.max
  ) {
    return undefined;
  }

  const payload = {
    query: {
      status: { option: 'online' },
      name,
      type: baseType,
      stats: [{ type: 'and', filters: [] }],
      filters: {
        misc_filters: {
          filters: { ilvl: { min: minimumItemLevel } }
        }
      }
    },
    sort: { price: 'asc' }
  };

  return `https://www.pathofexile.com/trade/search/${encodeURIComponent(league)}?q=${encodeURIComponent(JSON.stringify(payload))}`;
}
