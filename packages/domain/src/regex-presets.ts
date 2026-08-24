import type { DatasetCategory } from './dataset';

export interface BuiltInRegexPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: DatasetCategory;
  readonly entryIds: readonly string[];
  readonly verification: 'reviewed';
}

export interface LocalRegexPreset {
  readonly id: string;
  readonly name: string;
  readonly category: DatasetCategory;
  readonly entryIds: readonly string[];
}

export interface CustomRegexEntry {
  readonly id: string;
  readonly name: string;
  readonly category: DatasetCategory;
}

export interface LocalRegexState {
  readonly presets: readonly LocalRegexPreset[];
  readonly customEntries: readonly CustomRegexEntry[];
}

export interface RegexEntryIdentity {
  readonly id: string;
  readonly name: string;
}

export const MAX_LOCAL_PRESETS = 20;
export const MAX_CUSTOM_ENTRIES = 200;
export const MAX_CUSTOM_ENTRY_LENGTH = 300;
const MAX_PRESET_ENTRIES = 200;
const MAX_IDENTIFIER_LENGTH = 100;

export function sanitizeLocalRegexState(
  input: unknown,
  curatedEntries: Record<DatasetCategory, readonly RegexEntryIdentity[]>
): { readonly state: LocalRegexState; readonly issues: readonly string[] } {
  if (!isRecord(input)) {
    return {
      state: { presets: [], customEntries: [] },
      issues: input == null ? [] : ['Ignored invalid saved regex data.']
    };
  }

  const rawCustomEntries = Array.isArray(input.customEntries)
    ? input.customEntries
    : [];
  const customIssues: string[] = [];
  const customEntries: CustomRegexEntry[] = [];
  const knownIds = new Set(
    Object.values(curatedEntries).flatMap(entries =>
      entries.map(entry => entry.id)
    )
  );
  const knownNames = new Set(
    Object.values(curatedEntries).flatMap(entries =>
      entries.map(entry => normalizeName(entry.name))
    )
  );
  for (const candidate of rawCustomEntries.slice(0, MAX_CUSTOM_ENTRIES * 2)) {
    if (!isCustomEntry(candidate)) {
      customIssues.push('Ignored an invalid Custom entry.');
      continue;
    }
    if (knownIds.has(candidate.id)) {
      customIssues.push('Ignored a Custom entry with a duplicate identifier.');
      continue;
    }
    if (knownNames.has(normalizeName(candidate.name))) {
      customIssues.push(
        'Ignored a Custom entry whose name duplicates an active category entry.'
      );
      continue;
    }
    if (customEntries.length === MAX_CUSTOM_ENTRIES) continue;
    customEntries.push(candidate);
    knownIds.add(candidate.id);
    knownNames.add(normalizeName(candidate.name));
  }
  if (rawCustomEntries.length > customEntries.length + customIssues.length) {
    customIssues.push(
      `Ignored Custom entries beyond the ${MAX_CUSTOM_ENTRIES}-entry limit.`
    );
  }
  const availableIds: Record<DatasetCategory, Set<string>> = {
    map: new Set(curatedEntries.map.map(entry => entry.id)),
    'map-modifier': new Set(
      curatedEntries['map-modifier'].map(entry => entry.id)
    )
  };
  for (const entry of customEntries) availableIds[entry.category].add(entry.id);

  const issues: string[] = [];
  const presets: LocalRegexPreset[] = [];
  const rawPresets = Array.isArray(input.presets) ? input.presets : [];
  for (const candidate of rawPresets.slice(0, MAX_LOCAL_PRESETS)) {
    if (!isLocalPreset(candidate)) {
      issues.push('Ignored an invalid local preset.');
      continue;
    }
    const entryIds = candidate.entryIds
      .slice(0, MAX_PRESET_ENTRIES)
      .filter(id => {
        if (availableIds[candidate.category].has(id)) return true;
        issues.push(
          `Preset "${candidate.name}" ignored unavailable entry "${id}".`
        );
        return false;
      });
    presets.push({ ...candidate, entryIds });
  }
  if (rawPresets.length > MAX_LOCAL_PRESETS) {
    issues.push(
      `Ignored presets beyond the ${MAX_LOCAL_PRESETS}-preset limit.`
    );
  }
  issues.push(...customIssues);

  return { state: { presets, customEntries }, issues };
}

function isLocalPreset(value: unknown): value is LocalRegexPreset {
  return (
    isRecord(value) &&
    isBoundedString(value.id, MAX_IDENTIFIER_LENGTH) &&
    isBoundedString(value.name, MAX_CUSTOM_ENTRY_LENGTH) &&
    isCategory(value.category) &&
    Array.isArray(value.entryIds) &&
    value.entryIds.every(entry => isBoundedString(entry, MAX_IDENTIFIER_LENGTH))
  );
}

function isCustomEntry(value: unknown): value is CustomRegexEntry {
  return (
    isRecord(value) &&
    isBoundedString(value.id, MAX_IDENTIFIER_LENGTH) &&
    isBoundedString(value.name, MAX_CUSTOM_ENTRY_LENGTH) &&
    isCategory(value.category)
  );
}

function isCategory(value: unknown): value is DatasetCategory {
  return value === 'map' || value === 'map-modifier';
}

function isBoundedString(value: unknown, maximum: number): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    Array.from(value).length <= maximum
  );
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
