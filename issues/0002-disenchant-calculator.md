---
title: Build the Disenchant calculator and shared price snapshot platform
status: open
labels:
  - ready-for-agent
---

## Problem Statement

Experienced Path of Exile 1 trade-league players need to compare hundreds of unique items before buying items to turn into Thaumaturgic Dust. Market prices, Dust values, item-level assumptions, quality assumptions, stock levels, and official Trade searches currently live across separate sites or remain implicit. This makes it easy to rank an item using stale, incomplete, or incompatible data.

Exile Toolkit already has a working guest-first workspace and one complete Regex Tool. It does not yet have the shared poe.ninja price platform or reviewed Dust dataset needed for a trustworthy Disenchant calculator. Missing data must remain unknown instead of becoming zero, and a partial poe.ninja refresh must never produce an internally inconsistent Ranking.

## Solution

Add a Disenchant Tool for the current challenge league. It presents unique weapons, armour, and accessories in a compact ranked table on desktop and compact cards on mobile. Players can search, filter, sort, favorite candidates, inspect data assumptions, and open an exact search on the official Trade site.

The Tool defaults to Dust per Chaos. Dust per Gold and Estimated gold fee remain hidden until the player enables them. Every Ranking identifies its Price snapshot and Dust dataset. Unpriced candidates and Dust-unavailable items remain visible through explicit filters but never receive invented ratios.

Add a shared Worker-backed poe.ninja price service for this Tool and later price-aware Tools. A refresh publishes only when every required item category and the Divine-to-Chaos rate succeeds. Price snapshots remain Fresh for one hour, Stale for at most 24 hours, and unusable for price-dependent output after that. The browser retains only the last complete snapshot as a bounded fallback.

Import the reference project's MIT-licensed base dust mapping through a repeatable local process. Preserve its notice and record-level Provenance, generate a versioned repository Dataset, and verify representative item-level 85 values before publishing it.

## User Stories

