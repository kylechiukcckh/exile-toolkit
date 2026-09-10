---
title: Build the item Modifier foundation
status: open
labels:
  - ready-for-agent
---

## Problem Statement

Path of Exile players need several item workflows to agree on what a Modifier is, which tier it belongs to, what values it can roll, whether it can appear on a selected base, and whether it conflicts with other Modifiers. Exile Toolkit has no shared model for equipment Item modifiers, no parser for Copied item text, no base eligibility rules, and no repeatable way to import reviewed modifier data.

Without a common foundation, every future item Tool would need to invent its own parser, tier matching, quality handling, spawn rules, and conflict logic. Those implementations would disagree on special bases such as Focused Amulet, hybrid Modifiers, influenced pools, and modifiers whose displayed values differ from their Raw modifier values.

## Solution

Add a framework-independent Modifier system for current-version Magic and Rare equipment. It accepts English Basic copied item text from `Ctrl+C` and Detailed copied item text from `Alt+Ctrl+C`, matches supported lines to stable Item modifier records, validates tiers and Raw modifier values, and calculates Effective modifier values after applicable base and quality effects.

The same system returns Modifier pools for a selected base, item level, influence, acquisition source, Item quality, and Catalyst type. It enforces ordered spawn weights, item-level requirements, base-specific Affix capacity, Modifier-family conflicts, and slot usage without assuming every Rare item has three prefixes and three suffixes.

Maintainers prepare reviewed CSV snapshots from permitted references such as PoE Wiki and PoEDB. An atomic importer validates the complete snapshot and generates versioned runtime chunks by equipment class and source pool. Runtime parsing and calculations remain client-side and do not require a database or Worker request.

## User Stories

