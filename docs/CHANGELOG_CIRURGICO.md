# CHANGELOG CIRÚRGICO — NeuroPed EDJ
> Mudanças precisas, com localização exata e impacto real

---

## [2026-05-08] — Auditoria Inicial e Correções Críticas de Segurança

### fix: remover PIN hardcoded do código-fonte frontend

**Problema**: O PIN `260756` estava presente em plain text em 3 arquivos do frontend, visível no código-fonte e no bundle JavaScript compilado.

**Arquivos alterados**:
- `client/src/components/PasswordGate.tsx`
  - Removido: `const CORRECT_HASH = "a3f7c2e8d1b9"` e `const VALID_HASH = simpleHash("260756")`
  - Removida: função `simpleHash()` (hash trivialmente reversível)
  - Adicionado: `const VALID_HASH = import.meta.env.VITE_PIN_HASH`
  - Adicionado: função `sha256hex()` usando `crypto.subtle.digest("SHA-256")`
  - `handleSubmit` convertido de síncrono para `async`

- `client/src/pages/pacientes.tsx`
  - Removido: `pin === "260756"` (linhas 49 e 54)
  - Adicionado: import de `verifyPin` de `@/lib/pinAuth`
  - `handlePinSubmit` implementado como função async
  - Estado `pinError` e `pinChecking` adicionados para feedback visual

- `client/src/pages/paciente-detalhe.tsx`
  - Removido: `pin === "260756"` (linhas 77 e 83)
  - Adicionado: import de `verifyPin` de `@/lib/pinAuth`
  - `handlePinSubmit` implementado como função async
  - Estado `pinError` e `pinChecking` adicionados para feedback visual

**Novo arquivo**:
- `client/src/lib/pinAuth.ts` — Utilitário centralizado de verificação de PIN
  - `sha256hex(input: string): Promise<string>` — hash SHA-256 seguro
  - `verifyPin(pin: string): Promise<boolean>` — compara com `VITE_PIN_HASH`
  - Fail-safe: retorna `false` se `VITE_PIN_HASH` não estiver configurado

---

### feat: adicionar VITE_PIN_HASH ao .env.example e .env

**Arquivos alterados**:
- `.env.example` — Adicionada seção `AUTENTICAÇÃO FRONTEND` com variável `VITE_PIN_HASH` e instruções de geração do hash
- `.env` — Adicionada `VITE_PIN_HASH=` (vazia — requer configuração pelo desenvolvedor)

---

### docs: atualizar SECURITY.md com histórico de correções

**Arquivo alterado**: `SECURITY.md`
- Adicionada seção "Histórico de Correções Críticas" com tabela de fixes datados

---

### docs: criar documentação de conformidade e auditoria

**Novos arquivos**:
- `docs/AUDITORIA_CONTINUA_NEUROPED.md` — Relatório completo da auditoria inicial: stack, achados, mapa de abas, próximos passos
- `docs/LGPD_CHECKLIST.md` — Checklist de conformidade LGPD por categoria
- `docs/PRONTIDAO_DADOS_REAIS.md` — Critérios objetivos para promoção a modo produção
- `docs/CHANGELOG_CIRURGICO.md` — Este arquivo

---

## Riscos Removidos Nesta Sessão (Sessão 1)

1. ✅ PIN em plain text visível no bundle JavaScript
2. ✅ Hash criptograficamente fraco para autenticação
3. ✅ Ausência de documentação de segurança e LGPD

## Riscos Residuais (após sessão 1)

1. ⚠️ Autenticação client-side bypassável via DevTools (necessita auth server-side completa)
2. ⚠️ `VITE_PIN_HASH` não configurado no `.env` — acesso às áreas de pacientes bloqueado até configurar
3. ⚠️ localStorage não auditado — verificar se há dados de pacientes sem criptografia
4. ⚠️ Rebuild necessário para aplicar as mudanças: `npm run build`

