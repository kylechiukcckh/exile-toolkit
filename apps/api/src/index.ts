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
  validatePriceSnapshot,
  type DisenchantCategory,
  type PriceSnapshot
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

type WorkerLogger = (
  record: WorkerRequestLogRecord | AnalyticsLogRecord
) => void;

export function createWorker(
  log: WorkerLogger = record => console.log(JSON.stringify(record)),
  requestUpstream: typeof fetch = fetch
) {
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
          try {
            const snapshot =
              await fetchDisenchantPriceSnapshot(requestUpstream);
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

export default createWorker();

const poeNinjaBaseUrl = 'https://poe.ninja/poe1/api/economy';
const poeNinjaHeaders = {
  'user-agent': 'Exile Toolkit/0.1 (https://exile-toolkit.pages.dev)'
};

class UpstreamPriceError extends Error {}

async function fetchDisenchantPriceSnapshot(
  requestUpstream: typeof fetch
): Promise<PriceSnapshot> {
  const leagues = await fetchJson(
    requestUpstream,
    `${poeNinjaBaseUrl}/leagues`
  );
  const activeLeague = readActiveLeague(leagues);
  const [weapon, armour, accessory, currency] = await Promise.all([
    fetchItemCategory(requestUpstream, activeLeague, 'UniqueWeapon', 'weapon'),
    fetchItemCategory(requestUpstream, activeLeague, 'UniqueArmour', 'armour'),
    fetchItemCategory(
      requestUpstream,
      activeLeague,
      'UniqueAccessory',
      'accessory'
    ),
    fetchJson(
      requestUpstream,
      poeNinjaUrl('stash/current/currency/overview', activeLeague, 'Currency')
    )
  ]);
  const snapshot = {
    activeLeague,
    source: 'poe.ninja' as const,
    retrievedAt: new Date().toISOString(),
    divineToChaos: readDivineToChaos(currency),
    categories: { weapon, armour, accessory }
  };
  const validation = validatePriceSnapshot(snapshot);
  if (!validation.valid) throw new UpstreamPriceError('Invalid price snapshot');
  return validation.snapshot;
}

async function fetchItemCategory(
  requestUpstream: typeof fetch,
  league: string,
  upstreamType: 'UniqueWeapon' | 'UniqueArmour' | 'UniqueAccessory',
  category: DisenchantCategory
) {
  const payload = await fetchJson(
    requestUpstream,
    poeNinjaUrl('stash/current/item/overview', league, upstreamType)
  );
  if (!isRecord(payload) || !Array.isArray(payload.lines)) {
    throw new UpstreamPriceError('Invalid item overview');
  }
  return payload.lines.map((line, index) =>
    normalizeItemLine(line, category, index)
  );
}

async function fetchJson(requestUpstream: typeof fetch, url: string) {
  let response: Response;
  try {
    response = await requestUpstream(url, { headers: poeNinjaHeaders });
  } catch {
    throw new UpstreamPriceError('Could not fetch price data');
  }
  if (!response.ok)
    throw new UpstreamPriceError('Price source returned an error');
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new UpstreamPriceError('Price source returned invalid JSON');
  }
}

function poeNinjaUrl(path: string, league: string, type: string) {
  const url = new URL(`${poeNinjaBaseUrl}/${path}`);
  url.searchParams.set('league', league);
  url.searchParams.set('type', type);
  return url.toString();
}

function readActiveLeague(value: unknown) {
  if (
    !Array.isArray(value) ||
    !isRecord(value[0]) ||
    !isNonEmptyString(value[0].id)
  ) {
    throw new UpstreamPriceError('No active league');
  }
  return value[0].id;
}

function readDivineToChaos(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.lines)) {
    throw new UpstreamPriceError('Invalid currency overview');
  }
  const divine = value.lines.find(
    line => isRecord(line) && line.currencyTypeName === 'Divine Orb'
  );
  if (!isRecord(divine) || !isPositiveNumber(divine.chaosEquivalent)) {
    throw new UpstreamPriceError('No Divine-to-Chaos rate');
  }
  return divine.chaosEquivalent;
}

function normalizeItemLine(
  value: unknown,
  category: DisenchantCategory,
  index: number
) {
  if (
    !isRecord(value) ||
    !isSafeInteger(value.id) ||
    !isNonEmptyString(value.name) ||
    !isNonEmptyString(value.baseType) ||
    !isNonEmptyString(value.detailsId)
  ) {
    throw new UpstreamPriceError(`Invalid item overview line ${index}`);
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
