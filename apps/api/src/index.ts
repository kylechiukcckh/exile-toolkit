import type { HealthReport } from '@exile-toolkit/contracts';
import { workspaceManifest } from '@exile-toolkit/data';

const jsonHeaders = {
  'cache-control': 'no-store',
  'content-type': 'application/json; charset=utf-8'
} as const;

function getAllowedOrigin(request: Request): string | undefined {
  const origin = request.headers.get('origin');
  if (!origin) {
    return undefined;
  }

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

function json(request: Request, body: unknown, status = 200): Response {
  const allowedOrigin = getAllowedOrigin(request);
  const headers = new Headers(jsonHeaders);

  if (allowedOrigin) {
    headers.set('access-control-allow-origin', allowedOrigin);
    headers.set('vary', 'Origin');
  }

  return Response.json(body, {
    headers,
    status
  });
}

export default {
  fetch(request: Request): Response {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/health') {
      const report: HealthReport = {
        service: 'exile-toolkit-api',
        status: 'ok',
        timestamp: new Date().toISOString(),
        workspace: workspaceManifest.name
      };

      return json(request, report);
    }

    return json(
      request,
      {
        error: 'not_found',
        message: 'Route not found'
      },
      404
    );
  }
} satisfies ExportedHandler;
