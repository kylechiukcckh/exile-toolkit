import {
  validatePriceSnapshot,
  type PriceSnapshot
} from './disenchant-pricing';

export const economySnapshotSchemaVersion = 3 as const;

export const lifeforceColors = ['yellow', 'blue', 'purple'] as const;
export type LifeforceColor = (typeof lifeforceColors)[number];

export interface LifeforcePrice {
  readonly chaosPerLifeforce: number;
}

export type LifeforcePrices = Readonly<Record<LifeforceColor, LifeforcePrice>>;

export interface EconomyPriceSnapshot extends PriceSnapshot {
  readonly schemaVersion: typeof economySnapshotSchemaVersion;
  readonly lifeforcePrices: LifeforcePrices;
}

export type EconomyPriceSnapshotValidationResult =
  | { readonly valid: true; readonly snapshot: EconomyPriceSnapshot }
  | { readonly valid: false; readonly issues: readonly string[] };

export type LifeforcePriceNormalizationResult =
  | { readonly valid: true; readonly prices: LifeforcePrices }
  | { readonly valid: false; readonly issues: readonly string[] };

const poeNinjaLifeforceIds = {
  yellow: 'vivid-lifeforce',
  blue: 'primal-lifeforce',
  purple: 'wild-lifeforce'
} as const satisfies Readonly<Record<LifeforceColor, string>>;

export function normalizeLifeforcePrices(
  input: unknown
): LifeforcePriceNormalizationResult {
  if (!isRecord(input) || !isRecord(input.core)) {
    return {
      valid: false,
      issues: ['currency response core must be an object']
    };
  }
  if (input.core.primary !== 'chaos') {
    return {
      valid: false,
      issues: ['currency response primary quote must be chaos']
    };
  }
  if (!Array.isArray(input.lines)) {
    return {
      valid: false,
      issues: ['currency response lines must be an array']
    };
  }

  const prices = {} as Record<LifeforceColor, LifeforcePrice>;
  const issues: string[] = [];
  for (const color of lifeforceColors) {
    const id = poeNinjaLifeforceIds[color];
    const matches = input.lines.filter(
      line => isRecord(line) && line.id === id
    );
    if (matches.length !== 1) {
      issues.push(`${id} must appear exactly once`);
      continue;
    }
    const primaryValue = matches[0]?.primaryValue;
    if (!isPositiveNumber(primaryValue)) {
      issues.push(`${id}.primaryValue must be a finite positive number`);
      continue;
    }
    prices[color] = { chaosPerLifeforce: primaryValue };
  }

  return issues.length > 0 ? { valid: false, issues } : { valid: true, prices };
}

export function validateEconomyPriceSnapshot(
  input: unknown
): EconomyPriceSnapshotValidationResult {
  const base = validatePriceSnapshot(input);
  const issues = base.valid ? [] : [...base.issues];
  if (!isRecord(input)) return { valid: false, issues };

  if (input.schemaVersion !== economySnapshotSchemaVersion) {
    issues.push(`schemaVersion must be ${economySnapshotSchemaVersion}`);
  }
  if (!isRecord(input.lifeforcePrices)) {
    issues.push('lifeforcePrices must be an object');
  } else {
    for (const color of lifeforceColors) {
      const price = input.lifeforcePrices[color];
      if (!isRecord(price) || !isPositiveNumber(price.chaosPerLifeforce)) {
        issues.push(
          `lifeforcePrices.${color}.chaosPerLifeforce must be a finite positive number`
        );
      }
    }
  }

  return issues.length > 0
    ? { valid: false, issues }
    : { valid: true, snapshot: input as unknown as EconomyPriceSnapshot };
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
