# 06: Remove the legacy Disenchant snapshot path

**What to build:** Complete the shared-economy migration by removing the compatibility contract, endpoint, storage vocabulary, and cache behavior that describe the Price snapshot as Disenchant-only.

**Blocked by:** 02: Migrate Disenchant to the shared economy snapshot.

**Status:** ready-for-agent

- [ ] Price-aware consumers use only the shared economy contract and endpoint.
- [ ] Legacy Disenchant-only response types, storage keys, cache paths, and compatibility code are removed.
- [ ] Old persisted versions are rejected or ignored safely rather than migrated as complete data.
- [ ] Workspace terminology consistently describes one complete Price snapshot shared by Tools.
- [ ] Disenchant and Crop Rotation continue to receive coherent prices from the same refresh attempt.
- [ ] Contract, Worker, browser-cache, Disenchant, and Crop Rotation tests pass without legacy fixtures or aliases.

