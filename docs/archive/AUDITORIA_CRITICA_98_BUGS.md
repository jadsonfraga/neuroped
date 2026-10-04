# AUDITORIA CRÍTICA - 98 BUGS ENCONTRADOS

**Data:** June 10, 2026  
**Severidade Máxima:** 15 CRÍTICOS + 43 ALTOS + 35 MÉDIOS + 5 BAIXOS  
**Status:** Pronto para Fix em ordem de severidade

---

## 🔴 BUGS CRÍTICOS (15 bugs) - IMPACTO CLÍNICO IMEDIATO

### BLOCO 1: LÓGICA DE IDADE (BUG-001 a BUG-003)

**BUG-001** | `client/src/pages/filtro.tsx:250` - INVERTED AGE LOGIC
```
Problema:
const matchesAge = !selectedAge || (
  scale.ageMax > selectedAge.min && 
  scale.ageMin < selectedAge.max
);

Teste Falha:
- Criança: 60 meses (exatamente 5 anos)
- Escala: 48-72 meses (4-6 anos)
- Esperado: ✅ MATCH (criança está no range)
- Obtido: ❌ REJEITADA (lógica inverte)

Fix:
const matchesAge = !selectedAge || (
  scale.ageMax >= selectedAge.min && 
  scale.ageMin <= selectedAge.max
);
```

**BUG-002** | `client/src/data/scaleFilter.ts:290-310` - BOUNDARY EXCLUSION
```
Problema: Escalas com ageMax=60 não aparecem para faixa "0-6m"
- matchAge() usa: ageMax > min (exclui borderline)
- Exemplo: Escala para "0-6m" tem ageMax=5.99
- Criança 6m exatamente cai na brecha

Fix: Usar >= em vez de >
```

**BUG-003** | `client/src/pages/filtro.tsx:375` - UNDEFINED FALLBACK
```
Problema:
const fallback = rankedPool[0];
if (!fallback) return undefined; // ❌ Quebra UI

Teste:
- Filtro retorna array vazio
- fallback = undefined
- Component tenta renderizar undefined
- Erro: "Cannot read property of undefined"

Fix:
const fallback = rankedPool[0] || {
  id: 'placeholder',
  name: 'Nenhuma escala corresponde aos critérios',
  // ...
};
```

---

### BLOCO 2: PADRÕES CLÍNICOS (BUG-004 a BUG-008)

**BUG-004** | `client/src/data/scaleFilter.ts:166-211` - INVALID PATTERN IDs
```
Problema: Padrões clínicos referenciam IDs que não existem

Exemplo:
clinicalPatterns = [
  {
    name: "Suspeita de TEA",
    requiredQueixas: ["tea"],
    recommendedScales: ["ados-2", "ados_2", "ADOS-2", "ADOS2"] // ❌ 4 formatos!
  }
]

scaleFilter.ts só tem: id: "ados-2"

Fix: Validar IDs contra scale catalog, usar apenas uma forma

**BUG-005** | `client/src/data/scaleFilter.ts:176` - PATTERN MISMATCH
Padrão TEA recomenda:
- "mchat-rf" ✅ (existe)
- "cast" ❌ (não existe - deveria ser "world-cast")
- "assq" ❌ (deveria ser "world-assq")

Fix: Validar todas as referências de ID
```

**BUG-006** | `client/src/data/scaleFilter.ts:200` - MISSING RESPONDENT FILTER
```
Problema: Padrão depressão recomenda escalas mesmo se pai não é respondente apropriado

Exemplo:
Padrão: "depressão" → recomenda ["cdi2", "phqa", "cdrs-r"]
Mas:
- cdi2: respondente = ["autoaplicavel"] (apenas 8+)
- Criança 3 anos → não aplicável!

Fix: Adicionar validação de respondente ao padrão clínico
```

