# 🔍 AUDITORIA FASE 1 — ANÁLISE QUALITATIVA ESCALA POR ESCALA

**Status:** Em progresso  
**Data:** 2026-06-10  
**Arquivo Auditado:** `scaleFilter.ts` (primeiros 200 itens)

---

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

### Problema 1: Confusão entre "Teste Direto" e "Questionnaire para Pais"

**Exemplo 1 - M-CHAT-R/F (linha 105)**
```typescript
respondente: ["pais"]  // CORRETO
```
✅ **Correto.** M-CHAT é checklist parental, NÃO teste direto.  
O nome não deve conter "teste direto".

---

**Exemplo 2 - Denver II (linha 93)**
```typescript
respondente: ["clinico"]
description: "Avalia marcos motores, linguagem, pessoal-social..."
appRoute: "/denver"
```
⚠️ **Precisa clarificação:**
- Denver II MIX: possui itens que são observação clínica (marcos já adquiridos) + testes diretos (poder realizar tarefa agora)
- Não é 100% teste direto
- Não é 100% observação
- **Classificação correta:** `administrationMode: "observacao_estruturada_com_teste_direto"`

---

**Exemplo 3 - Bayley-III (linha 94)**
```typescript
respondente: ["clinico"]
```
✅ **Correto.** Bayley-III é teste direto de desempenho: criança executa tarefas.  
**Mas precisa detalhe:** `directChildTaskType: "cognicao_linguagem_motor"` (não especificado)

---

### Problema 2: Campos Respondente Ambíguo

**Exemplo - Conners 3 (linha 120)**
```typescript
respondente: ["pais", "professor", "autoaplicavel"]
```
⚠️ **Problema:**
- Conners 3 tem 3 VERSÕES diferentes:
  1. Parent Rating Form (responde pais)
  2. Teacher Rating Form (responde professor)
  3. Adolescent Self-Report (responde adolescente)
- Listadas como uma escala só
- Filtro não consegue diferenciar
- **Solução:** Criar 3 entradas ou adicionar campo `formVariant`

---

**Exemplo - SDQ (linha 128)**
```typescript
respondente: ["pais", "professor", "autoaplicavel"]
```
⚠️ **Mesmo problema.**  
SDQ tem versão para pais, professor, E criança/adolescente (cada uma é um questionário diferente).

---

**Exemplo - SCARED (linha 135)**
```typescript
respondente: ["pais", "autoaplicavel"]
```
⚠️ **Mesmo problema.**  
SCARED tem 2 versões: parental E criança (autoaplicável). São instrumentos distintos.

---

### Problema 3: "autoaplicavel" sem Validação de Idade

**Exemplo - SCARED (linha 135)**
```typescript
ageMin: 96  // 8 anos
respondente: ["pais", "autoaplicavel"]
```
⚠️ **Risco:**
- 8 anos é idade mínima, mas autoaplicação exige leitura proficiente
- Criança de 8 anos pode não ter vocabulário/compreensão para responder
- **Solução:** Adicionar `requiresReading: true, minReadingLevel: "nivel2"`

---

**Exemplo - RCADS (linha 137)**
```typescript
ageMin: 96  // 8 anos
respondente: ["autoaplicavel", "pais"]
```
⚠️ **Mesmo problema.**  
RCADS em versão criança exige leitura fluida. Provavelmente adequado só a partir de 10-11 anos.

---

### Problema 4: "clinico" genérico vs. "Teste Direto de Desempenho"

**Exemplo - PPVT-4 (linha 169)**
```typescript
respondente: ["clinico"]
description: "Vocabulário receptivo por identificação de figuras."
```
✅ **Este É teste direto:**
- Criança aponta figura
- Tarefa objetiva
- Desempenho observável
- **Correto.**

---

**Exemplo - CBCL (linha 127)**
```typescript
respondente: ["pais"]
```
✅ **Correto.** CBCL é questionário parental puro.  
**Mas lista como:** "triagem de problemas internalizantes, externalizantes..."  
Não é teste direto. Descrição clara.

---

**Exemplo - CSHQ (linha 172)**
```typescript
respondente: ["pais"]
appRoute: "/cshq"
```
✅ **Correto.** CSHQ é questionário de hábitos de sono dos pais.  
Não é teste direto. Ter appRoute não significa ser teste direto.

---

### Problema 5: Falta de "Teste Direto" Real no Sistema

Procurando por testes verdadeiramente diretos na lista:

**Encontrados (Teste Direto Real):**
- Denver II (parcial: observação + tarefa)
- Bayley-III (sim: tarefas motoras e cognitivas)
- Griffiths (sim: tarefas estruturadas)
- AIMS (sim: observação de postura/movimento, mas estruturada)
- TIMP (sim: testes motores)
- GMA (sim: observação qualitativa de movimento)
- CAT/CLAMS (sim: tarefas para criança)
- PPVT-4 (sim: apontação de figuras)
- CELF-5 (sim: tarefas de linguagem)
- TDE (sim: tarefas de leitura/escrita/aritmética)

