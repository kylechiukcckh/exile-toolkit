import {
  sanitizeWorkspaceLocalState,
  workspaceLocalStateDefaults,
  type CustomRegexEntry,
  type DatasetCategory,
  type WorkspaceDensity,
  type WorkspaceTheme
} from '@exile-toolkit/domain';
import { useCallback, useEffect, useMemo, useState } from 'react';

const storageKey = 'exile-toolkit.workspace-state.v1';
const regexStorageKey = 'exile-toolkit.regex-state.v1';

export function useWorkspaceLocalState() {
  const initial = useMemo(loadState, []);
  const [state, setState] = useState(initial.state);
  const [issues, setIssues] = useState(initial.issues);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
    document.documentElement.dataset.density = state.density;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      setIssues(current => [
        ...current,
        'Could not save workspace settings in this browser.'
      ]);
    }
  }, [state]);

  const setTheme = useCallback((theme: WorkspaceTheme) => {
    setState(current => ({ ...current, theme }));
  }, []);

  const setDensity = useCallback((density: WorkspaceDensity) => {
    setState(current => ({ ...current, density }));
  }, []);

  const toggleFavorite = useCallback((toolId: string) => {
    setState(current => ({
      ...current,
      favorites: current.favorites.includes(toolId)
        ? current.favorites.filter(id => id !== toolId)
        : [...current.favorites, toolId]
    }));
  }, []);

  const recordHistory = useCallback(
    (category: DatasetCategory, selectedIds: readonly string[]) => {
      if (selectedIds.length === 0) return;
      const id = `${category}:${selectedIds.join(',')}`;
      setState(current => ({
        ...current,
        history: [
          { id, category, selectedIds },
          ...current.history.filter(entry => entry.id !== id)
        ].slice(0, 20)
      }));
    },
    []
  );

  const saveCalculation = useCallback(
    (
      category: DatasetCategory,
      selectedIds: readonly string[],
      customEntries: readonly CustomRegexEntry[]
    ) => {
      setState(current => ({
        ...current,
        savedCalculations: [
          {
            id: `saved-${crypto.randomUUID()}`,
            name: `Saved regex ${current.savedCalculations.length + 1}`,
            category,
            selectedIds,
            customEntries
          },
          ...current.savedCalculations
        ].slice(0, 20)
      }));
    },
    []
  );

  const clearLocalData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(regexStorageKey);
      setState(workspaceLocalStateDefaults);
      window.location.reload();
    } catch {
      setIssues(current => [
        ...current,
        'Could not clear all local data. Browser storage may still contain saved work.'
      ]);
    }
  }, []);

  return {
    state,
    issues,
    setTheme,
    setDensity,
    toggleFavorite,
    recordHistory,
    saveCalculation,
    clearLocalData
  };
}

export type WorkspaceLocalController = ReturnType<
  typeof useWorkspaceLocalState
>;

function loadState() {
  try {
    const saved = localStorage.getItem(storageKey);
    return sanitizeWorkspaceLocalState(saved ? JSON.parse(saved) : null);
  } catch {
    return {
      state: workspaceLocalStateDefaults,
      issues: ['Could not read saved workspace data from this browser.']
    };
  }
}
