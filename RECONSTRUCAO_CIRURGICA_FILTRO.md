# 🔬 RECONSTRUÇÃO CIRÚRGICA DO FILTRO DE ESCALAS — NEUROPED

**Objetivo:** Transformar o filtro de um sistema permissivo e confuso em um sistema clínico inteligente, contra-restritivo, seguro e operacional.

**Data Início:** 2026-06-10  
**Status:** FASE 0 - Mapeamento Completo

---

## 📊 MAPEAMENTO DO BANCO DE ESCALAS

### Arquivos Principais Identificados

```
CATALOGS:
├─ /client/src/data/scaleFilter.ts (764 linhas)
│  └─ 38 escalas principais (autorais + importadas)
│
├─ /client/src/data/filterableCatalog.ts (148 linhas)
│  └─ Escalas suplementares filtrá veis
│
├─ /client/src/data/escalasAutorais.ts (3259 linhas)
│  └─ Escalas desenvolvidas/customizadas
│
├─ /client/src/data/escalasImportadasV25Ebook.ts (1743 linhas)
│  └─ Escalas importadas de ebook v25
│
├─ /client/src/data/noCostWorldScales.ts
│  └─ 12 escalas mundiais sem custo (após dedup)
│
└─ /client/public/data/neuroped_escalas_neuropsiquiatria_infantil_100.json
   └─ Dados estruturados (100 escalas)

TIPOS:
├─ ScaleEntry interface
├─ Respondente type ("pais" | "clinico" | "professor" | "autoaplicavel")
├─ Prioridade type ("triagem" | "diagnostica" | "monitorizacao")
└─ Licenca type ("passiva" | "ativa" | "mista")

PAGES (Rotas de Aplicação):
├─ /client/src/pages/mchat.tsx (M-CHAT)
├─ /client/src/pages/denver.tsx (Denver II)
├─ /client/src/pages/gad7.tsx (GAD-7)
├─ [36+ outras páginas de escala]
└─ /client/src/pages/filtro.tsx (FILTER CENTRAL)

TOTAL ESTIMADO: 414+ escalas/instrumentos
```

---

## 🔍 ANÁLISE INICIAL DO PROBLEMA

### Confusões Atuais Identificadas

1. **Teste direto vs. Pergunta sobre a criança**
   - Atual: M-CHAT listada como "teste direto" mas é checklist parental
   - Erro: Confunde respondente com tipo de instrumento
   - Impacto: Secretaria tenta fazer M-CHAT perguntando para criança

2. **"Respondente: criança" sem especificação**
   - Atual: Campo `respondente: ["autoaplicavel"]` genérico
   - Erro: Não diferencia entre questionário para criança vs. teste direto
   - Impacto: Filtro oferece autorrelato para criança de 4 anos

3. **Falta de blocking rules**
   - Atual: Filtro apenas recomenda, nunca bloqueia
   - Erro: Oferece escala escolar sem escola disponível
   - Impacto: Clínico seleciona escala inaplicável

4. **Metadados incompletos**
   - Atual: Campos opcionais demais
   - Erro: Escalas sem domínio clínico, faixa etária vaga, respondente ambíguo
   - Impacto: Filtro não consegue descartar

5. **"appRoute" confundido com "teste direto"**
   - Atual: Ter página de aplicação = ser teste direto
   - Erro: M-CHAT tem página mas NÃO é teste direto
   - Impacto: Sistema oferece M-CHAT para criança responder

---

## 📋 PLANO DE RECONSTRUÇÃO (9 FASES)

### FASE 1: Auditoria Qualitativa de Cada Escala
- Ler cada escala nos arquivos
- Classificar em categoria-mãe real
- Identificar confusões conceituais
- Documentar tipo real de instrumento

**Saída:** `audit-phase1-escala-por-escala.md`

### FASE 2: Criar Metadados Clínicos Obrigatórios
- Estender `ScaleEntry` interface
- Adicionar campos de metadata clínica
- Preencher para todas as escalas
- Validar completude

**Saída:** Interface `ScaleEntryWithClinicalMetadata.ts`

