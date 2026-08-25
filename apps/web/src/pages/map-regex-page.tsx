import {
  mapDataset,
  mapModifierDataset,
  regexPresets
} from '@exile-toolkit/data';
import {
  generateRegexPreview,
  decodeRegexToolState,
  encodeRegexToolState,
  MAX_CUSTOM_ENTRY_LENGTH,
  REGEX_LENGTH_LIMIT,
  type BuiltInRegexPreset,
  type CustomRegexEntry,
  validateCuratedDataset,
  type CuratedDataset,
  type CuratedEntry,
  type DatasetCategory,
  type DatasetValidationResult,
  type LocalRegexPreset
} from '@exile-toolkit/domain';
import {
  Check,
  Database,
  Search,
  ShieldAlert,
  WandSparkles
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useRegexLocalState } from '@/hooks/use-regex-local-state';
import type { WorkspaceOutletContext } from '@/components/workspace-shell';

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
  const { workspace } = useOutletContext<WorkspaceOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const sharedState = useMemo(() => {
    const encoded = searchParams.get('state');
    return encoded ? decodeRegexToolState(encoded) : null;
  }, [searchParams]);
  const initialSharedState = sharedState?.valid ? sharedState.state : null;
  const [category, setCategory] = useState<DatasetCategory>(
    initialSharedState?.category ?? 'map'
  );
  const [searches, setSearches] = useState<Record<DatasetCategory, string>>({
    map: '',
    'map-modifier': ''
  });
  const [selections, setSelections] = useState<
    Record<DatasetCategory, readonly string[]>
  >({
    map:
      initialSharedState?.category === 'map'
        ? initialSharedState.selectedIds.filter(id =>
            mapDataset.entries.some(entry => entry.id === id)
          )
        : [],
    'map-modifier':
      initialSharedState?.category === 'map-modifier'
        ? initialSharedState.selectedIds.filter(id =>
            mapModifierDataset.entries.some(entry => entry.id === id)
          )
        : []
  });
  const [shareUrl, setShareUrl] = useState('');
  const [sharedIssue] = useState<string | null>(() =>
    sharedState && !sharedState.valid
      ? sharedState.message
      : initialSharedState &&
          selections[initialSharedState.category].length !==
            initialSharedState.selectedIds.length
        ? 'Some shared entries are unavailable in the active Dataset and were ignored.'
        : null
  );
  const local = useRegexLocalState();
  const datasetResult = datasetResults[category];

  useEffect(() => {
    const curatedSelection = selections[category].filter(id =>
      curatedEntriesFor(category).some(entry => entry.id === id)
    );
    workspace.recordHistory(category, curatedSelection);
  }, [category, selections, workspace.recordHistory]);

  if (!datasetResult.valid) {
    return <UnavailableDataset issues={datasetResult.issues} />;
  }

  return (
    <RegexTool
      category={category}
      dataset={datasetResult.dataset}
      search={searches[category]}
      selection={selections[category]}
      builtInPresets={regexPresets.filter(
        preset => preset.category === category
      )}
      localPresets={local.state.presets.filter(
        preset => preset.category === category
      )}
      customEntries={local.state.customEntries.filter(
        entry => entry.category === category
      )}
      localIssues={local.issues}
      sharedIssue={sharedIssue}
      shareUrl={shareUrl}
      onCategoryChange={setCategory}
      onSearchChange={search =>
        setSearches(current => ({ ...current, [category]: search }))
      }
      onSelectionChange={selection =>
        setSelections(current => ({ ...current, [category]: selection }))
      }
      onSavePreset={name =>
        local.savePreset(category, name, selections[category])
      }
      onRenamePreset={local.renamePreset}
      onDeletePreset={local.deletePreset}
      onAddCustomEntry={name => {
        const entry = local.addCustomEntry(category, name);
        if (!entry) return;
        setSelections(current => ({
          ...current,
          [category]: [...current[category], entry.id]
        }));
      }}
      onRemoveCustomEntry={id => {
        local.removeCustomEntry(id);
        setSelections(current => ({
          ...current,
          [category]: current[category].filter(entryId => entryId !== id)
        }));
      }}
      onShare={() => {
        const selectedIds = selections[category].filter(id =>
          curatedEntriesFor(category).some(entry => entry.id === id)
        );
        const encoded = encodeRegexToolState({ category, selectedIds });
        setSearchParams({ state: encoded }, { replace: true });
        setShareUrl(
          `${window.location.origin}${window.location.pathname}?state=${encoded}`
        );
      }}
      onSaveCalculation={() =>
        workspace.saveCalculation(
          category,
          selections[category],
          local.state.customEntries.filter(
            entry =>
              entry.category === category &&
              selections[category].includes(entry.id)
          )
        )
      }
    />
  );
}

