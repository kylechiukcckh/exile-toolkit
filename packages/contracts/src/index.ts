import { workspaceManifest } from '@exile-toolkit/data';

export interface HealthReport {
  readonly service: 'exile-toolkit-api';
  readonly status: 'ok';
  readonly timestamp: string;
  readonly workspace: typeof workspaceManifest.name;
}

export function isHealthReport(value: unknown): value is HealthReport {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const report = value as Partial<HealthReport>;
  return (
    report.service === 'exile-toolkit-api' &&
    report.status === 'ok' &&
    typeof report.timestamp === 'string' &&
    report.workspace === workspaceManifest.name
  );
}

export const analyticsPageIds = [
  'home',
  'regex',
  'about',
  'data-sources',
  'privacy',
  'licenses',
  'non-affiliation',
  'not-found'
] as const;

export type AnalyticsPageId = (typeof analyticsPageIds)[number];

export type AnalyticsEvent =
  | {
      readonly event: 'page_view';
      readonly pageId: AnalyticsPageId;
    }
  | { readonly event: 'tool_open'; readonly toolId: 'regex' };

export interface PublicErrorResponse {
  readonly error: {
    readonly code: 'invalid_event' | 'not_found' | 'internal_error';
    readonly message: string;
    readonly requestId: string;
  };
}

export function isAnalyticsEvent(value: unknown): value is AnalyticsEvent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const event = value as Record<string, unknown>;
  const keys = Object.keys(event);

  if (event.event === 'tool_open') {
    return keys.length === 2 && event.toolId === 'regex';
  }

  return (
    event.event === 'page_view' &&
    keys.length === 2 &&
    typeof event.pageId === 'string' &&
    analyticsPageIds.includes(event.pageId as AnalyticsPageId)
  );
}
