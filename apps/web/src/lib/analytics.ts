import type { AnalyticsEvent } from '@exile-toolkit/contracts';

import { apiBaseUrl } from './api-config';

interface AnalyticsClientOptions {
  readonly enabled: boolean;
  readonly send: (event: AnalyticsEvent) => Promise<void>;
}

export function createAnalyticsClient(options: AnalyticsClientOptions) {
  function record(event: AnalyticsEvent) {
    if (!options.enabled) return;
    void options.send(event).catch(() => undefined);
  }

  return {
    recordPage(
      pageId: Extract<AnalyticsEvent, { event: 'page_view' }>['pageId']
    ) {
      record({ event: 'page_view', pageId });
    },
    recordTool(
      toolId: Extract<AnalyticsEvent, { event: 'tool_open' }>['toolId']
    ) {
      record({ event: 'tool_open', toolId });
    }
  };
}

export const analytics = createAnalyticsClient({
  enabled: import.meta.env.VITE_ANALYTICS_ENABLED === 'true',
  send: createAnalyticsSender(apiBaseUrl, fetch)
});

export function createAnalyticsSender(baseUrl: string, request: typeof fetch) {
  return async (event: AnalyticsEvent) => {
    await request(`${baseUrl}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true
    });
  };
}
