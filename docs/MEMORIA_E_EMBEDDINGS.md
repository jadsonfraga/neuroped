# MEMÓRIA E EMBEDDINGS — NeuroPed EDJ
> Arquitetura de memória clínica estruturada e busca semântica  
> Atualizado: 2026-05-08

---

## Status Atual

```
semanticSearchStatus: "not_configured"
embeddingStatus: "not_configured"
memoryLayer: "text_only"
```

O sistema ainda não tem busca semântica real configurada. Toda busca é textual (substring/LIKE).

---

## Arquitetura Alvo

### Camada A — Memória Relacional (D1/SQLite/PostgreSQL)

Dados estruturados, relacionais, com criptografia de campos sensíveis:

| Tabela | Conteúdo | Criptografia |
|--------|----------|-------------|
| `users` | Usuários do sistema | bcrypt (senha) |
| `patients_demo` | Cadastro de pacientes | AES-GCM (nome, notas) |
| `consultations_demo` | Registros de consulta | AES-GCM (texto clínico) |
| `scale_results_demo` | Resultados de escalas | Plaintext (scores numéricos) |
| `documents_demo` | Laudos e relatórios | AES-GCM (conteúdo) |
| `memory_notes` | Notas de memória clínica | AES-GCM |
| `clinical_templates` | Templates de documentos | Plaintext |
| `app_settings` | Configurações | Plaintext |
| `audit_logs` | Log de auditoria | Plaintext (sem dados sensíveis) |

### Camada B — Memória Semântica (Vetores)

Busca por similaridade semântica em conteúdo clínico:

**Opção 1 — Cloudflare (Gratuito até limite)**
- Embeddings: `Cloudflare Workers AI` (modelo `@cf/baai/bge-base-en-v1.5` ou `@cf/baai/bge-small-en-v1.5`)
- Armazenamento: `Cloudflare Vectorize` ($0.01/1k vetores — plano pago necessário)
- Busca: `cosine similarity` via Vectorize

**Opção 2 — Supabase (Gratuito até 500MB)**
- Embeddings: via API externa (OpenAI, Cohere) ou Workers AI
- Armazenamento: `pgvector` extension no PostgreSQL
- Busca: `<=>` operador de similaridade coseno
- Requer: `CREATE EXTENSION vector` no Supabase SQL Editor
- **RLS OBRIGATÓRIA**: `ALTER TABLE memory_embeddings ENABLE ROW LEVEL SECURITY`

---

## Endpoints de Memória Semântica

```
POST /api/memory                    — Salvar nota de memória
GET  /api/memory/search?q=termo     — Busca textual (implementado)
POST /api/memory/embed              — Gerar embedding de uma nota
POST /api/memory/semantic-search    — Busca semântica (quando configurado)
```

---

## Implementação do Fallback Honesto

Quando o embedding não estiver configurado, o sistema usa busca textual e indica claramente:

```json
{
  "results": [...],
  "searchType": "text",
  "semanticSearchStatus": "not_configured",
  "note": "Busca semântica não configurada. Usando busca textual."
}
```

---

## Schema de Memória Semântica (para quando implementar)

```sql
-- Embeddings de notas clínicas
CREATE TABLE memory_embeddings (
  id TEXT PRIMARY KEY,
  note_id TEXT REFERENCES memory_notes(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  embedding_model TEXT NOT NULL,     -- ex: "bge-base-en-v1.5"
  vector_id TEXT,                     -- ID no Vectorize ou pgvector index
  content_hash TEXT,                  -- Hash do conteúdo (para evitar re-embedding)
  created_at TEXT DEFAULT (datetime('now'))
);

-- Para pgvector (PostgreSQL/Supabase):
-- CREATE EXTENSION IF NOT EXISTS vector;
-- ALTER TABLE memory_embeddings ADD COLUMN embedding vector(768);
-- CREATE INDEX ON memory_embeddings USING ivfflat (embedding vector_cosine_ops);
```

---

## Diretrizes de Privacidade para Embeddings

**NUNCA enviar para modelo externo:**
- Nomes de pacientes
- Datas de nascimento
- CPF ou documentos
- Qualquer dado identificável

**Processo de anonimização antes do embedding:**
1. Substituir nomes por `[PACIENTE]`
2. Substituir datas por faixa etária genérica (`[CRIANÇA 6-10 ANOS]`)
3. Remover identificadores numéricos
4. Apenas conteúdo clínico genérico (sintomas, diagnósticos, escalas) vai para o modelo

---

## Próximos Passos

1. Implementar endpoint `POST /api/memory` com busca textual
2. Criar schema `memory_notes` no D1
3. Adicionar indicador `semanticSearchStatus` nas respostas de busca
4. Quando budget disponível: configurar Vectorize + Workers AI
5. Implementar anonimizador antes de enviar para embeddings
