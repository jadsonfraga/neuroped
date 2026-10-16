# Escalas: evolução, gráficos e alertas (roadmap item 2)

Rota: `/evolucao-escalas?patientId=…` (botão "Evolução das escalas" na ficha do paciente).

## Princípio
Nada é recalculado. A "pontuação automática" é o escore total **já calculado e salvo** pelo app na aplicação. Faixas e pontos de corte vêm dos classificadores que o app já tem e testa (`client/src/data/`), sem tabela paralela que possa divergir.

## Instrumentos com regra validada (registro)
M-CHAT-R/F (0–20), CARS registro interno (15–60; CARS-2 excluído), CDI-2, PHQ-A (0–27), CSHQ (33–99), CRAFFT (0–6). Qualquer outro instrumento aparece em **"Pendentes de regra validada"**: escores listados, sem gráfico nem alerta (ex.: SNAP-IV, que depende de dois subescores). C-SSRS fica fora por ser instrumento de segurança sem escore total.

## Alertas (apoio, nunca decisão)
- Mudança de faixa entre aplicações consecutivas (piora = atenção; melhora = informativo).
- Variação expressiva ≥ limiar da amplitude (padrão 20%, ajustável na tela). **Limiar de triagem do app, não validado psicometricamente**; só onde a amplitude é documentada.
- Versões diferentes do instrumento: sem comparação.
- Escore fora do intervalo documentado: excluído do gráfico e sinalizado.
- Intervalo < 14 dias: nota de comparabilidade.
Não há índice de mudança confiável (RCI) porque não há dados psicométricos validados no app.

## Arquivos
`client/src/lib/evolucaoEscalas/` (registro, evolucao), `components/EvolucaoEscalasPanel.tsx` (recharts), `pages/evolucao-escalas.tsx`. Testes: `tests/unit/escalas-evolucao.test.ts` (14 casos, incluído em `test:clinical`) e `tests/e2e/escalas-evolucao.mjs`.

## Limitações
- Em modo clínica remota (LIVE) o escore pode não vir salvo; a aplicação é ignorada.
- Só escore total; subescalas/domínios não são plotados.
- Alertas não consideram idade, tratamento, informante ou intervalo ideal de reaplicação de cada instrumento.
