# Phase 2 Batch 3 — Plano de Execução
## Classificação de 39 Escalas "Difficult"

**Status**: 🟠 **PRONTO PARA INICIAR**  
**Data de início**: 2026-08-27  
**Branch destinada**: `claude/batch3-difficult-scales-xxxxxx` (será criada)  
**Duração estimada**: 3-4 dias  
**Complexidade**: ALTA (requer julgamento clínico profundo)

---

## Executive Summary

Phase 2 Batch 3 contém **39 escalas de classificação "difícil"** — as mais complexas do sistema NeuroPed. Essas escalas requerem:
- Análise multi-modal (múltiplos formatos, respondentes variáveis)
- Julgamento clínico profundo (algumas requerem revisão de especialista)
- Possíveis exceções às regras absolutas (casos limite)

**Dependências**:
- ✅ Phase 2 Batch 1 completa (48 scales)
- ✅ Phase 2 Batch 2 completa (73 scales)
- ✅ Otimizações de performance implementadas
- ⏳ Code review de Batch 2 (esperando)
- ⏳ E2E testing de Batch 2 (em fila)

---

## Batch 3 — Composition & Characteristics

### 39 Escalas Esperadas (Preliminar)

Baseado em análise de complexidade do catálogo completo:

#### Categoria 1: Baterias Adaptáveis (8-10 escalas)
Instrumentos com versões múltiplas, módulos condicionais, ou faixa etária específica:
- `wisc5-ext` — Wechsler Intelligence Scale for Children-5 Extended
- `wppsi4-ext` — Wechsler Preschool and Primary Scale of Intelligence-4
- `leiter3` — Leiter International Performance Scale-3
- `kabc2` — Kaufman Assessment Battery for Children-2
- `sb5` — Stanford-Binet Intelligence Scale-5
- `bayley4` — Bayley Scales of Infant and Toddler Development-4
- `griffiths3` — Griffiths Mental Development Scales-3
- `denver2` — Denver Developmental Screening Test-2
- `mullen` — Mullen Scales of Early Learning

**Desafio**: Respondent type e task type variam por módulo/idade

#### Categoria 2: Testes Cognitivos/Executivos (8-9 escalas)
Testes de processos específicos:
- `raven` — Raven Progressive Matrices
- `tmt` — Trail Making Test
- `stroop` — Stroop Color-Word Test
- `cpt3` — Continuous Performance Test-3
- `wcst` — Wisconsin Card Sorting Test
- `tower-london` — Tower of London
- `dot-probe` — Dot Probe Task
- `go-nogo` — Go/No-Go Task
- `flanker` — Flanker Task

**Desafio**: Todos são testes diretos (teste-direto-desempenho), mas variam em tarefa type

#### Categoria 3: Instrumentos Especializados — Autism (6-7 escalas)
Diagnóstico e avaliação de espectro autista:
- `ados2` — Autism Diagnostic Observation Schedule-2
- `ados2-toddler` — ADOS-2 Toddler Module
- `adir-interview` — Autism Diagnostic Interview-Revised
- `srs2` — Social Responsiveness Scale-2
- `rbs-r` — Repetitive Behavior Scales-Revised
- `rrbi` — Restricted and Repetitive Behavior Interview
- `vab-s` — Verbal Behavior Assessment Scale

**Desafio**: Alguns requerem clinician como primary respondent + structured interview

#### Categoria 4: Instrumentos Psiquiátricos Especializados (8-10 escalas)
Avaliações de sintomas psiquiátricos complexos:
- `ksads-pl` — Schedule for Affective Disorders and Schizophrenia for School-Age Children
- `p-cidi` — Computerized Diagnostic Interview for Children and Adolescents
- `dica-iv` — Diagnostic Interview for Children and Adolescents-IV
- `cas-pd` — Child Anxiety Schedule - Parent Diagnostic
- `scared` — Screen for Child Anxiety Related Emotional Disorders
- `mini-kid` — MINI International Neuropsychiatric Interview for Children
- `ymrs-ext` — Young Mania Rating Scale Extended
- `cprs` — Conners Parent Rating Scale-Revised
- `ctrs` — Conners Teacher Rating Scale-Revised
- `brief2` — Behavior Rating Inventory of Executive Function-2

