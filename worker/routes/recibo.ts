import { getApiToken, missingTokenResponse, proxySamuelLopesApi } from '../apiClient';
import { jsonResponse } from '../utils';

interface ReciboPayload {
  nomePagador?: unknown;
  cpfPagador?: unknown;
  enderecoPagador?: unknown;
  nomeRecebedor?: unknown;
  cpfRecebedor?: unknown;
  enderecoRecebedor?: unknown;
  valor?: unknown;
  referente?: unknown;
  formaPagamento?: unknown;
  data?: unknown;
  cidade?: unknown;
  observacoes?: unknown;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const OPTIONAL_STRING_FIELDS = [
  'cpfPagador',
  'enderecoPagador',
  'cpfRecebedor',
  'enderecoRecebedor',
  'referente',
  'formaPagamento',
  'cidade',
  'observacoes',
] as const;

function parsePositiveValor(raw: unknown): number | null {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw > 0 ? Number(raw.toFixed(2)) : null;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const normalized = trimmed.includes(',')
      ? trimmed.replace(/\./g, '').replace(',', '.')
      : trimmed;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed > 0 ? Number(parsed.toFixed(2)) : null;
  }
  return null;
}

function isValidObjetoFlag(val: string | null): boolean {
  return val === 'true' || val === '1';
}

export async function handleReciboRequest(request: Request, env: Env): Promise<Response> {
  if (!getApiToken(env)) {
    return missingTokenResponse('recibo');
  }

  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  if (method === 'GET') {
    const objetoParam = url.searchParams.get('objeto');
    if (objetoParam !== null && !isValidObjetoFlag(objetoParam)) {
      return jsonResponse({ message: 'Parâmetro "objeto" deve ser "true" ou "1".' }, 400);
    }

    const valor = url.searchParams.get('valor')?.trim() || '';
    const validaCPF = url.searchParams.get('validaCPF')?.trim() || '';
    const validaCNPJ = url.searchParams.get('validaCNPJ')?.trim() || '';

    if (!valor && !validaCPF && !validaCNPJ) {
      return jsonResponse(
        { message: 'Informe ao menos um parâmetro: valor, validaCPF ou validaCNPJ.' },
        400,
      );
    }

    const query = new URLSearchParams();
    query.set('objeto', objetoParam ?? 'true');
    if (valor) query.set('valor', valor);
    if (validaCPF) query.set('validaCPF', validaCPF);
    if (validaCNPJ) query.set('validaCNPJ', validaCNPJ);

    return proxySamuelLopesApi(env, {
      path: '/v1/recibo',
      method: 'GET',
      query,
      logPrefix: 'recibo_utils',
    });
  }

  const objetoParam = url.searchParams.get('objeto');
  if (objetoParam !== null && !isValidObjetoFlag(objetoParam)) {
    return jsonResponse({ message: 'Parâmetro "objeto" deve ser "true" ou "1".' }, 400);
  }

  let payload: ReciboPayload;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return jsonResponse({ message: 'Corpo JSON inválido.' }, 400);
    }
    payload = parsed as ReciboPayload;
  } catch {
    return jsonResponse({ message: 'Corpo JSON inválido.' }, 400);
  }

  const nomePagador = typeof payload.nomePagador === 'string' ? payload.nomePagador.trim() : '';
  const nomeRecebedor =
    typeof payload.nomeRecebedor === 'string' ? payload.nomeRecebedor.trim() : '';
  const data = typeof payload.data === 'string' ? payload.data.trim() : '';
  const valor = parsePositiveValor(payload.valor);

  if (!nomePagador || !nomeRecebedor || !data || valor === null) {
    return jsonResponse(
      {
        message:
          'Campos obrigatórios ausentes ou inválidos: nomePagador, nomeRecebedor, valor (> 0) e data (YYYY-MM-DD).',
      },
      400,
    );
  }

  if (!DATE_PATTERN.test(data)) {
    return jsonResponse({ message: 'Campo "data" deve estar no formato YYYY-MM-DD.' }, 400);
  }

  const sanitized: Record<string, unknown> = {
    nomePagador,
    nomeRecebedor,
    valor,
    data,
  };

  for (const field of OPTIONAL_STRING_FIELDS) {
    const raw = payload[field];
    if (raw === undefined || raw === null) continue;
    if (typeof raw !== 'string') {
      return jsonResponse({ message: `Campo "${field}" deve ser texto.` }, 400);
    }
    const trimmed = raw.trim();
    if (trimmed) {
      sanitized[field] = trimmed;
    }
  }

  const query = new URLSearchParams();
  const expectHtml = objetoParam === null;
  if (objetoParam !== null) {
    query.set('objeto', objetoParam);
  }

  return proxySamuelLopesApi(env, {
    path: '/v1/recibo',
    method: 'POST',
    query,
    body: sanitized,
    expectHtml,
    logPrefix: 'recibo',
  });
}
