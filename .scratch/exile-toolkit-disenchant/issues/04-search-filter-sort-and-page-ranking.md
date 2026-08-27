# 04: Search, filter, sort, and page the Ranking

**What to build:** Let players reduce a large current-league Ranking to the candidates they can act on. The desktop table and mobile cards share searchable, sortable, paginated controls that survive reloads without creating share URLs or Saved calculations.

**Blocked by:** 02: Rank candidates with a complete Price snapshot.

**Status:** ready-for-agent

- [ ] TanStack Table owns the Disenchant sorting, filtering, pagination, and visible-column behavior without replacing Exile Toolkit's visual system.
- [ ] Players can search case-insensitively by unique name and filter by weapon, armour, or accessory category.
- [ ] Players can set a maximum chaos-equivalent price and minimum Dust value with validated numeric controls.
- [ ] Players can include hidden Unpriced candidates and Dust-unavailable items through separate controls that show their current counts.
- [ ] Each filter can be cleared independently without resetting unrelated filters.
- [ ] Players can sort by unique name, chaos-equivalent price, Dust value, and Dust per Chaos in either direction.
- [ ] The Tool shows a normal no-results state while keeping filters available when no candidate matches.
- [ ] Pagination defaults to 10 and offers 10, 20, 30, 40, or 50 candidates per page on desktop and mobile.
- [ ] Changing a filter or reloading resets the page number to one, while the selected page size remains stored.
- [ ] Ranking mode, visible columns, filters, sorting, and page size persist in validated local state and recover safely from malformed or outdated data.
- [ ] The Tool has no filter share URL and no Saved calculation action.
- [ ] Filtering, sorting, and pagination produce the same candidate order on desktop and mobile.
- [ ] Browser tests cover every filter, independent clearing, sorting, page sizes, persistence, malformed state, no results, hidden-state counts, and responsive operation.
