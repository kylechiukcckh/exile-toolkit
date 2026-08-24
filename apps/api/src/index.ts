import { createHealthReport } from '@exile-toolkit/domain';

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
      return json(createHealthReport(new Date().toISOString()));
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
