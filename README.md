# NeuroPed EDJ

Aplicativo estatico com banco de escalas e inventarios neuropediatricos, preparado para Cloudflare Pages com backend em Cloudflare Pages Functions e Cloudflare D1.

## Estrutura principal

- `index.html` — entrada do app estatico atual
- `escalas.html` — indice dos 507 instrumentos preenchiveis
- `banco-escalas.html` — base inicial
- `banco-escalas-lote1.html` — lote 1
- `banco-escalas-lote2-80.html` — lote 2
- `banco-escalas-lote3-100.html` — lote 3
- `banco-escalas-lote4-200.html` — lote 4
- `banco-escalas-lote5-90.html` — lote 5
- `functions/api/health.ts` — verificacao de backend
- `functions/api/scales.ts` — metadados das escalas
- `functions/api/submissions.ts` — salvamento e consulta protegida de respostas
- `schema.sql` — schema D1

## Requisitos

- Node.js atual
- Conta Cloudflare
- Wrangler autenticado
- Cloudflare Pages conectado a branch `main`
- Banco D1 criado e vinculado ao binding `DB`

## Instalar dependencias

```bash
npm install
```

## Rodar localmente

```bash
npm run dev
```

## Criar banco D1

```bash
npx wrangler d1 create neuroped-db
```

Copie o `database_id` retornado e substitua em `wrangler.toml`:

```toml
database_id = "COLOCAR_DATABASE_ID_AQUI"
```

## Aplicar schema no D1

```bash
npm run db:schema
```

ou:

```bash
npx wrangler d1 execute neuroped-db --file=./schema.sql --remote
```

## Configurar token de consulta

```bash
npx wrangler pages secret put APP_TOKEN
```

Use um token forte. Nao colocar esse token no frontend.

## Configuracao recomendada no Cloudflare Pages

- Project name: `neuroped`
- Production branch: `main`
- Build command: `npm install`
- Build output directory: `/`
- Root directory: `/`
- Functions: habilitadas automaticamente pela pasta `functions/`
- D1 binding: `DB`
- Secret: `APP_TOKEN`

## URLs principais

- `/escalas.html`
- `/api/health`
- `/api/scales`
- `/api/submissions`

## Testes pos-deploy

```bash
curl https://SEU-DOMINIO/api/health
curl https://SEU-DOMINIO/api/scales
```

O endpoint `/api/health` deve retornar `ok: true`.

O endpoint `/api/scales` deve retornar `total: 507`.

O endpoint `GET /api/submissions` exige header:

```bash
X-Clinic-Token: SEU_TOKEN
```

## Modelo minimo de POST

```bash
curl -X POST https://SEU-DOMINIO/api/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "case_code": "CASO-001",
    "patient_code": "PAC-001",
    "instrument_id": "escala-demo",
    "instrument_title": "Escala Demo",
    "answers": {"0-0": 2, "0-1": 1},
    "raw_score": 3,
    "total_items": 2,
    "source_page": "/escalas.html"
  }'
```

## Segurança e LGPD

Nesta fase inicial, salvar somente codigos operacionais e respostas estruturadas:

- `case_code`
- `patient_code`
- `instrument_id`
- `answers_json`
- `raw_score`
- `total_items`

Evitar nome completo, CPF, telefone e dados sensiveis no banco ate existir painel administrativo, controle de acesso, politica LGPD e criptografia adequada.

## Aviso clinico

Os instrumentos autorais sao recursos de triagem, organizacao clinica e acompanhamento. Nao substituem avaliacao medica, exame clinico ou instrumentos normatizados quando formalmente indicados.
