# Deploy

> Passos de deploy em diferentes provedores. Pre-requisito: leia [HOSPEDAGEM.md](./HOSPEDAGEM.md) primeiro para escolher provedor.

## Pre-deploy checklist

- [ ] `npm install` sem erros
- [ ] `npm run build` sem erros
- [ ] `npm run check` (TypeScript) sem erros
- [ ] Variaveis em `.env` configuradas (use `.env.example` como base)
- [ ] `NEUROPED_MASTER_KEY` gerada e armazenada com seguranca
- [ ] `NEUROPED_JWT_SECRET` gerada e armazenada com seguranca
- [ ] SMTP configurado e testado
- [ ] DNS apontando para o provedor escolhido

## Gerar segredos

```bash
# Master key (criptografia AES) - 48 bytes em base64
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# JWT secret - 64 bytes em base64
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Senha admin temporaria (24 bytes) - trocar no primeiro login
node -e "console.log(require('crypto').randomBytes(18).toString('base64'))"
```

Armazene esses valores em gerenciador de segredos (1Password, AWS Secrets Manager, etc.). Nao envie por email/Slack/WhatsApp.

## Deploy: Render (recomendado)

```bash
# 1. Criar conta em render.com
# 2. New -> Web Service -> Conectar repo
# 3. Configurar:
#    Build: npm ci && npm run build
#    Start: npm start
# 4. New -> Postgres
# 5. Conectar DATABASE_URL no Web Service
# 6. Settings -> Environment -> adicionar todas as vars do .env
# 7. Manual Deploy -> Deploy latest commit
# 8. Acompanhar logs ate ver: "NeuroPed EDJ rodando em ..."
```

Apos primeiro deploy bem-sucedido, REMOVA `ADMIN_INITIAL_PASSWORD` das env vars do Render.

## Deploy: Fly.io (servidor Sao Paulo)

```bash
# Login
flyctl auth login

# Criar app
flyctl launch --region gru --name neuroped-edj --no-deploy

# Editar fly.toml gerado se necessario (porta 5000, auto-stop opcional)

# Postgres
flyctl postgres create --region gru --name neuroped-db
flyctl postgres attach neuroped-db --app neuroped-edj

# Secrets
flyctl secrets set NEUROPED_MASTER_KEY="$(node -e "console.log(require('crypto').randomBytes(48).toString('base64'))")" --app neuroped-edj
flyctl secrets set NEUROPED_JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(64).toString('base64'))")" --app neuroped-edj
flyctl secrets set ADMIN_EMAIL=admin@drjadsonfraga.com.br --app neuroped-edj
flyctl secrets set ADMIN_NAME="Dr. Jadson Fraga" --app neuroped-edj
flyctl secrets set ADMIN_INITIAL_PASSWORD="__senha_forte__" --app neuroped-edj
flyctl secrets set SMTP_HOST=smtp-relay.brevo.com SMTP_PORT=587 --app neuroped-edj
flyctl secrets set SMTP_USER=__user__ SMTP_PASSWORD=__pass__ --app neuroped-edj
flyctl secrets set SMTP_FROM="NeuroPed EDJ <noreply@drjadsonfraga.com.br>" --app neuroped-edj
flyctl secrets set CORS_ORIGINS="https://neuroped.drjadsonfraga.com.br" --app neuroped-edj

# Deploy
flyctl deploy --app neuroped-edj

# Acompanhar
flyctl logs --app neuroped-edj
```

## Deploy: VPS Locaweb (servidor BR)

```bash
ssh root@__seu_ip__

# 1. Atualizar SO
apt update && apt upgrade -y

# 2. Instalar Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 3. Postgres + nginx + certbot
apt install -y postgresql postgresql-contrib nginx certbot python3-certbot-nginx ufw

# 4. Configurar Postgres
sudo -u postgres psql <<EOF
CREATE DATABASE neuroped;
CREATE USER neuroped WITH ENCRYPTED PASSWORD '__senha_db__';
GRANT ALL PRIVILEGES ON DATABASE neuroped TO neuroped;
EOF

# 5. Clonar repo
cd /opt
git clone https://github.com/jadsonfraga/neuroped.git
cd neuroped

# 6. Configurar .env
cp .env.example .env
nano .env  # editar com valores reais

# 7. Instalar deps + build
npm ci
npm run build

# 8. PM2
npm install -g pm2
pm2 start npm --name neuroped -- start
pm2 startup systemd
pm2 save

# 9. nginx (criar /etc/nginx/sites-available/neuroped)
cat > /etc/nginx/sites-available/neuroped <<EOF
server {
    listen 80;
    server_name neuroped.drjadsonfraga.com.br;
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
ln -s /etc/nginx/sites-available/neuroped /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 10. SSL
certbot --nginx -d neuroped.drjadsonfraga.com.br

# 11. Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 12. Validar
curl https://neuroped.drjadsonfraga.com.br/api/health
```

## Configurar dominio

1. Comprar dominio em Registro.br (R$ 40/ano para .com.br)
2. Apontar DNS:
   - **Render/Fly:** seguir instrucoes do painel
   - **VPS:** A record para IP do servidor
3. Adicionar dominio na env `CORS_ORIGINS`

## Pos-deploy: primeiro login

1. Abrir `https://__seu_dominio__/#/login`
2. Logar com `ADMIN_EMAIL` + `ADMIN_INITIAL_PASSWORD`
3. Sistema vai exigir troca de senha (`mustChangePassword: true`)
4. Trocar senha em `/configuracoes/alterar-pin`
5. **Voltar ao painel do provedor e REMOVER `ADMIN_INITIAL_PASSWORD`**
6. Criar usuarios profissionais via `/api/auth/register` (POST com auth admin)

## Monitoring (recomendado)

- **Uptime:** UptimeRobot (gratuito) ou BetterStack
- **Errors:** Sentry (free tier 5k events/mes)
- **Logs:** Datadog Free, LogTail, ou Render/Fly nativo

## Backup

### Postgres (Render/Railway/Fly)

Provedor faz backup automatico. Validar restore mensalmente.

### SQLite (VPS)

```bash
# Cron diario
0 3 * * * sqlite3 /opt/neuroped/neuroped.db ".backup '/var/backups/neuroped-$(date +\%Y\%m\%d).db'" && find /var/backups -name "neuroped-*.db" -mtime +30 -delete
```

## Troubleshooting

### App nao sobe: "NEUROPED_MASTER_KEY ausente"
Configure a variavel de ambiente no provedor.

### Login nao funciona: "Senha invalida"
- Verificar se admin foi criado: olhar logs por `[bootstrap] Usuario admin criado`
- Resetar via DB se necessario:
  ```sql
  UPDATE users SET password_hash = '$2b$12$...' WHERE email = 'admin@...';
  ```
  (gere o hash com `node -e "console.log(require('bcrypt').hashSync('nova_senha', 12))"`)

### Cripto: "Falha ao decriptar (auth tag invalido)"
A `NEUROPED_MASTER_KEY` foi alterada. **Nao trocar a master key sem re-encrypt** dos dados existentes. Restaurar a key original ou re-encrypt todos os dados.

### Email nao envia
Validar SMTP via:
```bash
curl -v telnet://smtp-relay.brevo.com:587
```
Se conectar mas autenticar falhar, verificar SMTP_USER/SMTP_PASSWORD.

---

Atualizado: 2026-05-07.
