import { mapDataset, mapModifierDataset } from '@exile-toolkit/data';
import {
  generateRegexPreview,
  validateCuratedDataset,
  type CuratedDataset,
  type CuratedEntry,
  type DatasetCategory,
  type DatasetValidationResult
} from '@exile-toolkit/domain';
import {
  Check,
  Database,
  Search,
  ShieldAlert,
  WandSparkles
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const datasetResults: Record<DatasetCategory, DatasetValidationResult> = {
  map: validateCuratedDataset(mapDataset),
  'map-modifier': validateCuratedDataset(mapModifierDataset)
};

const categoryLabels = {
  map: {
    tab: 'Maps',
    singular: 'map',
    plural: 'maps',
    search: 'Search maps'
  },
  'map-modifier': {
    tab: 'Map modifiers',
    singular: 'modifier',
    plural: 'modifiers',
    search: 'Search modifiers'
  }
} as const;

export function MapRegexPage() {
  const [category, setCategory] = useState<DatasetCategory>('map');
  const [searches, setSearches] = useState<Record<DatasetCategory, string>>({
    map: '',
    'map-modifier': ''
  });
  const [selections, setSelections] = useState<
    Record<DatasetCategory, readonly string[]>
  >({ map: [], 'map-modifier': [] });
  const datasetResult = datasetResults[category];

  if (!datasetResult.valid) {
    return <UnavailableDataset issues={datasetResult.issues} />;
  }

  return (
    <RegexTool
      category={category}
      dataset={datasetResult.dataset}
      search={searches[category]}
      selection={selections[category]}
      onCategoryChange={setCategory}
      onSearchChange={search =>
        setSearches(current => ({ ...current, [category]: search }))
      }
      onSelectionChange={selection =>
        setSelections(current => ({ ...current, [category]: selection }))
      }
    />
  );
}

function RegexTool({
  category,
  dataset,
  search,
  selection,
  onCategoryChange,
  onSearchChange,
  onSelectionChange
}: {
  category: DatasetCategory;
  dataset: CuratedDataset;
  search: string;
  selection: readonly string[];
  onCategoryChange: (category: DatasetCategory) => void;
  onSearchChange: (search: string) => void;
  onSelectionChange: (selection: readonly string[]) => void;
}) {
  const labels = categoryLabels[category];
  const result = useMemo(
    () => generateRegexPreview(dataset, selection),
    [dataset, selection]
  );
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const visibleEntries = dataset.entries.filter(entry =>
    entry.name.toLocaleLowerCase().includes(normalizedSearch)
  );
  const visibleGroups = groupEntries(visibleEntries);
  const entriesById = new Map(dataset.entries.map(entry => [entry.id, entry]));

  function setSelected(id: string, selected: boolean) {
    onSelectionChange(
      selected
        ? selection.includes(id)
          ? selection
          : [...selection, id]
        : selection.filter(selectedId => selectedId !== id)
    );
  }

  function setVisibleGroup(
    entries: readonly CuratedEntry[],
    selected: boolean
  ) {
    const visibleIds = new Set(entries.map(entry => entry.id));
    onSelectionChange(
      selected
        ? [...new Set([...selection, ...visibleIds])]
        : selection.filter(id => !visibleIds.has(id))
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
      <header className="max-w-3xl">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-amber-300/70">
          <WandSparkles className="size-4" aria-hidden="true" />
          Regex tool
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-stone-50 sm:text-5xl">
          Map regex generator
        </h1>
        <p className="mt-4 text-lg leading-8 text-stone-400">
          Select reviewed map data and inspect every match before using the
          inclusion-only regex.
        </p>

        <div
          className="mt-7 flex w-fit rounded-lg border border-white/8 bg-white/[0.03] p-1"
          aria-label="Regex category"
        >
          {(['map', 'map-modifier'] as const).map(value => (
            <Button
              key={value}
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={category === value}
              onClick={() => onCategoryChange(value)}
              className="h-7 px-2.5 text-stone-500 aria-pressed:bg-stone-800 aria-pressed:text-stone-100"
            >
              {categoryLabels[value].tab}
            </Button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3 text-xs text-stone-500">
          <span className="rounded-full border border-white/8 bg-white/[0.025] px-3 py-1.5">
            {labels.tab} / Dataset {dataset.version}
          </span>
          <span className="rounded-full border border-white/8 bg-white/[0.025] px-3 py-1.5">
            PoE {dataset.entries[0]?.provenance.gameVersion}
          </span>
          <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.05] px-3 py-1.5 text-emerald-300/70">
            Reviewed entries
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-stone-600">
          {dataset.coverage}
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(19rem,0.78fr)_minmax(0,1.22fr)]">
        <section className="rounded-2xl border border-white/8 bg-stone-950/55 p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-medium text-stone-200">
              Curated {labels.plural}
            </h2>
            <span className="text-xs text-stone-600">
              {selection.length}{' '}
              {selection.length === 1 ? labels.singular : labels.plural}{' '}
              selected
            </span>
          </div>

          <label className="relative mt-5 block">
            <span className="sr-only">{labels.search}</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-600"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label={labels.search}
              value={search}
              onChange={event => onSearchChange(event.target.value)}
              placeholder={labels.search}
              className="h-10 w-full rounded-lg border border-white/10 bg-black/25 pl-10 pr-3 text-sm text-stone-200 outline-none placeholder:text-stone-700 focus:border-amber-300/40 focus:ring-2 focus:ring-amber-300/10"
            />
          </label>

          {visibleEntries.length > 0 ? (
            <div className="mt-4 max-h-[34rem] space-y-5 overflow-y-auto pr-1">
              {visibleGroups.map(group => (
                <section key={group.name}>
                  {category === 'map-modifier' ? (
                    <div className="flex items-center justify-between gap-3 px-3">
                      <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-stone-600">
                        {group.name}
                      </h3>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Select visible ${group.name}`}
                          onClick={() => setVisibleGroup(group.entries, true)}
                          className="h-7 px-2 text-xs text-stone-500"
                        >
                          Select
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Clear visible ${group.name}`}
                          onClick={() => setVisibleGroup(group.entries, false)}
                          className="h-7 px-2 text-xs text-stone-500"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  <EntryList
                    entries={group.entries}
                    selection={selection}
                    onSelectedChange={setSelected}
                  />
                </section>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-lg border border-dashed border-white/10 px-4 py-8 text-center text-sm text-stone-600">
              No {labels.plural} match this search.
            </p>
          )}
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-white/8 bg-stone-950/55 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Database
                className="size-4 text-amber-300/70"
                aria-hidden="true"
              />
              <h2 className="font-medium text-stone-200">Generated regex</h2>
            </div>
            {result.status === 'ready' ? (
              <div className="mt-5">
                <label className="text-xs font-medium uppercase tracking-[0.16em] text-stone-600">
                  Generated regex
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/35 px-3 font-mono text-sm text-amber-200 outline-none"
                    aria-label="Generated regex"
                    readOnly
                    value={result.regex}
                  />
                </label>
                <p className="mt-3 flex items-center gap-2 text-xs text-emerald-300/70">
                  <Check className="size-3.5" aria-hidden="true" />
                  Inclusion-only. All matches are shown below.
                </p>
              </div>
            ) : (
              <p className="mt-5 rounded-lg border border-dashed border-white/10 px-4 py-8 text-center text-sm text-stone-500">
                {result.message}
              </p>
            )}
          </div>

          {result.status === 'ready' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <PreviewList
                label={`Matched ${labels.plural}`}
                ids={result.matched}
                entriesById={entriesById}
                tone="matched"
              />
              <PreviewList
                label={`Unmatched ${labels.plural}`}
                ids={result.unmatched}
                entriesById={entriesById}
                tone="unmatched"
              />
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function EntryList({
  entries,
  selection,
  onSelectedChange
}: {
  entries: readonly CuratedEntry[];
  selection: readonly string[];
  onSelectedChange: (id: string, selected: boolean) => void;
}) {
  return (
    <ul className="mt-1 space-y-1">
      {entries.map(entry => (
        <li key={entry.id}>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-stone-400 transition-colors hover:bg-white/[0.035] hover:text-stone-200">
            <Checkbox
              aria-label={entry.name}
              checked={selection.includes(entry.id)}
              onCheckedChange={value =>
                onSelectedChange(entry.id, value === true)
              }
              className="border-white/15 data-[state=checked]:border-amber-300 data-[state=checked]:bg-amber-300 data-[state=checked]:text-stone-950"
            />
            <span>{entry.name}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}

function groupEntries(entries: readonly CuratedEntry[]) {
  const groups = new Map<string, CuratedEntry[]>();
  for (const entry of entries) {
    const group = entry.group ?? 'Maps';
    groups.set(group, [...(groups.get(group) ?? []), entry]);
  }
  return [...groups].map(([name, groupedEntries]) => ({
    name,
    entries: groupedEntries
  }));
}

function PreviewList({
  label,
  ids,
  entriesById,
  tone
}: {
  label: string;
  ids: readonly string[];
  entriesById: ReadonlyMap<string, CuratedEntry>;
  tone: 'matched' | 'unmatched';
}) {
  return (
    <section
      aria-label={label}
      className="rounded-xl border border-white/8 bg-white/[0.025] p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-stone-300">{label}</h3>
        <span
          className={
            tone === 'matched'
              ? 'text-xs text-emerald-300/70'
              : 'text-xs text-stone-600'
          }
        >
          {ids.length}
        </span>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-stone-500">
        {ids.map(id => (
          <li key={id}>{entriesById.get(id)?.name}</li>
        ))}
      </ul>
    </section>
  );
}

function UnavailableDataset({ issues }: { issues: readonly string[] }) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
      <ShieldAlert className="size-8 text-red-300" aria-hidden="true" />
      <h1 className="mt-5 text-3xl font-semibold text-stone-100">
        Regex Dataset unavailable
      </h1>
      <p className="mt-4 leading-7 text-stone-500">
        The active Dataset did not pass validation, so the Tool will not
        generate a result.
      </p>
      <ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-red-300/75">
        {issues.map(issue => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
    </section>
  );
}
