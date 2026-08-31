# 04: Reveal Did not wither outcome branches

**What to build:** Let a player change any projected paired step to "Did not wither" and immediately see the corresponding Surviving crop and recalculated downstream Rotation path while the unchanged prefix stays stable.

**Blocked by:** 03: Deliver the first calculable Rotation path.

**Status:** complete

- [x] Every visible paired step has an accessible "Did not wither" control, including projected future steps.
- [x] A checked outcome keeps its original step and adds the unchosen Lifeforce color as a Surviving crop available to later choices.
- [x] A Surviving crop is harvested once, can upgrade other colors, and has no Wither outcome of its own.
- [x] Changing an outcome retains the common route prefix and replaces only the affected suffix.
- [x] Stable semantic step identities prevent outcomes from being reapplied to unrelated steps after a branch changes.
- [x] Outcomes that no longer refer to visible semantic steps are discarded.
- [x] Same-color pairs create a same-color Surviving crop when they do not wither.
- [x] Five Starting Crop pairs can produce a valid path of up to ten harvest steps.
- [x] Domain tests cover every paired choice and outcome mapping, nested outcome changes, invalid suffix removal, terminal crop consumption, and the ten-step case.
- [x] The browser workflow checks an outcome, observes the Surviving crop and replaced suffix, then changes an earlier outcome and sees a coherent branch.
