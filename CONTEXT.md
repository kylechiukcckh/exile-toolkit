# Exile Toolkit

Exile Toolkit is a shared workspace for Path of Exile trade-league research. This glossary fixes the language used across its tools so that prices, datasets, saved work, and uncertain results mean the same thing everywhere.

## Product

**Workspace**:
The complete Exile Toolkit experience in which tools share the active league, price information, preferences, and local history.
_Avoid_: Dashboard, portal, account

**Tool**:
A focused user workflow within the workspace, such as generating a stash regex or ranking disenchant candidates.
_Avoid_: Website, integration, widget, module

**Active league**:
The challenge league selected for every tool in the workspace. The first release has exactly one supported active league.
_Avoid_: Server, realm

**Tool state**:
The safe, shareable inputs that configure one tool at a point in time.
_Avoid_: Session, build

**Saved calculation**:
A tool state the user explicitly chooses to retain in the current browser.
_Avoid_: Account data, cloud save

## Economy

**Price snapshot**:
A set of market prices obtained together for one league and stamped with its source and retrieval time.
_Avoid_: Live prices, current prices

**Fresh snapshot**:
A price snapshot that remains inside the source-specific freshness window.
_Avoid_: Real-time prices

**Stale snapshot**:
A previously valid price snapshot used after its freshness window because the upstream source is unavailable.
_Avoid_: Current prices, invalid prices

**Missing price**:
The absence of a usable market value for an item. It is unknown and never equivalent to zero.
_Avoid_: Free, zero price

**Expected value**:
The probability-weighted market value of possible outcomes, calculated from a named price snapshot and a versioned probability dataset.
_Avoid_: Profit, guaranteed return

**Ranking**:
An ordered comparison whose result is valid only for its recorded inputs, price snapshot, and dataset versions.
_Avoid_: Recommendation, guarantee

## Data

**Dataset**:
A versioned collection of facts or mappings consumed by one or more tools.
_Avoid_: Database, hard-coded list

**Dataset record**:
One independently identifiable entry with source, game version, verification state, license metadata, and update time.
_Avoid_: Row, item

**Provenance**:
The traceable origin and permitted use of a dataset record.
_Avoid_: Source note, credit

**Verification state**:
The declared confidence level of a dataset record based on its evidence and review history.
_Avoid_: Correctness, trusted flag

**Coverage**:
The portion of the intended game concepts represented by a dataset version.
_Avoid_: Completeness

**Curated entry**:
A reviewed entry distributed with Exile Toolkit.
_Avoid_: Official entry

**Custom entry**:
User-supplied text stored only in the current browser and never promoted automatically into a dataset.
_Avoid_: Community data, submitted entry

## Regex

**Selection**:
The curated and custom entries a user wants a regex to match.
_Avoid_: Filter, query

**Generated regex**:
An inclusion-only regular expression derived from a selection without silent false-positive expansion.
_Avoid_: Search string, filter

**Regex part**:
One generated regex produced when a selection must be split to remain within the game's accepted length.
_Avoid_: Chunk

**Match preview**:
The explicit division of the current category into entries that do and do not match the generated regex parts.
_Avoid_: Test result

## Product status

**Coming-later tool**:
A named tool visible in the workspace roadmap but unavailable for use. It has no simulated results or fake controls.
_Avoid_: Disabled feature, mock tool

**Beta result**:
A result that exposes its data version, coverage, freshness, and known uncertainty.
_Avoid_: Final result, authoritative result

