# Super NeuroPad — bateria 18+ Adultos: bloqueios externos em 23/10/2026

Relacionado à PR #1221 (`feat/super-neuropad-adultos-18plus-20261023`, draft, empilhada sobre a #1220). Sem merge, sem deploy. Não contém dados de pacientes.

| Identificador | Sistema / acesso necessário | Ação que falta | Risco / verificação de conclusão |
|---|---|---|---|
| BLOCKED_EXTERNAL_ADULTOS_REVISAO_CLINICA | Revisão pelo responsável clínico do Super NeuroPad | Revisar os 6 mundos e as 24 tarefas de `client/src/features/super-neuropad/bateriaAdulta.ts` (falas, materiais, passos, observações, minutos) e decidir a modalidade de aplicação (tela, voz ou papel) | O conteúdo é rascunho autoral, sem validação clínica. Conclusão: registro datado de aprovação pelo responsável e, só então, PR própria que altera `BATERIA_ADULTA_HOMOLOGADA` para `true` |
| BLOCKED_EXTERNAL_ADULTOS_REFERENCIA | Fonte de referência adulta validada; licença, se for instrumento | Decidir se haverá alguma comparação com referência. Não há norma, ponto de corte, escore nem percentil adulto no repositório, e nenhum foi incluído | Enquanto não houver fonte aprovada, a bateria é apenas descritiva. Conclusão: fonte e autorização de uso anexadas à PR de homologação |
| BLOCKED_EXTERNAL_ADULTOS_PILOTO | Piloto com adultos voluntários em ambiente autorizado, com consentimento e de acordo com a LGPD | Aplicar a bateria em amostra controlada e registrar tempo, compreensão das falas e acessibilidade | Sem piloto, duração, compreensão e acessibilidade não estão validadas. Conclusão: relatório de piloto aprovado pelo responsável |

## Estado entregue

- `bateriaAdulta.ts`: seis mundos com as mesmas chaves do jogo (`vila`, `olhos`, `palavras`, `numeros`, `memoria`, `corpo`), quatro tarefas cada, linguagem adulta. Não importa banco, missões, perfis anuais nem critérios pediátricos. `BATERIA_ADULTA_HOMOLOGADA = false`.
- Botão 18+ na página: agora `disabled`, com `aria-describedby` apontando para o aviso. A versão anterior chamava `setAgeYears(null)` sem a confirmação de `chooseAge`. Como `ClinicalCircuit` é remontado por `key={ageYears ?? "sem-idade"}`, a troca podia descartar rascunhos do circuito clínico de outra idade sem aviso.
- Bateria pediátrica de 2 a 17 anos: sem alteração de código.

## Verificação

| Comando | Resultado |
|---|---|
| `node --import tsx --test tests/unit/super-neuropad-adultos-18plus.test.ts` | 7/7 |
| `npm run check` | exit 0 |
| `npx eslint` nos três arquivos alterados | exit 0 |
| `npm run test:super-neuropad` | exit 0, 190/190 |
| `npm run build:client` | exit 0 |
| `node tests/e2e/super-neuropad-game.mjs` | exit 0 (jornada completa, 30 desafios, PDF) |
| Verificação no navegador do botão 18+ (script fora do repositório) | desabilitado; não altera a idade escolhida; sem diálogo; sem erro de página |

## Rollback

Reverter o commit desta entrega. O código anterior do botão 18+ não ativa nenhuma partida, mas tem o problema de confirmação descrito acima.
