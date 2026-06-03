# Arquitetura Clínica V3.1 — NeuroPed EDJ

**Dr. Jadson Fraga Araújo Júnior · CRM-PE 25227 · RQE 17756**
**Versão:** 3.1.0 · **Data:** 03/06/2026

---

## Princípio fundador

Três naturezas clínicas não podem compartilhar o mesmo motor de filtro. O sistema agora possui **três engines isoladas**, cada uma com responsabilidade única, herdando uma superclasse comum e despachadas por um registry plugável.

```
InstrumentRegistry  ← registra todos os instrumentos
    │
    ├── BaseClinicalEngine
    │      └── persistência local, listagem, recommend genérico
    │
    ├── DirectTestEngine    ← testes presenciais aplicados na criança
    ├── ScaleEngine         ← escalas/questionários de pré-consulta
    └── DiaryEngine         ← diários longitudinais
```

O **anti-pattern** `if (item.tipo === "teste")` está formalmente proibido pelo schema. Nenhum painel mistura categorias.

---

## Schema canônico (v3.1)

Cada instrumento precisa dos **11 campos obrigatórios**:

| Campo | Tipo | Função |
|---|---|---|
| `id` | string com prefixo (`td-`, `ofc-`, `esc-`, `fam-`, `diar-`) | identidade |
| `name` | string | rótulo visível |
| `type` | enum `direct_test \| scale \| diary` | despacha para engine |
| `subtype` | string | dentro do type |
| `category` | enum `clinical_application \| pre_consultation \| longitudinal_followup` | rota UI |
| `application_mode` | enum `presencial \| remoto \| hibrido \| recorrente` | fluxo |
| `respondent` | enum (clinico/familia/escola/autoteste etc.) | quem responde |
| `longitudinal` | boolean | `true` somente para `diary` |
| `requires_training` | boolean | bloqueia pré-consulta se `true` |
| `estimated_minutes` | number 0-240 | orçamento |
| `purpose` | enum `triagem \| confirmacao \| acompanhamento \| ...` | objetivo |

O `InstrumentRegistry.register()` valida todos os 11 campos e **falha duro** se algum estiver ausente ou inconsistente (ex.: `diary` sem `longitudinal=true`).

---

## Tipagem forte JSDoc

`clinical-engines.js` declara `@typedef` para `Instrument`, `ClinicalQuery`, `RecommendationResult`. Em VS Code com `// @ts-check` no topo de qualquer arquivo consumidor, há autocomplete e validação estática sem necessidade de TypeScript compilado.

```js
// @ts-check
/** @type {import("./clinical-engines.js").Instrument} */
const inst = { id: "td-novo", ... }; // ← VS Code valida cada campo
```

---

## Engines — APIs públicas

### DirectTestEngine

```js
const dt = NeuroPedClinical.directTestEngine;
dt.list();                            // todos os testes diretos
dt.find("td-stroop-pediatrico");      // 1 teste
dt.recommend({ chief_complaints: ["atencao"] });
const session = dt.startApplication("td-digit-span-direto-inverso", { patient: {...} });
//    session.clock.start  → cronômetro
//    session.commit({ score: 7, time_ms: 240000 })
dt.history("td-digit-span-direto-inverso");
```

Prioriza testes com `estimated_minutes` curto. Salva por `patient_id` (anonimizado).

### ScaleEngine

```js
const sc = NeuroPedClinical.scaleEngine;
sc.list();                            // todas as escalas
sc.listPreConsulta();                 // só pré-consulta (bloco Vineland/CARS/Conners/etc.)
sc.recommend({ chief_complaints: ["atencao"] });    // já aplica filtro pré-consulta
sc.remoteFillLink("ofc-snap-iv", "patient-hash-abc"); // gera URL p/ pais preencherem remotamente
```

Aplica filtro pré-consulta **automaticamente** em `recommend()`. Bloqueia se: `requires_training=true`, `estimated_minutes>20`, respondente clínico, propósito que não seja triagem/acompanhamento.

