# Deploy AutomÃ¡tico â€” NeuroPed

> **Arquitetura vigente:** produção canônica em Cloudflare Pages Functions + D1. GitHub Pages e Vercel são mirrors estáticos. As instruções antigas de Render/Postgres abaixo são apenas histórico e não devem ser usadas para dados clínicos; consulte `docs/DEPLOY_OFICIAL.md` e `docs/BACKEND_D1_SETUP.md`.

Guia completo para colocar o NeuroPed em produÃ§Ã£o usando **apenas serviÃ§os gratuitos**, com deploy totalmente automÃ¡tico apÃ³s um Ãºnico `git push`.

---

## VisÃ£o Geral da Arquitetura

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  GitHub (jadsonfraga/neuroped)          â”‚
â”‚                                         â”‚
â”‚  push â†’ GitHub Actions â†’ build          â”‚
â”‚                     â†“                   â”‚
â”‚            dist/public/                 â”‚
â”‚                     â†“                   â”‚
â”‚         GitHub Pages (frontend)         â”‚
â”‚  https://jadsonfraga.github.io/neuroped â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
         â†• API calls (HTTPS)
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Render.com (backend Node.js)           â”‚
â”‚  https://neuroped-api.onrender.com      â”‚
â”‚                     â†“                   â”‚
â”‚  better-sqlite3 ou PostgreSQL (banco)   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## 1. Frontend â€” GitHub Pages (GRATUITO)

O deploy do frontend Ã© **totalmente automÃ¡tico** a cada push para `main`.

### AtivaÃ§Ã£o Ãºnica (apenas na primeira vez)

1. Acesse: https://github.com/jadsonfraga/neuroped/settings/pages
2. Em **Source**, selecione **GitHub Actions**
3. Clique em **Save**

Pronto. A partir do prÃ³ximo push, o deploy acontece automaticamente.

### URL de produÃ§Ã£o

```
https://jadsonfraga.github.io/neuroped/
```

### Seguranca do frontend publico

O frontend publicado em GitHub Pages, Cloudflare Pages ou Vercel e estatico. Ele nao deve receber PIN, senha, JWT secret ou chave mestra no build.

Areas clinicas com dados reais devem chamar a API oficial autenticada, com sessao nominal por usuario e autorizacao server-side.

---

## 2. Backend â€” Render.com (GRATUITO)

O `render.yaml` na raiz do repositÃ³rio configura o serviÃ§o automaticamente.

### ConfiguraÃ§Ã£o inicial (apenas na primeira vez)

1. Crie uma conta em https://render.com
2. Clique em **New** â†’ **Blueprint**
3. Conecte sua conta GitHub
4. Selecione o repositÃ³rio `jadsonfraga/neuroped`
5. O Render detectarÃ¡ o `render.yaml` e configurarÃ¡ tudo automaticamente
6. Clique em **Apply**

### Configurar variÃ¡veis de ambiente no Render

No dashboard do Render, acesse **neuroped-api** â†’ **Environment** e adicione:

| VariÃ¡vel | Valor | DescriÃ§Ã£o |
|----------|-------|-----------|
| `NEUROPED_MASTER_KEY` | string aleatoria forte | `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"` |
| `NEUROPED_JWT_SECRET` | string aleatoria forte | `node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"` |
| `ADMIN_INITIAL_PASSWORD` | senha temporaria forte | remover apos o primeiro login |
| `DATABASE_URL` | `postgresql://...` | String de conexÃ£o PostgreSQL |

### ObservaÃ§Ã£o sobre o plano gratuito

O serviÃ§o gratuito do Render **hiberna apÃ³s 15 minutos sem uso**. O primeiro acesso apÃ³s inatividade pode demorar ~30 segundos enquanto o servidor "acorda". Para uso clÃ­nico diÃ¡rio, isso Ã© aceitÃ¡vel.

### URL do backend

```
https://neuroped-api.onrender.com
```

---

## 3. Banco de Dados â€” OpÃ§Ãµes Gratuitas

### OpÃ§Ã£o A: Neon (PostgreSQL â€” recomendado)

1. Crie conta em https://neon.tech
2. Crie um projeto e um banco chamado `neuroped`
3. Copie a **Connection String** (formato: `postgresql://user:pass@host/neuroped?sslmode=require`)
4. Configure como `DATABASE_URL` no Render

### OpÃ§Ã£o B: Supabase (PostgreSQL)

1. Crie conta em https://supabase.com
2. Crie um projeto
3. Acesse **Settings** â†’ **Database** â†’ copie a **Connection string (URI)**
4. Configure como `DATABASE_URL` no Render

### OpÃ§Ã£o C: Cloudflare D1 (SQLite edge â€” para Workers)

1. Instale Wrangler: `npm install -g wrangler`
2. Autentique: `npx wrangler login`
3. Crie o banco: `npx wrangler d1 create neuroped-db`
4. Substitua o `database_id` em `wrangler.toml` pelo ID gerado
5. Aplique o schema e as migrações aditivas pelo workflow **Provision D1 backend**. Ele verifica a coluna de ownership antes de criá-la e aplica, de modo idempotente, sessões e consentimentos. Para evitar `ALTER TABLE` duplicado, prefira o workflow à execução manual.

---

## 4. Fluxo de Deploy Completo

```bash
# Desenvolvendo...
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# Automaticamente:
# 1. GitHub Actions inicia
# 2. npm ci + npm run build
# 3. dist/public/ enviado para GitHub Pages
# 4. Render detecta o push e inicia rebuild do backend
# 5. Em ~2 min: frontend atualizado
# 6. Em ~5 min: backend atualizado
```

---

## 5. Monitoramento

| Recurso | URL |
|---------|-----|
| Actions (CI/CD) | https://github.com/jadsonfraga/neuroped/actions |
| GitHub Pages | https://github.com/jadsonfraga/neuroped/deployments |
| Render Dashboard | https://dashboard.render.com |
| Logs do backend | Render Dashboard â†’ neuroped-api â†’ Logs |

---

## 6. Scripts Auxiliares

```bash
# Configurar .env local e gerar hash do PIN
bash scripts/setup-env.sh

# Build e instruÃ§Ãµes de deploy
bash scripts/deploy.sh

# Auditoria de seguranÃ§a manual
npm audit
```

---

## 7. ResoluÃ§Ã£o de Problemas

**Build falha no GitHub Actions:**
- Verifique os logs em https://github.com/jadsonfraga/neuroped/actions
- Confirme que `NEUROPED_JWT_SECRET` estÃ¡ configurado nos Secrets

**App nÃ£o carrega apÃ³s deploy:**
- Verifique se o Source do GitHub Pages estÃ¡ em **GitHub Actions** (nÃ£o em branch)
- Aguarde 2-3 minutos apÃ³s o workflow terminar

**Backend retorna 502:**
- O servidor pode estar hibernando â€” aguarde 30s e tente novamente
- Verifique os logs no Render Dashboard

**Erro de banco de dados:**
- Confirme que `DATABASE_URL` estÃ¡ corretamente configurado no Render
- Verifique se o banco PostgreSQL estÃ¡ acessÃ­vel externamente
