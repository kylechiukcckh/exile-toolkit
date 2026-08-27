# 08: Offer optional Dust-per-Gold analysis

**What to build:** Keep gold out of the default buying view while allowing players who care about asynchronous Trade fees to compare it. Enabling the option reveals Estimated gold fee, Dust per Gold, its sorting behavior, and an advanced filter without changing the candidate's Dust assumptions.

**Blocked by:** 02: Rank candidates with a complete Price snapshot; 04: Search, filter, sort, and page the Ranking.

**Status:** ready-for-agent

- [ ] Estimated gold fee uses an independently implemented and tested compatible formula based on the candidate's reviewed base Dust and quality assumptions.
- [ ] The interface always calls the result `Estimated gold fee` and explains that the actual asynchronous Trade charge may differ.
- [ ] Dust per Gold divides the reviewed Dust value by a positive Estimated gold fee; missing or invalid inputs yield no ratio.
- [ ] Estimated gold fee, Dust per Gold, and the maximum-gold filter are hidden by default.
- [ ] A player can enable the Dust-per-Gold column and sort it in either direction while Favorites remain the primary ordering rule.
- [ ] Enabling the optional mode exposes the advanced maximum-gold filter without changing unrelated filters.
- [ ] q20 weapons and armour and q0 jewellery use the same Dust assumption in both Ranking modes.
- [ ] Unpriced candidates may show Dust per Gold only when their Dust and Estimated gold fee inputs exist, but they remain excluded from price Rankings and never receive Dust per Chaos.
- [ ] Dust-unavailable items receive neither Estimated gold fee nor Dust per Gold.
- [ ] Optional-column visibility, sorting, and maximum-gold filter state persist locally and recover safely from malformed data.
- [ ] Desktop and mobile presentations keep gold information secondary and provide keyboard-operable explanations.
- [ ] Domain and browser tests cover formula fixtures, rounding, invalid inputs, hidden defaults, enabling, sorting, filtering, persistence, Favorites, Unpriced candidates, and Dust-unavailable items.
