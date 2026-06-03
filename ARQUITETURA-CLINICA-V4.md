# NeuroPed — Clinical Intelligence Layer (V4.0)

Evolução da V3.2 (infraestrutura: engines, governança, persistência, explainability,
plugin SDK, PDF auditável) para uma **camada de inteligência clínica longitudinal**
orientada por **fenótipo neurofuncional** — não mais "catálogo de escalas".

> **Status: FUNDAÇÃO entregue como biblioteca INERTE.** Os módulos NÃO são
> carregados por nenhuma página nem pelo Service Worker. Não alteram o
> comportamento do app em produção. São a base para, depois de validação
> clínica, construir as telas/integrações. Zero risco ao paciente hoje.

## Princípios não-negociáveis
1. **Sem caixa-preta.** Todo insight passa por `clinical-explainability.makeInsight` e carrega `evidence[]` (instrumento, domínio, sinal, peso), `confidence`, `conflicting_signals[]`, `explanation`. Insight sem evidência **lança erro**.
2. **Nenhuma decisão diagnóstica automática.** As engines *sinalizam*; o médico decide. Todo output traz disclaimer.
3. **Nada de clínica fabricada.** Severidade por instrumento, polaridade, clusters de fenótipo, limiares de burden, MCID e regras de contradição vêm de **config clínica do responsável**. Sem config, a engine responde `insufficient_clinical_configuration` — não adivinha.
4. **Comparação só entre comparáveis.** `clinical-normalization` proíbe comparar instrumentos sem mapeamento registrado (devolve `needs_mapping`).
5. **Determinístico.** Sem IA generativa nesta fase.

## Módulos (FASE 11 — outputs)
| Arquivo | Fase | Papel |
|---|---|---|
| `clinical-explainability.js` | 7 | Envelope de insight auditável + `insufficientConfig`. |
| `clinical-normalization.js` | 2 | `normalized_clinical_signal`; domínio canônico; recusa comparação sem mapeamento. |
| `clinical-timeline-engine.js` | 1 | Consolida aplicações salvas → timeline, domínios, trajetória. Núcleo. |
| `phenotype-engine.js` | 3 | Clusters por config; convergência, divergência entre respondentes, overlap. |
| `therapeutic-burden-engine.js` | 4 | Carga semanal/mensal, diversidade, burden familiar; risco/VANT por limiar. |
| `response-engine.js` | 5 | RTI: improving/plateau/unstable/regressing; suavização; MCID; IC95. |
| `contradiction-engine.js` | 6 | Inconsistências entre fontes/regras; rebaixa confiança; sugere reavaliação. |
| `clinical-decision-support.js` | 9 | Lacunas, reavaliação devida, excesso terapêutico, domínio subexplorado. |
| `clinical-visual-schema.js` | 8 | View-models (radar, timeline, heatmap, burden, trajectory, clusters). Sem DOM. |

Namespace global: `window.NeuroPedClinical.{Explain,Normalize,Timeline,Phenotype,Burden,Response,Contradiction,DecisionSupport,VisualSchema}`. Também `module.exports` (testável em Node).

## Domínios funcionais canônicos (12)
`linguagem · atencao · hiperatividade · socializacao · rigidez · sensorial · aprendizagem · emocional · comportamento_adaptativo · executivo · sono · autonomia`

## Contrato de dados (entrada real já existente)
A timeline consome o que o app já persiste (`neuroped_scales_results_v1` via `NPStore.resultsFor`):
```
{ instrument_id, instrument_title, patient_code, created_at(ISO),
  score, max, domains:[{name, score, max, pct}] }
```
`normalizeReading` mapeia o rótulo de domínio → domínio canônico e expõe `raw_pct`. **Severidade** só quando há mapeamento do instrumento.

## ⚠️ CONFIG CLÍNICA OBRIGATÓRIA (Dr. Jadson) — antes de qualquer uso clínico
Objeto `clinicalConfig` (validar e versionar com o responsável):
```js
{
  instruments: {
    "snap-iv":   { polarity: "higher_is_worse", confidence: 0.85, severityFn?(raw,age) },
    "vineland":  { polarity: "higher_is_better" },           // adaptativo: maior = melhor
    // ... um por instrumento que entrar na análise longitudinal
  },
  domainMap: { /* rótulos específicos → domínio canônico, se o lexical não bastar */ },
  thresholds: { change_min: 0.10, unstable_sd: 0.18 },        // timeline
  rti: { mcid: 0.15, window: 2, unstable_sd: 0.18 },          // resposta
  phenotypes: [ { id, label, weights:{dominio:peso}, min_confidence } ],
  burden: { hours_warn: 8, hours_high: 15, diversity_high: 4 },
  contradiction: { gap: 0.4, rules: [ { id, label, a:{source|domain|respondent}, b:{...}, min_gap } ] },
  cds: { reassess_days: 90, expected_domains: [...] }
}
```
**Sem `instruments[].polarity`, a timeline/RTI NÃO rotulam melhora/piora** (só sentido bruto). **Sem `phenotypes`, a fenotipagem não infere.** Isso é proposital.

## Pendências clínicas herdadas (escalas V3.x) que alimentam a V4
- Semântica das `traps` (qualquer × todos), `cutoffs` de `npe-br-005`/`011`, fluxo do `sentinel` de risco (autolesão) — ver `AUDITORIA_ESCALAS_2026-06.md`. Esses sinais devem alimentar `contradiction`/`decision-support` quando definidos.

## Como integrar (depois da validação)
1. Definir e revisar o `clinicalConfig` com o Dr. Jadson.
2. Carregar os módulos em uma tela nova (ex.: `perfil-crianca.html#trajetoria`) e no precache do SW.
3. `var tl = NeuroPedClinical.Timeline.buildForActiveChild(clinicalConfig);` e alimentar as demais engines.
4. Renderizar via `clinical-visual-schema` (camada visual desacoplada).

## FASE 10 — preparação futura (NÃO implementado agora)
Interfaces previstas para embeddings clínicos, NLP de evolução textual, transcrição,
integração escolar, assinatura digital, input multimodal, analytics populacionais e
benchmarks normativos. Sem IA generativa nesta fase.

## Objetivo final
Comportar-se como **plataforma neurodesenvolvimental longitudinal orientada por fenótipo**,
mantendo o médico no centro da decisão — explicável, auditável e honesta sobre seus limites.
