import { jsonResponse, logEvent, parseUpstreamPayload } from '../utils';

interface PixPayload {
  pixKey?: unknown;
  merchantName?: unknown;
  merchantCity?: unknown;
  amount?: unknown;
  qrECL?: unknown;
  qrCellSize?: unknown;
  qrMargin?: unknown;
  txid?: unknown;
  description?: unknown;
}

const PIX_UPSTREAM_URL = 'https://api.samuellopes.com.br/v1/codepix';

export async function handlePixRequest(request: Request, env: Env): Promise<Response> {
  if (!env.TOKEN) {
    logEvent('error', 'pix_missing_token');
    return jsonResponse({ message: 'Serviço PIX não configurado (TOKEN ausente).' }, 503);
  }

  let payload: PixPayload;
  try {
    payload = (await request.json()) as PixPayload;
  } catch {
    return jsonResponse({ message: 'Corpo JSON inválido.' }, 400);
  }

  const pixKey = typeof payload.pixKey === 'string' ? payload.pixKey.trim() : '';
  const merchantName = typeof payload.merchantName === 'string' ? payload.merchantName.trim() : '';
  const merchantCity = typeof payload.merchantCity === 'string' ? payload.merchantCity.trim() : '';

  if (!pixKey || !merchantName || !merchantCity) {
    return jsonResponse(
      { message: 'Campos obrigatórios ausentes: pixKey, merchantName e merchantCity.' },
      400,
    );
  }

  try {
    const apiResponse = await fetch(PIX_UPSTREAM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await parseUpstreamPayload(apiResponse);

    if (!apiResponse.ok) {
      logEvent('error', 'pix_upstream_error', { status: apiResponse.status });
      return jsonResponse(
        data ?? { message: `Erro na API PIX (${apiResponse.status}).` },
        apiResponse.status,
      );
    }

    logEvent('info', 'pix_generated', { status: apiResponse.status });
    return jsonResponse(data, 200);
  } catch (error) {
    logEvent('error', 'pix_proxy_exception', {
      error: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse({ message: 'Erro interno no proxy PIX.' }, 502);
  }
}
