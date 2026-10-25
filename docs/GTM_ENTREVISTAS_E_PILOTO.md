# GTM — entrevistas e piloto pago (Fase 4)

Artefato de preparação da prova de demanda. Objetivo: sair deste documento com
**10 entrevistas Solo feitas** e **3+ pilotos pagos** a R$ 99/mês; gratuito
não conta como prova de pagamento.

## Proposta de valor (hipótese a validar, não verdade)

> "Para o neuropediatra que conduz o próprio consultório, o NeuroPed organiza
> agenda, escalas com a família e documentação clínica em um fluxo único, sem
> concluir diagnóstico pelo profissional."

## ICP decidido

**NeuroPed Solo:** neuropediatra que opera o próprio consultório, com uma
assinatura para um profissional. A hipótese de dor é o tempo perdido entre
agenda, escalas, registro e documentação. Os canais iniciais são indicação
direta, sociedades médicas e grupos profissionais.

As 10 entrevistas são com neuropediatras de atuação independente. **Clínicas
de 2+ profissionais ficam para Later**; a capacidade técnica existente não é
evidência de que esse seja o primeiro mercado.

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
8. **Teste de preço:** "Custaria R$ 99/mês para um profissional. Você pagaria
   hoje, se estivesse pronto?" (resposta não-comprometida não conta;
   registrou só se aceitou o piloto pago)
9. **Pedido de piloto:** "Posso te colocar como piloto pagante na próxima
   semana? R$ 99 pelo primeiro mês, cartão ou Pix." Silêncio. Anote a reação.

### Anti-padrões proibidos na entrevista
- Não demonstrar o produto antes da pergunta 6 (contamina o sinal de dor).
- Não perguntar "você usaria?" (todos dizem sim; só comportamento passado conta).
- Não perguntar "quanto você pagaria?" (o número declarado não vale nada).

## Oferta de piloto pago (pronta para uso)

- **Preço:** R$ 99/mês para um profissional (preço canônico `shared/billing.ts`).
  Sem desconto de fundador — desconto na primeira entrevista define âncora
  errada para sempre.
- **Trial:** 14 dias sem cartão (já implementado: `CANONICAL_TRIAL_DAYS`).
- **Compromisso do piloto:** 3 pacientes reais no primeiro mês, 1 reunião de
  20 min no dia 15 para feedback, cancelamento a qualquer momento (o contrato
  do webhook Asaas contempla cancelamento, mas o ambiente ainda exige validação).
- **Critério de sucesso do piloto:** ≥2 laudos emitidos pelo próprio médico
  sem ajuda do criador + pagamento da 2ª fatura.
- **LGPD:** termo de tratamento de dados assinado antes do primeiro paciente
  real; zero dado de paciente em logs/demos (fixtures sintéticas).

### Hard gates antes de paciente real ou cobrança real

Piloto aceito pode ser registrado como intenção comercial, mas só começa com
Asaas e Resend validados, exportação R2/LGPD operacional, revisão jurídica
formal concluída, legado associado de forma autorizada e smoke publicado
aprovado. Enquanto qualquer item estiver `BLOCKED_EXTERNAL`, entrevistas e
demonstrações usam apenas dados sintéticos e nenhuma receita é presumida.

## Métricas do processo (alimenta METRICS.md)

| Etapa | Alvo | Registro |
|---|---|---|
| Convites enviados | 25 | lista no seu CRM pessoal |
| Entrevistas Solo feitas | 10 neuropediatras independentes | este doc, tabela abaixo |
| Sinal de dor espontâneo | ≥6/10 | coluna "dor" |
| Pilotos pagos aceitos | 3 | coluna "piloto" |
| 2ª fatura paga | 2 | `charge_paid` em produção |

| # | Nome | Consultório próprio (sim/não) | Data | Dor espontânea (sim/não) | Aceitou piloto pago (sim/não) | Nota |
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
