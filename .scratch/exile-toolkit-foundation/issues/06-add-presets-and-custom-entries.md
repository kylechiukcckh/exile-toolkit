# 06: Add built-in presets, local presets, and custom entries

**What to build:** Let players reuse common and personal Selections without weakening Dataset trust. Reviewed built-in presets and locally managed presets feed the existing generator, while a Custom entry remains visibly separate from Curated entries and participates immediately in generation and preview.

**Blocked by:** 04: Add the map-modifier selection workflow.

**Status:** ready-for-agent

- [ ] Built-in presets have stable identifiers, clear descriptions, an applicable category, and reviewed contents.
- [ ] Applying a built-in preset produces the documented Selection and updates the Generated regex and Match preview.
- [ ] A player can save the current Selection as a local preset, then apply, rename, and delete it.
- [ ] Invalid or outdated local preset entries are reported and ignored safely instead of breaking the Tool.
- [ ] A player can add and remove a Custom entry for the active category.
- [ ] Custom entries are visually and semantically distinct from Curated entries and are never written into the shared Dataset.
- [ ] Custom entries use the same escaping, splitting, and preview rules as Curated entries.
- [ ] Browser tests cover built-in presets, the full local-preset lifecycle, Custom entry behavior, and persistence after reload.

