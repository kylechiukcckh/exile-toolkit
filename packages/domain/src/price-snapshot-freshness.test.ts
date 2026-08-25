import { describe, expect, it } from 'vitest';

import { priceSnapshotFreshness } from './price-snapshot-freshness';

describe('priceSnapshotFreshness', () => {
  const retrievedAt = new Date('2026-08-25T00:00:00.000Z').getTime();

  it('keeps a complete snapshot Fresh for one hour and Stale through 24 hours', () => {
    expect(priceSnapshotFreshness(retrievedAt, retrievedAt + 59 * 60_000)).toBe(
      'fresh'
    );
    expect(priceSnapshotFreshness(retrievedAt, retrievedAt + 60 * 60_000)).toBe(
      'stale'
    );
    expect(
      priceSnapshotFreshness(retrievedAt, retrievedAt + 24 * 60 * 60_000)
    ).toBe('stale');
  });

  it('does not allow an expired snapshot to support a Ranking', () => {
    expect(
      priceSnapshotFreshness(retrievedAt, retrievedAt + 24 * 60 * 60_000 + 1)
    ).toBe('expired');
  });
});