### DiaryEngine

```js
const di = NeuroPedClinical.diaryEngine;
di.logEntry("diar-sono", { hora_dormir: "21:30", despertares: 2, qualidade_1_5: 3 });
di.history("diar-sono");                  // todos os registros ordenados por ts
di.summary("diar-sono", 30);              // {n, avg, min, max} dos últimos 30 dias
di.trend("diar-sono", 4);                 // {weeks:[...], delta, direction: "melhorando"|"piorando"|"estavel"}
```

Calcula trend simples comparando médias semanais. Pronto para gráficos.

---

## Export PDF clínico

`clinical-pdf-export.js` carrega jsPDF on-demand via CDN. Três templates:

```js
await NeuroPedPDFExport.exportDirectTestPDF({ test, patient, result });
await NeuroPedPDFExport.exportScalePDF({ scale, patient, answers, scoring });
await NeuroPedPDFExport.exportDiaryPDF({ diary, patient, entries, summary, trend });
```

Todos com cabeçalho institucional (Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756), tipografia serif Times, paleta wine/gold convertida para impressão. Dispatcha `neuroped:laudo-generated` para integração futura com Drive MCP (regra do CLAUDE.md).

---

## Registry plugável

Adicionar um novo instrumento em runtime, sem build:

```js
NeuroPedClinical.registry.register({
  id: "td-prolec-rapido",
  name: "PROLEC Rápido",
  type: "direct_test",
  subtype: "reading",
  category: "clinical_application",
  application_mode: "presencial",
  respondent: "paciente_em_desempenho",
  longitudinal: false,
  requires_training: true,
  estimated_minutes: 12,
  purpose: "confirmacao"
});
```

Imediatamente aparece em `DirectTestEngine.list()` e nas recomendações. Plugins podem chamar `registry.on()` para reagir a registros.

---

## Persistência local

Cada engine tem seu próprio namespace em `localStorage`:

- `neuroped.direct_test.v3-1` — sessões aplicadas
- `neuroped.scale.v3-1` — preenchimentos
- `neuroped.diary.v3-1` — entradas longitudinais

`BaseClinicalEngine.save() / history() / clear()` herdadas. Quando V11 trouxer criptografia (vide RISCOS-ESTRUTURAIS), basta sobrescrever `_read/_write` na base — todas as engines herdam.

---

## Roteamento automático

`clinical-router.js` (v3) continua ativo. Quando o usuário abre `testes-diretos.html`, somente `direct_test` é exibido. Mesma coisa para os outros 2 painéis.

Anti-pattern bloqueado:

```js
// ❌ NUNCA
if (item.tipo === "teste") { ... }

// ✅ V3.1
if (instrument.type === "direct_test") { dt.recommend(query); }
```

---

## Migração V3 → V3.1

Não é breaking change. Os arquivos da V3 (`clinical-taxonomy-v3.json`, `clinical-router.js`, `neuroped-diarios.js/.css`, 3 HTMLs) continuam funcionando. A V3.1 adiciona:

- `clinical-taxonomy-v3.1.json` (substitui o antigo com mais campos)
- `clinical-engines.js` (nova base — substitui parte de `neuroped-engine-clinica.js` para os 3 fluxos)
- `clinical-pdf-export.js` (novo)

O `APLICAR-ARQUITETURA-V3-1.bat` cuida de copiar tudo, injetar nos 3 painéis e fazer push.

---

## Roadmap de evolução

- **V3.2** — calendário-heatmap real em diários (já há sparkline + tabela; falta heatmap)
- **V3.3** — gráficos Chart.js nos trends de diários
- **V3.4** — link de preenchimento remoto com short-link (QR code para pais)
- **V4.0** — integração com prontuário HL7-FHIR + admin panel para métricas
- **V4.x** — criptografia simétrica da persistência (R2.1 dos riscos)

---

**Esta arquitetura é o que torna o app neuropediátrico um sistema profissional escalável — não mais um catálogo.**
