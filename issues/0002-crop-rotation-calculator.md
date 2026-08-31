---
title: Add the Harvest Crop Rotation calculator
status: open
labels:
  - ready-for-agent
---

## Problem Statement

Path of Exile players using the Crop Rotation Atlas keystone must choose an order for three to five Crop pairs while accounting for Lifeforce prices, crop upgrades, map and Atlas modifiers, and whether each unchosen crop withers. The useful route changes when an unchosen crop survives. Existing reference tools either operate turn by turn or generate Atlas-analysis tables, so they do not provide one accessible projected Rotation path that a player can update as outcomes become known.

## Solution

Add a Crop Rotation calculator to the Exile Toolkit workspace. A player selects three to five Crop pairs, reviews an editable Cropbot reference setup, and explicitly starts the calculation. The Tool uses current poe.ninja Lifeforce prices and versioned T16 mechanic assumptions to calculate an expected-value Rotation path.

The initial path assumes every unchosen crop withers. Every paired step includes a "Did not wither" control. Selecting it keeps that step, makes the unchosen crop available as a Surviving crop, and replaces the affected downstream path with the calculated outcome branch. The result exposes expected Lifeforce by color, Chaos value, snapshot age, assumptions, and model limitations while retaining the established Disenchant Tool styling and workspace shell.

## User Stories

