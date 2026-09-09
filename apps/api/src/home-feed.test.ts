import { describe, expect, it, vi } from 'vitest';

import {
  fetchHomeFeed,
  homeFeedFreshForMs,
  homeFeedIsFresh,
  homeFeedKey,
  readStoredHomeFeed,
  writeStoredHomeFeed
} from './home-feed';

describe('homepage feed', () => {
  it('invalidates snapshots created before the ten-league dataset', () => {
    expect(homeFeedKey).toBe('home-feed:complete:v5');
  });

  it('normalizes the latest official patch and SteamDB retention data', async () => {
    const request = vi.fn(async input => {
      const url = String(input);
      if (url.includes('view-forum')) {
        return new Response(
          '<a href="/forum/view-thread/4001117">\n 3.29.3b Patch Notes\n</a>'
        );
      }
      if (url.includes('view-thread')) {
        return new Response(
          '<div class="post_date">Sep 4, 2026, 10:30:00 AM</div><div class="content"><ul><li>Fixed a bug that couldn&#039;t occur.</li><li>Trade links no longer expire.</li></ul></div>'
        );
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const snapshot = await fetchHomeFeed(request, 1_000);

    expect(snapshot.patch).toMatchObject({
      version: '3.29.3b',
      url: 'https://www.pathofexile.com/forum/view-thread/4001117',
      changes: [
        "Fixed a bug that couldn't occur.",
        'Trade links no longer expire.'
      ]
    });
    expect(snapshot.retention).toMatchObject({
      league: 'Allflame',
      source: 'steamdb-export',
      launchPlayers: 187116,
      series: [
        { league: 'Allflame' },
        { league: 'Mirage' },
        { league: 'Keepers' },
        { league: 'Mercenaries' },
        { league: 'Settlers' },
        { league: 'Necropolis' },
        { league: 'Affliction' },
        { league: 'Ancestor' },
        { league: 'Crucible' },
        { league: 'Sanctum' }
      ]
    });
  });

  it('stores a complete feed and refreshes it after one day', async () => {
    const values = new Map<string, string>();
    const store = {
      get: vi.fn(async (key: string) => values.get(key) ?? null),
      put: vi.fn(
        async (key: string, value: string) => void values.set(key, value)
      )
    };
    const snapshot = await fetchHomeFeed(async input => {
      const url = String(input);
      if (url.includes('view-forum'))
        return new Response(
          '<a href="/forum/view-thread/1">3.29.3b Patch Notes</a>'
        );
      if (url.includes('view-thread'))
        return new Response('<div class="content"><li>Fixed a bug.</li></div>');
      throw new Error(`Unexpected URL: ${url}`);
    }, 1_000);

    await writeStoredHomeFeed(store, snapshot);

    expect(store.put).toHaveBeenCalledWith(homeFeedKey, expect.any(String));
    expect(await readStoredHomeFeed(store)).toEqual(snapshot);
    const retrievedAt = new Date(snapshot.retrievedAt).getTime();
    expect(
      homeFeedIsFresh(snapshot, retrievedAt + homeFeedFreshForMs - 1)
    ).toBe(true);
    expect(homeFeedIsFresh(snapshot, retrievedAt + homeFeedFreshForMs)).toBe(
      false
    );
  });

  it('uses Steam after SteamDB has seeded the retained history', async () => {
    const seeded = await fetchHomeFeed(async input => {
      const url = String(input);
      if (url.includes('view-forum'))
        return new Response(
          '<a href="/forum/view-thread/1">3.29.3b Patch Notes</a>'
        );
      if (url.includes('view-thread'))
        return new Response('<div class="content"><li>Fixed a bug.</li></div>');
      throw new Error(`Unexpected URL: ${url}`);
    }, 1_000);

    const refreshed = await fetchHomeFeed(
      async input => {
        const url = String(input);
        if (url.includes('view-forum'))
          return new Response(
            '<a href="/forum/view-thread/1">3.29.3b Patch Notes</a>'
          );
        if (url.includes('view-thread'))
          throw new Error('An unchanged patch thread must not be fetched');
        if (url.includes('GetNumberOfCurrentPlayers'))
          return Response.json({ response: { player_count: 6500 } });
        throw new Error(`Unexpected URL: ${url}`);
      },
      1_000,
      seeded
    );

    expect(refreshed.retention.source).toBe('steam');
    expect(refreshed.retention.values.at(-1)).toBe(3.5);
    expect(refreshed.retention.series[0]?.values.at(-1)).toBe(3.5);
    expect(refreshed.retention.days).toHaveLength(
      seeded.retention.days.length + 1
    );
  });
});
