---
title: Build the Exile Toolkit foundation and maps regex workflow
status: open
labels:
  - ready-for-agent
---

## Problem Statement

Experienced Path of Exile 1 trade-league players use many separate websites for pricing, expected-value calculations, crafting research, cluster jewel checks, and stash regex generation. Moving between those sites creates tab sprawl, repeats league and preference setup, hides data freshness, and makes it difficult to retain or share a configured calculation.

The project currently contains product documentation and architecture decisions but no application code. The first delivery needs to prove the Exile Toolkit workspace with one complete tool rather than spreading unfinished behavior across the full roadmap.

## Solution

Build the Exile Toolkit workspace and its first complete tool: an inclusion-only regex generator for maps and map modifiers. The workspace will provide shared navigation, active-league and data-health context, local persistence, shareable tool state, accessible keyboard operation, responsive layouts, public information pages, and honest coming-later cards for the remaining tools.

The regex generator will let users search and select curated entries, add local custom entries, apply built-in or local presets, preview matches and non-matches, and copy one or more generated regex parts. It will split selections that exceed the game's accepted length without silently introducing false positives.

This milestone establishes the repository, deployment, domain, data-validation, UI, persistence, and testing patterns that later tools will reuse.

## User Stories

1. As an experienced PoE 1 trade-league player, I want one workspace for PoE tools, so that I do not need to manage a separate browser tab for every workflow.
2. As a player, I want the workspace to show the active league globally, so that every tool uses the same league context.
3. As a player, I want the first release to support the current challenge league, so that its data and interface remain focused on the league I play.
4. As a player, I want a home view listing every planned tool, so that I understand what Exile Toolkit will contain.
5. As a player, I want unfinished tools marked as coming later, so that I do not mistake mock controls for working features.
6. As a player, I want to open tools from a persistent sidebar, so that switching workflows is quick and predictable.
7. As a keyboard user, I want a global tool search, so that I can navigate without scanning the sidebar.
8. As a keyboard user, I want shortcuts for switching tools, focusing search, and copying results, so that common actions do not require a pointer.
9. As a keyboard user, I want shortcuts to avoid overriding normal input behavior, so that typing text remains safe.
10. As a desktop player, I want a compact interface, so that useful information fits beside the game.
11. As a player who prefers larger controls, I want a comfortable-density setting, so that compact tables do not reduce usability.
12. As a mobile visitor, I want the workspace and regex workflow to remain functional, so that I can inspect or prepare a search away from my PC.
13. As a user with accessibility needs, I want visible focus, semantic controls, sufficient contrast, and non-color status cues, so that the workspace remains understandable and operable.
14. As a player, I want the interface in English initially, so that Path of Exile terminology remains consistent.
15. As a future Traditional Chinese user, I want interface text kept separate from components, so that translation can be added without rebuilding the UI.
16. As a player, I want my density, theme, favorites, and tool preferences retained in my browser, so that I do not repeat setup on every visit.
17. As a player, I want at most 20 recent actions retained per tool, so that useful history remains available without growing indefinitely.
18. As a privacy-conscious player, I want pasted content discarded unless I explicitly save it, so that the application does not retain unintended game data.
19. As a privacy-conscious player, I want a clear-local-data action, so that I can remove preferences, history, presets, and saved calculations from my browser.
20. As a player, I want safe tool state encoded in a shareable URL, so that I can send a configured selection without creating an account.
21. As a player, I want malformed or outdated shared URLs handled safely, so that an old link cannot break the workspace.
22. As a player, I want to browse map and map-mod entries in searchable groups, so that I can find relevant entries quickly.
23. As a player, I want select-all and clear actions scoped to the current group, so that I can make broad selections without losing unrelated work.
24. As a player, I want to select entries that should be included, so that the generated regex matches the maps or map modifiers I care about.
25. As a player, I want inclusion-only behavior in the first release, so that the generator remains understandable and predictable.
26. As a player, I want built-in presets with clear descriptions, so that common selections do not need to be assembled manually.
27. As a player, I want to save custom presets locally, so that I can reuse my own map and map-mod selections.
28. As a player, I want to rename and delete my local presets, so that saved choices remain manageable.
29. As a player, I want to add a local custom entry, so that missing curated data does not block my immediate workflow.
30. As a player, I want custom entries kept separate from curated entries, so that local text is not presented as reviewed project data.
31. As a player, I want the generated regex to avoid false-positive matches against the current category, so that stash highlighting remains trustworthy.
32. As a player, I want a match preview showing matched and unmatched entries, so that I can inspect the result before copying it.
33. As a player, I want regex metacharacters in entry text handled safely, so that ordinary game text cannot corrupt the expression.
34. As a player, I want duplicate selections normalized, so that repeated input does not waste characters.
35. As a player, I want overlong output split into valid regex parts, so that a large selection remains usable in game.
36. As a player, I want every regex part to show its character count, so that I can verify it stays within the accepted limit.
37. As a player, I want a separate copy action for every regex part, so that I can use split results without manual editing.
38. As a player, I want clear feedback after copying, so that I know which part reached the clipboard.
39. As a player whose browser blocks clipboard access, I want to select the generated text manually, so that clipboard restrictions do not block the workflow.
40. As a contributor, I want a missing-entry link that opens the correction workflow without including private input, so that I can report gaps safely.
41. As a contributor, I want every curated entry to identify its source, game version, verification state, license metadata, and update time, so that corrections are reviewable.
42. As a maintainer, I want datasets validated before deployment, so that duplicate identifiers, invalid regex data, missing provenance, and incompatible versions cannot reach users.
43. As a maintainer, I want dataset changes reviewed as readable repository diffs, so that league updates have an audit trail.
44. As a maintainer, I want pull-request preview deployments, so that interface and data changes can be checked before production.
45. As a maintainer, I want formatting, linting, type checking, tests, validation, and builds to run on every pull request, so that basic failures do not reach production.
46. As a maintainer, I want structured Worker logs and client error boundaries, so that failures are diagnosable without collecting calculation contents.
47. As a privacy-conscious visitor, I want analytics limited to aggregate page and tool usage, so that pasted text and selections are not collected.
48. As a visitor, I want About, Data Sources, Privacy, License Notices, and non-affiliation pages, so that I understand ownership, data limits, and tracking.
49. As a player, I want beta results to show their data version and coverage, so that I do not confuse incomplete data with an authoritative answer.
50. As a player, I want missing information represented as unknown rather than zero, so that later price-aware tools do not produce misleading calculations.
51. As a contributor, I want sourced issues and pull requests accepted, so that the community can propose tools and correct data.
52. As a project owner, I want the code published under MIT while datasets retain their own metadata, so that code licensing does not falsely relicense third-party or GGG-owned material.

