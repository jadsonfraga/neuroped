# NeuroPed SaaS — Threat model e matriz LGPD

## Escopo

Este documento define os controles técnicos necessários para operar as 20 abas do NeuroPed em múltiplas clínicas. Ele não é certificação jurídica nem substitui revisão do controlador, do encarregado de dados ou de assessoria especializada. A regra de implementação é **deny-by-default**: nenhuma aba pode inferir tenant, gravar PHI no navegador ou liberar uma integração sem contexto, finalidade, autorização e trilha.

## Classes de dados

| Classe | Exemplos | Tratamento obrigatório |
|---|---|---|
| Identidade de tenant | `clinic_id`, slug, plano, status | Identificador não é segredo; sempre escopado e validado contra membership ativa. |
| Dados cadastrais | nome, e-mail, telefone, unidade | Minimização, acesso por papel, criptografia quando persistido e retenção definida. |
| Dados de saúde | prontuário, avaliações, documentos, respostas, diagnósticos | AES-GCM tenant-aware, chave dedicada, blind index separado, sem logs/analytics brutos e acesso por finalidade. |
| Metadados operacionais | latência, status de job, quotas, IDs de correlação | Pode alimentar observabilidade somente sem conteúdo clínico ou identificadores diretos. |
| Credenciais | tokens, chaves de API, segredos de webhook | Somente servidor/KMS ou secret store; nunca frontend, log, exportação ou localStorage. |
| Conteúdo editorial | instrumentos, licenças, templates, playbooks | Versionamento, origem, licença e revisão; não misturar com registros clínicos. |

## Ameaças e controles

| Ameaça | Controle obrigatório | Evidência |
|---|---|---|
| IDOR/cross-tenant | Contexto de clínica explícito, membership consultada no servidor, filtros `clinic_id`, FKs e triggers de mismatch | Teste que tenta ler/escrever dados de duas clínicas. |
| Escalada de privilégio | Papéis por clínica separados do papel global; escopos `clinical`, `admin`, `export` e `finance` | Matriz RBAC e testes de cada transição. |
| Vazamento no cliente | Nenhuma PHI em localStorage/sessionStorage, analytics, logs ou payload agregado | Gate estático + inspeção de rede + teste de export. |
| Reidentificação por analytics | Limiar mínimo de coorte, agregação e revisão humana | Teste com coorte menor que o limiar. |
| Corrida/conflito | `WHERE` com versão/status, append-only e auditoria na mesma transação/batch | Testes de optimistic concurrency e triggers. |
| Chaves ausentes/incorretas | Fail-closed para keyring, IDs distintos e rotação com chave anterior apenas para leitura | Smoke de configuração inválida e validação de ambiente. |
| Exportação abusiva | Scope e papel de exportação, limite síncrono, manifesto/digest, auditoria e fila para volumes maiores | Contrato de exportação e reconciliação do digest. |
| Eliminação indevida | Solicitação → aprovação → processamento → conclusão, legal hold e sem purge automático implícito | Máquina de estados + teste de último owner/lifecycle. |
| Integração comprometida | API key por tenant, scopes, quotas, rotação, idempotency key, assinatura de webhook e replay window | Contrato da API e tabela de deliveries. |
| Indisponibilidade/restore | Backup versionado, RPO/RTO declarados, restore em ambiente isolado e evidência assinada | Job/relatório de restore e health check. |

## Fronteira entre as 20 abas

As abas são uma camada de **control plane e operação**, não um segundo prontuário. Workspace, Planos, Onboarding, Acessos, Marca branca, SLA, Continuidade e Developer API operam configuração; LGPD, Documentos, Mensageria, Lembretes, Intake, Rede e Escola-família operam workflows e consentimentos; Tarefas, Analytics, Catálogo e Playbooks operam coordenação, agregação ou conteúdo editorial; FHIR/CSV transporta dados sob finalidade e consentimento. Pacientes, avaliações, respostas, Clinical Core, agenda e documentos canônicos permanecem nas fontes existentes.

## Gates de produção

Uma clínica só pode ser habilitada quando a migration correspondente foi aplicada no banco alvo, as chaves estão no secret manager, o backup/restore foi testado, o tenant possui membership explícita, billing/entitlement foi recalculado no servidor, o smoke E2E passou, o monitoramento está ativo e o registro de tratamento/retensão foi aprovado pelo controlador. O frontend pode exibir o status, mas nunca transformar um toggle local em autorização real.
