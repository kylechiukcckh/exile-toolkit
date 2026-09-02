# Keep the Item modifier foundation client-side and file-backed

Exile Toolkit will define Item modifier rules as framework-independent domain code and distribute reviewed Modifier data as versioned static chunks generated from canonical CSV files. Runtime parsing, matching, value calculation, eligibility, and conflict validation remain client-side, with no production database or Worker dependency, because copied item contents are private, Modifier data changes infrequently, repository review provides useful diffs, and future item Tools need one deterministic foundation.

## Consequences

Maintainers assign permanent Toolkit IDs, preserve source and license manifests, and update reviewed CSV records when GGG changes data. Imports are atomic, source disagreements require recorded review, and runtime chunks split by equipment class and source pool. A database may be reconsidered only when runtime editing, user submissions, or measured query needs make versioned files impractical.
