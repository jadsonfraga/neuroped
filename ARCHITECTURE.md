# ARCHITECTURE — NeuroPed SDG

**Versão deste documento:** v5.1-truth-pass
**Status:** decisão arquitetural pendente do proprietário

---

## 1. Estado atual (v5.1)

```
┌────────────────────────────────────────────────────────────┐
│  Browser (Chrome/Safari/Firefox)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ index.html                                           │  │
│  │ ├─ styles.css         (design system)                │  │
│  │ ├─ data.js            (registry + materiais + CAA)   │  │
│  │ ├─ api.js             (cliente cloud opcional)       │  │
│  │ ├─ charts.js          (SVG nativo, sem dep)          │  │
│  │ ├─ pdf.js             (modelo de laudo)              │  │
│  │ ├─ app.js             (SPA router + 12 views)        │  │
│  │ └─ sw.js              (Service Worker offline)       │  │
│  │                                                      │  │
│  │ Estado: localStorage + sessionStorage                │  │
│  │ Auth: PIN MASTER em texto claro no JS (INSEGURO)     │  │
│  └──────────────────────────────────────────────────────┘  │
│         ▲                                                  │
│         │ HTTP GET                                         │
│         │                                                  │
│  ┌──────┴───────────────────────────────────────────────┐  │
│  │ GitHub Pages (jadsonfraga.github.io/neuroped/)       │  │
│  │ - serve arquivos estáticos                           │  │
│  │ - SEM execução server-side                           │  │
│  │ - SEM Cloudflare Functions                           │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### Problemas estruturais
- Não há backend ativo no domínio público
- Não há autenticação real
- Não há banco com Row Level Security
- Service Worker pode armazenar conteúdo no cache que será confundido com produção
- Sync para Supabase só ocorre se proprietário configurar manualmente

---

## 2. Arquitetura ALVO (recomendada)

```
┌────────────────────────────────────────────────────────────┐
│  Browser                                                   │
│  ├─ PWA shell (estático)                                   │
│  ├─ Supabase JS client (Auth + queries com RLS)            │
│  └─ Service Worker (cache shell, NÃO cacheia dados)        │
└────────────────────────────────────────────────────────────┘
         │                                  │
         │ HTTPS                            │ HTTPS
         ▼                                  ▼
