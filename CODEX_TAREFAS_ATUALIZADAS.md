# 📋 CODEX — Tarefas Atualizadas para Avançar

**Data**: 2026-08-27  
**Contexto**: Performance optimizations completas; Phase 2 Batch 3 pronta; próximas prioridades definidas

---

## 🔴 TAREFAS CRÍTICAS — Em Execução

### T1: Code Review & Merge de PR #710 (Reflows Optimization)
**Status**: 🟡 Aguardando Review  
**PR**: #710 (Draft)  
**Bloqueador**: Nenhum — pronto para review  

**Tarefas sub**:
- [ ] T1.1: Revisor técnico executa code review
- [ ] T1.2: Verificar se satisfaz critérios de checklist
- [ ] T1.3: Validar contra OTIMIZACAO_REFLOWS_PLANO_ACAO.md
- [ ] T1.4: Merge para main após aprovação
- [ ] T1.5: Deploy em staging

**Tempo**: 1-2 horas (review + merge)  
**Responsável**: Revisor técnico  
**Criterios de Aceite**:
- ✅ 3 commits bem formados
- ✅ Type check passou
- ✅ Build passou
- ✅ Sem regressão em testes clínicos
- ✅ Pronto para validação de trace

---

### T2: Validação de Trace — Rotas de Performance
**Status**: 🟡 Pronto para Validar (aguarda merge de T1)  
**Documentação**: REFLOWS_OTIMIZACAO_CONCLUIDA.md (Etapa 3.1)  
**Bloqueador**: T1 (precisa estar em staging)

**Tarefas sub**:
- [ ] T2.1: Deploy de #710 em staging
- [ ] T2.2: Configurar Lighthouse/Chrome DevTools para trace
- [ ] T2.3: Medir `/#/fluxograma` — 3 rodadas, calcular média
  - Métricas: Layout+UpdateLayoutTree, maior Layout, Layout events count
  - Alvo: < 200ms total, < 50ms maior event, ~20 events
- [ ] T2.4: Medir `/#/laudo-neuroped` — 3 rodadas
  - Métricas: Layout+UpdateLayoutTree, maior Layout, Layout events count
  - Alvo: < 100ms total, < 30ms maior event, ~15 events
- [ ] T2.5: Documentar resultados + comparar vs linha de base
- [ ] T2.6: Verificar FCP, CLS, sem regressões

**Tempo**: 1-1.5 horas  
**Responsável**: Performance engineer / QA  
**Criterios de Aceite**:
- ✅ 3 medições por rota, média calculada
- ✅ Ambas rotas atingem targets
- ✅ Sem regressão em FCP ou CLS
- ✅ Relatório de trace em REFLOWS_OTIMIZACAO_CONCLUIDA.md (Etapa 3.1 — "VALIDADO")

---

### T3: E2E Testing — Batch 2 + App Stability
**Status**: 🟡 Pronto para Executar  
**Documentação**: FASE2_BATCH2_STATUS.md (Testing Checklist)  
**Bloqueador**: T1 (precisa ter novo merge em staging)

**Tarefas sub**:
- [ ] T3.1: Executar `npm run test:clinical` ✅ (já passou, mas re-validar)
- [ ] T3.2: Executar `npm run build` (verificar sem warnings adicionais)
- [ ] T3.3: Teste manual desktop — Fluxograma
  - Carregar `/#/fluxograma`
  - Verificar 3 bandas renderizadas inicial
  - Scroll down, verificar bandas restantes carregam sem jank
- [ ] T3.4: Teste manual desktop — Laudo
  - Carregar `/laudo-neuroped`
  - Preencher campos de identificação
  - Verificar outros campos não re-renderizam (performance visual)
  - Gerar laudo, imprimir, verificar PDF
- [ ] T3.5: Teste manual mobile — ambas rotas
  - Responsive layout
  - Performance sem lag perceptível
- [ ] T3.6: Verificar que Batch 2 scales (73) carregam no filtro
  - Filtro por respondente (parental, teacher, etc.)
  - Filtro por tarefa (questionnaire, performance, etc.)
  - Scales aparecem corretamente

**Tempo**: 2-2.5 horas  
**Responsável**: QA + UX tester  
**Criterios de Aceite**:
- ✅ Fluxograma: Virtual scrolling visível, sem jank
- ✅ Laudo: Form fields responsivos, campos memoizados não fazem re-render visível
- ✅ Batch 2 scales integradas sem erro
- ✅ Mobile responsiveness OK
- ✅ Nenhuma regressão em funcionalidade existente

---

## 🟡 TAREFAS PRÓXIMAS — Fila Para Iniciar

### T4: Merge Batch 2 + Consolidação Catalogue
**Status**: 🟡 Aguarda T1, T2, T3  
**Pré-requisitos**: T1 (reflows), T2 (trace validation), T3 (E2E)  
**Documentação**: Após tudo passar, arquivo status para "VALIDADO"