---

## [2026-05-08] — Auditoria Contínua: Backend, Design System, API e Banco de Dados (Sessão 2)

### fix: integrar PasswordGate com backend JWT via verify-pin

**Arquivos alterados**:
- `server/auth/routes.ts`
  - Adicionado endpoint `POST /api/auth/verify-pin`
  - Valida hash SHA-256 do PIN contra `process.env.PIN_HASH` (server-side)
  - Retorna JWT válido por 30 minutos (role `professional`)
  - Comparação em tempo constante para evitar timing attacks
  - Rate limiting aplicado (5 req/15min via `loginRateLimit`)
  - Log de auditoria em toda tentativa (sucesso e falha)
- `client/src/components/PasswordGate.tsx`
  - Integrado com `POST /api/auth/verify-pin`
  - Persiste JWT em `sessionStorage` via `authClient` após verificação bem-sucedida
  - Fallback offline: valida hash localmente se servidor indisponível (AbortSignal.timeout 5s)
  - Estado `loading` adicionado ao botão com `aria-busy`
  - Mensagem de erro como `role="alert"` para acessibilidade

**Resultado**: PIN agora emite JWT real do servidor. PasswordGate passou de autenticação puramente client-side para integração com backend.

---

### fix: auditoria completa do localStorage — nenhum dado sensível encontrado

**Achado**: Todos os usos de `localStorage` são exclusivamente preferências de UI:
- `neuroped:onboarding-seen` → flag de UI (sem dados pessoais) — OK
- `neuroped:sound-enabled` → preferência de som — OK
- `neuroped:haptic-enabled` → preferência de vibração — OK

Tokens de autenticação estão em `sessionStorage` (volátil ao fechar aba) — correto.

**Novo arquivo**:
- `client/src/lib/secureStorage.ts` — Armazenamento cifrado AES-256-GCM para uso futuro
  - `secureSet()`, `secureGet()`, `secureClear()`, `secureClearAll()`, `securePurgeExpired()`
  - Chave derivada via PBKDF2 (100.000 iterações) de salt de sessão
  - Expiração automática em 8h (configurável)
  - Não substitui armazenamento server-side para dados de pacientes reais

---

### fix: service worker atualizado (v4 → v5)

**Arquivo alterado**: `client/public/sw.js`
- Versão bumped: `neuroped-v4` → `neuroped-v5`
- Adicionada interceptação explícita para `/patients`, `/consultations`, `/documents` (Network Only)
- Adicionado listener de mensagem `SKIP_WAITING` para atualização controlada
- Notificação automática de todos os clientes quando novo SW ativa
- Fallback offline com página HTML completa e botão de retry
- Comentários de auditoria LGPD explícitos

---

### feat: design system unificado com tokens médicos

**Novo arquivo**: `client/src/styles/tokens.css`
- Paleta médica completa: azul-marinho, violeta neurológico, cinza neutro, verde, vermelho, amarelo
- Semântica de cores: `--np-color-primary`, `--np-color-success`, `--np-color-danger`, etc.
- Espaçamentos: base 4px, escala 4/8/12/16/24/32/48/64/80/96
- Bordas: radius sm/md/lg/xl/2xl/full
- Sombras: xs/sm/md/lg/xl sem exageros
- Tipografia: Inter, tamanhos 12/14/16/18/20/24/30/36px
- Touch targets: `--btn-min-height: 44px` (WCAG 2.5.5)
- Utilitários de acessibilidade: `.skip-nav`, `:focus-visible`

---

### feat: estados visuais padronizados em componentes reutilizáveis

