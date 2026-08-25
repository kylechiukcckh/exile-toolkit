import {
  isDisenchantPriceSnapshotResponse,
  type DisenchantPriceSnapshotResponse
} from '@exile-toolkit/contracts';

const databaseName = 'exile-toolkit';
const storeName = 'price-snapshots';
const cacheKey = 'disenchant';

export async function readDisenchantPriceSnapshot() {
  const cached = await withStore('readonly', store => store.get(cacheKey));
  return isDisenchantPriceSnapshotResponse(cached) ? cached : undefined;
}

export async function writeDisenchantPriceSnapshot(
  response: DisenchantPriceSnapshotResponse
) {
  if (!isDisenchantPriceSnapshotResponse(response)) return;
  await withStore('readwrite', store => store.put(response, cacheKey));
}

export async function clearDisenchantPriceSnapshot() {
  await withStore('readwrite', store => store.delete(cacheKey));
}

function withStore<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T | undefined> {
  return new Promise(resolve => {
    if (!('indexedDB' in window)) {
      resolve(undefined);
      return;
    }
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName);
    };
    request.onerror = () => resolve(undefined);
    request.onsuccess = () => {
      try {
        const transaction = request.result.transaction(storeName, mode);
        const operation = action(transaction.objectStore(storeName));
        operation.onsuccess = () => resolve(operation.result);
        operation.onerror = () => resolve(undefined);
        transaction.onerror = () => resolve(undefined);
        transaction.onabort = () => resolve(undefined);
      } catch {
        resolve(undefined);
      }
    };
  });
}
