import { mapDataset, mapModifierDataset } from '@exile-toolkit/data';
import { disenchantDatasetManifest } from '@exile-toolkit/data/disenchant-manifest';
import {
  summarizeDatasetProvenance,
  type CuratedDataset,
  type DatasetProvenanceSummary
} from '@exile-toolkit/domain';
import { Link } from 'react-router-dom';

type TrustPageKey =
  'about' | 'data-sources' | 'privacy' | 'licenses' | 'non-affiliation';

const pages: Record<
  TrustPageKey,
  {
    eyebrow: string;
    title: string;
    summary: string;
    sections: ReadonlyArray<{ heading: string; paragraphs: readonly string[] }>;
  }
> = {
  about: {
    eyebrow: 'The project',
    title: 'About',
    summary:
      'Exile Toolkit is a guest-first workspace for experienced Path of Exile 1 trade-league players.',
    sections: [
      {
        heading: 'Why it exists',
        paragraphs: [
          'Pricing, regex generation, expected-value checks, and item research are spread across unrelated sites. Exile Toolkit brings those focused workflows into one interface with shared league and data context.',
          'The beta supports Allflame, Hardcore Allflame, Standard, and Hardcore as one shared workspace league selection. Archived leagues and Path of Exile 2 remain later work.'
        ]
      },
      {
        heading: 'What it is not',
        paragraphs: [
          'It is not a game client, trade-site proxy, character manager, or authoritative source of game data. Results will identify their source, version, coverage, and uncertainty.'
        ]
      }
    ]
  },
  'data-sources': {
    eyebrow: 'Provenance',
    title: 'Data Sources',
    summary:
      'Every distributed dataset must explain where its records came from and how they may be used.',
    sections: [
      {
        heading: 'Market information',
        paragraphs: [
          'Price-aware tools use only documented poe.ninja economy endpoints through the Worker. Price snapshots are cached, timestamped, and labeled when stale.',
          'A missing price is unknown. It will never be converted into a zero value.'
        ]
      },
      {
        heading: 'Curated datasets',
        paragraphs: [
          'Each dataset record carries its source, game version, verification state, license metadata, and update time. Dataset changes are reviewed as versioned repository changes.',
          'The project will not scrape PoEDB, poe.re, undocumented GGG endpoints, or installed game files, and it will not copy unlicensed repositories or datasets.'
        ]
      }
    ]
  },
  privacy: {
    eyebrow: 'Guest-first',
    title: 'Privacy',
    summary:
      'The first release has no accounts, character imports, stash access, or Path of Exile OAuth.',
    sections: [
      {
        heading: 'Browser storage',
        paragraphs: [
          'Preferences, favorites, local Tool setups, local presets, explicitly saved calculations, bounded history, and complete shared Price snapshots in IndexedDB remain in the current browser. Users can clear this data.',
          'Disenchant item images and Crop Rotation Lifeforce icons load directly from the official game CDN without sending the Exile Toolkit page as referrer information.',
          'Pasted content will not be retained unless the user explicitly saves it.'
        ]
      },
      {
        heading: 'Diagnostics',
        paragraphs: [
          'When analytics are enabled, the browser sends only an aggregate page identifier such as privacy or regex and the identifier of an opened Tool. Analytics do not include a browser identifier, URL query string, referrer, Selection, Generated regex, pasted text, Custom entries, local presets, Saved calculations, history, or browser-storage contents.',
          'Development and automated tests keep outbound analytics disabled. Worker logs contain a generated request ID, method, route name, response status, duration, and public error code. They do not contain request bodies or URL query strings.',
          'Sentry and other third-party error trackers are not installed.'
        ]
      }
    ]
  },
  licenses: {
    eyebrow: 'Reuse boundaries',
    title: 'License Notices',
    summary:
      'Project code and game-related datasets have separate ownership and licensing requirements.',
    sections: [
      {
        heading: 'Project code',
        paragraphs: [
          'Exile Toolkit is intended to be published under the MIT License. Compatible third-party code retains its required notices.',
          'Public visibility on GitHub is not treated as permission to copy code, generated data, text, styling, or artwork.'
        ]
      },
      {
        heading: 'Datasets and game material',
        paragraphs: [
          'Every dataset declares its own provenance and license metadata. The project code license does not relicense Grinding Gear Games material or third-party data.',
          'This page will list exact component and dataset notices before the public beta ships.'
        ]
      }
    ]
  },
  'non-affiliation': {
    eyebrow: 'Independent project',
    title: 'Non-affiliation',
    summary:
      'Exile Toolkit is an independent community project and is not affiliated with or endorsed by Grinding Gear Games.',
    sections: [
      {
        heading: 'Ownership',
        paragraphs: [
          'Path of Exile, its names, game concepts, and associated intellectual property belong to Grinding Gear Games and their respective owners.',
          'The interface uses an original visual system and does not copy the official game interface or reference-site branding.'
        ]
      },
      {
        heading: 'External services',
        paragraphs: [
          'Links to the official Trade site and named data providers identify external services. They do not imply sponsorship, partnership, or endorsement.'
        ]
      }
    ]
  }
};

