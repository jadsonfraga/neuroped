# Backend em nuvem — Cloudflare D1

O NeuroPed já tem backend em código (`functions/api/*`, Cloudflare Pages
Functions) usando **D1** (banco SQLite serverless) e, opcionalmente, **KV**
(rate limit). Falta apenas **provisionar e conectar o banco** na sua conta
Cloudflare. Isso é feito por um workflow.

## Ativar (1 clique)

1. GitHub → aba **Actions** → workflow **"Provision D1 backend"** → **Run workflow** (branch `main`).
2. O workflow:
   - cria o D1 `neuroped-db` e o KV `RATE_LIMIT_KV` (idempotente);
   - aplica o schema `db/schema.sql`;
   - grava os bindings (IDs) no `wrangler.toml` e commita na `main`;
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
auditoria, health. Tabelas em `db/schema.sql`: `users`, `patients_demo`,
`consultations_demo`, `scale_results_demo`, `documents_demo`, `audit_logs`,
`memory_notes`, `app_settings`.

## LGPD / dados clínicos

As tabelas `_demo` são para dados fictícios. Dados reais de paciente só devem
entrar **criptografados** (server-side, via `server/lib/patientCrypto.ts`).
Configure a chave de criptografia antes de uso real.

## Busca semântica (opcional, depois)

Os endpoints de memória usam `AI` (Workers AI) e `VECTORIZE`. Ficam em modo
fallback (busca textual) até esses bindings serem configurados — não bloqueiam
o backend principal.
