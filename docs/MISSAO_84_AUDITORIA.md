# MISSÃO 8.4 REAL — Auditoria objetiva

Data: 2026-06-07.

## Escopo auditado

Fluxo prioritário: **Paciente → Queixa → Escala adequada → Aplicação → Interpretação → Documento → Acompanhamento**.

Arquivos auditados com maior impacto clínico:

- `client/src/pages/home.tsx`
- `client/src/pages/filtro.tsx`
- `client/src/components/GenericScale.tsx`
- `client/src/components/ClinicalReport.tsx`
- `client/src/components/SaveToPatient.tsx`
- `client/src/pages/paciente-detalhe.tsx`
- `server/routes.ts`
- `scripts/guards/scorecard.mjs`

## Principais gargalos encontrados

| Gargalo | Impacto direto | Arquivos prováveis | Prioridade |
|---|---|---|---:|
| Aplicação de escala sem persistência local de progresso | Risco de perda de respostas em refresh/navegação e baixa confiança em consulta real | `GenericScale.tsx` | 1 |
| Submissão incompleta apenas bloqueada por botão desabilitado | Usuário não entende o que falta; cansaço clínico aumenta erro operacional | `GenericScale.tsx` | 1 |
| Documento/relatório com envio automático ao montar componente | Atraso, comportamento inesperado e sensação de software improvisado | `ClinicalReport.tsx` | 2 |
| Impressão/HTML do relatório sem proteção contra conteúdo incompleto e interpolação insegura | Risco de documento pobre/vazio e conteúdo não sanitizado | `ClinicalReport.tsx`, `paciente-detalhe.tsx` | 2 |
| Salvamento em paciente sem feedback claro de erro | Erro silencioso no vínculo paciente-resultado | `SaveToPatient.tsx` | 2 |
| Filtro guiado apresentando ferramentas antes das escalas | Desvia do coração do produto e atrasa o fluxo Queixa → Escala | `filtro.tsx` | 3 |
| Confetti no filtro ao encontrar resultado | Script visual não essencial no fluxo clínico e custo desnecessário | `filtro.tsx` | 3 |
| Home com excesso de estímulos e ações concorrentes | Não responde em até 5 segundos “o que é / para quem / o que fazer agora” | `home.tsx` | 4 |
| Script `scorecard.mjs` truncado | `npm run lint` falhava com erro de parser antes de chegar aos avisos existentes | `scripts/guards/scorecard.mjs` | 5 |

## Ordem de execução definida

1. Robustecer aplicação de escalas: progresso, aviso de incompletude, próximo item pendente e reset seguro.
2. Robustecer interpretação/documento/salvamento: sem envio automático, sem PDF vazio, erro explícito ao salvar.
3. Repriorizar filtro para escalas e recomendação clínica.
4. Simplificar home para quatro ações primárias.
5. Corrigir guardrail quebrado e registrar evidências reais.

## Critérios de aceite

- Nenhuma escala genérica submete sem todas as respostas e sem aviso claro.
- Progresso de escala genérica é preservado localmente durante a aplicação.
- Resultado pode ser salvo no paciente com erro visível quando API/cadastro falha.
- Relatório/PDF não é gerado sem conteúdo clínico mínimo.
- Histórico do paciente não exporta documento vazio.
- Filtro mantém escalas como recomendação principal; ferramentas e medicações ficam secundárias.
- Home prioriza apenas: Aplicar Escala, Pacientes, Evolução, Documentos.
- Build e validações são executados e documentados sem maquiar falhas.

## Nota de validação

Não foi declarada nota 8.4 atingida. Onde não houve teste manual em navegador, o item permanece **não validado visualmente**.
