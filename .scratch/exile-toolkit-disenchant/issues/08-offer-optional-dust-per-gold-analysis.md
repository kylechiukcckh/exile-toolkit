# 08: Configure the Efficiency Metric panel

**What to build:** Give players the reference Tool's Efficiency Metric panel while keeping the updated metric set. Dust / Total Cost is the default, Dust / Gold is available as an alternative, catalyst-aware jewellery costs remain supported, and Dust / Chaos / Slot is absent.

**Blocked by:** 02: Rank candidates with a complete Price snapshot; 04: Search, filter, sort, and page the Ranking.

**Status:** ready-for-agent

- [ ] The Efficiency Metric panel defaults to Dust / Total Cost and offers Dust / Gold as an alternative.
- [ ] The panel does not offer Dust / Chaos / Slot, and the domain has no slot-efficiency calculation or Ranking.
- [ ] Estimated gold fee uses an independently implemented and tested compatible formula based on the candidate's reviewed base Dust and quality assumptions.
- [ ] The interface always calls the result `Estimated gold fee` and explains that the actual asynchronous Trade charge may differ.
- [ ] Dust per Gold divides the reviewed Dust value by a positive Estimated gold fee; missing or invalid inputs yield no ratio.
- [ ] Estimated gold fee, Dust per Gold, and the maximum-gold filter are hidden by default.
- [ ] A player can enable the Dust-per-Gold column and sort it in either direction while Favorites remain the primary ordering rule.
- [ ] Enabling the optional mode exposes the advanced maximum-gold filter without changing unrelated filters.
- [ ] q20 weapons and armour and the selected catalyzed or uncatalyzed jewellery path use the same Dust assumption in every Ranking mode.
- [ ] Total-cost calculations include the candidate price, Gold valuation, and any selected catalyst purchase cost without changing the candidate's Dust value.
- [ ] Unpriced candidates may show Dust per Gold only when their Dust and Estimated gold fee inputs exist, but they remain excluded from price Rankings and never receive Dust per Chaos.
- [ ] Dust-unavailable items receive neither Estimated gold fee nor Dust per Gold.
- [ ] Optional-column visibility, sorting, and maximum-gold filter state persist locally and recover safely from malformed data.
- [ ] Desktop and mobile presentations keep gold information secondary and provide keyboard-operable explanations.
- [ ] Domain and browser tests cover formula fixtures, rounding, invalid inputs, Total Cost as the default, Dust / Gold enabling, absence of slot mode, sorting, filtering, persistence, Favorites, Unpriced candidates, and Dust-unavailable items.
