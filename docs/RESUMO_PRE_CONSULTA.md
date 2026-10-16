# Resumo pré-consulta (roadmap item 3)

Rota: `/resumo-pre-consulta?patientId=…` (botão "Resumo pré-consulta" na ficha do paciente).

## Princípio
Só organiza o que já está salvo (prontuário + aplicações de escalas). **Sem IA, sem chamada externa, sem inferência clínica.** Campo vazio vira pendência, nunca texto.

## Seções
1. **Histórico**: queixa e anamnese registradas, alertas de crises/regressão marcados no prontuário, medicações, terapias e exames.
2. **O que mudou desde a última visita**: (a) diferenças entre as duas últimas versões salvas de cada medicação, terapia, exame e anamnese; (b) escalas aplicadas depois da última consulta e alertas de faixa; (c) medicação/exame com data posterior à última consulta.
3. **Pendências**: exame pendente ou sem resultado, medicação sem dose/resposta, terapia sem evolução, queixa sem registro, sem CID/hipótese, sem consulta, escalas sem regra validada ou com escore fora do intervalo.
4. **Evolução das escalas**: reutiliza `lib/evolucaoEscalas` e `EvolucaoEscalasPanel` (item 2), com as mesmas regras e avisos.
5. **Perguntas sugeridas**: modelos fixos acionados por regras sobre os dados (ex.: medicação registrada → pergunta de adesão e resposta). Sempre rotuladas como sugestão.
6. Botão **Copiar resumo** (texto puro).

## Arquivos
`client/src/lib/resumoPreConsulta/` (prontuario.ts decodifica os eventos no mesmo formato de `pages/prontuario.tsx`, local e LIVE; resumo.ts monta e serializa), `pages/resumo-pre-consulta.tsx`. Testes: `tests/unit/resumo-pre-consulta.test.ts` (14 casos, em `test:clinical`) e `tests/e2e/resumo-pre-consulta.mjs`.

## Limitações
- **LIVE não grava escore** hoje (`SaveToPatient` salva só título e respostas): nesse modo as escalas aparecem como pendentes e não há gráfico. A tela já lê `totalScore` do payload se o salvamento passar a gravá-lo. Isso também afeta a evolução do item 2.
- "Última consulta" = último evento de consulta ativo do prontuário; não consulta a agenda (próximos agendamentos e faltas ficam fora).
- Comparação por versões depende de os eventos substituídos serem devolvidos pela API (`days=3650`).
- Não resume texto livre longo nem interpreta conteúdo; mostra o que foi digitado.
- Perguntas são genéricas por desenho; não substituem a anamnese dirigida.
