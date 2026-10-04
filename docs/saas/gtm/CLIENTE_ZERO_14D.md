# Cliente Zero em LIVE: roteiro de 14 dias (Ciclo 8)

Objetivo: provar, com a clínica do proprietário, o caminho cadastro → primeiro documento clínico em
<30 min, sem tocar em terceiro. Só começa quando as pré-condições abaixo estiverem ✅.
Base: `docs/saas-live-clinical-rollout.md`, `shared/onboarding.ts`, `shared/product-evidence.ts`,
`docs/saas/gtm/PHASE3_GATE.md`. Nenhum dado de paciente real vai para repositório, log ou print.

## Pré-condições (D0)
| # | Condição | Evidência |
|---|---|---|
| P1 | G1: keyring clínico em Production | audit Clinical/LGPD: `clinicalCryptoConfigured=true` |
| P2 | G4: backup/restore provado com cifra real | run verde do ensaio de DR |
| P3 | G3: S9 resolvido (legados destinados, bypass admin removido) | censo repetido + testes negativos Alfa/Beta |
| P4 | Backup operacional do D1 feito imediatamente antes | registro da data/hora (sem conteúdo) |
| P5 | Subscrição trial válida da clínica do proprietário | `GET /api/billing/me` autenticado |
G2 (R2/exportação) e G5 (Asaas sandbox) são desejáveis; sem G2, **não** prometer exportação completa.
G6 (jurídico) é exigido antes de TERCEIROS; o proprietário como controlador da própria clínica
pode iniciar, mas registre a decisão.

## Dias 1 a 2: smoke técnico com dados 100% sintéticos
- Confirmar que o domínio LIVE responde (listagem de clínicas, troca de clínica, criar paciente
  fictício, registrar avaliação, emitir documento versionado, solicitar exportação).
- Conferir no `saas_audit_log` os marcos (paciente, consulta, documento, avaliação).
- Medir o time-to-first-document com cronômetro (meta <30 min a partir da conta criada).
- Falhou algo? Parar; registrar código de erro (nunca conteúdo); corrigir antes do dia 3.

## Dias 3 a 7: uso real gradual (só novos atendimentos)
- Dia 3: 1 paciente novo real, do início ao documento. Revisar o PDF antes de entregar.
- Dias 4 a 5: até 3 pacientes novos; convidar 1 profissional/recepção de confiança para testar papéis.
- Dias 6 a 7: pré-consulta/escala respondida pela família em casa (1 caso); pedir feedback do responsável
  sobre clareza, não sobre dado clínico.
- Não migrar histórico antigo nesta semana.

## Dias 8 a 14: rotina e estresse
- Rotina normal de agenda e documentos no NeuroPed; anotar por dia: minutos economizados ou perdidos,
  erros, pedidos que o produto não atende (alimenta o ROADMAP).
- Dia 10: teste de revogação (remover o acesso do convidado e confirmar que ele perde o acesso).
- Dia 12: simular exportação de 1 paciente fictício e conferir completude.
- Dia 14: revisão: os 10 marcos do onboarding (`shared/onboarding.ts`), lista de bugs, decisão go/no-go.

## Métricas do período (registrar em METRICS.md, sem identificação)
Time-to-first-document; nº de marcos concluídos de 10; nº de documentos emitidos; erros por dia;
dias com uso espontâneo; minutos economizados/semana (estimativa do proprietário).

## Critérios de parada (rollback sem perda)
Qualquer um: erro de cifra/decifra, paciente visível fora da clínica, documento perdido, divergência
de contagem após restauração. Ação: desligar `CLINICAL_LIVE_ENABLED`, manter tabelas intactas,
**sem DROP/DELETE**, preservar evidência (`docs/saas-live-clinical-rollout.md`, seção Rollback).

## Limites conhecidos do LIVE (declarados no rollout; não ocultar ao decidir go/no-go)
Primeira listagem limitada a 100 pacientes, sem busca paginada no servidor; portal da família não é
experiência completa; exportação/eliminação dependem de worker operacional; envio de e-mail
depende da integração configurada.

## Critério de sucesso
14 dias sem incidente de isolamento/cifra, ≥8 de 10 marcos concluídos, time-to-first-document <30 min
repetido em ≥3 pacientes e a decisão go/no-go registrada em DECISIONS.md.
