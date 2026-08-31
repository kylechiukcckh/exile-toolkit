const databaseName = 'exile-toolkit';
const storeName = 'price-snapshots';

export function readCachedPriceSnapshot(key: string) {
  return withStore('readonly', store => store.get(key));
}

export async function writeCachedPriceSnapshot(key: string, value: unknown) {
  await withStore('readwrite', store => store.put(value, key));
}

export async function clearCachedPriceSnapshots() {
  await withStore('readwrite', store => store.clear());
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
