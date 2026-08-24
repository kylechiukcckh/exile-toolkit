import { describe, expect, it } from 'vitest';

import { sanitizeLocalRegexState } from './regex-presets';

describe('sanitizeLocalRegexState', () => {
  it('keeps valid local presets and Custom entries', () => {
    expect(
      sanitizeLocalRegexState(
        {
          presets: [
            {
              id: 'local-1',
              name: 'My maps',
              category: 'map',
              entryIds: ['beach-map']
            }
          ],
          customEntries: [{ id: 'custom-1', name: 'My [Map]', category: 'map' }]
        },
        { map: [{ id: 'beach-map', name: 'Beach Map' }], 'map-modifier': [] }
      )
    ).toEqual({
      state: {
        presets: [
          {
            id: 'local-1',
            name: 'My maps',
            category: 'map',
            entryIds: ['beach-map']
          }
        ],
        customEntries: [{ id: 'custom-1', name: 'My [Map]', category: 'map' }]
      },
      issues: []
    });
  });

  it('reports and removes malformed and outdated entries', () => {
    const result = sanitizeLocalRegexState(
      {
        presets: [
          {
            id: 'local-1',
            name: 'Old maps',
            category: 'map',
            entryIds: ['removed-map', 'beach-map']
          },
          { id: '', name: 'Broken', category: 'map', entryIds: [] }
        ],
        customEntries: [{ id: 'bad', name: '', category: 'map' }]
      },
      { map: [{ id: 'beach-map', name: 'Beach Map' }], 'map-modifier': [] }
    );

    expect(result.state.presets).toEqual([
      {
        id: 'local-1',
        name: 'Old maps',
        category: 'map',
        entryIds: ['beach-map']
      }
    ]);
    expect(result.state.customEntries).toEqual([]);
    expect(result.issues).toEqual([
      'Preset "Old maps" ignored unavailable entry "removed-map".',
      'Ignored an invalid local preset.',
      'Ignored an invalid Custom entry.'
    ]);
  });

  it('rejects duplicate identifiers, duplicate names, and oversized local data', () => {
    const entries = Array.from({ length: 205 }, (_, index) => ({
      id: `custom-${index}`,
      name: index === 1 ? 'Beach Map' : `Custom ${index}`,
      category: 'map'
    }));
    entries[2] = { id: 'custom-0', name: 'Custom 2', category: 'map' };

    const result = sanitizeLocalRegexState(
      { presets: [], customEntries: entries },
      { map: [{ id: 'beach-map', name: 'Beach Map' }], 'map-modifier': [] }
    );

    expect(result.state.customEntries).toHaveLength(200);
    expect(result.state.customEntries).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Beach Map' }),
        expect.objectContaining({ id: 'custom-0', name: 'Custom 2' })
      ])
    );
    expect(result.issues).toEqual(
      expect.arrayContaining([
        'Ignored a Custom entry whose name duplicates an active category entry.',
        'Ignored a Custom entry with a duplicate identifier.',
        'Ignored Custom entries beyond the 200-entry limit.'
      ])
    );
  });
});
