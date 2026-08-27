# Auditoria de gaps — operação segura NeuroPed OS

## Escopo

A revisão confronta o critério de aceite da fase operacional com o PR #723 e o código local. O objetivo é impedir que a Central declare uma operação pronta quando faltam dependências de tenant, segredo, entitlement, auditoria ou prova operacional.

## Gaps encontrados

| Área | Evidência | Risco | Correção planejada |
| --- | --- | --- | --- |
| Readiness | `REQUIRED_TABLES` cobre apenas parte do control plane e rotula a migration como 0016; não inclui convites, privacidade, retenção e integrações. | A clínica pode aparecer pronta com tabelas operacionais ausentes. | Expandir o conjunto de tabelas, corrigir a mensagem e retornar ações corretivas por gate. |
| Keyring | A API consulta `clinicalCryptoReady`, mas não expõe postura da chave operacional nem é consumida pela Central. | Convites e hashes operacionais podem falhar somente durante a mutação, sem diagnóstico prévio. | Criar postura operacional agregada, sem segredo, e integrá-la ao readiness/console. |
| Convites | A API cria, lista e revoga, mas não possui reenvio controlado; a UI não mantém estado de operação nem exibe resultado de reenvio. | Reenvio manual pode duplicar convites, gerar tokens órfãos ou induzir operador a copiar token errado. | Reenvio idempotente por convite ativo, revogação do anterior, novo token de uso único e audit log. |
| Mutations | Handlers de convites, LGPD, continuidade e integrações fazem `fetch`, mas não compartilham estado `loading`, desabilitação e mensagens de conflito. | Duplo clique, corrida e feedback falso em falha de rede. | Estado de ação por recurso, `finally`, rollback/refetch após conflito e mensagens de erro codificadas. |
| Retenção | A UI alterna legal hold, mas não oferece editor de dias, purge mode ou enabled, embora a API suporte esses campos. | A política versionada não é operável integralmente pela Central. | Editor controlado com versão otimista e revalidação após conflito. |
| Integrações | A API valida escopos e grava referências/hash, mas não exige idempotency key nem registra redaction/idempotência do contrato de webhook. | Repetição de request pode produzir efeitos divergentes e o operador não vê a postura do contrato. | Idempotência por tenant/recurso, metadados de redaction e contrato de webhook sem payload clínico. |
| Testes | Contratos cobrem migrations e presença estática, mas não cobrem os novos fluxos de reenvio, keyring operacional, ações corretivas e estados UI. | Regressões podem passar pelo CI. | Testes SQLite/D1 mock, E2E dos fluxos e asserts de PHI/segredo no browser. |

## Invariantes

Nenhuma mutação deve ser aplicada sem `clinicId` resolvido do path/body, membership ativa com papel suficiente, entitlement quando exigido, segredo operacional apenas no backend e auditoria no mesmo batch. Nenhum token, e-mail em claro, endpoint original ou PHI deve entrar em resposta de listagem, localStorage, DOM fora do fluxo explícito de uma criação única ou log.

A Central deve distinguir `loading`, `success`, `conflict`, `forbidden`, `not_configured` e `network_error`. Um conflito nunca pode ser apresentado como sucesso; após conflito, o estado local deve ser descartado ou revalidado pelo servidor.
