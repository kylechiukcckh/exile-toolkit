import { describe, expect, it } from 'vitest';
import {
  validateItemModifierDataset,
  type ItemModifier
} from '@exile-toolkit/domain';

import {
  importItemModifierSnapshot,
  renderItemModifierChunk
} from '../../../scripts/import-item-modifier-dataset.mjs';

const sourceDirectory = 'packages/data/source/item-modifiers';

describe('Item modifier dataset import', () => {
  it('imports stable IDs, tier states, multi-value stats, and reachable indexes', async () => {
    const { dataset } = await importItemModifierSnapshot(sourceDirectory);

    expect(validateItemModifierDataset(dataset)).toEqual({
      valid: true,
      dataset
    });
    expect(dataset.bases[0]?.id).toBe('base-amulet-focused');
    expect(
      dataset.modifiers.map((modifier: ItemModifier) => [
        modifier.id,
        modifier.tier
      ])
    ).toEqual([
      ['modifier-amulet-added-physical-t1', 1],
      ['modifier-amulet-all-skills', null],
      ['modifier-amulet-life-t1', 1],
      ['modifier-amulet-life-t2', 2]
    ]);
    expect(dataset.modifiers[0]?.stats).toHaveLength(2);
    expect(dataset.indexes.families['maximum-life']).toEqual([2, 3]);
  });

  it('renders byte-identical output on repeated imports', async () => {
    const first = await importItemModifierSnapshot(sourceDirectory);
    const second = await importItemModifierSnapshot(sourceDirectory);

    await expect(renderItemModifierChunk(first.dataset)).resolves.toBe(
      await renderItemModifierChunk(second.dataset)
    );
  });

  it('generates a versioned manifest that locates the normal Amulet chunk', async () => {
    const { default: manifest } =
      await import('./generated/item-modifiers/manifest.json');
    expect(manifest.gameVersion).toBe('3.27.0');
    expect(manifest.chunks).toEqual({ 'amulet/normal': 'amulet-normal.ts' });
  });
});
