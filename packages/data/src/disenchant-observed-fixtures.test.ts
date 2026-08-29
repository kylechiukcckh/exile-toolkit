import { calculateDisenchantDust } from '@exile-toolkit/domain';
import { describe, expect, it } from 'vitest';

import { disenchantDataset } from './disenchant-dataset';
import { observedDisenchantFixtures } from './fixtures/disenchant-observed-fixtures';

describe('observed Disenchant fixtures', () => {
  it('covers ilvl 85 q20 weapons and armour, both jewellery paths, and q0 armour', () => {
    expect(
      observedDisenchantFixtures.map(fixture =>
        [fixture.category, fixture.quality].join(':')
      )
    ).toEqual([
      'accessory:0',
      'accessory:20',
      'weapon:20',
      'armour:20',
      'armour:0'
    ]);
  });

  it.each(observedDisenchantFixtures)(
    'matches the observed ilvl 85 $quality% value for $name',
    fixture => {
      const candidate = disenchantDataset.entries.find(
        entry =>
          entry.name === fixture.name && entry.baseType === fixture.baseType
      );
      if (!candidate) throw new Error(`${fixture.name} fixture is missing`);

      expect(
        calculateDisenchantDust(
          candidate.baseDust,
          fixture.itemLevel,
          fixture.quality
        )
      ).toBe(fixture.observedDustValue);
      expect(fixture.observedDustValue).not.toBe(
        fixture.referenceItemLevel84DustValue
      );

      if (candidate.quality === fixture.quality) {
        expect(candidate.dustValue).toBe(fixture.observedDustValue);
      }
    }
  );
});
