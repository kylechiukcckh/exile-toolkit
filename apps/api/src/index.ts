import {
  isAnalyticsEvent,
  type HealthReport,
  type PublicErrorResponse,
  type DisenchantPriceSnapshotResponse
} from '@exile-toolkit/contracts';
import { workspaceManifest } from '@exile-toolkit/data';
import { disenchantDataset } from '@exile-toolkit/data/disenchant';
import {
  normalizePoeNinjaItem,
  priceSnapshotFreshness,
  validatePriceSnapshot,
  workspaceLeagues,
  type DisenchantCategory,
  type PriceSnapshot,
  type WorkspaceLeague
} from '@exile-toolkit/domain';

const jsonHeaders = {
  'cache-control': 'no-store',
  'content-type': 'application/json; charset=utf-8'
} as const;

interface WorkerRequestLogRecord {
  readonly event: 'worker_request';
  readonly requestId: string;
  readonly method: string;
  readonly route:
    | 'health'
    | 'events'
    | 'disenchant_price_snapshot'
    | 'not_found'
    | 'unparsed';
  readonly status: number;
  readonly durationMs: number;
  readonly errorCode?: PublicErrorResponse['error']['code'];
}

interface AnalyticsLogRecord {
  readonly event: 'analytics_event';
  readonly requestId: string;
  readonly name: 'page_view' | 'tool_open';
  readonly pageId?: string;
  readonly toolId?: string;
}

interface PriceRefreshFailureLogRecord {
  readonly event: 'price_snapshot_refresh_failed';
  readonly requestId: string;
  readonly resource: 'leagues' | 'weapon' | 'armour' | 'accessory' | 'currency';
}

type WorkerLogger = (
  record:
    WorkerRequestLogRecord | AnalyticsLogRecord | PriceRefreshFailureLogRecord
) => void;

export interface PriceSnapshotStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

const priceSnapshotKey = 'disenchant:complete';

function priceSnapshotKeyFor(league: WorkspaceLeague) {
  return league === 'Allflame'
    ? priceSnapshotKey
    : `${priceSnapshotKey}:${league}`;
}

