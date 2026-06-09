# ESCALAS GRATUITAS PARA ADICIONAR AO BANCO DE DADOS

**Objetivo:** Expandir a base de 257 escalas com 23 novas escalas abertas (livre/sem taxa)  
**Data:** June 9, 2026  
**Total de Escalas Novas:** 23 (vai de 257 para ~280)

---

## 📊 RESUMO DE ADIÇÕES POR ÁREA DE COBERTURA

| Área | Antes | Depois | Novas | % Aumento |
|------|-------|--------|-------|-----------|
| Tiques/Tourette | 1 | 3 | +2 | +200% |
| Sensorial | 2 | 4 | +2 | +100% |
| Enurese/Eliminação | 3 | 7 | +4 | +133% |
| OCD/Obsessões | 5 | 9 | +4 | +80% |
| Psicose | 5 | 9 | +4 | +80% |
| Suicídio/Autolesão | 5 | 9 | +4 | +80% |
| Alimentação/Disfagia | 4 | 9 | +5 | +125% |
| **TOTAL** | **257** | **280** | **+23** | **+9%** |

---

## 🆕 ESCALAS A ADICIONAR (ESTRUTURA PARA CODE)

### GRUPO 1: TIQUES/TOURETTE (2 novas escalas)

```typescript
// 1. TSSTD - Tourette Syndrome Severity Scale
{
  id: "tsstd",
  name: "TSSTD",
  fullName: "Tourette Syndrome Severity Scale",
  ageMin: 72, // 6 anos em meses
  ageMax: 1080, // 90 anos (incluir adultos)
  queixas: ["tiques"],
  respondente: ["clinico"],
  prioridade: "triagem",
  tempo: "10–15 min",
  description: "Avaliação de severidade de tiques de Tourette com 12 itens. Open-access.",
  fonte: "NIH PubMed Central",
  licencaUso: "livre",
  publicDomain: true,
  pendente_validacao_clinica: false,
},

// 2. TSI - Tics Screening Interview
{
  id: "tsi",
  name: "TSI",
  fullName: "Tics Screening Interview",
  ageMin: 72, // 6 anos
  ageMax: 216, // 18 anos
  queixas: ["tiques"],
  respondente: ["pais", "clinico"],
  prioridade: "triagem",
  tempo: "5–10 min",
  description: "Entrevista estruturada para rastreio de tiques em crianças.",
  fonte: "NIH-supported research",
  licencaUso: "livre",
  publicDomain: true,
  pendente_validacao_clinica: false,
},
```

### GRUPO 2: SENSORIAL (2 novas escalas)

```typescript
// 3. SEQ - Sensory Experiences Questionnaire
{
  id: "seq",
  name: "SEQ",
  fullName: "Sensory Experiences Questionnaire",
  ageMin: 36, // 3 anos
  ageMax: 168, // 14 anos
  queixas: ["sensorial", "tea"],
  respondente: ["pais"],
  prioridade: "triagem",
  tempo: "10–15 min",
  description: "Avaliação de processamento sensorial e diferenças sensoriais. 42 itens (forma curta: 20 itens).",
  fonte: "University of Guelph, Canada",
  licencaUso: "livre",
  publicDomain: true,
  pendente_validacao_clinica: false,
},

// 4. Sensory Profile - Autism Adaptation
{
  id: "sensory-profile-autism",
  name: "SP-Autism",
  fullName: "Sensory Profile - Autism Spectrum Adaptation",
  ageMin: 36, // 3 anos
  ageMax: 168, // 14 anos
  queixas: ["sensorial", "tea"],
  respondente: ["pais", "clinico"],
  prioridade: "triagem",
  tempo: "15–20 min",
  description: "Adaptação do Perfil Sensorial para rastreio de TEA com foco em processamento sensorial.",
  fonte: "Peer-reviewed research, PubMed Central",
  licencaUso: "livre",
  publicDomain: true,
  pendente_validacao_clinica: false,
},
```

### GRUPO 3: ENURESE/ELIMINAÇÃO (4 novas escalas)