**Novo arquivo**: `client/src/components/ui/VisualStates.tsx`
- `LoadingState` — skeleton loader + spinner compacto com `aria-live="polite"`
- `PatientCardSkeleton` — skeleton específico para cards de paciente
- `EmptyState` — mensagem útil + ação sugerida (nunca "Nenhum dado encontrado")
- `ErrorState` — compacto e completo, com retry e `role="alert"`
- `SuccessToast` — auto-dismiss em 3s (configurável), posicionamento fixo bottom
- `SavingButton` — botão com estado `aria-busy` durante operação
- `OfflineBanner` — banner fixo no topo detectando `navigator.onLine`
- `PageStateWrapper` — wrapper conveniente para os três estados mais comuns

---

### fix: acessibilidade em Layout.tsx e adição de SkipNav

**Arquivos alterados**:
- `client/src/components/Layout.tsx`
  - `<SkipNav />` adicionado antes de qualquer conteúdo
  - `<OfflineBanner />` integrado
  - `<main id="main-content" tabIndex={-1}>` para destino do skip nav
  - `<nav aria-label="Navegação principal" id="sidebar-nav">`
  - `aria-label` em todos os botões de ícone (tema, menu, fechar, recolher)
  - `aria-expanded` e `aria-controls` nos botões de toggle
  - `aria-hidden="true"` em ícones decorativos

**Novo arquivo**: `client/src/components/SkipNav.tsx`
- Link de skip navigation conforme WCAG 2.4.1

---

### feat: API REST completa — Cloudflare Pages Functions

**Novos arquivos**:
- `functions/api/_middleware.ts`
  - CORS configurado via `CORS_ORIGINS` (env)
  - Rate limiting: 60 req/min por IP (memória + KV como opção)
  - Headers de segurança: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, etc.
  - Validação de `Content-Type: application/json` em POSTs
  - Preflight OPTIONS com 204

- `functions/api/patients/index.ts` — GET (lista + search + paginação) e POST (cria)
- `functions/api/patients/[id].ts` — GET (detalhe + histórico) e PATCH (atualiza)
- `functions/api/consultations/index.ts` — GET (lista por paciente) e POST (cria SOAP)
- `functions/api/documents/index.ts` — GET (lista por tipo/paciente) e POST (cria)
- `functions/api/scales/results.ts` — GET (histórico) e POST (registra resultado)
- `functions/api/audit-log.ts` — GET (admin only, com filtros)

Todos com: validação de entrada, erros claros (400/404/500), modo demo com dados fictícios, sem stack trace exposto.

---

### feat: schema D1 completo e seed de dados demo

**Novos arquivos**:
- `db/schema.sql`
  - Tabelas: `users`, `patients_demo`, `consultations_demo`, `scale_results_demo`, `documents_demo`, `audit_logs`, `memory_notes`, `app_settings`
  - Índices de busca em todos os campos frequentemente consultados
  - Virtual table FTS5 para busca textual em `memory_notes`
  - Triggers `updated_at` automáticos
  - Constraints `CHECK` em todos os campos enum
  - Comentários LGPD explícitos

- `db/seed_demo.sql`
  - 3 pacientes demo (nomes claramente fictícios com sufixo "— Fictício")
  - 2 consultas SOAP demo
  - 1 resultado de escala demo (M-CHAT-R/F)
  - 1 laudo demo com aviso explícito de dado fictício
  - 3 notas de memória clínica demo
  - Sync FTS5 incluído

---

### feat: memória semântica com busca TF-IDF aprimorada

**Arquivo alterado**: `functions/api/memory/search.ts`
- Adicionada estratégia FTS5 (BM25) como primária quando D1 disponível
- Implementada busca TF-IDF com normalização de acentos e pesos por campo
- Phrase boost para matches exatos de query completa
- Score normalizado [0, 1] em todos os resultados
- Filtro por `category` e `min_score`
- `semanticSearchStatus` honesto em toda resposta
- Modo demo funcional com notas fictícias e scoring real

---

## Riscos Removidos na Sessão 2

