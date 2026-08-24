# 07: Preserve and share workspace state

**What to build:** Give guest users continuity without creating accounts. Safe Tool state can be shared through a versioned URL, while preferences, favorites, bounded history, presets, and explicitly Saved calculations remain in the browser. The user can inspect the effect of local storage and clear it at any time.

**Blocked by:** 05: Split and copy overlong regex results safely; 06: Add built-in presets, local presets, and custom entries.

**Status:** ready-for-agent

- [ ] A share action creates a URL containing only approved, reasonably sized Tool state and no pasted or unintended private content.
- [ ] Opening a valid shared URL restores the same category, Selection, Generated regex, Regex parts, and Match preview.
- [ ] Malformed, oversized, and unsupported URL-state versions recover to a usable Tool with a visible explanation.
- [ ] Theme, density, favorites, local presets, and explicitly Saved calculations survive a browser reload.
- [ ] Tool history retains no more than 20 recent actions and does not retain pasted content unless explicitly saved.
- [ ] A clear-local-data action states what it removes, requires deliberate confirmation, and resets the workspace visibly.
- [ ] Clearing local data does not remove or alter Curated entries.
- [ ] Browser tests cover sharing, restoration, invalid links, persistence, history bounds, explicit saving, and clearing.