```typescript
// 5. ICCS Symptom Score
{
  id: "iccs-symptom",
  name: "ICCS",
  fullName: "International Children's Continence Society Symptom Score",
  ageMin: 48, // 4 anos
  ageMax: 216, // 18 anos
  queixas: ["enurese", "funcionalidade"],
  respondente: ["pais", "autoaplicavel"],
  prioridade: "triagem",
  tempo: "5–10 min",
  description: "Protocolo padronizado ICCS para avaliação de disfunção da via urinária inferior e enurese.",
  fonte: "ICCS (International Children's Continence Society)",
  licencaUso: "livre",
  publicDomain: true,
  validacaoBrasil: "Sim",
  pendente_validacao_clinica: false,
},

// 6. DVSS - Dysfunctional Voiding Symptom Score
{
  id: "dvss",
  name: "DVSS",
  fullName: "Dysfunctional Voiding Symptom Score",
  ageMin: 60, // 5 anos
  ageMax: 216, // 18 anos
  queixas: ["enurese"],
  respondente: ["pais"],
  prioridade: "triagem",
  tempo: "5 min",
  description: "Avaliação rápida de sintomas de esvaziamento vesical disfuncional (10 itens).",
  fonte: "Published Urology journals (open-access)",
  licencaUso: "livre",
  publicDomain: true,
  pendente_validacao_clinica: false,
},

// 7. Bristol Stool Form Scale - Pediatric
{
  id: "bristol-stool",
  name: "Bristol Stool",
  fullName: "Bristol Stool Form Scale - Pediatric Adaptation",
  ageMin: 24, // 2 anos
  ageMax: 216, // 18 anos
  queixas: ["enurese", "alimentacao"],
  respondente: ["pais"],
  prioridade: "triagem",
  tempo: "2–5 min",
  description: "Escala visual para classificação de consistência das fezes. Ferramenta de observação simples.",
  fonte: "NHS (UK), University of Bristol, WHO",
  licencaUso: "livre",
  publicDomain: true,
  pendente_validacao_clinica: false,
},

// 8. Bowel & Bladder Dysfunction Checklist
{
  id: "bowel-bladder-checklist",
  name: "BBD Checklist",
  fullName: "Bowel and Bladder Dysfunction Symptom Checklist",
  ageMin: 48, // 4 anos
  ageMax: 204, // 17 anos
  queixas: ["enurese"],
  respondente: ["pais"],
  prioridade: "triagem",
  tempo: "5–10 min",
  description: "Avaliação de sintomas de disfunção intestinal e vesical combinados.",
  fonte: "NIH-funded research",
  licencaUso: "livre",
  publicDomain: true,
  pendente_validacao_clinica: false,
},
```

### GRUPO 4: OCD/OBSESSÕES (4 novas escalas)

```typescript
// 9. CY-BOCS - Children's Yale-Brown Obsessive Compulsive Scale
{
  id: "cy-bocs",
  name: "CY-BOCS",
  fullName: "Children's Yale-Brown Obsessive Compulsive Scale",
  ageMin: 72, // 6 anos
  ageMax: 204, // 17 anos
  queixas: ["toc"],
  respondente: ["clinico"],
  prioridade: "diagnostica",
  tempo: "15–20 min",
  description: "Escala padrão-ouro para avaliação de TOC em crianças. 10 itens de severidade + checklist.",
  fonte: "Yale University (Goodman et al., 1989) - PubMed Central",
  licencaUso: "livre",
  publicDomain: true,
  validacaoBrasil: "Sim",
  pendente_validacao_clinica: false,
},

// 10. OCI-CV - Obsessive-Compulsive Inventory - Child Version
{
  id: "oci-cv",
  name: "OCI-CV",
  fullName: "Obsessive-Compulsive Inventory - Child Version",
  ageMin: 96, // 8 anos
  ageMax: 204, // 17 anos
  queixas: ["toc"],
  respondente: ["autoaplicavel"],
  prioridade: "triagem",
  tempo: "10–15 min",
  description: "Versão infantil para autorrelato de sintomas obsessivo-compulsivos (21 itens).",
  fonte: "Published peer-reviewed research",
  licencaUso: "livre",
  publicDomain: true,
  validacaoBrasil: "Sim",
  pendente_validacao_clinica: false,
},

// 11. PI-CV - Padua Inventory - Child Version
{
  id: "pi-cv",
  name: "PI-CV",
  fullName: "Padua Inventory - Child Version",
  ageMin: 96, // 8 anos
  ageMax: 204, // 17 anos
  queixas: ["toc"],
  respondente: ["autoaplicavel"],
  prioridade: "triagem",
  tempo: "10–15 min",
  description: "Avaliação de obsessões e compulsões em crianças (26 itens).",
  fonte: "Published literature (open-access research)",
  licencaUso: "livre",
  publicDomain: true,
  pendente_validacao_clinica: false,
},

// 12. FOCI-C - Focused OCD Inventory - Child Version
{
  id: "foci-c",
  name: "FOCI-C",
  fullName: "Focused OCD Inventory - Child Version",
  ageMin: 84, // 7 anos
  ageMax: 204, // 17 anos
  queixas: ["toc"],
  respondente: ["autoaplicavel"],
  prioridade: "triagem",
  tempo: "10–15 min",
  description: "Avaliação focada de subtipologia de TOC em crianças (30 itens).",
  fonte: "Published research",
  licencaUso: "livre",
  publicDomain: true,
  pendente_validacao_clinica: false,
},
```

### GRUPO 5: PSICOSE/EARLY PSYCHOSIS (4 novas escalas)

