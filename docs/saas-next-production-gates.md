# Próxima fase — gates de produção NeuroPed OS

## Objetivo

Esta fase transforma os bloqueadores finais do PR #724 em uma sequência verificável. Cada ponto possui pré-condição, automação, evidência e ação de rollback. Nenhum gate libera tráfego clínico sozinho.

| Ponto | Bloqueador atual | Automação prevista | Evidência | Rollback/falha |
| --- | --- | --- | --- | --- |
| 1. Base D1 | Migrations 0016–0021 ainda dependem de execução no ambiente alvo. | Workflow manual com ambiente `staging` ou `production`, execução em ordem e consulta metadata-only. | Lista de tabelas/triggers, versão do commit e log sem PHI. | Parar antes do LIVE; migrations são aditivas e não sofrem `DROP` automático. |
| 2. Segredos | KMS/secret manager e chaves reais não são configurados pelo repositório. | Gate de presença por nomes de secrets, validação de comprimento/separação no runtime e endpoint de postura. | Readiness, keyring posture e confirmação de secret references sem valores. | Falhar fechado e manter `CLINICAL_LIVE_ENABLED=false`. |
| 3. Staging | Ainda falta smoke tenant-aware no D1 real. | Workflow de smoke com tenant sintético, memberships/entitlement explícitos e consultas sem PHI. | Resultado de isolamento, membership, entitlement, módulos e auditoria. | Desabilitar LIVE; preservar linhas e logs para investigação. |
| 4. Continuidade | Ainda não há execução real de backup/restore no sandbox. | Operador registra evidência com digest, RPO/RTO e timestamp; workflow verifica consistência. | Linha `saas_backup_evidence` e readiness recalculado. | Não declarar restore; bloquear readiness. |
| 5. Integrações | Provedores externos e webhooks não têm credenciais/sandbox configurados. | Contrato sandbox, idempotência, assinatura, replay window e redaction; conexão manual por ambiente. | Status e versão da conexão, nunca payload/segredo. | Revogar/pausar conexão e preservar auditoria. |
| 6. Convites | Envio real depende de provedor de e-mail. | Reenvio seguro já implementado; próximo gate verifica provider reference e expiração. | Prefixo de hash, estado e audit log; token somente na emissão. | Revogar convite e emitir novo token. |
| 7. LGPD | Resolução final depende de controlador/encarregado e procedimento aprovado. | Fila, verificação, retenção e legal hold; sem purge automático. | Pedido, resolução, política versionada e auditoria. | Rejeitar/cancelar transição; nunca apagar PHI por fallback. |
| 8. Observabilidade | Falta operação externa de alertas e correlação. | Eventos redigidos, request id, status e alerta de cross-tenant sem payload clínico. | Logs/metrics metadata-only e runbook de incidente. | Suspender integração ou tenant afetado. |

## Ordem de execução

A ordem obrigatória é: validar código e migrations localmente; executar migrations 0016–0021 e smoke em staging; configurar secret manager no ambiente de staging; registrar backup/restore real; verificar readiness; conectar somente integrações sandbox; executar teste de convite e LGPD com dados sintéticos; revisar observabilidade; e somente depois preparar o checklist de produção. A flag Clinical LIVE permanece desligada até a aprovação formal dos gates.

## Limites de segurança

> A Central orienta, registra e evidencia workflows; não concede autorização, não substitui membership/entitlement/keyring, não recebe segredos, não executa purge automático de prontuário e não transforma um backup simulado em prova de restore.

A classificação como pronto para produção exige ainda a confirmação do controlador/encarregado, configuração real do secret manager, execução real do D1 e do backup/restore, credenciais de sandbox fornecidas pelo operador e revisão da política institucional de retenção.