**Desafio**: Multi-respondent, conditional logic, múltiplas versões por idade/contexto

#### Categoria 5: Instrumentos Adaptáveis / Pending Clinical Review (5-6 escalas)
Escalas que podem ficar "unclassified" pendendo revisão clínica:
- Escalas com respondent type condicional (varia por apresentação clínica)
- Instrumentos que requerem background clínico especializado
- Testes experimentais ou de pesquisa ainda não standardizados

**Desafio**: Requerem decisão: (a) classificar com regra clara, (b) deixar unclassified, (c) criar nova categoria de respondent type

---

## Estratégia de Classificação

### Abordagem por Lote (5 Lotes)

Organizar as 39 escalas em **5 lotes temáticos**, cada um com estratégia de classificação específica:

#### **Lote 3A: Baterias Adaptáveis** (9 escalas)
**Estratégia**: Classificar pelo módulo "padrão" ou "mais comum"
- `wisc5-ext` → teste-direto-desempenho + tarefa-desempenho-cognitivo
- `bayley4` → teste-direto-desempenho + observacao-comportamental (para infantes)

**Nota**: Adicionar justificação mencionando alternativas por idade/módulo

**Output**: 9 escalas, cada uma com campo "alt_respondent_types" documentando variações

#### **Lote 3B: Testes Cognitivos/Executivos** (9 escalas)
**Estratégia**: Todos são teste-direto-desempenho; variar tarefa type por domínio
- `raven` → teste-direto-desempenho + tarefa-desempenho-cognitivo (raciocínio)
- `tmt` → teste-direto-desempenho + tarefa-desempenho-motor (velocidade/motor)
- `stroop` → teste-direto-desempenho + tarefa-desempenho-executivo (se existe categoria)

**Desafio**: É "tarefa-desempenho-executivo" um task type válido, ou entra em "tarefa-desempenho-cognitivo"?
- **Decisão**: Usar "tarefa-desempenho-cognitivo" com sub-classificação em justificação (e.g., "executive function domain")

**Output**: 9 escalas, todos teste-direto-desempenho, task type detalhado em justificação

#### **Lote 3C: Autism Assessment** (7 escalas)
**Estratégia**: ADOS-2 e ADI-R são "entrevista-estruturada" + clinician; SRS/RBS são questionários
- `ados2` → observacao-clinica-estruturada + entrevista-estruturada
- `adir-interview` → entrevista-estruturada + entrevista-estruturada
- `srs2` → questionario-parental (ou autorrelato para adolescentes) + questionario-fechado

**Desafio**: ADOS-2 é observação COM entrevista. Como representar "observação estruturada + entrevista"?
- **Decisão**: Usar respondente_novo = "observacao-clinica-estruturada" e tarefa_tipo = "entrevista-estruturada" + "observacao-comportamental"

**Output**: 7 escalas com classificação multi-modal onde necessário

#### **Lote 3D: Psychiatric Interviews** (9 escalas)
**Estratégia**: Todos são entrevistas estruturadas com clinician como respondent primary
- `ksads-pl` → questionario-profissional + entrevista-estruturada
- `p-cidi` → questionario-profissional + entrevista-estruturada (computerized)
- `scared` → questionario-parental ou autorrelato + questionario-fechado (mas some versions with clinical interview)

**Desafio**: Versões variam (parental vs child vs clinician)
- **Decisão**: Classificar versão "padrão/clínica" (clinician primary); documentar alternativas em justificação

**Output**: 9 escalas, maioria questionario-profissional + entrevista-estruturada

