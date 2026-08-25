import { describe, expect, it } from 'vitest';

import { summarizeDatasetProvenance, type CuratedDataset } from './dataset';

describe('summarizeDatasetProvenance', () => {
  it('summarizes every record without treating the first source as Dataset-wide', () => {
    const dataset = {
      id: 'mixed',
      version: '1',
      category: 'map',
      coverage: 'Two records',
      entries: [
        entry('one', 'First', 'https://example.com/one', 'License A'),
        entry('two', 'Second', 'https://example.com/two', 'License B')
      ]
    } satisfies CuratedDataset;

    const summary = summarizeDatasetProvenance(dataset);

    expect(summary.sources).toEqual([
      {
        name: 'Example source',
        url: 'https://example.com/one',
        entryNames: ['First']
      },
      {
        name: 'Example source',
        url: 'https://example.com/two',
        entryNames: ['Second']
      }
    ]);
    expect(summary.licenses.map(license => license.name)).toEqual([
      'License A',
      'License B'
    ]);
  });
});

function entry(
  id: string,
  name: string,
  sourceUrl: string,
  licenseName: string
) {
  return {
    id,
    name,
    category: 'map' as const,
    provenance: {
      source: { name: 'Example source', url: sourceUrl },
      gameVersion: '3.29',
      verification: 'reviewed' as const,
      license: { name: licenseName, url: `https://example.com/${licenseName}` },
      updatedAt: '2026-08-25T00:00:00.000Z'
    }
  };
}
