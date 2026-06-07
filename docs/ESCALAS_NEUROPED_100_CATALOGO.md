# NeuroPed — Catálogo de 100 escalas neuropsiquiátricas infantis

Versão: **2026.06.07**

Este documento acompanha o arquivo de dados `data/neuroped_escalas_neuropsiquiatria_infantil_100.json` e orienta a integração das 100 escalas no NeuroPed.

## Aviso clínico e jurídico

- O catálogo não reproduz itens dos instrumentos.
- “Gratuito” não significa “domínio público”.
- Antes de embutir itens, respostas, normas ou algoritmos de escore no app, verificar a fonte oficial e a licença.
- Instrumentos com política `permission` devem ser usados como ficha clínica/fonte até autorização formal.
- Todo resultado deve ser interpretado como triagem/monitoramento, nunca diagnóstico isolado.

## Políticas

| Política | Significado |
|---|---|
| `embed` | Candidato a incorporação com atribuição e conferência oficial |
| `permission` | Exige permissão/licença antes de embutir itens ou escores |
| `link` | Preferir ficha clínica e fonte oficial |

## Núcleos clínicos cobertos

1. Desenvolvimento infantil e TEA.
2. Comportamento geral e funcionamento.
3. TDAH, oposição e prejuízo funcional.
4. Ansiedade, depressão e humor.
5. Segurança clínica e risco.
6. Trauma e TEPT.
7. Tiques e bipolaridade.
8. Substâncias e transtornos alimentares.
9. Sono e medidas PROMIS pediátricas.
10. Família, qualidade de vida e funcionamento social.

## Lista de siglas incluídas

SWYC Milestones, SWYC-BPSC, SWYC-PPSC, SWYC-POSI, CDC Milestones, GMCD, M-CHAT-R, M-CHAT-R/F, CAST, AQ-Child, AQ-Adolescent, AQ-10 Child, AQ-10 Adolescent, Q-CHAT, ASSQ, PSC-35, PSC-17 Parent, Y-PSC-17, SDQ Parent, SDQ Teacher, SDQ Self-report, CGAS, HoNOSCA, MOAS, NCBRF, Vanderbilt Parent Initial, Vanderbilt Teacher Initial, Vanderbilt Parent Follow-up, Vanderbilt Teacher Follow-up, SNAP-IV-26, SNAP-IV-18, WFIRS-P, WFIRS-S, SCARED Child, SCARED Parent, SCAS Child, SCAS Parent, PAS, RCADS-47 Child, RCADS-47 Parent, RCADS-25 Child, PHQ-A / PHQ-9A, SMFQ Child, SMFQ Parent, MFQ Child Long, Columbia Depression Scale, ASQ, C-SSRS Screener, CATS, CTS, CATS Youth, CATS Caregiver, CATS 3–6, CPSS-5-SR, CPSS-5-I, CTS Child, CTS Caregiver, CRIES-8, CRIES-13, TESI-C, YGTSS, YGTSS-R, PUTS, MOVES, CMRS-P, CMRS-10, PGBI-10M, P-YMRS, MDQ-A, GBI Parent, ASQ Youth, C-SSRS Lifetime/Recent, C-SSRS Pediatric SLC, SAFE-T with C-SSRS, CRAFFT 2.1, S2BI, BSTAD, NIAAA Youth Alcohol Screen, EAT-26, SCOFF, PSQ-SRBD, BEARS, PROMIS Pediatric Anxiety, PROMIS Pediatric Depressive Symptoms, PROMIS Pediatric Anger, PROMIS Pediatric Fatigue, PROMIS Pediatric Pain Interference, PROMIS Pediatric Sleep Disturbance, PROMIS Pediatric Sleep-Related Impairment, PROMIS Pediatric Peer Relationships, PROMIS Pediatric Cognitive Function, PROMIS Pediatric Family Relationships, PROMIS Pediatric Life Satisfaction, PROMIS Pediatric Mobility, PROMIS Pediatric Upper Extremity, NIH Toolbox Positive Affect, NIH Toolbox Life Satisfaction, NIH Toolbox Emotional Support, NIH Toolbox Loneliness, NIH Toolbox Anger.

## Próxima etapa técnica

Integrar os dados ao frontend em `client/src/features/scales` com filtros por idade, domínio, respondente, selo clínico e política de licença.
