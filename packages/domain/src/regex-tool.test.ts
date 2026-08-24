import { describe, expect, it } from 'vitest';

import {
  validateCuratedDataset,
  type CuratedDataset,
  type Provenance
} from './dataset';
import { generateRegexPreview } from './regex-tool';

const provenance = {
  source: {
    name: 'Path of Exile Wiki',
    url: 'https://www.poewiki.net/wiki/Beach_Map'
  },
  gameVersion: '3.29',
  verification: 'reviewed',
  license: {
    name: 'CC BY-NC-SA 3.0',
    url: 'https://www.poewiki.net/wiki/Path_of_Exile_Wiki:Copyrights'
  },
  updatedAt: '2026-08-25T00:00:00.000Z'
} as const satisfies Provenance;

const validDataset = {
  id: 'poe1-maps',
  version: '2026.08.25',
  category: 'map',
  coverage: 'Reviewed map base types included in the beta.',
  entries: [
    {
      id: 'beach-map',
      category: 'map',
      name: 'Beach Map',
      provenance
    }
  ]
} as const satisfies CuratedDataset;

describe('validateCuratedDataset', () => {
  it('accepts a versioned map Dataset with complete Provenance', () => {
    const result = validateCuratedDataset(validDataset);

    expect(result).toEqual({ valid: true, dataset: validDataset });
  });

  it.each([
    {
      name: 'missing provenance',
      dataset: {
        ...validDataset,
        entries: [{ id: 'beach-map', category: 'map', name: 'Beach Map' }]
      },
      issue: 'entries[0].provenance must be an object'
    },
    {
      name: 'duplicate identifiers',
      dataset: {
        ...validDataset,
        entries: [...validDataset.entries, { ...validDataset.entries[0] }]
      },
      issue: 'entries contains duplicate id "beach-map"'
    },
    {
      name: 'unsupported category',
      dataset: { ...validDataset, category: 'map-modifier' },
      issue: 'category must be "map"'
    },
    {
      name: 'malformed entry data',
      dataset: {
        ...validDataset,
        entries: [{ ...validDataset.entries[0], name: '' }]
      },
      issue: 'entries[0].name must be a non-empty string'
    },
    {
      name: 'a parseable non-ISO update time',
      dataset: {
        ...validDataset,
        entries: [
          {
            ...validDataset.entries[0],
            provenance: { ...provenance, updatedAt: '1' }
          }
        ]
      },
      issue: 'entries[0].provenance.updatedAt must be an ISO date-time string'
    },
    {
      name: 'an impossible ISO-shaped update time',
      dataset: {
        ...validDataset,
        entries: [
          {
            ...validDataset.entries[0],
            provenance: {
              ...provenance,
              updatedAt: '2026-02-30T00:00:00.000Z'
            }
          }
        ]
      },
      issue: 'entries[0].provenance.updatedAt must be an ISO date-time string'
    }
  ])('rejects $name', ({ dataset, issue }) => {
    const result = validateCuratedDataset(dataset);

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues).toContain(issue);
    }
  });
});

describe('generateRegexPreview', () => {
  it('escapes metacharacters, ignores duplicate selections, and previews matches', () => {
    const dataset = {
      ...validDataset,
      entries: [
        ...validDataset.entries,
        {
          id: 'museum-replica-map',
          category: 'map',
          name: 'Museum (Replica) Map',
          provenance
        },
        {
          id: 'dunes-map',
          category: 'map',
          name: 'Dunes Map',
          provenance
        }
      ]
    } as const;

    const result = generateRegexPreview(dataset, [
      'museum-replica-map',
      'beach-map',
      'beach-map'
    ]);

    expect(result).toEqual({
      status: 'ready',
      regex: '^(?:Museum \\(Replica\\) Map|Beach Map)$',
      selectedIds: ['museum-replica-map', 'beach-map'],
      matched: ['beach-map', 'museum-replica-map'],
      unmatched: ['dunes-map']
    });
  });

  it('guides an empty Selection without producing a regex', () => {
    expect(generateRegexPreview(validDataset, [])).toEqual({
      status: 'empty',
      message: 'Select at least one map to generate a regex.'
    });
  });

  it('rejects Selection identifiers outside the active Dataset', () => {
    expect(generateRegexPreview(validDataset, ['unknown-map'])).toEqual({
      status: 'invalid',
      message:
        'Selection includes maps that are not in this Dataset: unknown-map.'
    });
  });
});
