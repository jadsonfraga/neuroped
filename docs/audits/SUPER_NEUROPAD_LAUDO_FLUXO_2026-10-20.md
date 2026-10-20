# Auditoria: Super NeuroPad → prontuário → laudo neuropediátrico (20/10/2026)

Escopo: circuito clínico complementar do Super NeuroPad Game (PR jadsonfraga/neuroped#1191 e branch
`claude/superneupad-neuropsych-expansion-o4lens`, PR jadsonfraga/neuroped#1192), fluxo de laudo
(`client/src/pages/laudo-super.tsx`, `client/src/lib/laudo/*`) e vínculo com prontuário e portal da família.

## 1. Mapa do fluxo atual

| Etapa | Onde está | Situação |
|---|---|---|
| Aplicação da bateria principal (6 mundos) | `client/src/pages/super-neuropad-game.tsx` | Resultado só em memória; PDF e resumo para a família gerados localmente. |
| Circuito clínico complementar (estações, cobertura) | `client/src/features/super-neuropad/ClinicalCircuit.tsx`, `clinicalCircuit.ts` | Só em memória. Saída por cópia ou TXT. Sem chamada de API. |
| Prontuário | — | Nenhum código do jogo ou do circuito grava no prontuário. |
| Laudo | `client/src/pages/laudo-super.tsx` | Formulário próprio ou colagem em "integra". Nada vem do jogo automaticamente. |
| Portal da família | `shared/family-portal.ts` | Lista apenas os testes próprios do Super NeuroPad (jogo) e Dyslexia Risk. O circuito não está no portal. |

Vínculo manual atual: copiar ou baixar o TXT do circuito e colar no campo "integra" do laudo. Não existe
campo de laudo ligado às seções do circuito.

## 2. Achados

1. **Impressão habilitada por qualquer texto colado.** `laudo-super.tsx`: `integraAtiva = integra.trim().length > 0`
   e `podeImprimir = integraAtiva || !!texto`. Não há checagem de seções, identificação, CID-10/CID-11 nem de
   placeholders antes de imprimir. Confirmado no E2E (`tests/e2e/super-neuropad-circuit-sufficiency.mjs`):
   `laudoImprimirHabilitadoAposColar: true`.
2. **QA de doutrina não bloqueia emissão.** `validarDoutrina` (`client/src/lib/laudo/doutrina.ts`) só é usado em
   `tests/laudo/test-doutrina.mjs`. `qaSuper` (`modeloSuper.ts`) é exibido, mas não condiciona a impressão.
3. **Placeholders não bloqueiam.** O prompt de laudo instrui "[completar]" em pontos faltantes
   (`client/src/lib/laudo/laudoPrompt.ts`, linha 159). Nenhum gate verifica se esses marcadores permanecem no
   texto antes da impressão ou da assinatura.
4. **Nada do jogo alimenta o laudo.** Antes desta entrega, o circuito não tinha vínculo com as seções obrigatórias
   do laudo (identificação, história do neurodesenvolvimento, exame, escalas, impressão, conduta, fechamento).
5. **Bateria principal fora da leitura de prontidão.** Cognição e linguagem da bateria não apareciam no circuito.
   Esta entrega passa a usar apenas a contagem de mundos aplicados (`resumoDaBateria`), sem pontuação.
6. **Vínculo com a #1191.** A expressão proibida pelo guarda `sem-classificacao` ("sinais de alerta") foi
   corrigida no head `34d05fb` da branch da #1191. A API do GitHub não retornou check runs para esse head no
   momento da consulta; a CI não foi confirmada.

## 3. O que esta entrega faz (e o que não faz)

- Matriz de suficiência por faixa etária (2 a 17 anos), em `client/src/features/super-neuropad/sufficiencia.ts`.
  Cada item do laudo recebe um de oito estados: examinado, a esclarecer, falta exame direto, pendente de execução,
  não realizado, fora do jogo nesta faixa, depende de fonte externa ou depende de decisão médica.
- Itens de fonte externa (identificação, anamnese, exames, documentos, escalas) e de decisão médica (impressão,
  fundamentação, conduta, liberação) nunca viram "examinado" pelo jogo.
- Exportação TXT com a matriz e a declaração "Emissão automática: não".
- Não altera a impressão, a assinatura nem o gate do laudo. Não preenche achado ausente.

## 4. Recomendações (decisão do médico e do produto; não implementadas aqui)

1. Ligar a impressão do laudo à ausência de bloqueios: seções obrigatórias presentes, CID-10 e CID-11 em
   paralelo, zero marcadores "[completar]" e QA de doutrina aprovado.
2. Mostrar a matriz de suficiência dentro de `laudo-super.tsx` como checklist de revisão, com a mesma
   terminologia.
3. Manter a liberação sempre manual, com assinatura do médico. Não criar liberação automática a partir do jogo.
4. Decidir se o circuito deve entrar como texto-fonte da seção "Exame clínico" e "Escalas" do laudo, com
   proveniência e data preservadas.

## 5. Evidências

- Testes unitários: `tests/unit/super-neuropad-sufficiencia.test.ts` e os dois arquivos do circuito
  (`npm run test:super-neuropad`, 97 de 97).
- E2E novo: `npm run test:e2e:super-neuropad-circuit` (faixas 2, 7 e 17; registros; exportação; colagem no laudo
  sem download automático; axe sem violações no circuito; celular de 390 px sem rolagem horizontal).
- E2E de regressão do jogo: `npm run test:e2e:super-neuropad`.
- Verificação estática: `npm run check`, `npm run lint`, `npm run build:client`.

## 6. Limitações

- Nenhum item foi validado por médico nem calibrado em amostra. Não há norma nem ponto de corte.
- Stanford Medicine 25 (videoteca) não respondeu no ambiente de desenvolvimento.
- Este registro não substitui revisão médica do conteúdo clínico nem da liberação de documentos.
