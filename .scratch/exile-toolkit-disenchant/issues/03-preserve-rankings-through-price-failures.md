# 03: Preserve coherent Rankings through price failures

**What to build:** Keep price-aware results useful and honest when poe.ninja slows down or fails. Players receive the last complete snapshot with an explicit Fresh or Stale state, while partial refreshes and expired market data can never masquerade as current Rankings.

**Blocked by:** 02: Rank candidates with a complete Price snapshot.

**Status:** complete

- [x] The shared price service treats a complete snapshot as Fresh for one hour and Stale from one hour through 24 hours.
- [x] The Worker retains the previous complete snapshot after a timeout, malformed response, invalid value, failed currency rate, failed item category, or exhausted bounded retry.
- [x] Conditional upstream requests reuse valid unchanged data without creating a mixed-generation snapshot.
- [x] A partial refresh never changes the published snapshot's item data, currency rate, retrieval time, or category coverage.
- [x] Structured Worker logs identify failed resources and request correlation without logging upstream bodies, candidate names, query strings, filters, favorites, or Trade targets.
- [x] The browser stores only a validated complete snapshot in IndexedDB and can use it when the Worker has no usable cached response.
- [x] The Tool checks for a snapshot when opened and when the tab regains focus after the current snapshot reaches one hour; it does not poll or show a manual refresh control.
- [x] The relative age updates once per minute without fetching data.
- [x] A Stale snapshot shows an amber `Stale prices` badge and notice while keeping Rankings usable through 24 hours.
- [x] A snapshot older than 24 hours cannot support price Rankings; the Tool keeps Dust data visible and shows the stronger price-unavailable state.
- [x] A first visit during an outage shows the full Dust dataset as Unpriced instead of an empty or broken Tool.
- [x] Clear local data removes the IndexedDB snapshot as well as existing local workspace state.
- [x] Worker and browser tests cover Fresh, Stale, expired, first-visit unavailable, browser fallback, focus checks, no polling, partial failures, and sanitized diagnostics.
