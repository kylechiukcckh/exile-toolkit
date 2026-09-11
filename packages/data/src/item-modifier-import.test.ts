import { cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  validateItemModifierDataset,
  type ItemModifier
} from '@exile-toolkit/domain';

import {
  importItemModifierSnapshot,
  renderItemModifierChunk,
  writeItemModifierDataset
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

  it('rejects unknown CSV columns without changing the published Dataset', async () => {
    const root = await makeSnapshotCopy();
    const outputDirectory = join(root, 'output');
    await writeItemModifierDataset({
      sourceDirectory: join(root, 'source'),
      outputDirectory
    });
    const publishedManifest = await readFile(
      join(outputDirectory, 'manifest.json'),
      'utf8'
    );
    const baseTypesPath = join(root, 'source', 'base-types.csv');
    const baseTypes = await readFile(baseTypesPath, 'utf8');
    await writeFile(
      baseTypesPath,
      baseTypes
        .replace('id,name,', 'id,unexpected,name,')
        .replace(
          'base-amulet-focused,Focused',
          'base-amulet-focused,nope,Focused'
        )
    );

    await expect(
      writeItemModifierDataset({
        sourceDirectory: join(root, 'source'),
        outputDirectory
      })
    ).rejects.toThrow('base-types.csv has unknown column "unexpected"');
    await expect(
      readFile(join(outputDirectory, 'manifest.json'), 'utf8')
    ).resolves.toBe(publishedManifest);
  });

  it('rejects incomplete source provenance', async () => {
    const root = await makeSnapshotCopy();
    const manifestPath = join(root, 'source', 'manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    delete manifest.sources[0].licenseUrl;
    await writeFile(manifestPath, JSON.stringify(manifest));

    await expect(
      importItemModifierSnapshot(join(root, 'source'))
    ).rejects.toThrow('sources[0].licenseUrl must be a valid URL');
  });

  it('replaces the complete generated set after successful validation', async () => {
    const root = await makeSnapshotCopy();
    const outputDirectory = join(root, 'output');
    await writeFile(join(root, 'stale.txt'), 'outside output');
    await writeItemModifierDataset({
      sourceDirectory: join(root, 'source'),
      outputDirectory
    });
    await writeFile(join(outputDirectory, 'stale.ts'), 'stale output');

    await writeItemModifierDataset({
      sourceDirectory: join(root, 'source'),
      outputDirectory
    });

    await expect(readFile(join(outputDirectory, 'stale.ts'))).rejects.toThrow();
    await expect(readFile(join(root, 'stale.txt'), 'utf8')).resolves.toBe(
      'outside output'
    );
  });

  it('reserves inactive IDs while excluding them from runtime indexes', async () => {
    const root = await makeSnapshotCopy();
    const modifiersPath = join(
      root,
      'source',
      'modifiers',
      'normal',
      'amulet.csv'
    );
    const modifiers = await readFile(modifiersPath, 'utf8');
    await writeFile(
      modifiersPath,
      modifiers.replace(
        'modifier-amulet-life-t2,,true,',
        'modifier-amulet-life-t2,,false,'
      )
    );

    const imported = await importItemModifierSnapshot(join(root, 'source'));

    expect(
      imported.dataset.modifiers.map((modifier: ItemModifier) => modifier.id)
    ).not.toContain('modifier-amulet-life-t2');
    expect(imported.dataset.indexes.modifierIds).not.toHaveProperty(
      'modifier-amulet-life-t2'
    );
    expect(imported.manifest.retiredModifierIds).toEqual([
      'modifier-amulet-life-t2'
    ]);
  });

  it('rejects conflicting definitions for an ID repeated across source pools', async () => {
    const root = await makeSnapshotCopy();
    const normalPath = join(
      root,
      'source',
      'modifiers',
      'normal',
      'amulet.csv'
    );
    const essenceDirectory = join(root, 'source', 'modifiers', 'essence');
    await mkdir(essenceDirectory);
    const normal = await readFile(normalPath, 'utf8');
    await writeFile(
      join(essenceDirectory, 'amulet.csv'),
      normal
        .replaceAll(',normal,item,', ',essence,item,')
        .replace(
          "modifier-amulet-life-t1,,true,Athlete's,",
          'modifier-amulet-life-t1,,true,Conflicting,'
        )
    );

    await expect(
      importItemModifierSnapshot(join(root, 'source'))
    ).rejects.toThrow(
      'modifier-amulet-life-t1 has conflicting definitions across source pools'
    );
  });
});

async function makeSnapshotCopy() {
  const root = await mkdtemp(join(tmpdir(), 'exile-toolkit-modifiers-'));
  await cp(sourceDirectory, join(root, 'source'), { recursive: true });
  return root;
}