## Implementation Decisions

- Use a pnpm workspace containing a web application, a Worker API, a framework-independent domain package, and a validated data package.
- Build the web application with React, TypeScript, and Vite.
- Use Tailwind CSS and individual shadcn components rather than a copied dashboard template. Initial components are button, command/search, checkbox, tabs, tooltip, dialog, dropdown menu, toast, and scroll area.
- Use the shadcn MCP to inspect registry components, obtain supported add commands, find official usage examples, and run the component audit checklist.
- Deploy the web application to Cloudflare Pages and APIs to a Cloudflare Worker.
- Support pull-request previews and production. A permanent staging environment is deferred.
- Keep parsing, regex generation, splitting, preview evaluation, tool-state serialization, and validation independent of React and Cloudflare.
- Use an original dark visual system. Do not copy GGG or reference-site artwork, layout, text, or branding.
- Use a desktop-first responsive layout with a left tool sidebar, global header, home workspace, and main tool area.
- Display the active league and data-health state globally even though the first milestone has no price-dependent tool.
- Keep unfinished tools visible only as coming-later cards without interactive mock controls.
- Store preferences, favorites, local presets, saved calculations, and bounded history in browser storage.
- Do not add user accounts, character imports, stash access, or PoE OAuth.
- Version the URL-state format. Encode only safe, reasonably sized inputs, validate decoded state, and fall back without crashing when a version is unsupported.
- Generate inclusion-only regexes in this milestone.
- Treat curated entries and custom entries as distinct domain concepts. Custom entries remain local and are never promoted automatically.
- Keep curated maps and map modifiers in versioned JSON datasets reviewed through repository changes.
- Require every dataset record to carry source, game version, verification state, license metadata, and update time.
- Validate dataset identifiers, required provenance, duplicates, category membership, and regex safety during development and continuous integration.
- Prefer exact matching and safe shortening. Do not reduce output length by silently allowing false positives.
- Split output deterministically when it exceeds a configurable game limit. Do not hard-code an unverified limit inside UI components.
- Show matched and unmatched curated entries for the active category using the same regex engine and normalization rules as the generated output.
- Provide built-in presets as reviewed data and custom presets as local user state.
- Make copy actions progressively enhanced. Generated text remains selectable when clipboard APIs fail.
- Centralize English interface strings so Traditional Chinese can be added later.
- Target WCAG 2.2 AA where practical and support current Chrome, Edge, Firefox, and Safari.
- Use structured Worker logs and client error boundaries initially. Sentry is deferred until a separate privacy review.
- Limit analytics to aggregate page and tool use. Never send pasted content, selections, generated regexes, or saved calculations to analytics.
- Publish code under MIT. Dataset licensing remains record-specific and is not inherited automatically from the code license.
- Preserve the broader build order after this milestone: regex category expansion, disenchant, cluster jewels, scarab expected value, and warrants.
- Do not scrape PoEDB, poe.re, undocumented GGG endpoints, or installed game files. Do not copy unlicensed code or datasets.

