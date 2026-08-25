import { describe, expect, it } from 'vitest';
import type { PublicErrorResponse } from '@exile-toolkit/contracts';

import worker, { createWorker } from './index';

describe('Exile Toolkit Worker', () => {
  it('publishes a complete normalized poe.ninja snapshot for Disenchant rankings', async () => {
    const urls: string[] = [];
    const testWorker = createWorker(undefined, async input => {
      const url = String(input);
      urls.push(url);
      if (url.endsWith('/poe1/api/economy/leagues')) {
        return Response.json([{ id: 'Allflame', name: 'Allflame' }]);
      }
      if (url.includes('type=Currency')) {
        return Response.json({
          lines: [{ currencyTypeName: 'Divine Orb', chaosEquivalent: 120 }]
        });
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
          }
        ]
      });
    });

    const response = await testWorker.fetch(
      new Request('https://api.exile-toolkit.test/price-snapshots/disenchant')
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      dustDatasetVersion: expect.any(String),
      snapshot: {
        activeLeague: 'Allflame',
        source: 'poe.ninja',
        divineToChaos: 120,
        categories: {
          weapon: [
            {
              id: 'weapon:1:UniqueWeapon-relic',
              category: 'weapon',
              variant: 'Cold'
            }
          ],
          armour: [{ category: 'armour' }],
          accessory: [{ category: 'accessory' }]
        }
      }
    });
    expect(urls).toHaveLength(5);
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
        return Response.json({
          lines: [{ currencyTypeName: 'Divine Orb', chaosEquivalent: 120 }]
        });
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
