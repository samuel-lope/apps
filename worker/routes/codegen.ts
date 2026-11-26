import { getApiToken, missingTokenResponse, proxySamuelLopesApi } from '../apiClient';
import { jsonResponse } from '../utils';

interface CodegenPayload {
  seed?: unknown;
  formato?: unknown;
  caracteres?: unknown;
}

const VALID_MODES = new Set(['hex', 'base58', 'personal', 'senha']);
const VALID_BITS = new Set([16, 32, 64, 128, 256]);
const VALID_PASSWORD_FLAGS = new Set(['lma', 'lmi', 'n', 'ce', 'cp']);

export async function handleCodegenRequest(request: Request, env: Env): Promise<Response> {
  if (!getApiToken(env)) {
    return missingTokenResponse('codegen');
  }

  const url = new URL(request.url);
  const modo = url.searchParams.get('modo')?.trim() || '';

  if (!VALID_MODES.has(modo)) {
    return jsonResponse(
      { message: 'Parâmetro "modo" inválido. Use hex, base58, personal ou senha.' },
      400,
    );
  }

  let payload: CodegenPayload = {};
  const rawBody = await request.text();
  if (rawBody.trim()) {
    try {
      const parsed = JSON.parse(rawBody);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return jsonResponse({ message: 'Corpo JSON inválido.' }, 400);
      }
      payload = parsed as CodegenPayload;
    } catch {
      return jsonResponse({ message: 'Corpo JSON inválido.' }, 400);
    }
  }

  const sanitizedBody: Record<string, string> = {};
  for (const field of ['seed', 'formato', 'caracteres'] as const) {
    const raw = payload[field];
    if (raw === undefined || raw === null) continue;
    if (typeof raw !== 'string') {
      return jsonResponse({ message: `Campo "${field}" deve ser texto.` }, 400);
    }
    if (raw.length > 256) {
      return jsonResponse(
        { message: `Campo "${field}" deve ter no máximo 256 caracteres.` },
        400,
      );
    }
    if (raw) {
      sanitizedBody[field] = raw;
    }
  }

  const query = new URLSearchParams();
  query.set('modo', modo);

  if (modo === 'hex' || modo === 'base58') {
    const bitsParam = url.searchParams.get('bits')?.trim();
    if (bitsParam) {
      const bits = Number(bitsParam);
      if (!Number.isInteger(bits) || !VALID_BITS.has(bits)) {
        return jsonResponse(
          { message: 'Parâmetro "bits" deve ser 16, 32, 64, 128 ou 256.' },
          400,
        );
      }
      query.set('bits', String(bits));
    }
  } else if (modo === 'personal') {
    if (!sanitizedBody.formato?.trim() || !sanitizedBody.caracteres?.trim()) {
      return jsonResponse(
        { message: 'Para o modo "personal", informe "formato" e "caracteres" no corpo JSON.' },
        400,
      );
    }
  } else if (modo === 'senha') {
    const qtdParam = url.searchParams.get('qtdcarac')?.trim() || '';
    const qtd = Number(qtdParam);
    if (!qtdParam || !Number.isInteger(qtd) || qtd < 1 || qtd > 256) {
      return jsonResponse(
        { message: 'Parâmetro "qtdcarac" é obrigatório e deve ser um inteiro entre 1 e 256.' },
        400,
      );
    }
    query.set('qtdcarac', String(qtd));

    const tipoParam = url.searchParams.get('tipocarac')?.trim() || '';
    const flags = tipoParam
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (flags.length === 0 || flags.some((flag) => !VALID_PASSWORD_FLAGS.has(flag))) {
      return jsonResponse(
        {
          message:
            'Parâmetro "tipocarac" é obrigatório e aceita apenas: lma, lmi, n, ce, cp.',
        },
        400,
      );
    }
    query.set('tipocarac', flags.join(','));

    const carp = url.searchParams.get('carp') ?? '';
    if (flags.includes('cp') && !carp) {
      return jsonResponse(
        { message: 'Parâmetro "carp" é obrigatório quando "cp" está ativo em "tipocarac".' },
        400,
      );
    }
    if (carp) {
      query.set('carp', carp);
    }
  }

  return proxySamuelLopesApi(env, {
    path: '/v1/codegen',
    method: 'POST',
    query,
    body: sanitizedBody,
    logPrefix: 'codegen',
  });
}
