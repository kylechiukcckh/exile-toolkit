import type { Provenance } from './dataset';

export type DisenchantCategory = 'weapon' | 'armour' | 'accessory';
export type DisenchantQuality = 0 | 20;

export interface DisenchantCandidate {
  readonly id: string;
  readonly name: string;
  readonly baseType: string;
  readonly category: DisenchantCategory;
  readonly baseDust: number;
  readonly dustValue: number;
  readonly itemLevel: 85;
  readonly quality: DisenchantQuality;
  readonly iconUrl?: string;
  readonly upstreamReference?: string;
  readonly provenance: Provenance;
}

export interface DisenchantDataset {
  readonly id: string;
  readonly version: string;
  readonly coverage: string;
  readonly entries: readonly DisenchantCandidate[];
}

export interface DisenchantDatasetManifest {
  readonly id: string;
  readonly version: string;
  readonly coverage: string;
  readonly provenance: Provenance;
}

export type DisenchantDatasetValidationResult =
  | { readonly valid: true; readonly dataset: DisenchantDataset }
  | { readonly valid: false; readonly issues: readonly string[] };

export function calculateDisenchantDust(
  baseDust: number,
  itemLevel: number,
  quality: number
): number {
  if (!Number.isFinite(baseDust) || baseDust <= 0) {
    throw new Error('baseDust must be a positive number');
  }
  if (!Number.isInteger(itemLevel) || itemLevel < 65 || itemLevel > 100) {
    throw new Error('itemLevel must be an integer from 65 to 100');
  }
  if (quality !== 0 && quality !== 20) {
    throw new Error('quality must be 0 or 20');
  }

  return Math.round(baseDust * 125 * (itemLevel - 64) * (1 + quality * 0.02));
}

export function validateDisenchantDataset(
  input: unknown
): DisenchantDatasetValidationResult {
  const issues: string[] = [];
  if (!isRecord(input)) {
    return { valid: false, issues: ['dataset must be an object'] };
  }

  requireNonEmptyString(input, 'id', 'id', issues);
  requireNonEmptyString(input, 'version', 'version', issues);
  requireNonEmptyString(input, 'coverage', 'coverage', issues);

  if (!Array.isArray(input.entries)) {
    issues.push('entries must be an array');
  } else {
    const ids = new Set<string>();
    const candidateIdentities = new Set<string>();
    let previousId: string | undefined;
    let deterministicOrderIssueReported = false;
    input.entries.forEach((entry, index) => {
      validateCandidate(entry, index, issues);
      if (isRecord(entry) && typeof entry.id === 'string') {
        if (ids.has(entry.id)) {
          issues.push(`entries contains duplicate id "${entry.id}"`);
        }
        ids.add(entry.id);
        if (
          previousId !== undefined &&
          entry.id < previousId &&
          !deterministicOrderIssueReported
        ) {
          issues.push(
            'entries must be sorted by id in ascending ordinal order'
          );
          deterministicOrderIssueReported = true;
        }
        previousId = entry.id;
      }
      if (
        isRecord(entry) &&
        typeof entry.name === 'string' &&
        typeof entry.baseType === 'string'
      ) {
        const identity = JSON.stringify([
          entry.name.trim(),
          entry.baseType.trim()
        ]);
        if (candidateIdentities.has(identity)) {
          issues.push(
            `entries contains duplicate name and base type "${entry.name}" / "${entry.baseType}"`
          );
        }
        candidateIdentities.add(identity);
      }
    });
  }

  return issues.length === 0
    ? { valid: true, dataset: input as unknown as DisenchantDataset }
    : { valid: false, issues };
}

function validateCandidate(entry: unknown, index: number, issues: string[]) {
  const path = `entries[${index}]`;
  if (!isRecord(entry)) {
    issues.push(`${path} must be an object`);
    return;
  }

  requireNonEmptyString(entry, 'id', `${path}.id`, issues);
  requireNonEmptyString(entry, 'name', `${path}.name`, issues);
  requireNonEmptyString(entry, 'baseType', `${path}.baseType`, issues);
  if (!isDisenchantCategory(entry.category)) {
    issues.push(`${path}.category must be weapon, armour, or accessory`);
  }
  requirePositiveNumber(entry, 'baseDust', `${path}.baseDust`, issues);
  requirePositiveInteger(entry, 'dustValue', `${path}.dustValue`, issues);
  if (entry.itemLevel !== 85) {
    issues.push(`${path}.itemLevel must be 85`);
  }
  if (entry.quality !== 0 && entry.quality !== 20) {
    issues.push(`${path}.quality must be 0 or 20`);
  }
  if (entry.upstreamReference !== undefined) {
    requireHttpUrl(
      entry,
      'upstreamReference',
      `${path}.upstreamReference`,
      issues
    );
  }
  if (entry.iconUrl !== undefined) {
    requireHttpUrl(entry, 'iconUrl', `${path}.iconUrl`, issues);
  }
  validateProvenance(entry.provenance, `${path}.provenance`, issues);

  if (
    typeof entry.baseDust === 'number' &&
    typeof entry.itemLevel === 'number' &&
    typeof entry.quality === 'number' &&
    typeof entry.dustValue === 'number'
  ) {
    try {
      if (
        calculateDisenchantDust(
          entry.baseDust,
          entry.itemLevel,
          entry.quality
        ) !== entry.dustValue
      ) {
        issues.push(`${path}.dustValue must match the Dust calculation`);
      }
    } catch {
      // The field-level messages above describe the invalid values.
    }
  }
}

function validateProvenance(value: unknown, path: string, issues: string[]) {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return;
  }

  if (!isRecord(value.source)) {
    issues.push(`${path}.source must be an object`);
  } else {
    requireNonEmptyString(value.source, 'name', `${path}.source.name`, issues);
    requireHttpUrl(value.source, 'url', `${path}.source.url`, issues);
  }
  requireNonEmptyString(value, 'gameVersion', `${path}.gameVersion`, issues);
  if (value.verification !== 'reviewed') {
    issues.push(`${path}.verification must be reviewed`);
  }
  if (!isRecord(value.license)) {
    issues.push(`${path}.license must be an object`);
  } else {
    requireNonEmptyString(
      value.license,
      'name',
      `${path}.license.name`,
      issues
    );
    requireHttpUrl(value.license, 'url', `${path}.license.url`, issues);
  }
  if (!isIsoDateTime(value.updatedAt)) {
    issues.push(`${path}.updatedAt must be an ISO date-time string`);
  }
}

function requireNonEmptyString(
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: string[]
) {
  if (typeof record[key] !== 'string' || record[key].trim().length === 0) {
    issues.push(`${path} must be a non-empty string`);
  }
}

function requirePositiveNumber(
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: string[]
) {
  if (
    typeof record[key] !== 'number' ||
    !Number.isFinite(record[key]) ||
    record[key] <= 0
  ) {
    issues.push(`${path} must be a positive number`);
  }
}

function requirePositiveInteger(
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: string[]
) {
  if (!Number.isSafeInteger(record[key]) || (record[key] as number) <= 0) {
    issues.push(`${path} must be a positive integer`);
  }
}

function requireHttpUrl(
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: string[]
) {
  const value = record[key];
  if (typeof value !== 'string' || !/^https?:\/\/[^\s]+$/i.test(value)) {
    issues.push(`${path} must be an HTTP URL`);
  }
}

function isIsoDateTime(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
  ) {
    return false;
  }

  try {
    return new Date(value).toISOString() === value;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDisenchantCategory(value: unknown): value is DisenchantCategory {
  return value === 'weapon' || value === 'armour' || value === 'accessory';
}
