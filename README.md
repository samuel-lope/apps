# Portal de Apps — Samuel Lopes

Portal web em **React + TypeScript + Vite + Tailwind CSS v4**, configurado para **Cloudflare Workers com Static Assets** (`@cloudflare/vite-plugin`).

## Arquitetura

- **Static Assets (`dist/client`)**: HTML, CSS, chunks lazy por aplicação, redirects `301` legados (`public/_redirects`) e cache/headers (`public/_headers`) servidos direto do CDN da Cloudflare sem invocar compute do Worker.
- **SPA Fallback**: `assets.not_found_handling = "single-page-application"` no `wrangler.jsonc`.
- **Worker Backend (`worker/index.ts`)**: acionado apenas para `/api/*` (`assets.run_worker_first = ["/api/*"]`):
  - `GET /api/health`
  - `POST /api/pix` (usa secret `TOKEN`)
  - `POST /api/notion/database` (proxy CORS-free para Notion API)
  - `GET | POST /api/renova/sync` (usa secret `RENOVA_WEBHOOK_URL`)

## Catálogo de Aplicações

Todas as aplicações são registradas em `src/registry/apps.ts`:

### Públicas (`/apps/*`)
- `/apps/recibo` — Gerador de Recibos (React nativo, impressão A4)
- `/apps/pix` — Gerador de QRCode PIX e placa A4 (React nativo + `/api/pix`)
- `/apps/codegen` — Gerador de Códigos, Senhas e QR Code (React nativo)
- `/apps/bitshift` — Bit-Shift Evolution v2.4 (React nativo)
- `/apps/argon2id` — Hash Argon2id (wrapper compat)
- `/apps/bcrypt` — Hash Bcrypt (wrapper compat)
- `/apps/gameoflife` — Jogo da Vida de Conway (wrapper compat)
- `/apps/terminal` — Terminal VT-100 ASCII (wrapper compat)

### Internas (`/internal/*`, prontas para Cloudflare Access)
- `/internal/codigos-sigmanet` — Requisição SIGMANET (GDF)
- `/internal/equipamentos-renova` — Painel Equipamentos Renova
- `/internal/renova-sync` — Sincronizador RenovaWeb
- `/internal/notion-inspector` — Notion Data Inspector

URLs antigas (`/*.html`, `/bitshift`, `/codigos-sigmanet`, `/update`, `/v1`, `/v2`) redirecionam com `301` via `public/_redirects`.

## Desenvolvimento Local

1. Instale dependências:
   ```bash
   npm install
   ```
2. Copie `.dev.vars.example` para `.dev.vars` e preencha os segredos locais:
   ```bash
   cp .dev.vars.example .dev.vars
   ```
3. Execute o servidor integrado (Vite HMR + `workerd` local):
   ```bash
   npm run dev
   ```

## Testes, Build e Deploy

```bash
npm run cf-typegen   # Gera worker-configuration.d.ts
npm test             # Executa testes unitários (Vitest)
npm run build        # Type-check + build de produção
npm run preview      # Preview local do build de produção
```

Para configurar segredos e publicar no Cloudflare Workers:

```bash
npx wrangler secret put TOKEN
npx wrangler secret put RENOVA_WEBHOOK_URL
npm run deploy
```

## Adicionando uma Nova Aplicação

1. Crie o componente em `src/apps/<slug>/` com export `default`.
2. Registre uma entrada em `src/registry/apps.ts` usando `React.lazy`.
3. A Home, a Sidebar, o Command Palette (`⌘K`) e a rota são atualizados automaticamente.
