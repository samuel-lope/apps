import { describe, expect, it } from 'vitest';
import worker from '../../worker/index';

describe('Worker API routes', () => {
  it('returns 200 on GET /api/health', async () => {
    const res = await worker.fetch(new Request('http://localhost/api/health'), {});
    expect(res.status).toBe(200);
    const json = (await res.json()) as { status: string };
    expect(json.status).toBe('ok');
  });

  it('returns 503 on POST /api/pix when TOKEN secret is missing', async () => {
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

  it('returns 400 on POST /api/pix with missing fields when TOKEN exists', async () => {
    const res = await worker.fetch(
      new Request('http://localhost/api/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pixKey: '' }),
      }),
      { TOKEN: 'dummy' },
    );
    expect(res.status).toBe(400);
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
