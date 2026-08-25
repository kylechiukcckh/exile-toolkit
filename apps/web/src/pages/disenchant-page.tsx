import { disenchantDataset } from '@exile-toolkit/data/disenchant';
import type { DisenchantCandidate } from '@exile-toolkit/domain';
import { ChevronLeft, ChevronRight, Info, PackageOpen } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';

const pageSize = 10;

export function DisenchantPage() {
  const [page, setPage] = useState(1);
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  const candidates = useMemo(
    () =>
      [...disenchantDataset.entries].sort(
        (left, right) => right.dustValue - left.dustValue
      ),
    []
  );
  const pageCount = Math.ceil(candidates.length / pageSize);
  const pageCandidates = candidates.slice(
    (page - 1) * pageSize,
    page * pageSize
  );
  const provenance = disenchantDataset.entries[0]?.provenance;

  return (
    <article className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
      <header className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-300/70">
          Reviewed Dust dataset
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-stone-50 sm:text-5xl">
          Disenchant calculator
        </h1>
        <p className="mt-5 text-lg leading-8 text-stone-400">
          Browse supported unique items before market prices are available.
          Every candidate stays visible, including items without a usable price.
        </p>
      </header>

      <section
        className="mt-9 rounded-xl border border-amber-300/20 bg-amber-300/[0.045] p-5"
        aria-labelledby="market-data-heading"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="market-data-heading" className="font-medium text-amber-100">
              Market prices are unavailable
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-400">
              The reviewed Dust dataset remains available. Dust per Chaos and
              other price Rankings stay disabled until a complete Price snapshot
              is available.
            </p>
          </div>
          <Button type="button" variant="outline" disabled>
            Price Ranking unavailable
          </Button>
        </div>
      </section>

      <section
        className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto]"
        aria-label="Dataset status"
      >
        <div className="rounded-xl border border-white/8 bg-white/[0.025] p-5">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">
            Unpriced candidates
          </p>
          <p className="mt-2 text-2xl font-semibold text-stone-100">
            {candidates.length.toLocaleString()}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            The full Dataset is shown because no Price snapshot is available.
          </p>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.025] p-5 lg:max-w-sm">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-stone-500">
            Dataset coverage
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-300">
            {disenchantDataset.coverage}
          </p>
          <p className="mt-2 text-xs text-stone-500">
            Version {disenchantDataset.version}
          </p>
          {provenance ? <DatasetProvenance provenance={provenance} /> : null}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="candidate-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="candidate-heading"
              className="text-xl font-semibold text-stone-100"
            >
              Unpriced candidates
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              Sorted by Dust value for browsing only. This is not a price
              Ranking.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            aria-expanded={assumptionsOpen}
            aria-controls="disenchant-assumptions"
            onClick={() => setAssumptionsOpen(open => !open)}
          >
            <Info aria-hidden="true" />
            Dust assumptions
          </Button>
        </div>

        {assumptionsOpen ? <DustAssumptions /> : null}

        <div className="mt-5 overflow-hidden rounded-xl border border-white/8 bg-white/[0.025]">
          <table className="hidden w-full text-left md:table">
            <thead className="border-b border-white/8 bg-black/15 text-xs uppercase tracking-[0.14em] text-stone-500">
              <tr>
                <th className="px-5 py-3 font-medium">Unique</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Dust value</th>
                <th className="px-5 py-3 font-medium">Assumption</th>
                <th className="px-5 py-3 font-medium">Market state</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {pageCandidates.map(candidate => (
                <tr key={candidate.id} className="text-sm">
                  <td className="px-5 py-4">
                    <CandidateName candidate={candidate} />
                  </td>
                  <td className="px-5 py-4 capitalize text-stone-400">
                    {candidate.category}
                  </td>
                  <td className="px-5 py-4 font-medium tabular-nums text-amber-100">
                    {candidate.dustValue.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-stone-400">
                    <AssumptionLabel candidate={candidate} />
                  </td>
                  <td className="px-5 py-4">
                    <UnpricedBadge />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul
            className="divide-y divide-white/6 md:hidden"
            aria-label="Unpriced candidates"
          >
            {pageCandidates.map(candidate => (
              <li key={candidate.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <CandidateName candidate={candidate} />
                  <UnpricedBadge />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.14em] text-stone-600">
                      Dust value
                    </dt>
                    <dd className="mt-1 font-medium tabular-nums text-amber-100">
                      {candidate.dustValue.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.14em] text-stone-600">
                      Assumption
                    </dt>
                    <dd className="mt-1 text-stone-400">
                      <AssumptionLabel candidate={candidate} />
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </div>

        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </section>
    </article>
  );
}

function DatasetProvenance({
  provenance
}: {
  provenance: DisenchantCandidate['provenance'];
}) {
  return (
    <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-stone-500">
      <dt>Source</dt>
      <dd>
        <a className="text-amber-200 underline" href={provenance.source.url}>
          {provenance.source.name}
        </a>
      </dd>
      <dt>Game</dt>
      <dd>Path of Exile {provenance.gameVersion}</dd>
      <dt>Verification</dt>
      <dd>Reviewed</dd>
      <dt>License</dt>
      <dd>
        <a className="text-amber-200 underline" href={provenance.license.url}>
          {provenance.license.name}
        </a>
      </dd>
      <dt>Updated</dt>
      <dd>{provenance.updatedAt.slice(0, 10)}</dd>
    </dl>
  );
}

function CandidateName({ candidate }: { candidate: DisenchantCandidate }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/8 bg-black/20 text-stone-500"
        aria-hidden="true"
      >
        <CandidateIcon iconUrl={candidate.iconUrl} label={candidate.name} />
      </span>
      <span className="min-w-0">
        <span className="block font-medium text-stone-200">
          {candidate.name}
        </span>
        <span className="mt-0.5 block truncate text-xs text-stone-500">
          {candidate.baseType}
        </span>
      </span>
    </div>
  );
}

function CandidateIcon({
  iconUrl,
  label
}: {
  iconUrl: string | undefined;
  label: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!iconUrl || failed) {
    return (
      <span className="text-xs font-semibold text-stone-400" aria-hidden="true">
        {label.slice(0, 1)}
      </span>
    );
  }

  return (
    <img
      alt=""
      className="size-8 object-contain"
      referrerPolicy="no-referrer"
      src={iconUrl}
      onError={() => setFailed(true)}
    />
  );
}

function AssumptionLabel({ candidate }: { candidate: DisenchantCandidate }) {
  return (
    <>
      ilvl {candidate.itemLevel}, q{candidate.quality}
    </>
  );
}

function UnpricedBadge() {
  return (
    <span className="inline-flex rounded-full border border-white/10 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
      Unpriced
    </span>
  );
}

function DustAssumptions() {
  return (
    <aside
      id="disenchant-assumptions"
      className="mt-5 rounded-xl border border-white/8 bg-black/15 p-5"
      aria-label="Dust assumptions"
    >
      <div className="flex gap-3">
        <PackageOpen
          className="mt-0.5 size-5 shrink-0 text-amber-300"
          aria-hidden="true"
        />
        <div className="text-sm leading-6 text-stone-400">
          <p>
            Dust values use item level 85. Weapons and armour use q20.
            Jewellery, quivers, and items that cannot gain quality use q0.
          </p>
          <p className="mt-3">
            The Dataset assumes no influence and no corruption implicit. A
            purchased item may return more Dust, while a corrupted weapon or
            armour below q20 may return less.
          </p>
          <p className="mt-3">
            This view uses Dataset version {disenchantDataset.version}. It does
            not promise a market price or buying result.
          </p>
        </div>
      </div>
    </aside>
  );
}

function Pagination({
  page,
  pageCount,
  onPageChange
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <nav
      className="mt-5 flex items-center justify-between gap-4"
      aria-label="Candidate pages"
    >
      <p className="text-sm text-stone-500">
        Page {page} of {pageCount}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft aria-hidden="true" /> Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Next page"
          disabled={page === pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
