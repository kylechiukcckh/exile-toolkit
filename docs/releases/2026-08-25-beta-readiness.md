# Maps regex beta readiness

**Recorded:** 2026-08-25  
**Owner:** Exile Toolkit maintainers  
**Decision:** Not released. Production deployment remains deliberately deferred.

## Verified gates

- Formatting, linting, type checking, Dataset validation, unit tests, builds, and browser checks are enforced by CI.
- The maps and map-modifier workflows pass in Chromium, Firefox, and WebKit.
- Automated accessibility checks pass. The manual review is recorded in `docs/audits/0002-wcag-2.2-aa-beta.md` with no known exceptions.
- The local release profile keeps shell readiness below two seconds, cached Tool switching below 250 milliseconds, and normal regex calculation below 100 milliseconds. The profile uses Playwright's Desktop Chrome viewport against a warmed local build with 40 milliseconds of network latency, 10 Mbps download, and 5 Mbps upload.
- Data Sources and License Notices render the shipped Dataset versions, Provenance, coverage, and licenses.
- Coming-later Tools have no workflow controls or simulated results.
- Standards and specification reviews found no open high-severity defect in Tickets 02 through 09.

## Deferred gate

No production URL exists yet, so public route behavior and Worker health have not been verified in production. Do not announce the beta until that check passes.

The release check does not enable accounts, Sentry, PWA behavior, Standard league support, Path of Exile 2, monetization, or coming-later Tools.