export function createWorker(
  log: WorkerLogger = record => console.log(JSON.stringify(record)),
  requestUpstream: typeof fetch = fetch,
  priceSnapshotStore?: PriceSnapshotStore,
  timeoutMs = upstreamTimeoutMs
) {
  const latestCompletePriceSnapshots = new Map<
    WorkspaceLeague,
    PriceSnapshot
  >();
  const upstreamResources = new Map<string, CachedUpstreamResource>();

  return {
    async fetch(request: Request): Promise<Response> {
      const requestId = crypto.randomUUID();
      const startedAt = Date.now();
      let method = 'UNKNOWN';
      let route: WorkerRequestLogRecord['route'] = 'unparsed';

      try {
        method = request.method;
        const pathname = new URL(request.url).pathname;
        route =
          pathname === '/health'
            ? 'health'
            : pathname === '/events'
              ? 'events'
              : pathname === '/price-snapshots/disenchant'
                ? 'disenchant_price_snapshot'
                : 'not_found';

        if (method === 'OPTIONS' && route === 'events') {
          return loggedResponse(log, preflight(request, requestId), {
            requestId,
            method,
            route,
            startedAt
          });
        }

        if (method === 'GET' && route === 'health') {
          const report: HealthReport = {
            service: 'exile-toolkit-api',
            status: 'ok',
            timestamp: new Date().toISOString(),
            workspace: workspaceManifest.name
          };
          return loggedResponse(log, json(request, report, requestId), {
            requestId,
            method,
            route,
            startedAt
          });
        }

        if (method === 'GET' && route === 'disenchant_price_snapshot') {
          const requestedLeague = readRequestedLeague(request);
          try {
            const refresh = await fetchDisenchantPriceSnapshot(
              requestUpstream,
              upstreamResources,
              timeoutMs,
              requestedLeague
            );
            upstreamResources.clear();
            for (const [url, cached] of refresh.resources) {
              upstreamResources.set(url, cached);
            }
            const snapshot = refresh.snapshot;
            latestCompletePriceSnapshots.set(requestedLeague, snapshot);
            await priceSnapshotStore?.put(
              priceSnapshotKeyFor(requestedLeague),
              JSON.stringify(snapshot)
            );
            const body: DisenchantPriceSnapshotResponse = {
              snapshot,
              dustDatasetVersion: disenchantDataset.version
            };
            return loggedResponse(log, json(request, body, requestId), {
              requestId,
              method,
              route,
              startedAt
            });
          } catch (error) {
            if (error instanceof UpstreamPriceError) {
              log({
                event: 'price_snapshot_refresh_failed',
                requestId,
                resource: error.resource
              });
              const retainedSnapshot =
                latestCompletePriceSnapshots.get(requestedLeague) ??
                (await readStoredPriceSnapshot(
                  priceSnapshotStore,
                  requestedLeague
                ));
              if (
                retainedSnapshot &&
                priceSnapshotFreshness(
                  new Date(retainedSnapshot.retrievedAt).getTime(),
                  Date.now()
                ) !== 'expired'
              ) {
                const body: DisenchantPriceSnapshotResponse = {
                  snapshot: retainedSnapshot,
                  dustDatasetVersion: disenchantDataset.version
                };
                return loggedResponse(log, json(request, body, requestId), {
                  requestId,
                  method,
                  route,
                  startedAt
                });
              }
              return loggedResponse(
                log,
                publicError(
                  request,
                  requestId,
                  'upstream_unavailable',
                  'Market prices are temporarily unavailable.',
                  503
                ),
                {
                  requestId,
                  method,
                  route,
                  startedAt,
                  errorCode: 'upstream_unavailable'
                }
              );
            }
            throw error;
          }
        }

        if (method === 'POST' && route === 'events') {
          const event: unknown = await request.json();
          if (!isAnalyticsEvent(event)) {
            return loggedResponse(
              log,
              publicError(
                request,
                requestId,
                'invalid_event',
                'The analytics event was not accepted.',
                400
              ),
              {
                requestId,
                method,
                route,
                startedAt,
                errorCode: 'invalid_event'
              }
            );
          }

          log({
            event: 'analytics_event',
            requestId,
            name: event.event,
            ...(event.event === 'page_view'
              ? { pageId: event.pageId }
              : { toolId: event.toolId })
          });

          return loggedResponse(
            log,
            json(request, { accepted: true }, requestId, 202),
            { requestId, method, route, startedAt }
          );
        }

        return loggedResponse(
          log,
          publicError(request, requestId, 'not_found', 'Route not found', 404),
          {
            requestId,
            method,
            route,
            startedAt,
            errorCode: 'not_found'
          }
        );
      } catch {
        return loggedResponse(
          log,
          publicError(
            request,
            requestId,
            'internal_error',
            'The service could not complete this request.',
            500
          ),
          {
            requestId,
            method,
            route,
            startedAt,
            errorCode: 'internal_error'
          }
        );
      }
    }
  } satisfies ExportedHandler;
}

function loggedResponse(
  log: WorkerLogger,
  response: Response,
  context: Omit<WorkerRequestLogRecord, 'event' | 'status' | 'durationMs'> & {
    readonly startedAt: number;
  }
) {
  log({
    event: 'worker_request',
    requestId: context.requestId,
    method: context.method,
    route: context.route,
    status: response.status,
    durationMs: Date.now() - context.startedAt,
    ...(context.errorCode ? { errorCode: context.errorCode } : {})
  });
  return response;
}

function publicError(
  request: Request,
  requestId: string,
  code: PublicErrorResponse['error']['code'],
  message: string,
  status: number
) {
  const body: PublicErrorResponse = { error: { code, message, requestId } };
  return json(request, body, requestId, status);
}

function getAllowedOrigin(request: Request): string | undefined {
  const origin = request.headers.get('origin');
  if (!origin) return undefined;

  try {
    const url = new URL(origin);
    const isLocalWebApp = url.origin === 'http://127.0.0.1:4173';
    const isPagesPreview =
      url.protocol === 'https:' &&
      (url.hostname === 'exile-toolkit.pages.dev' ||
        url.hostname.endsWith('.exile-toolkit.pages.dev'));
    return isLocalWebApp || isPagesPreview ? url.origin : undefined;
  } catch {
    return undefined;
  }
}

