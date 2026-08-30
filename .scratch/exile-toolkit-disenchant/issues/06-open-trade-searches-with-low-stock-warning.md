# 06: Open adjustable Trade searches with Low stock warnings

**What to build:** Turn a ranked candidate into an honest buying workflow. Each row opens the corresponding official Trade search in a new tab, keeps Exile Toolkit open, and warns when poe.ninja reports fewer than 150 listings without changing the Ranking. Players can adjust the Trade search settings and keep those settings locally.

**Blocked by:** 02: Rank candidates with a complete Price snapshot.

**Status:** ready-for-agent

- [ ] Each priced or Unpriced candidate with sufficient identity data has a Trade button; Dust-unavailable items can use the same exact-search behavior.
- [ ] The generated search uses the Active league, exact unique name, exact base type, an adjustable minimum item level from 65 through 85 that defaults to 85, adjustable corrupted-item inclusion, online status, and listing-time settings, with no maximum price.
- [ ] Trade-search input is generated from approved candidate fields and persisted Trade settings, and never includes table filters, favorites, cached prices, history, or analytics identifiers.
- [ ] Trade opens in a new tab with safe external-link behavior and never embeds or proxies the official site.
- [ ] Opening Trade does not change Favorite state or create a mark, purchased state, history payload, or Saved calculation.
- [ ] Weapons and armour make the q20 assumption visible near the buying action and warn that corrupted listings below q20 may return less Dust.
- [ ] A candidate with fewer than 150 poe.ninja listings remains ranked and displays a Low stock icon at the top-right of its Trade button.
- [ ] The Low stock tooltip works with hover and keyboard focus, states the listing count and threshold, and does not rely on color or icon shape alone.
- [ ] Listing count remains available as secondary information without adding a default table column.
- [ ] Trade URLs are deterministic for the same Active league and candidate variant.
- [ ] Domain and browser tests inspect the opened official URL, adjustable search constraints, no maximum price, safe new-tab behavior, q20 warning, Low stock boundary values, and unchanged Favorite state.