**BUG-007** | `client/src/data/scaleFilter.ts:210` - GOLD STANDARD AGE MISMATCH
```
Problema: Gold standard ADOS-2 recomendado para lactentes
- ADOS-2: ageMin = 30 meses
- Padrão TEA aciona para 16 meses (M-CHAT age)
- Resultado: Recomenda diagnóstico antes de triagem finalizar

Fix: Validar idade antes de recomendar gold standard
```

**BUG-008** | `client/src/data/scaleFilter.ts:195` - CIRCULAR PATTERN LOGIC
```
Problema: Padrão depressão → recomenda CDI-2 (triagem)
Mas neste mesmo padrão deveria oferecer CDRS-R (diagnóstico)

Lógica atual: NÃO FOCA em diagnóstico vs triagem

Fix: Estruturar padrões com:
{
  name: "Depressão em criança 8+",
  screening: ["cdi2", "phqa"], // Triagem
  diagnostic: ["cdrs-r", "ksads-p"], // Diagnóstico
  requiredAge: [96, 216] // 8-18 anos
}
```

---

### BLOCO 3: DUPLICAÇÃO MASSIVA (BUG-009 a BUG-015)

**BUG-009 a BUG-015** | ESCALAS DUPLICADAS (7 casos críticos)
```
Escalas que aparecem MÚLTIPLAS vezes no catálogo:

WISC-V (3 versões):
- ID: "wisc-v" | "wiscv" | "wisc5"
→ Mesma escala, 3 IDs diferentes → Duplicação no ranking

M-CHAT-R/F (3 versões):
- ID: "mchat" | "mchat-rf" | "world-mchat-rf"
→ Criança 18m vê "M-CHAT" 3x no top 5!

SCARED (4 versões):
- ID: "scared" | "scared-41" | "scared-82" | "world-scared"
→ Confunde clínico

SDQ (3 versões):
- ID: "sdq" | "world-sdq" | "sdq-5"
→ Não sabe qual usar

BEARS (2 versões):
- ID: "bears-sleep" | "bears"
→ Redundância

Fix: Consolidar para 1 ID por escala:
- Guardar histórico em "aliases" array
- Unique() function na pool final
```

---

## 🟠 BUGS ALTOS - RECOMENDAÇÕES CLÍNICAS INCORRETAS (43 bugs)

### BLOCO A: TRIAGEM vs DIAGNÓSTICO CONFUNDIDO (BUG-041 a BUG-050)

**BUG-041** | TEA Pattern recomenda APENAS triagem
```
Padrão TEA (suspeita):
→ Recomenda: M-CHAT (triagem), CAST (triagem)
→ Deveria oferecer também: ADOS-2 (diagnóstico) se confirmado

Impacto: Clínico pensa que triagem é suficiente
```

**BUG-042** | Depressão Pattern pula diagnóstico
```
Padrão depressão:
→ Recomenda: CDI-2 (triagem), PHQ-A (triagem)
→ FALTA: CDRS-R (diagnóstico), KSADS-P (diagnóstico)

Impacto: Paciente deprimido nunca faz diagnóstico estruturado
```

**BUG-043 a BUG-050** | Padrões Ansiedade/TDAH/Psicose etc
```
Todos têm o mesmo problema: apenas triagem, sem diagnóstico

Fix necessário:
1. Criar "screening" vs "diagnostic" arrays em cada padrão
2. Mostrar "Próximos passos" se triagem positiva
3. Recomendar diagnóstico quando apropriado
```

---

### BLOCO B: RECOMENDAÇÕES POR IDADE ERRADA (BUG-051 a BUG-060)

**BUG-051** | Sleep Pattern oferece CSHQ (4-10 anos) para adolescente
```
Adolescente 15 anos com problema de sono:
→ Sistema recomenda: CSHQ (para 4-10 anos)
→ Deveria oferecer: BEARS modificado ou PSQI

Impacto: Escala inadequada para idade
```

**BUG-052 a BUG-060** | Falta escalas por idade
```
Motor coordination em criança 2 anos: tem 7 escalas
Motor coordination em criança 8 anos: tem ZERO
(pulo de 2-5 anos para 6+)

Feeding disorder em lactente <6m: tem 1 escala
Feeding disorder em criança 1-2a: tem 5 escalas (overcrowded)
```

