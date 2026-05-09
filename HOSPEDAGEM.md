# Hospedagem — Analise comparativa para NeuroPed EDJ

> Tres niveis de recomendacao, cada um com passos exatos, comandos, custos e
> consideracoes LGPD para hospedar a aplicacao fullstack (Node + SQLite/Postgres).

---

## Recomendacao por nivel

| Nivel | Provedor | Custo/mes | Setup | LGPD |
|-------|----------|-----------|-------|------|
| Recomendado | Render Pro + Postgres | R$ 175-280 | 30 min | Bom (com DPA) |
| Barato | Railway / Fly.io | R$ 50-150 | 45 min | Aceitavel (com DPA) |
| Premium | AWS Sao Paulo (sa-east-1) | R$ 350-1.500 | 4-8h | Excelente (servidor BR) |
| Brasil-first | Locaweb VPS + Postgres | R$ 100-300 | 1-2h | Excelente (servidor BR) |

---

## NIVEL RECOMENDADO — Render

**Por que:** Setup git-driven simples, build automatico, SSL incluso, suporta Node + Postgres no mesmo painel. Bom para o estagio atual.

**Localizacao:** Frankfurt (UE) ou Oregon (US) — exige DPA e analise LGPD para dado sensivel.

### Passos

1. Criar conta em https://render.com (login com GitHub)
2. Conectar o repositorio `jadsonfraga/neuroped`
3. Render Dashboard -> New -> Web Service
   - Build command: `npm ci && npm run build`
   - Start command: `npm start`
   - Region: Frankfurt (proxima a UE/Brasil)
   - Plan: Standard (R$ 35/mes para 2GB RAM)
4. Render Dashboard -> New -> Postgres
   - Plan: Starter R$ 35/mes (1GB) ou Pro R$ 105/mes (4GB com backup)
   - Region: mesma do Web Service
5. Conectar: copiar `DATABASE_URL` interna do Postgres no Web Service
6. Definir env vars (em Settings -> Environment):
   ```
   NODE_ENV=production
   PORT=10000
   NEUROPED_MASTER_KEY=__base64_48bytes__
   NEUROPED_JWT_SECRET=__base64_64bytes__
   ADMIN_EMAIL=admin@drjadsonfraga.com.br
   ADMIN_NAME=Dr. Jadson Fraga
   ADMIN_INITIAL_PASSWORD=__senha_forte_temporaria__
   CORS_ORIGINS=https://neuroped.drjadsonfraga.com.br
   SMTP_HOST=...
   SMTP_PORT=587
   SMTP_USER=...
   SMTP_PASSWORD=...
   SMTP_FROM=NeuroPed EDJ <noreply@drjadsonfraga.com.br>
   ```
7. Deploy automatico em cada push para main

**Custo total estimado:** R$ 175-280/mes
- Web Service Standard: R$ 35
- Postgres Pro: R$ 105
- Email transacional (Brevo): R$ 0-100
- Dominio + SSL: gratis (Cloudflare na frente)

**Pendencias LGPD:**
- [ ] Assinar DPA (Data Processing Agreement) com Render
- [ ] Documentar transferencia internacional na politica de privacidade
- [ ] Considerar migrar para servidor BR se volume de dados sensiveis crescer

---

## NIVEL BARATO — Railway / Fly.io

**Por que:** Plano gratuito para teste; Railway tem deploy git-driven similar a Render; Fly.io permite escolher regiao GRU (Sao Paulo).

### Railway

1. Criar conta https://railway.app
2. New Project -> Deploy from GitHub
3. Adicionar Postgres plugin
4. Definir env vars
5. Custo: gratuito ate $5 de uso/mes; depois ~R$ 50-150/mes

### Fly.io (com regiao Sao Paulo - GRU)

```bash
# Instalar flyctl
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Criar app
flyctl launch --region gru --name neuroped-edj

# Adicionar Postgres
flyctl postgres create --region gru --name neuroped-db
flyctl postgres attach neuroped-db --app neuroped-edj

# Set secrets
flyctl secrets set NEUROPED_MASTER_KEY=... \
  NEUROPED_JWT_SECRET=... \
  SMTP_HOST=... \
  SMTP_USER=... \
  SMTP_PASSWORD=... \
  --app neuroped-edj

# Deploy
flyctl deploy
```

**Vantagem Fly.io:** servidor em Sao Paulo (GRU), latencia minima e LGPD-friendly.

**Custo:** ~R$ 50-100/mes para producao basica.

---

## NIVEL PREMIUM — AWS Sao Paulo (sa-east-1)

**Por que:** Servidor brasileiro = melhor caso LGPD para dados sensiveis. Compliance ISO 27001, SOC 2, suporte a contratos formais. Mas exige conhecimento de DevOps.

### Stack recomendada

- **App:** Elastic Beanstalk Node.js (sa-east-1) ou ECS Fargate
- **DB:** RDS PostgreSQL t4g.micro (sa-east-1, encryption at rest com KMS)
- **Storage:** S3 sa-east-1 (para anexos/laudos PDF)
- **CDN:** CloudFront
- **Email:** SES sa-east-1 (R$ 0,50 por mil emails)
- **DNS:** Route 53 (~R$ 2,50/mes por zona)
- **Secrets:** AWS Secrets Manager (~R$ 2/segredo/mes)
- **WAF:** opcional (~R$ 50/mes) para protecao OWASP

