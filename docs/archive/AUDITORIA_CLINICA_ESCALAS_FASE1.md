# 🔬 AUDITORIA CLÍNICA QUALITATIVA — NEUROPED ESCALAS
## FASE 1: DIAGNÓSTICO E MAPEAMENTO

**Data Início:** 2026-06-09  
**Status:** Em Progresso  
**Escopo:** 259+ escalas/instrumentos  
**Objetivo:** Reconstrução cirúrgica com foco em correção de respondentes e modo de aplicação

---

## 📊 DIAGNÓSTICO EXECUTIVO

### Problema Central Identificado
O sistema **confunde tipo de respondente com tipo de tarefa**:
- Pergunta subjetiva feita À CRIANÇA é tratada como "teste direto com criança"
- Pergunta parental sobre criança é às vezes classificada como "teste direto"
- Observação clínica é misturada com questionários
- Instrumentos escolares estão misturados sem clareza

### Estrutura Atual
```
client/src/data/scaleFilter.ts
  ├─ ScaleEntry interface (id, name, fullName, ageMin, ageMax, queixas, respondente)
  ├─ 259+ escalas listadas como array
  ├─ respondente: "pais" | "clinico" | "professor" | "autoaplicavel"
  ├─ prioridade: "triagem" | "diagnostica" | "monitorizacao"
  └─ metadata: fonte, licenca, tipo, validacao, scoring
```

### Problema de Classificação
Atual: **Apenas 4 categorias de respondente**
- pais
- clinico
- professor
- autoaplicavel

Necessário: **7 categorias distintas**
1. Questionário Parental
2. Questionário Escolar
3. Questionário Profissional
4. Autorrelato (criança/adolescente)
5. Teste Direto de Desempenho
6. Observação Clínica Estruturada
7. Instrumento Misto (múltiplas fontes)

---

## 🔍 ACHADOS PRELIMINARES

### Escalas que Provavelmente Estão Mal Classificadas

Exemplos de confusão identificada:

| Escala | Classificação Atual | Problema | Classificação Correta |
|--------|-------------------|---------|----------------------|
| SCARED | autoaplicavel | Pergunta subjetiva para criança sobre si mesma | Autorrelato (criança ≥8a) |
| M-CHAT | pais | Correto | Questionário Parental ✓ |
| ADOS-2 | clinico | Vago - é teste direto com observação | Teste Direto de Desempenho |
| CONNERS-Professor | professor | Correto | Questionário Escolar ✓ |
| Denver II | clinico | Vago - é teste direto de desenvolvimento | Teste Direto de Desempenho |
| SDQ | pais | Correto | Questionário Parental ✓ |
| Autorrelato GAD-7 | autoaplicavel | Correto (questões sobre si mesmo) | Autorrelato (adolescente) ✓ |
| Observação TEA | clinico | Vago - é observação estruturada | Observação Clínica Estruturada |
| CONNERS-Criança | autoaplicavel | Pergunta para criança sobre si mesma | Autorrelato ✓ |
| Escala Comportamento | clinico | Vago - pode ser observação ou profissional | Observação Clínica Estruturada |

---

## ✅ PRÓXIMAS AÇÕES (FASE 2 - AUDITORIA QUALITATIVA)

Para cada uma das 259 escalas, determinar:

1. **Tipo de Respondente Real:**
   - Quem realmente responde?
   - É pergunta para pais, escola, ou é observação?
   - É teste direto com criança (tarefa objetiva)?

2. **Tipo de Tarefa:**
   - É questionário fechado?
   - É pergunta aberta?
   - É tarefa de desempenho?
   - É observação durante consulta?

3. **Modo de Aplicação Correto:**
   - Quem aplica (pais, professor, clínico)?
   - Criança presente?
   - Material necessário?
   - Tempo estimado?

4. **Pré-requisitos:**
   - Idade mínima/ideal/máxima?
   - Requer linguagem oral?
   - Requer leitura?
   - Requer escrita?
   - Requer colaboração mínima?

5. **Bloqueios e Restrições:**
   - Quando NÃO usar?
   - Risco de mau uso?
   - Contraindicações?

---

## 📋 TEMPLATE DE AUDITORIA POR ESCALA

Para cada escala, responder:

```markdown
## [ESCALA] — Auditoria

### Informações Atuais
- ID: xxx
- Nome: xxx
- Respondente Atual: xxx
- Modo Atual: xxx

### Análise Qualitativa
**O que a escala realmente mede?**
[Descrição clínica]

**Quem realmente responde?**
- [ ] Pais/responsáveis?
- [ ] Professor/escola?
- [ ] Profissional (clínico, psicólogo, fono)?
- [ ] Criança (autorrelato)?
- [ ] Observação clínica?
- [ ] Teste direto com criança (tarefa objetiva)?

**É teste direto com criança?**
- [ ] SIM — descrever tarefa
- [ ] NÃO — descrever que é pergunta

**Pré-requisitos:**
- Idade mínima: [X] meses
- Requer leitura: [ ] Sim
- Requer escrita: [ ] Sim
- Requer linguagem oral: [ ] Sim
- Requer alfabetização: [ ] Sim

### Classificação Correta
**Categoria-mãe recomendada:**
- [ ] Questionário Parental
- [ ] Questionário Escolar
- [ ] Questionário Profissional
- [ ] Autorrelato
- [ ] Teste Direto de Desempenho
- [ ] Observação Clínica Estruturada
- [ ] Misto

**Motivo da reclassificação:**
[Justificativa clínica]

### Regras de Bloqueio
- Bloquear se: [condição]
- Avisar se: [condição]
- Recomendar quando: [condição]
```

---

## 📅 CRONOGRAMA PROPOSTO

- **FASE 1 (Hoje):** Diagnóstico e mapeamento ✓ (em progresso)
- **FASE 2 (Próximas horas):** Auditoria qualitativa das 259 escalas
- **FASE 3 (Amanhã):** Reconstrução do filtro com metadados
- **FASE 4 (Amanhã):** Scripts de auditoria automática
- **FASE 5 (Amanhã):** Relatório final e validação

---

## 🎯 MÉTRICAS DE SUCESSO (FASE 1 COMPLETA)

- [x] Mapeamento de todos os arquivos
- [ ] Lista completa de 259 escalas com análise
- [ ] Identificação de escalas mal classificadas
- [ ] Recomendações de correção para cada uma
- [ ] Relatório executivo de achados

**Status Atual:** 20% Concluído (mapeamento feito, análise em progresso)

---

**Próximo:** Proceder com leitura detalhada de scaleFilter.ts e análise individual de cada escala.
