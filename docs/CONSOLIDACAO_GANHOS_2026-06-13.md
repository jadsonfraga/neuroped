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
