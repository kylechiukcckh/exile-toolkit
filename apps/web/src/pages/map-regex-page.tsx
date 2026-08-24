import { mapDataset } from '@exile-toolkit/data';
import {
  generateRegexPreview,
  validateCuratedDataset,
  type CuratedDataset
} from '@exile-toolkit/domain';
import {
  Check,
  Database,
  Search,
  ShieldAlert,
  WandSparkles
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';

const datasetValidation = validateCuratedDataset(mapDataset);

export function MapRegexPage() {
  if (!datasetValidation.valid) {
    return <UnavailableDataset issues={datasetValidation.issues} />;
  }

  return <MapRegexTool dataset={datasetValidation.dataset} />;
}

function MapRegexTool({ dataset }: { dataset: CuratedDataset }) {
  const [search, setSearch] = useState('');
  const [selection, setSelection] = useState<readonly string[]>([]);
  const result = useMemo(
    () => generateRegexPreview(dataset, selection),
    [dataset, selection]
  );
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const visibleEntries = dataset.entries.filter(entry =>
    entry.name.toLocaleLowerCase().includes(normalizedSearch)
  );
  const entriesById = new Map(dataset.entries.map(entry => [entry.id, entry]));

  function setSelected(id: string, selected: boolean) {
    setSelection(current =>
      selected
        ? current.includes(id)
          ? current
          : [...current, id]
        : current.filter(selectedId => selectedId !== id)
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
      <header className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-amber-300/70">
          <WandSparkles className="size-4" aria-hidden="true" />
          Regex tool
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-stone-50 sm:text-5xl">
          Map regex generator
        </h1>
        <p className="mt-4 text-lg leading-8 text-stone-400">
          Select reviewed map base types and inspect every match before using
          the inclusion-only regex.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-xs text-stone-500">
          <span className="rounded-full border border-white/8 bg-white/[0.025] px-3 py-1.5">
            Dataset {dataset.version}
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
            <h2 className="font-medium text-stone-200">Curated maps</h2>
            <span className="text-xs text-stone-600">
              {selection.length} {selection.length === 1 ? 'map' : 'maps'}{' '}
              selected
            </span>
          </div>

          <label className="relative mt-5 block">
            <span className="sr-only">Search maps</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-600"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search maps"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search maps"
              className="h-10 w-full rounded-lg border border-white/10 bg-black/25 pl-10 pr-3 text-sm text-stone-200 outline-none placeholder:text-stone-700 focus:border-amber-300/40 focus:ring-2 focus:ring-amber-300/10"
            />
          </label>

          {visibleEntries.length > 0 ? (
            <ul className="mt-4 max-h-[31rem] space-y-1 overflow-y-auto pr-1">
              {visibleEntries.map(entry => {
                const checked = selection.includes(entry.id);
                return (
                  <li key={entry.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-stone-400 transition-colors hover:bg-white/[0.035] hover:text-stone-200">
                      <Checkbox
                        aria-label={entry.name}
                        checked={checked}
                        onCheckedChange={value =>
                          setSelected(entry.id, value === true)
                        }
                        className="border-white/15 data-[state=checked]:border-amber-300 data-[state=checked]:bg-amber-300 data-[state=checked]:text-stone-950"
                      />
                      <span>{entry.name}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-5 rounded-lg border border-dashed border-white/10 px-4 py-8 text-center text-sm text-stone-600">
              No maps match this search.
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
                label="Matched maps"
                ids={result.matched}
                entriesById={entriesById}
                tone="matched"
              />
              <PreviewList
                label="Unmatched maps"
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

function PreviewList({
  label,
  ids,
  entriesById,
  tone
}: {
  label: string;
  ids: readonly string[];
  entriesById: ReadonlyMap<string, CuratedDataset['entries'][number]>;
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
        Map Dataset unavailable
      </h1>
      <p className="mt-4 leading-7 text-stone-500">
        The distributed Dataset did not pass validation, so the Tool will not
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
