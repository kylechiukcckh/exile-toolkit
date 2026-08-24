# 08: Complete accessible keyboard and responsive operation

**What to build:** Make the finished maps and map-mod regex workflow efficient beside the game and fully usable without a pointer. Players can find and switch tools, focus search, copy output, change information density, and complete the workflow across supported desktop and mobile layouts.

**Blocked by:** 07: Preserve and share workspace state.

**Status:** ready-for-agent

- [ ] Global tool search opens, identifies available and coming-later Tools, and navigates only to usable destinations.
- [ ] Documented shortcuts support Tool switching, focusing search, and copying the intended Regex part.
- [ ] Shortcuts do not fire while the same keys are being typed into an input or editable control.
- [ ] Every main workflow can be completed by keyboard with a visible, logical focus order.
- [ ] Compact density is the default and the comfortable-density preference changes the workspace without hiding functionality.
- [ ] Status, warning, selection, and copy feedback remain understandable without relying on color alone.
- [ ] Dialogs, tooltips, menus, checkboxes, and toasts expose appropriate accessible names and focus behavior.
- [ ] The workflow remains usable at supported mobile and desktop viewport sizes and respects reduced-motion preferences.
- [ ] Automated accessibility checks and browser tests cover the public workflow in current Chromium, Firefox, and WebKit engines.

