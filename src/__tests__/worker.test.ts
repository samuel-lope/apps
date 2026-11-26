import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from '../../worker/index';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Worker API routes', () => {
  it('returns 200 on GET /api/health', async () => {
    const res = await worker.fetch(new Request('http://localhost/api/health'), {});
    expect(res.status).toBe(200);
    const json = (await res.json()) as { status: string };
    expect(json.status).toBe('ok');
  });

  it('forwards GET /api/version to /versao without requiring token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ versao: 'v1.0.0' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await worker.fetch(new Request('http://localhost/api/version'), {});
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ versao: 'v1.0.0' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.samuellopes.com.br/versao');
  });

  describe('/api/pix', () => {
    it('returns 503 when APIS_ACCES_TOKEN and TOKEN are missing', async () => {
      const res = await worker.fetch(
        new Request('http://localhost/api/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pixKey: 'abc', merchantName: 'Test', merchantCity: 'DF' }),
        }),
        {},
      );
      expect(res.status).toBe(503);
    });

    it('returns 400 on missing fields, merchantName > 25, or invalid pixKeyType', async () => {
      const env = { APIS_ACCES_TOKEN: 'slapi_test' };

      const missingRes = await worker.fetch(
        new Request('http://localhost/api/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pixKey: '' }),
        }),
        env,
      );
      expect(missingRes.status).toBe(400);

      const longNameRes = await worker.fetch(
        new Request('http://localhost/api/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pixKey: '12345678909',
            merchantName: 'A'.repeat(26),
            merchantCity: 'Brasilia',
          }),
        }),
        env,
      );
      expect(longNameRes.status).toBe(400);

      const badTypeRes = await worker.fetch(
        new Request('http://localhost/api/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pixKey: '12345678909',
            pixKeyType: 'INVALIDO',
            merchantName: 'Samuel',
            merchantCity: 'Brasilia',
          }),
        }),
        env,
      );
      expect(badTypeRes.status).toBe(400);
    });

    it('forwards Bearer APIS_ACCES_TOKEN, numeric amount, and omits empty amount', async () => {
      const fetchMock = vi.fn().mockImplementation(
        async () =>
          new Response(
            JSON.stringify({
              pixCopiaECola: '000201...',
              normalizedKey: '12345678909',
              keyType: 'CPF',
              svgQrCode: 'data:image/svg+xml;base64,abc',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
      );
      vi.stubGlobal('fetch', fetchMock);

      const res = await worker.fetch(
        new Request('http://localhost/api/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pixKey: '12345678909',
            pixKeyType: 'cpf',
            merchantName: 'Samuel Lopes',
            merchantCity: 'Brasilia',
            amount: '150,50',
          }),
        }),
        { APIS_ACCES_TOKEN: 'slapi_secret_123' },
      );

      expect(res.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://api.samuellopes.com.br/v1/codepix');
      expect((init.headers as Record<string, string>).Authorization).toBe(
        'Bearer slapi_secret_123',
      );
      const sentBody = JSON.parse(init.body as string) as Record<string, unknown>;
      expect(sentBody.amount).toBe(150.5);
      expect(sentBody.pixKeyType).toBe('CPF');

      const emptyAmountRes = await worker.fetch(
        new Request('http://localhost/api/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pixKey: '12345678909',
            merchantName: 'Samuel Lopes',
            merchantCity: 'Brasilia',
            amount: '',
          }),
        }),
        { TOKEN: 'slapi_fallback' },
      );
      expect(emptyAmountRes.status).toBe(200);
      const [, init2] = fetchMock.mock.calls[1] as [string, RequestInit];
      expect((init2.headers as Record<string, string>).Authorization).toBe(
        'Bearer slapi_fallback',
      );
      const sentBody2 = JSON.parse(init2.body as string) as Record<string, unknown>;
      expect(sentBody2).not.toHaveProperty('amount');
    });

    it('normalizes upstream { error } into { error, message }', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ error: "O campo 'merchantName' é obrigatório." }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      );

      const res = await worker.fetch(
        new Request('http://localhost/api/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pixKey: '12345678909',
            merchantName: 'Samuel',
            merchantCity: 'DF',
          }),
        }),
        { APIS_ACCES_TOKEN: 'slapi_test' },
      );

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        error: "O campo 'merchantName' é obrigatório.",
        message: "O campo 'merchantName' é obrigatório.",
      });
    });
  });

  describe('/api/recibo', () => {
    it('returns 503 when token is missing', async () => {
      const res = await worker.fetch(
        new Request('http://localhost/api/recibo?objeto=1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nomePagador: 'Jose',
            nomeRecebedor: 'Maria',
            valor: 100,
            data: '2026-06-28',
          }),
        }),
        {},
      );
      expect(res.status).toBe(503);
    });

    it('returns 400 on missing or invalid fields', async () => {
      const res = await worker.fetch(
        new Request('http://localhost/api/recibo?objeto=1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nomePagador: 'Jose',
            nomeRecebedor: 'Maria',
            valor: 0,
            data: '28/06/2026',
          }),
        }),
        { APIS_ACCES_TOKEN: 'slapi_test' },
      );
      expect(res.status).toBe(400);
    });

    it('forwards POST /api/recibo?objeto=1 as JSON and POST /api/recibo as HTML', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              reciboNum: '12345678',
              valor: '1.256,63',
              extenso: 'um mil e duzentos e cinquenta e seis reais e sessenta e três centavos',
              pagadorValido: true,
              recebedorValido: false,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        )
        .mockResolvedValueOnce(
          new Response('<html><body>Recibo HTML</body></html>', {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          }),
        );
      vi.stubGlobal('fetch', fetchMock);

      const jsonRes = await worker.fetch(
        new Request('http://localhost/api/recibo?objeto=1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nomePagador: 'Jose',
            nomeRecebedor: 'Maria',
            valor: '1.256,63',
            data: '2026-06-28',
          }),
        }),
        { APIS_ACCES_TOKEN: 'slapi_test' },
      );

      expect(jsonRes.status).toBe(200);
      expect(fetchMock.mock.calls[0][0]).toBe('https://api.samuellopes.com.br/v1/recibo?objeto=1');
      const sentBody = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string) as {
        valor: number;
      };
      expect(sentBody.valor).toBe(1256.63);

      const htmlRes = await worker.fetch(
        new Request('http://localhost/api/recibo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nomePagador: 'Jose',
            nomeRecebedor: 'Maria',
            valor: 100,
            data: '2026-06-28',
          }),
        }),
        { APIS_ACCES_TOKEN: 'slapi_test' },
      );

      expect(htmlRes.status).toBe(200);
      expect(htmlRes.headers.get('Content-Type')).toContain('text/html');
      expect(await htmlRes.text()).toContain('Recibo HTML');
      expect(fetchMock.mock.calls[1][0]).toBe('https://api.samuellopes.com.br/v1/recibo');
    });

    it('forwards GET /api/recibo utils and normalizes { erro } responses', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ extenso: 'cem reais' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ erro: 'Campos obrigatórios ausentes para gerar recibo.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      vi.stubGlobal('fetch', fetchMock);

      const getRes = await worker.fetch(
        new Request('http://localhost/api/recibo?valor=100'),
        { APIS_ACCES_TOKEN: 'slapi_test' },
      );
      expect(getRes.status).toBe(200);
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://api.samuellopes.com.br/v1/recibo?objeto=true&valor=100',
      );

      const errRes = await worker.fetch(
        new Request('http://localhost/api/recibo?objeto=1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nomePagador: 'Jose',
            nomeRecebedor: 'Maria',
            valor: 100,
            data: '2026-06-28',
          }),
        }),
        { APIS_ACCES_TOKEN: 'slapi_test' },
      );
      expect(errRes.status).toBe(400);
      expect(await errRes.json()).toEqual({
        erro: 'Campos obrigatórios ausentes para gerar recibo.',
        message: 'Campos obrigatórios ausentes para gerar recibo.',
      });
    });
  });

  describe('/api/codegen', () => {
    it('returns 503 when token is missing', async () => {
      const res = await worker.fetch(
        new Request('http://localhost/api/codegen?modo=hex&bits=128', { method: 'POST' }),
        {},
      );
      expect(res.status).toBe(503);
    });

    it('returns 400 on invalid modo, missing tipocarac, or invalid tipocarac flag', async () => {
      const env = { APIS_ACCES_TOKEN: 'slapi_test' };

      const badMode = await worker.fetch(
        new Request('http://localhost/api/codegen?modo=uuid', { method: 'POST' }),
        env,
      );
      expect(badMode.status).toBe(400);

      const missingTipo = await worker.fetch(
        new Request('http://localhost/api/codegen?modo=senha&qtdcarac=12', { method: 'POST' }),
        env,
      );
      expect(missingTipo.status).toBe(400);

      const badFlag = await worker.fetch(
        new Request('http://localhost/api/codegen?modo=senha&qtdcarac=12&tipocarac=xyz', {
          method: 'POST',
        }),
        env,
      );
      expect(badFlag.status).toBe(400);
    });

    it('forwards hex, personal, and senha modes with expected query and body', async () => {
      const fetchMock = vi.fn().mockImplementation(
        async () =>
          new Response(JSON.stringify({ cod: 'GENERATED_CODE' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
      );
      vi.stubGlobal('fetch', fetchMock);
      const env = { APIS_ACCES_TOKEN: 'slapi_test' };

      const hexRes = await worker.fetch(
        new Request('http://localhost/api/codegen?modo=hex&bits=128', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seed: 's1' }),
        }),
        env,
      );
      expect(hexRes.status).toBe(200);
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://api.samuellopes.com.br/v1/codegen?modo=hex&bits=128',
      );

      const personalRes = await worker.fetch(
        new Request('http://localhost/api/codegen?modo=personal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formato: 'ID-****', caracteres: 'ABCD' }),
        }),
        env,
      );
      expect(personalRes.status).toBe(200);
      expect(fetchMock.mock.calls[1][0]).toBe(
        'https://api.samuellopes.com.br/v1/codegen?modo=personal',
      );

      const senhaRes = await worker.fetch(
        new Request(
          'http://localhost/api/codegen?modo=senha&qtdcarac=16&tipocarac=lma,lmi,n,ce,cp&carp=!@',
          { method: 'POST' },
        ),
        env,
      );
      expect(senhaRes.status).toBe(200);
      expect(fetchMock.mock.calls[2][0]).toBe(
        'https://api.samuellopes.com.br/v1/codegen?modo=senha&qtdcarac=16&tipocarac=lma%2Clmi%2Cn%2Cce%2Ccp&carp=%21%40',
      );
    });
  });

  describe('/api/cpf/* and /api/cnpj/*', () => {
    it('returns 503 when token is missing', async () => {
      const res = await worker.fetch(
        new Request('http://localhost/api/cpf/validate?cpf=12345678909'),
        {},
      );
      expect(res.status).toBe(503);
    });

    it('returns 400 when required params are missing or invalid', async () => {
      const env = { APIS_ACCES_TOKEN: 'slapi_test' };

      const cpfErr = await worker.fetch(new Request('http://localhost/api/cpf/validate'), env);
      expect(cpfErr.status).toBe(400);

      const cnpjErr = await worker.fetch(new Request('http://localhost/api/cnpj/validate'), env);
      expect(cnpjErr.status).toBe(400);

      const cnpjGenErr = await worker.fetch(
        new Request('http://localhost/api/cnpj/generate?filial=01'),
        env,
      );
      expect(cnpjGenErr.status).toBe(400);
    });

    it('forwards CPF and CNPJ validate/generate calls to Swagger upstream paths', async () => {
      const fetchMock = vi.fn().mockImplementation(
        async () =>
          new Response(JSON.stringify({ resultado: 'ok' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
      );
      vi.stubGlobal('fetch', fetchMock);
      const env = { APIS_ACCES_TOKEN: 'slapi_test' };

      await worker.fetch(new Request('http://localhost/api/cpf/validate?cpf=12345678909'), env);
      await worker.fetch(new Request('http://localhost/api/cpf/generate?prefix=12345'), env);
      await worker.fetch(
        new Request('http://localhost/api/cnpj/validate?cnpj=19947414000150'),
        env,
      );
      await worker.fetch(
        new Request('http://localhost/api/cnpj/generate?filial=0001&prefix=1234'),
        env,
      );

      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://api.samuellopes.com.br/v1/validaCPF?CPF=12345678909',
      );
      expect(fetchMock.mock.calls[1][0]).toBe(
        'https://api.samuellopes.com.br/v1/geraCPF?prefix=12345',
      );
      expect(fetchMock.mock.calls[2][0]).toBe(
        'https://api.samuellopes.com.br/v1/validaCNPJ?CNPJ=19947414000150',
      );
      expect(fetchMock.mock.calls[3][0]).toBe(
        'https://api.samuellopes.com.br/v1/geraCNPJ?filial=0001&prefix=1234',
      );
    });
  });

  it('returns 400 on POST /api/notion/database with invalid databaseId', async () => {
    const res = await worker.fetch(
      new Request('http://localhost/api/notion/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: 'secret_123', databaseId: '../invalid' }),
      }),
      {},
    );
    expect(res.status).toBe(400);
  });

  it('returns 503 on GET /api/renova/sync when RENOVA_WEBHOOK_URL is missing', async () => {
    const res = await worker.fetch(new Request('http://localhost/api/renova/sync'), {});
    expect(res.status).toBe(503);
  });

  it('returns 404 on unknown /api/* path', async () => {
    const res = await worker.fetch(new Request('http://localhost/api/unknown'), {});
    expect(res.status).toBe(404);
  });
});
