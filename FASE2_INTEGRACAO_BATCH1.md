# Phase 2 Batch 1 — Integration Guide

**Status**: Ready for implementation  
**Last Updated**: 2026-08-27  
**Total Scales in Batch 1**: 49  
**Estimated Timeline**: ~2 hours (automated merge + validation)

---

## Overview

Batch 1 contains the 49 "easiest" scales to classify — those with clear, unambiguous respondent types and task characteristics. These scales have been pre-classified with:

- **respondente_novo**: New 7-category respondent system (replaces ambiguous 4-category)
- **tarefa_tipo**: New 10-type task classification system
- **Validation**: All entries pass absolute rule checks (no test-direct-with-open-response violations)

---

## Batch 1 Composition

### Lote 1A: Parental Questionnaires (10 scales)
Closed-ended questionnaires completed by parents/guardians.

| Scale ID | Name | Old Respondent | New Classification | Task Type |
|----------|------|---|---|---|
| mchat | M-CHAT-R/F | pais | questionario-parental | questionario-fechado |
| sdq | SDQ | pais | questionario-parental | questionario-fechado |
| asq3 | ASQ-3 | pais | questionario-parental | questionario-fechado |
| psq | PSQ | pais | questionario-parental | questionario-fechado |
| ecbi | ECBI | pais | questionario-parental | questionario-fechado |
| psc17 | PSC-17 | pais | questionario-parental | questionario-fechado |
| bears | BEARS | pais | questionario-parental | questionario-fechado |
| cshq | CSHQ | pais | questionario-parental | questionario-fechado |
| cbcl | CBCL | pais | questionario-parental | questionario-fechado |
| psi | PSI-4 | pais | questionario-parental | questionario-fechado |

### Lote 1B: School Questionnaires (5 scales)
Closed-ended questionnaires completed by teachers/school observers.

| Scale ID | Name | Old Respondent | New Classification | Task Type |
|----------|------|---|---|---|
| conners | Conners | professor | questionario-escolar | questionario-fechado |
| snap | SNAP-IV | professor | questionario-escolar | questionario-fechado |
| brief2 | BRIEF-2 | professor | questionario-escolar | questionario-fechado |
| srs2 | SRS-2 | professor | questionario-escolar | questionario-fechado |
| abc | ABC | professor | questionario-escolar | questionario-fechado |

### Lote 1C: Self-Report Questionnaires (10 scales)
Closed-ended questionnaires completed by children/adolescents about themselves.

| Scale ID | Name | Old Respondent | New Classification | Task Type |
|----------|------|---|---|---|
| scared | SCARED | autoaplicavel | autorrelato | questionario-fechado |
| gad7ped | GAD-7 Ped | autoaplicavel | autorrelato | questionario-fechado |
| mfq | MFQ | autoaplicavel | autorrelato | questionario-fechado |
| cdi2 | CDI-2 | autoaplicavel | autorrelato | questionario-fechado |
| rads2 | RADS-2 | autoaplicavel | autorrelato | questionario-fechado |
| phqa | PHQ-9 Ped | autoaplicavel | autorrelato | questionario-fechado |
| rcads | RCADS | autoaplicavel | autorrelato | questionario-fechado |
| scas | SCAS | autoaplicavel | autorrelato | questionario-fechado |
| staic | STAIC | autoaplicavel | autorrelato | questionario-fechado |
| crafft | CRAFFT | autoaplicavel | autorrelato | questionario-fechado |

### Lote 1D: Direct Performance Tests (15 scales)
Standardized tests administered by clinicians, observing performance/behavior.

| Scale ID | Name | Old Respondent | Task Type |
|----------|------|---|---|
| denver | Denver II | teste_direto_crianca | tarefa-desempenho-motor |
| ados2 | ADOS-2 | clinico | observacao-comportamental |
| bayley | Bayley-III | teste_direto_crianca | tarefa-desempenho-motor |
| griffiths | Griffiths | teste_direto_crianca | tarefa-desempenho-motor |
| wppsi | WPPSI-IV | teste_direto_crianca | tarefa-desempenho-cognitivo |
| wisc5 | WISC-5 | teste_direto_crianca | tarefa-desempenho-cognitivo |
| leiter3 | Leiter-3 | teste_direto_crianca | tarefa-desempenho-cognitivo |
| raven | Raven's | teste_direto_crianca | tarefa-desempenho-cognitivo |
| kabc2 | KABC-II | teste_direto_crianca | tarefa-desempenho-cognitivo |
| wcst | WCST | teste_direto_crianca | tarefa-desempenho-cognitivo |
| tmt | TMT | teste_direto_crianca | tarefa-desempenho-cognitivo |
| stroop | Stroop | teste_direto_crianca | tarefa-desempenho-cognitivo |
| cpt3 | CPT-3 | teste_direto_crianca | paradigma-instrumental |
| sb5 | SB5 | teste_direto_crianca | tarefa-desempenho-cognitivo |
| d2 | d2 Test | teste_direto_crianca | tarefa-desempenho-cognitivo |

**Note**: All map to `teste-direto-desempenho` (new system) despite varying old respondent types.

### Lote 1E: Structured Observation Scales (9 scales)
Clinician-performed observations with standardized scoring.

| Scale ID | Name | Task Type |
|----------|------|---|
| flacc | FLACC | escala-registro |
| gma | GMA | observacao-comportamental |
| hine | HINE | observacao-comportamental |
| gmfcs | GMFCS | escala-registro |
| macs | MACS | escala-registro |
| cfcs | CFCS | escala-registro |
| edacs | EDACS | escala-registro |
| wongbaker | Wong-Baker FACES | escala-registro |
| psq_obs | PSQ (Obs) | escala-registro |