1. As an experienced PoE 1 trade-league player, I want a Disenchant Tool inside Exile Toolkit, so that I do not need another site open beside the game.
2. As a player, I want the Tool to use the workspace's Active league, so that prices and Trade searches refer to the same challenge league.
3. As a player, I want unique weapons, armour, and accessories in one view, so that I can compare the supported equipment categories together.
4. As a player, I want every supported current-league unique represented, so that the Tool does not silently omit inconvenient data gaps.
5. As a player, I want distinguishable poe.ninja variants kept separate, so that different market prices and Trade searches are not merged incorrectly.
6. As a player, I want variants merged only when their Dust value and Trade search are identical, so that duplicate rows do not add noise.
7. As a player, I want each candidate to show its unique name and base type, so that similarly named variants remain distinguishable.
8. As a player, I want a small item icon beside the name, so that I can scan the table quickly.
9. As a player, I want the row to remain usable when its icon fails, so that an external image problem does not hide the item.
10. As a player, I want Dust values based on item level 85, so that the Ranking uses the confirmed maximum-level assumption.
11. As a player, I want weapons and armour calculated at 20% quality, so that their displayed Dust values use the intended buying workflow.
12. As a player, I want jewellery and items that cannot gain quality calculated at 0%, so that the Tool does not add an unpriced catalyst assumption.
13. As a player, I want every row labeled `ilvl 85 - q20` or `ilvl 85 - q0`, so that I can see its assumptions without opening another page.
14. As a player, I want an accessible explanation of the Dust assumptions, so that quality, item level, influence, corruption, and Dataset version are explicit.
15. As a player, I want the baseline to assume no influence and no corruption implicit, so that bonuses do not inflate the promised result.
16. As a player, I want a warning that corrupted weapons or armour below q20 may return less Dust, so that an allowed corrupted Trade listing does not mislead me.
17. As a player, I want to see the raw Dust value, so that I can judge total output as well as efficiency.
18. As a player, I want Dust per Chaos as the default Ranking, so that the main view answers which purchases return the most Dust for their market cost.
19. As a player, I want to enable Dust per Gold when I care about asynchronous Trade fees, so that secondary efficiency information remains available without crowding the default view.
20. As a player, I want Estimated gold fee labeled as an estimate, so that I do not mistake it for a guaranteed charge.
21. As a player, I want Estimated gold fee and its filter hidden by default, so that uncommon information does not dominate the table.
22. As a player, I want Dust per Gold calculated from the same Dust assumptions as Dust per Chaos, so that changing Ranking mode does not change the candidate itself.
23. As a player, I want Missing prices treated as unknown, so that missing market data never becomes a zero-cost opportunity.
24. As a player, I want Unpriced candidates excluded from both price Rankings, so that ratios remain meaningful.
25. As a player, I want Unpriced candidates hidden by default when a usable Price snapshot exists, so that ranked results remain compact.
26. As a player, I want the Unpriced filter to show how many candidates it hides, so that the data gap remains visible.
27. As a player, I want an Unpriced filter, so that I can inspect candidates whose Dust data exists but whose price is missing.
28. As a player, I want the full Dust dataset shown as Unpriced when no usable Price snapshot exists, so that an upstream outage does not erase non-price data.
29. As a player, I want a poe.ninja item with no Dust record labeled `Dust unavailable`, so that new or missing items are not omitted silently.
30. As a player, I want Dust-unavailable items excluded from both Rankings, so that the Tool does not invent a Dust value.
31. As a player, I want the Dust-unavailable filter to show its hidden count, so that Dataset coverage is visible from the main workflow.
32. As a contributor, I want a Dust-unavailable item linked to the correction workflow, so that I can report the exact coverage gap safely.
33. As a player, I want the Tool to report Dataset coverage, so that I can distinguish a complete Ranking from a partial one.
34. As a player, I want to search candidates by name, so that I can find a known unique quickly.
35. As a player, I want to filter by item category, so that I can focus on weapons, armour, or accessories.
36. As a player, I want to set a maximum Chaos price, so that results fit my buying budget.
37. As a player, I want to set a minimum Dust value, so that low-output purchases do not fill the result list.
38. As a player using Dust per Gold, I want to set a maximum Estimated gold fee, so that expensive asynchronous purchases can be excluded.
39. As a player, I want to clear each filter independently, so that changing one constraint does not erase the rest of my setup.
40. As a player, I want a normal no-results message while filters remain available, so that an empty filtered view is not presented as a data failure.
41. As a player, I want to sort by unique name, so that I can browse candidates alphabetically.
42. As a player, I want to sort by chaos-equivalent price, so that I can inspect the cheapest or most expensive candidates.
43. As a player, I want to sort by Dust value, so that I can find the highest total Dust output.
44. As a player, I want to sort by Dust per Chaos, so that I can control the direction of the main Ranking.
45. As a player who enables Dust per Gold, I want to sort by that value, so that the optional mode remains a real Ranking rather than a display-only column.
46. As a player, I want to favorite a candidate, so that items I repeatedly buy remain easy to find.
47. As a player, I want a favorite shown with a filled amber star and subtle amber background, so that the state is visible without relying on the icon alone.
48. As a player, I want matching favorites placed before other filtered candidates, so that value sorting does not bury my preferred items.
49. As a player, I want filtering applied before favorites are pinned, so that a favorite does not bypass an active price or category constraint.
50. As a player, I want favorites placed before pagination, so that a matching favorite never ends up on a later page.
51. As a player, I want an Unpriced favorite placed after priced favorites when Unpriced candidates are visible, so that useful ranked favorites remain first.
52. As a player, I want favorites tied to the unique and distinguishable variant instead of the league, so that they carry into later leagues.
53. As a player, I want opening Trade to leave favorites unchanged, so that browsing a listing is not mistaken for a preference.
54. As a player, I want no separate mark or purchased state, so that the Tool avoids a second row flag without a clear purpose.
55. As a player, I want to toggle favorites individually, so that I do not clear useful choices by accident.
56. As a player, I want Clear local data to remove Disenchant favorites, filters, settings, and the cached Price snapshot, so that local persistence remains under my control.
57. As a desktop player, I want 10 rows per page by default, so that the ranked table remains easy to scan.
58. As a player, I want page-size choices of 10, 20, 30, 40, and 50, so that I can choose between a short view and fewer page changes.
59. As a player, I want my page size retained after reload, so that the table returns to my preferred density.
60. As a player, I want the page number reset after reload or filter changes, so that retained state does not open on an empty later page.
61. As a mobile player, I want compact cards with the same filtering, sorting, favorites, and pagination behavior, so that the Tool remains usable away from desktop.
62. As a player, I want a table-level Smart, Chaos, or Divine currency control, so that I can choose how market prices are displayed.
63. As a player, I want Smart currency to show prices below one Divine in Chaos and prices at or above one Divine in Divine, so that values remain readable across price ranges.
64. As a player, I want calculations to keep using the snapshot's chaos-equivalent values regardless of display currency, so that changing presentation cannot change a Ranking.
65. As a player, I want the selected currency display retained locally, so that I do not repeat the choice after reload.
66. As a player, I want candidates with fewer than 150 listings labeled Low stock, so that thin markets are visible without changing their calculated value.
67. As a player, I want the Low stock icon in the top-right corner of the Trade button, so that the warning remains close to the buying action.
68. As a pointer or keyboard user, I want the Low stock tooltip to explain the listing count threshold, so that the warning is not communicated by an icon alone.
69. As a player, I want Low stock candidates to remain ranked, so that market depth does not become an invented price adjustment.
70. As a player, I want the listing count available in secondary information, so that I can inspect the evidence behind a Low stock warning.
71. As a player, I want one Trade button per candidate, so that I can move from comparison to buying without rebuilding a search.
72. As a player, I want Trade to open in a new tab, so that Exile Toolkit stays open beside the official listing page.
73. As a player, I want the Trade search scoped to the Active league, exact unique, and base type, so that it matches the row I selected.
74. As a player, I want the Trade search to require item level 85, so that listed items meet the Dust assumption.
75. As a player, I want the Trade search to allow corrupted items, so that valid bargains are not excluded.
76. As a player, I want the Trade search to show currently available listings, so that its results are useful for buying now.
77. As a player, I want no maximum price added to Trade, so that a stale poe.ninja estimate does not silently hide listings.
78. As a player, I want no row detail panel, so that the table remains focused and the official Trade site owns listing detail.
79. As a player, I want a visible poe.ninja source and retrieval time, so that I can judge the market information before using it.
80. As a player, I want relative snapshot age in the header, so that freshness is readable at a glance.
81. As a player, I want the exact local retrieval date and time in an accessible tooltip, so that I can inspect the timestamp precisely.
82. As a player, I want the relative age label updated once per minute without fetching data, so that the display does not become misleading while the page stays open.
83. As a player, I want no manual refresh button, so that a click cannot bypass the shared cache policy or create needless upstream traffic.
84. As a player, I want the Tool to check for a newer Price snapshot when it opens, so that I receive current cached data without extra work.
85. As a player, I want the Tool to check again when the tab regains focus after the snapshot becomes one hour old, so that returning to the Tool refreshes its context.
86. As a player, I want no background polling while I use the table, so that the interface does not churn or call upstream services unnecessarily.
87. As a player, I want a Fresh snapshot to remain valid for one hour, so that every price-aware Tool follows one understandable policy.
88. As a player, I want an amber `Stale prices` badge and notice for snapshots between one and 24 hours old, so that fallback data cannot look current.
89. As a player, I want Rankings to remain usable during the bounded Stale period, so that a brief poe.ninja outage does not remove a useful recent comparison.
90. As a player, I want price Rankings disabled after 24 hours, so that old market data does not produce a definitive Ranking.
91. As a player, I want the last complete Price snapshot used after any partial poe.ninja failure, so that the table never mixes data from different refresh attempts.
92. As a player, I want the Divine-to-Chaos rate and all required item categories captured together, so that price display and calculations agree.
93. As a first-time visitor during an outage, I want the Dust dataset and coverage states to remain available, so that the Tool fails honestly instead of becoming blank.
94. As a player, I want only complete Price snapshots retained in my browser, so that a local fallback cannot contain mixed market data.
95. As a privacy-conscious player, I want item icons loaded without referrer information, so that the official CDN does not receive the Exile Toolkit page address.
96. As a privacy-conscious player, I want item names, filters, favorites, prices, and Trade targets excluded from analytics, so that Tool use remains aggregate.
97. As a keyboard user, I want `Ctrl` or `Cmd` + `Shift` + `3` to open the Disenchant Tool, so that I can switch Tools without a pointer.
98. As a keyboard user, I want the Disenchant Tool listed in global Tool search, so that the existing navigation pattern works for the new Tool.
99. As a keyboard user, I want table controls, favorites, filters, pagination, tooltips, and Trade actions to have accessible names and visible focus, so that I can complete the workflow without a pointer.
100. As a player using reduced motion, I want the Disenchant Tool to respect my workspace preference, so that table interactions do not add unwanted motion.
101. As a maintainer, I want the Dust dataset version, coverage, license, and Provenance shown publicly, so that the Ranking remains reviewable.
102. As a maintainer, I want the MIT notice for reused material preserved, so that compatible reuse does not erase attribution.
103. As a maintainer, I want a repeatable local Dust import and generation process, so that updates produce reviewable repository diffs.
104. As a maintainer, I want runtime requests limited to prices instead of third-party Dust data, so that a runtime dependency cannot change calculations without review.
105. As a maintainer, I want representative item-level 85 Dust fixtures verified before release, so that the reused item-level 84 output is not relabeled incorrectly.
106. As a maintainer, I want strict validation to reject malformed Price snapshots and Dust records, so that invalid external data cannot reach the Ranking.
107. As a maintainer, I want every Price-aware Tool to consume the same snapshot contract, so that future calculators inherit the same freshness and missing-price behavior.
108. As a maintainer, I want partial upstream success logged without publishing a partial snapshot, so that failures remain diagnosable without corrupting user results.
109. As a maintainer, I want the main Disenchant workflow covered in Chromium, Firefox, and WebKit, so that the supported browser policy applies to the new Tool.
110. As a maintainer, I want normal filtering, sorting, and pagination to complete within the project's 100-millisecond local-calculation target, so that a thousand candidates remain responsive.

