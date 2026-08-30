# 07: Add global league, currency, and theme controls

**What to build:** Give the workspace one global header control area for league, currency, and theme. Players can select a supported league, choose Smart, Chaos, or Divine price presentation, and use one theme toggle beside Tool search without changing Ranking calculations or duplicating theme controls in the workspace menu.

**Blocked by:** 02: Rank candidates with a complete Price snapshot.

**Status:** ready-for-agent

- [ ] A compact, accessible global header control offers Smart, Chaos, and Divine display modes.
- [ ] Smart mode is the default currency display and shows prices below one Divine in Chaos and prices at or above one Divine in Divine.
- [ ] Chaos mode shows every usable market price in its chaos-equivalent value.
- [ ] Divine mode converts every usable market price with the Divine-to-Chaos rate from the same complete Price snapshot.
- [ ] Changing display currency cannot change Dust per Chaos, candidate ordering, filters based on chaos-equivalent price, Low stock, or Missing price behavior.
- [ ] Unpriced and Dust-unavailable states remain labels rather than numeric zero values in every display mode.
- [ ] The selected display mode persists in validated shared workspace state and falls back to Smart when stored state is malformed or unsupported.
- [ ] The global league selector offers Standard, Hardcore, Allflame, and Hardcore Allflame, excludes archived leagues, and changes the workspace Active league.
- [ ] Changing the Active league updates price requests and generated Trade links without creating a page-local league selector.
- [ ] The theme toggle appears beside global Tool search in the top-right header, and the workspace menu contains no duplicate theme selector.
- [ ] The Divine-to-Chaos source and retrieval time are available with the Price snapshot details.
- [ ] Desktop table and mobile cards format large and fractional prices consistently without hiding the original candidate identity.
- [ ] Domain and browser tests cover values below, equal to, and above one Divine; forced modes; missing rates; global league changes; persistence; malformed state; header placement; and unchanged Ranking values.