function json(
  request: Request,
  body: unknown,
  requestId: string,
  status = 200
): Response {
  const headers = new Headers(jsonHeaders);
  headers.set('x-request-id', requestId);
  const allowedOrigin = getAllowedOrigin(request);
  if (allowedOrigin) {
    headers.set('access-control-allow-origin', allowedOrigin);
    headers.set('vary', 'Origin');
  }
  return Response.json(body, { headers, status });
}

function preflight(request: Request, requestId: string) {
  const headers = new Headers({
    'cache-control': 'no-store',
    'x-request-id': requestId
  });
  const allowedOrigin = getAllowedOrigin(request);
  if (allowedOrigin) {
    headers.set('access-control-allow-origin', allowedOrigin);
    headers.set('access-control-allow-methods', 'POST');
    headers.set('access-control-allow-headers', 'content-type');
    headers.set('vary', 'Origin');
  }
  return new Response(null, { headers, status: 204 });
}

let productionWorker: ReturnType<typeof createWorker> | undefined;

export default {
  fetch(request: Request, env?: { PRICE_SNAPSHOTS: KVNamespace }) {
    productionWorker ??= createWorker(undefined, fetch, env?.PRICE_SNAPSHOTS);
    return productionWorker.fetch(request);
  }
} satisfies ExportedHandler<{ PRICE_SNAPSHOTS: KVNamespace }>;

const poeNinjaBaseUrl = 'https://poe.ninja/poe1/api/economy';
const poeNinjaHeaders = {
  'user-agent': 'Exile Toolkit/0.1 (https://exile-toolkit.pages.dev)'
};
const upstreamTimeoutMs = 8_000;

interface CachedUpstreamResource {
  readonly etag: string;
  readonly value: unknown;
}

async function readStoredPriceSnapshot(
  store: PriceSnapshotStore | undefined,
  league: WorkspaceLeague
) {
  if (!store) return undefined;
  try {
    const stored = await store.get(priceSnapshotKeyFor(league));
    if (!stored) return undefined;
    const validation = validatePriceSnapshot(JSON.parse(stored));
    return validation.valid ? validation.snapshot : undefined;
  } catch {
    return undefined;
  }
}

class UpstreamPriceError extends Error {
  constructor(
    readonly resource:
      'leagues' | 'weapon' | 'armour' | 'accessory' | 'currency'
  ) {
    super('Price source is unavailable');
  }
}

async function fetchDisenchantPriceSnapshot(
  requestUpstream: typeof fetch,
  upstreamResources: Map<string, CachedUpstreamResource>,
  timeoutMs: number,
  requestedLeague: WorkspaceLeague
): Promise<{
  snapshot: PriceSnapshot;
  resources: Map<string, CachedUpstreamResource>;
}> {
  const refreshResources = new Map(upstreamResources);
  const leagues = await fetchJson(
    requestUpstream,
    `${poeNinjaBaseUrl}/leagues`,
    'leagues',
    refreshResources,
    timeoutMs
  );
  const activeLeague = readActiveLeague(leagues, requestedLeague);
  const [weapon, armour, accessory, currency] = await Promise.all([
    fetchItemCategory(
      requestUpstream,
      refreshResources,
      activeLeague,
      'UniqueWeapon',
      'weapon',
      timeoutMs
    ),
    fetchItemCategory(
      requestUpstream,
      refreshResources,
      activeLeague,
      'UniqueArmour',
      'armour',
      timeoutMs
    ),
    fetchItemCategory(
      requestUpstream,
      refreshResources,
      activeLeague,
      'UniqueAccessory',
      'accessory',
      timeoutMs
    ),
    fetchJson(
      requestUpstream,
      poeNinjaUrl('stash/current/currency/overview', activeLeague, 'Currency'),
      'currency',
      refreshResources,
      timeoutMs
    )
  ]);
  const catalystToChaos = readCatalystToChaos(currency);
  const snapshot = {
    activeLeague,
    source: 'poe.ninja' as const,
    retrievedAt: new Date().toISOString(),
    divineToChaos: readDivineToChaos(currency),
    ...(catalystToChaos === undefined ? {} : { catalystToChaos }),
    categories: { weapon, armour, accessory }
  };
  const validation = validatePriceSnapshot(snapshot);
  if (!validation.valid) throw new UpstreamPriceError('currency');
  return { snapshot: validation.snapshot, resources: refreshResources };
}

