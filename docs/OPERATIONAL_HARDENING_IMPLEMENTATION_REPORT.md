# Relatório de implementação — hardening operacional do NeuroPed

## Resultado

A implementação foi realizada na branch `feat/operational-hardening-20260827`, sem merge das PRs abertas `#708`, `#713` e `#716` e sem deploy. A base canônica foi preservada; os pontos de integração foram escolhidos em módulos LIVE, health, qualidade, middleware e migration nova.

| Domínio | Entrega |
| --- | --- |
| PDF clínico | `live_pdf_archives`, R2 privado, criptografia clínica, SHA-256, versionamento, download autenticado, triggers de imutabilidade e purge controlado |
| LGPD | Worker interno com claim/lease, exportação estruturada cifrada, retenção, legal hold, solicitação tenant-scoped e contagens de exclusão |
| Audit trail | `live_audit_chain` append-only com `previous_hash`/`event_hash`, filtros administrativos e CSV controlado |
| PHI | Redaction de logger, request ID, gate `audit:phi-leak` e ausência de fallback LIVE para storage clínico local |
| Drafts | `live_clinical_drafts`, autosave cifrado, estados draft/completed/signed/archived, optimistic version e idempotency key |
| Portal/pré-consulta | Tokens de 256 bits derivados de `crypto.getRandomValues`, somente hash em D1, expiração, revogação, uso limitado e origem familiar explícita |
| Medicamentos | Motor determinístico com fórmula, unidades, limites, duplicidade, alergia, fonte e dados ausentes |
| Epilepsia/timeline | Plano versionado com resgate explícito e timeline tenant-aware com proveniência |
| Billing | Reconciliação somente leitura com Asaas; divergência bloqueia concessão e exige revisão |
| DR/performance | Ensaio de restore sintético, hash de integridade, budgets objetivos e relatório pós-build |
| Estado do NeuroPed | Health público sem secrets e diagnóstico protegido por tenant com billing, migrations, storage, falhas e SHA |

## Validações executadas

Os seguintes comandos passaram no ambiente local:

```bash
npm run check
npm run lint
npm run test:operational-hardening
npm run test:resilience
npm run test:medication-safety
npm run audit:phi-leak
npm run audit:migrations
npm run test:dr
npm run build:client
npm run audit:performance
npx --yes wrangler@4 pages functions build functions --outdir=/tmp/neuroped-pages-functions-final
```

O ensaio DR reconstruiu um tenant, paciente e documento sintéticos em banco isolado. O gate de performance mediu a baseline abaixo e passou sem violação:

| Métrica | Medido | Budget |
| --- | ---: | ---: |
| JS inicial NeuroPed | 308.185 bytes | 450.000 bytes |
| Maior chunk JS | 1.232.076 bytes | 1.350.000 bytes |
| Fontes | 0 bytes | 1.200.000 bytes |
| Imagens | 12.262.045 bytes | 13.500.000 bytes |
| Total estático | 31.743.876 bytes | 34.000.000 bytes |

## Aplicação de migration e configuração operacional

Antes de habilitar as rotas de produção, o operador deve aplicar `db/migrations/0016_clinical_operational_hardening.sql` no D1 conforme o procedimento idempotente descrito em `docs/R2_CLINICAL_STORAGE_SETUP.md`. O ambiente precisa configurar `CLINICAL_DATA_KEY`, `CLINICAL_INDEX_KEY`, `WORKER_INTERNAL_SECRET`, `WORKER_ACTOR_USER_ID`, `CLINICAL_PDF_BUCKET` ou `CLINICAL_ARTIFACT_BUCKET`, além do segredo e ambiente Asaas quando a reconciliação billing for habilitada.

O bucket deve permanecer privado. A ausência de keyring, binding, schema ou identidade de worker faz as rotas falharem fechado. Nenhuma alteração destrutiva, purge global, merge de PR ou deploy foi executado por este trabalho.

## Limitações explícitas

A migration 0016 é aditiva, mas a plataforma D1 não oferece `ADD COLUMN IF NOT EXISTS`; por isso, o workflow de aplicação deve consultar `pragma_table_info` e aplicar apenas colunas ausentes em instalações parcialmente atualizadas. A reconciliação billing não altera entitlement automaticamente e exige revisão quando o provedor está indisponível ou diverge. O ensaio de DR é sintético e não substitui o exercício operacional autorizado com snapshots reais.

## Arquivos de referência

A execução detalhada de LGPD está em `docs/LGPD_DATA_LIFECYCLE.md`; o runbook de DR está em `docs/DISASTER_RECOVERY_EXECUTABLE.md`; a configuração R2 está em `docs/R2_CLINICAL_STORAGE_SETUP.md`. O painel acessível está em `/qualidade`, com a superfície de auditoria disponível apenas para usuário administrativo autenticado.
