import { describe, expect, it } from 'vitest';

import {
  validateCuratedDataset,
  type CuratedDataset,
  type Provenance
} from './dataset';
import { generateRegexPreview, type RegexPart } from './regex-tool';

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
      dataset: { ...validDataset, category: 'scarab' },
      issue: 'category must be "map" or "map-modifier"'
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

  it('accepts a grouped map-modifier Dataset', () => {
    const modifierDataset = {
      ...validDataset,
      id: 'poe1-map-modifiers',
      category: 'map-modifier',
      entries: [
        {
          ...validDataset.entries[0],
          id: 'cannot-regenerate',
          category: 'map-modifier',
          name: 'Players cannot Regenerate Life, Mana or Energy Shield',
          group: 'Recovery'
        }
      ]
    };

    expect(validateCuratedDataset(modifierDataset)).toEqual({
      valid: true,
      dataset: modifierDataset
    });
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
      parts: [
        {
          id: 'part-1',
          regex: '^(?:Museum \\(Replica\\) Map|Beach Map)$',
          characterCount: 38
        }
      ],
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

  it('uses the shared generation behavior for map modifiers', () => {
    const modifierDataset = {
      ...validDataset,
      id: 'poe1-map-modifiers',
      category: 'map-modifier',
      entries: [
        {
          ...validDataset.entries[0],
          id: 'cannot-be-stunned',
          category: 'map-modifier',
          name: 'Monsters cannot be Stunned',
          group: 'Monster defenses'
        }
      ]
    } as const satisfies CuratedDataset;

    expect(generateRegexPreview(modifierDataset, [])).toEqual({
      status: 'empty',
      message: 'Select at least one modifier to generate a regex.'
    });
    expect(
      generateRegexPreview(modifierDataset, ['cannot-be-stunned'])
    ).toEqual({
      status: 'ready',
      parts: [
        {
          id: 'part-1',
          regex: '^(?:Monsters cannot be Stunned)$',
          characterCount: 32
        }
      ],
      selectedIds: ['cannot-be-stunned'],
      matched: ['cannot-be-stunned'],
      unmatched: []
    });
  });
});

describe('length-limited Generated regex', () => {
  const dataset = {
    ...validDataset,
    entries: [
      { ...validDataset.entries[0], id: 'alpha', name: 'Alpha [Map]' },
      { ...validDataset.entries[0], id: 'alpine', name: 'Alpine Map' },
      { ...validDataset.entries[0], id: 'beta', name: 'Beta (Map)' },
      { ...validDataset.entries[0], id: 'unicode', name: '雪原 Map' }
    ]
  } as const satisfies CuratedDataset;

  it('keeps an exact regex at the configured boundary', () => {
    const exact = '^(?:Beta \\(Map\\))$';
    const result = generateRegexPreview(dataset, ['beta'], {
      lengthLimit: Array.from(exact).length
    });

    expect(result.status).toBe('ready');
    if (result.status === 'ready') {
      expect(result.parts).toEqual<RegexPart[]>([
        { id: 'part-1', regex: exact, characterCount: 18 }
      ]);
    }
  });

  it('shortens metacharacters and Unicode only when the Match preview stays exact', () => {
    const result = generateRegexPreview(dataset, ['alpha', 'unicode'], {
      lengthLimit: 9
    });

    expect(result.status).toBe('ready');
    if (result.status === 'ready') {
      expect(result.parts).toEqual([
        { id: 'part-1', regex: '(?:h|雪)', characterCount: 7 }
      ]);
      expect(result.matched).toEqual(['alpha', 'unicode']);
      expect(result.unmatched).toEqual(['alpine', 'beta']);
    }
  });

  it('splits deterministically into parts within the limit', () => {
    const first = generateRegexPreview(dataset, ['alpha', 'alpine', 'beta'], {
      lengthLimit: 5
    });
    const second = generateRegexPreview(dataset, ['alpha', 'alpine', 'beta'], {
      lengthLimit: 5
    });

    expect(first).toEqual(second);
    expect(first.status).toBe('ready');
    if (first.status === 'ready') {
      expect(first.parts.length).toBeGreaterThan(1);
      expect(first.parts.every(part => part.characterCount <= 5)).toBe(true);
      expect(first.matched).toEqual(['alpha', 'alpine', 'beta']);
      expect(first.unmatched).toEqual(['unicode']);
    }
  });

  it('reports an impossible constraint instead of widening the matches', () => {
    expect(
      generateRegexPreview(dataset, ['alpha'], { lengthLimit: 0 })
    ).toEqual({
      status: 'invalid',
      message: 'The 0-character limit cannot represent this Selection exactly.'
    });
  });

  it('applies the same escaping, splitting, and preview rules to Custom entries', () => {
    const result = generateRegexPreview(dataset, ['custom-one', 'custom-two'], {
      lengthLimit: 12,
      customEntries: [
        { id: 'custom-one', name: 'Custom [one]', category: 'map' },
        { id: 'custom-two', name: 'Custom 雪 two', category: 'map' }
      ]
    });

    expect(result.status).toBe('ready');
    if (result.status === 'ready') {
      expect(result.parts.every(part => part.characterCount <= 12)).toBe(true);
      expect(result.matched).toEqual(['custom-one', 'custom-two']);
      expect(result.unmatched).toEqual(['alpha', 'alpine', 'beta', 'unicode']);
    }
  });

  it('rejects ambiguous Custom names instead of matching an unselected entry', () => {
    expect(
      generateRegexPreview(dataset, ['custom-alpha'], {
        customEntries: [
          { id: 'custom-alpha', name: 'Alpha [Map]', category: 'map' }
        ]
      })
    ).toEqual({
      status: 'invalid',
      message:
        'Selection cannot be represented exactly because "Alpha [Map]" is duplicated.'
    });
  });
});
