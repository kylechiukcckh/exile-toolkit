# 08: Complete accessible keyboard and responsive operation

**What to build:** Make the finished maps and map-mod regex workflow efficient beside the game and fully usable without a pointer. Players can find and switch tools, focus search, copy output, change information density, and complete the workflow across supported desktop and mobile layouts.

**Blocked by:** 07: Preserve and share workspace state.

**Status:** complete

- [x] Global tool search opens, identifies available and coming-later Tools, and navigates only to usable destinations.
- [x] Documented shortcuts support Tool switching, focusing search, and copying the intended Regex part.
- [x] Shortcuts do not fire while the same keys are being typed into an input or editable control.
- [x] Every main workflow can be completed by keyboard with a visible, logical focus order.
- [x] Compact density is the default and the comfortable-density preference changes the workspace without hiding functionality.
- [x] Status, warning, selection, and copy feedback remain understandable without relying on color alone.
- [x] Dialogs, tooltips, menus, checkboxes, and toasts expose appropriate accessible names and focus behavior.
- [x] The workflow remains usable at supported mobile and desktop viewport sizes and respects reduced-motion preferences.
- [x] Automated accessibility checks and browser tests cover the public workflow in current Chromium, Firefox, and WebKit engines.

