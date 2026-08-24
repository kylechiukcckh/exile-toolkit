import { describe, expect, it, vi } from 'vitest';

import { createAnalyticsClient, createAnalyticsSender } from './analytics';

describe('aggregate analytics', () => {
  it('sends only approved page and Tool identifiers', async () => {
    const send = vi.fn(() => Promise.resolve());
    const analytics = createAnalyticsClient({ enabled: true, send });

    analytics.recordPage('regex');
    analytics.recordTool('regex');
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(2));

    expect(send.mock.calls).toEqual([
      [{ event: 'page_view', pageId: 'regex' }],
      [{ event: 'tool_open', toolId: 'regex' }]
    ]);
    expect(JSON.stringify(send.mock.calls)).not.toMatch(
      /selection|generated|pasted|saved|storage/i
    );
  });

  it('does not send outbound analytics when disabled', () => {
    const send = vi.fn(() => Promise.resolve());
    const analytics = createAnalyticsClient({ enabled: false, send });

    analytics.recordPage('home');
    analytics.recordTool('regex');

    expect(send).not.toHaveBeenCalled();
  });

  it('sends enabled events to the configured Worker origin', async () => {
    const request = vi.fn(() =>
      Promise.resolve(new Response(null, { status: 202 }))
    );
    const send = createAnalyticsSender(
      'https://exile-toolkit-api.example.workers.dev',
      request
    );

    await send({ event: 'page_view', pageId: 'privacy' });

    expect(request).toHaveBeenCalledWith(
      'https://exile-toolkit-api.example.workers.dev/events',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
