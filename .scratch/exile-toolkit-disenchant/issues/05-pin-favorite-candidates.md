# 05: Pin Favorite candidates above the Ranking

**What to build:** Give repeat buyers one durable row-level preference without adding the reference Tool's marks. A player can favorite a unique variant, see it ahead of other matching results, and keep that preference across reloads and future leagues.

**Blocked by:** 04: Search, filter, sort, and page the Ranking.

**Status:** ready-for-agent

- [ ] Every candidate exposes a keyboard-operable Favorite control with an accessible name and pressed state.
- [ ] A Favorite candidate uses a filled amber star and subtle amber row or card background without reducing text contrast.
- [ ] Favorite identity belongs to the unique and distinguishable variant rather than the Active league.
- [ ] The Tool applies active filters first, places every matching Favorite candidate before non-favorites, sorts within each group, and paginates last.
- [ ] Matching Favorite candidates always appear on the earliest applicable page.
- [ ] When Unpriced candidates are visible, an Unpriced favorite appears after priced favorites and before non-favorites.
- [ ] Dust-unavailable favorites remain subject to the Dust-unavailable filter and receive no Ranking value.
- [ ] Favorites persist in validated local state across reloads and remain available when later leagues reuse the same stable candidate identity.
- [ ] Opening Trade or changing Ranking mode never changes Favorite state.
- [ ] Players toggle favorites individually; the Tool has no separate mark, purchased state, or bulk favorite action.
- [ ] The existing Clear local data workflow removes Disenchant favorites and reports the same success or failure behavior as other local state.
- [ ] Domain and browser tests cover ordering before pagination, active filters, Unpriced favorites, stable variant identity, reloads, mobile cards, keyboard use, and local-data clearing.
