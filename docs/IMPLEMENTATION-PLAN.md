# Exile Toolkit implementation plan

## Phase 0: foundation

- Create a pnpm workspace with `apps/web`, `apps/api`, `packages/domain`, and `packages/data`.
- Configure React, TypeScript, Vite, Tailwind CSS, and shadcn in the web app.
- Use the shadcn MCP to inspect and add only the required components: button, command, checkbox, tabs, tooltip, dialog, dropdown menu, toast, and scroll area.
- Configure a Cloudflare Worker and local development proxy.
- Add formatting, linting, type checking, unit testing, browser testing, and build commands.
- Add GitHub pull-request checks and Cloudflare preview deployment.
- Add dataset schemas and validation before adding production data.

Exit condition: the empty shell deploys through a preview, its checks pass, and web and Worker code share types without importing framework code into the domain package.

## Phase 1: workspace shell

- Build the responsive sidebar, global header, home view, coming-later cards, data-health display, and error boundaries.
- Add compact and comfortable density settings.
- Add local preference, favorite, saved-calculation, and bounded-history stores.
- Add clear-local-data controls.
- Add URL tool-state encoding and decoding with versioning.
- Add keyboard shortcuts and accessible focus behavior.
- Centralize English strings for later Traditional Chinese support.
- Create About, Data Sources, Privacy, License Notices, and non-affiliation pages.

Exit condition: navigation, persistence, sharing, keyboard use, and responsive layouts pass browser tests.

## Phase 2: regex maps slice

- Define curated map and map-mod dataset records with provenance.
- Implement selection, normalization, safe shortening, splitting, and preview logic in `packages/domain`.
- Add unit fixtures for exact matches, regex metacharacters, Unicode, duplicate entries, overflow, and impossible constraints.
- Build searchable grouped checklists, built-in presets, local presets, custom entries, output parts, character counts, and copy actions.
- Add a missing-entry issue link carrying only non-sensitive context.
- Add browser tests for selecting, previewing, splitting, copying, sharing, restoring, and clearing state.

Exit condition: the advertised map and map-mod workflow is complete and satisfies the public release gate.

## Phase 3: regex expansion

Add vendor items, scarabs, Expedition, Heist, and Bestiary one category at a time. Each category requires source metadata, validation, match fixtures, and a reviewed dataset diff.

Exit condition: every category selected for regex version one meets the same quality bar as maps.

## Phase 4: price platform and disenchant

- Implement the Worker-side poe.ninja adapter with an identifying user agent, conditional requests, cache timestamps, bounded retry, and stale fallback.
- Define price snapshot and missing-price behavior in the domain package.
- Add source and freshness UI shared by all price-aware tools.
- Resolve dust-data provenance before distribution and preserve the MIT notice for reused licensed implementation material.
- Implement the three confirmed disenchant rankings and uncertainty behavior.

Exit condition: upstream failures cannot create zero prices or unlabeled rankings.

## Phase 5: cluster jewels

- Maintain a small, reviewed cluster dataset unless broader reuse permission is established.
- Implement compatibility and position logic independently.
- Add passive-count, item-level, enchant, price, and official Trade query behavior.

Exit condition: representative compatibility and position fixtures agree with independently verified examples.

## Phase 6: scarab expected value

- Fetch scarab prices from documented poe.ninja economy endpoints.
- Implement vendor-combination and expected-value calculations independently.
- Version probability data separately from prices and show its sample size and coverage.
- Refuse probability-based rankings when coverage is insufficient.

Exit condition: calculations identify both their price snapshot and probability dataset.

## Phase 7: warrants

- Define versioned warrant parsing and modifier rules from permitted sources.
- Parse pasted text without retaining it by default.
- Implement comparable-combination ranking and official Trade links.
- Keep warrant rules configurable across league changes.

Exit condition: supported and unsupported warrant inputs fail predictably and never claim unsupported coverage.

## Later work

- Standard league support
- Traditional Chinese translation
- Progressive Web App support
- Sentry after privacy review
- Optional owner administration interface when reviewed JSON changes no longer scale
- Accounts and cross-device sync only if local persistence proves insufficient
- PoE 2 tools through separate game-specific datasets and rules
- Ads only after written GGG guidance, a license audit, and a privacy update

