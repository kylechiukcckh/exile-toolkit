import type { CuratedDataset } from './dataset';

export interface ReadyRegexPreview {
  readonly status: 'ready';
  readonly regex: string;
  readonly selectedIds: readonly string[];
  readonly matched: readonly string[];
  readonly unmatched: readonly string[];
}

export type RegexPreviewResult =
  | ReadyRegexPreview
  | { readonly status: 'empty'; readonly message: string }
  | { readonly status: 'invalid'; readonly message: string };

export function generateRegexPreview(
  dataset: CuratedDataset,
  selection: readonly string[]
): RegexPreviewResult {
  const entriesById = new Map(dataset.entries.map(entry => [entry.id, entry]));
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

  const alternatives = selectedIds.map(id =>
    escapeRegex(entriesById.get(id)?.name ?? '')
  );
  const regex = `^(?:${alternatives.join('|')})$`;
  const matcher = new RegExp(regex);
  const matched: string[] = [];
  const unmatched: string[] = [];

  for (const entry of dataset.entries) {
    (matcher.test(entry.name) ? matched : unmatched).push(entry.id);
  }

  return { status: 'ready', regex, selectedIds, matched, unmatched };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
