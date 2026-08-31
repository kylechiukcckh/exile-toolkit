// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import type { EconomyPriceSnapshotResponse } from '@exile-toolkit/contracts';

import {
  clearEconomyPriceSnapshots,
  readEconomyPriceSnapshot,
  writeEconomyPriceSnapshot
} from './economy-price-snapshot-cache';

const completeResponse: EconomyPriceSnapshotResponse = {
  snapshot: {
    schemaVersion: 3,
    activeLeague: 'Allflame',
    source: 'poe.ninja',
    retrievedAt: '2026-08-31T00:00:00.000Z',
    divineToChaos: 120,
    lifeforcePrices: {
      yellow: { chaosPerLifeforce: 0.03 },
      blue: { chaosPerLifeforce: 0.04 },
      purple: { chaosPerLifeforce: 0.05 }
    },
    categories: { weapon: [], armour: [], accessory: [] }
  },
  dustDatasetVersion: '2026.08.31'
};

describe('economy price snapshot browser cache', () => {
  beforeEach(() => installIndexedDbStub());

  it('writes and reads complete snapshots in isolation by league', async () => {
    await writeEconomyPriceSnapshot(completeResponse);

    expect(await readEconomyPriceSnapshot('Allflame')).toEqual(
      completeResponse
    );
    expect(await readEconomyPriceSnapshot('Hardcore Allflame')).toBeUndefined();
  });

  it.each([
    [
      'an old-version complete payload',
      { ...completeResponse.snapshot, schemaVersion: 2 }
    ],
    [
      'a current-version partial payload',
      {
        ...completeResponse.snapshot,
        lifeforcePrices: {
          yellow: { chaosPerLifeforce: 0.03 },
          blue: { chaosPerLifeforce: 0.04 }
        }
      }
    ]
  ])('ignores %s', async (_label, snapshot) => {
    await writeEconomyPriceSnapshot({
      ...completeResponse,
      snapshot
    } as unknown as EconomyPriceSnapshotResponse);

    expect(await readEconomyPriceSnapshot('Allflame')).toBeUndefined();
  });

  it('removes shared snapshots when local data is cleared', async () => {
    await writeEconomyPriceSnapshot(completeResponse);
    await clearEconomyPriceSnapshots();

    expect(await readEconomyPriceSnapshot('Allflame')).toBeUndefined();
  });
});

function installIndexedDbStub() {
  const values = new Map<IDBValidKey, unknown>();
  const request = <T>(operation: () => T) => {
    const result = {} as IDBRequest<T>;
    queueMicrotask(() => {
      Object.defineProperty(result, 'result', { value: operation() });
      result.onsuccess?.(
        new Event('success') as Event & {
          target: IDBRequest<T>;
        }
      );
    });
    return result;
  };
  const objectStore = {
    get: (key: IDBValidKey) => request(() => values.get(key)),
    put: (value: unknown, key: IDBValidKey) =>
      request(() => {
        values.set(key, value);
        return key;
      }),
    clear: () =>
      request(() => {
        values.clear();
        return undefined;
      })
  } as IDBObjectStore;
  const database = {
    createObjectStore: () => objectStore,
    transaction: () => ({ objectStore: () => objectStore })
  } as unknown as IDBDatabase;
  const indexedDb = {
    open: () => {
      const openRequest = {} as IDBOpenDBRequest;
      Object.defineProperty(openRequest, 'result', { value: database });
      queueMicrotask(() =>
        openRequest.onsuccess?.(
          new Event('success') as Event & {
            target: IDBOpenDBRequest;
          }
        )
      );
      return openRequest;
    }
  } as unknown as IDBFactory;

  Object.defineProperty(window, 'indexedDB', {
    configurable: true,
    value: indexedDb
  });
}
