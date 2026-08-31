# Share complete economy snapshots

Price-aware Tools consume one complete workspace economy snapshot rather than Tool-specific snapshots. The snapshot may grow with new required poe.ninja categories and normalized prices, but the Worker publishes it only when every required value succeeds in the same refresh attempt. This keeps Disenchant and Crop Rotation values coherent, avoids duplicate upstream requests, and gives later Tools one explicit price-data boundary.

## Consequences

The existing Disenchant-specific API contract, storage key, browser cache, and naming will become shared economy infrastructure. Adding a required price requires a snapshot schema and cache-version change; a failed addition retains the last complete snapshot under the existing freshness limits rather than publishing partial data.
