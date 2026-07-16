# PLANO DE BACKEND GRATUITO — NeuroPed EDJ
> Estratégia de deploy 100% gratuito com Cloudflare  
> Atualizado: 2026-05-08

---

## Visão Geral

O NeuroPed EDJ usa atualmente um backend Express.js local. Para deploy gratuito em nuvem, a estratégia é migrar para o ecossistema Cloudflare, que oferece:

| Serviço | Limite Gratuito | Uso no NeuroPed |
|---------|----------------|-----------------|
| Cloudflare Pages | Ilimitado | Frontend React (dist/public) |
| Pages Functions | 100k req/dia | API backend (endpoints) |
| D1 Database | 5GB, 5M reads/dia | Banco de dados SQLite na borda |
| Workers KV | 100k reads/dia | Cache de dados não sensíveis |
| Workers AI | 10k neurônios/dia | Embeddings de memória (futuro) |
| Vectorize | $0.01/1k vetores | Busca semântica (futuro, pago) |

---

## Arquitetura Alvo

```
Browser/App
    │
    ▼
Cloudflare Pages (dist/public)
    │
    ├── /api/* ──► Pages Functions (functions/)
    │                   │
    │                   ├── D1 Database (neuroped.db na borda)
    │                   ├── KV Cache (dados não sensíveis)
    │                   └── Workers AI (embeddings — futuro)
    │
    └── /* ──► React SPA (index.html)
```

---

## Endpoints Mínimos a Implementar

### Saúde e Versão
- `GET /api/health` — Status do sistema
- `GET /api/version` — Versão do app e schema

### Pacientes
- `GET /api/patients` — Listar pacientes do usuário autenticado
- `POST /api/patients` — Criar paciente
- `GET /api/patients/:id` — Detalhe do paciente
- `PATCH /api/patients/:id` — Atualizar paciente
- `DELETE /api/patients/:id` — Excluir paciente (soft delete)

### Consultas
- `GET /api/consultations` — Listar consultas
- `POST /api/consultations` — Registrar consulta
- `GET /api/consultations/:id` — Detalhe da consulta

### Documentos
- `GET /api/documents` — Listar documentos do paciente
- `POST /api/documents` — Criar documento (laudo, relatório)

### Escalas
- `GET /api/scales` — Listar escalas disponíveis
- `POST /api/scales/results` — Salvar resultado de escala
- `GET /api/scales/results/:patientId` — Histórico de resultados

### Logs de Auditoria
- `GET /api/audit-log` — Log de ações (apenas admin)

---

## Status de Implementação

| Endpoint | No Express | Em Functions | Testado |
|----------|-----------|-------------|---------|
| GET /api/health | ⬜ verificar | ⬜ | ⬜ |
| GET /api/version | ⬜ verificar | ⬜ | ⬜ |
| GET /api/patients | ✅ (provável) | ⬜ | ⬜ |
| POST /api/patients | ✅ (provável) | ⬜ | ⬜ |
| GET /api/patients/:id | ✅ (provável) | ⬜ | ⬜ |
| PATCH /api/patients/:id | ✅ (provável) | ⬜ | ⬜ |
| GET /api/consultations | ⬜ | ⬜ | ⬜ |
| POST /api/consultations | ⬜ | ⬜ | ⬜ |
| GET /api/scales/results | ⬜ | ⬜ | ⬜ |
| POST /api/scales/results | ⬜ | ⬜ | ⬜ |
| GET /api/audit-log | ⬜ | ⬜ | ⬜ |

---

## Schema D1 (SQLite)

```sql
-- Usuários
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Pacientes (demo — campos criptografados)
CREATE TABLE patients_demo (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  name_enc TEXT NOT NULL,          -- AES-GCM cifrado
  birth_date TEXT,
  notes_enc TEXT,                  -- AES-GCM cifrado
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Resultados de escalas
CREATE TABLE scale_results_demo (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  patient_id TEXT REFERENCES patients_demo(id) ON DELETE CASCADE,
  scale_name TEXT NOT NULL,
  score REAL,
  interpretation TEXT,
  data_json TEXT,                  -- JSON com respostas
  applied_at TEXT DEFAULT (datetime('now'))
);

-- Logs de auditoria
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT,
  action TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  ip TEXT,
  user_agent TEXT,
  metadata TEXT,                   -- JSON
  created_at TEXT DEFAULT (datetime('now'))
);

-- Configurações do app
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Notas de memória clínica
CREATE TABLE memory_notes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  tags TEXT,                        -- JSON array
  embedding_status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);
```

---

## Passos para Deploy no Cloudflare

```bash
# 1. Instalar Wrangler CLI
npm install -g wrangler

# 2. Login no Cloudflare
wrangler login

# 3. Criar banco D1
wrangler d1 create neuroped-prod

# 4. Aplicar schema
wrangler d1 execute neuroped-prod --file=db/schema.d1.sql
# Depois use o workflow oficial "Provision D1 backend", que verifica ownership
# e aplica as migrações idempotentes de sessões e consentimentos.

# 5. Criar namespace KV
wrangler kv:namespace create CACHE

# 6. Configurar secrets
wrangler secret put NEUROPED_MASTER_KEY
wrangler secret put NEUROPED_JWT_SECRET

# 7. Copiar e configurar wrangler.toml
cp wrangler.toml.example wrangler.toml
# Editar wrangler.toml com os IDs gerados

# 8. Build e deploy
npm run build
wrangler pages deploy dist/public
```
