import {
  isAnalyticsEvent,
  type HealthReport,
  type PublicErrorResponse
} from '@exile-toolkit/contracts';
import { workspaceManifest } from '@exile-toolkit/data';

const jsonHeaders = {
  'cache-control': 'no-store',
  'content-type': 'application/json; charset=utf-8'
} as const;

interface WorkerRequestLogRecord {
  readonly event: 'worker_request';
  readonly requestId: string;
  readonly method: string;
  readonly route: 'health' | 'events' | 'not_found' | 'unparsed';
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
  log: WorkerLogger = record => console.log(JSON.stringify(record))
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
