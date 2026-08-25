import { describe, expect, it } from 'vitest';

import {
  joinDisenchantCandidates,
  normalizePoeNinjaItem,
  validatePriceSnapshot
} from './disenchant-pricing';

const provenance = {
  source: { name: 'Source', url: 'https://example.com/source' },
  gameVersion: '1',
  verification: 'reviewed' as const,
  license: { name: 'MIT', url: 'https://example.com/license' },
  updatedAt: '2026-08-25T00:00:00.000Z'
};

describe('Disenchant price ranking', () => {
  it('keeps poe.ninja variants separate and ranks priced candidates by Dust per Chaos', () => {
    const candidates = [
      {
        id: 'relic--iron-ring',
        name: 'Relic',
        baseType: 'Iron Ring',
        category: 'accessory' as const,
        baseDust: 100,
        dustValue: 10_000,
        itemLevel: 85 as const,
        quality: 0 as const,
        provenance
      },
      {
        id: 'other--iron-ring',
        name: 'Other',
        baseType: 'Iron Ring',
        category: 'accessory' as const,
        baseDust: 50,
        dustValue: 5_000,
        itemLevel: 85 as const,
        quality: 0 as const,
        provenance
      }
    ];
    const prices = [
      normalizePoeNinjaItem({
        id: 1,
        name: 'Relic',
        baseType: 'Iron Ring',
        variant: 'Cold',
        chaosValue: 10,
        listingCount: 12,
        detailsId: 'relic-cold',
        icon: 'https://web.poecdn.com/relic.png'
      }),
      normalizePoeNinjaItem({
        id: 2,
        name: 'Relic',
        baseType: 'Iron Ring',
        variant: 'Fire',
        chaosValue: 5,
        listingCount: 6,
        detailsId: 'relic-fire',
        icon: 'https://web.poecdn.com/relic.png'
      }),
      normalizePoeNinjaItem({
        id: 3,
        name: 'No Dust',
        baseType: 'Gold Ring',
        chaosValue: 3,
        listingCount: 9,
        detailsId: 'no-dust-gold-ring'
      })
    ];

    const result = joinDisenchantCandidates(candidates, prices);

    expect(result.ranked.map(row => row.variant)).toEqual(['Fire', 'Cold']);
    expect(result.ranked.map(row => row.dustPerChaos)).toEqual([2000, 1000]);
    expect(result.unpriced.map(row => row.name)).toEqual(['Other']);
    expect(result.dustUnavailable.map(row => row.name)).toEqual(['No Dust']);
  });

  it('treats missing and non-positive prices as unpriced, never free', () => {
    const prices = [
      normalizePoeNinjaItem({
        id: 1,
        name: 'Relic',
        baseType: 'Iron Ring',
        chaosValue: 0,
        listingCount: 1,
        detailsId: 'relic'
      })
    ];
    const result = joinDisenchantCandidates(
      [
        {
          id: 'relic--iron-ring',
          name: 'Relic',
          baseType: 'Iron Ring',
          category: 'accessory',
          baseDust: 100,
          dustValue: 10_000,
          itemLevel: 85,
          quality: 0,
          provenance
        }
      ],
      prices
    );

    expect(result.ranked).toEqual([]);
    expect(result.unpriced).toHaveLength(1);
  });

  it('keeps only official CDN icons when normalizing poe.ninja items', () => {
    expect(
      normalizePoeNinjaItem({
        id: 1,
        name: 'Relic',
        baseType: 'Iron Ring',
        chaosValue: 10,
        detailsId: 'relic',
        icon: 'https://example.com/relic.png'
      }).iconUrl
    ).toBeUndefined();
  });

  it('rejects a snapshot without every required category or a Divine rate', () => {
    expect(
      validatePriceSnapshot({
        activeLeague: 'Allflame',
        source: 'poe.ninja',
        retrievedAt: '2026-08-25T00:00:00.000Z',
        divineToChaos: 0,
        categories: { weapon: [] }
      })
    ).toEqual({ valid: false, issues: expect.any(Array) });
  });
});
