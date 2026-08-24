# 09: Add privacy-safe diagnostics and aggregate analytics

**What to build:** Make failures diagnosable and broad product use measurable without collecting the contents of a player's work. Visible error boundaries, structured Worker responses, sanitized logs, and aggregate navigation events cover operations while respecting the approved privacy boundary.

**Blocked by:** 02: Deliver workspace navigation and public trust pages.

**Status:** complete

- [x] A client rendering failure produces a usable error state with a recovery action instead of a blank page.
- [x] Worker failures use a stable public error shape and do not expose stack traces or internal details to visitors.
- [x] Structured logs include request correlation and operational context without selections, Generated regexes, pasted text, Saved calculations, or browser-storage contents.
- [x] Analytics record aggregate page and Tool use only.
- [x] A visitor can read exactly what analytics are collected on the Privacy page.
- [x] Development and automated test runs can disable outbound analytics.
- [x] Tests prove that representative private Tool state never appears in analytics events, Worker logs, or public error responses.
- [x] Sentry and other third-party error trackers remain absent.

