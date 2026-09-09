import {
  isHomeFeedResponse,
  type HomeFeedSnapshot
} from '@exile-toolkit/contracts';
import { useEffect, useState } from 'react';

import { apiBaseUrl } from '@/lib/api-config';

export function useHomeFeed() {
  const [snapshot, setSnapshot] = useState<HomeFeedSnapshot>();
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`${apiBaseUrl}/home-feed`, {
          headers: { accept: 'application/json' },
          signal: controller.signal
        });
        const body: unknown = await response.json();
        if (!response.ok || !isHomeFeedResponse(body)) throw new Error();
        setSnapshot(body.snapshot);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setUnavailable(true);
        }
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  return { snapshot, unavailable };
}
