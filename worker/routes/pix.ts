import { getApiToken, missingTokenResponse, proxySamuelLopesApi } from '../apiClient';
import { jsonResponse } from '../utils';

interface PixPayload {
  pixKey?: unknown;
  pixKeyType?: unknown;
  merchantName?: unknown;
  merchantCity?: unknown;
  amount?: unknown;
  qrECL?: unknown;
  qrCellSize?: unknown;
  qrMargin?: unknown;
  txid?: unknown;
  description?: unknown;
}

const VALID_KEY_TYPES = new Set([
  'CPF',
  'CNPJ',
  'PHONE',
  'TELEFONE',
  'CELULAR',
  'EMAIL',
  'EVP',
  'ALEATORIA',
]);

const VALID_QR_ECL = new Set(['Q', 'H']);

function parsePositiveAmount(raw: unknown): { ok: true; value?: number } | { ok: false } {
  if (raw === undefined || raw === null) return { ok: true };
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return { ok: true };
    const normalized = trimmed.includes(',')
      ? trimmed.replace(/\./g, '').replace(',', '.')
      : trimmed;
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed < 0) return { ok: false };
    if (parsed === 0) return { ok: true };
    return { ok: true, value: Number(parsed.toFixed(2)) };
  }
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || raw < 0) return { ok: false };
    if (raw === 0) return { ok: true };
    return { ok: true, value: Number(raw.toFixed(2)) };
  }
  return { ok: false };
}

function parseIntRange(
  raw: unknown,
  min: number,
  max: number,
): { ok: true; value?: number } | { ok: false } {
  if (raw === undefined || raw === null || raw === '') return { ok: true };
  const num = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isInteger(num) || num < min || num > max) {
    return { ok: false };
  }
  return { ok: true, value: num };
}

export async function handlePixRequest(request: Request, env: Env): Promise<Response> {
  if (!getApiToken(env)) {
    return missingTokenResponse('pix');
  }

  let payload: PixPayload;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return jsonResponse({ message: 'Corpo JSON inválido.' }, 400);
    }
    payload = parsed as PixPayload;
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

  if (merchantName.length > 25) {
    return jsonResponse(
      { message: 'O campo merchantName deve ter no máximo 25 caracteres.' },
      400,
    );
  }

  if (merchantCity.length > 15) {
    return jsonResponse(
      { message: 'O campo merchantCity deve ter no máximo 15 caracteres.' },
      400,
    );
  }

  const sanitized: Record<string, unknown> = {
    pixKey,
    merchantName,
    merchantCity,
  };

  if (payload.pixKeyType !== undefined && payload.pixKeyType !== null) {
    if (typeof payload.pixKeyType !== 'string') {
      return jsonResponse({ message: 'Tipo de chave PIX inválido.' }, 400);
    }
    const keyType = payload.pixKeyType.trim().toUpperCase();
    if (keyType) {
      if (!VALID_KEY_TYPES.has(keyType)) {
        return jsonResponse({ message: 'Tipo de chave PIX inválido.' }, 400);
      }
      sanitized.pixKeyType = keyType;
    }
  }

  if (payload.txid !== undefined && payload.txid !== null) {
    if (typeof payload.txid !== 'string') {
      return jsonResponse({ message: 'Identificador (txid) inválido.' }, 400);
    }
    const txid = payload.txid.trim();
    if (txid.length > 25) {
      return jsonResponse({ message: 'O campo txid deve ter no máximo 25 caracteres.' }, 400);
    }
    if (txid) {
      sanitized.txid = txid;
    }
  }

  if (payload.description !== undefined && payload.description !== null) {
    if (typeof payload.description !== 'string') {
      return jsonResponse({ message: 'Descrição inválida.' }, 400);
    }
    const description = payload.description.trim();
    if (description) {
      sanitized.description = description;
    }
  }

  const amountResult = parsePositiveAmount(payload.amount);
  if (!amountResult.ok) {
    return jsonResponse({ message: 'Valor (amount) inválido.' }, 400);
  }
  if (amountResult.value !== undefined) {
    sanitized.amount = amountResult.value;
  }

  const qrECL =
    typeof payload.qrECL === 'string' && payload.qrECL.trim()
      ? payload.qrECL.trim().toUpperCase()
      : 'Q';
  if (payload.qrECL !== undefined && payload.qrECL !== null && typeof payload.qrECL !== 'string') {
    return jsonResponse({ message: 'Nível de correção QR (qrECL) inválido.' }, 400);
  }
  if (!VALID_QR_ECL.has(qrECL)) {
    return jsonResponse({ message: 'Nível de correção QR (qrECL) deve ser Q ou H.' }, 400);
  }
  sanitized.qrECL = qrECL;

  const qrCellSize = parseIntRange(payload.qrCellSize, 1, 32);
  if (!qrCellSize.ok) {
    return jsonResponse({ message: 'Parâmetro qrCellSize inválido (inteiro de 1 a 32).' }, 400);
  }
  if (qrCellSize.value !== undefined) {
    sanitized.qrCellSize = qrCellSize.value;
  }

  const qrMargin = parseIntRange(payload.qrMargin, 0, 32);
  if (!qrMargin.ok) {
    return jsonResponse({ message: 'Parâmetro qrMargin inválido (inteiro de 0 a 32).' }, 400);
  }
  if (qrMargin.value !== undefined) {
    sanitized.qrMargin = qrMargin.value;
  }

  return proxySamuelLopesApi(env, {
    path: '/v1/codepix',
    method: 'POST',
    body: sanitized,
    logPrefix: 'pix',
  });
}
