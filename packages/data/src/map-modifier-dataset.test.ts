import { validateCuratedDataset } from '@exile-toolkit/domain';
import { describe, expect, it } from 'vitest';

import { mapModifierDataset } from './map-modifier-dataset';

describe('mapModifierDataset', () => {
  it('ships reviewed modifiers in meaningful groups', () => {
    expect(validateCuratedDataset(mapModifierDataset)).toEqual({
      valid: true,
      dataset: mapModifierDataset
    });
    expect(mapModifierDataset.version).toBe('2026.08.25');
    expect(mapModifierDataset.entries.length).toBeGreaterThanOrEqual(9);
    expect(
      new Set(mapModifierDataset.entries.map(entry => entry.group))
    ).toEqual(
      new Set(['Ground effects', 'Monster defenses', 'Player penalties'])
    );
  });
});
