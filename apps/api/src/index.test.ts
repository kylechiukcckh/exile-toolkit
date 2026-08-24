import { describe, expect, it } from 'vitest';

import worker from './index';

describe('Exile Toolkit Worker', () => {
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
    expect(await response.json()).toEqual({
      error: 'not_found',
      message: 'Route not found'
    });
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
});
