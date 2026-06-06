# Backend Go-Live — runbook executável

> **Status honesto:** o NeuroPed roda hoje **local-first** (dados no dispositivo).
> O *código* de backend já existe (Pages Functions em `functions/api/*`, cliente
> Supabase em `np-cloud.js`, schema com RLS em `supabase-schema-v6.sql`). O que
> falta para "ter backend de verdade" **não é código** — é **provisionar**,
> implementar **auth real** e **decidir o host**. Este runbook é o passo a passo
> do que só o responsável pode fazer.

---

## 0. O teto atual (por que a auditoria trava em ~6,5)
1. **Auth é local (PIN), não servidor.** `clinical-auth-adapter.js` faz hash do PIN
   no `localStorage` — é proteção de UX, **não autenticação**. Não há verificação
   server-side, MFA nem sessão segura.
2. **Sem backend ativo no host público.** O domínio público é **GitHub Pages**, que
   **não executa** `functions/api/*` (Pages Functions só rodam no Cloudflare).
3. **Risco de perda de dados.** Local-first sem sync ⇒ trocar de aparelho perde tudo.

## ⚠️ Bug de configuração a corrigir ANTES de tudo
`cloud-config.js` está com **`enabled: true`** apontando para uma **chave anon
truncada/placeholder** (`eyJ...`) e URL provavelmente inexistente. Resultado: o
app tenta sincronizar e **falha silenciosamente** em produção.
**Correção:** ou `enabled: false` (honesto, até provisionar), ou cole a URL +
chave anon **reais** (passo 2). Não deixe "ligado" com placeholder.

---

## 1. Decisão de host (sua) — pré-requisito
As Pages Functions (`/api/*`) **não rodam no GitHub Pages**. Escolha:

- **Opção A — Cloudflare Pages como host primário** (recomendado p/ usar `/api/*` + D1).
  `npm run deploy` já existe (`wrangler pages deploy .`). Migra o domínio para o
  Cloudflare; o GitHub Pages vira redirect.
- **Opção B — Só Supabase (sem Pages Functions).** O browser fala direto com o
  Supabase via `np-cloud.js` (REST) + RLS. Mantém GitHub Pages como host. Mais
  simples; dispensa D1 e Functions.

> Recomendação: **Opção B** para começar (menos partes móveis), evoluindo p/ A
> quando precisar de lógica server-side (webhooks de pagamento, assinatura ICP).

## 2. Provisionar Supabase (free tier serve)
1. Criar projeto em https://supabase.com.
2. SQL Editor → aplicar **`supabase-schema-v6.sql`** (tabelas + RLS).
3. Project Settings → API → copiar **Project URL** e **anon public** (a chave anon
   é **pública**, segura no browser; a RLS é quem protege).
4. Em `cloud-config.js`: colar `supabaseUrl` + `supabasePublicAnon` **reais** e
   `enabled: true`. (Sem isso, mantenha `enabled: false`.)
5. Conferir RLS: `anon` só pode **INSERT** em `submissions`/`audit_logs`; **não**
   lê nem altera nada. (Já está no schema — valide no painel.)

## 3. Auth real (o item que mais derruba o teto) — substitui o PIN local
Hoje: `clinical-auth-adapter.js` (PIN local). Alvo (ver `ARCHITECTURE.md` §5.1):
1. Habilitar **Supabase Auth** (Email/Magic Link). MFA (TOTP) para `role=medico/admin`.
2. Tabela `profiles(user_id, role, …)` já existe; `role ∈ {admin,medico,secretaria,terapeuta,familia}`.
3. Novo adaptador (a escrever e **testar contra um projeto real**):
   `supabase.auth.signInWithOtp({email})` → sessão JWT → carrega `role` de `profiles`.
4. **Trocar os gates de UI** (`requireCapability`/`guardElement`) para checar a
   sessão Supabase em vez do PIN local. Manter o PIN só como atalho offline, se útil.

> ⚠️ Auth toca dados sensíveis. **Não habilitar em produção sem teste manual ponta a
> ponta** (login, expiração de sessão, RLS negando acesso cruzado entre clínicas).

## 4. Migrar dados local → nuvem (quando auth estiver de pé)
- `np-store.exportAll()` já gera o JSON portável. Escrever um importador que
  grava em `submissions`/`children` autenticado (1x por usuário, idempotente por id).
- Antes disso, **nada de PII real** na nuvem (o próprio `cloud-config.js` avisa).

## 5. Checklist de teste antes do primeiro paciente real
- [ ] `cloud-config.js` com chave real (sem placeholder) **ou** `enabled:false`.
- [ ] Login magic-link funciona; logout limpa sessão; sessão expira.
- [ ] RLS: usuário A **não** lê dados do usuário/clínica B (testar de fato).
- [ ] `anon` só consegue INSERT (testar SELECT/UPDATE negados).
- [ ] Backup/restore: `exportAll` → `importAll` sem perda nem duplicação.
- [ ] `GO_LIVE_CHECKLIST.md` e `SECURITY.md` revisados.

---

## Resumo: o que é código (feito/quase) × o que é decisão sua
| Item | Estado | Quem faz |
|---|---|---|
| Endpoints `/api/*` (D1) | Existe (`functions/api/*`) | — (precisa host Cloudflare) |
| Cliente Supabase REST | Existe (`np-cloud.js`, flag) | — |
| Schema + RLS | Existe (`supabase-schema-v6.sql`) | aplicar no projeto |
| **Auth real (Supabase Auth/MFA)** | **Falta** (hoje PIN local) | escrever + **testar** |
| Provisionar projeto + secrets | Falta | **você** |
| Decisão de host (A/B) | Falta | **você** |
| Corrigir `cloud-config.js` (bug) | Falta | 1 linha |

**Não dá para "ligar o backend" por PR de front-end sozinho:** exige um projeto
provisionado e teste manual. Este runbook é o caminho mínimo e honesto até lá.
