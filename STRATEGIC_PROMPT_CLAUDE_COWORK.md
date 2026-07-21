> **NEUROPED_HISTORICAL_DEPLOY_RECORD — NÃO EXECUTAR.**
> Qualquer comando de publicação neste registro está obsoleto. Use somente
> `docs/DEPLOY_OFICIAL.md`.

# 🎯 PROMPT ESTRATÉGICO CIRÚRGICO PARA CLAUDE COWORK
## NeuroPed Escalas Audit & Deep Bug Fix - Fases 3 e 4

**Data de Início:** 2026-06-10 (Fase 2 Completa)  
**Objetivo:** Resolver autonomamente 40 bugs restantes (Fase 3: 35 médios + Fase 4: 5 baixos)  
**Branch:** `claude/audite-bd8dye` (desenvolvimento) → `main` (produção)  
**Intervalo de iteração:** 5-10 minutos entre commits

---

## 📋 CONTEXTO ESTABELECIDO

### Fase 1 & 2: ✅ COMPLETAS
- **Fase 1 (Críticos):** 3/3 bugs fixos ✓
  - BUG-001: Age matching logic (>< → >=<=)
  - BUG-003: Undefined fallback guard
  - BUG-009/010/011: Duplicate removal
  
- **Fase 2 (Altos):** 45/45 bugs fixos ✓ (9 iterações)
  - Iterations 1-3: Recomendações clínicas com triagem/diagnóstico
  - Iterations 4-7: Age coverage e padrões incompletos
  - Iterations 8-9: Respondent clarity e diagnostic pathways

**Total Fase 1-2:** 48/48 bugs ✓

---

## 🎬 FASE 3: MÉDIOS (35 BUGS) - DATA FALTANTES

**Severidade:** Média (não quebra funcionalidade, prejudica usabilidade clínica)

### Estrutura de Bugs Fase 3

#### Bloco 1: Scoring Cutoff Ausente (BUG-096 a BUG-110 - 15 bugs)
**Problema:** 50+ escalas têm `scoringCutoff: undefined`

**Escalas a corrigir:**
```
Bayley-III:        { scoringCutoff: "Índice Composite <70: atraso significativo; 70-84: atraso leve" }
GMFCS:             { scoringCutoff: "Nível I-V; I=completa mobilidade; V=totalmente dependente" }
PedsQL:            { scoringCutoff: "0-100 (100=melhor QV); <60: impacto clínico significativo" }
MMSE Pediátrico:   { scoringCutoff: "≥24: cognição normal; 20-23: leve; <20: grave" }
Griffiths-III:     { scoringCutoff: "GQ Quotient <85: atraso; <70: moderado; <55: severo" }
CAT/CLAMS:         { scoringCutoff: "Escore bruto convertido para age-equivalent (meses)" }
Vineland-3:        { scoringCutoff: "Adaptive Behavior Composite 115+: superior; 85-115: médio; <70: grave" }
ASQ-3:             { scoringCutoff: "Screening cutoff por age; acima = encaminhamento recomendado" }
Denver II:         { scoringCutoff: "Avanço normal/Risco/Inadecuado para idade" }
CBCL:              { scoringCutoff: "T-score ≥60: clínicamente significativo; ≥69: borderline" }
RCADS:             { scoringCutoff: "≥63: provável transtorno de ansiedade/depressão" }
SDQ:               { scoringCutoff: "≥17: problema de comportamento; 15-16: borderline" }
CY-BOCS:           { scoringCutoff: "0-7 subclínico; 8-15 leve; 16-25 moderado; 26+ severo" }
SCARED:            { scoringCutoff: "≥25: provável transtorno ansiedade; ≥19: triagem positiva" }
ADOS-2:            { scoringCutoff: "Scores brutos convertidos para severity (nível 1-3)" }
```

**Instrução:**
1. Ler AUDITORIA_CRITICA_98_BUGS.md seção "BUGS MÉDIOS"
2. Para cada escala, pesquisar literatura/manual oficial
3. Adicionar scoringCutoff em `client/src/data/scaleFilter.ts` e `scalasOpenAccessMundiais.ts`
4. Formato padrão: `scoringCutoff: "X-Y: descrição; Z+: interpretação"`
5. Commit a cada 3-5 escalas com título: "docs: Adicionar scoringCutoff para [escalas]"

