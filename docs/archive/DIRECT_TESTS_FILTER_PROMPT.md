# 🧠 PROMPT MAESTRO: FILTRO INTELIGENTE DE TESTES DIRETOS
## NeuroPed - Análise Qualitativa por Escala & Fluxograma Developmentista

**Objetivo:** Criar filtro de testes diretos que recomenda APENAS escalas que a criança consegue responder com base em desenvolvimento cognitivo, linguagem e habilidades motoras.

**Data:** 2026-06-10  
**Scope:** `client/src/data/filterableCatalog.ts` + `filtro.tsx` (linhas 171-218)

---

## 📊 FRAMEWORK DE ANÁLISE QUALITATIVA

### Dimensões de Avaliação por Escala

Para CADA teste direto (`appRoute` não-null), analisar:

| Dimensão | Avalia | Exemplos |
|----------|--------|----------|
| **Reconhecimento** | Cores, objetos, figuras, símbolos | `testes-reconhecimento` ✓ |
| **Linguagem Receptiva** | Compreensão de instruções faladas | M-CHAT, Denver II |
| **Linguagem Expressiva** | Capacidade de falar, nomear, responder | SNAP-IV, Conners |
| **Leitura** | Decodificação, compreensão textual | TDE-2, LEIA (escolar) |
| **Escrita** | Cópia, escrita espontânea, ortografia | TDE-2 (escrita) |
| **Cognição Geral** | Reasoning, memória, atenção | Bayley-III, Denver II |
| **Habilidades Motoras** | Coordenação, controle motor fino/grosso | Bayley-III, Denver II |
| **Aceitação Social** | Conforto com adulto desconhecido | M-CHAT, Testes comportamentais |

---

## 🎯 MATRIZ DE ELEGIBILIDADE POR FAIXA ETÁRIA

### Testes Diretos (pode implementar diretamente na consulta)

```
IDADE 0-6 meses (0-180 dias)
├─ Bayley-III Scales of Infant Development
│  └─ Motor, Cognitive: SIM (criança responde fisicamente)
│  └─ Language receptiva/expressiva: PARCIAL (bebê apenas sorri/reage)
│
├─ M-CHAT-R/F (6 meses): SIM (observação parental de reações)
│
└─ Denver II: SIM (developmental milestones infantis)

IDADE 6-12 meses (181-365 dias)
├─ Bayley-III: SIM (motor, cognição)
├─ M-CHAT: SIM (10 meses: observação parental)
├─ Denver II: SIM (marcos motores/linguagem incipiente)
└─ Testes de Reconhecimento: NÃO (criança não aponta ainda)

IDADE 12-24 meses (1-2 anos)
├─ M-CHAT-R/F: SIM
├─ Denver II: SIM
├─ Testes de Reconhecimento: SIM (começa apontar ~14 meses)
│  └─ Objetos/Cores: SIM (~18 meses)
│  └─ Letras/Números: NÃO (muito cedo)
├─ Testes Acadêmicos: NÃO (pré-literate)
└─ Linguagem: SIM (nomeação incipiente)

IDADE 24-48 meses (2-4 anos)
├─ Testes de Reconhecimento: SIM
│  ├─ Cores: SIM (~3 anos)
│  ├─ Letras/Números: PARCIAL (pré-escolar)
│  └─ Letras/Números completo: NÃO (antes dos 4)
├─ Testes Acadêmicos: NÃO (ainda não lê)
├─ Denver II: SIM
├─ Conners: SIM (comportamento observável)
└─ SNAP-IV: SIM (hiperatividade óbvia nesta idade)

IDADE 48-72 meses (4-6 anos)
├─ Testes de Reconhecimento: SIM (todas as subcategorias)
├─ Testes Acadêmicos: PARCIAL
│  ├─ Leitura/Escrita: SIM (alfabetização emergente)
│  ├─ Aritmética básica: SIM (contagem até 10)
│  └─ Aritmética complexa: NÃO (antes dos 7)
├─ SNAP-IV: SIM
├─ Conners: SIM
└─ CBCL: SIM (comportamento referenciado)

IDADE 72-144 meses (6-12 anos)
├─ Testes de Reconhecimento: SIM (dominado, teste rápido)
├─ Testes Acadêmicos: SIM (todas as áreas)
├─ Conners: SIM
├─ SNAP-IV: SIM
├─ CBCL: SIM
├─ Inventários para Escola: SIM (professor base)
└─ Testes Fonológicos: SIM (se queixa linguagem)

IDADE 144+ meses (12+ anos)
├─ Testes Acadêmicos: SIM
├─ Inventários de Autoavaliação: SIM (adolescente autoaplicável)
├─ SNAP-IV: SIM (referência parental/professoral)
├─ Conners: SIM
├─ Questionários Comportamentais: SIM
└─ Testes Reconhecimento: NÃO (ceiling effect)
```

