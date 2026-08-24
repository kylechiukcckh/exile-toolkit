# 04: Add the map-modifier selection workflow

**What to build:** Extend the working regex Tool with reviewed map modifiers. A player can switch categories, search grouped modifiers, select or clear a group, and generate and preview a regex under the same rules already proven for maps.

**Blocked by:** 03: Generate and preview regexes from curated maps.

**Status:** ready-for-agent

- [ ] The map-modifier Dataset meets the same versioning, Provenance, and validation requirements as the map Dataset.
- [ ] A player can switch between maps and map modifiers without leaking a Selection into the wrong category.
- [ ] Map modifiers appear in meaningful searchable groups.
- [ ] Select-all and clear actions affect only the intended visible group.
- [ ] Inclusion-only generation and Match preview work for map modifiers without a second implementation of the regex rules.
- [ ] The Tool visibly identifies its active category and Dataset version.
- [ ] Browser coverage proves category switching, grouped search, group selection, clearing, generation, and preview.

