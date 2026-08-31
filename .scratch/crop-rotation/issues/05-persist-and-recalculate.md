# 05: Persist setup and manage outdated calculations

**What to build:** Preserve a player's Crop pair selection and Advanced settings between visits while keeping observed Wither outcomes temporary, and make manual recalculation and the two reset scopes explicit.

**Blocked by:** 04: Reveal Did not wither outcome branches.

**Status:** ready-for-agent

- [ ] Selected Crop pairs and valid Advanced settings persist locally and restore after reload.
- [ ] Wither outcomes and calculated routes do not persist across reloads.
- [ ] Changing a pair or Advanced setting after calculation keeps the old result visible and clearly marks it outdated.
- [ ] The primary action changes from Calculate to Recalculate when the visible result no longer matches its inputs.
- [ ] No recalculation runs automatically after pair or setting changes.
- [ ] Recalculate replaces the old policy and clears outcomes that belong to it.
- [ ] Reset calculation clears pairs, outcomes, and results while retaining Advanced settings.
- [ ] Restore reference setup resets Advanced settings without clearing the current Crop pairs.
- [ ] Invalid persisted state falls back safely without breaking the Tool.
- [ ] Browser tests cover reload restoration, temporary outcomes, outdated messaging, Recalculate, and both reset actions through visible behavior.

