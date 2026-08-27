## Objetivo

Fechar inconsistências e falhas ponta a ponta na operação segura do NeuroPed OS, transformando os controles do PR #723 em workflows verificáveis sem permitir que a Central substitua membership, entitlement, keyring, auditoria ou a fonte clínica canônica.

## Entregas

- Readiness expandido para exigir migrations 0016–0020, keyring clínico, chave operacional separada, entitlement, auditoria e restore verificado.
- `eligibleForClinicalEnablement` separado de `readyForProduction`, evitando circularidade com `CLINICAL_LIVE_ENABLED`.
- Ações corretivas retornadas por gate, com recálculo acionável na Central.
- Postura de keyring sem segredos, incluindo validação de separação entre chaves clínicas, índice cego e `OPERATIONAL_DATA_KEY`.
- Reenvio de convite tenant-aware com revogação atômica do anterior, novo token de uso único, URL exibida uma única vez e auditoria.
- Editor versionado de retenção, `purgeMode`, `enabled` e `legalHold`, com rollback visual em erro/conflito.
- Estados `loading`, `success`, conflito e rollback para mutações da Central; duplo clique bloqueado.
- Idempotência de integrações com `X-Idempotency-Key`, replay seguro, conflito em reuso divergente e gravação atômica com mutação/auditoria.
- Redaction de credenciais, endpoints e PHI nas respostas de integração; catálogo com regras de tenant scope, assinatura, replay e ausência de payload clínico.
- Migrations 0016–0020, contratos compartilhados, smoke SQLite/D1 mock e documentação de gap/runbook/validação.

## Validações locais

- `npm run check`
- `npm run lint`
- `npm run test:saas-operational`
- `npm run test:saas-migrations`
- `npm run test:saas-hardening`
- `npm run build`
- bundle Pages Functions via Wrangler
- `npm run audit:security`
- `npm run validate:public`
- `npm run audit:access`
- `npm run audit:inventory`
- `npm run audit:navigation`
- `npm run test:e2e:saas`
- `npm run audit:a11y:full` — 55 rotas, zero violações serious/critical
- guards de zero PHI browser-side, diário, previsit e segurança de pacientes

## Critério de segurança

Qualquer operação sem contexto de clínica, membership, entitlement, segredo operacional ou auditoria falha fechado. A Central não fabrica restore, não executa purge de prontuário, não envia e-mail sem provedor, não aceita convite com sessão incompatível e não devolve credenciais, endpoints ou PHI.

## Limites

Esta rodada não configura KMS/secret manager, não executa backup/restore real, não conecta provedor externo, não envia e-mail e não aprova go-live automaticamente. O merge deve ocorrer após os checks remotos e revisão. A validação jurídica do controlador e encarregado permanece necessária.
