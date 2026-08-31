# 03: Deliver the first calculable Rotation path

**What to build:** Add a usable Crop Rotation Tool in which a player selects three to five Crop pairs, edits the collapsed Cropbot reference setup, explicitly calculates, and receives a deterministic expected-value Rotation path under the default assumption that every unchosen crop withers.

**Blocked by:** 01: Expand the shared economy snapshot.

**Status:** ready-for-agent

- [ ] Crop Rotation appears in the existing workspace navigation, search, analytics vocabulary, and responsive Tool layout.
- [ ] The six unordered Crop pair kinds have accessible decrement and increment controls, allow duplicates, and enforce a total of three through five.
- [ ] Calculate remains disabled below three pairs and does not run automatically after an input change.
- [ ] The collapsed Advanced area exposes the editable Cropbot reference setup and validates percentages, finite values, and nonnegative modifiers.
- [ ] The reference setup contains the approved no-wilt, map, Atlas, scarab, and T16 transition defaults and is not labeled as recommended.
- [ ] The domain calculation generates expected yields in memory, uses current shared-snapshot Lifeforce prices, and returns semantic Rotation path steps rather than display strings.
- [ ] The initial path assumes all unchosen crops wither, treats duplicate pairs as interchangeable, and uses deterministic choice order and tie-breaking.
- [ ] Each result identifies the chosen Lifeforce color and Crop pair and makes expected Lifeforce by color, expected Chaos value, and expected remaining value available without crowding the primary row.
- [ ] Missing or expired prices disable price-dependent calculation; Fresh and Stale prices follow the shared snapshot rules.
- [ ] The interface warns that visible seed counts and tiers are not modeled and advises players how to choose among matching or same-color crops.
- [ ] Cropbot permission and Forgotten Arbiter mechanics provenance appear in the appropriate public source information and result assumptions.
- [ ] Self-contained domain tests cover pair validation, expected-yield math, deterministic optimization, color symmetry, and selected permitted reference fixtures without Rust or generated CSV dependencies.
- [ ] A browser test completes pair entry and produces the visible all-wither Rotation path using accessible controls.

