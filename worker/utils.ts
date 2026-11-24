export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function logEvent(level: 'info' | 'error', message: string, extra?: Record<string, unknown>): void {
  const entry = JSON.stringify({ level, message, ...extra, ts: new Date().toISOString() });
  if (level === 'error') {
    console.error(entry);
  } else {
    console.log(entry);
  }
}

export async function parseUpstreamPayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}