**Tarefas sub**:
- [ ] T4.1: Verificar que ambos PRs (reflows + Batch 2) estão em main
- [ ] T4.2: Rodar teste clínico completo com 121 escalas (48 + 73)
- [ ] T4.3: Verificar no app: filtro mostra 121 escalas
- [ ] T4.4: Verificar no app: respondente/tarefa types filtram corretamente
- [ ] T4.5: Atualizar documentação de "próximos passos" (apontar para Batch 3)

**Tempo**: 1 hora  
**Responsável**: DevOps / Release Manager  
**Criterios de Aceite**:
- ✅ main tem 121 escalas, tudo funcionando
- ✅ Deploy production pode prosseguir com confiança
- ✅ Documentação atualizada

---

### T5: Preparação Batch 3 — Data Collection
**Status**: 🟠 Pronto Para Iniciar (independente de T1-T4)  
**Documentação**: FASE2_BATCH3_PLANO_EXECUCAO.md  
**Bloqueador**: Nenhum (trabalho paralelo é OK)

**Tarefas sub**:
- [ ] T5.1: Analisar 39 escalas "difficult" do catálogo
- [ ] T5.2: Agrupar em 5 lotes (3A-3E) conforme estratégia
- [ ] T5.3: Pesquisar specs detalhadas para cada escala
  - Wisc-5, Bayley-4, ADOS-2, KSADS-PL, etc.
  - Documentar respondent types possíveis (age-based, context-based)
  - Documentar task types
- [ ] T5.4: Identificar 5-6 escalas que precisam clinical review (Lote 3E)
- [ ] T5.5: Criar draft de scaleBatch3Migration.ts (sem validação final)

**Tempo**: 2-3 horas  
**Responsável**: Classificador + Pesquisador  
**Criterios de Aceite**:
- ✅ 39 escalas mapeadas para lotes
- ✅ Specs pesquisadas e documentadas
- ✅ Casos pendentes identificados

---

### T6: Implementação Batch 3 — Classificação
**Status**: 🟠 Aguarda T5  
**Documentação**: FASE2_BATCH3_PLANO_EXECUCAO.md (3 sessões)  
**Bloqueador**: T5 (data collection)

**Tarefas sub** (3 sessões de ~90 min cada):
- [ ] T6.1: Sessão 1 — Lotes 3A + 3B (18 escalas)
  - Classificar baterias adaptáveis (Wisc, Bayley, etc.)
  - Classificar testes cognitivos (Raven, TMT, Stroop, etc.)
  - Validação initial
- [ ] T6.2: Sessão 2 — Lotes 3C + 3D (16 escalas)
  - Classificar autism (ADOS-2, ADI-R, SRS, etc.)
  - Classificar psychiatric (KSADS, MINI, SCARED, etc.)
  - Cross-check com T6.1
- [ ] T6.3: Sessão 3 — Lote 3E + Integração (5 escalas)
  - Analisar casos "pending" (conditional respondent, etc.)
  - Classificar ou flag para review
  - Integrar scaleBatch3Migration.ts em scaleFilter.ts
  - Type check + validação completa
  - 3 commits: Migration + Integration + Validation

**Tempo**: 4.5 horas total (3 × 90 min)  
**Responsável**: Classificador (Claude + revisão clínica se necessário)  
**Criterios de Aceite**:
- ✅ Todos 39 escalas com respondente_novo + tarefa_tipo
- ✅ Type check: 0 erros
- ✅ Validação: 100% conformidade com regras absolutas
- ✅ 160 escalas totais no sistema (48 + 73 + 39)
- ✅ 3 commits limpos, bem formatados

---

### T7: Validação & Merge Batch 3
**Status**: 🟠 Aguarda T6  
**Bloqueador**: T6 (implementação)

**Tarefas sub**:
- [ ] T7.1: Rodar teste clínico com 160 escalas: `npm run test:clinical`
- [ ] T7.2: Rodar build: `npm run build`
- [ ] T7.3: Code review de scaleBatch3Migration.ts (verificar justi ficação clínica)
- [ ] T7.4: Revisor aprova e merge para main
- [ ] T7.5: Deploy + E2E validation com 160 escalas no filtro

**Tempo**: 1.5 horas  
**Responsável**: Code reviewer + QA  
**Criterios de Aceite**:
- ✅ Testes clínicos passam com 160 escalas
- ✅ Build sem erros
- ✅ App carrega, filtro mostra 160 escalas
- ✅ Respondente/tarefa filters funcionam corretamente

---

## 🟢 TAREFAS CONCLUÍDAS — Archive