---

## ⚙️ LÓGICA DE FILTRAGEM REFINED

### Pseudocódigo para `pool()` function

```typescript
function selectEligibleDirectTests(
  age: number,           // months
  queixas: string[],     // user complaints
  context: "primeira-consulta" | "retorno"
): ScaleEntry[] {
  
  const directTests = catalog.filter(s => s.appRoute && s.prioridade !== "monitorizacao");
  
  const eligible = directTests.filter(scale => {
    // 1. AGE CHECK: Escala aplicável nesta idade?
    if (age < scale.ageMin || age > scale.ageMax) return false;
    
    // 2. DEVELOPMENTAL STAGE CHECK
    const devStage = getDevStage(age);
    const scaleCompat = checkDevelopmentCompatibility(scale, devStage);
    if (!scaleCompat) return false;
    
    // 3. COMPLAINT MATCH
    if (!scale.queixas.some(q => queixas.includes(q))) {
      // Relaxar para "screening geral" se primeira consulta
      if (context === "primeira-consulta" && scale.prioridade === "triagem") {
        // permitir (ex: Denver II como screening geral)
      } else {
        return false;
      }
    }
    
    // 4. RESPONDENT CHECK: Criança consegue responder?
    const canChildRespond = scale.respondente.includes("clinico") || 
                           scale.respondente.includes("autoaplicavel");
    if (!canChildRespond) return false;
    
    return true;
  });
  
  return eligible.sort((a, b) => scoreDirectTest(a, b, queixas, devStage));
}

function getDevStage(ageMonths: number): DevelopmentStage {
  if (ageMonths < 6) return "infancia-precoce";
  if (ageMonths < 18) return "infant-mobil";
  if (ageMonths < 36) return "toddler";
  if (ageMonths < 60) return "prescolar";
  if (ageMonths < 72) return "prescolar-transicao";
  if (ageMonths < 144) return "escolar";
  return "adolescente";
}

function checkDevelopmentCompatibility(
  scale: ScaleEntry,
  devStage: DevelopmentStage
): boolean {
  const compatibility = {
    "infancia-precoce": ["bayley", "denver", "m-chat"],
    "infant-mobil": ["bayley", "denver", "m-chat", "reconhecimento-basico"],
    "toddler": ["denver", "reconhecimento", "linguagem-basica"],
    "prescolar": ["testes-academicos-basico", "conners", "reconhecimento"],
    "prescolar-transicao": ["testes-academicos", "conners", "snap-iv"],
    "escolar": ["testes-academicos", "conners", "snap-iv", "inventarios-auto"],
    "adolescente": ["inventarios-auto", "testes-academicos", "snap-iv"],
  };
  
  const scaleCategory = identifyScaleCategory(scale);
  return compatibility[devStage]?.includes(scaleCategory) ?? false;
}

function scoreDirectTest(
  scale: ScaleEntry,
  alternative: ScaleEntry,
  queixas: string[],
  devStage: DevelopmentStage
): number {
  let score = 0;
  
  // Perfect complaint match = +100
  if (scale.queixas.some(q => queixas.includes(q))) score += 100;
  
  // Direct test with appRoute = +50
  if (scale.appRoute) score += 50;
  
  // Screening priority = +30
  if (scale.prioridade === "triagem") score += 30;
  
  // Clinical validity = +20
  if (scale.validacaoBrasil === "Sim") score += 20;
  if (scale.validacaoBrasil === "Parcial") score += 10;
  
  // Time efficiency (quick tests first) = +15
  const minutes = parseTimeToMinutes(scale.tempo);
  if (minutes <= 5) score += 15;
  if (minutes <= 10) score += 10;
  
  // Respondent clarity = +10
  if (scale.respondente.length === 1) score += 10; // unambiguous
  
  return score;
}
```

---

## 🎨 UI CENTRALIZATION FIX

### Layout Structure para Testes Diretos