#### Bloco 2: Fonte Genérica Demais (BUG-111 a BUG-122 - 12 bugs)
**Problema:** 100+ escalas têm `fonte: "Catálogo NeuroPed"` (genérico demais)

**Pattern:** Substitua por:
```typescript
fonte: "Achenbach TM & Rescorla LA, 2001" // CBCL
fonte: "Goodman et al., 1989 - Yale University" // CY-BOCS
fonte: "Lord C et al., 2012 - Western Psychological Services" // ADOS-2
fonte: "Bayley N, 2006 - Pearson Clinical" // Bayley-III
fonte: "Conners CK, 2008 - Multi-Health Systems" // Conners Rating Scales
```

**Instrução:**
1. Para cada escala em scaleFilter.ts:
   - Se `fonte === "Catálogo NeuroPed"` → buscar publicação original
   - Usar format: "Author(s) YEAR - Institution/Publisher"
   - Adicionar DOI se disponível em comentário
2. Commit: "docs: Atualizar fonte para escalas (BUG-111-122)"

#### Bloco 3: Validação Brasil Inconsistente (BUG-123 a BUG-135 - 13 bugs)
**Problema:** Mix de formatos (Sim, Parcial, Não, Não validada, undefined)

**Padronização:**
```typescript
// Somente 3 valores válidos:
validacaoBrasil: "Sim" | "Parcial" | "Não"

// Mudança necessária:
"Não validada" → "Não"
undefined → "Não" (assumir não validada)
"Sim - validação local" → "Sim"
"Parcial - poucos estudos" → "Parcial"
```

**Escalas com validação no Brasil:**
- M-CHAT-R/F: "Sim" ✓
- CBCL: "Sim" ✓
- CDI-2: "Sim" ✓
- SNAP-IV: "Sim" ✓
- SCARED: "Parcial"
- RCADS: "Parcial"
- TDE: "Sim" ✓
- Bayley-III: "Parcial"
- Vineland-3: "Parcial"
- Most others: "Não"

**Instrução:**
1. Arquivo: `client/src/data/scaleFilter.ts`
2. Substituir todos validacaoBrasil para padrão 3 valores
3. Validar com fonte: Satepsi/CFP registros de testes validados Brasil
4. Commit: "fix: Padronizar validacaoBrasil (3 valores apenas)"

---

## 🔵 FASE 4: BAIXOS (5 BUGS) - TYPE SAFETY

**Severidade:** Baixa (nenhum impacto clínico, manutenibilidade)

### Bugs Fase 4

**BUG-136: Respondente type violation**
```typescript
// ANTES (ERRADO):
respondente: ["crianca"] // "crianca" não existe no type

// DEPOIS (CERTO):
respondente: ["autoaplicavel"] // self-report de criança
```

**Arquivo:** `client/src/data/filterableCatalog.ts` linha ~290
**Instrução:** Procurar `respondente: "crianca"` e substituir por `"autoaplicavel"`

**BUG-137-140: Licença consolidação (4 bugs)**
```typescript
// Problema: 2 campos confusos
licenca: "passiva" | "ativa" | "mista" (modo de aplicação)
licencaUso: "livre" | "comercial" | "restrita" | "contato_autor" (uso legal)

// Solução: Remover "licenca", usar apenas "licencaUso"
// Varrer scaleFilter.ts e remover todas linhas licenca: "..."
```

---

## 🎯 PLANO DE EXECUÇÃO AUTONOMA

### Iteração Pattern (Adapte conforme necessário)

```bash
# 1. Checkout development branch
git checkout claude/audite-bd8dye
git pull origin claude/audite-bd8dye

# 2. Executar bloco de bugs (3-5 bugs por iteração)
#    - Editar client/src/data/scaleFilter.ts
#    - Editar client/src/data/scalasOpenAccessMundiais.ts
#    - Editar client/src/data/filterableCatalog.ts

# 3. Validate TypeScript compilation
npm run build 2>&1 | grep -E "error|warning"

# 4. Commit com padrão claro
git add -A
git commit -m "Fix/docs: [FASE] Iteração X - Descrição específica (BUG-XXX-XXX)"

# 5. Push
git push origin claude/audite-bd8dye

# 6. Aguardar 5-10 min → próxima iteração
```

### Fase 3 Iterações (14 iterações propostas)

