# Exile Toolkit product specification

## Purpose

Exile Toolkit gives experienced Path of Exile 1 trade-league players one workspace for calculations that currently require several unrelated websites. It coordinates native tools, documented APIs, versioned datasets, local browser state, and links to official Trade searches.

The first release targets the current challenge league. The model should allow later Standard and Path of Exile 2 support without making either part of the initial scope.

## Product boundaries

- Public website with no user accounts, character import, stash access, or Path of Exile OAuth in version one.
- Tools share the active league, price snapshot, preferences, favorites, and bounded local history.
- Safe tool inputs can be shared in a URL. Large or sensitive pasted input remains local.
- Official Trade searches open on the official site. Exile Toolkit does not embed or proxy the Trade interface.
- The beta is free and self-funded. Donations may be added later. Ads require written guidance from GGG, a dataset-license audit, and a privacy update before activation.

## Tool roadmap

Tools are built in this order:

1. Regex generator
2. Disenchant calculator
3. Cluster jewel tool
4. Scarab expected-value calculator
5. Warrant price checker

The first usable milestone is the application shell plus the regex generator. Other tools appear as honest coming-later cards until their main workflows are complete.

### Regex generator

The first slice supports maps and map modifiers. Later slices add vendor items, scarabs, Expedition, Heist, and Bestiary.

Required behavior:

- Generate inclusion-only regexes from searchable, grouped checklists.
- Support select-all, clear, built-in presets, local custom presets, and local custom entries.
- Split output into multiple regex parts when required by the game's accepted length.
- Show the character count and a copy action for every part.
- Preview matched and unmatched entries before copying.
- Never shorten an expression by silently allowing false positives.
- Link missing curated entries to the public correction workflow.

### Disenchant calculator

Rank unique items by dust per chaos, dust per gold cost, and slot efficiency. Every ranking identifies the price snapshot and dust dataset used. Missing values prevent a definitive ranking rather than becoming zero.

### Cluster jewel tool

Check notable compatibility and position, passive count, item-level and enchant constraints, estimated price, and an official Trade search. The compatibility algorithm is project-owned; source data must carry explicit provenance.

### Scarab expected-value calculator

Rank three-for-one vendor combinations using cached poe.ninja prices and independently implemented calculations. Expected-value results require a versioned probability dataset; insufficient probability coverage must be visible.

### Warrant price checker

Parse pasted warrant text, identify relevant modifiers, compare supported combinations, estimate market value, and create an official Trade search. The warrant tool remains a normal tool across leagues, with configurable rules when GGG changes the mechanic.

## Experience

- Original dark visual system built from individually selected shadcn components.
- Desktop-first layout with a functional mobile presentation.
- Left tool sidebar, global league and data-status header, and one active tool in the main area.
- Home view with tool cards, favorites, recently used tools, and data-health notices.
- Compact density by default with a comfortable option.
- English first. Keep interface strings ready for later Traditional Chinese translation.
- Target WCAG 2.2 AA. Support keyboard navigation, visible focus, non-color status cues, global tool search, module switching, search focus, and copy shortcuts.
- Support current Chrome, Edge, Firefox, and Safari. Clipboard shortcuts may degrade, but manual input and calculations must still work.

## Local persistence and privacy

Store preferences, favorites, saved calculations, and at most 20 recent actions per tool in the browser. Never retain pasted content unless the user explicitly saves it. Provide a clear-local-data action.

Collect privacy-friendly aggregate page and tool usage only. Do not collect pasted input or calculation contents. Use client error boundaries and structured Worker logs initially; add Sentry only after a separate privacy review.

## Data behavior

- Use documented poe.ninja economy endpoints through the backend.
- Cache price snapshots and refresh approximately every 15 minutes in line with upstream guidance.
- Use a labeled stale snapshot during upstream failure. Disable price-dependent output when no snapshot exists.
- Show source and retrieval time with price-dependent results.
- Record source, game version, verification state, license, and update time for every dataset record.
- Label beta coverage and uncertainty. Do not present incomplete data as authoritative.
- Do not scrape PoEDB, poe.re, undocumented GGG endpoints, or installed game files.
- Do not copy unlicensed code or datasets. Preserve notices for compatible licensed material.

## Release gate

The first public beta may be announced when the map and map-mod regex workflow works end to end, production deployment is stable, required public information pages exist, automated checks pass, and no known high-severity defect remains.

Required public pages are About, Data Sources, Privacy, License Notices, and a GGG non-affiliation disclaimer.

## Quality targets

- Shell usable within two seconds on a typical desktop connection.
- Cached tool switching feels immediate.
- Local calculations complete within 100 milliseconds for normal inputs.
- Pull requests run formatting, linting, type checking, unit tests, dataset validation, builds, and browser smoke tests.
- Parsers and calculations use fixtures with known outputs.
- Data adapters have integration tests.
- Every completed tool has a browser test for its main workflow.

