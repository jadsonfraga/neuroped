# DEPLOYMENT — passo a passo para sair do GitHub Pages e ir para Cloudflare + Supabase

**Dr. Jadson, este é o roteiro que você precisa seguir comigo na próxima sessão.**
Posso te guiar visualmente no Chrome, mas a maioria desses cliques exige você logado e clicando.

---

## Etapa 1 — Criar projeto Supabase (15 min)

1. Abrir https://supabase.com → "Start your project" → login GitHub ou Google
2. "New project":
   - Name: `neuroped-prod` (ou nome que prefira)
   - Database password: gerar senha forte e SALVAR em local seguro
   - Region: `South America (São Paulo)` se disponível, ou `East US`
   - Plano: Free (até 500 MB, suficiente para começar)
3. Aguardar provisionamento (~2 min)
4. **Salvar** (vou precisar depois):
   - Project URL: `https://xxxxxxxxxxxx.supabase.co`
   - Anon (public) key
   - Service role key (cuidado: nunca expor no frontend)

## Etapa 2 — Aplicar schema (5 min)

1. No Supabase: SQL Editor → "New query"
2. Colar o conteúdo de `supabase-schema-v6.sql`
3. Run
4. Verificar em "Table editor": devem aparecer `profiles`, `clinics`, `clinic_members`, `patients`, `submissions`, `consultations`, `documents`, `signatures`, `family_passes`, `audit_log`, `consents`

## Etapa 3 — Configurar Auth (10 min)

1. Authentication → Providers → Email: habilitar "Magic Link" e desabilitar "Confirm email" se quiser onboarding mais rápido (ou manter ON para mais segurança)
2. Authentication → URL Configuration:
   - Site URL: `https://neuroped.app` (ou o domínio escolhido)
   - Redirect URLs: adicionar staging também
3. Authentication → Email Templates: revisar template do magic link (português)
4. Settings → Auth → habilitar MFA TOTP

## Etapa 4 — Criar storage buckets (3 min)

1. Storage → "New bucket"
   - Name: `documents` — Public: OFF
   - Name: `signed-pdfs` — Public: OFF
2. Em cada bucket → Policies → adicionar política RLS para autenticados

## Etapa 5 — Conectar Cloudflare Pages (10 min)

1. Dashboard Cloudflare → Workers & Pages → "Create application" → "Pages" → "Connect to Git"
2. Selecionar repo `jadsonfraga/neuroped`
3. Production branch: `main`
4. Build configuration:
   - Framework preset: `None`
   - Build command: deixar vazio
   - Build output: `/`
5. Environment variables (em "Variables and Secrets"):
   - `SUPABASE_URL` = sua URL do Supabase
   - `SUPABASE_ANON` = sua anon key (pública é OK aqui)
   - `SUPABASE_SERVICE_ROLE` = sua service role (marcar como Secret)
   - `SIGNING_SECRET` = string aleatória de 64 caracteres (vou gerar)
   - `PUBLIC_BASE_URL` = `https://neuroped.app`
   - `CERT_PFX_BASE64` = (vazio por enquanto, vai receber o A1)
   - `CERT_PASS` = (vazio por enquanto)
6. "Save and Deploy"

## Etapa 6 — Configurar domínio próprio (15 min)

1. Você precisa de um domínio (`neuroped.app`, `drjadsonfraga.com`, etc.)
2. Cloudflare Pages → seu projeto → Custom domains → "Set up a custom domain"
3. Apontar DNS: Cloudflare guia
4. Aguardar SSL ser emitido (~10 min)
5. Forçar HTTPS

## Etapa 7 — Atualizar GitHub Pages (1 min)

1. GitHub repo Settings → Pages
2. Mudar source para "branch desativada" — você vai manter github.io só como redirect
3. OU criar um `index.html` simples em github.io que redireciona para o domínio próprio

## Etapa 8 — Testar end-to-end (15 min)

Comigo no Chrome:
- Magic link funciona
- MFA funciona
- Criar paciente → aparece no banco
- Aplicar escala → submission persiste
- Gerar laudo → documento criado
- Tentar acessar paciente de outro tenant → 403
- Logout → sessão revogada

## Etapa 9 — Receber o certificado A1 (você)

1. Você compra A1 em AC credenciada (Soluti, Certisign, Serasa, Valid)
2. Recebe arquivo `certificado.pfx`
3. Converte para base64: `base64 -i certificado.pfx | tr -d '\n'`
4. Cole em `CERT_PFX_BASE64` no Cloudflare Pages → Secret
5. Cole a senha em `CERT_PASS` → Secret
6. Cole o subject em `CERT_SUBJECT`: `CN=Jadson Fraga Araújo Júnior:CPFXXX`
7. Cole o emissor em `CERT_ISSUER`: ex. `AC Soluti RFB v5`

## Etapa 10 — Ativar assinatura ICP-Brasil (eu)

Uma vez que `CERT_PFX_BASE64` estiver setado, a Function `/api/sign` automaticamente:
- Carrega o cert do segredo
- Assina o PDF em formato PAdES-LTA
- Persiste assinatura no Supabase
- Retorna hash + verification URL

---

## Variáveis necessárias (resumo)

```
# Cloudflare Pages → Environment Variables → Production

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON=eyJhbGc...
SUPABASE_SERVICE_ROLE=eyJhbGc... (SECRET)
SIGNING_SECRET=<64 random chars> (SECRET)
PUBLIC_BASE_URL=https://neuroped.app
CERT_PFX_BASE64=<base64 do .pfx> (SECRET, deixar vazio até receber)
CERT_PASS=<senha do certificado> (SECRET, deixar vazio até receber)
CERT_SUBJECT=CN=Jadson Fraga:CPFXXX...
CERT_ISSUER=AC Soluti RFB v5
CERT_VALID_UNTIL=2027-05-28
```

## Rollback se algo der errado

- GitHub Pages permanece live em `jadsonfraga.github.io/neuroped/` durante toda transição
- Cloudflare Pages pode ser revertido para qualquer deploy anterior via dashboard
- DNS pode voltar para GitHub Pages alterando CNAME
- Service Worker antigo pode ser desregistrado via DevTools → Application

---

## O que eu posso fazer autonomamente AGORA

Sem precisar de credenciais suas:

✅ Construir todos os arquivos do app v6 com integração Supabase Auth
✅ Construir Functions `/api/sign`, `/api/verify`, `/api/health`
✅ Construir página pública `/verificar.html`
✅ Atualizar PDF generator para incluir QR code de verificação
✅ Documentação completa
✅ Push para um branch `v6-prod-ready`

Quando você passar:
- URL + chaves Supabase → eu termino as variáveis de ambiente
- Certificado A1 → eu ativo assinatura ICP-Brasil
- Domínio → eu finalizo redirect e SSL
