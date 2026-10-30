# METRICS (funil mínimo)

Regra do repositório: contadores observados no SQL não são clientes, receita nem
atestado de produção (`shared/product-evidence.ts`). Aqui só se registra o que tem fonte.

| Etapa | Fonte hoje | Valor | Alvo Fase 4 |
|---|---|---|---|
| Visitante | não instrumentado | n/d | definir ferramenta sem PHI |
| Cadastro | `users` + `clinic_memberships` (tenant atual) | n/d (não medido em produção) | 10 |
| Ativação (1º laudo/documento em <30 min) | `saas_audit_log.live_document_create` | n/d | ≥50% dos cadastros |
| Assinatura | `billing_subscriptions` + provedor | 0 comprovado | 3 pilotos pagos |
| Retenção (30 dias) | n/d | n/d | ≥70% dos pilotos |

Prova de demanda decidida: 10 entrevistas Solo com neuropediatras independentes → 3 pilotos
pagos → 2 segundas faturas confirmadas por `charge_paid`. Valores atuais permanecem zero.

Não medidos por desenho (NOT_MEASURED em product-evidence): clínicas pagantes reais, MRR,
ARPA, churn, ativação comercial. Nenhum número acima é receita real.

## Painel de Prontidão SaaS, Ciclo 1 (notas 0–10; julgamento sobre leitura de código,
## produção não foi inspecionada)
| Dimensão | Nota | Evidência principal |
|---|---|---|
| Proposta de valor e posicionamento | 7 | oferta NeuroPed Solo alinhada; linguagem ainda sem validação por entrevistas |
| ICP e segmentação | 7 | Solo decidido; Clínica explicitamente movida para Later |
| Onboarding e time-to-first-value | 7 | marcos persistidos + verificação de e-mail; jornada de aceite testada |
| Núcleo do produto e retenção | 7 | laudos, escalas, agenda multiprofissional, intake; retenção não medida |
| Monetização | 6 | R$ 99/mês para um profissional, trial 14d, Asaas/webhook; sandbox real NÃO exercitado (S4) |
| Segurança, LGPD e conformidade | 4 | cifra marcada configurada no snapshot de 17/10; R2, jurídico e S9 seguem abertos e exigem revalidação |
| Infra e multi-tenant | 6 | tenant derivado de sessão, `clinic_id` no predicado; legado sem `clinic_id` (S9) |
| Distribuição e GTM | 1 | sem canal, parceria ou conteúdo mapeado |
| Métricas e instrumentação | 3 | evidência SQL por clínica; sem funil de aquisição |
| Prova de demanda | 0 | sem entrevista nem piloto pago registrados |

## Prova de demanda (Ciclo 2)
| Indicador | Valor | Alvo |
|---|---|---|
| Entrevistas Solo com neuropediatras independentes | 0 | 10 |
| Compromissos de demo/piloto | 0 | ≥1 → 3 pilotos pagos |
| 2ª fatura confirmada por `charge_paid` | 0 | 2 |
| Faixa de preço aceita (mediana) | n/d | validar R$ 99/mês |