1. As a player, I want to paste an item copied from Path of Exile, so that Exile Toolkit can identify its Item modifiers.
2. As a player, I want to use Basic copied item text from `Ctrl+C`, so that I can start analysis with the normal clipboard format.
3. As a player, I want to use Detailed copied item text from `Alt+Ctrl+C`, so that the system can verify modifier names, tiers, tags, values, and ranges.
4. As a player, I want unsupported clipboard formats rejected, so that arbitrary text is not presented as a valid item.
5. As a player, I want English copied item text supported first, so that the initial parser has one explicit localization contract.
6. As a player, I want the copied item's rarity, base type, item level, Item quality, Catalyst type, influences, and item flags parsed, so that modifier validation uses the actual item context.
7. As a player, I want each supported detailed modifier annotation matched to one Item modifier, so that I can trust the reported name and tier.
8. As a player, I want tierless Modifiers shown without a fabricated tier label, so that the result matches the game data.
9. As a player, I want the actual value before a copied range read directly from Detailed copied item text, so that the system does not guess my roll.
10. As a player, I want a Basic copied item line matched when the item context and value prove one result, so that simple copies remain useful.
11. As a player, I want a prompt to use `Alt+Ctrl+C` when a Basic copied item line cannot prove one exact result, so that the system never reports a guess as certain.
12. As a player, I want an invalid-item message when Detailed copied item text cannot be verified, so that edited or impossible item text is not accepted.
13. As a player, I want invalid details to identify the failed line and reason, so that I can distinguish a bad name, tier, value, range, or eligibility rule.
14. As a player, I want valid-looking text missing from the current Dataset identified as unsupported, so that stale coverage is not confused with edited text.
15. As a player, I want hybrid Modifiers treated as one Modifier even when they produce several displayed lines, so that capacity and conflicts remain correct.
16. As a player, I want crafted, fractured, veiled, synthesized, influenced, corrupted, enchanted, and implicit annotations retained when the game supplies them, so that the result preserves source and slot meaning.
17. As a player, I want Raw modifier values validated against their allowed ranges, so that impossible rolls are rejected.
18. As a player, I want base magnitude effects applied to Raw modifier values, so that special bases produce the correct Effective modifier values.
19. As a player, I want Item quality applied only when enabled, so that I can compare values with and without quality effects.
20. As a player, I want a jewellery Catalyst type to affect only matching Modifier tags, so that catalyst calculations follow the selected quality method.
21. As a player, I want Effective modifier values rounded according to game precision rules, so that results agree with Path of Exile.
22. As a player, I want the result to expose final values without forcing a percentage display, so that future Tools can present numbers in their own layouts.
23. As a future Tool author, I want each independently rolled stat value preserved, so that multi-value and multi-line Modifiers do not lose information.
24. As a future Tool author, I want fixed values represented consistently, so that a fixed roll can use a Roll position of one without implying random variation.
25. As a player, I want to select an exact base type and item level, so that I can inspect the Modifiers eligible for that item.
26. As a player, I want to select influence and acquisition source conditions, so that unrelated Modifier pools are not mixed together.
27. As a player, I want normal, influenced, essence, crafted, veiled, implicit, corruption, enchantment, delve, and drop-only Modifier pools kept distinct, so that the origin of each option remains clear.
28. As a player, I want ordered spawn-weight rules evaluated against base and item tags, so that eligible Modifiers match the game's first-applicable-tag behavior.
29. As a player, I want zero-weight matches excluded, so that impossible Modifiers do not appear in a Modifier pool.
30. As a player, I want item-level requirements enforced, so that a selected base does not show tiers above its item level.
31. As a player, I want influence requirements enforced, so that influenced Modifiers appear only under valid influence conditions.
32. As a player, I want prefix and suffix usage validated independently from acquisition source, so that crafted or influenced affixes consume the correct slots.
33. As a player, I want Magic items to use their Magic affix baseline, so that they are not validated as Rare items.
34. As a player, I want Rare items to use their Rare affix baseline, so that normal capacity rules remain correct.
35. As a player, I want special base rules to adjust Affix capacity, so that bases with unusual prefix or suffix limits validate correctly.
36. As a player, I want special base rules retained with their source text, so that future Tools can explain why a capacity differs.
37. As a player, I want modifiers from the same family rejected when they cannot coexist, so that selecting two tiers of the same affix is impossible.
38. As a player, I want shared tags treated separately from conflicts, so that compatible Modifiers with similar behavior can coexist.
39. As a player, I want every selection conflict returned together, so that a future Tool can explain the complete invalid state.
40. As a future Tool author, I want parsing, matching, eligibility, calculations, and validation exposed as structured domain operations, so that Tools do not reimplement Modifier rules.
41. As a future Tool author, I want expected failures returned as typed results, so that user and Dataset problems do not rely on exceptions.
42. As a future Tool author, I want Modifier results independent of React and the Worker, so that the same rules work in tests and any client workflow.
43. As a player, I want Modifier data loaded only for the relevant equipment class and source pool, so that the initial application bundle does not contain the entire Dataset.
44. As a player, I want calculations to remain local after the required static chunks load, so that item contents are not sent to the backend.
45. As a maintainer, I want one canonical baseline of reviewed Modifier CSV files, so that Dataset changes are reproducible.
46. As a maintainer, I want normal, influenced, delve, drop-only, essence, crafted, veiled, implicit, corruption, and enchantment Modifiers stored by source pool, so that each source can be reviewed separately.
47. As a maintainer, I want base types and base rules stored separately from selectable Modifier pools, so that intrinsic base behavior is not mistaken for an affix.
48. As a maintainer, I want one CSV row per Modifier tier, so that every tier has an independently reviewable identity and range.
49. As a maintainer, I want JSON arrays in CSV cells for multi-value fields, so that stats, tags, families, and weights remain structured without duplicating a Modifier across rows.
50. As a maintainer, I want permanent Toolkit Modifier IDs, so that names, tiers, or values can change without breaking saved references.
51. As a maintainer, I want retired Toolkit IDs never reused, so that an old reference cannot silently point to a different Modifier.
52. As a maintainer, I want inactive Modifiers retained in canonical data but excluded from runtime pools, so that identity and change history survive removals.
53. As a maintainer, I want repeated Toolkit IDs merged only when their definitions match, so that one Modifier can have several acquisition sources without hiding inconsistent data.
54. As a maintainer, I want conflicting duplicate definitions to fail import, so that source-pool files cannot disagree silently.
55. As a maintainer, I want schema version, game version, and project revision recorded independently, so that format changes, GGG changes, and project corrections remain distinguishable.
56. As a maintainer, I want the Dataset reviewed for every supported league even when no Modifier changed, so that its claimed game version is explicit.
57. As a maintainer, I want to edit only records changed by GGG after the baseline import, so that league maintenance produces a focused repository diff.
58. As a maintainer, I want one invalid record or relationship to reject the complete import, so that runtime chunks are never partially updated.
59. As a maintainer, I want imported names, tiers, ranges, tags, weights, groups, and base rules cross-validated, so that internal relationships cannot reference missing records.
60. As a maintainer, I want disagreement between PoE Wiki, PoEDB, and prepared CSV data to require review, so that no source wins without evidence.
61. As a maintainer, I want the chosen value and evidence recorded when sources disagree, so that later reviewers understand the correction.
62. As a maintainer, I want source, license, attribution, preparation date, game version, and reviewer retained for every snapshot, so that redistributed data remains traceable.
63. As a maintainer, I want generated lookup indexes for IDs, families, normalized stat templates, eligibility tags, generation types, and slot types, so that runtime operations avoid repeated full scans.
64. As a maintainer, I want an original TypeScript implementation, so that the project does not copy PoB code or assume another project's license covers this implementation.
65. As a maintainer, I want externally observable fixtures based on real copied items and documented Modifier tables, so that behavior can be compared with the game and established tools.
66. As a maintainer, I want normal item analysis to meet the existing 100-millisecond local-calculation target after chunks load, so that future Tools remain responsive.

