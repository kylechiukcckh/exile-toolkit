# 06: Open exact Trade searches with Low stock warnings

**What to build:** Turn a ranked candidate into an honest buying workflow. Each row opens the corresponding official Trade search in a new tab, keeps Exile Toolkit open, and warns when poe.ninja reports fewer than 150 listings without changing the Ranking.

**Blocked by:** 02: Rank candidates with a complete Price snapshot.

**Status:** ready-for-agent

- [ ] Each priced or Unpriced candidate with sufficient identity data has a Trade button; Dust-unavailable items can use the same exact-search behavior.
- [ ] The generated search uses the Active league, exact unique name, exact base type, minimum item level 85, currently available listings, corrupted items allowed, and no maximum price.
- [ ] Trade-search input is generated from approved candidate fields and never includes filters, favorites, cached prices, history, or analytics identifiers.
- [ ] Trade opens in a new tab with safe external-link behavior and never embeds or proxies the official site.
- [ ] Opening Trade does not change Favorite state or create a mark, purchased state, history payload, or Saved calculation.
- [ ] Weapons and armour make the q20 assumption visible near the buying action and warn that corrupted listings below q20 may return less Dust.
- [ ] A candidate with fewer than 150 poe.ninja listings remains ranked and displays a Low stock icon at the top-right of its Trade button.
- [ ] The Low stock tooltip works with hover and keyboard focus, states the listing count and threshold, and does not rely on color or icon shape alone.
- [ ] Listing count remains available as secondary information without adding a default table column.
- [ ] Trade URLs are deterministic for the same Active league and candidate variant.
- [ ] Domain and browser tests inspect the opened official URL, all required search constraints, no maximum price, safe new-tab behavior, q20 warning, Low stock boundary values, and unchanged Favorite state.
