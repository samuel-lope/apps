import { getApiToken, missingTokenResponse, proxySamuelLopesApi } from '../apiClient';
import { jsonResponse } from '../utils';

const CPF_PREFIX_PATTERN = /^[0-9]{1,9}$/;
const CNPJ_FILIAL_PATTERN = /^[0-9]{4}$/;
const CNPJ_PREFIX_PATTERN = /^[0-9]{1,8}$/;

export async function handleValidateCpfRequest(request: Request, env: Env): Promise<Response> {
  if (!getApiToken(env)) {
    return missingTokenResponse('cpf_validate');
  }

  const url = new URL(request.url);
  const cpf = (url.searchParams.get('CPF') ?? url.searchParams.get('cpf') ?? '').trim();
  if (!cpf) {
    return jsonResponse({ message: 'Parâmetro "cpf" é obrigatório.' }, 400);
  }

  const query = new URLSearchParams({ CPF: cpf });
  return proxySamuelLopesApi(env, {
    path: '/v1/validaCPF',
    method: 'GET',
    query,
    logPrefix: 'cpf_validate',
  });
}

export async function handleGenerateCpfRequest(request: Request, env: Env): Promise<Response> {
  if (!getApiToken(env)) {
    return missingTokenResponse('cpf_generate');
  }

  const url = new URL(request.url);
  const prefix = url.searchParams.get('prefix')?.trim() || '';
  const query = new URLSearchParams();

  if (prefix) {
    if (!CPF_PREFIX_PATTERN.test(prefix)) {
      return jsonResponse(
        { message: 'Parâmetro "prefix" inválido (esperado 1 a 9 dígitos).' },
        400,
      );
    }
    query.set('prefix', prefix);
  }

  return proxySamuelLopesApi(env, {
    path: '/v1/geraCPF',
    method: 'GET',
    query,
    logPrefix: 'cpf_generate',
  });
}

export async function handleValidateCnpjRequest(request: Request, env: Env): Promise<Response> {
  if (!getApiToken(env)) {
    return missingTokenResponse('cnpj_validate');
  }

  const url = new URL(request.url);
  const cnpj = (url.searchParams.get('CNPJ') ?? url.searchParams.get('cnpj') ?? '').trim();
  if (!cnpj) {
    return jsonResponse({ message: 'Parâmetro "cnpj" é obrigatório.' }, 400);
  }

  const query = new URLSearchParams({ CNPJ: cnpj });
  return proxySamuelLopesApi(env, {
    path: '/v1/validaCNPJ',
    method: 'GET',
    query,
    logPrefix: 'cnpj_validate',
  });
}

export async function handleGenerateCnpjRequest(request: Request, env: Env): Promise<Response> {
  if (!getApiToken(env)) {
    return missingTokenResponse('cnpj_generate');
  }

  const url = new URL(request.url);
  const filial = url.searchParams.get('filial')?.trim() || '';
  if (!CNPJ_FILIAL_PATTERN.test(filial)) {
    return jsonResponse(
      { message: 'Parâmetro "filial" é obrigatório e deve conter 4 dígitos (ex: 0001).' },
      400,
    );
  }

  const query = new URLSearchParams({ filial });
  const prefix = url.searchParams.get('prefix')?.trim() || '';
  if (prefix) {
    if (!CNPJ_PREFIX_PATTERN.test(prefix)) {
      return jsonResponse(
        { message: 'Parâmetro "prefix" inválido (esperado 1 a 8 dígitos).' },
        400,
      );
    }
    query.set('prefix', prefix);
  }

  return proxySamuelLopesApi(env, {
    path: '/v1/geraCNPJ',
    method: 'GET',
    query,
    logPrefix: 'cnpj_generate',
  });
}

export async function handleApiVersionRequest(env: Env): Promise<Response> {
  return proxySamuelLopesApi(env, {
    path: '/versao',
    method: 'GET',
    requireAuth: false,
    logPrefix: 'api_version',
  });
}