┌─────────────────────────┐    ┌────────────────────────────┐
│ Cloudflare Pages         │    │ Supabase                  │
│ ├─ Hosting estático      │    │ ├─ Auth (email+MFA)       │
│ ├─ Pages Functions:      │    │ ├─ PostgreSQL + RLS        │
│ │   - /api/webhook/*     │    │ ├─ Storage (PDF privado)  │
│ │   - /api/integrations  │    │ └─ Realtime (mensagens)   │
│ └─ Variáveis secretas    │    └────────────────────────────┘
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐    ┌────────────────────────────┐
│ Asaas / Stripe          │    │ Sentry                     │
│ - PIX, cartão, assinat. │    │ - Logs sem PII             │
│ - Webhooks verificados  │    │ - Mascaramento de campos   │
└─────────────────────────┘    └────────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Bry / Vault ID (futuro) │
│ - Assinatura ICP-Brasil │
└─────────────────────────┘
```

---

## 3. Decisão arquitetural: única fonte de verdade

**Adotado:** Supabase PostgreSQL como banco principal.
**Descartado:** Cloudflare D1 não será mantido como banco operacional. Pode permanecer apenas para cache não sensível ou ser desativado.

### Razão
- Supabase oferece Auth + Banco + RLS + Storage + Realtime em uma única plataforma
- D1 não tem RLS nativo equivalente
- Manter dois bancos disputando a verdade gera inconsistência e custo cognitivo
- Supabase tem suporte oficial para LGPD e residência de dados na América do Sul

### Risco
- Lock-in com Supabase. Mitigação: schema PostgreSQL é portável; em caso de migração, exportação SQL padrão funciona.

---

## 4. Tabelas do banco (esquema alvo)

```sql
-- Autenticação (gerenciada por Supabase Auth)
auth.users (id, email, encrypted_password, ...)

-- Perfis de usuário
public.profiles (
  user_id uuid PK references auth.users(id),
  role text CHECK (role IN ('admin','medico','secretaria','terapeuta','familia')),
  display_name text,
  created_at timestamptz default now()
)

-- Clínica / multi-tenant futuro
public.clinics (id uuid PK, name text, owner_id uuid, ...)

-- Pacientes
public.patients (
  id uuid PK,
  clinic_id uuid references clinics(id),
  code text UNIQUE,
  full_name text,         -- criptografado em coluna ou sob RLS
  dob date,
  ...
)

-- Submissões de instrumentos
public.submissions (
  id uuid PK,
  patient_id uuid references patients(id),
  instrument_id text,
  answers jsonb,
  raw_score int,
  total_items int,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
)

-- Consultas
public.consultations (...)

-- Documentos
public.documents (...)

-- Trilha de auditoria
public.audit_log (
  id bigserial PK,
  user_id uuid,
  action text,
  resource_type text,
  resource_id uuid,
  metadata jsonb,
  ip_address inet,
  created_at timestamptz default now()
)
```

### Políticas RLS exemplares

```sql
-- Pacientes: apenas usuários da mesma clínica veem
alter table patients enable row level security;

create policy "patients_select_same_clinic"
  on patients for select
  using (clinic_id in (select clinic_id from profiles where user_id = auth.uid()));

-- Família vê apenas o paciente que está autorizada a acessar
create policy "patients_select_family_authorized"
  on patients for select
  using (id in (select patient_id from family_access where family_user_id = auth.uid()));
```

---

## 5. Fluxos críticos

### 5.1 Login médico
1. Usuário digita e-mail
2. Supabase envia magic link
3. Após clicar, Supabase abre sessão JWT
4. App carrega papel do usuário via `profiles`
5. Se `role = medico` ou `admin`, exige MFA (TOTP)
6. App carrega clínica e dados permitidos

### 5.2 Família responde escala via passe
1. Médico gera convite com token único (expira 7 dias)
2. Token é vinculado a `patient_id` + `instrument_id`
3. Família abre link, responde escala
4. Resposta é gravada em `submissions` com `family_token`
5. Médico recebe notificação interna
6. Token expira ou é revogável manualmente

### 5.3 Geração de laudo
1. Médico clica "Gerar laudo" em paciente
2. Frontend pede confirmação
3. Backend gera PDF com dados do banco (não do localStorage)
4. PDF é gravado em Supabase Storage (privado)
5. URL assinada de curto prazo é retornada
6. Auditoria registra: quem gerou, quando, para qual paciente

---

## 6. Plano de migração

| Fase | Ação | Risco | Rollback |
|---|---|---|---|
| 1 | Criar projeto Supabase em paralelo | nulo | descartar projeto |
| 2 | Aplicar schema + RLS em staging | baixo | drop schema |
| 3 | Configurar Cloudflare Pages com domínio staging | baixo | manter GitHub Pages |
| 4 | Migrar Service Worker para no-cache em rotas privadas | médio | revert SW |
| 5 | Implementar Auth com magic link | médio | feature flag desabilita |
| 6 | Implementar CRUD pacientes/submissions | alto | feature flag |
| 7 | Migrar produção para Cloudflare Pages domínio próprio | alto | DNS rollback |
| 8 | Desativar GitHub Pages como entrada principal (redirect) | baixo | reenable Pages |

Cada fase exige:
- Branch dedicada
- Testes E2E mínimos antes de merge
- Aprovação do proprietário antes de produção

---

## 7. Variáveis de ambiente necessárias

(detalhamento em `ENVIRONMENT_VARIABLES.md`)

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`
- `ASAAS_API_KEY` ou `STRIPE_SECRET_KEY`
- `SENTRY_DSN`
- `APP_TOKEN_LEGADO` (para Cloudflare Functions legacy se mantidas)

Nenhuma dessas variáveis pode aparecer no frontend (`app.js`, `data.js`, etc.). `SUPABASE_ANON_KEY` é a única segura para frontend.
