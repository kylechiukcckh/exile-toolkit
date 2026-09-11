import { describe, expect, it } from 'vitest';
import { validateItemModifierDataset } from '@exile-toolkit/domain';

import { loadItemModifierDataset } from './item-modifier-dataset';

describe('loadItemModifierDataset', () => {
  it('loads the generated normal Amulet chunk through the public data layer', async () => {
    const result = await loadItemModifierDataset({
      equipmentClass: 'amulet',
      sourcePool: 'normal'
    });

    expect(result.status).toBe('success');
    if (result.status !== 'success') return;
    expect(validateItemModifierDataset(result.dataset).valid).toBe(true);
    expect(result.dataset.modifiers).toHaveLength(4);
  });

  it('returns Dataset unavailable for a source pool without a generated chunk', async () => {
    await expect(
      loadItemModifierDataset({
        equipmentClass: 'amulet',
        sourcePool: 'influenced'
      })
    ).resolves.toEqual({
      status: 'dataset-unavailable',
      equipmentClass: 'amulet',
      sourcePool: 'influenced'
    });
  });
});
