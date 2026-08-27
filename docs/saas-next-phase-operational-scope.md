# Próxima fase — operação segura do NeuroPed OS

## Objetivo

Transformar os controles implementados no PR #721 em fluxos operacionais dentro da Central NeuroPed OS, sem permitir que a interface administrativa substitua membership, entitlement, keyring, auditoria ou a fonte clínica canônica.

## Entregas desta fase

| Frente | Entrega operacional | Fora do escopo desta fase |
|---|---|---|
| Readiness | Detalhamento dos gates, atualização após cada evidência e indicação de ação corretiva | Aprovação automática de go-live |
| Acessos | Criação, listagem, revogação e reenvio controlado de convites tenant-aware | Envio real de e-mail sem provedor configurado |
| LGPD | Fila com transições, resolução e editor versionado de retenção/legal hold | Exclusão física automática de prontuário |
| Continuidade | Registro e consulta de evidências de backup/restore, digest e RPO/RTO | Execução de backup pelo navegador |
| Keyring | Exibição de postura criptográfica sem segredos | Rotação automática sem KMS/secret manager |
| 20 abas | Contrato único de habilitação, readiness e auditoria para cada módulo | Duplicar prontuário, agenda, Clinical Core ou documentos |
| Integrações | Contratos de webhook/API com tenant, idempotência, escopo e redaction | Conectar provedores externos sem credenciais e sandbox |

## Critério de segurança

Qualquer operação que não tenha contexto de clínica, membership válida, entitlement compatível, segredo operacional ou auditoria deve falhar fechado. A Central pode orientar e registrar o workflow; ela não pode fabricar evidência de restore, aceitar token de convite sem sessão compatível, exibir PHI, ou executar purge de dados de saúde sem procedimento aprovado.

## Critério de aceite

A fase será considerada pronta quando a Central utilizar as APIs tenant-aware para convites, LGPD, readiness, keyring e continuidade; quando cada mutação tiver estado de carregamento, rollback ou mensagem de falha; quando as migrations e contratos forem testados em SQLite/D1 mock; quando o lint estático e a acessibilidade passarem sem exceções; e quando o Pull Request remoto permanecer com todos os checks verdes.