1. As a Crop Rotation player, I want to enter the Crop pairs visible in my Sacred Grove, so that the calculation starts from my actual encounter.
2. As a player, I want Yellow–Yellow, Blue–Blue, Purple–Purple, Yellow–Blue, Yellow–Purple, and Blue–Purple inputs, so that every unordered color pairing is represented.
3. As a player, I want to add duplicate Crop pairs, so that repeated color combinations are represented.
4. As a player, I want counters with increment and decrement controls, so that entering repeated Crop pairs is quick.
5. As a keyboard user, I want every counter and action to have an accessible name and visible focus, so that I can complete the workflow without a pointer.
6. As a player, I want the total Starting crop set limited to three through five Crop pairs, so that invalid calculations cannot start.
7. As a player, I want the Calculate action disabled below three Crop pairs, so that the minimum requirement is clear.
8. As a player, I want to calculate with three, four, or five Crop pairs, so that the Tool supports different Grove layouts.
9. As a player, I want calculation to start only when I press Calculate, so that input changes do not continuously replace the result.
10. As a player, I want the first result to assume every unchosen crop withers, so that I see one compact default Rotation path.
11. As a player, I want each step to name the Lifeforce color and source Crop pair, so that I know what to harvest in game.
12. As a player, I want duplicate pairs treated as interchangeable, so that the Tool does not claim to distinguish information I never entered.
13. As a player, I want a warning about visible seed numbers and tiers, so that I know when in-game evidence should override a color-only result.
14. As a player with duplicate or same-color pairs, I want guidance to choose the stronger visible crop, so that the simplified model does not hide its limitation.
15. As a player, I want a "Did not wither" control beside every paired step, so that I can record or explore a survival outcome.
16. As a player, I want future projected steps to remain interactive, so that I can inspect possible outcome scenarios before reaching them.
17. As a player, I want a checked step to remain visible, so that the path retains the decision that produced the branch.
18. As a player, I want the unchosen crop to become a Surviving crop after a "Did not wither" outcome, so that it can appear in a later step.
19. As a player, I want only the affected suffix replaced after an outcome changes, so that the stable route prefix remains easy to follow.
20. As a player, I want earlier outcomes to be editable, so that I can correct a mistaken entry or explore another branch.
21. As a player, I want invalid downstream outcomes discarded when an earlier branch changes, so that checkbox positions are not applied to different crops.
22. As a player, I want the path to support up to ten steps from five Starting Crop pairs, so that multiple Surviving crops are not omitted.
23. As a player, I want the Tool to maximize expected currency value, so that route order reflects both crop upgrades and current Lifeforce prices.
24. As a player, I want expected Yellow, Blue, and Purple Lifeforce available for each result, so that I can inspect what drives its value.
25. As a player, I want expected Chaos value shown, so that the result uses a familiar common unit.
26. As a player, I want the expected remaining route value available at each step, so that I can understand the consequence of the next choice.
27. As a player, I want detailed values in compact disclosures or tooltips, so that the main path remains readable beside the game.
28. As a player, I want current poe.ninja Lifeforce prices used automatically, so that I do not need to enter three prices manually.
29. As a player, I want the Price snapshot source and age shown with the result, so that I can judge whether the valuation is usable.
30. As a player, I want a labeled stale snapshot retained after a refresh failure, so that a temporary upstream outage does not immediately remove the Tool.
31. As a player, I want price-dependent calculation disabled when the last complete snapshot is older than 24 hours, so that expired prices do not appear current.
32. As a player, I want missing or malformed Lifeforce prices treated as unavailable rather than zero, so that they cannot corrupt the route.
33. As a player, I want one collapsed Advanced settings area, so that normal pair entry remains compact.
34. As a player, I want Advanced settings to remain available without being prompted during every calculation, so that repeated use is fast.
35. As a player, I want the Cropbot reference setup available as editable defaults, so that I can start from the agreed configuration.
36. As a player, I want to edit the chance that the unchosen crop does not wilt, so that the model matches my Atlas setup.
37. As a player, I want to edit map pack size and map item quantity, so that expected yields can reflect the map I am running.
38. As a player, I want to edit increased Lifeforce quantity, additional-monster chance, monster-duplication chance, and Doubling Scarab use, so that expected yields reflect my setup.
39. As a player, I want the T16 transition assumptions visible and editable in Advanced settings, so that the calculation does not hide uncertain probabilities.
40. As a returning player, I want selected Crop pairs and Advanced settings saved locally, so that a reload does not erase setup work.
41. As a returning player, I want Wither outcomes reset after reload, so that observations from an old Grove do not contaminate a new run.
42. As a player, I want changed inputs to leave the prior path visible but mark it outdated, so that I can compare before recalculating.
43. As a player, I want Calculate to become Recalculate after inputs change, so that the required action is explicit.
44. As a player, I want Reset calculation to clear pairs, outcomes, and the route without changing Advanced settings, so that I can begin another Grove with the same setup.
45. As a player, I want a separate Restore reference setup action, so that I can undo Advanced-setting changes without clearing the current pairs.
46. As a player, I want the Tool to work in the existing desktop workspace, so that it feels consistent with the Disenchant calculator.
47. As a mobile or narrow-screen user, I want the pair controls, settings, and path to remain usable, so that the Tool does not require the reference screenshot's wide layout.
48. As a user with color-vision needs, I want crop colors identified by text as well as color, so that color is not the only signal.
49. As a player, I want assumptions, game version, evidence, and uncertainty linked from the result, so that an expected-value path is not presented as guaranteed advice.
50. As a maintainer, I want deterministic route selection and tie-breaking, so that the same inputs always produce the same path.
51. As a maintainer, I want normal calculations to complete within the project's 100-millisecond target, so that manual calculation feels immediate.
52. As a maintainer, I want the shared economy snapshot to support later prices and Tools, so that each Tool does not create a separate poe.ninja data boundary.
53. As a maintainer, I want the Cropbot and mechanics sources recorded, so that the adapted calculation and probability assumptions remain traceable.

## Implementation Decisions

