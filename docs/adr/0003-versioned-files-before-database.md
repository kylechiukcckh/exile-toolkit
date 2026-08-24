# Keep curated datasets as versioned files before adding a database

Curated datasets will begin as validated JSON reviewed through repository changes instead of production database edits. The beta needs provenance, reproducible builds, and visible league-to-league diffs more than it needs live administration; a database and protected admin interface can be introduced when community submissions or update volume make reviewed files impractical.

## Consequences

Dataset changes require validation and deployment. Local generation tools may prepare changes, but they cannot bypass review or modify production data directly.

