import { describe, expect, it } from 'vitest';

import {
  calculateDustPerTotalCost,
  calculateDustPerGold,
  createDisenchantTradeUrl,
  disenchantLowStockThreshold,
  estimateDisenchantGoldFee
} from './disenchant-analysis';

describe('Disenchant secondary analysis', () => {
  it('estimates the compatible gold fee from reviewed Dust assumptions', () => {
    expect(
      estimateDisenchantGoldFee({
        baseDust: 1128.89,
        quality: 0,
        influenceCount: 0
      })
    ).toBe(47_280);
    expect(
      estimateDisenchantGoldFee({
        baseDust: 768.72,
        quality: 20,
        influenceCount: 1
      })
    ).toBe(75_582);
  });

  it('returns no gold analysis for invalid inputs', () => {
    expect(
      estimateDisenchantGoldFee({
        baseDust: 0,
        quality: 20,
        influenceCount: 0
      })
    ).toBeUndefined();
    expect(calculateDustPerGold(10_000, 0)).toBeUndefined();
    expect(calculateDustPerGold(10_000, 2_000)).toBe(5);
  });

  it('calculates Total Cost from acquisition, catalyst, and Gold valuation', () => {
    expect(
      calculateDustPerTotalCost({
        dustValue: 100_000,
        itemChaosCost: 10,
        catalystChaosCost: 20,
        estimatedGoldFee: 50_000,
        goldValueChaosPer10k: 2
      })
    ).toBe(2_500);
    expect(
      calculateDustPerTotalCost({
        dustValue: 100_000,
        itemChaosCost: Number.NaN,
        catalystChaosCost: 0,
        estimatedGoldFee: 50_000,
        goldValueChaosPer10k: 2
      })
    ).toBeUndefined();
  });

  it('uses the fixed low-stock threshold', () => {
    expect(disenchantLowStockThreshold).toBe(150);
  });

  it('builds an adjustable Trade search without a price cap', () => {
    const url = createDisenchantTradeUrl({
      league: 'Allflame',
      name: "Rakiata's Dance",
      baseType: 'Engraved Greatsword',
      minimumItemLevel: 84,
      minimumItemQuality: 12,
      includeCorrupted: false,
      onlineStatus: 'any',
      listingTime: '1day'
    });

    expect(url).toBeDefined();
    const [pathname, queryString] = (url as string).split('?');
    const encodedPayload = queryString?.replace(/^q=/, '');
    const payload = JSON.parse(decodeURIComponent(encodedPayload ?? '{}')) as {
      query: {
        status: { option: string };
        name: string;
        type: string;
        filters: {
          misc_filters: {
            filters: {
              ilvl: { min: number };
              quality: { min: number };
              corrupted: { option: string };
            };
          };
          trade_filters: {
            filters: {
              indexed: { option: string };
              price?: unknown;
            };
          };
        };
      };
    };
    expect(pathname).toBe('https://www.pathofexile.com/trade/search/Allflame');
    expect(payload.query.status.option).toBe('any');
    expect(payload.query.name).toBe("Rakiata's Dance");
    expect(payload.query.type).toBe('Engraved Greatsword');
    expect(payload.query.filters.misc_filters.filters.ilvl.min).toBe(84);
    expect(payload.query.filters.misc_filters.filters.quality.min).toBe(12);
    expect(payload.query.filters.misc_filters.filters.corrupted.option).toBe(
      'false'
    );
    expect(payload.query.filters.trade_filters.filters.indexed.option).toBe(
      '1day'
    );
    expect(payload.query.filters.trade_filters.filters).not.toHaveProperty(
      'price'
    );
  });
});
