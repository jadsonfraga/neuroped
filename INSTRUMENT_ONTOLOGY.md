# Ontologia de Instrumentos · NeuroPed

**Versão:** 1.0 · **Data:** 2026-06-03 · **Autor:** Dr. Jadson Fraga (CRM-PE 25227 · RQE 17756)
**Escopo:** especificação canônica para classificação multidimensional de instrumentos clínicos no app NeuroPed.

---

## 1. Problema que esta ontologia resolve

O catálogo atual mistura, num único motor de filtro, instrumentos com naturezas clínicas incompatíveis: testes diretos aplicados pelo médico, escalas para a família responder em casa, inventários de comportamento, diários longitudinais e ferramentas clínicas (checklists, planos terapêuticos, cartas). A classificação atual é **inferida por regex no título** (`scales-curate.js:13` `kindOf()` e `filtro-escalas.html:257` `isDiaryPre()`), o que produz:

- Diários aparecem como teste no filtro de pré-consulta.
- Testes que exigem treinamento clínico aparecem como opção para preenchimento familiar.
- Renomear um instrumento muda silenciosamente sua classificação.
- Não há gate explícito de segurança clínica para instrumentos de risco autolesivo (C-SSRS, SERA-10).

Esta ontologia substitui inferência por **classificação multidimensional declarativa** baseada em cinco eixos ortogonais.

---

## 2. Os cinco eixos da ontologia

Todo instrumento é descrito por cinco eixos independentes. Nenhum eixo é redundante; cada um responde a uma pergunta clínica diferente.

### Eixo 1 — `instrument_type` (o que é)

| Valor | Definição | Exemplo |
|---|---|---|
| `direct_test` | Tarefa executada pela criança sob observação. Resultado depende do desempenho em tempo real. | Denver, EPIL-NE (componente direto), prova de leitura |
| `scale_questionnaire` | Escala de itens fechados respondidos por informante. Pontuação produz faixa ou ponto de corte. | M-CHAT, SNAP-IV, SDQ, NPE autorais |
| `inventory` | Lista extensa de comportamentos/sintomas marcados como presentes/ausentes/frequência. Produz perfil multidimensional. | CBCL, BASC |
| `diary` | Registro longitudinal recorrente. Não pontua: gera linha do tempo e padrões. | Diário A-B-C, diário de crises epilépticas, diário cefaleia, diário sono BISQ-7d |
| `clinical_tool` | Instrumento não pontuável: checklist, plano terapêutico, carta clínica, agenda visual. | Plano de manejo de crise, carta para escola, checklist GMFCS classificatório |

### Eixo 2 — `respondent_required` (quem responde)

| Valor | Definição |
|---|---|
| `clinician_trained` | Profissional com treinamento específico no instrumento (ex.: ADOS-2, Vineland-3, CARS) |
| `clinician_any` | Qualquer profissional de saúde (ex.: triagens clínicas simples) |
| `family` | Pais ou cuidador |
| `teacher` | Professor ou equipe escolar |
| `self_report` | A própria criança/adolescente (autoteste) |
| `multi_informant` | Exige preenchimento por mais de uma fonte (ex.: SNAP-IV pais + escola) |

### Eixo 3 — `training_required` + `training_level`

```
training_required: boolean
training_level: "none" | "brief" | "certification"
```

- `none` — qualquer pessoa alfabetizada pode preencher.
- `brief` — leitura de manual curto suficiente (M-CHAT, SDQ).
- `certification` — exige treinamento formal certificado (ADOS-2, Vineland-3).

### Eixo 4 — `time_to_apply_minutes` (custo de tempo)

Inteiro. Tempo médio de aplicação ou preenchimento em minutos. Usado pelo filtro de pré-consulta para excluir instrumentos longos (`>20 min`).

### Eixo 5 — `application_mode` (como se aplica)

| Valor | Definição |
|---|---|
| `presencial_clinico` | Requer encontro presencial com o profissional |
| `remoto_familia` | Família preenche em casa antes da consulta |
| `remoto_escola` | Escola preenche e envia |
| `autoaplicado` | Paciente preenche sozinho |
| `longitudinal_continuo` | Preenchimento recorrente ao longo do tempo |
| `entrevista_estruturada` | Profissional entrevista o informante seguindo roteiro |