## Testing Decisions

- The primary seam is each completed tool's public browser workflow. Tests should exercise behavior a user can observe rather than component structure, hook calls, CSS classes, or internal storage implementation.
- The foundation browser workflow covers loading the workspace, navigating with the sidebar and global search, identifying coming-later tools, changing density, reloading retained preferences, clearing local data, keyboard navigation, responsive behavior, and opening public information pages.
- The regex browser workflow covers searching and grouping entries, selecting and clearing entries, applying built-in presets, saving and removing local presets, adding custom entries, previewing matches, splitting overlong results, copying parts, sharing safe state, restoring shared state, and recovering from malformed URLs.
- Domain-level tests cover normalization, escaping, safe shortening, deterministic splitting, match preview, duplicate selections, custom entries, URL-state versioning, and failure behavior. These tests assert inputs and outputs, not internal helper calls.
- Dataset tests cover schema validity, unique identifiers, provenance completeness, supported game versions, category membership, deterministic ordering where exposed, and fixtures proving that generated regexes match only their declared entries.
- Clipboard tests cover successful copying and the externally visible fallback when clipboard access is unavailable. They do not mock or inspect UI implementation details beyond the browser boundary.
- Accessibility checks cover keyboard completion of the main workflow, focus visibility and order, accessible control names, dialog focus handling, contrast, reduced-motion behavior, and status communication without color alone.
- Performance checks cover a shell usability target of two seconds on a typical desktop connection, immediate cached tool switching, and normal regex calculations below 100 milliseconds.
- Worker tests in this milestone cover public health behavior, structured error responses, cache headers for static datasets where applicable, and the absence of user input in logs. Price-adapter tests begin with the later price-platform milestone.
- There is no existing executable test suite or application code to use as prior art. The confirmed product specification, domain glossary, implementation plan, and ADRs are the prior design artifacts.
- A test is valuable when changing visible behavior breaks it and an internal refactor preserving behavior does not.

## Out of Scope

- Disenchant calculations and dust datasets
- Cluster jewel compatibility, positions, pricing, and Trade queries
- Scarab vendor probabilities and expected-value rankings
- Warrant parsing, comparison, pricing, and Trade queries
- Regex categories other than maps and map modifiers for the first delivered slice
- Exclusion regexes and a general advanced-expression builder
- User accounts and cross-device synchronization
- Character, stash, or Path of Exile OAuth integration
- Standard league and Path of Exile 2 support
- Traditional Chinese translation in the initial release
- Progressive Web App and offline service-worker behavior
- A deployed administration interface or production database
- Sentry or another third-party error-tracking service
- Ads, subscriptions, or paid features
- Directly embedding or proxying the official Trade website
- Copying unlicensed code, generated datasets, text, styles, or artwork from reference tools

## Further Notes

- The working product name is Exile Toolkit. Domain and trademark availability must be checked before a public launch.
- The initial beta is free and self-funded. Donations may be considered later. Ads require written GGG guidance, a dataset-license audit, and an updated privacy policy before activation.
- The public beta should not be announced until the maps and map-mod regex workflow works end to end, production deployment is stable, required public pages exist, automated checks pass, and no known high-severity defect remains.
- Market-aware tools will use documented poe.ninja economy endpoints through the Worker, cache snapshots approximately every 15 minutes, label stale snapshots, and never treat a missing price as zero. Those contracts are recorded now for consistency but implemented in later issues.
- Standard support may be added after the current challenge-league experience is stable. PoE 2 support should use separate game-specific rules and datasets rather than assuming PoE 1 concepts are identical.
- This Markdown file is the initial local issue tracker. It can be migrated to a hosted tracker later while preserving its title, status, `ready-for-agent` label, and body.