## Implementation Decisions

- Put Modifier types, parsing, matching, value calculation, eligibility, selection validation, and typed results in the framework-independent domain layer.
- Put canonical CSV files, import tooling, manifests, generated chunks, and generated indexes in the data layer. The web layer may render results but owns no Modifier rules.
- Do not add a production database. This follows the existing decision to prefer reviewed versioned files until runtime editing, user submissions, or measured query needs justify a database.
- Support current-version Magic and Rare one-handed and two-handed weapons, bows, wands, shields, quivers, helmets, body armour, gloves, boots, rings, amulets, and belts.
- Accept only English Basic copied item text from `Ctrl+C` and Detailed copied item text from `Alt+Ctrl+C`.
- Parse clipboard sections and annotations rather than treating the item as an unordered collection of lines. Preserve rarity, base, item level, quality, Catalyst type, influences, flags, modifier sections, annotation tags, and raw line text.
- Treat one Item modifier as capable of producing one or more copied lines. Match and validate the complete line group before consuming affix capacity or reporting success.
- Use permanent maintainer-assigned Toolkit IDs. IDs are not derived from mutable names, tiers, item levels, or ranges. Never reuse an inactive ID.
- Make a source identifier optional because PoE Wiki and prepared CSV data do not guarantee one official Modifier ID.
- Store Modifier name, explicit tier or no-tier state, source pool, domain, generation type, slot type, required item level, families, tags, added tags, implicit tags, ordered spawn weights, generation weights, and one or more stat definitions.
- Store each stat by stable Toolkit stat ID, English text template, inclusive raw minimum and maximum, internal precision, display precision, scalability, and rounding behavior.
- Keep source pool separate from generation and slot types. Influenced, crafted, essence, delve, fractured, and drop-only Modifiers may still consume a prefix or suffix slot.
- Use Modifier families for mutual exclusion. Do not infer conflicts from names, rendered text, or shared tags.
- Evaluate ordered spawn weights by selecting the first entry whose tag matches the item. A positive weight permits spawning and supplies relative weight; zero prohibits spawning. Preserve generation-weight order and added-tag behavior for later crafting consumers.
- Define base types with permanent Toolkit IDs, names, item classes, requirements, tags, ordinary quality rules, normal rarity capacities, and structured base rules.
- Calculate Affix capacity from the rarity baseline and base-specific rules. Do not hardcode three prefixes and three suffixes for every Rare base.
- Keep structured base rules separate from selectable Modifier pools even when the game displays them in the implicit section. Preserve the original English rule text and parsed effects.
- Support structured base effects for prefix and suffix capacity adjustments, explicit prefix, suffix, or all-modifier magnitude, and whether implicit modifiers may change. Extend the effect vocabulary only through schema-versioned additions.
- Treat values in Detailed copied item text as Raw modifier values when the annotation identifies an unapplied magnitude effect. Calculate Effective modifier values after base magnitude and enabled Item-quality effects.
- Apply ordinary Item quality and jewellery Catalyst type as separate item context. Default the future quality toggle to applied, but return structured results so the consumer controls presentation.
- Normalize variable rolls from zero at the raw minimum to one at the raw maximum. Use one Roll position per independently rolled numeric stat. Fixed values use one.
- Implement game-compatible precision and rounding independently. Modifier magnitude is floored at the applicable internal precision, while conversion and display formatting follow explicit stat metadata. Do not use one global integer-floor shortcut.
- Show no tier label for a Modifier whose data defines no tier. Never derive or fabricate a tier at runtime.
- For Basic copied item text, return a match only when item context, normalized stat templates, values, and eligibility identify one Modifier. Otherwise return `detailed-copy-required`.
- For Detailed copied item text, validate name, declared tier, tags where supplied, Raw modifier values, declared ranges, generation and slot type, base eligibility, item level, influence, family conflicts, and Affix capacity.
- Use typed results for expected outcomes: success, invalid item text, detailed copy required, unsupported Modifier, invalid Modifier value, ineligible Modifier, Modifier conflict, and Dataset unavailable. Reserve exceptions for programming faults.
- An invalid detailed item result must retain line-specific reasons. Unsupported current-looking text must remain distinguishable from structurally invalid or impossible item text.
- Return all selection conflicts in one validation result rather than stopping at the first conflict.
- Keep normal, influenced, essence, crafted, veiled, implicit, corruption, enchantment, delve, and drop-only source pools distinct.
- Use maintainer-prepared canonical CSV files. Do not scrape PoE Wiki or PoEDB at runtime or during normal builds.
- Use separate Modifier CSV files by source pool plus separate base and base-rule CSV files. Keep one Modifier tier per CSV row.
- Encode multi-value stats, families, tags, spawn weights, generation weights, and related fields as JSON arrays inside CSV cells. Parse them strictly and reject unknown or malformed structures.
- Treat the canonical CSV files as the maintained source of truth after the initial baseline. Maintainers edit changed records and review repository diffs rather than applying a separate delta format.
- Permit the same Toolkit ID in several source-pool files only when all shared definition fields match. Merge acquisition sources for matching definitions and reject conflicting duplicates.
- Retain removed records as inactive in canonical data. Exclude them from runtime pools and report them as outside current coverage if encountered in copied input.
- Version data with an importer schema version, reviewed PoE game version, and project correction revision.
- Reject the complete import on any invalid row, duplicate, broken reference, invalid family, invalid tier, malformed weight ordering, unsupported base rule, inconsistent duplicate, or provenance failure.
- Generate static runtime chunks by equipment class and source pool. Generate lookup indexes by Toolkit ID, Modifier family, normalized stat template, base eligibility tag, generation type, and slot type.
- Load only chunks required by a pasted item's equipment class or a selected base and source pool. Parsing and calculations make no Worker request. Full offline reload remains outside this specification.
- Use PoE Wiki and PoEDB as reviewed references. Record disagreements and require maintainer resolution instead of assigning either source automatic precedence.
- Preserve a manifest containing source names, source URLs, CC BY-NC-SA 3.0 license URL where applicable, attribution, preparation date, reviewed game version, reviewer, and recorded source disagreements.
- Study PoB and RePoE behavior as prior art but implement original TypeScript. Do not copy code or assume their repository licenses relicense extracted game data.

