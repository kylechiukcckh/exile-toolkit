import { describe, expect, it } from 'vitest';

import {
  importDataset,
  renderDataset,
  renderManifest
} from '../../../scripts/import-disenchant-dataset.mjs';

const provenance = {
  source: {
    name: 'Fixed import fixture',
    url: 'https://example.com/source'
  },
  gameVersion: '3.29',
  verification: 'reviewed',
  license: {
    name: 'MIT',
    url: 'https://example.com/license'
  },
  updatedAt: '2026-08-29T00:00:00.000Z'
};

const records = [
  {
    id: 'zulu--iron-hat',
    name: 'Zulu',
    baseType: 'Iron Hat',
    category: 'armour',
    baseDust: 20,
    upstreamReference: 'https://example.com/zulu'
  },
  {
    id: 'alpha--rusted-sword',
    name: 'Alpha',
    baseType: 'Rusted Sword',
    category: 'weapon',
    baseDust: 10,
    upstreamReference: 'https://example.com/alpha'
  }
] as const;

function source(inputRecords: unknown = records) {
  return {
    version: 'test-1',
    coverage: 'Fixed importer fixtures only.',
    provenance,
    records: inputRecords
  };
}

describe('Disenchant dataset import', () => {
  it('renders byte-identical output regardless of source record order', async () => {
    const forward = importDataset(source(records));
    const reversed = importDataset(source([...records].reverse()));

    expect(forward.entries.map(entry => entry.id)).toEqual([
      'alpha--rusted-sword',
      'zulu--iron-hat'
    ]);
    await expect(renderDataset(forward)).resolves.toBe(
      await renderDataset(reversed)
    );
    await expect(renderManifest(forward)).resolves.toBe(
      await renderManifest(reversed)
    );
  });

  it('rejects malformed fixed input before rendering', () => {
    const duplicate = { ...records[0], name: 'Different label' };

    expect(() =>
      importDataset(source([records[0], duplicate, { name: '' }]))
    ).toThrowError(/records contains duplicate id "zulu--iron-hat"/);
    expect(() =>
      importDataset(source([records[0], duplicate, { name: '' }]))
    ).toThrowError(/records\[2\]\.id must be a non-empty string/);
  });
});