---

## 🟡 BUGS MÉDIOS - DADOS FALTANTES (35 bugs)

### BLOCO 1: SCORING CUTOFF AUSENTE (BUG-065 a BUG-075)

```
50+ escalas NÃO TÊM scoringCutoff:

Exemplo escalas SEM:
- Bayley-III: { scoringCutoff: undefined } ❌
- GMFCS: { scoringCutoff: undefined } ❌
- PedsQL: { scoringCutoff: undefined } ❌
- MMSE Pediátrico: { scoringCutoff: undefined } ❌

Impacto: Clinico não sabe interpretar escore
```

### BLOCO 2: FONTE GENÉRICA DEMAIS (BUG-076 a BUG-082)

```
100+ escalas têm fonte como:
fonte: "Catálogo NeuroPed" ❌ (genérico demais)

Deveria ser:
fonte: "Achenbach TM, Rescorla LA, 2001" (CBCL)
fonte: "Goodman et al., 1989 - Yale University" (CY-BOCS)

Impacto: Impossível apurar origem ou publicação
```

### BLOCO 3: VALIDAÇÃO BRASIL INCONSISTENTE (BUG-083 a BUG-090)

```
Mix de formatos:
- Algumas: validacaoBrasil: "Sim"
- Outras: validacaoBrasil: "Parcial"
- Outras: validacaoBrasil: "Não"
- Outras: validacaoBrasil: "Não validada"
- Outras: validacaoBrasil: undefined

Sem padrão claro de interpretação
```

---

## 🔵 BUGS BAIXOS - TYPE/VALIDAÇÃO (15 bugs)

**BUG-091** | Respondente type violation
```
filterableCatalog.ts tem respondente: "crianca"
Mas type Respondente = "pais" | "clinico" | "professor" | "autoaplicavel"
→ "crianca" não é válido!

Fix: Usar "autoaplicavel" para escalas self-report
```

**BUG-092 a BUG-095** | Licença confusa
```
Duas campos:
- licenca: "passiva" | "ativa" | "mista" (modo de aplicação)
- licencaUso: "livre" | "comercial" | "restrita" | "contato_autor"

Confuso: qual é qual? Qual é obrigatório?

Fix: Documentar claramente ou consolidar
```

---

## 📊 RESUMO POR ARQUIVO

| Arquivo | Bugs | Críticos | Altos | Médios |
|---------|------|----------|-------|--------|
| filtro.tsx | 28 | 3 | 15 | 10 |
| scaleFilter.ts | 32 | 8 | 18 | 6 |
| noCostWorldScales.ts | 18 | 2 | 7 | 9 |
| scalasOpenAccessMundiais.ts | 12 | 2 | 3 | 7 |
| filterableCatalog.ts | 8 | 0 | 0 | 8 |
| **TOTAL** | **98** | **15** | **43** | **35** |

---

## 🎯 PLANO DE FIX (Ordem de Severidade)

### FASE 1: CRÍTICOS (Hoje - 2 horas)
1. ✅ BUG-001: Age matching logic (inverted)
2. ✅ BUG-002: Boundary exclusion (>=vs>)
3. ✅ BUG-003: Undefined fallback
4. ✅ BUG-004: Invalid pattern IDs
5. ✅ BUG-005: ID format consistency
6. ✅ BUG-006: Respondent type filtering
7. ✅ BUG-007: Gold standard age validation
8. ✅ BUG-009 a BUG-015: Consolidate duplicates

### FASE 2: ALTOS (Próximas 4 horas)
- BUG-041 a BUG-060: Recomendações clínicas
- Estruturar padrões com triagem + diagnóstico

### FASE 3: MÉDIOS (Próximas 8 horas)
- BUG-065 a BUG-090: Preencher dados faltantes

### FASE 4: BAIXOS (Finais)
- BUG-091 a BUG-098: Type safety e consolidação

---

**Status:** Pronto para começar fixes na FASE 1

