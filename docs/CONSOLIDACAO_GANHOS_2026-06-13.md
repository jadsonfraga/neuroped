# NeuroPed — Consolidação de ganhos (13/06/2026)

## Objetivo

Registrar, de forma objetiva, tudo que entrou na `main` nesta rodada — correções
de imagens/identidade, simplificação do filtro, proveniência do catálogo e a
ativação do backend em nuvem — além das pendências rastreadas.

## Ganhos consolidados na `main`

### 1. Imagens e identidade visual

- **Logo do escudo corrigida** (`client/src/assets/drJadsonMasterShieldLogo.ts`):
  o data URI base64 estava corrompido (decodificava mas não renderizava) e
  quebrava na splash e no header. Regenerado a partir da fonte válida. (PR #419)
- **Ilustrações pesadas otimizadas**: 6 PNGs de 5–8 MB (~39 MB) convertidos para
  WebP a 1280px (~1,1 MB no total), eliminando falhas de carregamento no celular.
- **Nova logo** (escudo vermelho/dourado "Dr. Jadson Fraga") adotada na splash,
  header, tela de bloqueio e página Sobre. (PR #419)
- **Ícones do PWA** (`icon-192/512`, `apple-touch-icon`, `favicon`) e **ícones de
  loja** (13 iOS sem alpha, 6 Android, splash 1536×2752, feature-graphic) gerados
  a partir da nova logo. (PRs #419, #420)
- Verificação automática: 14 imagens importadas decodificam OK, 0 quebradas.

### 2. Terminologia

- Termo **"Cockpit" → "Painel"** na home (título, subtítulo da marca e badge). (PR #419)

### 3. Filtro de escalas

- **Teia de sinais/sintomas removida** (UI, estado e boost no ranking) e módulo
  órfão `teiaQueixas.ts` excluído — filtro mais enxuto (−178 linhas). (PR #421)
- **Só escalas que abrem** ficam selecionáveis: `opensInApp` passou a excluir
  escalas cuja única rota é o catálogo mundial genérico
  (`world-registry-*`). O catálogo mundial segue acessível pelo link dedicado. (PR #422)
- Correção de 2 bloqueios pré-existentes da `main` (CI vermelha): ordem de rotas
  (`/qualidade` pública antes de `/laudo-neuroped` protegida) e import não usado
  em `laudo-neuroped.tsx`. (PR #422)

### 4. Proveniência do catálogo (somente metadados reais)

- `fonte` oficial preenchida nas famílias **PROMIS** (26 — HealthMeasures/
  Northwestern) e **NIH Toolbox** (13 — NIH), sem inventar itens nem pontos de
  corte. Pendentes de fonte: **200 → 161**. (PR #423)

### 5. Backend em nuvem (Cloudflare D1) — ATIVO

O app já tinha o backend escrito (`functions/api/*`, Pages Functions + D1);
faltava provisionar e conectar o banco. Agora está **no ar**:

- `/api/health` → `"database":"ok"`; `/api/patients` → `"mode":"db"`.
- Banco **D1 `neuroped-db`** (uuid `9b0919e5-…`) com 8 tabelas: `users`,
  `patients_demo`, `consultations_demo`, `scale_results_demo`, `documents_demo`,
  `audit_logs`, `memory_notes`, `app_settings`.
- Binding D1 configurado **no projeto Pages via API** (persiste server-side para
  todo deploy futuro) — `wrangler pages deploy` não lê bindings do `wrangler.toml`.
- Workflow reutilizável **"Provision D1 backend"** (`.github/workflows/provision-d1.yml`)
  + `db/schema.d1.sql` (versão wrangler-safe) + `docs/BACKEND_D1_SETUP.md`.
  (PRs #424, #425, #426, #427)

Obstáculos vencidos no caminho: permissões do token (OK), bug do splitter do
`wrangler d1 execute` → schema ASCII sem triggers/FTS, tabela `audit_logs`
corrompida por run parcial → `DROP+CREATE`, e bindings de Pages via API (não
via `wrangler.toml`).

## Auditoria — bugs e inconsistências (13/06)

### 1. [ALTO] Backend dividido entre Cloudflare D1 e Railway

O catch-all `functions/api/[[path]].js` faz **proxy de `/api/*` para um backend
Railway** (Express, atualmente vivo — `GET /api/health` → 200). Como as Functions
mais específicas têm precedência, o tráfego se divide:

- **Cloudflare D1**: `/api/patients`, `/api/patients/:id`, `/api/consultations`,
  `/api/documents`, `/api/scales/results`, `/api/health`, `/api/audit-log`,
  `/api/memory/search`, `/api/version`.
- **Railway**: todo o resto — `/api/auth/*`, `/api/results`, `/api/consents`,
  `/api/files/*`, `/api/send-report`, `/api/send-whatsapp`.

**O backend de dados é o D1.** Verificado que o alvo do proxy
(`neuroped-api-production.up.railway.app`) é, na prática, um serviço **não
relacionado** (`secretaria-ia`): responde 200 só em `/api/health` e **404** em
`/api/patients`, `/api/results`, `/api/auth/*`, `/api/consents`, `/api/files`,
etc. Ou seja, tudo que era proxyado para lá estava **quebrado (404)**.

**Bug central (corrigido):** a UI chama `POST /api/results`, `GET
/api/patients/:id/results` e `DELETE /api/results/:id` — paths que caíam no proxy
(404). O D1 só expunha `/api/scales/results` com corpo em snake_case. **Fix:**
adicionadas 3 Functions-adaptadoras no D1 nos paths exatos da UI
(`functions/api/results.ts`, `functions/api/results/[id].ts`,
`functions/api/patients/[id]/results.ts`), traduzindo o corpo camelCase da UI →
`scale_results_demo`. UI intacta; fluxo paciente → salvar resultado → ver/excluir
agora funciona ponta a ponta no D1.

**Recomendação (cleanup):** remover ou repontar o proxy `[[path]].js` — hoje
encaminha requisições (e headers) a um serviço de terceiro não relacionado, e
todas as rotas restantes (auth, files, send-*) retornam 404. As features de auth/
upload/envio precisam de implementação própria (Functions) quando forem ativadas.

### 2. [OK] `memory/search` referencia FTS inexistente, mas degrada com segurança

`functions/api/memory/search.ts` consulta `memory_notes_fts`, que o `schema.d1.sql`
não cria. Há `try/catch` com fallback para busca LIKE/TF-IDF — funciona, apenas
loga um warning. (FTS pode ser adicionada depois.)

### 3. [LIMPEZA] `wrangler.toml` com bloco D1 inerte

Restou um `[[d1_databases]]` + marcador no `wrangler.toml` (de um run anterior). O
binding de Pages é feito via API do projeto, então esse bloco é inócuo, mas o
comentário ficou desatualizado.

### 4. [OK] Demais mudanças da sessão

Imagens/WebP, logo/ícones, filtro, fontes PROMIS/NIH e seed: sem inconsistências;
`tsc`, guards, `test:filter` e `test:clinical` verdes.

## Consolidação dos backends — resolvido

A auditoria mostrou que o alvo do proxy não é o backend do NeuroPed (é
`secretaria-ia`, que 404 em tudo menos `/api/health`). Logo, **o backend de dados
é o Cloudflare D1** — não havia escolha real de "ir para o Railway". A
consolidação foi feita alinhando os paths da UI ao D1 (3 adaptadoras acima),
mantendo o caminho mais simples e funcional.

Restante (não bloqueante): o proxy `[[path]].js` pode ser removido/repontado; e
`auth`/`files`/`send-*`/`consents` exigem implementação própria quando ativados.

## Pendências rastreadas

- **Proveniência**: 161 instrumentos ainda sem `fonte` (paralisia cerebral,
  desenvolvimento, linguagem etc.) — exigem citação individual confirmada; não
  preencher de memória (risco clínico).
- **KV (rate limit)**: opcional; hoje em fallback de memória. Pode ser fixado.
- **Busca semântica** (`AI`/`VECTORIZE`): em fallback textual até bindings
  configurados — não bloqueia o backend principal.
- **LGPD**: tabelas são `_demo` (fictícias). Dados reais de paciente só devem
  entrar **criptografados** (`server/lib/patientCrypto.ts`) — falta configurar a
  chave antes de uso real.
- **Telas × backend**: as páginas (ex.: Pacientes) ainda podem ser conectadas aos
  endpoints `/api/*` agora que o banco persiste.

## Deploy

Produção em Cloudflare Pages (`neuroped.pages.dev`) + Vercel, disparado a cada
merge na `main`. Por ser PWA, fechar/reabrir o app (ou limpar cache) após o
deploy para o service worker baixar a versão nova.
