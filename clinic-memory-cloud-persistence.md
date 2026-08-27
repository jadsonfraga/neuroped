# Memória compartilhada em nuvem — NeuroPed

## Objetivo

A memória compartilhada permite que clínica, profissionais e secretaria registrem informações operacionais e clínicas em um espaço persistente da própria clínica. O dado não depende do `localStorage`, não desaparece ao recarregar o navegador e não é compartilhado entre tenants.

## O que foi criado

| Camada | Implementação |
|---|---|
| Contrato | `shared/live-clinic-memory.ts` define escopo (`clinic`, `patient`, `appointment`), tipo (`operational`, `clinical`), validação, tags, revisão e idempotência. |
| Banco | `db/migrations/0015_live_clinic_memory.sql` e snapshot `db/schema.d1.sql`. |
| API | `functions/api/live/memory/index.ts` para listar/criar e `functions/api/live/memory/[id].ts` para editar/arquivar. |
| Segurança | Membership da clínica, entitlement de billing, keyring clínico dedicado, AES-GCM por clínica, auditoria e controle de versão. |
| Busca | Tokens normalizados e indexados por HMAC cego; o texto nunca é indexado em claro. |
| Interface | `client/src/pages/memoria-clinica.tsx` mostra clínica ativa, tipo de memória, confirmação de nuvem, busca e arquivamento. |
| Secretaria | Perfil global `operator` pode abrir a rota; membership `assistant` pode ler/gravar apenas memória operacional. |
| Agenda | O aviso da Agenda aponta para a Memória da clínica para informação compartilhada; a grade de horários continua explicitamente local até uma migração própria de appointments. |
| Regressão | `npm run test:live-clinic-memory` verifica schema, API, criptografia, idempotência, papel de secretaria e UI. |

## Regras de acesso

A memória operacional de escopo clínico/administrativo pode ser lida e gravada por owner, admin da clínica, profissional e assistant/secretaria. A memória clínica exige perfil clínico no backend; assistant não consegue editar, arquivar ou consultar memória clínica. A rota visual permite `operator` para que a secretaria encontre o recurso, mas a autorização fina é decidida por membership e tipo de conteúdo no servidor.

## Persistência e confiabilidade

A criação utiliza `clientRequestId` com índice único por clínica e autor. Repetições da mesma requisição retornam o registro já criado sem duplicá-lo. Atualizações exigem `expectedRevision`; conflitos retornam HTTP 409, evitando que uma edição antiga sobrescreva a de outra pessoa. Arquivamento é reversível por contrato de status e fica registrado no log de auditoria.

O conteúdo é cifrado pelo keyring clínico existente, com derivação por clínica, propósito e versão de chave. A busca usa tokens HMAC cegos, permitindo localizar termos exatos sem armazenar título ou corpo em claro. O banco mantém índices por clínica, escopo, paciente, atendimento e data para limitar o custo das consultas.

## Limites importantes

A implementação exige `CLINICAL_LIVE_ENABLED=true`, `env.DB`, `CLINICAL_DATA_KEY`, `CLINICAL_DATA_KEY_ID` e `CLINICAL_INDEX_KEY`, além do entitlement clínico da clínica. Sem essa configuração, a API falha fechada com `503`; a UI não mostra confirmação de sincronização.

A tabela de memória aceita `appointmentId` como referência opaca e valida que o atendimento pertence a um profissional membro da clínica. A grade de Agenda existente ainda tem um workspace local próprio; a nova Memória da clínica é o caminho persistente para notas compartilhadas. Uma migração integral da Agenda exigiria migrar appointments, bloqueios, lista de espera, locks e disponibilidade para o mesmo tenant LIVE, trabalho separado para não misturar notas com disponibilidade.

## Validações executadas

`npm run test:live-clinic-memory` passou. `npm run lint` passou. `npm run build:client` passou. `npm run check` encontrou somente dois erros históricos em `client/src/components/GenericScale.tsx`, relacionados a `Suspense`, sem ocorrência nos arquivos desta implementação. Não foi executado teste contra D1 de produção nesta sessão; isso exige staging/produção com credenciais e dados anonimizados.