export function TrustPage({ page }: { page: TrustPageKey }) {
  const content = pages[page];

  return (
    <article className="mx-auto max-w-4xl px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-300/70">
        {content.eyebrow}
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-stone-50 sm:text-5xl">
        {content.title}
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-400">
        {content.summary}
      </p>

      {page === 'data-sources' ? <DatasetNotices /> : null}
      {page === 'data-sources' ? <CorrectionWorkflow /> : null}
      {page === 'licenses' ? <DatasetLicenseNotices /> : null}

      <div className="mt-12 space-y-5">
        {content.sections.map(section => (
          <section
            key={section.heading}
            className="rounded-xl border border-white/8 bg-white/[0.025] p-6 sm:p-7"
          >
            <h2 className="text-lg font-medium text-stone-200">
              {section.heading}
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-stone-500 sm:text-base">
              {section.paragraphs.map(paragraph => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Link
        className="mt-10 inline-flex text-sm font-medium text-amber-300 transition-colors hover:text-amber-200"
        to="/"
      >
        Return to workspace
      </Link>
    </article>
  );
}

const shippedDatasets = [
  { label: 'Maps Dataset', dataset: mapDataset },
  { label: 'Map modifiers Dataset', dataset: mapModifierDataset }
] as const;

const shippedDatasetNotices = shippedDatasets.map(item => ({
  ...item,
  summary: summarizeDatasetProvenance(item.dataset)
}));

function DatasetNotices() {
  return (
    <div className="mt-10 grid gap-4 lg:grid-cols-2">
      {shippedDatasetNotices.map(({ label, dataset, summary }) => {
        return (
          <section
            key={dataset.id}
            aria-label={label}
            className="rounded-xl border border-amber-300/15 bg-amber-300/[0.025] p-5"
          >
            <h2 className="font-medium text-stone-100">{label}</h2>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm text-stone-300">
              <dt>Version</dt>
              <dd>{dataset.version}</dd>
              <dt>Game</dt>
              <dd>Path of Exile {summary.gameVersions.join(', ')}</dd>
              <dt>Verification</dt>
              <dd>
                {summary.verificationStates
                  .map(state => (state === 'reviewed' ? 'Reviewed' : state))
                  .join(', ')}
              </dd>
              <dt>Source</dt>
              <dd className="space-y-1">
                {summary.sources.map(source => (
                  <a
                    key={`${source.name}-${source.url}`}
                    className="block text-amber-200 underline"
                    href={source.url}
                    title={`Source for ${source.entryNames.join(', ')}`}
                  >
                    {source.name}
                  </a>
                ))}
              </dd>
              <dt>License</dt>
              <dd className="space-y-1">
                {summary.licenses.map(license => (
                  <a
                    key={`${license.name}-${license.url}`}
                    className="block text-amber-200 underline"
                    href={license.url}
                  >
                    {license.name}
                  </a>
                ))}
              </dd>
              <dt>Updated</dt>
              <dd>{summary.updatedDates.join(', ')}</dd>
            </dl>
            <p className="mt-4 text-sm leading-6 text-stone-300">
              <span className="font-medium text-stone-100">Coverage:</span>{' '}
              {dataset.coverage}
            </p>
          </section>
        );
      })}
      <DisenchantDatasetNotice />
      <CropRotationSourceNotice />
    </div>
  );
}

function DatasetLicenseNotices() {
  return (
    <div className="mt-10 grid gap-4 lg:grid-cols-2">
      {shippedDatasetNotices.map(({ label, dataset, summary }) => (
        <DatasetLicenseNotice
          key={dataset.id}
          label={label}
          dataset={dataset}
          summary={summary}
        />
      ))}
      <DisenchantLicenseNotice />
      <CropRotationLicenseNotice />
    </div>
  );
}

function CropRotationSourceNotice() {
  return (
    <section
      aria-label="Crop Rotation calculation"
      className="rounded-xl border border-amber-300/15 bg-amber-300/[0.025] p-5"
    >
      <h2 className="font-medium text-stone-100">Crop Rotation calculation</h2>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm text-stone-300">
        <dt>Model</dt>
        <dd>Cropbot reference setup</dd>
        <dt>Game</dt>
        <dd>Path of Exile 3.25+ T16 Harvest</dd>
        <dt>Sources</dt>
        <dd className="space-y-1">
          <a
            className="block text-amber-200 underline"
            href="https://github.com/masonk/cropbot"
          >
            Cropbot by masonk
          </a>
          <a
            className="block text-amber-200 underline"
            href="https://forgottenarbiter.github.io/Poe-Harvest-Mechanics/"
          >
            Forgotten Arbiter Harvest mechanics analysis
          </a>
        </dd>
      </dl>
      <p className="mt-4 text-sm leading-6 text-stone-300">
        <span className="font-medium text-stone-100">Uncertainty:</span> Visible
        seed counts and tiers are not modeled. Published transition evidence
        also reports uncertainty, particularly for T2 to T3 and T3 to T4.
      </p>
    </section>
  );
}

function DisenchantDatasetNotice() {
  const { provenance } = disenchantDatasetManifest;

  return (
    <section
      aria-label="Disenchant Dust Dataset"
      className="rounded-xl border border-amber-300/15 bg-amber-300/[0.025] p-5"
    >
      <h2 className="font-medium text-stone-100">Disenchant Dust Dataset</h2>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm text-stone-300">
        <dt>Version</dt>
        <dd>{disenchantDatasetManifest.version}</dd>
        <dt>Game</dt>
        <dd>Path of Exile {provenance.gameVersion}</dd>
        <dt>Verification</dt>
        <dd>Reviewed</dd>
        <dt>Source</dt>
        <dd>
          <a className="text-amber-200 underline" href={provenance.source.url}>
            {provenance.source.name}
          </a>
        </dd>
        <dt>License</dt>
        <dd>
          <a className="text-amber-200 underline" href={provenance.license.url}>
            {provenance.license.name}
          </a>
        </dd>
        <dt>Updated</dt>
        <dd>{provenance.updatedAt.slice(0, 10)}</dd>
      </dl>
      <p className="mt-4 text-sm leading-6 text-stone-300">
        <span className="font-medium text-stone-100">Coverage:</span>{' '}
        {disenchantDatasetManifest.coverage}
      </p>
      <p className="mt-3 text-sm leading-6 text-stone-400">
        Published Dust values are verified at item level 84. Jewellery compares
        q0 and q20 with current catalyst cost when catalyst pricing is
        available.
      </p>
    </section>
  );
}

function DatasetLicenseNotice({
  label,
  dataset,
  summary
}: {
  label: string;
  dataset: CuratedDataset;
  summary: DatasetProvenanceSummary;
}) {
  return (
    <section
      aria-label={`${label} license`}
      className="rounded-xl border border-white/10 bg-white/[0.025] p-5"
    >
      <h2 className="font-medium text-stone-100">{label}</h2>
      <p className="mt-3 text-sm leading-6 text-stone-300">
        Version {dataset.version} uses {summary.sources.length}{' '}
        {summary.sources.length === 1 ? 'source' : 'sources'} under{' '}
        {summary.licenses.map((license, index) => (
          <span key={`${license.name}-${license.url}`}>
            {index > 0 ? ', ' : null}
            <a className="text-amber-200 underline" href={license.url}>
              {license.name}
            </a>
          </span>
        ))}
        . The license applies to the sourced records, not the Exile Toolkit
        code.
      </p>
    </section>
  );
}

function DisenchantLicenseNotice() {
  const { provenance } = disenchantDatasetManifest;

  return (
    <section
      aria-label="Disenchant Dust Dataset license"
      className="rounded-xl border border-white/10 bg-white/[0.025] p-5"
    >
      <h2 className="font-medium text-stone-100">Disenchant Dust Dataset</h2>
      <p className="mt-3 text-sm leading-6 text-stone-300">
        Version {disenchantDatasetManifest.version} reuses the pinned{' '}
        <a className="text-amber-200 underline" href={provenance.source.url}>
          poe-disenchant-tool Dust mapping
        </a>{' '}
        under the{' '}
        <a className="text-amber-200 underline" href={provenance.license.url}>
          MIT License
        </a>
        . The required notice is kept in the repository beside the imported
        mapping.
      </p>
      <p className="mt-3 text-sm leading-6 text-stone-400">
        The mapping also retains its upstream PoEDB references. Exile Toolkit
        does not fetch those references at runtime.
      </p>
      <p className="mt-3 text-sm leading-6 text-stone-400">
        The published Dataset boundary is item level 84. Catalyst-aware
        jewellery calculations compare q0 and q20 using market catalyst cost.
      </p>
    </section>
  );
}

function CropRotationLicenseNotice() {
  return (
    <section
      aria-label="Crop Rotation calculation notice"
      className="rounded-xl border border-white/10 bg-white/[0.025] p-5"
    >
      <h2 className="font-medium text-stone-100">Crop Rotation calculation</h2>
      <p className="mt-3 text-sm leading-6 text-stone-300">
        Crop Rotation calculation adapted from Cropbot by masonk. Source:{' '}
        <a
          className="text-amber-200 underline"
          href="https://github.com/masonk/cropbot"
        >
          https://github.com/masonk/cropbot
        </a>
        .
      </p>
      <p className="mt-3 text-sm leading-6 text-stone-400">
        Harvest transition assumptions are attributed separately to the{' '}
        <a
          className="text-amber-200 underline"
          href="https://forgottenarbiter.github.io/Poe-Harvest-Mechanics/"
        >
          Forgotten Arbiter analysis
        </a>
        .
      </p>
    </section>
  );
}

function CorrectionWorkflow() {
  return (
    <section
      id="corrections"
      aria-labelledby="corrections-title"
      className="mt-10 scroll-mt-6 rounded-xl border border-white/10 bg-white/[0.025] p-6"
    >
      <h2 id="corrections-title" className="text-lg font-medium text-stone-100">
        Curated entry corrections
      </h2>
      <p className="mt-3 text-sm leading-6 text-stone-400">
        Report a missing or incorrect Curated entry through the project issue
        tracker. Include the category, Dataset version, exact entry name, and a
        public evidence link. Do not include a Selection, Generated regex,
        Custom entry, pasted text, preset, or Saved calculation.
      </p>
    </section>
  );
}
