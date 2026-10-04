# GTM — entrevistas e piloto pago (Fase 4)

Artefato de preparação da prova de demanda. Objetivo: sair deste documento com
**10 entrevistas feitas** e **3+ pilotos pagos** (pago ≠ beta — R$ 1/mês conta,
grátis não).

## Proposta de valor (hipótese a validar, não verdade)

> "O acompanhamento do neurodesenvolvimento do seu paciente — da escolha da
> escala ao laudo assinado — em um fluxo só, cifrado e auditável, em vez de
> papel, planilhas e WhatsApp."

## Segmentos em disputa (o copy atual fala com clínicas; o caso de uso
validado é individual)

| Segmento | Hipótese de dor | Canal de acesso | Risco |
|---|---|---|---|
| A — Neuropediatra individual | Tempo perdido montando laudo; escalas soltas | indicação direta, grupos médicos | ticket baixo, churn alto |
| B — Clínica multidisciplinar infantil | Padronização entre profissionais; auditoria LGPD | sociedades, congressos | ciclo de venda consultivo |

Regra de desempate: 10 entrevistas (5A + 5B). O segmento com mais dor
espontânea (mencionada antes de você perguntar) vence o posicionamento.

## Roteiro de entrevista (30 min, Mom Test — fale pouco, escute muito)

1. "Me conte da última semana: como você registrou a avaliação de um paciente
   com suspeita de TEA?" (comportamento passado, não opinião)
2. "O que você fez com o resultado? Para quem enviou? Como?"
3. "Quanto tempo levou do fim da consulta até o documento entregue?"
4. "Já tentou algum software para isso? O que fez você desistir?"
5. "O que acontece hoje se um pai pede o histórico completo do filho?"
6. **Sinal de dor:** o entrevistado descreve o problema antes de você
   mencionar o produto? (Se não, a dor não é forte o bastante.)
7. Só agora mencione o NeuroPed — em uma frase. "Isso resolveria o caso que
   você me contou?"
8. **Teste de preço:** "Custaria R$ 99/mês por profissional. Você pagaria
   hoje, se estivesse pronto?" (resposta não-comprometida não conta;
   registrou só se aceitou o piloto pago)
9. **Pedido de piloto:** "Posso te colocar como piloto pagante na próxima
   semana? R$ 99 pelo primeiro mês, cartão ou Pix." Silêncio. Anote a reação.

### Anti-padrões proibidos na entrevista
- Não demonstrar o produto antes da pergunta 6 (contamina o sinal de dor).
- Não perguntar "você usaria?" (todos dizem sim; só comportamento passado conta).
- Não perguntar "quanto você pagaria?" (o número declarado não vale nada).

## Oferta de piloto pago (pronta para uso)

- **Preço:** R$ 99/mês por profissional (preço canônico `shared/billing.ts`).
  Sem desconto de fundador — desconto na primeira entrevista define âncora
  errada para sempre.
- **Trial:** 14 dias sem cartão (já implementado: `CANONICAL_TRIAL_DAYS`).
- **Compromisso do piloto:** 3 pacientes reais no primeiro mês, 1 reunião de
  20 min no dia 15 para feedback, cancelamento a qualquer momento (webhook
  Asaas já trata).
- **Critério de sucesso do piloto:** ≥2 laudos emitidos pelo próprio médico
  sem ajuda do criador + pagamento da 2ª fatura.
- **LGPD:** termo de tratamento de dados assinado antes do primeiro paciente
  real; zero dado de paciente em logs/demos (fixtures sintéticas).

## Métricas do processo (alimenta METRICS.md)

| Etapa | Alvo | Registro |
|---|---|---|
| Convites enviados | 25 | lista no seu CRM pessoal |
| Entrevistas feitas | 10 (5A+5B) | este doc, tabela abaixo |
| Sinal de dor espontâneo | ≥6/10 | coluna "dor" |
| Pilotos pagos aceitos | 3 | coluna "piloto" |
| 2ª fatura paga | 2 | `charge_paid` em produção |

| # | Nome | Segmento | Data | Dor espontânea (sim/não) | Aceitou piloto pago (sim/não) | Nota |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |

## Canais de recrutamento (ordem de custo/benefício)
1. Contatos pessoais do criador (colegas de residência/congresso).
2. Sociedades estaduais de neuropediatria / pediatria — pedir divulgação da
   pesquisa, não do produto (ética CFM).
3. Grupos fechados de médicos (WhatsApp/Telegram) — recrutamento de
   entrevista, nunca pitch.
4. LinkedIn: neuropediatras com consultório próprio.

## Regra de parada
Se após 10 entrevistas <4 tiverem dor espontânea e 0 aceitarem piloto pago,
o problema não é distribuição — é a dor. Revisar a proposta de valor antes de
investir em mais código de produto.