## Testing Decisions

- The highest seam is one browser workflow built over the public Modifier foundation. It pastes a Detailed copied Rare item with base rules, matches its modifiers, applies magnitude and quality settings, displays Effective modifier values, then uses the same Dataset to request eligible Modifiers for the parsed base. This seam may use a minimal test presentation until a dedicated Tool is specified.
- A second browser scenario pastes Basic copied item text that cannot prove an exact tier and verifies the request for `Alt+Ctrl+C`. It then pastes malformed detailed text and verifies the invalid-item message and line-specific details.
- Browser tests assert user-visible text, accessible actions, source and Dataset version information, and privacy behavior. They do not assert React components, CSS classes, generated chunk filenames, or internal indexes.
- Use existing workspace navigation, accessible-operation, and data-backed Tool browser tests as prior art for routing, clipboard-adjacent input, structured failure states, and version display.
- Domain parser tests use exact English clipboard fixtures for Magic and Rare equipment, both clipboard formats, separators, requirements, sockets, quality, item level, influences, implicits, enchantments, fractured and crafted annotations, tierless Modifiers, hybrid Modifiers, and multi-line stats.
- Domain matching tests assert matches by Toolkit ID and semantic result. They cover exact detailed matches, uniquely resolvable Basic lines, Basic ambiguity, unknown current-looking text, edited names, tier mismatches, range mismatches, and values outside allowed ranges.
- Effective-value tests cover Focused Amulet capacity and 100% explicit magnitude, prefix-only and suffix-only magnitude bases, ordinary quality, each supported Catalyst type, unscalable stats, negative values, decimal precision, fixed stats, multi-value stats, and game-compatible flooring and presentation.
- Eligibility tests cover ordered spawn weights, the first matching tag, zero weights, default exclusions, generation weights, added tags, implicit tags, item-level thresholds, influence requirements, source pools, domains, and unsupported equipment classes.
- Selection tests cover Magic and Rare capacity baselines, special base adjustments, prefix and suffix slot use across acquisition sources, family conflicts, several simultaneous conflicts, implicit and enchantment slots, and Modifiers that consume no ordinary affix slot.
- Importer tests exercise the public import command against temporary complete snapshots. They cover valid generation, malformed CSV, malformed JSON cells, unknown columns, missing required fields, duplicate and reused Toolkit IDs, conflicting cross-pool duplicates, missing references, invalid tier states, invalid stat precision, unordered or malformed weights, unsupported base rules, inactive records, and provenance failures.
- Importer tests assert atomic output. A failed import must leave the previously generated Dataset unchanged and must not emit a partial manifest or chunk set.
- Generated-data tests validate every committed runtime chunk and manifest, confirm index integrity, prove each active record is reachable through its expected chunk, and prove inactive records are excluded.
- Version tests cover schema incompatibility, game-version review, revision changes, retained Toolkit IDs across edits, and inactive identity retention.
- Provenance tests verify source URLs, license metadata, attribution, preparation date, reviewer, and recorded conflict resolutions.
- Chunk-loading tests verify that a request loads only the required equipment-class and source-pool assets and that domain operations make no Worker call.
- Privacy tests verify that Copied item text remains in the browser and is not sent through analytics or API requests.
- Performance tests measure parsing, matching, eligibility lookup, and selection validation after the relevant chunks load. Normal inputs must complete within the project's 100-millisecond local-calculation target.
- Tests compare public inputs and semantic outputs. They must not assert private helper calls, parser loop structure, array order where the contract does not specify it, or a particular indexing implementation.
- Reference fixtures must record their origin and reviewed game version. PoB and RePoE may be used for behavioral comparison, but continuous integration must not download or execute either project.
- A useful test fails when user-visible behavior, the CSV contract, generated Dataset validity, or a public domain result changes. It stays green through internal refactoring that preserves those contracts.

