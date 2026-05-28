# Deploy NeuroPed na Cloudflare

Guia operacional para colocar o app em produção via **Cloudflare Pages + Pages Functions + D1**.

## Pré-requisitos

- Conta Cloudflare com permissão para Pages, Workers e D1.
- Node 22+ e npm 10+ locais.
- `wrangler` autenticado: `npx wrangler login` (ou `CLOUDFLARE_API_TOKEN` em CI).

## Caminho 1 — Deploy automatico via GitHub Actions (recomendado)

1. Adicione no painel **Settings > Secrets and variables > Actions**:
   - `CLOUDFLARE_API_TOKEN` (Pages: Edit, D1: Edit, Account: Read)
   - `CLOUDFLARE_ACCOUNT_ID`
2. Mergeie qualquer commit em `main`. O workflow `.github/workflows/deploy-cloudflare.yml`:
   - npm install + `npm test` (static + typecheck)
   - resolve/cria D1 `neuroped-db` via API CF
   - patcha `wrangler.toml` em runtime com o id real
   - aplica `schema.sql` (idempotente)
   - `wrangler pages deploy . --project-name neuroped`
   - configura `APP_TOKEN` como secret do projeto Pages (se ainda nao existir)

## Caminho 2 — Deploy manual local

```sh
npm install
npm test                                        # static + typecheck
npx wrangler login                              # autentica wrangler
npx wrangler d1 create neuroped-db              # anote o database_id
# cole o id em wrangler.toml -> d1_databases[0].database_id
npm run db:schema                               # aplica schema no D1 remoto
npx wrangler pages secret put APP_TOKEN --project-name neuroped   # cole openssl rand -hex 32
npm run deploy
```

## Validacao pos-deploy

Substitua `<URL>` pela URL atribuida (`<projeto>.pages.dev` ou dominio proprio).

```sh
curl -sIL https://<URL>/ | head -10
curl -s https://<URL>/api/health
# esperado: {"ok":true,"service":"NeuroPed EDJ Backend",...}

curl -s https://<URL>/api/scales
# esperado: {"ok":true,"total":507,...}

curl -i -s https://<URL>/api/submissions
# esperado: 401 Nao autorizado.

curl -s -H "X-Clinic-Token: <APP_TOKEN>" https://<URL>/api/submissions
# esperado: 200 com lista

curl -i -s -X POST https://<URL>/api/submissions \
  -H "Origin: https://exemplo-malicioso.com" \
  -H "Content-Type: application/json" -d '{}'
# esperado: 403 Origem nao autorizada.
```

## Pendencias conhecidas

- O bundle SPA em `assets/` chama `/api/patients`, `/api/portal/diary`, `/api/portal/messages`, `/api/results`, `/api/certificado`, `/api/laudo/salvar` — esses endpoints **nao existem** em `functions/api/`. Telas dependentes recebem 404. Implementar antes de exigir.
- `agenda-financeiro.html` chama `https://api.npoint.io/...` (3rd-party, bloqueado pelo CSP). Migrar para D1 antes de uso real.
- `.github/workflows/deploy.yml` deploya para GitHub Pages; coexiste com Cloudflare. Decidir destino canonico.
- O PIN master antigo foi exposto previamente em histórico público. Usar apenas hash atualizado, evitar registrar PIN em texto claro e considerar reescrita do historico antes de uso real.

## Rollback

**Pages > Deployments** lista todas as versoes. Clique em uma anterior > **Rollback to this deployment**.
