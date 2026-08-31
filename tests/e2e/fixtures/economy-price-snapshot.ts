import type { EconomyPriceSnapshotResponse } from '@exile-toolkit/contracts';

export const economyPriceSnapshotFields = {
  schemaVersion: 3,
  lifeforcePrices: {
    yellow: { chaosPerLifeforce: 0.03 },
    blue: { chaosPerLifeforce: 0.04 },
    purple: { chaosPerLifeforce: 0.05 }
  }
} as const;

export function economyPriceSnapshotResponse(
  overrides: Partial<EconomyPriceSnapshotResponse['snapshot']> = {}
): EconomyPriceSnapshotResponse {
  return {
    dustDatasetVersion: '2026.08.25',
    snapshot: {
      ...economyPriceSnapshotFields,
      activeLeague: 'Allflame',
      source: 'poe.ninja',
      retrievedAt: new Date().toISOString(),
      divineToChaos: 120,
      categories: { weapon: [], armour: [], accessory: [] },
      ...overrides
    }
  };
}