## Implementation Decisions

- Keep the existing client-first workspace. Domain calculations and state rules remain independent of React and Cloudflare.
- Add a shared Price snapshot contract for the Active league. It contains source identity, retrieval time, Freshness state, Divine-to-Chaos rate, required category coverage, and normalized item prices.
- Fetch documented poe.ninja endpoints through the Worker. Send an identifying user agent, use conditional requests where supported, bound retries, and sanitize public failures.
- Treat unique weapons, unique armour, unique accessories, and the Divine-to-Chaos rate as one atomic refresh. Publish none of the refresh when any required request or validation fails.
- Retain the last complete snapshot after a partial or total refresh failure. Do not merge categories or currency rates from different attempts.
- Treat a snapshot as Fresh for one hour and Stale for up to 24 hours. Snapshots older than 24 hours cannot support a price-dependent Ranking.
- Return the retained snapshot with an explicit Freshness state when upstream requests fail. Return a stable public unavailable response when no complete snapshot exists.
- Keep structured Worker logs free of full upstream payloads, query strings, filters, favorites, candidate names, and Trade targets.
- Store the last complete browser snapshot in IndexedDB. Store table preferences and favorites in the existing versioned local-state system. Clear local data removes both.
- Validate persisted state and recover to defaults when stored data is malformed, partial, or from an unsupported version.
- Use one canonical Price snapshot across all future poe.ninja-backed Tools. Do not create Tool-specific freshness policies.
- Reuse the reference repository's MIT-licensed base Dust mapping with its copyright notice. Preserve the mapping's upstream Provenance instead of assuming the repository license relicenses third-party or GGG material.
- Import and generate the Dust dataset through local scripts. Runtime code reads the reviewed, versioned output and never downloads Dust data from the reference tool or PoEDB.
- Give every Dust record a stable identity, unique name, base type, supported category, base Dust value, item-level and quality assumptions, game version, verification state, license, source, and update time.
- Generate item-level 85 Dust values independently from the base mapping. Do not copy or rename generated item-level 84 values.
- Require representative observed fixtures for item-level 85 q20 weapons and armour, q0 jewellery, and an item that cannot gain quality before releasing the Dataset.
- Model a Disenchant candidate, Unpriced candidate, Dust-unavailable item, Favorite candidate, Ranking, Price snapshot, Fresh snapshot, Stale snapshot, Missing price, Dust value, Provenance, and Coverage with the existing glossary meanings.
- Join poe.ninja items to Dust records by reviewed identities. Keep distinguishable variants separate. Merge only when Dust value and generated Trade search are identical.
- Keep poe.ninja items without Dust data as Dust-unavailable items. Keep Dust records without a usable price as Unpriced candidates.
- Calculate Dust per Chaos as Dust value divided by the normalized chaos-equivalent price. Missing or non-positive inputs yield no ratio.
- Calculate Dust per Gold as Dust value divided by Estimated gold fee. Keep the column and related filter hidden until enabled.
- Calculate Estimated gold fee using an independently tested implementation of the compatible reference formula. Label the result as estimated.
- Base Dust values on item level 85, no influence, and no corruption implicit. Use q20 for weapons and armour, and q0 for jewellery and items that cannot gain quality.
- Use a fixed Low stock rule of fewer than 150 poe.ninja listings. The warning never changes the price or Ranking value.
- Build official Trade searches in the client from approved candidate fields and the Active league. Use exact unique name and base type, minimum item level 85, corrupted items allowed, currently available listings, and no maximum price.
- Open Trade in a new tab with safe external-link attributes. Do not embed or proxy the official Trade site.
- Use TanStack Table for sorting, filtering, pagination, and visible-column state. Keep the existing Exile Toolkit dark visual system and individually selected shadcn controls.
- Borrow useful table interactions from the reference Tool without copying its component code, page structure, copy, branding, or visual identity.
- Default to 10 rows per page and offer 10, 20, 30, 40, and 50. Apply filters, pin matching favorites, sort each group, then paginate.
- Keep favorites independent of the league and identify them by stable unique and variant identity. Favorites remain subject to active filters.
- Use a filled amber star and subtle amber row or card background for favorites. Keep text contrast unchanged and expose pressed state semantically.
- Do not add marks, purchased state, bulk favorite clearing, row detail panels, a manual price refresh, shareable URL state, or Saved calculations.
- Persist ranking mode, visible columns, filters, currency display, page size, Trade settings, and favorites locally. Reset page number after reload or filter changes.
- Use a table-level Smart, Chaos, or Divine display control. Smart uses Chaos below one Divine and Divine at or above one Divine. Rankings always use normalized chaos-equivalent values.
- Show relative snapshot age and update the label once per minute without fetching. Put the exact local timestamp in an accessible tooltip.
- Check for a snapshot when the Tool opens and on focus after the current snapshot reaches one hour. Do not poll in the background.
- Load item images from the official game CDN with no-referrer behavior. Preserve row dimensions and text when an image is blocked or fails.
- Add the Tool to the catalog, sidebar, home view, global search, aggregate Tool-open analytics allowlist, and keyboard navigation. Bind it to `Ctrl` or `Cmd` + `Shift` + `3`.
- Keep analytics aggregate. Do not send candidate identity, search text, filters, favorites, Ranking values, or Trade actions.
- Update Data Sources, License Notices, Privacy, keyboard help, and beta coverage text for the new Tool and external image request.
- Use the current challenge league only. Keep interface strings ready for later Traditional Chinese translation.

