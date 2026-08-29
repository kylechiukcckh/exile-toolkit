import type {
  DisenchantCandidate,
  DisenchantCategory
} from './disenchant-dataset';
import { calculateDisenchantDust } from './disenchant-dataset';
import { workspaceLeagues, type WorkspaceLeague } from './workspace-state';

export const requiredDisenchantPriceCategories = [
  'weapon',
  'armour',
  'accessory'
] as const satisfies readonly DisenchantCategory[];

export interface NormalizedPoeNinjaItem {
  readonly id: string;
  readonly name: string;
  readonly baseType: string;
  readonly category: DisenchantCategory;
  readonly variant?: string;
  readonly chaosValue: number;
  readonly listingCount: number;
  readonly detailsId: string;
  readonly iconUrl?: string;
}

export interface PriceSnapshot {
  readonly activeLeague: WorkspaceLeague;
  readonly source: 'poe.ninja';
  readonly retrievedAt: string;
  readonly divineToChaos: number;
  readonly catalystToChaos?: number;
  readonly categories: Readonly<
    Record<DisenchantCategory, readonly NormalizedPoeNinjaItem[]>
  >;
}

export type PriceSnapshotValidationResult =
  | { readonly valid: true; readonly snapshot: PriceSnapshot }
  | { readonly valid: false; readonly issues: readonly string[] };

export interface PricedDisenchantCandidate extends DisenchantCandidate {
  readonly price: NormalizedPoeNinjaItem;
  readonly dustPerChaos: number;
  readonly acquisitionChaosCost: number;
  readonly catalystChaosCost: number;
  readonly shouldCatalyst: boolean;
  readonly variant?: string;
}

export interface DustUnavailableItem extends NormalizedPoeNinjaItem {
  readonly reason: 'dust_unavailable';
}

export interface DisenchantPriceJoin {
  readonly ranked: readonly PricedDisenchantCandidate[];
  readonly unpriced: readonly DisenchantCandidate[];
  readonly dustUnavailable: readonly DustUnavailableItem[];
}

export function normalizePoeNinjaItem(input: {
  readonly id: number;
  readonly name: string;
  readonly baseType: string;
  readonly category?: DisenchantCategory;
  readonly variant?: string;
  readonly chaosValue: number;
  readonly listingCount?: number;
  readonly count?: number;
  readonly detailsId: string;
  readonly icon?: string;
}): NormalizedPoeNinjaItem {
  return {
    id: `${input.category ?? 'accessory'}:${input.id}:${input.detailsId}`,
    name: input.name,
    baseType: input.baseType,
    category: input.category ?? 'accessory',
    ...(input.variant?.trim() ? { variant: input.variant.trim() } : {}),
    chaosValue: input.chaosValue,
    listingCount: input.listingCount ?? input.count ?? 0,
    detailsId: input.detailsId,
    ...(isOfficialPoeCdnUrl(input.icon) ? { iconUrl: input.icon } : {})
  };
}

export function joinDisenchantCandidates(
  candidates: readonly DisenchantCandidate[],
  prices: readonly NormalizedPoeNinjaItem[],
  options: { readonly catalystToChaos?: number } = {}
): DisenchantPriceJoin {
  const candidatesByItem = new Map(
    candidates.map(candidate => [itemKey(candidate), candidate])
  );
  const pricedCandidateIds = new Set<string>();
  const rankedByCandidateVariant = new Map<string, PricedDisenchantCandidate>();
  const dustUnavailable: DustUnavailableItem[] = [];

  for (const price of prices) {
    const candidate = candidatesByItem.get(itemKey(price));
    if (!candidate) {
      dustUnavailable.push({ ...price, reason: 'dust_unavailable' });
      continue;
    }
    if (!Number.isFinite(price.chaosValue) || price.chaosValue <= 0) continue;

    pricedCandidateIds.add(candidate.id);
    const qualityChoice = chooseCandidateQuality(
      candidate,
      price.chaosValue,
      options.catalystToChaos
    );
    const pricedCandidate: PricedDisenchantCandidate = {
      ...qualityChoice,
      price,
      ...(price.variant ? { variant: price.variant } : {}),
      acquisitionChaosCost: price.chaosValue + qualityChoice.catalystChaosCost,
      dustPerChaos:
        qualityChoice.dustValue /
        (price.chaosValue + qualityChoice.catalystChaosCost)
    };
    const rankingKey = `${candidate.id}\u0000${price.variant ?? ''}`;
    const current = rankedByCandidateVariant.get(rankingKey);
    if (
      !current ||
      price.chaosValue < current.price.chaosValue ||
      (price.chaosValue === current.price.chaosValue &&
        price.listingCount > current.price.listingCount)
    ) {
      rankedByCandidateVariant.set(rankingKey, pricedCandidate);
    }
  }

  const ranked = [...rankedByCandidateVariant.values()];
  return {
    ranked: ranked.sort(
      (left, right) => right.dustPerChaos - left.dustPerChaos
    ),
    unpriced: candidates.filter(
      candidate => !pricedCandidateIds.has(candidate.id)
    ),
    dustUnavailable
  };
}