| Iteração | Bugs | Foco | Estimado |
|----------|------|------|----------|
| F3-I1    | 1-5  | Bayley, GMFCS, PedsQL, MMSE, Griffiths | 10 min |
| F3-I2    | 6-10 | CAT/CLAMS, Vineland, ASQ, Denver, CBCL | 10 min |
| F3-I3    | 11-15 | RCADS, SDQ, CY-BOCS, SCARED, ADOS-2 | 10 min |
| F3-I4    | 16-20 | Fonte: Achenbach, Goodman, Lord, Bayley | 10 min |
| F3-I5    | 21-25 | Fonte: Conners, mais escalas | 10 min |
| F3-I6-I11| 26-35 | Validação Brasil (9 bugs): Sim/Parcial/Não | 60 min |
| **Total** | 35 | **Fase 3 COMPLETA** | **70 min** |

### Fase 4 Iterações (1 iteração proposta)

| Iteração | Bugs | Foco |
|----------|------|------|
| F4-I1    | 1-5  | Type safety: respondente "crianca" → "autoaplicavel"; remover "licenca" field |

---

## ✅ CHECKLIST DE VALIDAÇÃO PER ITERAÇÃO

Antes de fazer commit, validar:

- [ ] Arquivo modifica syntax valid (sem syntax errors)
- [ ] Todos campos novos/modificados seguem TypeScript interface
- [ ] `scoringCutoff` segue padrão "X-Y: desc; Z+: desc"
- [ ] `fonte` segue padrão "Author(s) YEAR - Institution"
- [ ] `validacaoBrasil` é somente "Sim", "Parcial", ou "Não"
- [ ] Nenhuma escala com `respondente: "crianca"`
- [ ] Nenhuma escala com campo `licenca` (remover se encontrar)
- [ ] Git commit message é claro e refencia BUGs específicos
- [ ] Push successful (git push origin branch-name)

---

## 📊 TRACKING E STATUS

**Antes de começar:**
```bash
# Criar arquivo de status
cat > /tmp/neuroped_status.txt <<EOF
FASE 3: Médios (35 bugs)
Status: 0/35 iniciado

FASE 4: Baixos (5 bugs)
Status: 0/5 iniciado

Total: 0/40 completado
EOF
```

**Após cada iteração:**
```bash
# Atualizar status
# Exemplo após F3-I1:
# FASE 3: Médios (35 bugs)
# Status: 5/35 completo
# FASE 4: Baixos (5 bugs)
# Status: 0/5 não iniciado
# Total: 5/40 completado
```

---

## 🚀 DEPLOYMENT FINAL

Após todas 15 iterações (F3-I1 até F4-I1):

1. **Merge para main:**
   ```bash
   git checkout main
   git pull origin main
   git merge claude/audite-bd8dye
   git push origin main
   ```

2. **Validação:**
   - [ ] Build limpo (npm run build)
   - [ ] 40/40 bugs médios e baixos resolvidos
   - [ ] Documentação DEPLOYMENT_FINAL_REPORT.md atualizada

3. **Status Final:**
   - 3 Críticos (Fase 1)
   - 45 Altos (Fase 2)
   - 35 Médios (Fase 3)
   - 5 Baixos (Fase 4)
   - **Total: 88/98 bugs fixos (90% cobertura)**

---

## 🎓 NOTAS OPERACIONAIS

1. **Autonomia total:** Claude cowork pode executar sem aprovação
2. **Velocidade:** 5-10 min por iteração (velocidade apropriada para auditoria)
3. **Fallback:** Se encontrar bug não documentado, documente em AUDITORIA_CRITICA_98_BUGS.md
4. **Escalation:** Se blocado por erro TypeScript, parar e reportar error message
5. **Testing:** Se tiver acesso a npm/build, rodar `npm run build` antes de cada commit

---

## 📞 REFERÊNCIAS

- Audit inicial: `/home/user/neuroped/AUDITORIA_CRITICA_98_BUGS.md`
- Padrões clínicos: `/home/user/neuroped/client/src/pages/filtro.tsx` linhas 171-218
- Escalas database: `/home/user/neuroped/client/src/data/scaleFilter.ts`
- Scalas mundiais: `/home/user/neuroped/client/src/data/scalasOpenAccessMundiais.ts`

---

**Prompt estratégico criado:** 2026-06-10  
**Responsável execução:** Claude Cowork (autônomo)  
**Status inicial:** Pronto para FASE 3

Boa sorte! 🚀
