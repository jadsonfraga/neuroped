# NeuroPed — desenho executável do worker LGPD operacional

**Data:** 23 de agosto de 2026  
**Status:** `P1 — AINDA REAL`  
**Runtime canônico:** Cloudflare Pages Functions + D1

## 1. Lacuna comprovada

O Clinical LIVE já possui:

- `live_retention_policies` por `clinic_id`;
- `live_export_requests` e `live_deletion_requests` tenant-scoped;
- workflow `requested → approved → processing → completed|rejected`;
- motivo de eliminação cifrado;
- `tenant_lifecycle.legal_hold`;
- auditoria de criação e mudança de status;
- triggers D1 contra referência de paciente de outro tenant.

Porém o endpoint `functions/api/live/governance/index.ts` hoje altera o status por PATCH. Ele não produz artefato de exportação, não executa eliminação física, não aplica retenção/legal hold durante a execução e não prova idempotência operacional. Logo `completed` ainda representa uma decisão administrativa, não a prova de que o trabalho foi materializado.

## 2. Regra de segurança

O worker deve ser a única autoridade capaz de concluir uma solicitação `processing → completed`.

A API humana pode:

- criar a solicitação;
- aprovar/rejeitar;
- colocar em `processing` por claim atômico.

A API humana **não** deve conseguir marcar `completed` diretamente após a implantação do worker.

## 3. Trigger e autenticação

Implementação preferida:

1. Cloudflare Cron Trigger ou Workflow dedicado, no mesmo account do backend canônico;
2. service identity separada, sem conta clínica humana;
3. acesso mínimo a D1 e ao storage de artefatos;
4. sem segredo em URL/query string;
5. execução serializada por `request_id`.

Fallback aceitável: endpoint interno autenticado por secret exclusivo de worker, invocado por GitHub Actions/Cron. Não reutilizar `NEUROPED_JWT_SECRET`, credencial admin ou token de usuário.

## 4. Persistência adicional mínima

Adicionar migration aditiva com:

- `live_export_requests.worker_attempts INTEGER NOT NULL DEFAULT 0`;
- `live_export_requests.worker_claimed_at DATETIME`;
- `live_export_requests.worker_lease_until DATETIME`;
- `live_export_requests.artifact_digest_sha256 TEXT`;
- `live_export_requests.artifact_byte_length INTEGER`;
- `live_export_requests.failure_code TEXT`;
- equivalentes de claim/attempt/failure em `live_deletion_requests`;
- `live_deletion_requests.deleted_counts_json TEXT` contendo somente contagens por classe, sem PHI;
- índice `(status, worker_lease_until, requested_at)`.

Não armazenar conteúdo exportado em D1 em claro.

## 5. Claim idempotente

Para cada fila:

```sql
UPDATE live_export_requests
   SET status = 'processing',
       worker_attempts = worker_attempts + 1,
       worker_claimed_at = CURRENT_TIMESTAMP,
       worker_lease_until = datetime('now', '+10 minutes'),
       updated_at = CURRENT_TIMESTAMP
 WHERE id = ?
   AND status IN ('approved','processing')
   AND (worker_lease_until IS NULL OR worker_lease_until < CURRENT_TIMESTAMP);
```

Processar somente se `changes = 1`. Retry após lease expirado deve produzir o mesmo resultado lógico.

## 6. Exportação

### 6.1 Escopo patient

Antes de ler qualquer linha:

- confirmar `clinic_id` da request;
- confirmar `patient_id` pertence ao mesmo tenant;
- confirmar membership/request original apenas para auditoria, não para autorização do worker;
- carregar somente tabelas LIVE e recursos operacionais explicitamente incluídos no contrato de portabilidade.

### 6.2 Escopo clinic

Todas as queries devem conter `WHERE clinic_id = ?` ou derivação comprovadamente tenant-scoped. É proibido export global seguido de filtro em memória.

### 6.3 Formato

Artefato versionado, por exemplo:

