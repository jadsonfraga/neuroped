# Deploy Automático — NeuroPed

Guia completo para colocar o NeuroPed em produção usando **apenas serviços gratuitos**, com deploy totalmente automático após um único `git push`.

---

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────┐
│  GitHub (jadsonfraga/neuroped)          │
│                                         │
│  push → GitHub Actions → build          │
│                     ↓                   │
│            dist/public/                 │
│                     ↓                   │
│         GitHub Pages (frontend)         │
│  https://jadsonfraga.github.io/neuroped │
└─────────────────────────────────────────┘
         ↕ API calls (HTTPS)
┌─────────────────────────────────────────┐
│  Render.com (backend Node.js)           │
│  https://neuroped-api.onrender.com      │
│                     ↓                   │
│  better-sqlite3 ou PostgreSQL (banco)   │
└─────────────────────────────────────────┘
```

---

## 1. Frontend — GitHub Pages (GRATUITO)

O deploy do frontend é **totalmente automático** a cada push para `main`.

### Ativação única (apenas na primeira vez)

1. Acesse: https://github.com/jadsonfraga/neuroped/settings/pages
2. Em **Source**, selecione **GitHub Actions**
3. Clique em **Save**

Pronto. A partir do próximo push, o deploy acontece automaticamente.

### URL de produção

```
https://jadsonfraga.github.io/neuroped/
```

### Configurar o Secret do PIN (uma única vez)

O PIN profissional é armazenado como hash SHA-256, nunca em texto puro.

**Gerar o hash:**
```bash
node -e "console.log(require('crypto').createHash('sha256').update('SEU_PIN').digest('hex'))"
```

Ou use o script auxiliar:
```bash
bash scripts/setup-env.sh
```

**Adicionar ao GitHub:**
1. Acesse: https://github.com/jadsonfraga/neuroped/settings/secrets/actions
2. Clique em **New repository secret**
3. **Name**: `VITE_PIN_HASH`
4. **Value**: (o hash gerado acima)
5. Clique em **Add secret**

---

## 2. Backend — Render.com (GRATUITO)

O `render.yaml` na raiz do repositório configura o serviço automaticamente.

### Configuração inicial (apenas na primeira vez)

1. Crie uma conta em https://render.com
2. Clique em **New** → **Blueprint**
3. Conecte sua conta GitHub
4. Selecione o repositório `jadsonfraga/neuroped`
5. O Render detectará o `render.yaml` e configurará tudo automaticamente
6. Clique em **Apply**

### Configurar variáveis de ambiente no Render

No dashboard do Render, acesse **neuroped-api** → **Environment** e adicione:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `PIN_HASH` | (hash SHA-256 do PIN) | Mesmo hash gerado acima |
| `JWT_SECRET` | (string aleatória, 64+ chars) | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `DATABASE_URL` | `postgresql://...` | String de conexão PostgreSQL |

### Observação sobre o plano gratuito

O serviço gratuito do Render **hiberna após 15 minutos sem uso**. O primeiro acesso após inatividade pode demorar ~30 segundos enquanto o servidor "acorda". Para uso clínico diário, isso é aceitável.

### URL do backend

```
https://neuroped-api.onrender.com
```

---

## 3. Banco de Dados — Opções Gratuitas

### Opção A: Neon (PostgreSQL — recomendado)

1. Crie conta em https://neon.tech
2. Crie um projeto e um banco chamado `neuroped`
3. Copie a **Connection String** (formato: `postgresql://user:pass@host/neuroped?sslmode=require`)
4. Configure como `DATABASE_URL` no Render

### Opção B: Supabase (PostgreSQL)

1. Crie conta em https://supabase.com
2. Crie um projeto
3. Acesse **Settings** → **Database** → copie a **Connection string (URI)**
4. Configure como `DATABASE_URL` no Render

### Opção C: Cloudflare D1 (SQLite edge — para Workers)

1. Instale Wrangler: `npm install -g wrangler`
2. Autentique: `npx wrangler login`
3. Crie o banco: `npx wrangler d1 create neuroped-db`
4. Substitua o `database_id` em `wrangler.toml` pelo ID gerado
5. Aplique o schema: `npx wrangler d1 execute neuroped-db --file=./schema.sql`

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
| Logs do backend | Render Dashboard → neuroped-api → Logs |

---

## 6. Scripts Auxiliares

```bash
# Configurar .env local e gerar hash do PIN
bash scripts/setup-env.sh

# Build e instruções de deploy
bash scripts/deploy.sh

# Auditoria de segurança manual
npm audit
```

---

## 7. Resolução de Problemas

**Build falha no GitHub Actions:**
- Verifique os logs em https://github.com/jadsonfraga/neuroped/actions
- Confirme que `VITE_PIN_HASH` está configurado nos Secrets

**App não carrega após deploy:**
- Verifique se o Source do GitHub Pages está em **GitHub Actions** (não em branch)
- Aguarde 2-3 minutos após o workflow terminar

**Backend retorna 502:**
- O servidor pode estar hibernando — aguarde 30s e tente novamente
- Verifique os logs no Render Dashboard

**Erro de banco de dados:**
- Confirme que `DATABASE_URL` está corretamente configurado no Render
- Verifique se o banco PostgreSQL está acessível externamente
