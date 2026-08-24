# 06: Add built-in presets, local presets, and custom entries

**What to build:** Let players reuse common and personal Selections without weakening Dataset trust. Reviewed built-in presets and locally managed presets feed the existing generator, while a Custom entry remains visibly separate from Curated entries and participates immediately in generation and preview.

**Blocked by:** 04: Add the map-modifier selection workflow.

**Status:** complete

- [x] Built-in presets have stable identifiers, clear descriptions, an applicable category, and reviewed contents.
- [x] Applying a built-in preset produces the documented Selection and updates the Generated regex and Match preview.
- [x] A player can save the current Selection as a local preset, then apply, rename, and delete it.
- [x] Invalid or outdated local preset entries are reported and ignored safely instead of breaking the Tool.
- [x] A player can add and remove a Custom entry for the active category.
- [x] Custom entries are visually and semantically distinct from Curated entries and are never written into the shared Dataset.
- [x] Custom entries use the same escaping, splitting, and preview rules as Curated entries.
- [x] Browser tests cover built-in presets, the full local-preset lifecycle, Custom entry behavior, and persistence after reload.