- Add Crop Rotation as a normal Tool inside the existing workspace shell, navigation, tool catalog, analytics vocabulary, responsive layout, and accessibility system.
- Follow the existing Disenchant Tool's dark visual language, spacing, cards, controls, status treatment, and responsive conventions. The supplied screenshots are loose composition references and must not replace the established shell or styling.
- Model the six unordered initial Crop pair kinds and the three Surviving crop kinds as domain concepts. Accept three to five initial pairs and allow duplicates.
- Keep pair instances interchangeable when their entered colors match. Do not infer seed counts, tiers, position, or identity from color-only input.
- Put the calculation in the framework-independent domain layer. The web layer renders semantic step records and never owns the optimization rules.
- Adapt the permitted Cropbot behavior into TypeScript. Add the source notice: "Crop Rotation calculation adapted from Cropbot by masonk. Source: https://github.com/masonk/cropbot."
- Cite Forgotten Arbiter's Harvest mechanics analysis as the evidence for the versioned T16 upgrade assumptions. Record uncertainty, including conflicting evidence for the T2-to-T3 rate and the estimated T3-to-T4 range.
- Do not generate, import, or ship Cropbot's Atlas-analysis CSV files. They are not runtime inputs and cannot represent interactive Wither outcomes.
- Generate the small expected-yield table in memory from validated configuration. Use deterministic, memoized dynamic programming over canonical remaining crops and color-upgrade counters.
- Use an explicit stable choice order and documented deterministic tie-break. Do not inherit map-iteration ordering from the Rust reference.
- Calculate the complete decision policy needed by the selected three-to-five-pair state. Expose a route-projection operation that starts with all paired outcomes set to wither and replays selected "Did not wither" outcomes.
- Give projected steps stable semantic identities derived from the path state rather than their displayed index. When an earlier outcome changes, retain the common prefix and discard outcome selections that no longer refer to the same semantic steps.
- A paired choice with a "Did not wither" outcome creates a Surviving crop of the unchosen color. A Surviving crop is a later harvest step and has no Wither outcome of its own.
- Keep all visible future paired steps interactive. The control represents a projected or observed outcome, not a separate completed-step state.
- Require an explicit Calculate action. Enable it only for three through five initial pairs. Do not calculate automatically before or after the first calculation.
- After pair or setting changes, retain the last result with a clear outdated state and change the primary action to Recalculate. Outcome changes within an unchanged calculated policy update the visible branch immediately.
- Persist selected Crop pairs and Advanced settings as local Tool state. Do not persist Wither outcomes or calculated results across reloads.
- Provide separate Reset calculation and Restore reference setup actions. Reset calculation clears pairs, outcomes, and results while preserving settings.
- Use the editable Cropbot reference setup as the initial profile: 60% chance the unchosen crop does not wilt, 65% map pack size, 212% map item quantity, 18% increased Lifeforce quantity, 10% additional-monster chance, 6% monster-duplication chance, Doubling Scarab enabled, and T16 transitions of 25%, 20%, and 3%.
- Label the profile "Cropbot reference setup," not "recommended." Validate finite numeric values, percentage bounds, and nonnegative map and Atlas modifiers before calculation.
- Keep Advanced settings in a persistent, collapsed area on the page. Never interrupt Calculate with a settings prompt.
- Generalize the Disenchant-specific price contract, Worker persistence, browser cache, and endpoint naming into one complete workspace economy snapshot as accepted in the shared-snapshot ADR.
- Parse Yellow from `vivid-lifeforce`, Blue from `primal-lifeforce`, and Purple from `wild-lifeforce` in the Currency response already fetched from poe.ninja. Treat `primaryValue` as Chaos per Lifeforce only after validating that the response quote currency is Chaos.
- Require one finite positive value for every Lifeforce color. Do not publish a new shared snapshot if a required value is missing, duplicated, malformed, nonpositive, or quoted against an unexpected currency.
- Adding Lifeforce prices must not add another upstream request. Persist normalized Lifeforce prices with the Divine conversion and Disenchant categories from the same refresh attempt.
- Version the shared response and storage keys so older Disenchant-only snapshots cannot pass as complete shared snapshots.
- Preserve the existing snapshot policy: Fresh for one hour, Stale and usable through 24 hours, then unavailable for price-dependent calculation. Retain the last complete snapshot on any partial refresh failure.
- Do not provide manual Lifeforce-price overrides in this slice.
- Show expected Lifeforce by color, expected Chaos value, expected remaining value, snapshot source and age, assumptions, and uncertainty. Keep the route rows compact and place detailed calculations in accessible disclosures or tooltips.
- Extend public data-source and license information with the Cropbot permission notice and Forgotten Arbiter mechanics source.

## Testing Decisions

