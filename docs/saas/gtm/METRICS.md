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

Não medidos por desenho (NOT_MEASURED em product-evidence): clínicas pagantes reais, MRR,
ARPA, churn, ativação comercial. Nenhum número acima é receita real.

## Painel de Prontidão SaaS, Ciclo 1 (notas 0–10; julgamento sobre leitura de código,
## produção não foi inspecionada)
| Dimensão | Nota | Evidência principal |
|---|---|---|
| Proposta de valor e posicionamento | 4 | páginas `planos`/`sobre` existem; posicionamento por ICP não definido |
| ICP e segmentação | 2 | nenhum ICP decidido; produto atende "médico criador" + multi-profissional |
| Onboarding e time-to-first-value | 7 | marcos persistidos + verificação de e-mail; jornada de aceite testada |
| Núcleo do produto e retenção | 7 | laudos, escalas, agenda multiprofissional, intake; retenção não medida |
| Monetização | 6 | R$ 99/assento, trial 14d, Asaas, webhook; sandbox real NÃO exercitado (S4) |
| Segurança, LGPD e conformidade | 4 | desenho forte, mas cripto clínica e R2 ausentes em produção; S9 P0 aberto |
| Infra e multi-tenant | 6 | tenant derivado de sessão, `clinic_id` no predicado; legado sem `clinic_id` (S9) |
| Distribuição e GTM | 1 | sem canal, parceria ou conteúdo mapeado |
| Métricas e instrumentação | 3 | evidência SQL por clínica; sem funil de aquisição |
| Prova de demanda | 0 | sem entrevista nem piloto pago registrados |

## Prova de demanda (Ciclo 2)
| Indicador | Valor | Alvo |
|---|---|---|
| Entrevistas realizadas (ICP A) | 0 | 3 → 10 |
| Compromissos de demo/piloto | 0 | ≥1 → 3 pilotos pagos |
| Faixa de preço aceita (mediana) | n/d | validar R$ 99/assento |
