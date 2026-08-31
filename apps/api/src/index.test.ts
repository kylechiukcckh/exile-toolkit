import { describe, expect, it, vi } from 'vitest';
import type { PublicErrorResponse } from '@exile-toolkit/contracts';
import { validateEconomyPriceSnapshot } from '@exile-toolkit/domain';

import worker, { createWorker } from './index';

const lifeforceLines = [
  { id: 'vivid-lifeforce', primaryValue: 0.03 },
  { id: 'primal-lifeforce', primaryValue: 0.04 },
  { id: 'wild-lifeforce', primaryValue: 0.05 }
];

function currencyResponse(options?: {
  readonly divineRate?: number;
  readonly primary?: string;
  readonly lines?: readonly Record<string, unknown>[];
}) {
  return {
    core: {
      primary: options?.primary ?? 'chaos',
      rates: { divine: options?.divineRate ?? 1 / 120 }
    },
    lines: options?.lines ?? lifeforceLines
  };
}

function createSnapshotStore() {
  const values = new Map<string, string>();
  return {
    get: async (key: string) => values.get(key) ?? null,
    put: async (key: string, next: string) => {
      values.set(key, next);
    }
  };
}

describe('Exile Toolkit Worker', () => {
  it('publishes a complete normalized shared economy snapshot', async () => {
    const urls: string[] = [];
    const testWorker = createWorker(undefined, async input => {
      const url = String(input);
      urls.push(url);
      if (url.endsWith('/poe1/api/economy/leagues')) {
        return Response.json([
          { id: 'Allflame', name: 'Allflame' },
          { id: 'Hardcore Allflame', name: 'Hardcore Allflame' }
        ]);
      }
      if (url.includes('type=Currency')) {
        return Response.json(
          currencyResponse({
            lines: [
              ...lifeforceLines,
              { id: 'abrasive-catalyst', primaryValue: 1.5 }
            ]
          })
        );
      }
      const type = new URL(url).searchParams.get('type');
      return Response.json({
        lines: [
          {
            id: 1,
            name: `${type} Relic`,
            baseType: 'Iron Ring',
            variant: 'Cold',
            chaosValue: 10,
            listingCount: 12,
            detailsId: `${type}-relic`,
            icon: 'https://web.poecdn.com/relic.png'
          },
          ...(type === 'UniqueWeapon'
            ? [
                {
                  id: 2,
                  name: `${type} Relic`,
                  baseType: 'Iron Ring',
                  variant: 'Fire',
                  chaosValue: 8,
                  divineValue: 0.07,
                  listingCount: 5,
                  detailsId: `${type}-standard`,
                  icon: 'https://web.poecdn.com/relic.png'
                }
              ]
            : [])
        ]
      });
    });

    const response = await testWorker.fetch(
      new Request(
        'https://api.exile-toolkit.test/price-snapshots/economy?league=Hardcore%20Allflame'
      )
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      snapshot: {
        categories: { weapon: Array<Record<string, unknown>> };
      };
    };
    expect(body).toMatchObject({
      dustDatasetVersion: expect.any(String),
      snapshot: {
        schemaVersion: 3,
        activeLeague: 'Hardcore Allflame',
        source: 'poe.ninja',
        divineToChaos: 120,
        catalystToChaos: 1.5,
        lifeforcePrices: {
          yellow: { chaosPerLifeforce: 0.03 },
          blue: { chaosPerLifeforce: 0.04 },
          purple: { chaosPerLifeforce: 0.05 }
        },
        categories: {
          weapon: [
            {
              id: 'weapon:2:UniqueWeapon-standard',
              category: 'weapon'
            }
          ],
          armour: [{ category: 'armour' }],
          accessory: [{ category: 'accessory' }]
        }
      }
    });
    expect(body.snapshot.categories.weapon).toHaveLength(1);
    expect(body.snapshot.categories.weapon[0]).toMatchObject({
      chaosValue: 8,
      divineValue: 0.07,
      listingCount: 5
    });
    expect(urls).toHaveLength(5);
    expect(urls.some(url => url.includes('/exchange/current/overview?'))).toBe(
      true
    );
    expect(urls.some(url => url.includes('/exchange/current/currency/'))).toBe(
      false
    );
  });

  it('keeps the existing Disenchant response functional during migration', async () => {
    const testWorker = createWorker(undefined, async input => {
      const url = String(input);
      if (url.endsWith('/poe1/api/economy/leagues')) {
        return Response.json([{ id: 'Allflame', name: 'Allflame' }]);
      }
      if (url.includes('type=Currency')) {
        return Response.json(currencyResponse());
      }
      return Response.json({ lines: [] });
    });

    const response = await testWorker.fetch(
      new Request('https://api.exile-toolkit.test/price-snapshots/disenchant')
    );
    const body = (await response.json()) as {
      snapshot: Record<string, unknown>;
    };

    expect(response.status).toBe(200);
    expect(body.snapshot).toMatchObject({
      activeLeague: 'Allflame',
      divineToChaos: 120,
      categories: { weapon: [], armour: [], accessory: [] }
    });
    expect(body.snapshot).not.toHaveProperty('schemaVersion');
    expect(body.snapshot).not.toHaveProperty('lifeforcePrices');
  });

  it('does not publish a partial Disenchant snapshot when poe.ninja fails', async () => {
    const testWorker = createWorker(undefined, async input => {
      const url = String(input);
      if (url.endsWith('/poe1/api/economy/leagues')) {
        return Response.json([{ id: 'Allflame', name: 'Allflame' }]);
      }
      if (url.includes('type=UniqueArmour')) {
        return new Response('upstream error', { status: 503 });
      }
      if (url.includes('type=Currency')) {
        return Response.json(currencyResponse());
      }
      return Response.json({ lines: [] });
    });

    const response = await testWorker.fetch(
      new Request('https://api.exile-toolkit.test/price-snapshots/disenchant')
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: {
        code: 'upstream_unavailable',
        requestId: expect.any(String)
      }
    });
  });

  it.each([
    ['malformed JSON', 'malformed', 'weapon'],
    ['an invalid item value', 'invalid-item', 'weapon'],
    ['an invalid currency rate', 'invalid-currency', 'currency']
  ] as const)(
    'rejects a refresh containing %s',
    async (_label, failure, expectedResource) => {
      const logs: unknown[] = [];
      const testWorker = createWorker(
        record => logs.push(record),
        async input => {
          const url = String(input);
          if (url.endsWith('/poe1/api/economy/leagues')) {
            return Response.json([{ id: 'Allflame', name: 'Allflame' }]);
          }
          if (url.includes('type=UniqueWeapon')) {
            if (failure === 'malformed') {
              return new Response('{', {
                headers: { 'content-type': 'application/json' }
              });
            }
            if (failure === 'invalid-item') {
              return Response.json({
                lines: [
                  {
                    id: 'not-an-integer',
                    name: 'Invalid Relic',
                    baseType: 'Iron Ring',
                    detailsId: 'invalid-relic'
                  }
                ]
              });
            }
          }
          if (url.includes('type=Currency')) {
            return Response.json(
              currencyResponse({
                divineRate: failure === 'invalid-currency' ? 0 : 1 / 120
              })
            );
          }
          return Response.json({ lines: [] });
        }
      );

      const response = await testWorker.fetch(
        new Request('https://api.exile-toolkit.test/price-snapshots/disenchant')
      );

      expect(response.status).toBe(503);
      expect(logs).toContainEqual(
        expect.objectContaining({
          event: 'price_snapshot_refresh_failed',
          resource: expectedResource
        })
      );
    }
  );

  it.each([
    [
      'missing Vivid Lifeforce',
      currencyResponse({ lines: lifeforceLines.slice(1) })
    ],
    [
      'missing Primal Lifeforce',
      currencyResponse({
        lines: lifeforceLines.filter(line => line.id !== 'primal-lifeforce')
      })
    ],
    [
      'missing Wild Lifeforce',
      currencyResponse({ lines: lifeforceLines.slice(0, 2) })
    ],
    [
      'duplicate Lifeforce ids',
      currencyResponse({ lines: [...lifeforceLines, lifeforceLines[0]!] })
    ],
    [
      'a malformed Lifeforce value',
      currencyResponse({
        lines: lifeforceLines.map(line =>
          line.id === 'primal-lifeforce'
            ? { ...line, primaryValue: '0.04' }
            : line
        )
      })
    ],
    [
      'a nonpositive Lifeforce value',
      currencyResponse({
        lines: lifeforceLines.map(line =>
          line.id === 'wild-lifeforce' ? { ...line, primaryValue: 0 } : line
        )
      })
    ],
    ['a non-Chaos quote', currencyResponse({ primary: 'divine' })]
  ])('does not publish a shared snapshot with %s', async (_label, currency) => {
    const testWorker = createWorker(undefined, async input => {
      const url = String(input);
      if (url.endsWith('/poe1/api/economy/leagues')) {
        return Response.json([{ id: 'Allflame', name: 'Allflame' }]);
      }
      if (url.includes('type=Currency')) return Response.json(currency);
      return Response.json({ lines: [] });
    });

    const response = await testWorker.fetch(
      new Request('https://api.exile-toolkit.test/price-snapshots/economy')
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: { code: 'upstream_unavailable' }
    });
  });

  it('retains the last complete snapshot when a later refresh fails', async () => {
    let available = true;
    const store = createSnapshotStore();
    const testWorker = createWorker(
      undefined,
      async input => {
        const url = String(input);
        if (url.endsWith('/poe1/api/economy/leagues')) {
          return Response.json([{ id: 'Allflame', name: 'Allflame' }]);
        }
        if (url.includes('type=UniqueArmour') && !available) {
          return new Response('upstream error', { status: 503 });
        }
        if (url.includes('type=Currency')) {
          return Response.json(currencyResponse());
        }
        return Response.json({ lines: [] });
      },
      store
    );

    const initial = await testWorker.fetch(
      new Request('https://api.exile-toolkit.test/price-snapshots/disenchant')
    );
    const initialBody = await initial.json();
    const stored = await store.get('economy:complete:v3');
    expect(stored).not.toBeNull();
    expect(
      validateEconomyPriceSnapshot(JSON.parse(stored ?? 'null'))
    ).toMatchObject({ valid: true });
    available = false;

    const restartedWorker = createWorker(
      undefined,
      async input => {
        const url = String(input);
        if (url.endsWith('/poe1/api/economy/leagues')) {
          return Response.json([{ id: 'Allflame', name: 'Allflame' }]);
        }
        return new Response('upstream error', { status: 503 });
      },
      store
    );
    const fallback = await restartedWorker.fetch(
      new Request('https://api.exile-toolkit.test/price-snapshots/disenchant')
    );

    expect(fallback.status).toBe(200);
    expect(await fallback.json()).toEqual(initialBody);
  });

  it('retains the last complete snapshot when a Lifeforce refresh is partial', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-31T00:00:00.000Z'));
    let currency = currencyResponse();
    const store = createSnapshotStore();
    const testWorker = createWorker(
      undefined,
      async input => {
        const url = String(input);
        if (url.endsWith('/poe1/api/economy/leagues')) {
          return Response.json([{ id: 'Allflame', name: 'Allflame' }]);
        }
        if (url.includes('type=Currency')) return Response.json(currency);
        return Response.json({ lines: [] });
      },
      store
    );
    const request = new Request(
      'https://api.exile-toolkit.test/price-snapshots/economy'
    );

    const initial = await testWorker.fetch(request);
    const initialBody = await initial.json();
    const initiallyStored = await store.get('economy:complete:v3');
    vi.advanceTimersByTime(60 * 60_000);
    currency = currencyResponse({ lines: lifeforceLines.slice(1) });
    const fallback = await testWorker.fetch(request);

    expect(fallback.status).toBe(200);
    expect(await fallback.json()).toEqual(initialBody);
    expect(await store.get('economy:complete:v3')).toBe(initiallyStored);
    vi.useRealTimers();
  });

  it('ignores an older Disenchant-only Worker snapshot key', async () => {
    const store = createSnapshotStore();
    await store.put(
      'disenchant:complete:v2',
      JSON.stringify({
        activeLeague: 'Allflame',
        source: 'poe.ninja',
        retrievedAt: new Date().toISOString(),
        divineToChaos: 120,
        categories: { weapon: [], armour: [], accessory: [] }
      })
    );
    const testWorker = createWorker(
      undefined,
      async () => new Response('unavailable', { status: 503 }),
      store
    );

    const response = await testWorker.fetch(
      new Request('https://api.exile-toolkit.test/price-snapshots/economy')
    );

    expect(response.status).toBe(503);
  });

  it('serves a fresh stored snapshot without refreshing poe.ninja', async () => {
    const store = createSnapshotStore();
    let upstreamRequests = 0;
    const requestUpstream = async (input: RequestInfo | URL) => {
      upstreamRequests += 1;
      const url = String(input);
      if (url.endsWith('/poe1/api/economy/leagues')) {
        return Response.json([{ id: 'Allflame', name: 'Allflame' }]);
      }
      if (url.includes('type=Currency')) {
        return Response.json(currencyResponse());
      }
      return Response.json({ lines: [] });
    };
    const request = new Request(
      'https://api.exile-toolkit.test/price-snapshots/disenchant'
    );

    const firstWorker = createWorker(undefined, requestUpstream, store);
    const firstResponse = await firstWorker.fetch(request);
    const firstBody = await firstResponse.json();
    expect(firstResponse.status).toBe(200);
    expect(upstreamRequests).toBe(5);

    const restartedWorker = createWorker(undefined, requestUpstream, store);
    const secondResponse = await restartedWorker.fetch(request);

    expect(secondResponse.status).toBe(200);
    expect(await secondResponse.json()).toEqual(firstBody);
    expect(upstreamRequests).toBe(5);
  });

  it('refreshes prices when the snapshot store does not respond', async () => {
    vi.useFakeTimers();
    const hangingStore = {
      get: () => new Promise<string | null>(() => undefined),
      put: async () => undefined
    };
    const testWorker = createWorker(
      undefined,
      async input => {
        const url = String(input);
        if (url.endsWith('/poe1/api/economy/leagues')) {
          return Response.json([{ id: 'Allflame', name: 'Allflame' }]);
        }
        if (url.includes('type=Currency')) {
          return Response.json(currencyResponse());
        }
        return Response.json({ lines: [] });
      },
      hangingStore
    );

    const responsePromise = testWorker.fetch(
      new Request('https://api.exile-toolkit.test/price-snapshots/disenchant')
    );
    await vi.advanceTimersByTimeAsync(1_000);
    const response = await responsePromise;

    expect(response.status).toBe(200);
    vi.useRealTimers();
  });

  it.each([
    ['Fresh', 59 * 60_000, 200],
    ['Stale at one hour', 60 * 60_000, 200],
    ['Stale through 24 hours', 24 * 60 * 60_000 - 1_000, 200],
    ['expired after 24 hours', 24 * 60 * 60_000 + 1, 503]
  ] as const)(
    'applies the Worker fallback boundary for a %s snapshot',
    async (_label, age, expectedStatus) => {
      const store = createSnapshotStore();
      await store.put(
        'economy:complete:v3',
        JSON.stringify({
          schemaVersion: 3,
          activeLeague: 'Allflame',
          source: 'poe.ninja',
          retrievedAt: new Date(Date.now() - age).toISOString(),
          divineToChaos: 120,
          lifeforcePrices: {
            yellow: { chaosPerLifeforce: 0.03 },
            blue: { chaosPerLifeforce: 0.04 },
            purple: { chaosPerLifeforce: 0.05 }
          },
          categories: { weapon: [], armour: [], accessory: [] }
        })
      );
      const testWorker = createWorker(
        undefined,
        async () => new Response('unavailable', { status: 503 }),
        store
      );

      const response = await testWorker.fetch(
        new Request('https://api.exile-toolkit.test/price-snapshots/disenchant')
      );

      expect(response.status).toBe(expectedStatus);
    }
  );

  it('revalidates unchanged upstream resources without mixing snapshot generations', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-31T00:00:00.000Z'));
    const seenConditionalHeaders: Array<string | null> = [];
    const testWorker = createWorker(undefined, async (input, init) => {
      const url = String(input);
      const conditionalHeader = new Headers(init?.headers).get('if-none-match');
      seenConditionalHeaders.push(conditionalHeader);
      if (conditionalHeader === '"generation-1"') {
        return new Response(null, { status: 304 });
      }

      const headers = { etag: '"generation-1"' };
      if (url.endsWith('/poe1/api/economy/leagues')) {
        return Response.json([{ id: 'Allflame', name: 'Allflame' }], {
          headers
        });
      }
      if (url.includes('type=Currency')) {
        return Response.json(currencyResponse(), { headers });
      }
      return Response.json({ lines: [] }, { headers });
    });

    const request = new Request(
      'https://api.exile-toolkit.test/price-snapshots/economy'
    );
    const first = await testWorker.fetch(request);
    const firstBody = (await first.json()) as {
      snapshot: {
        retrievedAt: string;
        divineToChaos: number;
        lifeforcePrices: Record<string, { chaosPerLifeforce: number }>;
      };
    };
    vi.advanceTimersByTime(60 * 60_000);
    const second = await testWorker.fetch(request);
    const secondBody = (await second.json()) as typeof firstBody;

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(seenConditionalHeaders.slice(5)).toEqual(
      Array(5).fill('"generation-1"')
    );
    expect(secondBody.snapshot.divineToChaos).toBe(120);
    expect(secondBody.snapshot.lifeforcePrices).toEqual(
      firstBody.snapshot.lifeforcePrices
    );
    expect(
      new Date(secondBody.snapshot.retrievedAt).getTime()
    ).toBeGreaterThanOrEqual(
      new Date(firstBody.snapshot.retrievedAt).getTime()
    );
    vi.useRealTimers();
  });

  it('discards conditionally fetched resources when any part of a refresh fails', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-31T00:00:00.000Z'));
    let generation = 1;
    let failArmour = false;
    const weaponConditionalHeaders: Array<string | null> = [];
    const testWorker = createWorker(undefined, async (input, init) => {
      const url = String(input);
      const conditionalHeader = new Headers(init?.headers).get('if-none-match');
      if (url.includes('type=UniqueWeapon')) {
        weaponConditionalHeaders.push(conditionalHeader);
      }
      if (failArmour && url.includes('type=UniqueArmour')) {
        return new Response('failed', { status: 503 });
      }
      const headers = { etag: `"generation-${generation}"` };
      if (url.endsWith('/poe1/api/economy/leagues')) {
        return Response.json([{ id: 'Allflame', name: 'Allflame' }], {
          headers
        });
      }
      if (url.includes('type=Currency')) {
        return Response.json(currencyResponse(), { headers });
      }
      return Response.json({ lines: [] }, { headers });
    });
    const request = new Request(
      'https://api.exile-toolkit.test/price-snapshots/economy'
    );

    await testWorker.fetch(request);
    vi.advanceTimersByTime(60 * 60_000);
    generation = 2;
    failArmour = true;
    await testWorker.fetch(request);
    vi.advanceTimersByTime(60 * 60_000);
    generation = 3;
    failArmour = false;
    await testWorker.fetch(request);

    expect(weaponConditionalHeaders).toEqual([
      null,
      '"generation-1"',
      '"generation-1"'
    ]);
    vi.useRealTimers();
  });

  it('exhausts bounded retries after an upstream timeout', async () => {
    let weaponAttempts = 0;
    const testWorker = createWorker(
      undefined,
      async (input, init) => {
        const url = String(input);
        if (url.endsWith('/poe1/api/economy/leagues')) {
          return Response.json([{ id: 'Allflame', name: 'Allflame' }]);
        }
        if (url.includes('type=UniqueWeapon')) {
          weaponAttempts += 1;
          return new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('Timed out', 'AbortError'))
            );
          });
        }
        if (url.includes('type=Currency')) {
          return Response.json(currencyResponse());
        }
        return Response.json({ lines: [] });
      },
      undefined,
      1
    );

    const response = await testWorker.fetch(
      new Request('https://api.exile-toolkit.test/price-snapshots/disenchant')
    );

    expect(response.status).toBe(503);
    expect(weaponAttempts).toBe(2);
  });

  it('logs only the failed resource and request correlation for price failures', async () => {
    const logs: unknown[] = [];
    const privateText = 'Headhunter?favorite=true&maxPrice=1';
    const testWorker = createWorker(
      record => logs.push(record),
      async input => {
        const url = String(input);
        if (url.endsWith('/poe1/api/economy/leagues')) {
          return Response.json([{ id: 'Allflame', name: 'Allflame' }]);
        }
        if (url.includes('type=UniqueWeapon')) throw new Error(privateText);
        if (url.includes('type=Currency')) {
          return Response.json(currencyResponse());
        }
        return Response.json({ lines: [] });
      }
    );

    const response = await testWorker.fetch(
      new Request('https://api.exile-toolkit.test/price-snapshots/disenchant')
    );
    const body = (await response.json()) as PublicErrorResponse;

    expect(response.status).toBe(503);
    expect(logs).toContainEqual({
      event: 'price_snapshot_refresh_failed',
      requestId: body.error.requestId,
      resource: 'weapon'
    });
    expect(JSON.stringify(logs)).not.toContain(privateText);
  });

  it('returns the public health report', async () => {
    const response = await worker.fetch(
      new Request('https://api.exile-toolkit.test/health')
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toMatchObject({
      service: 'exile-toolkit-api',
      status: 'ok',
      workspace: 'Exile Toolkit'
    });
  });

  it('returns a stable not-found response for unknown routes', async () => {
    const response = await worker.fetch(
      new Request('https://api.exile-toolkit.test/missing')
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      error: {
        code: 'not_found',
        message: 'Route not found',
        requestId: expect.any(String)
      }
    });
    expect(response.headers.get('x-request-id')).toBeTruthy();
  });

  it('allows a Cloudflare Pages preview to read service health', async () => {
    const response = await worker.fetch(
      new Request('https://api.exile-toolkit.test/health', {
        headers: {
          origin: 'https://pr-17.exile-toolkit.pages.dev'
        }
      })
    );

    expect(response.headers.get('access-control-allow-origin')).toBe(
      'https://pr-17.exile-toolkit.pages.dev'
    );
    expect(response.headers.get('vary')).toBe('Origin');
  });

  it('allows an approved web origin to preflight aggregate analytics only', async () => {
    const response = await worker.fetch(
      new Request('https://api.exile-toolkit.test/events', {
        method: 'OPTIONS',
        headers: {
          origin: 'https://pr-17.exile-toolkit.pages.dev',
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'content-type'
        }
      })
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe(
      'https://pr-17.exile-toolkit.pages.dev'
    );
    expect(response.headers.get('access-control-allow-methods')).toBe('POST');
    expect(response.headers.get('access-control-allow-headers')).toBe(
      'content-type'
    );
  });

  it('accepts only aggregate analytics and never logs submitted private Tool state', async () => {
    const logs: unknown[] = [];
    const testWorker = createWorker(record => logs.push(record));
    const privateText = 'Players cannot Regenerate PRIVATE';

    const response = await testWorker.fetch(
      new Request('https://api.exile-toolkit.test/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          event: 'tool_open',
          toolId: 'regex',
          selection: privateText
        })
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: 'invalid_event', requestId: expect.any(String) }
    });
    expect(JSON.stringify(logs)).not.toContain(privateText);
  });

  it('records an approved aggregate Tool event with request correlation', async () => {
    const logs: unknown[] = [];
    const testWorker = createWorker(record => logs.push(record));

    const response = await testWorker.fetch(
      new Request('https://api.exile-toolkit.test/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event: 'tool_open', toolId: 'regex' })
      })
    );
    const requestId = response.headers.get('x-request-id');

    expect(response.status).toBe(202);
    expect(logs).toContainEqual({
      event: 'analytics_event',
      requestId,
      name: 'tool_open',
      toolId: 'regex'
    });
  });

  it('returns sanitized internal failures and logs correlation without private request data', async () => {
    const logs: unknown[] = [];
    const testWorker = createWorker(record => logs.push(record));
    const privateText = 'private-regex-from-request';
    const brokenRequest = {
      method: 'POST',
      headers: new Headers(),
      get url() {
        throw new Error(privateText);
      }
    } as unknown as Request;

    const response = await testWorker.fetch(brokenRequest);
    const body = (await response.json()) as PublicErrorResponse;

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      error: {
        code: 'internal_error',
        message: 'The service could not complete this request.',
        requestId: expect.any(String)
      }
    });
    expect(JSON.stringify(body)).not.toContain(privateText);
    expect(JSON.stringify(logs)).not.toContain(privateText);
    expect(logs).toEqual([
      expect.objectContaining({
        event: 'worker_request',
        method: 'POST',
        status: 500,
        errorCode: 'internal_error',
        requestId: body.error.requestId
      })
    ]);
  });

  it('normalizes unknown paths and query strings before structured logging', async () => {
    const logs: unknown[] = [];
    const testWorker = createWorker(record => logs.push(record));
    const privateText = 'Players-cannot-Regenerate-PRIVATE';

    await testWorker.fetch(
      new Request(
        `https://api.exile-toolkit.test/${privateText}?state=${privateText}`
      )
    );

    expect(logs).toEqual([
      expect.objectContaining({ route: 'not_found', status: 404 })
    ]);
    expect(JSON.stringify(logs)).not.toContain(privateText);
  });
});
