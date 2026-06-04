# Memória e Embeddings — NeuroPed SDG

## Estado atual

A busca semântica real ainda não está configurada. O status oficial nesta fase é:

```json
{
  "semanticSearchStatus": "not_configured"
}
```

## Regra clínica

Não enviar dados reais de pacientes para embeddings, LLMs ou serviços externos sem:

- consentimento;
- base legal;
- anonimização quando possível;
- política de privacidade;
- controle de acesso;
- registro de auditoria;
- aprovação explícita do responsável técnico.

## Camada A — Memória estruturada

Tabelas futuras sugeridas:

- `users`
- `patients_demo`
- `consultations_demo`
- `documents_demo`
- `scale_results_demo`
- `app_settings`
- `audit_logs`
- `memory_notes`
- `clinical_templates`
- `ui_audit_items`

## Camada B — Memória semântica

Opções futuras:

### Cloudflare

- Workers AI para embedding, se disponível.
- Vectorize para índice vetorial.
- D1 para metadados.

### Supabase

- Postgres.
- pgvector.
- RLS obrigatória antes de uso real.

## Fallback atual

Até que uma camada real exista, usar:

- busca textual;
- filtros por tags;
- metadados por categoria;
- status honesto de busca semântica não configurada.

## Endpoints futuros

```text
POST /api/memory
GET /api/memory/search?q=
POST /api/memory/embed
POST /api/memory/semantic-search
```

## Critério de pronto

- Nenhum dado real enviado a serviço externo.
- `semanticSearchStatus` explícito.
- Fallback textual funcional.
- Logs de auditoria.
- RLS/criptografia antes de produção.