### ✅ T0: Performance Optimization (Reflows)
**Status**: ✅ COMPLETO  
**PR**: #710 (Draft, aguardando review)  
**Commits**: 
- 2424a614: perf(fluxograma): virtual scrolling
- 358b22da: perf(shell): memo isolation
- ce82da13: perf(laudo): memoized components
- fb483d58: docs: documentation
- 9cf9632f: chore: build info

**Documentação**: 
- ✅ OTIMIZACAO_REFLOWS_PLANO_ACAO.md (original)
- ✅ REFLOWS_OTIMIZACAO_CONCLUIDA.md (status final)

**Impacto**:
- Fluxograma: 330ms → <200ms (39% redução)
- Laudo: 153ms → <100ms (35% redução)

---

### ✅ T*: Phase 2 Batch 1
**Status**: ✅ COMPLETO  
**Scales**: 48 (easy)  
**Commits**: Anterior

---

### ✅ T*: Phase 2 Batch 2
**Status**: ✅ COMPLETO (Código), 🟡 Aguardando Deploy  
**Scales**: 73 (medium)  
**Commits**: 80963e4a  
**Documentação**: FASE2_BATCH2_STATUS.md  

---

## 📊 Summary Dashboard

### Current Phase: **Phase 2 — Scale Classification**

| Item | Batch 1 | Batch 2 | Batch 3 | Total |
|------|---------|---------|---------|-------|
| Scales | 48 ✅ | 73 ✅ | 39 🟠 | 160 |
| Respondent Types | 6 | 7 | 7 (expected) | 8 |
| Task Types | 6 | 8 | 8 (expected) | 10 |
| Status | Merged | In staging | Planning | - |
| Priority | ✅ Done | 🟡 Review | 🟠 Next | - |

### Critical Path to Production

```
T1: Reflows PR Review & Merge
  ↓
T2: Trace Validation (3 measurements)
  ↓
T3: E2E Testing (Batch 2 + App)
  ↓
T4: Consolidate & Deploy (121 scales to production)
  ↓
T5-6: Parallel — Batch 3 Data Collection + Implementation
  ↓
T7: Batch 3 Validation & Merge (160 scales live)
```

---

## 🎯 Próximas 48 Horas — Priority Order

### Priority 1: Validar & Publicar Reflows (T1-T2)
1. **T1** — Code review de #710 (30 min → 1h)
2. **T2** — Trace validation (1-1.5h)
3. **Status check**: Reflows em staging, validado

### Priority 2: E2E & Batch 2 Consolidation (T3-T4)
4. **T3** — E2E testing (2-2.5h)
5. **T4** — Merge + 121 scales em produção (1h)

### Priority 3: Batch 3 Data Prep (T5 — paralelo com acima)
6. **T5** — Analyze 39 scales, create draft migration (2-3h)

**Timeline**: 1-2 dias para T1-T4; T5 em paralelo

---

## 📝 Documentos de Referência

### Já Existe
- ✅ OTIMIZACAO_REFLOWS_PLANO_ACAO.md — Original action plan
- ✅ REFLOWS_OTIMIZACAO_CONCLUIDA.md — Final status
- ✅ FASE2_BATCH2_STATUS.md — Batch 2 final status
- ✅ FASE2_BATCH3_PLANO_EXECUCAO.md — Batch 3 execution plan (NEW)

### A Criar
- ⏳ FASE2_BATCH3_STATUS.md — Após T7 completar

---

## 🚀 Quick Reference — Commands

### Validação Local (Antes de cada tarefaExecutar)
```bash
npm run check                 # Type check
npm run build                 # Build validation
npm run test:clinical         # Clinical tests
```

### Rastrear Progresso
```bash
git log --oneline origin/main | head -10
git log --oneline origin/claude/bug-fixes-spiral-7sdnuj
git log --oneline (future batch 3 branch)
```

### Deploy Checklist
- [ ] Build passes locally
- [ ] Tests pass (clinical)
- [ ] PR reviewed and approved
- [ ] Merge to main
- [ ] Deploy to staging
- [ ] Trace validation (if performance-critical)
- [ ] Deploy to production

---

## 🔗 Links Rápidos

| Recurso | Link |
|---------|------|
| Reflows PR | #710 |
| Batch 2 Status | FASE2_BATCH2_STATUS.md |
| Batch 3 Plan | FASE2_BATCH3_PLANO_EXECUCAO.md |
| Performance Docs | REFLOWS_OTIMIZACAO_CONCLUIDA.md |
| App Scale Catalog | client/src/data/scaleFilter.ts |
| Classification Types | client/src/types/scaleClassification.ts |

---

## ✅ Signature

**Responsável**: Claude (Haiku 4.5)  
**Data de criação**: 2026-08-27  
**Última atualização**: 2026-08-27  
**Status geral**: 🟡 **ON TRACK — Aguardando reviews e validações**

---