**Note**: All map to `observacao-clinica-estruturada` (new system).

---

## Integration Instructions

### Step 1: Locate Scales in scaleFilter.ts

Open `/home/user/neuroped/client/src/data/scaleFilter.ts` and find each Batch 1 scale.

Example: M-CHAT-R/F is at line 211.

### Step 2: Add New Fields

For each scale, add two new fields in the object literal:

```typescript
// BEFORE (current state)
{
  id: "mchat",
  name: "M-CHAT-R/F",
  ...,
  respondente: ["pais"],
  ...
}

// AFTER (with Phase 2 fields)
{
  id: "mchat",
  name: "M-CHAT-R/F",
  ...,
  respondente: ["pais"],
  respondente_novo: "questionario-parental",
  tarefa_tipo: "questionario-fechado",
  ...
}
```

### Step 3: Batch Apply (Recommended)

**Option A: Using a text editor with find-and-replace**

1. Use sed/awk to locate each scale and insert the new fields
2. Alternatively, write a simple TypeScript transform script

**Option B: Manual merge (if using Version Control UI)**

1. Use the batch1_migration_patch.ts file as reference
2. Update scaleFilter.ts entries one by one
3. Git diff to verify changes

### Step 4: Type Safety

Ensure new fields are recognized by TypeScript:

```typescript
// In ScaleEntry interface (scaleFilter.ts, line 56+)
// Add these optional fields:
respondente_novo?: RespondentType;
tarefa_tipo?: TarefaTipo;
migration_batch?: "1a" | "1b" | "1c" | "1d" | "1e";

// Import types from scaleClassification.ts
import {
  type RespondentType,
  type TarefaTipo,
} from "@/types/scaleClassification";
```

### Step 5: Validation

Run validation script to verify all entries pass absolute rules:

```bash
# After applying Batch 1 changes
npm run validate:scales:batch1

# Expected output:
# Total Batch 1 entries: 49
# Total validated: 49
# Total passed: 49
# PASS RATE: 100%
```

### Step 6: Test

1. **Build test**: `npm run build` (TypeScript should pass)
2. **Type check**: `npm run type-check` (no errors)
3. **E2E test**: Load filtro.tsx and verify scale metadata loads correctly
4. **Functional test**: Verify filter logic still works with new classifications

### Step 7: Commit

```bash
git add client/src/data/scaleFilter.ts
git commit -m "Phase 2 Batch 1: Apply scale classifications to scaleFilter.ts

Apply respondente_novo and tarefa_tipo fields to 49 Batch 1 scales:
- Lote 1A: 10 parental questionnaires
- Lote 1B: 5 school questionnaires  
- Lote 1C: 10 self-report questionnaires
- Lote 1D: 15 direct performance tests
- Lote 1E: 9 structured observation scales

All entries validated against absolute rules (no violations).
Status: Ready for Phase 2 Batch 2 preparation."
```

---

## Validation Rules (Absolute)

These rules MUST be maintained throughout Phase 2. If a scale violates either, raise a validation error immediately.

### Rule 1: No test-direct-with-open-response
```
IF respondente_novo === "teste-direto-desempenho"
THEN tarefa_tipo ≠ "pergunta-aberta"
```

Why: Direct performance tests cannot use open-ended questions (scoring ambiguity).

### Rule 2: No self-report-with-direct-test
```
IF respondente_novo === "autorrelato"
THEN tarefa_tipo ≠ "teste-direto"
```

Why: A person cannot self-report a direct test of someone else.

**All 49 Batch 1 entries have been verified to pass both rules.**

---

## After Integration

Once Batch 1 is integrated into scaleFilter.ts:

1. **Update filter logic** in filtro.tsx to use new respondente_novo field (backward compatibility)
2. **Update recommendation engine** to leverage new tarefa_tipo metadata
3. **Prepare Batch 2** (80 scales, medium difficulty) for integration
4. **Prepare Batch 3** (39 scales, difficult classification) for integration

---

## Files Referenced

- **Source**: `/client/src/data/scaleBatch1Migration.ts` — Classification data
- **Utility**: `/client/src/data/scaleMigration.ts` — Integration functions
- **Target**: `/client/src/data/scaleFilter.ts` — Destination for integrated data
- **Types**: `/client/src/types/scaleClassification.ts` — New type system
- **Patch Guide**: Included in this session as `batch1_migration_patch.ts`

---

## Timeline

| Task | Duration | Status |
|------|----------|--------|
| Batch 1 data preparation | ✓ 30 min | **COMPLETE** |
| Batch 1 scaleFilter.ts merge | ⧗ 30 min | **IN PROGRESS** |
| Batch 1 validation tests | ⧗ 30 min | **PENDING** |
| Batch 1 total | ~1.5–2 hours | **PARTIAL** |
| Batch 2 prep & integration | ~2 days | **PENDING** |
| Batch 3 prep & integration | ~3 days | **PENDING** |
| **Phase 2 Total** | **~6–7 days** | **IN PROGRESS** |

---

## Notes for Phase 2 Batch 2 & 3

Batch 1 serves as a template for Batch 2 and 3. Once integrated:

- Verify filter logic works with new fields
- Run end-to-end tests on all use cases
- Document any edge cases or special handling needed
- Batch 2 will include scales with mixed respondent types
- Batch 3 will include complex scales requiring clinical judgment

---

## Contact / Questions

If you encounter issues during Batch 1 integration:

1. Check validation against absolute rules (no false positives expected)
2. Verify TypeScript types are imported and recognized
3. Review batch1_migration_patch.ts for reference examples
4. Consult AUDITORIA_FASE2_FRAMEWORK_IMPLEMENTACAO.md for overall roadmap
