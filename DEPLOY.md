# Deploy NeuroPed na Cloudflare

Guia operacional para colocar o app em produção via **Cloudflare Pages + Pages Functions + D1**.

## Pré-requisitos

- Conta Cloudflare com permissão para Pages, Workers e D1.
- Node 22+ e npm 10+ locais.
- `wrangler` autenticado: `npx wrangler login` (ou `CLOUDFLARE_API_TOKEN` em CI).

## 1. Instalar dependências

```sh
npm install
npm test           # 77 OK esperados
npx tsc --noEmit   # checa functions/api/*.ts
```

## 2. Criar e popular D1

```sh
# Cria o banco (anote o database_id retornado)
npx wrangler d1 create neuroped-db
```

Cole o `database_id` em duas saídas:

- `wrangler.toml` → `[[d1_databases]] database_id = "..."`
- `.env` local (a partir de `.env.example`), variável `NEUROPED_D1_DATABASE_ID`

Aplique o schema:

```sh
npm run db:schema   # equivale a: wrangler d1 execute neuroped-db --file=./schema.sql --remote
```

## 3. Definir secrets

```sh
# Token administrativo do endpoint GET /api/submissions
npx wrangler pages secret put APP_TOKEN --project-name neuroped
# (cole um valor de openssl rand -hex 32)
```

Alternativa via painel: **Pages → neuroped → Settings → Environment variables → Add variable → Encrypt.**

## 4. Deploy

### 4a. Deploy direto via CLI

```sh
npx wrangler pages deploy . --project-name neuroped --branch main
```

### 4b. Deploy via integração Git (recomendado)

1. Painel: **Pages → Create project → Connect to Git → escolher `jadsonfraga/neuroped`**.
2. Build command: *(em branco — repo já contém os assets prontos)*
3. Output directory: `/` (raiz)
4. Branch de produção: `main`
5. Salvar e disparar deploy.

## 5. Domínio (opcional)

Painel **Pages → Custom domains → Add → seu-dominio**. CF cria CNAME e cert TLS automaticamente.

## 6. Validação pós-deploy

Substitua `<URL>` pela URL atribuída (`<projeto>.pages.dev` ou domínio próprio).

```sh
# 1. Frontend carrega
curl -sIL https://<URL>/ | head -20

# 2. Pages Functions ativos
curl -s https://<URL>/api/health
# esperado: {"ok":true,"service":"NeuroPed EDJ Backend",...}

curl -s https://<URL>/api/scales
# esperado: {"ok":true,"total":507,...}

# 3. Listagem protegida (deve dar 401 sem token)
curl -i -s https://<URL>/api/submissions

# 4. Listagem com token (deve dar 200)
curl -s -H "X-Clinic-Token: <APP_TOKEN>" https://<URL>/api/submissions

# 5. CSRF: POST de outra origem (deve dar 403)
curl -i -s -X POST https://<URL>/api/submissions \
  -H "Origin: https://exemplo-malicioso.com" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Pendências conhecidas

- O bundle SPA em `assets/` faz `fetch` para `/api/patients`, `/api/portal/diary`,
  `/api/portal/messages`, `/api/results`, `/api/certificado`, `/api/laudo/salvar`.
  Esses endpoints **não estão implementados** em `functions/api/`. As telas que
  dependem deles vão receber 404 — implementar antes de exigir essas funcionalidades.
- `agenda-financeiro.html` chama `https://api.npoint.io/...` (JSON store público de
  terceiros). É **bloqueado pelo CSP** atual e é inadequado para dados clínicos —
  deve migrar para D1 antes de uso real.
- Workflow `.github/workflows/deploy.yml` deploya para **GitHub Pages**, não
  Cloudflare. Manter ambos é seguro (não conflitam), mas se o destino canônico
  for Cloudflare, considere desativar o de GitHub Pages.

## Rollback

Cada deploy fica versionado em **Pages → Deployments**. Para reverter, clique
em uma versão anterior → **Rollback to this deployment**.
