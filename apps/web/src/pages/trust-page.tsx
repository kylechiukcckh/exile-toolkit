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
          'The beta begins with the current challenge league and a map regex workflow. Standard and Path of Exile 2 remain later work.'
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
          'Later price-aware tools will use only documented poe.ninja economy endpoints through the Worker. Price snapshots will be cached, timestamped, and labeled when stale.',
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
          'Preferences, favorites, local presets, explicitly saved calculations, and bounded history will remain in the current browser. Users will be able to clear this data.',
          'Pasted content will not be retained unless the user explicitly saves it.'
        ]
      },
      {
        heading: 'Diagnostics',
        paragraphs: [
          'The beta uses structured operational logs and may collect aggregate page and tool usage. It will not send selections, pasted text, generated regexes, or saved calculations to analytics.',
          'Sentry and other third-party error tracking are deferred until a separate privacy review.'
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
