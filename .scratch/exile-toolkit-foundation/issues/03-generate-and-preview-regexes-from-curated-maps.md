# 03: Generate and preview regexes from curated maps

**What to build:** Deliver the first complete Tool workflow. A player can search a reviewed map Dataset, create a Selection, receive an inclusion-only Generated regex, and inspect the Match preview before using it. Every Curated entry carries enough Provenance to make the Dataset reviewable.

**Blocked by:** 02: Deliver workspace navigation and public trust pages.

**Status:** complete

- [x] The distributed map Dataset has a version and every Curated entry includes source, game version, Verification state, license metadata, and update time.
- [x] Validation rejects missing provenance, duplicate identifiers, unsupported category values, and malformed entry data.
- [x] A player can open the regex Tool, search maps, select and deselect entries, and see the Selection update.
- [x] The Tool produces an inclusion-only Generated regex from the Selection and handles regex metacharacters safely.
- [x] Duplicate selections do not consume extra characters or change the result.
- [x] The Match preview divides the current curated map category into matched and unmatched entries using the Generated regex.
- [x] Empty, invalid, and unsupported states produce clear guidance instead of a misleading result.
- [x] Domain tests cover observable generation and matching behavior, while a browser test covers the full selection-to-preview workflow.

