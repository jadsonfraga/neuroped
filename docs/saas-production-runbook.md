# Runbook de produção — NeuroPed OS multi-tenant

Este runbook descreve como liberar as 20 abas em ambiente real sem tratar a tela administrativa como autorização. A execução deve ser feita por uma pessoa autorizada, com revisão operacional e jurídica apropriada. **Não é certificação LGPD, ISO ou regulatória.**

## Ordem de aplicação

1. Aplicar as migrations D1 em ordem, incluindo `0016_saas_control_plane_hardening.sql`, `0017_saas_membership_invites.sql`, `0018_saas_privacy_governance.sql` e `0019_saas_integrations_control.sql`.
2. Confirmar que `saas_module_settings`, `saas_backup_evidence`, `saas_membership_invites`, `saas_privacy_requests`, `saas_retention_policies`, `saas_integration_connections` e `live_patient_search_tokens` existem no banco de produção.
3. Configurar os segredos no secret manager, nunca no frontend: `CLINICAL_DATA_KEY`, `CLINICAL_DATA_KEY_ID`, `CLINICAL_INDEX_KEY`, `OPERATIONAL_DATA_KEY`, `APP_BASE_URL` HTTPS e `ENVIRONMENT=production`. Durante rotação, `CLINICAL_DATA_KEY_PREVIOUS` e seu identificador devem apontar somente para a chave anterior.
4. Manter `CLINICAL_LIVE_ENABLED=false` até o keyring, backup/restore e smoke tenant-aware passarem. O sistema deve falhar fechado se o keyring faltar ou se houver colisão/separação inválida de chaves.
5. Criar ou validar uma clínica de staging com memberships explícitas, entitlement válido e dados sintéticos. Nunca usar PHI real em staging.
6. Executar `GET /api/saas/readiness?clinicId=...`; a liberação só pode prosseguir quando todos os checks estiverem verdes. Registrar uma evidência de restore real com digest SHA-256, RPO e RTO, sem declarar sucesso com um teste meramente simulado.
7. Habilitar módulos individualmente por tenant. O toggle da central usa controle de versão otimista e auditoria; ele não bypassa billing, membership, escopo clínico ou consentimento.
8. Criar convites com URL HTTPS. O token é exibido uma única vez, armazenado apenas como hash e aceito somente quando o e-mail da sessão coincide com o hash do convite.
9. Habilitar cada integração em sandbox antes de produção. API keys devem ter scopes, quota, expiração/rotação e tenant explícito. Webhooks precisam de assinatura, idempotência e proteção contra replay.

## Variáveis e postura esperada

| Controle | Pronto quando | Falha deve resultar em |
|---|---|---|
| Keyring clínico | AES-GCM derivado por `clinic_id`, índice cego separado e versão identificável | 503/deny-by-default; nunca plaintext |
| Membership | Usuário possui membership ativa no tenant solicitado | 403 sem revelar existência de dados |
| Billing | Entitlement válido para o escopo da operação | 402/403 conforme o contrato |
| Control plane | `clinic_id` + versão otimista + auditoria no mesmo batch | 409 em conflito ou 500 sem liberar alteração |
| LGPD | Pedido com hash de referência, estado controlado, verificação e resolução auditada | sem eliminação/exportação implícita |
| Retenção | Política por classe, legal hold e versão | nenhum purge automático não aprovado |
| Arquivos | Rota legada Express bloqueada em LIVE; serviço tenant-aware validado | 503 até existir storage com isolamento real |
| Continuidade | Evidência de snapshot/restore com digest e RPO/RTO | readiness bloqueado |
| Observabilidade | métricas sem PHI, logs com correlação e alerta de cross-tenant | incidente e bloqueio de rollout |

## Rollback

A desativação de uma aba deve ser feita pelo control plane da clínica, preservando a configuração anterior na auditoria. Não se deve apagar tabelas, pedidos de titulares, convites, evidências de backup ou logs. Em rotação de chave, manter a chave anterior somente pelo período operacional aprovado para leitura/reprocessamento e remover seu segredo após a re-encriptação verificada. Em caso de suspeita de vazamento, revogar tokens/API keys, suspender integrações e preservar a trilha de incidente.

## Retenção e direitos

As políticas da aba LGPD são configuração operacional, não uma decisão jurídica automática. O controlador deve definir classe de dado, finalidade, base legal, prazo e legal hold. O workflow impede transições inválidas e não executa exclusão física de PHI por conta própria. Pedidos de acesso, correção, portabilidade, eliminação, restrição ou oposição exigem verificação de identidade, revisão do escopo, análise de documentos imutáveis e registro de resolução.

## Evidências mínimas por clínica

O pacote de go-live deve conter: versão das migrations, resultado do TypeScript/lint/testes, resultado do `readiness`, evidência de restore com digest, matriz RBAC, teste cross-tenant, teste de expiração/rotação de convite, evidência de keyring sem segredos, revisão do registro de tratamento e aprovação do controlador/encarregado. Os artefatos não devem conter nomes de pacientes, prontuários, tokens ou segredos.

## Operação de integrações tenant-aware

As conexões são configuradas pela aba Developer API e persistem apenas postura operacional: integração, ambiente, status, escopos, hash do endpoint, timestamp de verificação e referência no secret manager. Tokens, chaves privadas e payloads clínicos não são aceitos pela API nem pela Central.

Cada integração deve começar em `sandbox`. Uma conexão de produção exige sandbox conectado, módulo correspondente habilitado, escopo mínimo compatível, referência de segredo e verificação recente. FHIR, object storage e qualquer transporte que lide com dados de saúde exigem escopo clínico explícito, consentimento, provenance e contrato de operador.

A atualização utiliza versão otimista e falha com conflito quando outra operação alterou a conexão. Revogação, pausa e reconexão devem ser auditadas por clínica. O endpoint externo, quando necessário, é armazenado somente como HMAC tenant-aware; a URL original deve permanecer no provedor de segredos ou configuração protegida.

A lista de convites retorna somente prefixo de hash e estado operacional. O token completo aparece uma vez na criação e não pode ser recuperado, listado ou reenviado automaticamente sem uma nova emissão auditada.
