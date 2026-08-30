import { describe, expect, it } from 'vitest';

import { calculateDisenchantDust } from './disenchant-dataset';
import {
  dedupeCheapestVariants,
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
  it('uses the reference cheapest-variant and Foulborn deduplication rules', () => {
    const item = (
      id: number,
      name: string,
      chaosValue: number,
      listingCount: number,
      detailsId: string
    ) =>
      normalizePoeNinjaItem({
        id,
        name,
        baseType: 'Test Base',
        category: 'weapon',
        chaosValue,
        listingCount,
        detailsId
      });

    const result = dedupeCheapestVariants([
      item(1, 'Relic', 12, 4, 'relic-standard'),
      item(2, 'Relic', 8, 2, 'relic-6l'),
      item(3, 'Relic', 10, 3, 'relic-standard-alt'),
      item(4, 'Foulborn Reefbane', 5, 2, 'foulborn-reefbane'),
      item(5, 'Reefbane', 10, 6, 'reefbane')
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      name: 'Relic',
      chaosValue: 10,
      listingCount: 7
    });
    expect(result[1]).toMatchObject({
      name: 'Reefbane',
      chaosValue: 5,
      listingCount: 8
    });
  });

  it('merges variants when their Dust value and Trade target are identical', () => {
    const candidate = {
      id: 'rakiatas-dance--engraved-greatsword',
      name: "Rakiata's Dance",
      baseType: 'Engraved Greatsword',
      category: 'weapon' as const,
      baseDust: 100,
      influenceCount: 0,
      dustValue: 30_000,
      itemLevel: 84,
      quality: 20 as const,
      provenance
    };
    const prices = [
      normalizePoeNinjaItem({
        id: 1,
        name: candidate.name,
        baseType: candidate.baseType,
        category: candidate.category,
        variant: 'Resolute Technique',
        chaosValue: 12,
        listingCount: 20,
        detailsId: 'rakiatas-dance-resolute-technique'
      }),
      normalizePoeNinjaItem({
        id: 2,
        name: candidate.name,
        baseType: candidate.baseType,
        category: candidate.category,
        variant: 'Precise Technique',
        chaosValue: 8,
        listingCount: 7,
        detailsId: 'rakiatas-dance-precise-technique'
      }),
      normalizePoeNinjaItem({
        id: 3,
        name: candidate.name,
        baseType: candidate.baseType,
        category: candidate.category,
        chaosValue: 10,
        listingCount: 30,
        detailsId: 'rakiatas-dance'
      }),
      normalizePoeNinjaItem({
        id: 4,
        name: candidate.name,
        baseType: candidate.baseType,
        category: candidate.category,
        variant: 'Precise Technique',
        chaosValue: 9,
        listingCount: 100,
        detailsId: 'rakiatas-dance-precise-technique-expensive'
      })
    ];

    const result = joinDisenchantCandidates([candidate], prices);

    expect(result.ranked).toHaveLength(1);
    expect(result.ranked[0]?.price.chaosValue).toBe(8);
    expect(result.ranked[0]?.dustPerChaos).toBe(3750);
  });

  it('joins by unique name when the current market base type has changed', () => {
    const candidate = {
      id: 'the-poets-pen--carved-wand',
      name: "The Poet's Pen",
      baseType: 'Carved Wand',
      category: 'weapon' as const,
      baseDust: 100,
      influenceCount: 0,
      dustValue: 30_000,
      itemLevel: 84,
      quality: 20 as const,
      provenance
    };
    const price = normalizePoeNinjaItem({
      id: 1,
      name: candidate.name,
      baseType: 'Somatic Wand',
      category: candidate.category,
      chaosValue: 10,
      listingCount: 20,
      detailsId: 'the-poets-pen-somatic-wand'
    });

    const result = joinDisenchantCandidates([candidate], [price]);

    expect(result.ranked).toHaveLength(1);
    expect(result.unpriced).toEqual([]);
    expect(result.dustUnavailable).toEqual([]);
    expect(result.ranked[0]).toMatchObject({
      name: candidate.name,
      variant: 'Somatic Wand',
      price
    });
  });

  it('uses the cheapest price variant when ranking a candidate', () => {
    const candidates = [
      {
        id: 'relic--iron-ring',
        name: 'Relic',
        baseType: 'Iron Ring',
        category: 'accessory' as const,
        baseDust: 100,
        influenceCount: 0,
        dustValue: 10_000,
        itemLevel: 84,
        quality: 0 as const,
        provenance
      },
      {
        id: 'other--iron-ring',
        name: 'Other',
        baseType: 'Iron Ring',
        category: 'accessory' as const,
        baseDust: 50,
        influenceCount: 0,
        dustValue: 5_000,
        itemLevel: 84,
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

    expect(result.ranked.map(row => row.variant)).toEqual(['Iron Ring']);
    expect(result.ranked.map(row => row.dustPerChaos)).toEqual([2000]);
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
          influenceCount: 0,
          dustValue: 10_000,
          itemLevel: 84,
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

  it('accepts catalyst pricing as part of the complete market snapshot', () => {
    const result = validatePriceSnapshot({
      activeLeague: 'Allflame',
      source: 'poe.ninja',
      retrievedAt: '2026-08-25T00:00:00.000Z',
      divineToChaos: 150,
      catalystToChaos: 2,
      categories: { weapon: [], armour: [], accessory: [] }
    });

    expect(result).toMatchObject({
      valid: true,
      snapshot: { catalystToChaos: 2 }
    });
  });

  it('recommends catalysts only when q20 improves accessory efficiency', () => {
    const accessory = {
      id: 'relic--iron-ring',
      name: 'Relic',
      baseType: 'Iron Ring',
      category: 'accessory' as const,
      baseDust: 100,
      influenceCount: 0,
      dustValue: calculateDisenchantDust(100, 84, 20),
      itemLevel: 84,
      quality: 20 as const,
      provenance
    };
    const [price] = [
      normalizePoeNinjaItem({
        id: 1,
        name: 'Relic',
        baseType: 'Iron Ring',
        chaosValue: 100,
        listingCount: 10,
        detailsId: 'relic'
      })
    ];

    const cheapCatalyst = joinDisenchantCandidates([accessory], [price!], {
      catalystToChaos: 1
    }).ranked[0];
    const costlyCatalyst = joinDisenchantCandidates([accessory], [price!], {
      catalystToChaos: 10
    }).ranked[0];

    expect(cheapCatalyst).toMatchObject({
      quality: 20,
      shouldCatalyst: true,
      catalystChaosCost: 20
    });
    expect(costlyCatalyst).toMatchObject({
      quality: 0,
      shouldCatalyst: false,
      catalystChaosCost: 0
    });
  });
});
