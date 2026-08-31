# 05: Persist setup and manage outdated calculations

**What to build:** Preserve a player's Crop pair selection and Advanced settings between visits while keeping observed Wither outcomes temporary, and make manual recalculation and the two reset scopes explicit.

**Blocked by:** 04: Reveal Did not wither outcome branches.

**Status:** complete

- [x] Selected Crop pairs and valid Advanced settings persist locally and restore after reload.
- [x] Wither outcomes and calculated routes do not persist across reloads.
- [x] Changing a pair or Advanced setting after calculation keeps the old result visible and clearly marks it outdated.
- [x] The primary action changes from Calculate to Recalculate when the visible result no longer matches its inputs.
- [x] No recalculation runs automatically after pair or setting changes.
- [x] Recalculate replaces the old policy and clears outcomes that belong to it.
- [x] Reset calculation clears pairs, outcomes, and results while retaining Advanced settings.
- [x] Restore reference setup resets Advanced settings without clearing the current Crop pairs.
- [x] Invalid persisted state falls back safely without breaking the Tool.
- [x] Browser tests cover reload restoration, temporary outcomes, outdated messaging, Recalculate, and both reset actions through visible behavior.
