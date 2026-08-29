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

Show every current-league unique weapon, armour, and accessory covered by the reviewed dust dataset in a searchable, filterable table. Default to dust per chaos. Players can enable the hidden dust-per-gold column and sort when needed. Show market price and Dust value, but do not add a slot-efficiency ranking. Estimated gold fee is secondary information rather than a default emphasis.

Dust values use the minimum item level selected in Trade settings, defaulting to the reference dataset's item level 84. The imported influence count is included and no corruption bonus is implicit. Quality-capable items use the imported q20 path; items that cannot gain quality use q0. Catalyst-aware jewellery selection compares q0 and q20 once catalyst pricing is available. Each row shows its selected item level and quality with an accessible explanation of the assumptions and Dataset version. Distinguishable poe.ninja variants remain separate unless their Dust value and official Trade search are identical. Corrupted weapons or armour below q20 may return less dust, and the Tool warns the player without excluding the listing.

Unpriced candidates have no ratios and do not participate in rankings. A usable snapshot hides them from the default table and shows their hidden count beside the filter. With no usable snapshot, the Tool shows the full dust dataset as Unpriced.

A poe.ninja item missing from the dust dataset remains available as "Dust unavailable," counts against reported coverage, stays outside both rankings, and links to the correction workflow. The default table hides these items, shows their count beside the filter, and lets the player include them.

Candidates with fewer than 150 listings remain ranked but count as Low stock. A small warning icon sits in the top-right corner of the Trade button and explains the warning on hover or keyboard focus.

Players can favorite rows locally with a filled amber star and subtle amber row or card background. Favorites follow the unique and distinguishable variant across leagues. The Tool applies filters, puts all matching favorites first, then paginates. An Unpriced favorite appears last within the favorite group when Unpriced candidates are visible. Opening Trade never changes favorites. Players toggle favorites individually; only Clear local data removes them in bulk. The Tool has no separate mark or purchased state.

Each row opens an exact current-league Trade search in a new tab for currently available listings of the unique and base type, with the selected minimum item level from 65 through 84, corrupted items allowed, and no maximum price. Changing that setting also recalculates displayed Dust values and Rankings.

Filters cover name, item category, maximum chaos price, minimum Dust value, maximum gold fee, and whether unpriced candidates are visible. Estimated gold fee and its filter stay hidden until the player selects dust per gold or opens advanced filters.

Desktop pages show 10 rows by default and offer 10, 20, 30, 40, or 50 rows per page. Mobile uses compact cards with the same pagination setting and a small item icon beside the name and base type. Browsers load official CDN icons without referrer information. Failed images fall back to text without changing layout. The desktop columns are Favorite; item icon, unique name, base type, and quality tag; market price; Dust value; active ranking value; and Trade.

Players can sort by unique name, chaos-equivalent price, Dust value, and dust per chaos. Favorites remain the first sorting rule. Rows have no detail panel; concise labels and accessible tooltips explain secondary information, and the official Trade site provides listing detail.

A compact table-level currency control selects Smart, Chaos, or Divine display. Smart shows prices below one Divine in Chaos and prices at or above one Divine in Divine. Calculations always use the snapshot's chaos-equivalent value.

Ranking mode, visible columns, filters, page size, and favorites persist locally, while page number resets after reload or filter changes. The Tool has no share URL or Saved calculation action.

Each filter can be cleared independently. When no candidate matches, the Tool keeps the controls visible and shows a normal no-results state rather than a data error.

Every ranking identifies the price snapshot and dust dataset used. The Tool shows relative snapshot age, such as "Last updated 50 minutes ago," with the exact local date and time in an accessible tooltip. The relative label updates once per minute without fetching data, and the Tool has no manual refresh control.

An amber "Stale prices" badge and notice identify snapshots between one and 24 hours old. Rankings remain usable during that window. Older snapshots disable price rankings and produce the price-unavailable state.

The browser stores only complete price snapshots in IndexedDB. The Tool checks for a newer snapshot when opened and when the tab regains focus after one hour, without polling. Clear local data removes the stored snapshot. If no usable snapshot exists, the full dust dataset remains available as Unpriced candidates while price rankings stay disabled.

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

Item images load directly from the official game CDN without referrer information. A failed or blocked image does not prevent use of the Tool.

## Data behavior

- Use documented poe.ninja economy endpoints through the backend.
- Publish a price snapshot only after every required poe.ninja category succeeds. Never mix newly fetched categories with older categories; retain the last complete snapshot on any partial failure.
- Include the poe.ninja Divine-to-Chaos rate in the same complete snapshot. Never mix a new currency rate with older item prices.
- Treat price snapshots as fresh for one hour across all price-aware Tools.
- During upstream failure, use a labeled stale snapshot for at most 24 hours. Keep non-price data visible but disable price-dependent output when no usable snapshot exists.
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