#### **Lote 3E: Pending Review / Conditional Logic** (5-6 escalas)
**Estratégia**: Flag para revisão clínica futura; deixar unclassified ou criar categoria provisória
- Escalas cuja respondent_novo depende do caso clínico específico
- Instrumentos experimentais ou muito especializados
- Testes que requerem expertise multi-disciplinar

**Decisão por escala**: 
- (a) Classificar com "misto" respondent type (multiple options valid)
- (b) Deixar `respondente_novo: null` e adicionar flag `pending_clinical_review: true`
- (c) Criar nova categoria se aplicável (e.g., "questionario-misto-adaptativo")

**Output**: 5-6 escalas, algumas com campos especiais para decisão futura

---

## Dados a Preparar: `scaleBatch3Migration.ts`

### Estrutura do Arquivo (Similar a Batch 2)

```typescript
export const batch3Data: BatchData[] = [
  {
    id: "wisc5-ext",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "3A",
    justificacao: "WISC-5 Extended — Wechsler Intelligence Scale for Children-5...",
    alt_respondent_types: ["teste-direto-desempenho (todas as versões)"],
    alt_task_types: ["tarefa-desempenho-cognitivo (subtest-specific: verbal, perceptual, memory, processing speed)"],
    clinical_notes: "Respondent type estável (sempre teste-direto); task type varia por subtest mas todos são cognitive performance."
  },
  // ... 38 mais
];

export const batch3Statistics = {
  total_scales: 39,
  by_lote: {
    "3A": 9,
    "3B": 9,
    "3C": 7,
    "3D": 9,
    "3E": 5
  },
  by_respondent_type: { /* ... */ },
  by_task_type: { /* ... */ },
  unclassified: 0,
  pending_review: 5
};
```

### Campos Adicionais vs Batch 2

Batch 3 introduz **campos novos** para lidar com complexidade:
- `alt_respondent_types[]` — Respondent types alternativos por idade/versão/contexto
- `alt_task_types[]` — Task types alternativos por subcomponente
- `clinical_notes: string` — Notas de contexto clínico (quando respondent type ou task type não é óbvio)
- `pending_clinical_review?: boolean` — Flag para escalas que precisam revisão adicional
- `conditional_logic?: string` — Se respondent type ou task type variam por condição clínica
- `expert_consultation_needed?: string` — Campo indicando qual especialidade consultou (autism specialist, psychiatrist, neuropsychologist)

---

## Validação & Regras Absolutas

### Aplicar mesmas regras de Batch 1 + Batch 2:

