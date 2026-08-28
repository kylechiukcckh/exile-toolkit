# 04: Search, filter, sort, and page the Ranking

**What to build:** Let players reduce a large current-league Ranking to the candidates they can act on. The desktop table and mobile cards share searchable, sortable, paginated controls that survive reloads without creating share URLs or Saved calculations.

**Blocked by:** 02: Rank candidates with a complete Price snapshot.

**Status:** done

- [x] TanStack Table owns the Disenchant sorting, filtering, pagination, and visible-column behavior without replacing Exile Toolkit's visual system.
- [x] Players can search case-insensitively by unique name and filter by weapon, armour, or accessory category.
- [x] Players can set a maximum chaos-equivalent price and minimum Dust value with validated numeric controls.
- [x] Players can include hidden Unpriced candidates and Dust-unavailable items through separate controls that show their current counts.
- [x] Each filter can be cleared independently without resetting unrelated filters.
- [x] Players can sort by unique name, chaos-equivalent price, Dust value, and Dust per Chaos in either direction.
- [x] The Tool shows a normal no-results state while keeping filters available when no candidate matches.
- [x] Pagination defaults to 10 and offers 10, 20, 30, 40, or 50 candidates per page on desktop and mobile.
- [x] Changing a filter or reloading resets the page number to one, while the selected page size remains stored.
- [x] Ranking mode, visible columns, filters, sorting, and page size persist in validated local state and recover safely from malformed or outdated data.
- [x] The Tool has no filter share URL and no Saved calculation action.
- [x] Filtering, sorting, and pagination produce the same candidate order on desktop and mobile.
- [x] Browser tests cover every filter, independent clearing, sorting, page sizes, persistence, malformed state, no results, hidden-state counts, and responsive operation.
