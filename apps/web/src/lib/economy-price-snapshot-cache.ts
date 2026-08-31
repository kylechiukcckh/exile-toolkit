import {
  isEconomyPriceSnapshotResponse,
  type EconomyPriceSnapshotResponse
} from '@exile-toolkit/contracts';
import type { WorkspaceLeague } from '@exile-toolkit/domain';

import {
  clearCachedPriceSnapshots,
  readCachedPriceSnapshot,
  writeCachedPriceSnapshot
} from './price-snapshot-cache';

const cacheKey = 'economy:v3';

export async function readEconomyPriceSnapshot(activeLeague: WorkspaceLeague) {
  const cached = await readCachedPriceSnapshot(cacheKeyFor(activeLeague));
  return isEconomyPriceSnapshotResponse(cached) &&
    cached.snapshot.activeLeague === activeLeague
    ? cached
    : undefined;
}

export async function writeEconomyPriceSnapshot(
  response: EconomyPriceSnapshotResponse
) {
  if (!isEconomyPriceSnapshotResponse(response)) return;
  await writeCachedPriceSnapshot(
    cacheKeyFor(response.snapshot.activeLeague),
    response
  );
}

export async function clearEconomyPriceSnapshots() {
  await clearCachedPriceSnapshots();
}

function cacheKeyFor(activeLeague: WorkspaceLeague) {
  return `${cacheKey}:${activeLeague}`;
}
