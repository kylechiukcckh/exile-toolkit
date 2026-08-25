import {
  calculateDisenchantDust,
  validateDisenchantDataset
} from '@exile-toolkit/domain';
import { describe, expect, it } from 'vitest';

import { disenchantDataset } from './disenchant-dataset';

describe('disenchantDataset', () => {
  it('ships reviewed item-level 85 Dust values with the required quality assumptions', () => {
    expect(validateDisenchantDataset(disenchantDataset)).toEqual({
      valid: true,
      dataset: disenchantDataset
    });

    const originalSin = disenchantDataset.entries.find(
      entry => entry.name === 'Original Sin'
    );
    const reefbane = disenchantDataset.entries.find(
      entry => entry.name === 'Reefbane'
    );
    const squire = disenchantDataset.entries.find(
      entry => entry.name === 'The Squire'
    );
    const skinOfTheLords = disenchantDataset.entries.find(
      entry => entry.name === 'Skin of the Lords'
    );

    expect(originalSin).toMatchObject({
      category: 'accessory',
      itemLevel: 85,
      quality: 0,
      dustValue: 2963336,
      upstreamReference: 'https://poedb.tw/us/Original_Sin'
    });
    expect(reefbane).toMatchObject({
      category: 'weapon',
      itemLevel: 85,
      quality: 20,
      dustValue: 3128307
    });
    expect(squire).toMatchObject({
      category: 'armour',
      itemLevel: 85,
      quality: 20,
      dustValue: 2825046
    });
    expect(skinOfTheLords).toMatchObject({
      category: 'armour',
      itemLevel: 85,
      quality: 0,
      dustValue: 34808
    });
    expect(reefbane?.dustValue).not.toBe(2979340);
  });

  it('rejects malformed Dust records instead of publishing partial data', () => {
    const originalSin = disenchantDataset.entries.find(
      entry => entry.name === 'Original Sin'
    );
    if (!originalSin) throw new Error('Original Sin fixture is missing');

    const invalidDataset = {
      ...disenchantDataset,
      entries: [
        originalSin,
        {
          ...originalSin,
          category: 'jewel',
          baseDust: 0,
          dustValue: calculateDisenchantDust(1, 85, 0),
          provenance: { ...originalSin.provenance, updatedAt: 'not-a-date' }
        },
        originalSin
      ]
    };

    expect(validateDisenchantDataset(invalidDataset)).toMatchObject({
      valid: false,
      issues: expect.arrayContaining([
        'entries[1].category must be weapon, armour, or accessory',
        'entries[1].baseDust must be a positive number',
        'entries[1].provenance.updatedAt must be an ISO date-time string',
        `entries contains duplicate id "${originalSin.id}"`
      ])
    });
  });
});