```json
{
  "schemaVersion": "neuroped-lgpd-export-v1",
  "clinicId": "<opaque>",
  "scope": "patient|clinic",
  "generatedAt": "<iso>",
  "data": {}
}
```

O artefato pode conter dados clínicos necessários à portabilidade e, portanto, deve ser cifrado em repouso no storage e nunca ir para logs/artifacts de CI.

### 6.4 Storage

Adicionar binding dedicado de objeto (preferencialmente R2) com bucket privado e lifecycle curto. `artifact_key` deve ser opaco. Acesso ao download deve usar URL assinada/endpoint autenticado e tenant-scoped, com expiração curta.

Ao concluir:

1. calcular SHA-256 e byte length;
2. persistir somente `artifact_key`, digest, byte length e timestamp;
3. gravar auditoria metadata-only;
4. mudar para `completed` no mesmo fluxo lógico.

Se upload ou persistência falhar, não marcar completed.

## 7. Eliminação

### 7.1 Barreiras antes de apagar

O worker deve falhar fechado se:

- `tenant_lifecycle.legal_hold = 1`;
- request não estiver `approved|processing`;
- `clinic_id` não coincidir;
- request patient tiver `patient_id` inválido/outro tenant;
- retenção aplicável ainda não tiver expirado quando a política exigir espera;
- houver dependência externa não reconciliada que torne a eliminação parcial sem registro.

### 7.2 Patient purge

Deletar em ordem explícita e tenant-scoped, respeitando FKs e tabelas imutáveis. Antes da implementação, manter uma matriz única de tabelas contendo:

- patient row;
- eventos;
- assessments/responses;
- documents/versions;
- clinical memory;
- Conecta;
- diários LIVE se materializados no backend;
- dados operacionais diretamente vinculados ao paciente quando o contrato exigir.

Cada DELETE deve conter `clinic_id = ? AND patient_id = ?` quando o schema fornecer ambos.

### 7.3 Clinic purge

Somente para tenant já em lifecycle compatível com encerramento, retenção vencida e `legal_hold = 0`. Não permitir purge de clínica `active` por simples request de governança.

### 7.4 Prova

Persistir apenas contagens por classe e IDs opacos de request/audit. Nunca registrar nome, diagnóstico, medicação, documento, escala ou payload de prontuário.

## 8. Auditoria obrigatória

Eventos mínimos:

- `live_export_worker_claim`;
- `live_export_worker_complete`;
- `live_export_worker_fail`;
- `live_deletion_worker_claim`;
- `live_deletion_worker_blocked_legal_hold`;
- `live_deletion_worker_complete`;
- `live_deletion_worker_fail`.

Metadata permitida: request ID, clinic ID opaco, scope, attempt, contagens, digest/bytes e failure code não clínico.

## 9. Testes bloqueantes

Criar gate `test:lgpd-worker` com D1/SQLite sintético cobrindo:

1. replay da mesma export request não duplica artefato lógico;
2. dois workers concorrentes: somente um claim;
3. request BLUE nunca lê/deleta RED;
4. `legal_hold=1` bloqueia eliminação;
5. retenção não vencida bloqueia eliminação quando aplicável;
6. falha de upload não marca export completed;
7. falha no meio do purge não marca deletion completed;
8. retry após lease expirado é seguro;
9. clinic purge de tenant ativo é bloqueado;
10. logs capturados não contêm sentinela PHI sintética.

## 10. Critério de conclusão da issue

Só fechar quando houver prova de:

- worker executando no runtime canônico;
- storage privado configurado;
- completed exclusivo do worker;
- legal hold + retenção aplicados na execução;
- idempotência/concurrency testadas;
- tenant isolation testada;
- artefato de export produzido e baixado com sentinela sintética;
- eliminação sintética efetivamente verificada;
- auditoria metadata-only;
- nenhum PHI em logs.

Até lá:

```text
LGPD_EXPORT_WORKER = NOT_OPERATIONAL
LGPD_DELETE_WORKER = NOT_OPERATIONAL
P1 = OPEN
```
