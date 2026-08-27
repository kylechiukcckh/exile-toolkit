# 07: Display Smart, Chaos, or Divine prices

**What to build:** Let players read prices in the denomination that makes sense to them without changing any calculations. One compact table-level control switches price presentation while the Ranking continues to use the snapshot's normalized chaos-equivalent values.

**Blocked by:** 02: Rank candidates with a complete Price snapshot.

**Status:** ready-for-agent

- [ ] A compact, accessible table-level control offers Smart, Chaos, and Divine display modes.
- [ ] Smart mode is the default and shows prices below one Divine in Chaos and prices at or above one Divine in Divine.
- [ ] Chaos mode shows every usable market price in its chaos-equivalent value.
- [ ] Divine mode converts every usable market price with the Divine-to-Chaos rate from the same complete Price snapshot.
- [ ] Changing display currency cannot change Dust per Chaos, candidate ordering, filters based on chaos-equivalent price, Low stock, or Missing price behavior.
- [ ] Unpriced and Dust-unavailable states remain labels rather than numeric zero values in every display mode.
- [ ] The selected display mode persists in validated local state and falls back to Smart when stored state is malformed or unsupported.
- [ ] The Divine-to-Chaos source and retrieval time are available with the Price snapshot details.
- [ ] Desktop table and mobile cards format large and fractional prices consistently without hiding the original candidate identity.
- [ ] Domain and browser tests cover values below, equal to, and above one Divine; forced modes; missing rates; persistence; malformed state; and unchanged Ranking values.