async function fetchItemCategory(
  requestUpstream: typeof fetch,
  upstreamResources: Map<string, CachedUpstreamResource>,
  league: WorkspaceLeague,
  upstreamType: 'UniqueWeapon' | 'UniqueArmour' | 'UniqueAccessory',
  category: DisenchantCategory,
  timeoutMs: number
) {
  const payload = await fetchJson(
    requestUpstream,
    poeNinjaUrl('stash/current/item/overview', league, upstreamType),
    category,
    upstreamResources,
    timeoutMs
  );
  if (!isRecord(payload) || !Array.isArray(payload.lines)) {
    throw new UpstreamPriceError(category);
  }
  return payload.lines.map(line => normalizeItemLine(line, category));
}

async function fetchJson(
  requestUpstream: typeof fetch,
  url: string,
  resource: UpstreamPriceError['resource'],
  upstreamResources: Map<string, CachedUpstreamResource>,
  timeoutMs: number
) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const cached = upstreamResources.get(url);
      const headers = new Headers(poeNinjaHeaders);
      if (cached) headers.set('if-none-match', cached.etag);
      const response = await requestUpstream(url, {
        headers,
        signal: controller.signal
      });
      if (response.status === 304 && cached) return cached.value;
      if (!response.ok) throw new UpstreamPriceError(resource);
      const value = (await response.json()) as unknown;
      const etag = response.headers.get('etag');
      if (etag) upstreamResources.set(url, { etag, value });
      return value;
    } catch {
      if (attempt === 1) {
        throw new UpstreamPriceError(resource);
      }
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new UpstreamPriceError(resource);
}

function poeNinjaUrl(path: string, league: string, type: string) {
  const url = new URL(`${poeNinjaBaseUrl}/${path}`);
  url.searchParams.set('league', league);
  url.searchParams.set('type', type);
  return url.toString();
}

function readActiveLeague(
  value: unknown,
  requestedLeague: WorkspaceLeague
): WorkspaceLeague {
  if (
    !Array.isArray(value) ||
    !value.some(league => isRecord(league) && league.id === requestedLeague)
  ) {
    throw new UpstreamPriceError('leagues');
  }
  return requestedLeague;
}

function readRequestedLeague(request: Request): WorkspaceLeague {
  const requested = new URL(request.url).searchParams.get('league');
  return workspaceLeagues.includes(requested as WorkspaceLeague)
    ? (requested as WorkspaceLeague)
    : workspaceLeagues[0];
}

function readDivineToChaos(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.lines)) {
    throw new UpstreamPriceError('currency');
  }
  const divine = value.lines.find(
    line => isRecord(line) && line.currencyTypeName === 'Divine Orb'
  );
  if (!isRecord(divine) || !isPositiveNumber(divine.chaosEquivalent)) {
    throw new UpstreamPriceError('currency');
  }
  return divine.chaosEquivalent;
}

function readCatalystToChaos(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.lines)) return undefined;
  const prices = value.lines.flatMap(line =>
    isRecord(line) &&
    typeof line.currencyTypeName === 'string' &&
    line.currencyTypeName.endsWith(' Catalyst') &&
    line.currencyTypeName !== 'Tainted Catalyst' &&
    isPositiveNumber(line.chaosEquivalent)
      ? [line.chaosEquivalent]
      : []
  );
  return prices.length > 0 ? Math.min(...prices) : undefined;
}

function normalizeItemLine(value: unknown, category: DisenchantCategory) {
  if (
    !isRecord(value) ||
    !isSafeInteger(value.id) ||
    !isNonEmptyString(value.name) ||
    !isNonEmptyString(value.baseType) ||
    !isNonEmptyString(value.detailsId)
  ) {
    throw new UpstreamPriceError(category);
  }
  return normalizePoeNinjaItem({
    id: value.id,
    name: value.name,
    baseType: value.baseType,
    category,
    ...(isNonEmptyString(value.variant) ? { variant: value.variant } : {}),
    chaosValue: isFiniteNumber(value.chaosValue) ? value.chaosValue : 0,
    ...(isNonNegativeInteger(value.listingCount)
      ? { listingCount: value.listingCount }
      : isNonNegativeInteger(value.count)
        ? { count: value.count }
        : {}),
    detailsId: value.detailsId,
    ...(isNonEmptyString(value.icon) ? { icon: value.icon } : {})
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPositiveNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function isSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value);
}