---

## 3. Atributos derivados (calculados, não persistidos)

Estes atributos saem de funções puras sobre os cinco eixos. Não são armazenados no JSON; são computados sob demanda pelo motor.

```
appears_in_pre_consult_filter(instrument)
  := instrument_type ∈ { scale_questionnaire, inventory, diary }
     && respondent_required ∈ { family, teacher, self_report, multi_informant }
     && !training_required (ou training_level === "brief")
     && time_to_apply_minutes <= 20
     && !has_clinical_gate(instrument)

belongs_to_direct_test_engine(instrument)
  := instrument_type === "direct_test"
     || application_mode === "presencial_clinico"

belongs_to_scale_engine(instrument)
  := instrument_type ∈ { scale_questionnaire, inventory }
     && application_mode ∈ { remoto_familia, remoto_escola, autoaplicado }

belongs_to_diary_engine(instrument)
  := instrument_type === "diary"
     || application_mode === "longitudinal_continuo"
```

---

## 4. Atributos de segurança clínica

Campos opcionais que ativam comportamentos especiais nos motores:

```
clinical_gate: {
  enabled: boolean,
  reason: string,                 // ex: "risco autolesivo", "exige interpretação médica"
  message_to_family: string,      // texto exibido se família tentar acessar
  bypass_roles: string[]          // ex: ["clinico", "medico"]
}

sentinel: {
  enabled: boolean,
  trigger_items: number[],        // índices dos itens-sentinela
  trigger_threshold: number,      // pontuação que ativa
  action: "alert_clinician" | "show_resources" | "block_export"
}
```

Instrumentos com `clinical_gate.enabled === true` **nunca** entram em `appears_in_pre_consult_filter`. Exemplos: C-SSRS, ASQ Suicide, SERA-10.

---

## 5. Catálogo de classificação (lista mestra)

Esta tabela é a verdade canônica para o overlay runtime. Cada linha mapeia um instrumento conhecido aos cinco eixos.