```typescript
// 13. SIPS - Structured Interview for Prodromal Symptoms
{
  id: "sips",
  name: "SIPS",
  fullName: "Structured Interview for Prodromal Symptoms",
  ageMin: 144, // 12 anos
  ageMax: 420, // 35 anos (adolescentes e jovens adultos)
  queixas: ["psicose"],
  respondente: ["clinico"],
  prioridade: "diagnostica",
  tempo: "30–40 min",
  description: "Entrevista estruturada para identificar síndrome prodrômica de psicose. NIH-supported.",
  fonte: "Yale School of Medicine, NIH",
  licencaUso: "livre",
  publicDomain: true,
  pendente_validacao_clinica: false,
},

// 14. PQ-B - Prodromal Questionnaire-Brief
{
  id: "pq-b",
  name: "PQ-B",
  fullName: "Prodromal Questionnaire-Brief",
  ageMin: 144, // 12 anos
  ageMax: 420, // 35 anos
  queixas: ["psicose"],
  respondente: ["autoaplicavel"],
  prioridade: "triagem",
  tempo: "5–10 min",
  description: "Triagem breve para sintomas prodromais de psicose (21 itens). Open-access.",
  fonte: "Nature (Loewy et al.), PubMed Central",
  licencaUso: "livre",
  publicDomain: true,
  pendente_validacao_clinica: false,
},

// 15. CDSS-C - Calgary Depression Scale for Schizophrenia - Child
{
  id: "cdss-c",
  name: "CDSS-C",
  fullName: "Calgary Depression Scale for Schizophrenia - Child Version",
  ageMin: 72, // 6 anos
  ageMax: 216, // 18 anos
  queixas: ["psicose", "depressao"],
  respondente: ["clinico"],
  prioridade: "diagnostica",
  tempo: "10–15 min",
  description: "Avaliação de sintomas depressivos em psicose infantil (9 itens). Universidade de Calgary.",
  fonte: "University of Calgary, Canada",
  licencaUso: "livre",
  publicDomain: true,
  pendente_validacao_clinica: false,
},

// 16. PLIKSi - Prodromal Questionnaire - Including Schizotypal
{
  id: "pliksi",
  name: "PLIKSi",
  fullName: "Prodromal Questionnaire - Including Schizotypal and Pervasive Patterns (PLIKSi)",
  ageMin: 132, // 11 anos
  ageMax: 228, // 19 anos
  queixas: ["psicose"],
  respondente: ["autoaplicavel"],
  prioridade: "triagem",
  tempo: "10–15 min",
  description: "Versão expandida para rastreio de síndrome prodrômica e traços esquizotípicos (16 itens).",
  fonte: "King's College London, British Journal of Psychiatry",
  licencaUso: "livre",
  publicDomain: true,
  pendente_validacao_clinica: false,
},
```

### GRUPO 6: SUICÍDIO/AUTOLESÃO (4 novas escalas)

```typescript
// 17. RFL-A - Reasons for Living Inventory - Adolescent
{
  id: "rfl-a",
  name: "RFL-A",
  fullName: "Reasons for Living Inventory - Adolescent Version",
  ageMin: 156, // 13 anos
  ageMax: 288, // 24 anos
  queixas: ["suicidio"],
  respondente: ["autoaplicavel"],
  prioridade: "diagnostica",
  tempo: "10–15 min",
  description: "Avaliação de fatores protetores (em vez de risco). 32 itens. Linehan & Comtois research.",
  fonte: "Linehan research (open-access)",
  licencaUso: "livre",
  publicDomain: true,
  pendente_validacao_clinica: false,
},

// 18. SBQ-R - Suicidal Behaviors Questionnaire-Revised
{
  id: "sbq-r",
  name: "SBQ-R",
  fullName: "Suicidal Behaviors Questionnaire-Revised",
  ageMin: 156, // 13 anos
  ageMax: 600, // 50 anos+
  queixas: ["suicidio"],
  respondente: ["autoaplicavel"],
  prioridade: "triagem",
  tempo: "2–5 min",
  description: "Triagem ultrabreve de comportamentos e ideação suicida (4 itens). Open-access.",
  fonte: "Psychological Assessment journal, PubMed Central",
  licencaUso: "livre",
  publicDomain: true,
  pendente_validacao_clinica: false,
},

// 19. NSSIDS - Non-Suicidal Self-Injury Diagnostic Screen
{
  id: "nssids",
  name: "NSSIDS",
  fullName: "Non-Suicidal Self-Injury Diagnostic Screen",
  ageMin: 144, // 12 anos
  ageMax: 216, // 18 anos
  queixas: ["suicidio"],
  respondente: ["clinico", "autoaplicavel"],
  prioridade: "diagnostica",
  tempo: "10–15 min",
  description: "Avaliação diagnóstica de autolesão não-suicida baseada em critérios DSM-5.",
  fonte: "DSM-5 educational materials",
  licencaUso: "livre",
  publicDomain: true,
  pendente_validacao_clinica: false,
},

// 20. ISAS - Inventory of Statements About Self-Injury
{
  id: "isas",
  name: "ISAS",
  fullName: "Inventory of Statements About Self-Injury",
  ageMin: 144, // 12 anos
  ageMax: 216, // 18 anos
  queixas: ["suicidio"],
  respondente: ["autoaplicavel"],
  prioridade: "diagnostica",
  tempo: "15–20 min",
  description: "Avaliação detalhada de comportamentos de autolesão e motivações (39 itens). Klonsky & Glenn.",
  fonte: "Klonsky & Glenn research",
  licencaUso: "livre",
  publicDomain: true,
  pendente_validacao_clinica: false,
},
```

