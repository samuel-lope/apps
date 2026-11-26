import { jsonResponse, logEvent, parseUpstreamPayload } from './utils';

export const DEFAULT_API_BASE_URL = 'https://api.samuellopes.com.br';

export function getApiToken(env: Env): string | null {
  return env.APIS_ACCES_TOKEN?.trim() || env.TOKEN?.trim() || null;
}

export function getApiBaseUrl(env: Env): string {
  return (env.API_BASE_URL?.trim() || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
}

export function missingTokenResponse(logPrefix: string): Response {
  logEvent('error', `${logPrefix}_missing_token`);
  return jsonResponse({ message: 'Serviço não configurado (APIS_ACCES_TOKEN ausente).' }, 503);
}

export function normalizeUpstreamError(
  data: unknown,
  fallbackMessage: string,
): Record<string, unknown> {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    const rawMsg =
      (typeof obj.message === 'string' && obj.message.trim()) ||
      (typeof obj.error === 'string' && obj.error.trim()) ||
      (typeof obj.erro === 'string' && obj.erro.trim()) ||
      fallbackMessage;
    return { ...obj, message: rawMsg };
  }
  return { message: fallbackMessage };
}

export interface ProxyApiOptions {
  path: string;
  method: 'GET' | 'POST';
  query?: URLSearchParams;
  body?: unknown;
  requireAuth?: boolean;
  expectHtml?: boolean;
  logPrefix: string;
}

export async function proxySamuelLopesApi(
  env: Env,
  options: ProxyApiOptions,
): Promise<Response> {
  const requireAuth = options.requireAuth ?? true;
  let token: string | null = null;

  if (requireAuth) {
    token = getApiToken(env);
    if (!token) {
      return missingTokenResponse(options.logPrefix);
    }
  }

  const queryString = options.query ? options.query.toString() : '';
  const url = `${getApiBaseUrl(env)}${options.path}${queryString ? `?${queryString}` : ''}`;

  const headers: Record<string, string> = {
    Accept: options.expectHtml ? 'text/html, application/json' : 'application/json',
  };

  if (requireAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const init: RequestInit = {
    method: options.method,
    headers,
  };

  if (options.method === 'POST' && options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(options.body);
  }

  try {
    const upstream = await fetch(url, init);

    if (!upstream.ok) {
      const data = await parseUpstreamPayload(upstream);
      logEvent('error', `${options.logPrefix}_upstream_error`, { status: upstream.status });
      return jsonResponse(
        normalizeUpstreamError(data, `Erro na API (${upstream.status}).`),
        upstream.status,
      );
    }

    const contentType = upstream.headers.get('content-type') || '';
    if (options.expectHtml && contentType.includes('text/html')) {
      const html = await upstream.text();
      logEvent('info', `${options.logPrefix}_ok`, { status: upstream.status });
      return new Response(html, {
        status: upstream.status,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const data = await parseUpstreamPayload(upstream);
    logEvent('info', `${options.logPrefix}_ok`, { status: upstream.status });
    return jsonResponse(data ?? {}, upstream.status);
  } catch (error) {
    logEvent('error', `${options.logPrefix}_proxy_exception`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse({ message: 'Erro interno ao comunicar com a API externa.' }, 502);
  }
}
