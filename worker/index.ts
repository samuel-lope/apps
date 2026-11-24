import { handleNotionDatabaseRequest } from './routes/notion';
import { handlePixRequest } from './routes/pix';
import { handleRenovaSyncRequest } from './routes/renova';
import { jsonResponse, logEvent } from './utils';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method.toUpperCase();

    if (pathname === '/api/health') {
      if (method !== 'GET') {
        return jsonResponse({ message: 'Método não permitido.' }, 405);
      }
      return jsonResponse({ status: 'ok', service: 'samuel-lopes-apps' }, 200);
    }

    if (pathname === '/api/pix') {
      if (method !== 'POST') {
        return jsonResponse({ message: 'Método não permitido. Use POST.' }, 405);
      }
      return handlePixRequest(request, env);
    }

    if (pathname === '/api/notion/database') {
      if (method !== 'POST') {
        return jsonResponse({ message: 'Método não permitido. Use POST.' }, 405);
      }
      return handleNotionDatabaseRequest(request);
    }

    if (pathname === '/api/renova/sync') {
      if (method !== 'GET' && method !== 'POST') {
        return jsonResponse({ message: 'Método não permitido. Use GET ou POST.' }, 405);
      }
      return handleRenovaSyncRequest(request, env);
    }

    logEvent('info', 'api_not_found', { method, pathname });
    return jsonResponse({ error: 'Not Found' }, 404);
  },
} satisfies ExportedHandler<Env>;
