import type { CuratedDataset } from './dataset';
import type { CustomRegexEntry } from './regex-presets';

export interface ReadyRegexPreview {
  readonly status: 'ready';
  readonly parts: readonly RegexPart[];
  readonly selectedIds: readonly string[];
  readonly matched: readonly string[];
  readonly unmatched: readonly string[];
}

export interface RegexPart {
  readonly id: string;
  readonly regex: string;
  readonly characterCount: number;
}

export interface RegexGenerationOptions {
  readonly lengthLimit?: number;
  readonly customEntries?: readonly CustomRegexEntry[];
}

export const REGEX_LENGTH_LIMIT = 250;

export type RegexPreviewResult =
  | ReadyRegexPreview
  | { readonly status: 'empty'; readonly message: string }
  | { readonly status: 'invalid'; readonly message: string };

export function generateRegexPreview(
  dataset: CuratedDataset,
  selection: readonly string[],
  options: RegexGenerationOptions = {}
): RegexPreviewResult {
  const customEntries = (options.customEntries ?? []).filter(
    entry => entry.category === dataset.category
  );
  const entries = [...dataset.entries, ...customEntries];
  const entriesById = new Map(entries.map(entry => [entry.id, entry]));
  const selectedIds = [...new Set(selection)];
  const entryLabel = dataset.category === 'map' ? 'map' : 'modifier';

  if (selectedIds.length === 0) {
    return {
      status: 'empty',
      message: `Select at least one ${entryLabel} to generate a regex.`
    };
  }

  const unknownIds = selectedIds.filter(id => !entriesById.has(id));
  if (unknownIds.length > 0) {
    return {
      status: 'invalid',
      message: `Selection includes ${entryLabel}s that are not in this Dataset: ${unknownIds.join(', ')}.`
    };
  }

  if (entriesById.size !== entries.length) {
    return {
      status: 'invalid',
      message: 'Selection contains entries with duplicate identifiers.'
    };
  }

  const selectedIdSet = new Set(selectedIds);
  for (const id of selectedIds) {
    const selectedEntry = entriesById.get(id);
    const duplicate = entries.find(
      entry =>
        entry.name === selectedEntry?.name && !selectedIdSet.has(entry.id)
    );
    if (duplicate && selectedEntry) {
      return {
        status: 'invalid',
        message: `Selection cannot be represented exactly because "${selectedEntry.name}" is duplicated.`
      };
    }
  }

  const lengthLimit = options.lengthLimit ?? REGEX_LENGTH_LIMIT;
  const alternatives = selectedIds.map(id =>
    escapeRegex(entriesById.get(id)?.name ?? '')
  );
  const exactRegex = `^(?:${alternatives.join('|')})$`;
  const partPatterns =
    characterCount(exactRegex) <= lengthLimit
      ? [exactRegex]
      : splitPatterns(
          selectedIds.map(id => shortestExactToken(entries, id)),
          lengthLimit
        );

  if (!partPatterns) {
    return {
      status: 'invalid',
      message: `The ${lengthLimit}-character limit cannot represent this Selection exactly.`
    };
  }

  const parts = partPatterns.map((regex, index) => ({
    id: `part-${index + 1}`,
    regex,
    characterCount: characterCount(regex)
  }));
  const matchers = parts.map(part => new RegExp(part.regex));
  const matched: string[] = [];
  const unmatched: string[] = [];

  for (const entry of entries) {
    (matchers.some(matcher => matcher.test(entry.name))
      ? matched
      : unmatched
    ).push(entry.id);
  }

  return {
    status: 'ready',
    parts,
    selectedIds,
    matched,
    unmatched
  };
}

function shortestExactToken(
  entries: readonly { readonly id: string; readonly name: string }[],
  targetId: string
) {
  const target = entries.find(entry => entry.id === targetId);
  if (!target) return '';

  const characters = Array.from(target.name);
  for (let length = 1; length <= characters.length; length += 1) {
    for (let start = 0; start + length <= characters.length; start += 1) {
      const token = escapeRegex(
        characters.slice(start, start + length).join('')
      );
      const matcher = new RegExp(token);
      const matches = entries.filter(entry => matcher.test(entry.name));
      if (matches.length === 1 && matches[0]?.id === targetId) return token;
    }
  }

  return `^(?:${escapeRegex(target.name)})$`;
}

function splitPatterns(tokens: readonly string[], lengthLimit: number) {
  const parts: string[] = [];
  let current: string[] = [];

  for (const token of tokens) {
    const candidate = formatPart([...current, token]);
    if (characterCount(candidate) <= lengthLimit) {
      current = [...current, token];
      continue;
    }
    if (current.length > 0) parts.push(formatPart(current));
    if (characterCount(formatPart([token])) > lengthLimit) return null;
    current = [token];
  }

  if (current.length > 0) parts.push(formatPart(current));
  return parts;
}

function formatPart(tokens: readonly string[]) {
  return tokens.length === 1 ? (tokens[0] ?? '') : `(?:${tokens.join('|')})`;
}

function characterCount(value: string) {
  return Array.from(value).length;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
