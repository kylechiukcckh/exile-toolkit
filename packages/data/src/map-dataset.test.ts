import { validateCuratedDataset } from '@exile-toolkit/domain';
import { describe, expect, it } from 'vitest';

import { mapDataset } from './map-dataset';

describe('mapDataset', () => {
  it('ships as a valid, versioned collection of reviewed map entries', () => {
    expect(validateCuratedDataset(mapDataset)).toEqual({
      valid: true,
      dataset: mapDataset
    });
    expect(mapDataset.version).toBe('2026.08.25');
    expect(mapDataset.entries.length).toBeGreaterThanOrEqual(10);

    for (const entry of mapDataset.entries) {
      expect(entry.provenance.gameVersion).toBe('3.29');
      expect(entry.provenance.verification).toBe('reviewed');
    }
  });
});