### Passos resumidos

1. Criar conta AWS, ativar MFA root
2. IAM: criar usuario dev com permissoes restritas
3. RDS:
   ```
   Engine: Postgres 16
   Region: sa-east-1
   Storage encryption: enabled (KMS managed)
   Multi-AZ: opcional (R$ 60+/mes adicional)
   Backup retention: 30 dias
   ```
4. Elastic Beanstalk: criar env Node 20, fazer eb init + eb create
5. Secrets Manager: criar secrets `neuroped/master-key`, `neuroped/jwt-secret`
6. Aplicacao consome secrets via SDK ou env vars do EB
7. Route 53 + ACM: configurar dominio + SSL gratuito
8. CloudFront: por na frente do EB
9. SES: validar dominio, sair do sandbox

### Custo estimado

| Item | Mensal (BRL) |
|------|--------------|
| EB t4g.small + load balancer | 280-400 |
| RDS t4g.micro Multi-AZ | 280-380 |
| S3 + transferencia | 30-80 |
| CloudFront 100GB | 50-150 |
| Route 53 | 5 |
| Secrets Manager | 10 |
| SES (10k emails) | 5 |
| **Total** | **R$ 660-1.030** |

Para single-AZ basico sem multi-AZ: ~R$ 350-500/mes.

### Pendencias LGPD

- [x] Servidor em territorio BR (sa-east-1)
- [x] Encryption at rest (KMS)
- [x] Encryption in transit (TLS 1.3)
- [ ] Assinar DPA AWS BAA (sob demanda)
- [ ] Documentar fluxo de dados em politica de privacidade
- [ ] Plano de resposta a incidente alinhado a 48h ANPD

---

## NIVEL BRASIL-FIRST — Locaweb / KingHost / HostGator BR

**Por que:** Servidor 100% Brasil, infraestrutura nacional, contrato em portugues, suporte BR.

### Locaweb VPS

- Plano VPS Cloud: R$ 80-200/mes (2-4 vCPU, 4-8GB RAM)
- SSL Let's Encrypt gratuito
- Backup automatico opcional (~R$ 30/mes)
- Postgres nao gerenciado (instalar voce mesmo no VPS)

### Setup tipico

```bash
# Acesso SSH
ssh root@__seu_ip__

# Instalar Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Postgres
apt install -y postgresql postgresql-contrib

# nginx como reverse proxy
apt install -y nginx certbot python3-certbot-nginx

# Configurar nginx (conf basica em /etc/nginx/sites-available/neuroped)
# proxy_pass http://localhost:5000

# Certificado SSL
certbot --nginx -d neuroped.drjadsonfraga.com.br

# PM2 para keep alive
npm install -g pm2
pm2 start npm --name neuroped -- start
pm2 startup systemd
pm2 save

# Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

**Custo:** R$ 100-300/mes.

**Vantagem:** servidor no Brasil, CNPJ nacional, conformidade LGPD facilitada.
**Desvantagem:** voce e responsavel por backup, monitoring, atualizacao do SO.

---

## Comparativo final

| Criterio | Render | Railway | Fly GRU | AWS BR | Locaweb |
|----------|--------|---------|---------|--------|---------|
| Servidor BR | Nao | Nao | Sim | Sim | Sim |
| Setup | 30min | 30min | 45min | 4-8h | 1-2h |
| Manutencao | Baixa | Baixa | Baixa | Media | Alta |
| Backup auto | Sim | Sim | Sim | Sim | Configurar |
| Custo basico | R$ 175 | R$ 50 | R$ 80 | R$ 350 | R$ 100 |
| Compliance LGPD | Bom (DPA) | Aceitavel | Bom | Excelente | Excelente |

## Recomendacao final por momento

**Hoje (validacao):** Fly.io GRU - barato, BR, automatizado, sem dor.

**3 meses (validacao com pacientes reais):** AWS sa-east-1 single-AZ ou Locaweb VPS - servidor BR, compliance solida.

**12 meses (escala):** AWS sa-east-1 multi-AZ - alta disponibilidade, certificacoes formais.

---

## Sequencia recomendada de migracao

1. **Hoje:** rodar local para validar
2. **Semana 1:** deploy em Fly.io GRU (homologacao com dados ficticios)
3. **Semana 2-3:** revisar com advogado LGPD especialista em saude
4. **Mes 1:** migrar para AWS sa-east-1 ou Locaweb (com DPA assinado)
5. **Mes 2:** comecar a aceitar dados reais de pacientes (com consentimento granular)
6. **Mes 3:** primeira auditoria interna + monitoring (Sentry/Datadog)
7. **Ano 1:** auditoria externa profissional + ISO 27001 se objetivo for B2B

---

Atualizado: 2026-05-07. Custos sao estimativas em BRL com cambio aproximado.
