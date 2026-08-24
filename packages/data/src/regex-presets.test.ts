import { describe, expect, it } from 'vitest';

import { regexPresets } from './regex-presets';

describe('regexPresets', () => {
  it('provides stable reviewed presets for both active categories', () => {
    expect(regexPresets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'starter-atlas-maps',
          category: 'map',
          verification: 'reviewed'
        }),
        expect.objectContaining({
          id: 'player-penalty-modifiers',
          category: 'map-modifier',
          verification: 'reviewed'
        })
      ])
    );
    expect(
      regexPresets.every(
        preset => preset.description.length > 0 && preset.entryIds.length > 0
      )
    ).toBe(true);
  });
});