```jsx
<div className="flex flex-col min-h-[calc(100vh-3.5rem)] md:min-h-screen">
  
  {/* Header/Tabs */}
  <div className="flex border-b bg-white dark:bg-slate-950">
    <Tabs defaultValue="filtro" className="w-full">
      <TabsList className="flex gap-2 w-full justify-start px-4">
        <TabsTrigger value="filtro">Filtro Completo</TabsTrigger>
        <TabsTrigger value="diretos">Testes Diretos (Recomendados)</TabsTrigger>
        <TabsTrigger value="rapido">Screening Rápido</TabsTrigger>
      </TabsList>
      
      {/* Content Area - CENTERED */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[900px]">
          
          {/* Filtro Tab */}
          <TabsContent value="filtro" className="space-y-6">
            <FilterPanel />
            <ResultsGrid results={filtroResults} />
          </TabsContent>
          
          {/* Testes Diretos Tab - MAIN FOCUS */}
          <TabsContent value="diretos" className="space-y-6">
            <DirectTestsRecommendation 
              age={selectedAge}
              queixas={selectedQueixas}
              eligible={eligibleDirectTests}
            />
            {/* Exibir apenas escalas com appRoute */}
            <div className="grid gap-4 md:grid-cols-2">
              {eligibleDirectTests.map(test => (
                <DirectTestCard 
                  key={test.id} 
                  scale={test}
                  developmentStage={devStage}
                  reasoning={explainWhyRecommended(test, selectedQueixas)}
                />
              ))}
            </div>
          </TabsContent>
          
          {/* Quick Screening Tab */}
          <TabsContent value="rapido" className="space-y-4">
            <QuickScreeningFlow age={selectedAge} />
          </TabsContent>
        </div>
      </div>
    </Tabs>
  </div>
</div>
```

---

## 📈 FLUXOGRAMA COMPLEXO REFINADO

### Decision Tree para Seleção de Testes Diretos

```
START: Criança chega na consulta
│
├─→ [Qual a idade?]
│   │
│   ├─→ 0-6 meses
│   │   ├─ RECOMENDADO: Bayley-III (motor/cogn)
│   │   ├─ OPCIONAL: Denver II (screening)
│   │   └─ NÃO USAR: Testes acadêmicos, reconhecimento
│   │
│   ├─→ 6-18 meses  
│   │   ├─ RECOMENDADO: Bayley-III + M-CHAT
│   │   ├─ TRIAGEM: Denver II
│   │   └─ NÃO USAR: Testes acadêmicos
│   │
│   ├─→ 18-36 meses (Toddler)
│   │   ├─ [Qual a queixa?]
│   │   │   ├─ linguagem → Testes Reconhecimento (nomeação)
│   │   │   ├─ desenvolvimento → Denver II + Bayley
│   │   │   ├─ comportamento → Conners (parental observation)
│   │   │   └─ geral → Screening rápido (Denver)
│   │   └─ NÃO USAR: Testes acadêmicos, leitura
│   │
│   ├─→ 3-5 anos (Pré-escolar)
│   │   ├─ [Qual a queixa?]
│   │   │   ├─ linguagem → Testes Reconhecimento
│   │   │   ├─ aprendizagem → Testes Acadêmicos (básico)
│   │   │   ├─ TDAH/comportamento → Conners + SNAP-IV (parental)
│   │   │   ├─ TEA → M-CHAT (se ainda suspeita) + Conners social
│   │   │   └─ geral → Denver II ou Screening rápido
│   │   └─ PRONTO: Criança consegue responder direto
│   │
│   ├─→ 6-12 anos (Escolar)
│   │   ├─ [Qual a queixa?]
│   │   │   ├─ aprendizagem → Testes Acadêmicos (FULL)
│   │   │   ├─ TDAH/atenção → SNAP-IV + Conners (parental)
│   │   │   ├─ comportamento → Conners + CBCL
│   │   │   ├─ social/TEA → Inventários Escola (professor)
│   │   │   ├─ linguagem → Testes Reconhecimento (avaliação rápida)
│   │   │   └─ geral → Screening behavioral (Conners)
│   │   └─ DIRETO: Criança responde questionários simples
│   │
│   └─→ 12+ anos (Adolescente)
│       ├─ [Qual a queixa?]
│       │   ├─ aprendizagem → Testes Acadêmicos
│       │   ├─ TDAH → SNAP-IV + autoaplicável
│       │   ├─ comportamento → Inventários auto (PHQ-A, etc)
│       │   ├─ ansiedade/depressão → Autoaplicáveis (GAD-7, CDI-2)
│       │   ├─ social → Inventários auto + escola
│       │   └─ geral → Autoaplicável screening
│       └─ PREFERIR: Autoavaliação do adolescente
│
├─→ [Tempo disponível?]
│   ├─ <5 min → Screening rápido (Denver/M-CHAT)
│   ├─ 5-15 min → Testes diretos modulares (Reconhecimento + Comportamento)
│   └─ 15+ min → Suite completa (Acadêmico + Comportamental + Cognitivo)
│
├─→ [Contexto clínico?]
│   ├─ Primeira consulta → Screening geral (Denver II ou M-CHAT conforme idade)
│   ├─ Retorno → Testes específicos por queixa anterior
│   └─ Avaliação escolar → Testes acadêmicos + Professor inventory
│
└─→ RESULTADO: Lista ordenada de testes elegíveis com score de recomendação
    │
    ├─ [Ouro] Perfeita correspondência (queixa + idade + desenvolvimento)
    ├─ [Prata] Boa correspondência (queixa + idade, desenvolvimento neutro)
    └─ [Bronze] Screening geral (fora da queixa específica, idade ok)

END: Clínico clica e administra teste direto
```

