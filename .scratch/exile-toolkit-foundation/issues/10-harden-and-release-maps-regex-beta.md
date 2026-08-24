# 10: Harden and release the maps regex beta

**What to build:** Turn the completed slices into a release-ready public beta. The production workspace passes its full user workflow across supported browsers, meets the agreed accessibility and performance targets, exposes accurate Dataset and privacy information, and blocks release when automated quality or provenance checks fail.

**Blocked by:** 08: Complete accessible keyboard and responsive operation; 09: Add privacy-safe diagnostics and aggregate analytics.

**Status:** ready-for-agent

- [ ] Pull requests enforce formatting, linting, type checking, unit tests, Dataset validation, build, and browser smoke tests.
- [ ] Production deployment serves the workspace, public pages, regex Tool, and Worker health behavior over expected public routes.
- [ ] Cross-browser tests pass for the main maps and map-mod workflow in current Chrome or Edge, Firefox, and Safari-compatible WebKit.
- [ ] Automated accessibility checks pass and any remaining manual WCAG 2.2 AA exceptions are documented with owners.
- [ ] The shell is usable within two seconds on the agreed typical desktop profile, cached Tool switching is immediate, and normal regex calculation completes within 100 milliseconds.
- [ ] The Data Sources and License Notices pages show the shipped Dataset versions, Provenance, coverage, and applicable licenses.
- [ ] No known high-severity defect remains open against the release workflow.
- [ ] Coming-later Tools remain honest and noninteractive, while the maps and map-mod regex Tool works end to end.
- [ ] A recorded release check confirms the public-beta gate without enabling accounts, Sentry, PWA behavior, Standard, PoE 2, monetization, or later Tools.