**Não Encontrados (Questionários listados como clínicos):**
- CARS-2: Questionário para clínico preencher observando criança (não é teste direto)
- ADOS-2: Protocolo observacional estruturado (tipo teste? não exatamente tarefa de desempenho)
- GMFCS: Classificação baseada em observação (não teste direto, é avaliação)

---

## 📊 RECLASSIFICAÇÃO PROPOSTA

### Categorias-Mãe Necessárias

```typescript
enum InstrumentCategory {
  // 1. Questionário Parental Puro
  ParentalQuestionnaire = "questionario_parental",
  
  // 2. Questionário Escolar Puro
  SchoolQuestionnaire = "questionario_escolar",
  
  // 3. Questionário Profissional Puro
  ProfessionalQuestionnaire = "questionario_profissional",
  
  // 4. Autorrelato Puro
  ChildSelfReport = "autorrelato_crianca",
  
  // 5. Teste Direto Puro (tarefa objetiva)
  DirectPerformanceTest = "teste_direto_desempenho",
  
  // 6. Observação Clínica Estruturada
  StructuredObservation = "observacao_clinica_estruturada",
  
  // 7. Classificação/Avaliação (não teste, não questão)
  FunctionalClassification = "classificacao_funcional",
  
  // 8. Misto (múltiplas fontes)
  Mixed = "instrumento_misto"
}
```

---

## 🔨 EXEMPLOS DE RECLASSIFICAÇÃO

### Denver II
**Atual:**
```typescript
respondente: ["clinico"]
```

**Proposto:**
```typescript
instrumetType: "observacao_clinica_estruturada_com_teste_direto",
administrationMode: "observacao_estruturada",
directTestComponents: [
  "marcos_motores_observados",  // criança já andando?
  "linguagem_expressiva_espontanea",  // criança fala?
  "resposta_auditiva",  // criança vira som?
  "testes_rapidos"  // completar tarefa do clínico (desenho, bloco)
],
requiresChildPresence: true,
requiresDirectTaskPerformance: true,  // algumas tarefas exigem ação
```

---

### SCARED
**Atual:**
```typescript
respondente: ["pais", "autoaplicavel"]
ageMin: 96
```

**Proposto:**
```typescript
// CRIAR 2 ENTRADAS SEPARADAS:

// 1. SCARED - Parent Version
{
  id: "scared-pais",
  name: "SCARED (Versão Pais)",
  instrumetType: "questionario_parental",
  respondente: ["pais"],
  ageMin: 96,
  ageMax: 216,
  requiresParent: true,
  requiresReading: false,
  ...
}

// 2. SCARED - Child Version
{
  id: "scared-crianca",
  name: "SCARED (Versão Criança/Adolescente)",
  instrumetType: "autorrelato_crianca",
  respondente: ["autoaplicavel"],
  ageMin: 120,  // elevar: exige leitura fluida
  ageMax: 216,
  requiresChildPresence: true,
  requiresReading: true,
  minReadingLevel: "nivel3",
  ...
}
```

---

### GMFCS
**Atual:**
```typescript
respondente: ["clinico"]
description: "Classificação da função motora grossa em PC"
```

**Proposto:**
```typescript
instrumetType: "classificacao_funcional",
administrationMode: "clinical_judgment",
respondente: ["clinico"],
requiresChildPresence: true,
requiresObservation: true,
directTestComponents: ["marcha", "mobilidade"],
scoringMode: "classification",  // não escore contínuo
scaleLevels: 5,  // I-V
```

---

## 📋 CHECKLIST DE MUDANÇAS NECESSÁRIAS

- [ ] Definir `InstrumentCategory` enum
- [ ] Definir `AdministrationMode` enum
- [ ] Adicionar campos opcionais a `ScaleEntry`:
  - `instrumentType: InstrumentCategory`
  - `administrationMode: AdministrationMode`
  - `directTestComponents?: string[]`
  - `requiresReading?: boolean`
  - `minReadingLevel?: "basico" | "nivel2" | "nivel3" | "fluente"`
  - `requiresChildPresence?: boolean`
  - `requiresObservation?: boolean`
  - `formVariants?: string[]`
  
- [ ] Separar escalas com múltiplas versões (SCARED, RCADS, Conners, SDQ)
- [ ] Revisar todas as 414+ escalas uma a uma
- [ ] Atualizar descriptions para clarificar tipo
- [ ] Implementar blocking rules
- [ ] Testar filtro com casos reais

---

**Status:** 🔴 **CRÍTICO**  
Muitas confusões conceituais. Recomenda-se pausar o uso até auditoria completa.

