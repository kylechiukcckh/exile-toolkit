import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
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
const execFileAsync = promisify(execFile);

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
    const publishedChunk = await readFile(
      join(outputDirectory, 'amulet-normal.ts'),
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
      execFileAsync(process.execPath, [
        join(process.cwd(), 'scripts', 'import-item-modifier-dataset.mjs'),
        '--source',
        join(root, 'source'),
        '--output',
        outputDirectory
      ])
    ).rejects.toThrow('base-types.csv has unknown column "unexpected"');
    await expect(
      readFile(join(outputDirectory, 'manifest.json'), 'utf8')
    ).resolves.toBe(publishedManifest);
    await expect(
      readFile(join(outputDirectory, 'amulet-normal.ts'), 'utf8')
    ).resolves.toBe(publishedChunk);
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

  it('publishes matching repeated IDs through each acquisition-source chunk', async () => {
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
      normal.replaceAll(',normal,item,', ',essence,item,')
    );
    const outputDirectory = join(root, 'output');

    const imported = await importItemModifierSnapshot(join(root, 'source'));
    await writeItemModifierDataset({
      sourceDirectory: join(root, 'source'),
      outputDirectory
    });

    expect(imported.manifest.chunks).toEqual({
      'amulet/essence': 'amulet-essence.ts',
      'amulet/normal': 'amulet-normal.ts'
    });
    await expect(
      readFile(join(outputDirectory, 'amulet-essence.ts'), 'utf8')
    ).resolves.toContain("sourcePool: 'essence'");
  });

  it('generates a valid snapshot through the public import command', async () => {
    const root = await makeSnapshotCopy();

    await expect(runImportCommand(root)).resolves.toBeDefined();
    await expect(
      readFile(join(root, 'output', 'manifest.json'), 'utf8')
    ).resolves.toContain('"amulet/normal": "amulet-normal.ts"');
  });

  it('keeps inactive records out through the public import command', async () => {
    const root = await makeSnapshotCopy();
    await replaceInSnapshot(
      root,
      join('modifiers', 'normal', 'amulet.csv'),
      'modifier-amulet-life-t2,,true,',
      'modifier-amulet-life-t2,,false,'
    );

    await runImportCommand(root);

    await expect(
      readFile(join(root, 'output', 'amulet-normal.ts'), 'utf8')
    ).resolves.not.toContain('modifier-amulet-life-t2');
    await expect(
      readFile(join(root, 'output', 'manifest.json'), 'utf8')
    ).resolves.toContain('modifier-amulet-life-t2');
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

  it.each([
    [
      'malformed CSV',
      async (root: string) => {
        const path = join(root, 'source', 'base-types.csv');
        await writeFile(path, `${await readFile(path, 'utf8')}"`);
      }
    ],
    [
      'malformed JSON cell',
      async (root: string) => {
        await replaceInSnapshot(
          root,
          'base-types.csv',
          '[""amulet""',
          'not-json'
        );
      }
    ],
    [
      'missing required field',
      async (root: string) => {
        await replaceInSnapshot(root, 'base-types.csv', 'Focused Amulet', '');
      }
    ],
    [
      'broken reference',
      async (root: string) => {
        await replaceInSnapshot(
          root,
          'base-types.csv',
          'base-rule-focused-amulet',
          'missing-rule'
        );
      }
    ],
    [
      'invalid tier',
      async (root: string) => {
        await replaceInSnapshot(
          root,
          join('modifiers', 'normal', 'amulet.csv'),
          "Athlete's,1,normal",
          "Athlete's,invalid,normal"
        );
      }
    ],
    [
      'invalid precision',
      async (root: string) => {
        await replaceInSnapshot(
          root,
          join('modifiers', 'normal', 'amulet.csv'),
          '""internalPrecision"":0',
          '""internalPrecision"":-1'
        );
      }
    ],
    [
      'malformed weight',
      async (root: string) => {
        await replaceInSnapshot(
          root,
          join('modifiers', 'normal', 'amulet.csv'),
          '""weight"":1000',
          '""weight"":-1'
        );
      }
    ],
    [
      'malformed weight ordering',
      async (root: string) => {
        await replaceInSnapshot(
          root,
          join('modifiers', 'normal', 'amulet.csv'),
          '""tag"":""default""',
          '""tag"":""amulet""'
        );
      }
    ],
    [
      'unsupported base rule',
      async (root: string) => {
        await replaceInSnapshot(
          root,
          'base-rules.csv',
          'prefix-capacity-adjustment',
          'unsupported-adjustment'
        );
      }
    ],
    [
      'reused retired ID',
      async (root: string) => {
        const path = join(root, 'source', 'manifest.json');
        const manifest = JSON.parse(await readFile(path, 'utf8'));
        manifest.retiredModifierIds = ['modifier-amulet-life-t1'];
        await writeFile(path, JSON.stringify(manifest));
      }
    ],
    [
      'duplicate Toolkit ID',
      async (root: string) => {
        const path = join(root, 'source', 'modifiers', 'normal', 'amulet.csv');
        const contents = await readFile(path, 'utf8');
        const rows = contents.trimEnd().split(/\r?\n/);
        await writeFile(path, `${contents.trimEnd()}\n${rows[1]}\n`);
      }
    ],
    [
      'incomplete disagreement evidence',
      async (root: string) => {
        const path = join(root, 'source', 'manifest.json');
        const manifest = JSON.parse(await readFile(path, 'utf8'));
        manifest.disagreements = [{ subject: 'Life range' }];
        await writeFile(path, JSON.stringify(manifest));
      }
    ]
  ])('rejects %s through the public import command', async (_name, mutate) => {
    const root = await makeSnapshotCopy();
    await mutate(root);

    await expect(runImportCommand(root)).rejects.toThrow();
  });
});

async function makeSnapshotCopy() {
  const root = await mkdtemp(join(tmpdir(), 'exile-toolkit-modifiers-'));
  await cp(sourceDirectory, join(root, 'source'), { recursive: true });
  return root;
}

async function replaceInSnapshot(
  root: string,
  relativePath: string,
  before: string,
  after: string
) {
  const path = join(root, 'source', relativePath);
  const contents = await readFile(path, 'utf8');
  await writeFile(path, contents.replace(before, after));
}

function runImportCommand(root: string) {
  return execFileAsync(process.execPath, [
    join(process.cwd(), 'scripts', 'import-item-modifier-dataset.mjs'),
    '--source',
    join(root, 'source'),
    '--output',
    join(root, 'output')
  ]);
}
