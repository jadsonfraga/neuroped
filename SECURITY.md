# Security Policy & Checklist

## Reportar vulnerabilidade

Use o canal privado:
- WhatsApp: (87) 9 9109-7371
- Endereco: Rua Raimundo Lacerda, 001 â€” Sao Jose, Petrolina/PE â€” 56302-470

**NAO** abra issue publica para vulnerabilidades.

SLA:
- Confirmacao de recebimento: 72h
- Avaliacao inicial: 7 dias
- Patch critico: 14 dias
- Patch alto: 30 dias
- Patch medio/baixo: 90 dias
- Confidencialidade pre-disclosure: 90 dias apos patch

## HistÃ³rico de CorreÃ§Ãµes CrÃ­ticas

| Data | Severidade | Arquivo(s) | Problema | CorreÃ§Ã£o |
|------|-----------|------------|----------|----------|
| 2026-06-13 | CRITICO | `localUnlock.ts`, `PasswordGate.tsx`, `PinGate.tsx`, `auth/routes.ts` | PIN/hash local e ponte PIN -> JWT permitiam ataque offline e sessao compartilhada | Desativado. Areas clinicas exigem login nominal no backend seguro. |
| 2026-05-08 | ðŸ”´ CRÃTICO | `PasswordGate.tsx`, `pacientes.tsx`, `paciente-detalhe.tsx` | PIN historico hardcoded em plain text no codigo frontend | Removido do texto claro; modelo de PIN global desativado em 2026-06-13 |
| 2026-05-08 | ðŸŸ  ALTO | `PasswordGate.tsx` | `simpleHash()` trivialmente reversÃ­vel usado para autenticaÃ§Ã£o | SubstituÃ­do por `crypto.subtle.digest("SHA-256")` nativo do browser |

---

## Checklist de seguranca

### Codigo

- [x] Senhas com bcrypt cost 12, nunca em texto puro
- [x] JWT HS256 com `NEUROPED_JWT_SECRET` minimo 32 chars
- [x] Refresh token com hash SHA-256 em DB
- [x] Rotacao de refresh com deteccao de reuso e revogacao de sessoes ativas do usuario afetado
- [x] Lockout: 5 falhas = 15 min de bloqueio
- [x] Validacao Zod em toda entrada
- [x] Audit log em todo evento sensivel
- [x] Erros de auth genericos (nao vazam se email existe)
- [x] PBKDF2 100k iteracoes para derivacao de chave AES
- [x] AES-256-GCM com IV aleatorio por mensagem
- [x] HMAC-SHA256 para hash determinÃ­stico (CPF pesquisavel)
- [x] CSP restritiva (default-src 'self', frame-ancestors 'none')
- [x] HSTS preload
- [x] X-Frame-Options DENY
- [x] X-Content-Type-Options nosniff
- [x] Referrer-Policy strict-origin-when-cross-origin
- [x] Permissions-Policy bloqueando camera/mic/geo/payment

### Rate limiting

- [x] /api/* global: 100 req/min
- [x] /api/auth/login: 5 / 15min (skipSuccessfulRequests)
- [x] /api/send-report: 10 / hora
- [x] /api/* writes: 30 / min

### CORS

- [x] Restrito a origens explicitas via `CORS_ORIGINS`
- [x] credentials: true requer origem na whitelist
- [x] Methods explicitos (sem wildcard)

### Cookies

- [x] cookie-parser configurado
- [ ] httpOnly flag (TODO: migrar tokens para cookies httpOnly em producao)
- [ ] Secure flag em producao (HTTPS only)
- [ ] SameSite Strict ou Lax conforme caso de uso

### Banco de dados

- [x] Foreign keys habilitadas (`PRAGMA foreign_keys = ON`)
- [x] WAL mode para concorrencia
- [x] Indexes em colunas de busca (email, role, eventType)
- [x] Cascade delete onde apropriado
- [x] `set null` em FKs para audit logs (preserva historico)
- [ ] Migracao para Postgres em producao (TODO)
- [ ] Backup automatico (TODO via provedor)
- [ ] Encryption at rest no nivel do disco (provedor)

### Dependencies

- [ ] `npm audit` sem high/critical (rodar antes de cada deploy)
- [ ] Renovacao trimestral de dependencias
- [ ] Lockfile committed

### Secrets

- [x] `.env` no gitignore
- [x] `.env.example` documenta todas as vars necessarias
- [x] Validacao em runtime: faltar var crash imediato
- [ ] Vault/Key Management Service em producao (TODO)
- [x] Rotacao de chave: documentada (mas implica re-encrypt)

### Logs

- [x] Audit log com IP, UA, user, timestamp
- [x] Redacao de campos sensiveis (password, token, cpf) em metadata
- [x] Sem dados sensiveis em stdout em producao

### Monitoring (recomendado em producao)

- [ ] Sentry ou Honeybadger para errors
- [ ] Uptime check (UptimeRobot, BetterStack)
- [ ] Alerta de tentativas de login falhas em massa

### Web

- [x] HTTPS obrigatorio (configurar no provedor)
- [x] HSTS preload list
- [x] Service Worker com cache controlado
- [x] Headers de seguranca via helmet

### Frontend

- [x] sessionStorage para tokens (volatil ao fechar aba)
- [x] Refresh automatico em 401
- [x] Evento `auth:expired` para redirecionar
- [x] RouteGuard em rotas sensiveis
- [x] Role-based UI (esconder admin features se nao admin)

## Threat model resumido

| Ameaca | Mitigacao |
|--------|-----------|
| Credential stuffing | Lockout + rate limit + bcrypt cost 12 |
| Brute force JWT | HS256 com secret 32+ chars + rotacao |
| Token theft (XSS) | sessionStorage volatil; CSP restritiva |
| CSRF | SameSite + verificacao Origin |
| SQL injection | ORM Drizzle (parametrized) |
| Data tampering | AES-GCM auth tag + HMAC integrity |
| Insider threat | Audit log imutavel + role separation |
| Replay attack | Refresh token rotation + JTI em access |
| Denial of service | Rate limit + Cloudflare em front |
| Data leak | Field-level encryption + redacao de logs |

## Lista de portas/servicos

- 5000 (HTTP local) â€” proxy reverso (nginx/caddy) deve servir 443 em producao
- 587/465 (SMTP outbound) â€” para envio de email
- 5432 (Postgres) â€” apenas se usar Postgres direto em producao (preferir socket interno)

Bloquear todas as outras portas no firewall.

---

Documento atualizado em 2026-05-07. Revisar a cada release significativa.
