# NeuroPed EDJ — Plataforma Fullstack

[![Build e Deploy NeuroPed](https://github.com/jadsonfraga/neuroped/actions/workflows/deploy.yml/badge.svg)](https://github.com/jadsonfraga/neuroped/actions/workflows/deploy.yml)

> Aplicativo clinico de neuropediatria com backend real, autenticacao, criptografia AES-GCM, conformidade LGPD substantiva e route guards. Construido para uso profissional do Dr. Jadson Fraga (CRM-PE 25227, RQE 17756).

> ⚠️ **Uso clínico restrito.** Este sistema processa dados de saúde de crianças. Operar em conformidade com LGPD e normas do CFM. URL canônica de produção: https://neuroped.pages.dev

## Visao geral

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite 7 + Tailwind + Radix UI + wouter |
| Backend canônico | Cloudflare Pages Functions + D1 |
| Backend local | Express 5 + TypeScript via tsx |
| ORM | Drizzle |
| Banco | D1 em produção; SQLite (better-sqlite3) no Express local |
| Auth | JWT (HS256) access + opaque refresh com rotacao + bcrypt |
| Cripto | AES-256-GCM server-side; rascunhos locais com chave efêmera não persistida |
| Email | nodemailer com SMTP (Brevo/Resend/SES recomendado) |
| Seguranca | helmet + rate-limit + CORS restrito + audit logs |

## Estrutura

```
.
|- server/
|  |- index.ts            # Entry Express
|  |- routes.ts           # Rotas /api/*
|  |- storage.ts          # Drizzle + bootstrap admin
|  |- static.ts           # Servidor estatico em prod
|  |- vite.ts             # Vite dev integration
|  |- auth/
|  |  |- routes.ts        # /api/auth/* (register/login/refresh/logout/me)
|  |- middleware/
|  |  |- auth.ts          # requireAuth, requireRole
|  |  |- security.ts      # helmet, cors, rate-limit
|  |- lib/
|     |- crypto.ts        # AES-GCM encrypt/decrypt + HMAC + tokens
|     |- password.ts      # bcrypt + lockout
|     |- jwt.ts           # access/refresh tokens
|     |- audit.ts         # log de auditoria
|     |- email.ts         # nodemailer SMTP
|     |- patientCrypto.ts # camada de cripto para Patient
|- client/src/
|  |- App.tsx             # Router com RouteGuard nas rotas sensiveis
|  |- contexts/
|  |  |- AuthContext.tsx
|  |- components/
|  |  |- RouteGuard.tsx
|  |- lib/
|  |  |- authClient.ts    # fetch wrapper + refresh automatico
|  |- pages/
|     |- login.tsx
|     |- session-expired.tsx
|     |- lgpd-consent.tsx
|     |- ... (75+ paginas de escalas)
|- shared/
|  |- schema.ts           # Drizzle schemas + Zod validators
|- .env.example
|- package.json
|- README.md
|- DEPLOY.md
|- LGPD.md
|- SECURITY.md
|- CONTRIBUTING.md
|- HOSPEDAGEM.md          # comparativo Brasil
```

## Setup local

### 1. Pre-requisitos

- Node.js >= 20
- npm >= 10
- Git

### 2. Instalar dependencias

```bash
cd "NeuroPed Escalas de Neuropedia"
npm install
```

### 3. Configurar ambiente

```bash
cp .env.example .env
# Edite .env e preencha:
#   NEUROPED_MASTER_KEY  (gere com: node -e "console.log(require('crypto').randomBytes(48).toString('base64'))")
#   NEUROPED_JWT_SECRET  (gere com: node -e "console.log(require('crypto').randomBytes(64).toString('base64'))")
#   ADMIN_EMAIL, ADMIN_NAME, ADMIN_INITIAL_PASSWORD
#   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
```

### 4. Rodar dev

```bash
npm run dev
```

O servidor sobe em `http://localhost:5000` (frontend + backend juntos via Vite middleware).

### 5. Login inicial

Apos primeiro `npm run dev`, o usuario admin e criado automaticamente com email/senha de `ADMIN_EMAIL` / `ADMIN_INITIAL_PASSWORD`. Essa credencial nasce como temporaria: depois do login, somente `/alterar-senha` e a consulta da propria sessao ficam liberadas ate a troca segura.

**IMPORTANTE:** apos primeiro login, REMOVA `ADMIN_INITIAL_PASSWORD` do `.env` para evitar recriar admin acidentalmente.

O plano comercial e de R$ 99 por pessoa/mes, com uma avaliacao de 14 dias por conta. Em producao, configure `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` e `STRIPE_WEBHOOK_SECRET` apenas como secrets do GitHub/Cloudflare. Sem o trio completo, a contratacao falha fechada e o app nao simula cobranca. A equipe entra por convites de uso unico (7 dias, token armazenado somente como hash); convites pendentes reservam assento e o D1 impede excesso sob concorrencia.

## Build de producao

```bash
npm run build
NODE_ENV=production npm start
```

Para deploy completo, ver `DEPLOY.md`.

## Documentos relacionados

- [DEPLOY.md](./DEPLOY.md) — passos de deploy em diferentes provedores
- [HOSPEDAGEM.md](./HOSPEDAGEM.md) — comparativo de hospedagem brasileira
- [LGPD.md](./LGPD.md) — conformidade LGPD substantiva
- [SECURITY.md](./SECURITY.md) — politica e checklist de seguranca
- [CONTRIBUTING.md](./CONTRIBUTING.md) — regras de contribuicao

## API resumo

### Auth
- `POST /api/auth/login` — credentials, devolve access + refresh
- `POST /api/auth/refresh` — rotaciona refresh
- `POST /api/auth/logout` — revoga refresh
- `GET  /api/auth/me` — info do usuario logado
- `POST /api/auth/change-password`

### Pacientes (campos sensiveis criptografados)
- `POST   /api/patients` — protegido (admin/professional)
- `GET    /api/patients` — protegido
- `GET    /api/patients/:id` — protegido
- `PATCH  /api/patients/:id` — protegido (admin/professional)
- `DELETE /api/patients/:id` — protegido (admin/professional)

### Resultados de escalas
- `POST   /api/results` — protegido
- `GET    /api/results` — protegido
- `GET    /api/results/:id` — protegido
- `DELETE /api/results/:id` — protegido (admin/professional)

### LGPD
- `POST /api/consents` — registra consentimento (com IP/UA/timestamp)
- `GET  /api/consents` — lista consentimentos do usuario
- `POST /api/lgpd/export-request` — solicita exportacao art. 18
- `POST /api/lgpd/delete-request` — solicita exclusao art. 18

### Email
- `POST /api/send-report` — envia relatorio via SMTP (rate-limited)

## Suporte

Para questoes tecnicas: abra issue no repositorio.
Para questoes clinicas: contato direto com Dr. Jadson Fraga.

---

**Conteudo educativo e de apoio clinico. Nao substitui consulta medica.**

© 2026 Dr. Jadson Fraga Araujo Junior. Todos os direitos reservados.
