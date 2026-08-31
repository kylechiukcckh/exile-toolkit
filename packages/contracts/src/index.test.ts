import { describe, expect, it } from 'vitest';

import {
  isEconomyPriceSnapshotResponse,
  type EconomyPriceSnapshotResponse
} from './index';

const completeResponse: EconomyPriceSnapshotResponse = {
  snapshot: {
    schemaVersion: 3,
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
  },
  dustDatasetVersion: '2026.08.31'
};

describe('economy price snapshot contract', () => {
  it('accepts one complete shared response', () => {
    expect(isEconomyPriceSnapshotResponse(completeResponse)).toBe(true);
  });

  it('rejects an old incomplete Price snapshot response', () => {
    const oldSnapshot = {
      ...completeResponse.snapshot
    } as Record<string, unknown>;
    delete oldSnapshot.schemaVersion;
    delete oldSnapshot.lifeforcePrices;

    expect(
      isEconomyPriceSnapshotResponse({
        ...completeResponse,
        snapshot: oldSnapshot
      })
    ).toBe(false);
  });

  it('rejects a partial shared response without changing item categories', () => {
    expect(
      isEconomyPriceSnapshotResponse({
        ...completeResponse,
        snapshot: {
          ...completeResponse.snapshot,
          lifeforcePrices: {
            yellow: { chaosPerLifeforce: 0.03 },
            blue: { chaosPerLifeforce: 0.04 }
          }
        }
      })
    ).toBe(false);
    expect(completeResponse.snapshot.categories).toEqual({
      weapon: [],
      armour: [],
      accessory: []
    });
  });
});