## Out of Scope

- A finished Item builder or item-card interface
- Slider, dropdown, sorting, and Modifier-editor interaction design
- Unique items and Unique-item modifiers
- Jewels, including regular, Abyss, Cluster, Timeless, and special Jewels
- Flasks, charms, maps, tinctures, Heist equipment, gems, and other unsupported item classes
- Historical Modifier browsing or runtime historical pools
- Non-English Copied item text and localized stat templates
- Screenshots, OCR, game-window capture, clipboard monitoring, or automatic game integration
- Path of Exile 2
- Runtime PoE Wiki or PoEDB scraping
- Automatic extraction from installed game files
- Copying PoB parsing or calculation code
- A production database, administration UI, or user-submitted Modifier records
- Server-side item parsing or storage of pasted item contents
- Full offline reload or PWA installation
- Crafting simulation, crafting probabilities, or a claim that spawn weight alone is a probability
- Item pricing, build evaluation, Trade search generation, or recommendation logic
- Rendering a percentage label for Roll position
- Persisting or sharing analyzed item text

## Further Notes

- PoE Wiki exposes human-readable groups, tiers, item levels, stat ranges, and tags. Prepared CSV data must also provide ordered spawn weights, generation weights, stable Toolkit IDs, domains, added tags, implicit tags, stat precision, and base rules when the reference table does not expose them directly.
- PoE Wiki and PoEDB publish content under CC BY-NC-SA 3.0 unless otherwise noted. The Dataset manifest must preserve attribution and identify exceptions rather than applying one blanket license to every field or asset.
- RePoE documents a proven conceptual separation between Modifier definitions, stats, base tags, ordered spawn weights, generation weights, groups, and translations. Exile Toolkit will implement its own reviewed schema and code.
- PoB confirms that one in-game Modifier can translate to several displayed lines and that copied item annotations carry flags such as crafted, fractured, implicit, enchantment, synthesis, influence, and unscalable values.
- A Focused Amulet demonstrates both kinds of base behavior required by the foundation: reduced Affix capacity and increased explicit Modifier magnitude. Detailed copied text provides raw values and annotations; the foundation calculates the Effective modifier values.
- The durable file-first, client-side architecture is recorded in the accepted ADR for the Modifier foundation and builds on the existing versioned-files decision.
