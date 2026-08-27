# Lifecycle técnico de dados pessoais e clínicos — NeuroPed

## Escopo e limite

Este documento descreve execução técnica do sistema. Ele **não determina base legal, prazo legal obrigatório, necessidade de consentimento ou obrigação de guarda**. Esses pontos devem ser configurados e aprovados pelo controlador, encarregado e assessoria jurídica da clínica. O software registra a decisão configurada e aplica o escopo de tenant sem transformar uma hipótese jurídica em regra fixa.

| Controle | Execução técnica | Decisão jurídica/configurável |
| --- | --- | --- |
| Retenção | `live_retention_policies` por clínica, com dias e flag de execução | Prazo aplicável e se uma classe pode ser eliminada |
| Exportação | Solicitação tenant-scoped, aprovação, claim de worker, artefato cifrado, SHA-256, tamanho e download autenticado | Escopo e conteúdo final de portabilidade |
| Exclusão | Solicitação explícita, autorização de gestor, confirmação, legal hold, retenção e worker | Se a eliminação física é compatível com obrigação documental |
| Anonimização | Fluxo de redaction para artefatos e registros quando purge físico não for permitido | Quais campos podem ser anonimizados sem destruir prova documental |
| Consentimento | Registro de consentimentos existente e auditado | Quando consentimento é a base adequada |
| Legal hold | `tenant_lifecycle.legal_hold` bloqueia o worker de exclusão | Origem, duração e revisão do hold |

## Fluxo destrutivo

Uma exclusão nunca é executada por uma chamada direta de frontend. O gestor cria uma solicitação com escopo `patient` ou `clinic`, confirma explicitamente o identificador da clínica, e o pedido fica em `requested`. Um gestor pode aprovar, rejeitar ou colocar em processamento; somente a identidade de worker com segredo separado pode concluir `processing → completed`.

O worker falha fechado se o tenant estiver em `legal_hold`, se a retenção configurada não tiver vencido, se a solicitação não estiver aprovada/processável, se o paciente não pertencer à clínica ou se o escopo for `clinic` sem o procedimento administrativo separado. O worker grava apenas contagens por classe, código de falha e IDs opacos no log.

## Exportação

O artefato segue `neuroped-lgpd-export-v1`, é filtrado por `clinic_id` em cada consulta e é cifrado antes de ser enviado ao bucket privado. O D1 guarda somente a chave opaca, digest SHA-256, tamanho, status e timestamps. O download exige membership e entitlement da mesma clínica; não aceita `patient_id` como mecanismo isolado de autorização.

## Origem de campos

Dados enviados pela família na pré-consulta ficam cifrados, com status próprio e rótulo obrigatório `informação fornecida pelo responsável`. O material exige revisão antes de incorporação e nunca sobrescreve silenciosamente um evento médico formal já existente.

## Auditoria

Operações novas registram ator, clínica, ação, recurso, resultado, timestamp, ID alvo e metadados mínimos. O `live_audit_chain` é append-only por triggers e encadeia `previous_hash → event_hash`. O export administrativo omite payload clínico, usa filtros controlados e exige perfil administrador.

## Verificações obrigatórias antes de produção

A migration 0016 deve estar aplicada, `CLINICAL_DATA_KEY`, `CLINICAL_INDEX_KEY`, `WORKER_INTERNAL_SECRET` e `WORKER_ACTOR_USER_ID` devem existir como secrets separados, o binding privado de storage deve responder ao health e os testes `test:lgpd-worker`, `test:tenant-isolation` e `audit:phi-leak` devem passar. Ausência de qualquer pré-requisito mantém a funcionalidade indisponível; não há fallback local com PHI.

## Rollback

Rollback de código não executa exclusão de dados nem remove objetos. O serviço volta à versão anterior, o bucket permanece privado e as migrations permanecem aplicadas. Para divergência de schema, use forward-fix compatível e interrompa release; nunca faça `DROP` automático.