function chooseCandidateQuality(
  candidate: DisenchantCandidate,
  itemChaosCost: number,
  catalystToChaos: number | undefined
): DisenchantCandidate & {
  readonly catalystChaosCost: number;
  readonly shouldCatalyst: boolean;
} {
  if (candidate.category !== 'accessory' || candidate.quality === 0) {
    return {
      ...candidate,
      catalystChaosCost: 0,
      shouldCatalyst: false
    };
  }

  const quality0Dust = calculateDisenchantDust(
    candidate.baseDust,
    candidate.itemLevel,
    0,
    candidate.influenceCount
  );
  const quality20Dust = calculateDisenchantDust(
    candidate.baseDust,
    candidate.itemLevel,
    20,
    candidate.influenceCount
  );
  const catalystChaosCost =
    catalystToChaos !== undefined && catalystToChaos > 0
      ? catalystToChaos * 20
      : undefined;
  const shouldCatalyst =
    catalystChaosCost !== undefined &&
    quality20Dust / (itemChaosCost + catalystChaosCost) >
      quality0Dust / itemChaosCost;

  return {
    ...candidate,
    quality: shouldCatalyst ? 20 : 0,
    dustValue: shouldCatalyst ? quality20Dust : quality0Dust,
    catalystChaosCost: shouldCatalyst ? catalystChaosCost : 0,
    shouldCatalyst
  };
}

export function validatePriceSnapshot(
  input: unknown
): PriceSnapshotValidationResult {
  const issues: string[] = [];
  if (!isRecord(input))
    return { valid: false, issues: ['snapshot must be an object'] };

  if (!workspaceLeagues.includes(input.activeLeague as WorkspaceLeague)) {
    issues.push('activeLeague must be a supported workspace league');
  }
  if (input.source !== 'poe.ninja') issues.push('source must be poe.ninja');
  if (!isIsoDateTime(input.retrievedAt)) {
    issues.push('retrievedAt must be an ISO date-time string');
  }
  if (!isPositiveNumber(input.divineToChaos)) {
    issues.push('divineToChaos must be a positive number');
  }
  if (
    input.catalystToChaos !== undefined &&
    !isPositiveNumber(input.catalystToChaos)
  ) {
    issues.push('catalystToChaos must be a positive number when present');
  }
  if (!isRecord(input.categories)) {
    issues.push('categories must be an object');
  } else {
    for (const category of requiredDisenchantPriceCategories) {
      const lines = input.categories[category];
      if (!Array.isArray(lines)) {
        issues.push(`categories.${category} must be an array`);
        continue;
      }
      lines.forEach((line, index) =>
        validatePriceLine(line, category, index, issues)
      );
    }
  }

  return issues.length
    ? { valid: false, issues }
    : { valid: true, snapshot: input as unknown as PriceSnapshot };
}

function validatePriceLine(
  line: unknown,
  category: DisenchantCategory,
  index: number,
  issues: string[]
) {
  const path = `categories.${category}[${index}]`;
  if (!isRecord(line)) {
    issues.push(`${path} must be an object`);
    return;
  }
  for (const key of ['id', 'name', 'baseType', 'detailsId'] as const) {
    if (typeof line[key] !== 'string' || !line[key].trim()) {
      issues.push(`${path}.${key} must be a non-empty string`);
    }
  }
  if (line.category !== category)
    issues.push(`${path}.category must be ${category}`);
  if (!Number.isFinite(line.chaosValue)) {
    issues.push(`${path}.chaosValue must be a finite number`);
  }
  if (
    typeof line.listingCount !== 'number' ||
    !Number.isInteger(line.listingCount) ||
    line.listingCount < 0
  ) {
    issues.push(`${path}.listingCount must be a non-negative integer`);
  }
  if (line.variant !== undefined && typeof line.variant !== 'string') {
    issues.push(`${path}.variant must be a string`);
  }
  if (line.iconUrl !== undefined && !isOfficialPoeCdnUrl(line.iconUrl)) {
    issues.push(`${path}.iconUrl must use the official PoE CDN`);
  }
}

function itemKey(
  item: Pick<NormalizedPoeNinjaItem | DisenchantCandidate, 'name' | 'baseType'>
) {
  return `${item.name}\u0000${item.baseType}`;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isHttpUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\/[^\s]+$/i.test(value);
}

function isOfficialPoeCdnUrl(value: unknown): value is string {
  return isHttpUrl(value) && /^https:\/\/web\.poecdn\.com\//i.test(value);
}

function isIsoDateTime(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return new Date(value).toISOString() === value;
  } catch {
    return false;
  }
}
