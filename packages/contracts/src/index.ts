import { workspaceManifest } from '@exile-toolkit/data';
import {
  validateEconomyPriceSnapshot,
  validatePriceSnapshot,
  type EconomyPriceSnapshot,
  type PriceSnapshot
} from '@exile-toolkit/domain';

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
  'disenchant',
  'crop-rotation',
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
  | {
      readonly event: 'tool_open';
      readonly toolId: 'regex' | 'disenchant' | 'crop-rotation';
    };

export interface PublicErrorResponse {
  readonly error: {
    readonly code:
      'invalid_event' | 'not_found' | 'upstream_unavailable' | 'internal_error';
    readonly message: string;
    readonly requestId: string;
  };
}

export interface DisenchantPriceSnapshotResponse {
  readonly snapshot: PriceSnapshot;
  readonly dustDatasetVersion: string;
}

export interface EconomyPriceSnapshotResponse {
  readonly snapshot: EconomyPriceSnapshot;
  readonly dustDatasetVersion: string;
}

export function isEconomyPriceSnapshotResponse(
  value: unknown
): value is EconomyPriceSnapshotResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const response = value as Record<string, unknown>;
  return (
    typeof response.dustDatasetVersion === 'string' &&
    response.dustDatasetVersion.trim().length > 0 &&
    validateEconomyPriceSnapshot(response.snapshot).valid
  );
}

export function isDisenchantPriceSnapshotResponse(
  value: unknown
): value is DisenchantPriceSnapshotResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const response = value as Record<string, unknown>;
  return (
    typeof response.dustDatasetVersion === 'string' &&
    response.dustDatasetVersion.trim().length > 0 &&
    validatePriceSnapshot(response.snapshot).valid
  );
}

export function isAnalyticsEvent(value: unknown): value is AnalyticsEvent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const event = value as Record<string, unknown>;
  const keys = Object.keys(event);

  if (event.event === 'tool_open') {
    return (
      keys.length === 2 &&
      (event.toolId === 'regex' ||
        event.toolId === 'disenchant' ||
        event.toolId === 'crop-rotation')
    );
  }

  return (
    event.event === 'page_view' &&
    keys.length === 2 &&
    typeof event.pageId === 'string' &&
    analyticsPageIds.includes(event.pageId as AnalyticsPageId)
  );
}
