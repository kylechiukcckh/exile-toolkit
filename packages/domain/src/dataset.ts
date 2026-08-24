export type DatasetCategory = 'map' | 'map-modifier';
export type VerificationState = 'reviewed';

export interface LicenseMetadata {
  readonly name: string;
  readonly url: string;
}

export interface Provenance {
  readonly source: { readonly name: string; readonly url: string };
  readonly gameVersion: string;
  readonly verification: VerificationState;
  readonly license: LicenseMetadata;
  readonly updatedAt: string;
}

export interface CuratedEntry {
  readonly id: string;
  readonly category: DatasetCategory;
  readonly name: string;
  readonly group?: string;
  readonly provenance: Provenance;
}

export interface CuratedDataset {
  readonly id: string;
  readonly version: string;
  readonly category: DatasetCategory;
  readonly coverage: string;
  readonly entries: readonly CuratedEntry[];
}

export type DatasetValidationResult =
  | { readonly valid: true; readonly dataset: CuratedDataset }
  | { readonly valid: false; readonly issues: readonly string[] };

export function validateCuratedDataset(
  input: unknown
): DatasetValidationResult {
  const issues: string[] = [];

  if (!isRecord(input)) {
    return { valid: false, issues: ['dataset must be an object'] };
  }

  requireNonEmptyString(input, 'id', 'id', issues);
  requireNonEmptyString(input, 'version', 'version', issues);
  requireNonEmptyString(input, 'coverage', 'coverage', issues);

  if (!isDatasetCategory(input.category)) {
    issues.push('category must be "map" or "map-modifier"');
  }

  if (!Array.isArray(input.entries)) {
    issues.push('entries must be an array');
  } else {
    const identifiers = new Set<string>();
    input.entries.forEach((entry, index) => {
      validateEntry(entry, index, input.category, issues);
      if (isRecord(entry) && typeof entry.id === 'string') {
        if (identifiers.has(entry.id)) {
          issues.push(`entries contains duplicate id "${entry.id}"`);
        }
        identifiers.add(entry.id);
      }
    });
  }

  return issues.length === 0
    ? { valid: true, dataset: input as unknown as CuratedDataset }
    : { valid: false, issues };
}

function validateEntry(
  entry: unknown,
  index: number,
  datasetCategory: unknown,
  issues: string[]
) {
  const path = `entries[${index}]`;
  if (!isRecord(entry)) {
    issues.push(`${path} must be an object`);
    return;
  }

  requireNonEmptyString(entry, 'id', `${path}.id`, issues);
  requireNonEmptyString(entry, 'name', `${path}.name`, issues);
  if (!isDatasetCategory(entry.category)) {
    issues.push(`${path}.category must be "map" or "map-modifier"`);
  } else if (entry.category !== datasetCategory) {
    issues.push(`${path}.category must match the Dataset category`);
  }
  if (entry.category === 'map-modifier') {
    requireNonEmptyString(entry, 'group', `${path}.group`, issues);
  }
  validateProvenance(entry.provenance, `${path}.provenance`, issues);
}

function validateProvenance(
  provenance: unknown,
  path: string,
  issues: string[]
) {
  if (!isRecord(provenance)) {
    issues.push(`${path} must be an object`);
    return;
  }

  if (!isRecord(provenance.source)) {
    issues.push(`${path}.source must be an object`);
  } else {
    requireNonEmptyString(
      provenance.source,
      'name',
      `${path}.source.name`,
      issues
    );
    requireUrl(provenance.source, 'url', `${path}.source.url`, issues);
  }

  requireNonEmptyString(
    provenance,
    'gameVersion',
    `${path}.gameVersion`,
    issues
  );
  if (provenance.verification !== 'reviewed') {
    issues.push(`${path}.verification must be "reviewed"`);
  }

  if (!isRecord(provenance.license)) {
    issues.push(`${path}.license must be an object`);
  } else {
    requireNonEmptyString(
      provenance.license,
      'name',
      `${path}.license.name`,
      issues
    );
    requireUrl(provenance.license, 'url', `${path}.license.url`, issues);
  }

  if (!isIsoDateTime(provenance.updatedAt)) {
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

function requireUrl(
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

function isDatasetCategory(value: unknown): value is DatasetCategory {
  return value === 'map' || value === 'map-modifier';
}
