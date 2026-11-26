import { handleCodegenRequest } from './routes/codegen';
import {
  handleApiVersionRequest,
  handleGenerateCnpjRequest,
  handleGenerateCpfRequest,
  handleValidateCnpjRequest,
  handleValidateCpfRequest,
} from './routes/documents';
import { handleNotionDatabaseRequest } from './routes/notion';
import { handlePixRequest } from './routes/pix';
import { handleReciboRequest } from './routes/recibo';
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

    if (pathname === '/api/version') {
      if (method !== 'GET') {
        return jsonResponse({ message: 'Método não permitido. Use GET.' }, 405);
      }
      return handleApiVersionRequest(env);
    }

    if (pathname === '/api/pix') {
      if (method !== 'POST') {
        return jsonResponse({ message: 'Método não permitido. Use POST.' }, 405);
      }
      return handlePixRequest(request, env);
    }

    if (pathname === '/api/recibo') {
      if (method !== 'GET' && method !== 'POST') {
        return jsonResponse({ message: 'Método não permitido. Use GET ou POST.' }, 405);
      }
      return handleReciboRequest(request, env);
    }

    if (pathname === '/api/codegen') {
      if (method !== 'POST') {
        return jsonResponse({ message: 'Método não permitido. Use POST.' }, 405);
      }
      return handleCodegenRequest(request, env);
    }

    if (pathname === '/api/cpf/validate') {
      if (method !== 'GET') {
        return jsonResponse({ message: 'Método não permitido. Use GET.' }, 405);
      }
      return handleValidateCpfRequest(request, env);
    }

    if (pathname === '/api/cpf/generate') {
      if (method !== 'GET') {
        return jsonResponse({ message: 'Método não permitido. Use GET.' }, 405);
      }
      return handleGenerateCpfRequest(request, env);
    }

    if (pathname === '/api/cnpj/validate') {
      if (method !== 'GET') {
        return jsonResponse({ message: 'Método não permitido. Use GET.' }, 405);
      }
      return handleValidateCnpjRequest(request, env);
    }

    if (pathname === '/api/cnpj/generate') {
      if (method !== 'GET') {
        return jsonResponse({ message: 'Método não permitido. Use GET.' }, 405);
      }
      return handleGenerateCnpjRequest(request, env);
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
