# 05: Split and copy overlong regex results safely

**What to build:** Make large Selections usable in game. The Tool shortens only when matching remains exact, then divides overlong output into deterministic Regex parts. A player can inspect the length, copy each part independently, and still use the output when browser clipboard access is unavailable.

**Blocked by:** 04: Add the map-modifier selection workflow.

**Status:** ready-for-agent

- [ ] The accepted regex-length limit is configurable outside UI components and is displayed consistently.
- [ ] Safe shortening never changes the Match preview or introduces a false positive against the active category.
- [ ] Output exceeding the configured limit is divided into deterministic Regex parts that each remain within the limit.
- [ ] Every Regex part shows its character count and has an independent copy action.
- [ ] Successful copying gives visible, accessible confirmation identifying the copied part.
- [ ] When clipboard access fails or is unavailable, generated text remains selectable and the Tool explains the fallback.
- [ ] Domain fixtures cover boundary lengths, metacharacters, Unicode, impossible constraints, determinism, and false-positive prevention.
- [ ] A browser test covers overlong selection, splitting, copying, confirmation, and clipboard failure behavior.