| ID | Nome | type | respondent | training | min | mode | gate |
|---|---|---|---|---|---|---|---|
| `fam-12-36-tea-primeiros-sinais` | Primeiros Sinais TEA | `scale_questionnaire` | `family` | none | 3 | `remoto_familia` | — |
| `fam-12-36-fala-inicial` | Fala Inicial | `scale_questionnaire` | `family` | none | 3 | `remoto_familia` | — |
| `fam-12-36-alimentacao-sensorial` | Alimentação Sensorial | `scale_questionnaire` | `family` | none | 3 | `remoto_familia` | — |
| `fam-12-36-sono-pequeno` | Sono do Pequeno | `scale_questionnaire` | `family` | none | 3 | `remoto_familia` | — |
| `fam-12-36-brincar-social` | Brincar Social | `scale_questionnaire` | `family` | none | 3 | `remoto_familia` | — |
| `fam-3-5-comunicacao-funcional` | Comunicação Funcional | `scale_questionnaire` | `family` | none | 3 | `remoto_familia` | — |
| `fam-3-5-crises-transicoes` | Crises e Frustração | `scale_questionnaire` | `family` | none | 3 | `remoto_familia` | — |
| `fam-3-5-sensorial-diario` | Sensorial Diário (nome enganoso, é escala) | `scale_questionnaire` | `family` | none | 3 | `remoto_familia` | — |
| `fam-3-5-autonomia-inicial` | Autonomia Inicial | `scale_questionnaire` | `family` | none | 3 | `remoto_familia` | — |
| `fam-3-5-flexibilidade-rotina` | Flexibilidade e Rotina | `scale_questionnaire` | `family` | none | 3 | `remoto_familia` | — |
| `fam-6-11-atencao-casa` | Atenção em Casa | `scale_questionnaire` | `family` | none | 3 | `remoto_familia` | — |
| `fam-6-11-organizacao-memoria` | Organização e Memória | `scale_questionnaire` | `family` | none | 3 | `remoto_familia` | — |
| `fam-6-11-ansiedade-infantil` | Ansiedade Infantil | `scale_questionnaire` | `family` | none | 3 | `remoto_familia` | — |
| `fam-6-11-oposicao-irritabilidade` | Irritabilidade e Oposição | `scale_questionnaire` | `family` | none | 3 | `remoto_familia` | — |
| `fam-6-11-sono-escolar` | Sono Escolar | `scale_questionnaire` | `family` | none | 3 | `remoto_familia` | — |
| `jf-einp-tdah-tod-12mais` | EINP-TDAH/TOD 12+ | `scale_questionnaire` | `multi_informant` | brief | 15 | `remoto_familia` | — |
| `jf-enf-tea-drj` | ENF-TEA-DRJ | `direct_test` | `clinician_trained` | true | 20 | `presencial_clinico` | gate clínico |
| `jf-enso-ped-sono` | ENSO-Ped Nordeste | `scale_questionnaire` | `family` | none | 5 | `remoto_familia` | — |
| `jf-epil-ne` | EPIL-NE Epileptológica | `direct_test` | `clinician_trained` | true | 25 | `presencial_clinico` | gate clínico |
| `jf-ecnfaj-cefaleia` | ECNFAJ-1 Cefaleia (parte escala) | `scale_questionnaire` | `family` | brief | 10 | `remoto_familia` | — |
| `jf-ecnfaj-cefaleia-diario` | ECNFAJ-1 Cefaleia (parte diário 30d) | `diary` | `family` | none | continuo | `longitudinal_continuo` | — |
| `jf-eani-ansiedade` | EANI-FJ Ansiedade | `scale_questionnaire` | `self_report` | none | 5 | `autoaplicado` | sentinel |
| `mchat-r-f` | M-CHAT-R/F | `scale_questionnaire` | `family` | brief | 5 | `remoto_familia` | — |
| `snap-iv` | SNAP-IV | `scale_questionnaire` | `multi_informant` | brief | 10 | `remoto_familia` | — |
| `sdq-pt` | SDQ-PT | `scale_questionnaire` | `multi_informant` | brief | 10 | `remoto_familia` | — |
| `phq-a` | PHQ-A | `scale_questionnaire` | `self_report` | brief | 5 | `autoaplicado` | sentinel item 9 |
| `gad-7` | GAD-7 | `scale_questionnaire` | `self_report` | brief | 5 | `autoaplicado` | — |
| `bisq-pt` | BISQ-PT | `scale_questionnaire` | `family` | none | 5 | `remoto_familia` | — |
| `srs-2` | SRS-2 | `scale_questionnaire` | `multi_informant` | true | 15 | `remoto_familia` | gate (instrumento licenciado WPS) |
| `abc-comportamento-triagem` | ABC Comportamento (Triagem Likert) | `scale_questionnaire` | `family` | none | 7 | `remoto_familia` | — |
| `abc-comportamento-diario` | ABC Comportamento (Diário de Episódios) | `diary` | `family` | none | continuo | `longitudinal_continuo` | — |
| `vanderbilt-pais` | Vanderbilt Pais | `scale_questionnaire` | `family` | brief | 10 | `remoto_familia` | — |
| `vanderbilt-professor` | Vanderbilt Professor | `scale_questionnaire` | `teacher` | brief | 10 | `remoto_escola` | — |
| **Bloqueados explicitamente do filtro pré-consulta:** | | | | | | | |
| `vineland-3` | Vineland-3 | `inventory` | `clinician_trained` | true (cert) | 60 | `entrevista_estruturada` | gate clínico |
| `cars-2` | CARS-2 | `direct_test` | `clinician_trained` | true (cert) | 30 | `presencial_clinico` | gate clínico |
| `conners-3` | Conners-3 | `scale_questionnaire` | `multi_informant` | true | 20 | `remoto_familia` | gate (licenciado MHS) |
| `gmfcs` | GMFCS | `clinical_tool` | `clinician_trained` | true | 10 | `presencial_clinico` | gate clínico |
| `c-ssrs` | C-SSRS | `clinical_tool` | `clinician_any` | true | 10 | `entrevista_estruturada` | gate risco autolesivo |
| `asq-suicide` | ASQ Suicide | `scale_questionnaire` | `clinician_any` | true | 5 | `entrevista_estruturada` | gate risco autolesivo |
| `cbcl` | CBCL | `inventory` | `family` | true | 25 | `remoto_familia` | gate (licenciado ASEBA) |
| **Diários canônicos:** | | | | | | | |
| `diario-sono-7d` | Diário de Sono 7 dias | `diary` | `family` | none | continuo | `longitudinal_continuo` | — |
| `diario-cefaleia-30d` | Diário de Cefaleia 30 dias | `diary` | `family` | none | continuo | `longitudinal_continuo` | — |
| `diario-crises-epilepticas` | Diário de Crises Epilépticas | `diary` | `family` | brief | continuo | `longitudinal_continuo` | sentinel cluster |
| `diario-alimentar-7d` | Diário Alimentar 7 dias | `diary` | `family` | none | continuo | `longitudinal_continuo` | — |
| `diario-evacuatorio` | Diário Evacuatório | `diary` | `family` | none | continuo | `longitudinal_continuo` | — |
| `diario-sensorial` | Diário Sensorial | `diary` | `family` | none | continuo | `longitudinal_continuo` | — |
| `diario-medicacao` | Diário de Medicação | `diary` | `family` | brief | continuo | `longitudinal_continuo` | — |
| `diario-escola-comportamento` | Diário Escolar de Comportamento | `diary` | `teacher` | none | continuo | `longitudinal_continuo` | — |