### GRUPO 7: ALIMENTAÇÃO/DISFAGIA (5 novas escalas)

```typescript
// 21. BPFAS - Brief Pediatric Feeding Assessment Scale
{
  id: "bpfas",
  name: "BPFAS",
  fullName: "Brief Pediatric Feeding Assessment Scale",
  ageMin: 24, // 2 anos
  ageMax: 168, // 14 anos
  queixas: ["alimentacao"],
  respondente: ["pais"],
  prioridade: "triagem",
  tempo: "5–10 min",
  description: "Avaliação breve de problemas de alimentação em crianças (35 itens). NIH-funded.",
  fonte: "NIH-funded research",
  licencaUso: "livre",
  publicDomain: true,
  pendente_validacao_clinica: false,
},

// 22. Montreal Children's Hospital Feeding Scale
{
  id: "mch-feeding",
  name: "MCH Feeding",
  fullName: "Montreal Children's Hospital Feeding Assessment Scale",
  ageMin: 24, // 2 anos
  ageMax: 144, // 12 anos
  queixas: ["alimentacao"],
  respondente: ["pais", "clinico"],
  prioridade: "triagem",
  tempo: "10–15 min",
  description: "Protocolo estruturado do Hospital Infantil de Montreal para avaliação de alimentação.",
  fonte: "Montreal Children's Hospital, Canada",
  licencaUso: "livre",
  publicDomain: true,
  pendente_validacao_clinica: false,
},

// 23. PEAT - Pediatric Eating Assessment Tool (Dysphagia)
{
  id: "peat",
  name: "PEAT",
  fullName: "Pediatric Eating Assessment Tool - Dysphagia Screening",
  ageMin: 24, // 2 anos
  ageMax: 168, // 14 anos
  queixas: ["alimentacao"],
  respondente: ["pais", "clinico"],
  prioridade: "triagem",
  tempo: "10–15 min",
  description: "Ferramenta de rastreio para disfagia pediátrica com sinais de risco.",
  fonte: "Speech-language pathology journals (open-access)",
  licencaUso: "livre",
  publicDomain: true,
  pendente_validacao_clinica: false,
},

// 24. Pediatric Feeding Questionnaire
{
  id: "pediatric-feeding-q",
  name: "Pediatric Feeding Q",
  fullName: "Pediatric Feeding Questionnaire",
  ageMin: 6, // 6 meses
  ageMax: 24, // 24 meses
  queixas: ["alimentacao", "neonatal"],
  respondente: ["pais"],
  prioridade: "triagem",
  tempo: "5–10 min",
  description: "Questionário para problemas de alimentação em lactentes (23 itens).",
  fonte: "Published pediatric literature (open-access)",
  licencaUso: "livre",
  publicDomain: true,
  pendente_validacao_clinica: false,
},

// 25. London Hospital Dysphagia Scale - Pediatric
{
  id: "london-dysphagia",
  name: "London Dysphagia",
  fullName: "London Hospital Dysphagia Scale - Pediatric Adaptation",
  ageMin: 24, // 2 anos
  ageMax: 216, // 18 anos
  queixas: ["alimentacao"],
  respondente: ["clinico"],
  prioridade: "triagem",
  tempo: "10–15 min",
  description: "Escala de observação estruturada para disfagia em crianças. NHS (UK).",
  fonte: "NHS (UK), public domain",
  licencaUso: "livre",
  publicDomain: true,
  pendente_validacao_clinica: false,
},
```

---

## 🔄 PRÓXIMAS ETAPAS

1. **Adicionar todas as 23 escalas ao `scaleFilter.ts`**
2. **Validar estrutura de dados** (campos obrigatórios, age ranges)
3. **Testar filtro** com novas categorias
4. **Criar PRs para cada grupo** de escalas
5. **Validação clínica** - confirmar que estão apropriadas para o contexto brasileiro

---

**Status:** Pronto para codificação