1. ✅ PasswordGate desvinculado do servidor — agora integra JWT real
2. ✅ localStorage sem dados sensíveis confirmado + secureStorage.ts criado
3. ✅ Service worker sem cache de dados clínicos (Network Only explícito)
4. ✅ Sem API REST estruturada para Cloudflare — endpoints completos criados
5. ✅ Sem schema de banco documentado — db/schema.sql completo com LGPD

---

## [2026-05-09] — Auditoria Contínua Ciclo 4: TypeScript, Portal da Família, Segurança (Sessão 3)

### feat: criar tipagem TypeScript para variáveis de ambiente Vite

**Novo arquivo**: `client/src/vite-env.d.ts`
- Declara `interface ImportMetaEnv` com `readonly VITE_PIN_HASH: string`
- Inclui variáveis adicionais: `VITE_APP_ENV` e `VITE_APP_VERSION` (opcionais)
- Resolve ausência de tipagem explícita detectada na auditoria de TypeScript
- Complementa `"types": ["vite/client"]` no tsconfig.json com tipagem específica do projeto

---

### fix: fallback defensivo em pinAuth.ts para crypto.subtle

**Arquivo alterado**: `client/src/lib/pinAuth.ts`
- Adicionada verificação: `if (typeof crypto === 'undefined' || !crypto.subtle)`
- Retorna `string vazia` se contexto inseguro (ex: HTTP em vez de HTTPS)
- Garante fail-safe: `verifyPin()` retorna `false` quando hash é vazio (bloqueio de acesso)
- Log de erro claro orientando ao uso de HTTPS

---

### feat: Portal da Família — página de documentos liberados para família

**Novo arquivo**: `client/src/pages/portal-familia.tsx`
- Acesso direto sem PIN médico (voltado a familiares)
- Exibe apenas documentos com `is_family_visible = 1` (filtro defensivo duplo: API + frontend)
- Aviso explícito de área restrita com `AlertTriangle` no topo
- Estados visuais integrados: `LoadingState`, `EmptyState`, `ErrorState` (VisualStates.tsx)
- Expansão de conteúdo de documentos com `aria-expanded` e `aria-controls`
- Nota de rodapé com contato do consultório
- Modo demo: dados exclusivamente fictícios

**Arquivo alterado**: `client/src/App.tsx`
- Adicionado `lazy(() => import("@/pages/portal-familia"))` para `PortalFamiliaPage`
- Adicionada rota `<Route path="/portal-familia" component={PortalFamiliaPage} />`
- Rota pública (sem `<Protected>`) — acesso por link compartilhado pelo médico

---

### audit: verificação de segurança — resultado limpo

Grep em todos os `.ts` e `.tsx` do frontend:
- `260756` (PIN antigo): **Nenhuma ocorrência** ✅
- `service_role`: **Nenhuma ocorrência** ✅
- `secret = 'xxx'`: **Nenhuma ocorrência** ✅
- `password = 'xxx'` hardcoded: **Nenhuma ocorrência** ✅

---

### docs: confirmação de risco residual resolvido — tokens.css

- Verificado que `tokens.css` já estava importado em `client/src/index.css` (`@import './styles/tokens.css'`)
- Risco "tokens.css precisa ser importado" constante no CHANGELOG da Sessão 2 era **falso positivo**
- Marcado como resolvido na documentação de auditoria

---

## Riscos Residuais (após sessão 2)

1. ⚠️ VITE_PIN_HASH e PIN_HASH ainda precisam ser configurados nas variáveis de ambiente
2. ⚠️ D1 não provisionado — endpoints em modo demo (sem persistência real)
3. ⚠️ Busca semântica real (Vectorize + Workers AI) não implementada — fallback textual ativo
4. ⚠️ Rebuild necessário: `npm run build`
5. ⚠️ tokens.css precisa ser importado no `index.css` para efeito: `@import './styles/tokens.css';`
6. ⚠️ Fluxos clínicos (P6), mobile (P7) e PDF (P8) não auditados nesta sessão
