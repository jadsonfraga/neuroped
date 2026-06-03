# Backend Supabase (coexistir lado a lado)

Guia para habilitar o backend opcional **Supabase** sem desativar o backend
canonico (Cloudflare Pages Functions + D1). Os dois funcionam em paralelo:

- D1 + Functions = backend principal, ja configurado via `DEPLOY.md`
- Supabase = portal multi-medico futuro, hoje em modo write-only para coleta

## Por que Supabase em paralelo

O D1 + Functions resolve uso solo do medico (uma instalacao, uma base local).
Supabase resolve:

- Postgres real (mais ferramentas, RLS, indices ricos, full-text)
- Auth integrada (magic link, JWT) quando voce ativar
- Multi-dispositivo / multi-medico
- Backup automatico, replicacao, dashboard SQL

Sem auth ainda. A primeira fase usa apenas a chave **anon publica** + RLS
write-only. Anon insere, anon NAO le. Para ler, use service_role server-side.

## Passo a passo

### 1. Crie o projeto Supabase

1. https://supabase.com -> "Start your project" -> conta nova ou login.
2. New project: regiao Sao Paulo se possivel, plano free tier serve.
3. Aguarde provisionamento (1-2 min).

### 2. Aplique o schema

1. SQL Editor -> New query.
2. Cole `db/supabase-schema.sql` inteiro -> Run.
3. Confirme em Table Editor que `submissions` e `audit_logs` apareceram.

### 3. Pegue as credenciais

1. Project Settings -> API.
2. Copie:
   - **Project URL** (vai em `supabaseUrl`)
   - **Project API keys -> anon public** (vai em `supabasePublicAnon`)
3. NAO copie a **service_role** para o browser. Ela so deve ficar em
   functions/server-side. (Para esta fase nem precisa).

### 4. Configure no app

Edite `cloud-config.js` (NAO `cloud-config.example.js`):

```js
window.NEUROPED_CLOUD = {
  provider: 'supabase',
  supabaseUrl: 'https://xyzcompany.supabase.co',
  supabasePublicAnon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  enabled: true,
  projectLabel: 'NeuroPed EDJ Cloud'
};
```

> A chave anon e publica (segura no browser). Ainda assim, considere
> manter `cloud-config.js` fora do versionamento se preferir nao expor o
> nome do projeto. Veja `.gitignore`.

### 5. Teste

Abra o devtools no app, qualquer pagina:

```js
NeuroPedCloud.config()      // { enabled: true, provider: 'supabase', url: '...', label: '...' }
NeuroPedCloud.health()      // { ok: true, status: 200 } se url+key responderem
NeuroPedCloud.saveSubmission({
  instrument_id: 'teste-manual',
  instrument_title: 'Teste manual via console',
  case_code: 'P-TESTE',
  answers_json: { ping: true },
  raw_score: 0,
  total_items: 1
})
// { ok: true, id: 'uuid...' }
```

Verifique no Supabase Table Editor: a linha apareceu em `submissions`.

### 6. Validacao via app

- Abra qualquer `banco-escalas*.html`.
- Preencha um instrumento, escolha um paciente local.
- Clique **Submeter ao backend**.
- Verifique no console que `route` foi `supabase`.
- Confirme no Supabase Table Editor.

## Politica RLS atual

```
INSERT submissions / audit_logs : anon OK
SELECT submissions / audit_logs : anon BLOQUEADO
UPDATE / DELETE                  : anon BLOQUEADO
```

Para ler dados em uma fase futura:

1. Ative Supabase Auth (magic link ou email+senha).
2. Adicione coluna `owner_id uuid references auth.users(id)`.
3. Reescreva policies como `auth.uid() = owner_id`.
4. Login no app -> a chave passa a ser jwt do usuario, RLS permite leitura.

## CSP

`_headers` e `index.html` ja foram atualizados para permitir
`https://*.supabase.co` em `connect-src`. Se voce usar custom domain
Supabase, adicione tambem la.

## Pendencias

- Auth (magic link) - fase 2.
- Owner por usuario - fase 2.
- Sync offline-first com queue local quando rede cair - fase 3.
- Service-side ETL para D1 -> Supabase para consolidar - opcional.

## Disclaimers clinicos

- Sem auth = sem PII real. Use somente codigos opacos (`P-001`, iniciais).
- A chave anon publica e protegida apenas por RLS. Falhas em policies
  podem expor dados. Auditar policies antes de qualquer dado real.
- Backup do projeto Supabase: configure em Project Settings -> Database.
