import { jsonResponse, logEvent, parseUpstreamPayload } from '../utils';

interface NotionDatabaseRequest {
  apiKey?: unknown;
  databaseId?: unknown;
  notionVersion?: unknown;
}

const DATABASE_ID_PATTERN = /^[a-fA-F0-9-]{32,36}$/;

export async function handleNotionDatabaseRequest(request: Request): Promise<Response> {
  let body: NotionDatabaseRequest;
  try {
    body = (await request.json()) as NotionDatabaseRequest;
  } catch {
    return jsonResponse({ message: 'Corpo JSON inválido.' }, 400);
  }

  const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
  const databaseId = typeof body.databaseId === 'string' ? body.databaseId.trim() : '';
  const notionVersion =
    typeof body.notionVersion === 'string' && body.notionVersion.trim()
      ? body.notionVersion.trim()
      : '2025-09-03';

  if (!apiKey) {
    return jsonResponse({ message: 'API Key do Notion é obrigatória.' }, 400);
  }

  if (!DATABASE_ID_PATTERN.test(databaseId)) {
    return jsonResponse({ message: 'Database ID inválido (esperado 32-36 caracteres hex/UUID).' }, 400);
  }

  try {
    const upstream = await fetch(
      `https://api.notion.com/v1/databases/${encodeURIComponent(databaseId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Notion-Version': notionVersion,
          'Content-Type': 'application/json',
        },
      },
    );

    const data = await parseUpstreamPayload(upstream);
    logEvent('info', 'notion_database_proxy', { status: upstream.status });
    return jsonResponse(data ?? {}, upstream.status);
  } catch (error) {
    logEvent('error', 'notion_proxy_exception', {
      error: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse({ message: 'Falha ao consultar a API do Notion.' }, 502);
  }
}
