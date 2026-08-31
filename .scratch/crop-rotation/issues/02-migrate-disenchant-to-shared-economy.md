# 02: Migrate Disenchant to the shared economy snapshot

**What to build:** Move the existing Disenchant calculator onto the shared economy response and browser cache without changing what players see or how price freshness and fallback behave.

**Blocked by:** 01: Expand the shared economy snapshot.

**Status:** ready-for-agent

- [ ] Disenchant obtains its price categories and conversions from the shared economy contract.
- [ ] Fresh, Stale, expired, upstream-failure, and first-visit behavior remain unchanged for players.
- [ ] Existing rankings, filters, snapshot timestamps, league isolation, and Clear local data behavior remain intact.
- [ ] Old Disenchant-only cached payloads cannot be mistaken for complete shared snapshots.
- [ ] Browser and domain tests demonstrate behavior through public Disenchant results rather than internal cache implementation.
- [ ] The main Disenchant browser workflow continues to pass without visible regressions.