### FASE 3: Reclassificar Respondentes
- Separar respondente de modo de aplicação
- Diferenciar: pais, escola, professor, profissional, autorrelato, teste direto, observação
- Remover ambiguidade

**Saída:** Type refinado `RespondentType` e `AdministrationMode`

### FASE 4: Criar Blocking Rules
- Implementar 13 regras de bloqueio obrigatório
- Adicionar explanação para cada bloqueio
- Testar regras

**Saída:** `blockingRules.ts`

### FASE 5: Classificar Testes Diretos
- Identificar VERDADEIROS testes diretos
- Reescrever como tarefas objetivas (não perguntas)
- Criar subcategorias (cognição, linguagem, leitura, etc)

**Saída:** `directTestsRegistry.ts`

### FASE 6: Reconstruir Filtro (contra-restritivo)
- Coletar entradas clínicas mínimas
- Implementar bloqueios
- Retornar 4 grupos (recomendado, secundário, pendente, bloqueado)
- Explicar bloqueios

**Saída:** `filterPipelineWithBlocking.ts`

### FASE 7: Auditoria Automática
- Criar script `npm run audit:scales:clinical`
- Validar completude de metadados
- Detectar erros conceituais
- Impedir regressões

**Saída:** `scripts/audit-clinical-scales.js`

### FASE 8: Relatório Final
- Documentar todas as mudanças
- Listar escalas reclassificadas
- Listar escalas bloqueadas
- Documentar decisões

**Saída:** `docs/auditoria-qualitativa-escalas.md`

### FASE 9: Validação Final
- Executar todos os comandos
- Testar filtro com casos reais
- Confirmar bloqueios funcionando

**Saída:** Build limpo, testes passando

---

## 🎯 CRITÉRIOS DE SUCESSO

- [ ] Todas as 414+ escalas auditadas uma a uma
- [ ] Todas com metadados clínicos obrigatórios completos
- [ ] Filtro bloqueia escalas inadequadas
- [ ] Filtro explica bloqueios ao usuário
- [ ] 7 categorias de respondente bem diferenciadas
- [ ] Nenhuma pergunta subjetiva como "teste direto"
- [ ] Todo "teste direto" é tarefa objetiva
- [ ] Auditoria automática implementada
- [ ] Relatório final documentado
- [ ] Build sem erros
- [ ] Testes passando

---

## 📂 ESTRUTURA DE ARQUIVOS A CRIAR/ALTERAR

```
NOVOS ARQUIVOS:
├─ client/src/types/ClinicalScaleMetadata.ts
├─ client/src/data/blockingRules.ts
├─ client/src/data/directTestsRegistry.ts
├─ client/src/lib/filterPipelineWithBlocking.ts
├─ client/src/lib/clinicalValidator.ts
├─ scripts/audit-clinical-scales.js
├─ docs/auditoria-qualitativa-escalas.md
└─ audit-reports/phase1-escala-por-escala.md

ALTERAÇÕES MAIORES:
├─ client/src/data/scaleFilter.ts (estender interface)
├─ client/src/data/filterableCatalog.ts (reclassificar)
├─ client/src/data/escalasAutorais.ts (validar metadata)
├─ client/src/data/escalasImportadasV25Ebook.ts (validar metadata)
├─ client/src/data/noCostWorldScales.ts (validar metadata)
├─ client/src/pages/filtro.tsx (implementar bloqueios + UI)
└─ client/src/data/scaleReferences.ts (atualizar scoring)

PACKAGE.JSON:
└─ Adicionar script: "audit:scales:clinical": "node scripts/audit-clinical-scales.js"
```

---

## 📌 PRÓXIMOS PASSOS

1. **Imediatamente:** Começar FASE 1 (auditoria qualitativa)
2. **Método:** Ler cada escala em scaleFilter.ts, classificar, documentar
3. **Saída:** Arquivo detalhado com análise 1:1

---

**Status:** ✅ Plano aprovado, pronto para FASE 1
**Responsável:** Análise qualitativa + reconstrução cirúrgica
**Prazo estimado:** 4-6 horas (análise + implementação)