## Testing Decisions

- A good test breaks when a user-visible contract, public Worker response, or published Dataset changes incorrectly. It does not assert component structure, hook calls, internal helper calls, CSS classes, TanStack internals, or storage-library details.
- Use three test seams: the public browser workflow, the Worker HTTP boundary, and the Dust dataset generation and validation boundary. These are the highest existing seams that separately catch interface, upstream, and curated-data failures.
- Browser tests drive the Disenchant Tool through visible controls with controlled Worker responses. Follow the existing Regex Tool browser style and use accessible roles and names.
- The main browser workflow covers opening from navigation and global search, default Dust-per-Chaos ordering, name and numeric filters, independent filter clearing, sorting, favorites before pagination, page-size persistence, Smart and forced currency display, optional Dust-per-Gold mode, and a generated Trade link.
- Browser tests cover `Ctrl` or `Cmd` + `Shift` + `3`, visible focus, keyboard-operable tooltips, favorite pressed state, no-results guidance, 320-pixel operation, and reduced motion. Extend the existing accessible-operation suite rather than creating component-only accessibility tests.
- Browser tests cover Fresh, Stale, expired, unavailable, Unpriced, Dust-unavailable, Low stock, broken image, and malformed local-state behavior through visible output.
- Browser tests prove that a usable snapshot hides Unpriced and Dust-unavailable rows by default while showing their counts, and that filters can reveal them without assigning ratios.
- Browser tests prove that a first visit without prices still shows the full Dust dataset as Unpriced and disables price Rankings.
- Browser tests verify that Trade opens a new tab with the Active league, exact unique and base type, minimum item level 85, corrupted items allowed, available status, and no maximum price.
- Browser tests verify that Trade does not change favorites and that favorites survive reload, remain across league context changes when later supported, obey filters, and stay on the first applicable page.
- Browser tests verify that Clear local data removes Disenchant settings, favorites, and the browser Price snapshot.
- Worker tests call the public price route with injected upstream responses and cache behavior. Follow the existing Worker tests by asserting status, headers, stable public bodies, request correlation, and sanitized logs.
- Worker tests prove that all required item categories and the Divine rate publish as one snapshot only after every response validates.
- Worker tests cover one failed category, a failed currency rate, timeout, malformed JSON, invalid numeric values, retry exhaustion, conditional-response reuse, and total upstream failure.
- Worker tests prove that partial success never replaces the prior complete snapshot or changes its retrieval time.
- Worker tests cover Fresh output before one hour, Stale output from one through 24 hours, and unavailable price output after 24 hours.
- Worker tests prove that no prior snapshot yields a stable unavailable response and that public errors and logs contain no upstream body, query string, candidate name, filter, favorite, or Trade target.
- Contract tests validate the Price snapshot and public unavailable response independently of React and Cloudflare types.
- Domain tests cover Dust per Chaos, Dust per Gold, Missing price, non-positive input, deterministic sorting, favorites as the primary ordering rule, Unpriced favorites, variant identity, fixed Low stock threshold, Smart currency presentation inputs, and stable Trade-search input generation.
- Dataset tests run the local import and generation process against fixed fixtures. They assert deterministic output, stable identities, category coverage, record-level Provenance, MIT notice metadata, valid source URLs, game version, verification state, and no duplicate unique and variant identities.
- Dataset tests verify representative observed item-level 85 q20 and q0 Dust results. They fail if item-level 84 generated values are relabeled as item-level 85 without a verified calculation.
- Dataset tests cover a new poe.ninja item without Dust data and a Dust record without price data through the normalized join result.
- Performance tests use a representative thousand-candidate fixture. Filtering, sorting, favorite pinning, and pagination must complete within the existing 100-millisecond local-calculation target.
- Cross-browser release tests run the main workflow in Chromium, Firefox, and WebKit using the project's existing supported-browser configuration.

