import { mapDataset, mapModifierDataset } from '@exile-toolkit/data';
import {
  MAX_CUSTOM_ENTRIES,
  MAX_LOCAL_PRESETS,
  sanitizeLocalRegexState,
  type CustomRegexEntry,
  type DatasetCategory,
  type LocalRegexState
} from '@exile-toolkit/domain';
import { useEffect, useMemo, useState } from 'react';

const storageKey = 'exile-toolkit.regex-state.v1';
const curatedEntries = {
  map: mapDataset.entries,
  'map-modifier': mapModifierDataset.entries
};

export function useRegexLocalState() {
  const initial = useMemo(loadState, []);
  const [state, setState] = useState(initial.state);
  const [issues, setIssues] = useState(initial.issues);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      setIssues(current => [
        ...current,
        'Could not save regex presets or Custom entries in this browser.'
      ]);
    }
  }, [state]);

  function savePreset(
    category: DatasetCategory,
    name: string,
    entryIds: readonly string[]
  ) {
    if (state.presets.length >= MAX_LOCAL_PRESETS) {
      setIssues(current => [
        ...current,
        `Local presets are limited to ${MAX_LOCAL_PRESETS}.`
      ]);
      return;
    }
    setState(current => ({
      ...current,
      presets: [
        ...current.presets,
        {
          id: `preset-${crypto.randomUUID()}`,
          name,
          category,
          entryIds
        }
      ]
    }));
  }

  function renamePreset(id: string, name: string) {
    setState(current => ({
      ...current,
      presets: current.presets.map(preset =>
        preset.id === id ? { ...preset, name } : preset
      )
    }));
  }

  function deletePreset(id: string) {
    setState(current => ({
      ...current,
      presets: current.presets.filter(preset => preset.id !== id)
    }));
  }

  function addCustomEntry(category: DatasetCategory, name: string) {
    if (state.customEntries.length >= MAX_CUSTOM_ENTRIES) {
      setIssues(current => [
        ...current,
        `Custom entries are limited to ${MAX_CUSTOM_ENTRIES}.`
      ]);
      return null;
    }
    const entry = {
      id: `custom-${crypto.randomUUID()}`,
      name,
      category
    } satisfies CustomRegexEntry;
    const checked = sanitizeLocalRegexState(
      { ...state, customEntries: [...state.customEntries, entry] },
      curatedEntries
    );
    if (
      !checked.state.customEntries.some(candidate => candidate.id === entry.id)
    ) {
      setIssues(current => [...current, ...checked.issues]);
      return null;
    }
    setState(checked.state);
    return entry;
  }

  function removeCustomEntry(id: string) {
    setState(current => ({
      presets: current.presets.map(preset => ({
        ...preset,
        entryIds: preset.entryIds.filter(entryId => entryId !== id)
      })),
      customEntries: current.customEntries.filter(entry => entry.id !== id)
    }));
  }

  return {
    state,
    issues,
    savePreset,
    renamePreset,
    deletePreset,
    addCustomEntry,
    removeCustomEntry
  };
}

function loadState(): {
  readonly state: LocalRegexState;
  readonly issues: readonly string[];
} {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved)
      return { state: { presets: [], customEntries: [] }, issues: [] };
    return sanitizeLocalRegexState(JSON.parse(saved), curatedEntries);
  } catch {
    return {
      state: { presets: [], customEntries: [] },
      issues: ['Could not read saved regex data from this browser.']
    };
  }
}