function RegexTool({
  category,
  dataset,
  search,
  selection,
  builtInPresets,
  localPresets,
  customEntries,
  localIssues,
  sharedIssue,
  shareUrl,
  onCategoryChange,
  onSearchChange,
  onSelectionChange,
  onSavePreset,
  onRenamePreset,
  onDeletePreset,
  onAddCustomEntry,
  onRemoveCustomEntry,
  onShare,
  onSaveCalculation
}: {
  category: DatasetCategory;
  dataset: CuratedDataset;
  search: string;
  selection: readonly string[];
  builtInPresets: readonly BuiltInRegexPreset[];
  localPresets: readonly LocalRegexPreset[];
  customEntries: readonly CustomRegexEntry[];
  localIssues: readonly string[];
  sharedIssue: string | null;
  shareUrl: string;
  onCategoryChange: (category: DatasetCategory) => void;
  onSearchChange: (search: string) => void;
  onSelectionChange: (selection: readonly string[]) => void;
  onSavePreset: (name: string) => void;
  onRenamePreset: (id: string, name: string) => void;
  onDeletePreset: (id: string) => void;
  onAddCustomEntry: (name: string) => void;
  onRemoveCustomEntry: (id: string) => void;
  onShare: () => void;
  onSaveCalculation: () => void;
}) {
  const labels = categoryLabels[category];
  const [copyStatus, setCopyStatus] = useState<
    | { readonly state: 'copied'; readonly partId: string }
    | { readonly state: 'failed'; readonly partId: string }
    | null
  >(null);
  const [presetName, setPresetName] = useState('');
  const [customName, setCustomName] = useState('');
  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({});
  const [calculationSaved, setCalculationSaved] = useState(false);
  const result = useMemo(
    () => generateRegexPreview(dataset, selection, { customEntries }),
    [customEntries, dataset, selection]
  );
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const visibleEntries = dataset.entries.filter(entry =>
    entry.name.toLocaleLowerCase().includes(normalizedSearch)
  );
  const visibleGroups = groupEntries(visibleEntries);
  const entriesById = new Map(
    [...dataset.entries, ...customEntries].map(entry => [entry.id, entry])
  );

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

  async function copyPart(partId: string, regex: string) {
    try {
      await navigator.clipboard.writeText(regex);
      setCopyStatus({ state: 'copied', partId });
    } catch {
      setCopyStatus({ state: 'failed', partId });
    }
  }

  useEffect(() => {
    function copyIntendedPart() {
      const focusedPartId =
        document.activeElement instanceof HTMLInputElement
          ? document.activeElement.dataset.regexPart
          : undefined;
      const part =
        result.status === 'ready'
          ? (result.parts.find(candidate => candidate.id === focusedPartId) ??
            result.parts[0])
          : undefined;
      if (part) void copyPart(part.id, part.regex);
    }

    window.addEventListener('exile-toolkit:copy-regex', copyIntendedPart);
    return () =>
      window.removeEventListener('exile-toolkit:copy-regex', copyIntendedPart);
  }, [result]);

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
        <Link
          className="mt-3 inline-flex text-sm text-amber-300 underline transition-colors hover:text-amber-200"
          to="/data-sources#corrections"
        >
          Report a missing Curated entry
        </Link>
        {sharedIssue ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-amber-300/15 bg-amber-300/[0.04] p-3 text-sm text-amber-200/75"
          >
            {sharedIssue} The Tool started with safe defaults.
          </p>
        ) : null}
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(19rem,0.78fr)_minmax(0,1.22fr)]">
        <section className="min-w-0 rounded-2xl border border-white/8 bg-stone-950/55 p-5">
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

          <section className="mt-5 space-y-3 rounded-xl border border-white/8 bg-white/[0.02] p-3">
            <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-stone-600">
              Presets
            </h3>
            {builtInPresets.map(preset => (
              <div
                key={preset.id}
                className="flex items-start justify-between gap-3 rounded-lg bg-black/20 p-3"
              >
                <div>
                  <p className="text-sm text-stone-300">{preset.name}</p>
                  <p className="mt-1 text-xs leading-5 text-stone-600">
                    {preset.description}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectionChange(preset.entryIds)}
                  aria-label={`Apply preset ${preset.name}`}
                >
                  Apply
                </Button>
              </div>
            ))}

            <div className="flex gap-2">
              <input
                aria-label="Preset name"
                value={presetName}
                maxLength={MAX_CUSTOM_ENTRY_LENGTH}
                onChange={event => setPresetName(event.target.value)}
                placeholder="Preset name"
                className="h-9 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/25 px-3 text-sm text-stone-200 outline-none"
              />
              <Button
                type="button"
                size="sm"
                disabled={
                  presetName.trim().length === 0 || selection.length === 0
                }
                onClick={() => {
                  onSavePreset(presetName.trim());
                  setPresetName('');
                }}
              >
                Save current
              </Button>
            </div>

            {localPresets.map(preset => {
              const draft = renameDrafts[preset.id] ?? preset.name;
              return (
                <div key={preset.id} className="flex flex-wrap gap-2">
                  <input
                    aria-label={`Rename ${preset.name}`}
                    value={draft}
                    maxLength={MAX_CUSTOM_ENTRY_LENGTH}
                    onChange={event =>
                      setRenameDrafts(current => ({
                        ...current,
                        [preset.id]: event.target.value
                      }))
                    }
                    className="h-8 min-w-36 flex-1 rounded-md border border-white/10 bg-black/20 px-2 text-sm text-stone-300"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectionChange(preset.entryIds)}
                    aria-label={`Apply local preset ${preset.name}`}
                  >
                    Apply
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={draft.trim().length === 0}
                    onClick={() => onRenamePreset(preset.id, draft.trim())}
                    aria-label={`Save name for ${preset.name}`}
                  >
                    Rename
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeletePreset(preset.id)}
                    aria-label={`Delete local preset ${preset.name}`}
                  >
                    Delete
                  </Button>
                </div>
              );
            })}
          </section>

          {localIssues.length > 0 ? (
            <div
              role="alert"
              className="mt-3 rounded-lg border border-amber-300/15 bg-amber-300/[0.04] p-3 text-xs leading-5 text-amber-200/70"
            >
              {localIssues.join(' ')}
            </div>
          ) : null}

          <section className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/[0.025] p-3">
            <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-amber-300/65">
              Custom entries
            </h3>
            <p className="mt-1 text-xs leading-5 text-stone-600">
              Stored only in this browser. Custom text is not reviewed Dataset
              content.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                aria-label="Custom entry"
                value={customName}
                maxLength={MAX_CUSTOM_ENTRY_LENGTH}
                onChange={event => setCustomName(event.target.value)}
                placeholder="Paste exact in-game text"
                className="h-9 min-w-0 flex-1 rounded-lg border border-amber-300/15 bg-black/25 px-3 text-sm text-stone-200 outline-none"
              />
              <Button
                type="button"
                size="sm"
                disabled={customName.trim().length === 0}
                onClick={() => {
                  onAddCustomEntry(customName.trim());
                  setCustomName('');
                }}
              >
                Add Custom
              </Button>
            </div>
            <ul className="mt-2 space-y-1">
              {customEntries.map(entry => (
                <li
                  key={entry.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-stone-300"
                >
                  <Checkbox
                    aria-label={`Custom entry ${entry.name}`}
                    checked={selection.includes(entry.id)}
                    onCheckedChange={value =>
                      setSelected(entry.id, value === true)
                    }
                  />
                  <span className="rounded border border-amber-300/20 px-1.5 py-0.5 text-[0.65rem] uppercase text-amber-300/70">
                    Custom
                  </span>
                  <span className="min-w-0 flex-1 truncate">{entry.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveCustomEntry(entry.id)}
                    aria-label={`Remove Custom entry ${entry.name}`}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <label className="relative mt-5 block">
            <span className="sr-only">{labels.search}</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-600"
              aria-hidden="true"
            />
            <input
              type="search"
              data-tool-search
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

        <section className="min-w-0 space-y-6">
          <div className="rounded-2xl border border-white/8 bg-stone-950/55 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Database
                className="size-4 text-amber-300/70"
                aria-hidden="true"
              />
              <h2 className="font-medium text-stone-200">Generated regex</h2>
              <span className="ml-auto text-xs text-stone-600">
                {REGEX_LENGTH_LIMIT} character limit
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  selection.length === 0 ||
                  selection.some(id =>
                    customEntries.some(entry => entry.id === id)
                  )
                }
                onClick={onShare}
              >
                Share Tool state
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={selection.length === 0}
                onClick={() => {
                  onSaveCalculation();
                  setCalculationSaved(true);
                }}
              >
                Save calculation
              </Button>
            </div>
            {selection.some(id =>
              customEntries.some(entry => entry.id === id)
            ) ? (
              <p className="mt-2 text-xs leading-5 text-amber-200/70">
                Remove Custom entries from the Selection before sharing. Their
                text stays in this browser.
              </p>
            ) : null}
            {shareUrl ? (
              <div className="mt-3">
                <label className="text-xs text-stone-500">
                  Share URL
                  <input
                    aria-label="Share URL"
                    readOnly
                    value={shareUrl}
                    onFocus={event => event.currentTarget.select()}
                    className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-black/25 px-3 text-xs text-stone-300"
                  />
                </label>
                <p className="mt-2 text-xs leading-5 text-stone-600">
                  The URL contains the active category and Curated Selection.
                  Custom text, presets, and Saved calculations stay in this
                  browser.
                </p>
              </div>
            ) : null}
            {calculationSaved ? (
              <p role="status" className="mt-3 text-sm text-emerald-300/75">
                Saved this calculation in the current browser.
              </p>
            ) : null}
            {result.status === 'ready' ? (
              <div className="mt-5 space-y-4">
                {result.parts.map((part, index) => (
                  <div key={part.id}>
                    <div className="flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.16em] text-stone-600">
                      <label htmlFor={part.id}>Regex part {index + 1}</label>
                      <span>
                        {part.characterCount} / {REGEX_LENGTH_LIMIT} characters
                      </span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        id={part.id}
                        data-regex-part={part.id}
                        className="h-11 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/35 px-3 font-mono text-sm text-amber-200 outline-none selection:bg-amber-300/25"
                        aria-label={`Regex part ${index + 1}`}
                        readOnly
                        value={part.regex}
                        onFocus={event => event.currentTarget.select()}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void copyPart(part.id, part.regex)}
                      >
                        Copy part {index + 1}
                      </Button>
                    </div>
                  </div>
                ))}
                <p className="sr-only" role="status" aria-live="polite">
                  {copyStatus?.state === 'copied'
                    ? `Copied regex ${copyStatus.partId.replace('-', ' ')}.`
                    : copyStatus?.state === 'failed'
                      ? `Could not copy regex ${copyStatus.partId.replace('-', ' ')}. Select the generated text and copy it manually.`
                      : ''}
                </p>
                {copyStatus?.state === 'copied' ? (
                  <p className="text-sm text-emerald-300/75">
                    Copied regex {copyStatus.partId.replace('-', ' ')}.
                  </p>
                ) : null}
                {copyStatus?.state === 'failed' ? (
                  <p className="text-sm leading-6 text-amber-200/75">
                    Clipboard access is unavailable. Select the generated text
                    and copy it manually.
                  </p>
                ) : null}
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

function curatedEntriesFor(category: DatasetCategory) {
  return category === 'map' ? mapDataset.entries : mapModifierDataset.entries;
}

function PreviewList({
  label,
  ids,
  entriesById,
  tone
}: {
  label: string;
  ids: readonly string[];
  entriesById: ReadonlyMap<
    string,
    { readonly id: string; readonly name: string }
  >;
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
