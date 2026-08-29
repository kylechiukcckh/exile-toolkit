import { describe, expect, it } from 'vitest';

import {
  calculateDustPerGold,
  createDisenchantTradeUrl,
  disenchantLowStockThreshold,
  estimateDisenchantGoldFee
} from './disenchant-analysis';

describe('Disenchant secondary analysis', () => {
  it('estimates the compatible gold fee from reviewed Dust assumptions', () => {
    expect(estimateDisenchantGoldFee({ baseDust: 1128.89, quality: 0 })).toBe(
      47_280
    );
    expect(estimateDisenchantGoldFee({ baseDust: 768.72, quality: 20 })).toBe(
      39_780
    );
  });

  it('returns no gold analysis for invalid inputs', () => {
    expect(
      estimateDisenchantGoldFee({ baseDust: 0, quality: 20 })
    ).toBeUndefined();
    expect(calculateDustPerGold(10_000, 0)).toBeUndefined();
    expect(calculateDustPerGold(10_000, 2_000)).toBe(5);
  });

  it('uses the fixed low-stock threshold', () => {
    expect(disenchantLowStockThreshold).toBe(150);
  });

  it('builds an exact available-listing Trade search without a price cap', () => {
    const url = createDisenchantTradeUrl({
      league: 'Allflame',
      name: "Rakiata's Dance",
      baseType: 'Engraved Greatsword'
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
          misc_filters: { filters: { ilvl: { min: number } } };
        };
      };
    };
    expect(pathname).toBe('https://www.pathofexile.com/trade/search/Allflame');
    expect(payload.query.status.option).toBe('online');
    expect(payload.query.name).toBe("Rakiata's Dance");
    expect(payload.query.type).toBe('Engraved Greatsword');
    expect(payload.query.filters.misc_filters.filters.ilvl.min).toBe(84);
    expect(payload.query.filters).not.toHaveProperty('trade_filters');
    expect(JSON.stringify(payload)).not.toContain('corrupted');
  });
});
