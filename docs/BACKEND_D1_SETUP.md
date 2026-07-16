# Backend em nuvem — Cloudflare D1

O NeuroPed já tem backend em código (`functions/api/*`, Cloudflare Pages
Functions) usando **D1** (banco SQLite serverless) e, opcionalmente, **KV**
(rate limit). Falta apenas **provisionar e conectar o banco** na sua conta
Cloudflare. Isso é feito por um workflow.

## Ativar (1 clique)

1. GitHub → aba **Actions** → workflow **"Provision D1 backend"** → **Run workflow** (branch `main`).
2. O workflow:
   - cria o D1 `neuroped-db` e o KV `RATE_LIMIT_KV` (idempotente);
   - aplica `db/schema.d1.sql` e as migrações aditivas de ownership, sessões e consentimentos;
   - configura os bindings no projeto Pages sem alterar nem commitar a `main`;
   - faz o deploy já com o backend ativo;
   - testa `https://neuroped.pages.dev/api/health`.
3. Confirme em `https://neuroped.pages.dev/api/health` → deve retornar `"database": "ok"`.

A partir daí, **todo deploy** (Cloudflare Pages) carrega o binding e o backend
persiste dados.

## Pré-requisito: permissões do token

O secret `CLOUDFLARE_API_TOKEN` precisa de permissões de **D1**, **Workers KV
Storage** e **Cloudflare Pages** (Edit), na conta `CLOUDFLARE_ACCOUNT_ID`. Se o
token só tiver Pages, o passo de criar o D1 falha — gere um token com esses
escopos em Cloudflare → My Profile → API Tokens.

## O que o backend oferece

`functions/api/*`: pacientes, consultas, resultados de escalas, documentos,
auditoria, health. Tabelas em `db/schema.d1.sql`: `users`,
`auth_refresh_sessions`, `consents`, `patients_demo`,
`consultations_demo`, `scale_results_demo`, `documents_demo`, `audit_logs`,
`memory_notes`, `app_settings`.

## LGPD / dados clínicos

As tabelas `_demo` do D1 são exclusivamente para dados fictícios. Não grave
pacientes reais nelas. O backend Express possui criptografia server-side em
`server/lib/patientCrypto.ts`; o uso real exige `NEUROPED_MASTER_KEY` e revisão
operacional/LGPD antes da ativação.

## Busca semântica (opcional, depois)

Os endpoints de memória usam `AI` (Workers AI) e `VECTORIZE`. Ficam em modo
fallback (busca textual) até esses bindings serem configurados — não bloqueiam
o backend principal.
