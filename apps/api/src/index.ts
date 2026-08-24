import { workspaceManifest } from '@exile-toolkit/data';

interface HealthReport {
  readonly service: 'exile-toolkit-api';
  readonly status: 'ok';
  readonly timestamp: string;
  readonly workspace: typeof workspaceManifest.name;
}

const jsonHeaders = {
  'cache-control': 'no-store',
  'content-type': 'application/json; charset=utf-8'
} as const;

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    headers: jsonHeaders,
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

      return json(report);
    }

    return json(
      {
        error: 'not_found',
        message: 'Route not found'
      },
      404
    );
  }
} satisfies ExportedHandler;