- The primary seam is the completed Crop Rotation browser workflow. A browser test selects duplicate Crop pairs until the total reaches the valid range, calculates the default all-wither path, marks a paired step "Did not wither," observes the Surviving crop and replaced suffix, changes an input, observes the outdated state, and recalculates.
- Browser tests assert accessible labels, enabled and disabled actions, visible route text, outcome behavior, stale-result messaging, persistence across reload, separate reset behavior, and responsive usability. They do not assert component structure, CSS classes, hook calls, or memoization details.
- Use the existing workspace navigation and accessible-operation browser tests as prior art for routing, keyboard access, local state, and shell integration. Use the Disenchant ranking browser test as prior art for price-backed result rendering and freshness states.
- Domain tests cover input validation, all six Crop pairs, duplicate counts, three-to-five boundaries, all Wither and no-wither mappings, same-color Surviving crops, color-upgrade transitions, expected-yield generation, deterministic tie-breaking, route projection, stable step identities, invalidated suffix outcomes, and the ten-step upper-bound scenario.
- Domain tests compare public calculation inputs and semantic outputs. They must not assert recursion order, cache entries, cloned state, private helpers, or a particular internal dynamic-programming representation.
- Add invariant tests for color symmetry under symmetric prices and configuration, deterministic results across repeated runs, no-wither adding exactly one Surviving crop, and terminal paths consuming every available crop exactly once.
- Add selected numeric parity fixtures based on the permitted Cropbot reference setup. Keep them self-contained and document their provenance. Do not require Rust, Cargo, an external repository, Windows-specific paths, or generated CSVs in continuous integration.
- Economy-domain and contract tests cover the complete shared schema, the three Lifeforce color mappings, Chaos-per-Lifeforce units, rejection of incomplete or invalid values, old-version rejection, and preservation of existing Disenchant data.
- Worker tests extend the existing complete-snapshot cases. The happy path proves all Lifeforce prices are normalized while the upstream request count remains unchanged. Failure cases cover each missing ID, duplicate IDs, nonpositive or invalid values, unexpected quote currency, retained complete fallback, freshness, expiry, and coherent ETag behavior.
- Browser-cache tests cover shared-snapshot versioning, league isolation, complete writes, rejection of old or partial payloads, and removal through Clear local data.
- Accessibility tests cover keyboard operation of counters, Calculate, Advanced settings, route disclosures, outcome checkboxes, resets, focus order, visible focus, text labels alongside color, and non-color communication of Fresh, Stale, unavailable, and outdated states.
- Performance tests measure a five-pair worst-case calculation and outcome-branch replacement against the existing under-100-millisecond normal-calculation target. Add a Web Worker only if measurement shows the memoized domain calculation blocks the page.
- A test is useful when a change to user-visible behavior or a public domain/API contract breaks it while an internal refactor that preserves behavior does not.

## Out of Scope

- Reading exact visible seed counts, species, or tiers
- OCR, game-log parsing, screen capture, or Path of Exile client integration
- Distinguishing duplicate Crop pair instances by position or manually entered labels
- Supporting fewer than three or more than five initial Crop pairs
- Lower-map-tier transition models
- Automatic detection of map, Atlas, scarab, or passive-tree settings
- Automatic recalculation after pair or Advanced-setting changes
- Manual poe.ninja Lifeforce-price overrides
- Persisting Wither outcomes or completed routes across reloads
- Showing the complete branching tree at once
- Treating the path as guaranteed advice
- Generating or consuming Cropbot Atlas-analysis CSV files
- Executing the Rust implementation or parity oracle in project continuous integration
- Adding a separate Harvest price endpoint or duplicate poe.ninja Currency request
- Changing the project's package manager, application framework, or deployment architecture

## Further Notes

- The source article reports T16 upgrade chances near 25% for T1-to-T2, 20% for T2-to-T3, and roughly 2% to 5.5% for T3-to-T4. The reference setup uses 3% for the last transition. The article reports conflicting evidence near 25% for T2-to-T3, so the Tool must expose uncertainty rather than imply exact mechanics.
- Crop Rotation upgrades every crop of a different Lifeforce color when a crop is harvested. The harvested color does not upgrade from its own harvest.
- The Starting crop set maximum applies only to initial pairs. Surviving crops can extend a five-pair Rotation path to ten harvest steps.
- The Cropbot reference setup represents a specific editable configuration. Its name does not claim it is optimal for the current league.
- Live Lifeforce prices replace the fixed inverse-Divine prices in the reference configuration. Calculate expected values directly in Chaos to keep units explicit.
- The shared economy-snapshot decision is recorded in the accepted ADR and is intended to support additional price-aware Tools later.
