const freshForMs = 60 * 60_000;
const usableForMs = 24 * 60 * 60_000;

export type PriceSnapshotFreshness = 'fresh' | 'stale' | 'expired';

export function priceSnapshotFreshness(
  retrievedAt: number,
  now: number
): PriceSnapshotFreshness {
  const age = Math.max(0, now - retrievedAt);
  if (age < freshForMs) return 'fresh';
  if (age <= usableForMs) return 'stale';
  return 'expired';
}
