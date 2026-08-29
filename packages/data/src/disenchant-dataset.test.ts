import {
  calculateDisenchantDust,
  validateDisenchantDataset
} from '@exile-toolkit/domain';
import { describe, expect, it } from 'vitest';

import { disenchantDataset } from './disenchant-dataset';

describe('disenchantDataset', () => {
  it('ships the reference item-level 84 Dust values with influence and quality assumptions', () => {
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
    const starforge = disenchantDataset.entries.find(
      entry => entry.name === 'Starforge'
    );
    const voidforge = disenchantDataset.entries.find(
      entry => entry.name === 'Voidforge'
    );

    expect(originalSin).toMatchObject({
      category: 'accessory',
      itemLevel: 84,
      quality: 20,
      influenceCount: 0,
      dustValue: 3951115,
      upstreamReference: 'https://poedb.tw/us/Original_Sin'
    });
    expect(reefbane).toMatchObject({
      category: 'weapon',
      itemLevel: 84,
      quality: 20,
      influenceCount: 0,
      dustValue: 2979340
    });
    expect(squire).toMatchObject({
      category: 'armour',
      itemLevel: 84,
      quality: 20,
      influenceCount: 0,
      dustValue: 2690520
    });
    expect(skinOfTheLords).toMatchObject({
      category: 'armour',
      itemLevel: 84,
      quality: 0,
      influenceCount: 0,
      dustValue: 33150
    });
    expect(starforge).toMatchObject({
      itemLevel: 84,
      quality: 20,
      influenceCount: 1,
      dustValue: 3341578
    });
    expect(voidforge).toMatchObject({
      itemLevel: 84,
      quality: 20,
      influenceCount: 2,
      dustValue: 4220940
    });
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
          dustValue: calculateDisenchantDust(1, 84, 0),
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
