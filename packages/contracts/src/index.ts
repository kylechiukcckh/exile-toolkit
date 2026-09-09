import { workspaceManifest } from '@exile-toolkit/data';
import {
  validateEconomyPriceSnapshot,
  type EconomyPriceSnapshot
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

export interface EconomyPriceSnapshotResponse {
  readonly snapshot: EconomyPriceSnapshot;
  readonly dustDatasetVersion: string;
}

export interface HomeFeedSnapshot {
  readonly retrievedAt: string;
  readonly patch: {
    readonly version: string;
    readonly title: string;
    readonly publishedAt: string;
    readonly url: string;
    readonly changes: readonly string[];
  };
  readonly retention: {
    readonly sourceUrl: string;
    readonly source: 'steamdb-export' | 'steam';
    readonly league: string;
    readonly launchPlayers: number;
    readonly lastSampledAt: string;
    readonly days: readonly number[];
    readonly values: readonly number[];
    readonly series: readonly {
      readonly league: string;
      readonly launchPlayers: number;
      readonly values: readonly number[];
      readonly players: readonly number[];
    }[];
    readonly comparisons: readonly {
      readonly league: string;
      readonly day7: number | null;
      readonly day14: number | null;
      readonly day28: number | null;
    }[];
  };
}

export interface HomeFeedResponse {
  readonly snapshot: HomeFeedSnapshot;
}

export function isHomeFeedResponse(value: unknown): value is HomeFeedResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const snapshot = (value as { snapshot?: unknown }).snapshot;
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return false;
  }
  const feed = snapshot as Record<string, unknown>;
  const patch = feed.patch as Record<string, unknown> | undefined;
  const retention = feed.retention as Record<string, unknown> | undefined;
  return (
    typeof feed.retrievedAt === 'string' &&
    !!patch &&
    typeof patch.version === 'string' &&
    typeof patch.title === 'string' &&
    typeof patch.publishedAt === 'string' &&
    typeof patch.url === 'string' &&
    Array.isArray(patch.changes) &&
    patch.changes.length > 0 &&
    patch.changes.every(change => typeof change === 'string') &&
    !!retention &&
    typeof retention.sourceUrl === 'string' &&
    (retention.source === 'steamdb-export' || retention.source === 'steam') &&
    typeof retention.league === 'string' &&
    typeof retention.launchPlayers === 'number' &&
    typeof retention.lastSampledAt === 'string' &&
    Array.isArray(retention.days) &&
    Array.isArray(retention.values) &&
    retention.days.length === retention.values.length &&
    retention.days.length > 0 &&
    retention.days.every(day => typeof day === 'number') &&
    retention.values.every(item => typeof item === 'number') &&
    Array.isArray(retention.series) &&
    retention.series.length > 0 &&
    retention.series.every(
      item =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as { league?: unknown }).league === 'string' &&
        typeof (item as { launchPlayers?: unknown }).launchPlayers ===
          'number' &&
        Array.isArray((item as { values?: unknown }).values) &&
        Array.isArray((item as { players?: unknown }).players) &&
        (item as { values: unknown[] }).values.every(
          entry => typeof entry === 'number'
        )
    ) &&
    Array.isArray(retention.comparisons)
  );
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
