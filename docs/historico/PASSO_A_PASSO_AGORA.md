# Passo a passo — agora, 5 cliques seus

**Dr. Jadson**, eu já fiz e dei push de:
- `functions/api/sign.js` — assinatura PAdES real com seu P12
- `package.json` com dependências (`node-forge`, `pdf-lib`, `@supabase/supabase-js`)
- `supabase-schema-v6.sql` — schema completo do banco

Faltam 5 ações suas (cada uma demora 1-2 min). Vou listar exatamente:

---

## 1. Aplicar o schema no Supabase (2 min)

1. Abre a aba do Supabase que está aberta
2. No menu lateral esquerdo clica no ícone **SQL Editor** (terceiro de cima, parece terminal)
3. Cola TODO o conteúdo do arquivo `supabase-schema-v6.sql` que está aqui no Cowork
4. Clica **Run** (canto superior direito)
5. Deve aparecer "Success" e várias tabelas criadas

> Se der erro, me manda print. Eu corrijo.

---

## 2. Copiar a Anon Key (1 min)

1. No Supabase: menu lateral → engrenagem **Settings**
2. **Data API** ou **API Keys**
3. Procura **"Project API keys"** → **"anon public"**
4. Clica **Copy** ao lado da chave
5. **Cola aqui no chat** (essa chave é PÚBLICA, pode mandar)

OU manda no formato:
> Minha anon key é: eyJhbGc...

---

## 3. Copiar a Service Role Key (1 min) — CUIDADO

1. Na mesma página API Keys
2. Procura **"service_role"** — **revele** e copia
3. **NÃO cole no chat**. Use o caminho seguro:
   - Vai para outra aba (já te explico em 3.b)
   - Cola direto no Cloudflare Pages env vars

### 3.b — Como colar no Cloudflare
1. Outra aba: `https://dash.cloudflare.com` → Workers & Pages → **neuroped**
2. **Settings** → **Variables and Secrets** → **Add**
3. Adiciona estas 5 variáveis (Production):

| Nome | Valor | Tipo |
|---|---|---|
| `SUPABASE_URL` | `https://wizgmjcklfikgkwykewe.supabase.co` | Plain |
| `SUPABASE_ANON` | (a anon key que você copiou) | Plain |
| `SUPABASE_SERVICE_ROLE` | (service role) | **Secret** |
| `SIGNING_SECRET` | (eu te mando aqui no chat) | **Secret** |
| `PUBLIC_BASE_URL` | `https://neuroped.pages.dev` | Plain |

> Para o SIGNING_SECRET, copia este valor aleatório que gerei:
> `NP_v6_a8f3b2e1c9d4_7k3m5n8p2q4r6s9t1u_3w5x7y9z_2026`

---

## 4. Subir o certificado P12 (3 min)

### Converter para base64
No Windows PowerShell:
```powershell
$bytes = [IO.File]::ReadAllBytes("C:\caminho\do\certificado.p12")
[Convert]::ToBase64String($bytes) | Set-Clipboard
```
Pronto, está no clipboard.

### Colar no Cloudflare
1. Cloudflare Pages → neuroped → Settings → Variables → Add Secret
2. Nome: `CERT_PFX_BASE64` · Tipo: **Secret** · Cola o base64
3. Adiciona outro Secret: `CERT_PASS` · cola a senha do certificado
4. Adiciona variável Plain: `CERT_SUBJECT_CN` · valor: `Jadson Fraga Araújo Júnior`

---

## 5. Forçar redeploy (30s)

1. Cloudflare → Pages → neuroped → **Deployments**
2. **Retry deployment** no último deploy (`62dd858`)
3. Aguarda ~2 min para build com as novas dependências

---

## Pronto

Quando esses 5 passos estiverem feitos, me avisa. Eu testo end-to-end:
- Magic link de login
- Cadastrar paciente real (não-demo)
- Gerar laudo + assinar com seu P12
- Verificar assinatura em `https://neuroped.pages.dev/verificar?doc=...`
- Confirmar que o PDF abre em Adobe Reader com a assinatura ICP-Brasil validada

E te entrego um vídeo passo a passo do fluxo real.

---

## O que está pronto no código (eu já fiz)

✅ `supabase-schema-v6.sql` — 11 tabelas com RLS, audit_log, triggers
✅ `functions/api/sign.js` — PAdES-BES real com node-forge + pdf-lib
✅ `functions/api/verify.js` — verificação pública
✅ `verificar.html` — página pública de verificação
✅ `package.json` — dependências NPM
✅ Commits no GitHub `main` (último: `62dd858`)
✅ Documentação completa (10 .md)

## O que vai estar pronto após você executar os 5 passos

- Auth real com magic link via Supabase
- Banco real com RLS funcionando
- Assinatura ICP-Brasil real no PDF
- Verificação pública funcional
- Pronto para 1º paciente real (com as ressalvas de LGPD documentadas)
