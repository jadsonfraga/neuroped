# QA Filtro Clínico — 15 Cenários (MP9.0 WS4)

**Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756**
**Meta MP9.0:** ≥13/15 cenários com top-3 clinicamente coerente.

Cada cenário: input estruturado + pódio esperado + critério de falha.

---

## 1. TDAH escolar clássico (8a)
**Input:** `age_months=96, complaints=["agitação","desatenção","escola"]`
**Esperado pódio:** 🥇 Vanderbilt · 🥈 SNAP-IV · 🥉 Conners-3
**4º teste direto:** Stroop pediátrico / Digit Span
**5º escolar:** Vanderbilt (versão escola)
**Falha se:** C-SSRS aparece (gate violado)

## 2. TEA não-verbal precoce (28m)
**Input:** `age_months=28, complaints=["não fala","ausência apontar","resposta nome"]`
**Esperado:** 🥇 M-CHAT-R/F · 🥈 Primeiros Sinais TEA · 🥉 SRS-2
**Falha se:** CARS-2 aparece (precisa dx suspeito antes)

## 3. TEA verbal masculino 9a (alto funcionamento)
**Input:** `age_months=108, complaints=["literalidade","amizades","interesses intensos"]`
**Esperado:** 🥇 SRS-2 · 🥈 ABC comportamento · 🥉 SDQ
**Falha se:** M-CHAT (fora janela etária)

## 4. Depressão adolescente 14a
**Input:** `age_months=168, complaints=["humor","isolamento","ideação"]`
**Esperado:** 🥇 PHQ-A · 🥈 ASQ Suicide · 🥉 CDI 2
**Risco:** C-SSRS válido (idade ≥11a + flag risco)

## 5. Birra pré-escolar 3a
**Input:** `age_months=36, complaints=["birra","explosão","frustração"]`
**Esperado:** 🥇 Triagem A-B-C · 🥈 SDQ · 🥉 CBCL
**Falha se:** C-SSRS aparece (idade <11)

## 6. Atraso global 18m
**Input:** `age_months=18, complaints=["não engatinha","balbucio pobre"]`
**Esperado:** 🥇 ASQ-3 (1-66m) · 🥈 Bayley-4 (estudo) · 🥉 Primeiros Sinais TEA
**Falha se:** GMFCS aparece (precisa dx PC)

## 7. Dislexia 8a (queixa escola)
**Input:** `age_months=96, complaints=["dificuldade leitura","troca letras"]`
**Esperado:** 🥇 Teste Leitura · 🥈 RAN nomeação · 🥉 Consciência fonológica
**5º escolar:** Questionário escolar dislexia
**Falha se:** SNAP-IV (foco errado)

## 8. Cefaleia recorrente 10a
**Input:** `age_months=120, complaints=["cefaleia","escola"]`
**Esperado:** 🥇 Diário Cefaleia · 🥈 Diário Sono · 🥉 SDQ
**Crítico:** diários longitudinais antes de escala fechada

## 9. Convulsão recente 6a
**Input:** `age_months=72, complaints=["crise convulsiva"]`
**Esperado:** 🥇 Diário de Crises · 🥈 Diário Medicação · 🥉 Diário Sono
**Falha se:** instrumentos cognitivos no topo (focar crise)

## 10. Distúrbio sono 4a
**Input:** `age_months=48, complaints=["sono","despertares","birra dia"]`
**Esperado:** 🥇 BISQ · 🥈 Diário Sono · 🥉 ABC comportamento
**Falha se:** PHQ-A (idade incompatível)

## 11. Ansiedade escolar 11a
**Input:** `age_months=132, complaints=["recusa escolar","queixa somática"]`
**Esperado:** 🥇 SCARED · 🥈 GAD-7 · 🥉 SDQ
**5º escolar:** Questionário recusa escolar

## 12. TDAH desatento mascarado feminino 11a
**Input:** `age_months=132, sex="F", complaints=["distração","esquecimento","sonhadora"]`
**Esperado:** 🥇 SNAP-IV · 🥈 Vanderbilt · 🥉 BRIEF-2 (estudo)
**Crítico:** ranking não pode penalizar perfil feminino discreto

## 13. Risco suicida agudo 15a
**Input:** `age_months=180, complaints=["ideação ativa","plano","autolesão"]`
**Esperado:** 🥇 C-SSRS · 🥈 ASQ Suicide · 🥉 PHQ-A
**Crítico:** C-SSRS DEVE aparecer (risco declarado)

## 14. PC nível III 5a (paciente em acompanhamento)
**Input:** `age_months=60, diagnoses=["paralisia cerebral"], complaints=["motor","autonomia"]`
**Esperado:** 🥇 GMFCS · 🥈 Vineland-3 · 🥉 Movement ABC-2 (estudo)
**Crítico:** GMFCS válido (dx PC declarado)

## 15. Trauma agudo recente 7a
**Input:** `age_months=84, complaints=["perda","sono perturbado","irritabilidade"]`
**Esperado:** 🥇 CRIES-8 · 🥈 SDQ · 🥉 ABC comportamento
**Falha se:** PHQ-A (idade incompatível)

---

## Critérios de aprovação MP9.0

| Métrica | Meta | Crítico |
|---|---|---|
| Top-3 clinicamente coerente | ≥13/15 | sim |
| Zero violação de gate (C-SSRS sem risco, GMFCS sem PC) | 15/15 | sim |
| Pódio reflete idade-window correta | 15/15 | sim |
| 4º teste direto ou 5º escolar surgem quando aplicável | ≥10/15 | não |

**Resultado esperado pós-MP9.0:** ≥13/15 ✅
**Execução:** rodar manualmente via `/filtro-escalas?mode=flash` ou automatizar com `scripts/qa-clinical-15.mjs` (a ser criado pelo senior dev contratado).
