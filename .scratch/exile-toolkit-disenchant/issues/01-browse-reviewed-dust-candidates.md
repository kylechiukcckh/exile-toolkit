# 01: Browse reviewed Dust candidates

**What to build:** Give players the first usable Disenchant Tool without depending on live prices. A player can open the Tool, browse the reviewed Dust dataset as Unpriced candidates, inspect item-level and quality assumptions, and understand Dataset coverage and Provenance.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [x] A repeatable local import turns the compatible MIT base mapping into a deterministic, versioned Dust dataset for unique weapons, armour, and accessories.
- [x] The imported material preserves the required MIT notice and records source, game version, verification state, license, and update time as Provenance.
- [ ] Dataset validation rejects missing fields, invalid categories, duplicate unique and variant identities, non-positive Dust inputs, malformed Provenance, and non-deterministic output.
- [x] Generated Dust values use item level 85, q20 for weapons and armour, and q0 for jewellery and items that cannot gain quality.
- [ ] Representative observed fixtures verify item-level 85 q20 and q0 results; generated item-level 84 values cannot pass by being relabeled.
- [x] The Disenchant Tool opens from its workspace card, persistent navigation, global Tool search, and `Ctrl` or `Cmd` + `Shift` + `3`.
- [x] With no Price snapshot, the Tool shows the full Dust dataset as Unpriced, disables price Rankings, and explains that market data is unavailable.
- [x] Desktop shows an original compact table with 10 rows per page; mobile shows compact cards with equivalent names, base types, Dust values, and controls.
- [x] Each candidate shows `ilvl 85 - q20` or `ilvl 85 - q0` with an accessible explanation of quality, influence, corruption, and Dataset version assumptions.
- [x] The item layout supports an official-CDN icon with a fixed text fallback; a missing or failed image never hides the unique name or changes the usable controls.
- [x] The Data Sources and License Notices pages identify the Dust dataset version, coverage, source lineage, and reused MIT material.
- [x] Dataset and browser tests cover import validation, representative calculations, navigation, pagination, mobile operation, unavailable prices, and visible Provenance.
