# Publish complete price snapshots

Every price-aware Tool uses a complete poe.ninja Price snapshot containing the Divine-to-Chaos rate and every required item category from the same refresh attempt. The Worker publishes a new snapshot only when every request succeeds, because mixing fresh and older categories would make rankings internally inconsistent. A snapshot is Fresh for one hour, may remain available as Stale for up to 24 hours, and then stops supporting price-dependent results.

## Consequences

The Worker retains the last complete snapshot after any partial upstream failure, and the browser keeps the last complete snapshot in IndexedDB for the same bounded fallback. This favors coherent comparisons over partial freshness. The first visit during an outage still shows non-price datasets, but price rankings remain unavailable.
