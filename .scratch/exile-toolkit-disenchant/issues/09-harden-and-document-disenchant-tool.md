# 09: Harden and document the Disenchant Tool

**What to build:** Finish the local Disenchant milestone at the same quality bar as the existing Regex Tool. The complete workflow works across supported browsers and layouts, meets accessibility and performance targets, documents its sources and privacy effects, and remains honest about deferred deployment and unsupported features.

**Blocked by:** 03: Preserve coherent Rankings through price failures; 04: Search, filter, sort, and page the Ranking; 05: Pin Favorite candidates above the Ranking; 06: Open adjustable Trade searches with Low stock warnings; 07: Add global league, currency, and theme controls; 08: Configure the Efficiency Metric panel.

**Status:** ready-for-agent

- [ ] The main workflow passes in current Chromium, Firefox, and WebKit through visible browser behavior.
- [ ] A keyboard user can open the Tool, search, filter, sort, change pages, change the global league and currency, toggle the header theme control, change the Efficiency Metric, favorite a candidate, inspect every tooltip, and open Trade with adjustable settings.
- [ ] Automated accessibility checks pass for the Disenchant route, and manual WCAG 2.2 AA exceptions are recorded with owners if any remain.
- [ ] The Tool remains usable at the supported narrow viewport with compact cards, visible state labels, no horizontal loss of required actions, and reduced-motion behavior.
- [ ] A representative thousand-candidate Dataset filters, sorts, pins favorites, and paginates within the existing 100-millisecond local-calculation target.
- [ ] Browser tests cover Fresh, Stale, expired, unavailable, Unpriced, Dust unavailable, Low stock, broken icons, malformed local state, and failed local-data clearing.
- [ ] Data Sources and License Notices show the shipped Dust dataset version, Coverage, record-level Provenance summary, MIT notice, poe.ninja source, item-level 85 verification boundary, and catalyst-aware jewellery assumptions.
- [ ] Privacy text explains IndexedDB Price snapshot storage and direct official-CDN image requests without referrer information.
- [ ] Analytics remain limited to aggregate page and Tool opens; tests prove candidate identity, search text, filters, Favorites, prices, Ranking values, and Trade targets are never sent.
- [ ] Keyboard help documents `Ctrl` or `Cmd` + `Shift` + `3`, and coming-later status is removed only for the completed Disenchant Tool.
- [ ] Continuous integration runs Dust dataset validation, Worker integration tests, domain tests, builds, browser smoke tests, accessibility checks, and the representative performance check.
- [ ] Standards and specification reviews find no unresolved high-severity defect in the local release workflow.
- [ ] A recorded readiness note states that Cloudflare deployment and production route verification remain deferred rather than claiming a public release.
