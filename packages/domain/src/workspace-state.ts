import type { DatasetCategory } from './dataset';
import type { CustomRegexEntry } from './regex-presets';

export type WorkspaceTheme = 'dark' | 'light' | 'system';
export type WorkspaceDensity = 'compact' | 'comfortable';
export const workspaceLeagues = [
  'Allflame',
  'Hardcore Allflame',
  'Standard',
  'Hardcore'
] as const;
export type WorkspaceLeague = (typeof workspaceLeagues)[number];
export const workspaceCurrencyDisplays = ['smart', 'chaos', 'divine'] as const;
export type WorkspaceCurrencyDisplay =
  (typeof workspaceCurrencyDisplays)[number];

export interface SavedCalculation {
  readonly id: string;
  readonly name: string;
  readonly category: DatasetCategory;
  readonly selectedIds: readonly string[];
  readonly customEntries: readonly CustomRegexEntry[];
}

export interface ToolHistoryEntry {
  readonly id: string;
  readonly category: DatasetCategory;
  readonly selectedIds: readonly string[];
}

export interface WorkspaceLocalState {
  readonly theme: WorkspaceTheme;
  readonly density: WorkspaceDensity;
  readonly activeLeague: WorkspaceLeague;
  readonly currencyDisplay: WorkspaceCurrencyDisplay;
  readonly favorites: readonly string[];
  readonly savedCalculations: readonly SavedCalculation[];
  readonly history: readonly ToolHistoryEntry[];
}

export const workspaceLocalStateDefaults: WorkspaceLocalState = {
  theme: 'dark',
  density: 'compact',
  activeLeague: 'Allflame',
  currencyDisplay: 'smart',
  favorites: [],
  savedCalculations: [],
  history: []
};

const maximumWorkspaceItems = 20;
const maximumSelectionItems = 200;

export function sanitizeWorkspaceLocalState(input: unknown): {
  readonly state: WorkspaceLocalState;
  readonly issues: readonly string[];
} {
  if (!isRecord(input)) {
    return {
      state: workspaceLocalStateDefaults,
      issues: input == null ? [] : ['Ignored invalid saved workspace data.']
    };
  }

  const issues: string[] = [];
  const savedCalculations = (
    Array.isArray(input.savedCalculations) ? input.savedCalculations : []
  )
    .slice(0, maximumWorkspaceItems)
    .flatMap(sanitizeSavedCalculation);
  const history = (Array.isArray(input.history) ? input.history : [])
    .slice(0, maximumWorkspaceItems)
    .flatMap(sanitizeHistoryEntry);

  return {
    state: {
      theme:
        input.theme === 'light' || input.theme === 'system'
          ? input.theme
          : 'dark',
      density: input.density === 'comfortable' ? 'comfortable' : 'compact',
      activeLeague: isWorkspaceLeague(input.activeLeague)
        ? input.activeLeague
        : workspaceLocalStateDefaults.activeLeague,
      currencyDisplay: isWorkspaceCurrencyDisplay(input.currencyDisplay)
        ? input.currencyDisplay
        : workspaceLocalStateDefaults.currencyDisplay,
      favorites: (Array.isArray(input.favorites) ? input.favorites : [])
        .slice(0, maximumWorkspaceItems)
        .filter(isShortString),
      savedCalculations,
      history
    },
    issues
  };
}

function sanitizeSavedCalculation(value: unknown): SavedCalculation[] {
  if (
    !isRecord(value) ||
    !isShortString(value.id) ||
    !isShortString(value.name) ||
    !isCategory(value.category) ||
    !Array.isArray(value.selectedIds) ||
    !Array.isArray(value.customEntries)
  ) {
    return [];
  }

  return [
    {
      id: value.id,
      name: value.name,
      category: value.category,
      selectedIds: value.selectedIds
        .slice(0, maximumSelectionItems)
        .filter(isShortString),
      customEntries: value.customEntries
        .slice(0, maximumSelectionItems)
        .filter(isCustomEntry)
    }
  ];
}

function sanitizeHistoryEntry(value: unknown): ToolHistoryEntry[] {
  if (
    !isRecord(value) ||
    !isShortString(value.id) ||
    !isCategory(value.category) ||
    !Array.isArray(value.selectedIds)
  ) {
    return [];
  }

  return [
    {
      id: value.id,
      category: value.category,
      selectedIds: value.selectedIds
        .slice(0, maximumSelectionItems)
        .filter(isShortString)
    }
  ];
}

function isCustomEntry(value: unknown): value is CustomRegexEntry {
  return (
    isRecord(value) &&
    isShortString(value.id) &&
    isCategory(value.category) &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    value.name.length <= 300
  );
}

function isCategory(value: unknown): value is DatasetCategory {
  return value === 'map' || value === 'map-modifier';
}

function isWorkspaceLeague(value: unknown): value is WorkspaceLeague {
  return workspaceLeagues.includes(value as WorkspaceLeague);
}

function isWorkspaceCurrencyDisplay(
  value: unknown
): value is WorkspaceCurrencyDisplay {
  return workspaceCurrencyDisplays.includes(value as WorkspaceCurrencyDisplay);
}

function isShortString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 100;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