## Out of Scope

- Unique flasks, jewels, maps, and item categories beyond weapons, armour, and accessories
- Standard, Hardcore, Ruthless, or Path of Exile 2 pricing
- Character import, stash import, Path of Exile OAuth, or account features
- Pasted-item parsing or ranking items already owned by the player
- Catalyst optimization for jewellery
- Per-item quality controls
- Slot-efficiency and Dust-per-Chaos-per-slot rankings
- Gold-to-Chaos total-cost optimization
- Confidence-adjusted or volume-adjusted market prices
- Automatic suppression of Low stock candidates
- A maximum price in generated Trade searches
- Embedded or proxied Trade listings
- Manual price refresh and background polling
- Marks, purchased state, or automatic state changes after opening Trade
- Shareable Disenchant URLs and Saved calculations
- Row detail drawers or copied listing detail
- Runtime Dust downloads, PoEDB scraping, or unreviewed Dataset mutation
- Proxying or permanently storing official item images
- A database or administration interface for Dust records
- Cross-device favorites or settings synchronization
- Traditional Chinese interface text in this delivery
- Sentry, ads, donations, subscriptions, or monetization work
- Production deployment or Cloudflare environment setup beyond code and local Worker compatibility

## Further Notes

- The reference repository is MIT licensed, but its base mapping cites community and PoEDB sources. Preserve the MIT notice and record the upstream Provenance instead of treating every field as newly owned project data.
- The reference implementation generates item-level 84 values. Exile Toolkit's item-level 85 rule needs independent calculation and observed fixtures before the Dataset can receive a reviewed Verification state.
- The fixed Low stock threshold is fewer than 150 listings. It is a warning near the Trade action, not a Ranking adjustment or a promise that listings remain available.
- The price platform is shared work, not Disenchant-only plumbing. Cluster jewels, scarab expected value, warrants, and later price-aware Tools must reuse the same complete-snapshot and Freshness rules.
- The Tool can be developed and tested against the local Worker without deploying Cloudflare resources.
