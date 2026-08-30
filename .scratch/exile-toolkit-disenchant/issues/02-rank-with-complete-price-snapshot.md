# 02: Rank candidates with a complete Price snapshot

**What to build:** Turn the static Disenchant browser into an Active-league market Ranking. The Worker obtains one complete poe.ninja Price snapshot, the Tool joins it to reviewed Dust records, and players can compare coherent candidates without partial data or invented zero prices. Later tickets expose the selectable Efficiency Metric for this Ranking.

**Blocked by:** 01: Browse reviewed Dust candidates.

**Status:** ready-for-agent

- [x] The shared public contract represents the Active league, poe.ninja source, retrieval time, Divine-to-Chaos rate, required category coverage, normalized item prices, listing counts, variants, and image URLs.
- [x] The Worker fetches documented unique weapon, unique armour, unique accessory, and currency data through one identifying integration boundary.
- [x] A refresh publishes a Price snapshot only after every required response succeeds and validates; one failed category or currency rate publishes none of that attempt.
- [x] Upstream item values are normalized without exposing framework types to the domain package.
- [ ] Distinguishable poe.ninja variants remain separate and receive stable identities; records merge only when their Dust value and official Trade search are identical.
- [x] A Dust record without a usable market price becomes an Unpriced candidate, never a zero-price candidate.
- [ ] A priced poe.ninja item without a Dust record becomes Dust unavailable, counts against Coverage, and receives no Ranking value.
- [x] Dust per Chaos equals the reviewed Dust value divided by the normalized positive chaos-equivalent price; missing and non-positive values yield no ratio.
- [x] A complete successful response changes the Tool from the Unpriced state to a descending price-aware Ranking infrastructure that supports the selected Efficiency Metric.
- [x] The Tool shows poe.ninja as the price source, relative retrieval age, exact local retrieval time in an accessible tooltip, and the Dust dataset version used by the Ranking.
- [x] Candidate rows use official CDN image URLs with no-referrer behavior and keep their text fallback when an image fails.
- [x] A usable snapshot hides Unpriced and Dust-unavailable candidates by default while showing the count hidden by each state.
- [ ] Worker, contract, domain, and browser tests prove atomic publication, normalization, joins, variants, missing data, default ordering, source labels, and sanitized public failures.