✅ **Absolutes to enforce**:
1. teste-direto-desempenho ≠ pergunta-aberta (performance tests don't use open questions)
2. teste-direto-desempenho ≠ questionario-fechado (performance tests must have performance task types)
3. autorrelato ≠ teste-direto-desempenho (can't self-report someone else's test)

✅ **New checks for Batch 3**:
4. Se `entrevista-estruturada` → respondente_novo DEVE ser clinician-based (questionario-profissional, observacao-clinica-estruturada)
5. Se `tarefa-desempenho-*` → respondente_novo DEVE ser teste-direto-desempenho
6. Se respondent type = "misto" → tarefas_tipo DEVE estar documentado com condições (e.g., "autorrelato para adolescentes, parental para crianças < 8 anos")

### Validation Script

```typescript
export function validateBatch3Absolutesv2(scales: BatchData[]): ValidationResult {
  const violations = [];
  
  scales.forEach(scale => {
    // Check 1-3 (inherited from Batch 1/2)
    if (scale.tarefa_tipo === "pergunta-aberta" && scale.respondente_novo === "teste-direto-desempenho") {
      violations.push(`${scale.id}: invalid combination (test + open questions)`);
    }
    
    // Check 4: entrevista-estruturada requires clinician respondent
    if (scale.tarefa_tipo === "entrevista-estruturada") {
      if (!["questionario-profissional", "observacao-clinica-estruturada"].includes(scale.respondente_novo)) {
        violations.push(`${scale.id}: entrevista-estruturada requires clinical respondent, got ${scale.respondente_novo}`);
      }
    }
    
    // Check 5: tarefa-desempenho-* requires teste-direto
    if (scale.tarefa_tipo?.startsWith("tarefa-desempenho")) {
      if (scale.respondente_novo !== "teste-direto-desempenho") {
        violations.push(`${scale.id}: performance task requires teste-direto, got ${scale.respondente_novo}`);
      }
    }
    
    // Check 6: misto respondent requires documentation
    if (scale.respondente_novo === "misto") {
      if (!scale.clinical_notes?.includes("condicional") && !scale.conditional_logic) {
        violations.push(`${scale.id}: 'misto' respondent type must document conditions`);
      }
    }
  });
  
  return { passed: violations.length === 0, violations };
}
```

---

## Implementation Timeline

### Phase 2 Batch 3 — 3 sessões de ~90 min cada

#### **Sessão 1: Lotes 3A + 3B** (90 min)
- 20 min: Análise de specs (Bayley, WISC, Leiter, etc.)
- 30 min: Classificar Lote 3A (9 escalas — baterias adaptáveis)
- 30 min: Classificar Lote 3B (9 escalas — testes cognitivos)
- 10 min: Validação initial

**Output**: 18 escalas em scaleBatch3Migration.ts

#### **Sessão 2: Lotes 3C + 3D** (90 min)
- 20 min: Review de autism/psychiatric interview specs
- 30 min: Classificar Lote 3C (7 escalas — autism)
- 30 min: Classificar Lote 3D (9 escalas — psychiatric)
- 10 min: Validação e cross-check com Batch 3A/B

**Output**: 16 escalas adicionais; total 34/39

#### **Sessão 3: Lote 3E + Integração** (90 min)
- 30 min: Análise profunda de escalas "pending" (Lote 3E)
- 20 min: Classificar ou flag para review futuro (5-6 escalas)
- 20 min: Integrar scaleBatch3Migration.ts em scaleFilter.ts
- 10 min: Type check + validação completa
- 10 min: Commits e push

**Output**: Todos os 39 escalas; 121 + 39 = 160 escalas no sistema

---

## Files to Modify

1. **`client/src/data/scaleBatch3Migration.ts`** [NEW — ~800-1000 lines]
   - 39 escalas com classificações detalhadas
   - alt_respondent_types, alt_task_types, clinical_notes
   - Estatísticas pré-computadas

2. **`client/src/data/scaleFilter.ts`** [MODIFIED — integração de 39 escalas]
   - Python script (similar a Batch 2) para inserir respondente_novo + tarefa_tipo

3. **`client/src/types/scaleClassification.ts`** [MODIFIED se necessário]
   - Adicionar novos task types se necessário (e.g., "tarefa-desempenho-executivo" → decidir)
   - Atualizar validação com checks 4-6

4. **`FASE2_BATCH3_STATUS.md`** [NEW — status final]
   - Similar a FASE2_BATCH2_STATUS.md
   - Composition, distribution, validation results

---

## Known Challenges & Decisions Needed

### 1. **Tarefa-Desempenho Subtypes**
**Questão**: Diferenciar "cognitive", "motor", "executive", "speed"?
**Opção A**: Manter genérico "tarefa-desempenho-cognitivo", documentar subtype em justificação
**Opção B**: Criar tipos novos: tarefa-desempenho-executivo, tarefa-desempenho-speed
**Recomendação**: **Opção A** (menos risco de regra absoluta quebrar)

### 2. **Multi-Modal Respondents**
**Questão**: Como representar escalas cuja respondent type varia (e.g., SCARED tem parental e child versions)?
**Opção A**: Classificar pelo primary/default → documento alternativas em alt_respondent_types
**Opção B**: Usar respondente_novo = "misto" → requer conditional_logic field
**Recomendação**: **Opção A** para consistência com Batch 2

### 3. **Unclassified Scales**
**Questão**: Deixar algumas escalas "unclassified" pendendo revisão clínica especializada?
**Opção A**: Classificar de forma provisória; flag com pending_clinical_review
**Opção B**: Deixar respondente_novo e tarefa_tipo = null
**Recomendação**: **Opção A** (provisória com flag é mais útil que null)

---

## Success Criteria

✅ **Before Merging to Main**:
1. Todos os 39 escalas em scaleBatch3Migration.ts com respondente_novo + tarefa_tipo preenchidos
2. Type check: 0 erros
3. Validação: 100% de conformidade com regras absolutas
4. 3 commits limpos:
   - Commit 1: scaleBatch3Migration.ts
   - Commit 2: scaleFilter.ts (integração de 39 escalas)
   - Commit 3: scaleClassification.ts (updated validations)
5. Teste clínico passa: `npm run test:clinical` ✅
6. Build passa: `npm run build` ✅
7. E2E com Batch 3 scales: verificar que app carrega e filtra corretamente
8. Total de 160 escalas no sistema (48 + 73 + 39)

---

## Branch & PR Strategy

**Branch**: `claude/batch3-difficult-scales-XXXXXXX` (suffix = date/commit hash)
**PR**: Draft + labels "phase2-batch3", "classification", "scaling"
**Target Base**: main (após Batch 2 merge)

**PR Template Sections**:
- Resumo: Batch 3 classification de 39 scales "difficult"
- Tipo: Escala/questionário + Migração de legado
- Checklist: Validação de regras absolutas, E2E com 160 scales
- Métricas: Distribution por respondent/task type, vs Batch 1/2
- Riscos: 5-6 escalas pending review; documentadas com expert_consultation_needed
- Testes: clinical test suite, type check, build

---

## Próximas Ações

### Imediatamente (Antes de Batch 3):
- [ ] **Aguardar** aprovação de PR #710 (reflows optimization)
- [ ] **Validar** trace measurements em staging
- [ ] **Confirmar** que Batch 2 E2E tests passam
- [ ] **Merge** Batch 2 para main

### Então (Iniciar Batch 3):
- [ ] **Criar** nova branch `claude/batch3-difficult-scales-XXXXXXX`
- [ ] **Analisar** 39 escalas "difficult" e agrupar em 5 lotes
- [ ] **Implementar** scaleBatch3Migration.ts
- [ ] **Integrar** em scaleFilter.ts
- [ ] **Validar** com teste clínico e type check
- [ ] **Committen** e push para branch
- [ ] **Criar** PR draft
- [ ] **Aguardar** review

---

## Documentação de Referência

**Já disponível**:
- `FASE2_BATCH2_STATUS.md` — Estrutura similar, 73 escalas médias
- `OTIMIZACAO_REFLOWS_PLANO_ACAO.md` — Padrão de commits e PR description
- `scaleFilter.ts` — Estrutura de dados, padrão de migração

**Será criado**:
- `FASE2_BATCH3_STATUS.md` — Status final, composição de 39 escalas
- `scaleBatch3Migration.ts` — Dados brutos de classificação

---

## Tempo Estimado

- **Análise de specs**: 1.5-2 horas
- **Classificação (5 lotes)**: 2-2.5 horas
- **Integração + validação**: 1 hora
- **Commits + PR + documentação**: 0.5 hora
- **Total**: 5-6 horas (spread across 3 sessões de 90 min = 4.5 horas; ou 2-3 sessões compactas)

---

## Status & Next Step

🟠 **Aguardando**:
1. ✅ Otimizações de performance (reflows) — COMPLETO
2. ⏳ Batch 2 code review e merge
3. ⏳ Batch 2 E2E validation
4. 🔴 **Batch 3 start** ← PRÓXIMO quando Batch 2 estabilizar

---

**Responsável**: Claude + Equipe  
**Crítico para**: Phase 3 (respondent/task filtering em produção)  
**Deadline**: Sep 5, 2026 (estimated 1 semana após Batch 2 merge)

