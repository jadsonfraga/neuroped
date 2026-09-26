# Professional SaaS — análise inicial

Data de referência: 26/09/2026. Issue: #1001, relacionada a #594 e #685.
Baseline: `0b4f74fb49214d00944fc2a366d3b4454363601a`; árvore `93b98bdaf64406bea0d5bf91d36c7e8c291536de`.
Este documento antecede alterações funcionais nesta rodada. Não é uma auditoria integral das 30 camadas nem certificado de prontidão comercial.

## A. Estado comprovado

- Branch `main` e regras gerais de proteção consultadas pela API GitHub. A coleção de PRs abertas retornou vazia nesta consulta.
- Lidos `AGENTS.md`, README, backlog SaaS e os executores de exportação/eliminação relevantes. Autoridade: Cloudflare Pages Functions + D1; Express é adaptador e Vercel é espelho.
- O coletor de exportação já utiliza batch para snapshot, verifica cardinalidade e mantém uma lista explícita de categorias ainda não exportadas. Preservar esses controles.
- O executor de eliminação já protege tenant, retenção e dados não alcançáveis, executa mutações num batch e preserva registros de governança. Esses controles não serão removidos.
- O workflow OBS-10 `36277331338` consta como concluído com sucesso no SHA-base. Isso não é prova da jornada comercial nem confirma, sozinho, o SHA servido em produção.
- A leitura HTTP direta de `deploy-check.json` não produziu evidência utilizável nesta sessão. Nenhum novo deploy foi executado.
- Clone local tentado e falhou por resolução de rede; não foi possível executar `git fetch`, instalar dependências ou atestar worktree local. Desktop Commander informou franquia esgotada. A branch de trabalho foi criada no GitHub a partir do SHA exato acima.

## B. P0 existentes

- S9: o registro histórico de censo aponta associação legítima pendente do legado. Não inferir titularidade nem atribuir registros ao administrador. A migração real depende de destinação autorizada e restauração provada; não será executada nesta rodada.
- P0 candidato identificado na leitura de `functions/api/live/governance/_purge.ts`: autorização e contagens são verificadas antes do batch, enquanto as mutações finais repetem apenas o alvo. Falta reproduzir dinamicamente alterações entre a pré-checagem e a transação. Não classificar como corrigido ou reproduzido ainda.

## C. P1 existentes

- S12B permanece parcial por código: documentos, avaliações, intake e escalas constam em `EXPORT_UNCOVERED_CLINIC_TABLES`, sem inclusão integral no payload. A trava que impede exclusão nessas condições deve permanecer.
- S13 consta pendente no backlog: agendamento público por clínica. Não foi revalidada nesta rodada toda a superfície de frontend e banco.
- S10 exige revisão residual por domínio; não tratar o texto antigo do backlog como prova de ausência das correções recentes de gestão/permissões.
- S4/S5: integração externa de cobrança e recuperação operacional precisam de evidências próprias. Não confundir teste com provedor interceptado e restauração sintética com operação real.

## D. Evidências que faltam

- Reprodução RED e validação GREEN do candidato de atomicidade, com schema/handlers reais e dados sintéticos.
- Gates do HEAD candidato, bundle Functions e testes existentes de eliminação/exportação/Cliente Zero.
- Prova de produção vinculada ao eventual merge; ainda não há merge desta rodada.
- Jornada comercial externa, recuperação operacional e auditoria completa das demais camadas não foram concluídas aqui.

## E. Bloqueios externos

- `BLOCKED_EXTERNAL_LOCAL_RUNTIME`: ambiente local sem resolução de rede para clone; execução integral deverá ser comprovada no CI.
- `BLOCKED_EXTERNAL_REMOTE_TERMINAL`: franquia do terminal remoto esgotada; não reconectar/repetir.
- `BLOCKED_EXTERNAL_LEGACY_MAPPING`: associação autorizada dos registros legados não estabelecida por esta sessão.
- `BLOCKED_EXTERNAL_PROVIDER_EVIDENCE`: sem validação de credenciais/cobranças/e-mails externos nesta rodada; não criar pagamentos reais.

## F. Três maiores gaps até produto vendável

1. Integridade/isolamento e autorização de operações irreversíveis, incluindo legado e concorrência.
2. Portabilidade completa, encerramento seguro e recuperação demonstrada.
3. Jornada de clínica independente com cobrança e operação externas verificadas.

## G. Primeiro gap escolhido

Reproduzir e corrigir, em escopo único, a atomicidade das pré-condições da eliminação LGPD. Uma alteração de legal hold, retenção, estado da clínica ou cobertura não pode permitir exclusão baseada numa pré-checagem vencida. Usar somente fixtures sintéticas, preservar isolamento e idempotência e manter todos os bloqueios de exportação incompleta. A decisão segue o risco de irreversibilidade, não a facilidade de adicionar funcionalidades. Nenhum dado de produção será excluído ou migrado. Rollback por PR de revert, condicionado a revisão; sem migração de schema.