Para instrumentos **fora** desta lista mestra, o overlay aplica heurística de fallback (descrita em `engines/overlay.js`) e marca `classification_source: "heuristic_fallback"` para auditoria.

---

## 6. Regras de exibição por engine

### `directTestEngine`
Aceita apenas instrumentos com `belongs_to_direct_test_engine === true`. UX: fullscreen, cronômetro opcional, pontuação imediata, exporta laudo curto.

### `scaleEngine`
Aceita apenas instrumentos com `belongs_to_scale_engine === true`. UX: barra de progresso, linguagem familiar, compartilhamento por link, exporta PDF.

### `diaryEngine`
Aceita apenas instrumentos com `belongs_to_diary_engine === true`. UX: calendário/timeline, recorrência diária, gráficos evolutivos, exporta histórico em PDF.

### Filtro de pré-consulta (`canFamilyAdminister`)
Mostra **somente** instrumentos onde `appears_in_pre_consult_filter === true`. Aplica blocklist e allowlist explícitos definidos no catálogo acima.

---

## 7. Migração

A migração é **runtime e aditiva**, não destrutiva. O arquivo `engines/overlay.js` aplica os cinco eixos sobre o catálogo existente (`scales-bundle.js`) sem alterá-lo. Quando o `scripts/build-scales-bundle.mjs` for recuperado, os campos da ontologia poderão ser persistidos no JSON-fonte (`scales-editorial.js`, `scales-index.json`) e o overlay se torna desnecessário para os itens migrados — mas continua útil para instrumentos legados.

**Ordem de implementação:**

1. `engines/ontology.js` carregado primeiro: define tipos, validadores e o catálogo mestre.
2. `engines/overlay.js` carregado em seguida: tagueia `window.NEUROPED_EDITORIAL_SCALES` ou `window.NEUROPED_CATALOG` com os cinco eixos.
3. `engines/router.js` decide qual engine recebe o instrumento solicitado.
4. `filtro-escalas.html` patchado para usar `canFamilyAdminister()` no lugar de `isDiaryPre()`.
5. Novo menu `menu-instrumentos.html` apresenta as três entradas separadas (Testes Diretos · Escalas · Diários).

---

## 8. Compatibilidade retroativa

- Campos atuais (`audience`, `audience_label`, `domain`, `priority`, etc.) **permanecem intactos**.
- O overlay **adiciona** os cinco novos eixos sem remover nada.
- Páginas antigas continuam funcionando.
- Novo menu coexiste com `filtro-escalas.html`; ambos apontam para a mesma fonte de verdade tagueada.

---

## 9. Versionamento da ontologia

Esta especificação está versionada. Mudanças no schema seguem semver:

- **MAJOR** — adicionar/remover eixo, mudar semântica de valor enum.
- **MINOR** — adicionar valor enum, adicionar atributo derivado.
- **PATCH** — corrigir classificação de instrumento individual no catálogo mestre.

Versão atual: **1.0.0**.
