import { describe, expect, it } from 'vitest';

import {
  economySnapshotSchemaVersion,
  normalizeLifeforcePrices,
  validateEconomyPriceSnapshot
} from './economy-pricing';

const completeCurrencyResponse = {
  core: {
    primary: 'chaos',
    rates: { divine: 1 / 120 }
  },
  lines: [
    { id: 'vivid-lifeforce', primaryValue: 0.03 },
    { id: 'primal-lifeforce', primaryValue: 0.04 },
    { id: 'wild-lifeforce', primaryValue: 0.05 }
  ]
};

describe('workspace economy pricing', () => {
  it('maps poe.ninja Lifeforce ids to explicit Chaos-per-Lifeforce prices', () => {
    expect(normalizeLifeforcePrices(completeCurrencyResponse)).toEqual({
      valid: true,
      prices: {
        yellow: { chaosPerLifeforce: 0.03 },
        blue: { chaosPerLifeforce: 0.04 },
        purple: { chaosPerLifeforce: 0.05 }
      }
    });
  });

  it.each([
    ['a missing required id', completeCurrencyResponse.lines.slice(1)],
    [
      'a duplicate required id',
      [...completeCurrencyResponse.lines, completeCurrencyResponse.lines[0]]
    ],
    [
      'a nonpositive value',
      completeCurrencyResponse.lines.map(line =>
        line.id === 'primal-lifeforce' ? { ...line, primaryValue: 0 } : line
      )
    ],
    [
      'a nonfinite value',
      completeCurrencyResponse.lines.map(line =>
        line.id === 'wild-lifeforce'
          ? { ...line, primaryValue: Number.NaN }
          : line
      )
    ]
  ])('rejects %s', (_label, lines) => {
    expect(
      normalizeLifeforcePrices({ ...completeCurrencyResponse, lines })
    ).toMatchObject({ valid: false });
  });

  it('rejects prices when the response quote currency is not Chaos', () => {
    expect(
      normalizeLifeforcePrices({
        ...completeCurrencyResponse,
        core: { ...completeCurrencyResponse.core, primary: 'divine' }
      })
    ).toMatchObject({ valid: false });
  });

  it('accepts a complete versioned economy snapshot with Disenchant data intact', () => {
    const result = validateEconomyPriceSnapshot({
      schemaVersion: economySnapshotSchemaVersion,
      activeLeague: 'Allflame',
      source: 'poe.ninja',
      retrievedAt: '2026-08-31T00:00:00.000Z',
      divineToChaos: 120,
      catalystToChaos: 1.5,
      lifeforcePrices: {
        yellow: { chaosPerLifeforce: 0.03 },
        blue: { chaosPerLifeforce: 0.04 },
        purple: { chaosPerLifeforce: 0.05 }
      },
      categories: { weapon: [], armour: [], accessory: [] }
    });

    expect(result).toMatchObject({
      valid: true,
      snapshot: {
        schemaVersion: economySnapshotSchemaVersion,
        divineToChaos: 120,
        catalystToChaos: 1.5,
        categories: { weapon: [], armour: [], accessory: [] }
      }
    });
  });

  it('rejects an older or incomplete economy snapshot', () => {
    expect(
      validateEconomyPriceSnapshot({
        schemaVersion: economySnapshotSchemaVersion - 1,
        activeLeague: 'Allflame',
        source: 'poe.ninja',
        retrievedAt: '2026-08-31T00:00:00.000Z',
        divineToChaos: 120,
        categories: { weapon: [], armour: [], accessory: [] }
      })
    ).toMatchObject({ valid: false });
  });
});
