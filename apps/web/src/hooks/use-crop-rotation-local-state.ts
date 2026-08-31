import {
  cropPairKinds,
  referenceCropRotationSettings,
  validateCropRotationSettings,
  type CropPairKind,
  type CropRotationSettings
} from '@exile-toolkit/domain';
import { useEffect, useMemo, useRef, useState } from 'react';

export const cropRotationStorageKey = 'exile-toolkit.crop-rotation-state.v1';

export interface CropRotationToolState {
  readonly version: 1;
  readonly counts: Readonly<Record<CropPairKind, number>>;
  readonly settings: CropRotationSettings;
}

const emptyCounts = Object.fromEntries(
  cropPairKinds.map(pair => [pair, 0])
) as Record<CropPairKind, number>;

export const cropRotationToolStateDefaults: CropRotationToolState = {
  version: 1,
  counts: emptyCounts,
  settings: referenceCropRotationSettings
};

export function useCropRotationLocalState() {
  const initial = useMemo(loadState, []);
  const [counts, setCounts] = useState(initial.state.counts);
  const [settings, setSettings] = useState(initial.state.settings);
  const [issues, setIssues] = useState(initial.issues);
  const lastValidSettings = useRef(initial.state.settings);
  const clearingLocalData = useRef(
    sessionStorage.getItem('exile-toolkit:local-data-cleared') === 'true'
  );

  useEffect(() => {
    const resumePersistence = window.setTimeout(() => {
      sessionStorage.removeItem('exile-toolkit:local-data-cleared');
      clearingLocalData.current = false;
    }, 0);
    const cancelForLocalDataClear = () => {
      clearingLocalData.current = true;
    };
    window.addEventListener(
      'exile-toolkit:clear-local-data',
      cancelForLocalDataClear
    );
    return () => {
      window.clearTimeout(resumePersistence);
      window.removeEventListener(
        'exile-toolkit:clear-local-data',
        cancelForLocalDataClear
      );
    };
  }, []);

  useEffect(() => {
    if (validateCropRotationSettings(settings).valid) {
      lastValidSettings.current = settings;
    }
    if (clearingLocalData.current) return;
    try {
      localStorage.setItem(
        cropRotationStorageKey,
        JSON.stringify({
          version: 1,
          counts,
          settings: lastValidSettings.current
        })
      );
    } catch {
      setIssues(current => [
        ...current,
        'Could not save Crop Rotation setup in this browser.'
      ]);
    }
  }, [counts, settings]);

  return { counts, settings, issues, setCounts, setSettings };
}

export function sanitizeCropRotationToolState(
  value: unknown
): CropRotationToolState {
  return parseCropRotationToolState(value) ?? cropRotationToolStateDefaults;
}

function loadState(): {
  readonly state: CropRotationToolState;
  readonly issues: readonly string[];
} {
  try {
    const saved = localStorage.getItem(cropRotationStorageKey);
    if (!saved) return { state: cropRotationToolStateDefaults, issues: [] };
    const state = parseCropRotationToolState(JSON.parse(saved));
    return state
      ? { state, issues: [] }
      : {
          state: cropRotationToolStateDefaults,
          issues: ['Saved Crop Rotation setup was reset.']
        };
  } catch {
    return {
      state: cropRotationToolStateDefaults,
      issues: ['Saved Crop Rotation setup was reset.']
    };
  }
}

function parseCropRotationToolState(
  value: unknown
): CropRotationToolState | undefined {
  if (!isRecord(value) || value.version !== 1) return undefined;
  if (
    !isRecord(value.counts) ||
    !validateCropRotationSettings(value.settings).valid
  ) {
    return undefined;
  }

  const counts = {} as Record<CropPairKind, number>;
  let total = 0;
  for (const pair of cropPairKinds) {
    const count = value.counts[pair];
    if (!Number.isInteger(count) || (count as number) < 0) return undefined;
    counts[pair] = count as number;
    total += count as number;
  }
  if (total > 5) return undefined;

  return {
    version: 1,
    counts,
    settings: value.settings as unknown as CropRotationSettings
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
