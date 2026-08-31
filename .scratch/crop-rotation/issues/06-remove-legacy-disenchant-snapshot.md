# 06: Remove the legacy Disenchant snapshot path

**What to build:** Complete the shared-economy migration by removing the compatibility contract, endpoint, storage vocabulary, and cache behavior that describe the Price snapshot as Disenchant-only.

**Blocked by:** 02: Migrate Disenchant to the shared economy snapshot.

**Status:** complete

- [x] Price-aware consumers use only the shared economy contract and endpoint.
- [x] Legacy Disenchant-only response types, storage keys, cache paths, and compatibility code are removed.
- [x] Old persisted versions are rejected or ignored safely rather than migrated as complete data.
- [x] Workspace terminology consistently describes one complete Price snapshot shared by Tools.
- [x] Disenchant and Crop Rotation continue to receive coherent prices from the same refresh attempt.
- [x] Contract, Worker, browser-cache, Disenchant, and Crop Rotation tests pass without legacy fixtures or aliases.
