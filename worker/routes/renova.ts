import { jsonResponse, logEvent, parseUpstreamPayload } from '../utils';

export async function handleRenovaSyncRequest(request: Request, env: Env): Promise<Response> {
  if (!env.RENOVA_WEBHOOK_URL) {
    logEvent('error', 'renova_missing_webhook_url');
    return jsonResponse(
      { message: 'Webhook Renova não configurado (RENOVA_WEBHOOK_URL ausente).' },
      503,
    );
  }

  try {
    const init: RequestInit = {
      method: request.method,
      headers: { Accept: 'application/json' },
    };

    if (request.method === 'POST') {
      init.body = await request.text();
      init.headers = {
        Accept: 'application/json',
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
      };
    }

    const upstream = await fetch(env.RENOVA_WEBHOOK_URL, init);
    const data = await parseUpstreamPayload(upstream);

    if (!upstream.ok) {
      logEvent('error', 'renova_upstream_error', { status: upstream.status });
      return jsonResponse(
        data ?? { message: `Erro no webhook Renova (${upstream.status}).` },
        upstream.status,
      );
    }

    logEvent('info', 'renova_sync_ok', { status: upstream.status });
    return jsonResponse(data ?? [], 200);
  } catch (error) {
    logEvent('error', 'renova_proxy_exception', {
      error: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse({ message: 'Erro interno ao sincronizar com Renova.' }, 502);
  }
}
