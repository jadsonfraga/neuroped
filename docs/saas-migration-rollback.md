# Plano de rollback das migrations SaaS

## Princípio

As migrations 0016–0023 são **forward-only**. Não existe down migration automática para tabelas de tenant, auditoria, evidências de continuidade, idempotência, webhooks ou incidentes. A remoção destrutiva poderia quebrar a trilha de auditoria, apagar evidência de continuidade ou aumentar o risco de exposição entre clínicas.

## Antes de aplicar

O operador deve criar uma evidência de backup/restore verificável para o D1 alvo e informar no workflow um `rollback_reference` que identifique essa prova ou o ticket operacional aprovado. O workflow não aceita `DEMO`, vazio ou valor ausente quando `apply_migrations=true`. O manifesto `docs/saas-migration-manifest.json` deve estar íntegro e ser validado antes do primeiro comando remoto.

| Situação | Ação segura | Proibido |
| --- | --- | --- |
| Manifesto divergente | Abortar antes de tocar no D1 e revisar o commit | Aplicar arquivos fora do manifesto |
| Falha em uma migration | Parar imediatamente, preservar logs redigidos e abrir incidente correlacionado | Tentar uma down migration destrutiva |
| Schema parcialmente aplicado | Reexecutar apenas após comprovar idempotência, snapshot e causa | Alternar flags clínicas para esconder o problema |
| Regressão depois do apply | Desabilitar o módulo/entitlement afetado, manter Clinical LIVE protegido e restaurar a partir da evidência aprovada | Purge pelo navegador ou apagar auditoria |
| Restore aprovado | Executar restauração no provedor/D1 por operador autorizado, validar tabelas/triggers e rodar smoke tenant-aware | Declarar restore concluído sem digest e timestamp |

## Sequência de incidente

Ao detectar falha, o workflow deve falhar fechado e o operador deve registrar um incidente sem PHI, usando código, severidade, correlation ID e metadata limitada. O serviço deve permanecer em modo degradado ou com a integração/módulo afetado desabilitado até o diagnóstico. A resolução deve ser um novo evento append-only com código allowlist e evidência anexada fora do payload clínico.

## Evidência pós-rollback

A reentrada exige manifesto sem drift, schema e triggers comprovados, keyring clínico e operacional separados, entitlement válido, teste cross-tenant com dados sintéticos, smoke de convites/LGPD/idempotência/webhooks e readiness aprovado. A decisão de habilitar `CLINICAL_LIVE_ENABLED` continua fora do workflow automático e exige revisão operacional e de privacidade.
