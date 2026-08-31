# 01: Expand the shared economy snapshot

**What to build:** Extend the complete workspace Price snapshot so price-aware Tools can consume Yellow, Blue, and Purple Lifeforce prices from the same poe.ninja refresh already used by Disenchant. Keep the existing Disenchant behavior available during this expansion so consumers can migrate without a broken intermediate state.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] A versioned shared economy response contains the existing Disenchant categories, Divine conversion, optional Catalyst conversion, and all three Lifeforce prices.
- [ ] Yellow maps to Vivid Lifeforce, Blue maps to Primal Lifeforce, and Purple maps to Wild Lifeforce.
- [ ] Lifeforce values use explicit Chaos-per-Lifeforce units and are accepted only when the poe.ninja quote currency is Chaos.
- [ ] Missing, duplicate, malformed, nonfinite, or nonpositive required Lifeforce values prevent publication of a partial snapshot.
- [ ] A failed refresh retains the last complete snapshot under the existing Fresh, Stale, and expiry rules.
- [ ] The change reuses the existing Currency response and does not add an upstream request.
- [ ] Shared Worker and browser storage use a new version so an older Disenchant-only payload cannot pass as complete.
- [ ] Contract, domain, Worker, fallback, cache-version, and ETag tests cover the new public behavior.
- [ ] Existing Disenchant consumers remain functional until their migration ticket completes.