---

## 🔍 ANÁLISE QUALITATIVA POR ESCALA

### Exemplos de Escalas Diretas (com reasoning)

**TESTES-RECONHECIMENTO** (0-84 meses)
```
POR QUÊ RECOMENDAR?
├─ Desenvolvimento: ~18 meses criança aponta (protoimpressivo)
├─ Linguagem: Nomeia objetos a partir ~20 meses
├─ Habilidade Motora: Requer apontar (fine motor)
├─ Tempo: 5-10 minutos (rápido, não cansa criança)
└─ Clínico: Observe se consegue apontar, nomear, compreender

QUANDO NÃO USAR:
├─ < 18 meses: Não consegue apontar ainda
├─ > 72 meses: Ceiling effect (responde tudo certo)
└─ Queixa não-linguística (ex: TDAH puro): Use Conners, não este

SCORING:
├─ 18-36m: Apenas cores/objetos grandes
├─ 36-60m: Cores + Letras/Números básicos
└─ 60-84m: Completo + velocidade (discriminação rápida)
```

**TESTES-ACADÊMICOS** (60-168 meses)
```
POR QUÊ RECOMENDAR?
├─ Leitura: Requer maturação cognitiva (~5-6 anos)
├─ Escrita: Coordenação motora fina (~5+ anos)
├─ Aritmética: Raciocínio lógico (progressivo conforme série)
├─ Contexto: Triagem de dificuldades escolares
└─ Direto: Criança pode fazer task imediatamente na consulta

QUANDO NÃO USAR:
├─ < 60 meses (4-5 anos): Não alfabetizado ainda
├─ Contexto exclusivamente comportamental: Use Conners/SNAP-IV
└─ Adolescente sem queixa acadêmica: Use autoavaliação

SCORING REFINADO:
├─ 60-72m (pré-escolar): Apenas leitura/escrita MUITO básica
├─ 72-96m (1º ano): Leitura silábica + escrita cópia
├─ 96-132m (2-5º): Leitura fluida + escrita espontânea
└─ 132-168m (6º+): Compreensão + análise + aritmética complexa
```

**CONNERS RATING SCALE** (36+ meses)
```
POR QUÊ RECOMENDAR?
├─ Comportamento: Observável clinicamente (inquietude, impulsividade)
├─ Respondente: Pais/Professor (NÃO direto da criança)
├─ Aplicação: Rápida (~3-5 min entrevista estruturada)
├─ Triagem: TDAH, hiperatividade, desatenção
└─ Direto: Clínico observa durante consulta + complementa com pais

QUANDO NÃO USAR:
├─ Queixa puramente linguística/acadêmica: Use testes específicos
├─ Adolescente sem sintomas comportamentais óbvios: Use autorelato
└─ Sem oportunidade parental: Use clinical observation only (menos validado)

RESPONDENT CLARITY:
├─ 36-60m: Parental only (criança não autoavalia bem)
├─ 60-120m: Parental primary + clinical observation
└─ 120m+: Parental + Professor observation + auto (se apropriado)
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Criar `types/DirectTestFiltering.ts` com interfaces
- [ ] Refatorar `pool()` em `filtro.tsx` para usar `selectEligibleDirectTests()`
- [ ] Implementar `getDevStage()`, `checkDevelopmentCompatibility()`, `scoreDirectTest()`
- [ ] Criar aba "Testes Diretos" em `filtro.tsx` com recomendações ordenadas
- [ ] Atualizar UI com layout centralizado (flex center)
- [ ] Adicionar `DirectTestCard` component com explicação (reasoning)
- [ ] Testar cada faixa etária: 0-6m, 6-18m, 18-36m, 3-6y, 6-12y, 12y+
- [ ] Validar comportamento com casos reais (criança 3y TDAH, 7y dislexia, etc)
- [ ] Documentar fluxograma em Figma/Miro (visual)
- [ ] Commit: "feat: Intelligent direct tests filtering by developmental stage"

---

**Prompt criado:** 2026-06-10  
**Versão:** 1.0 (Maestro - Pronto para Cowork)  
**Status:** Pronto para implementação
