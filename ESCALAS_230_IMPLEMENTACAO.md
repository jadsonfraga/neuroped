# NeuroPed — Implementação de 230+ Escalas Internacionais

## 📋 Visão Geral

Este documento descreve a implementação de 230+ instrumentos de avaliação pediátricos/neurodesenvolvimentais no sistema NeuroPed, com suporte a:

- **Filtro inteligente** por queixa, idade, respondente e prioridade clínica
- **Perguntas e respostas estruturadas** em português clínico
- **Gabarito e scoring automático**
- **Geração de relatórios em PDF** com interpretação clínica
- **Metadados clínicos** (validação brasileira, pontos de corte, referências)

---

## 📂 Estrutura de Arquivos

### Dados Base

```
data/
├── escalasImportadas230Plus.ts      # 230+ escalas em formato estruturado
├── scaleQuestions.ts                # Perguntas, respostas e gabarito
├── scaleFilter.ts                   # Filtro inteligente (existente)
└── escalasAutorais.ts               # Escalas autorais Dr. Jadson (existente)
```

### Serviços

```
server/services/
├── pdf-generator.ts                 # Geração de PDF/HTML/CSV
└── (próximo: scoring-engine.ts)     # Engine de cálculo de escore
```

### Frontend (futuro)

```
client/src/
├── components/
│   ├── ScaleRenderer.tsx             # Renderiza perguntas dinamicamente
│   └── ScaleReportViewer.tsx         # Visualiza relatório
└── pages/
    └── scales/                       # Páginas de escalas por categoria
```

---

## 🎯 Categorias Implementadas

### PROMIS — Patient-Reported Outcomes Measurement Information System

#### Pediátrico (8-17 anos, autorrelato) — 16 escalas
- Fadiga Pediátrica (scale_001)
- Interferência da Dor (scale_002)
- Intensidade da Dor (scale_003)
- Comportamento de Dor (scale_004)
- Qualidade da Dor (scale_005)
- Função Física e Mobilidade (scale_006)
- Função Cognitiva (scale_007)
- Raiva (scale_008)
- Satisfação com a Vida (scale_009)
- Sentido e Propósito (scale_010)
- Afeto Positivo (scale_011)
- Experiências de Estresse (scale_012)
- Estigma (scale_013)
- Impacto da Asma (scale_014)
- Impacto do Prurido (scale_015)
- Saúde Global (scale_016)

#### Relato dos Pais (5-17 anos) — 14 escalas
- Fadiga por Relato (scale_017)
- Interferência da Dor por Relato (scale_018)
- ... (até scale_030)

#### Primeira Infância (1-5 anos, relato dos pais) — 6 escalas
- (scale_031 a scale_036)

### NIH Toolbox — Emoção, Desenvolvimento e Desfecho

#### Instrumentos de Emoção e Bem-estar (8-17 anos) — 13 escalas
- Raiva (scale_037)
- Medo/Ansiedade (scale_038)
- Tristeza/Depressão (scale_039)
- Afeto Positivo (scale_040)
- Satisfação com a Vida (scale_041)
- Sentido e Propósito (scale_042)
- Suporte Emocional (scale_043)
- Amizade (scale_044)
- Solidão (scale_045)
- Rejeição Percebida (scale_046)
- Hostilidade Percebida (scale_047)
- Autoeficácia (scale_048)
- Estresse Percebido (scale_049)

### Paralisia Cerebral, Motricidade e Funcionalidade (50-68)

- MACS — Manual Ability Classification System (scale_050)
- Mini-MACS (scale_051)
- CFCS — Communication Function Classification (scale_052)
- EDACS — Eating and Drinking Ability (scale_053)
- FMS — Functional Mobility Scale (scale_054)
- GMFM-66 (scale_055)
- GMFM-88 (scale_056)
- AHA — Assisting Hand Assessment (scale_057)
- BoHA — Both Hands Assessment (scale_058)
- ABILHAND-Kids (scale_059)
- CHEQ — Children's Hand-use Experience (scale_060)
- QUEST — Quality of Upper Extremity Skills (scale_061)
- Melbourne Assessment 2 (scale_062)
- SHUEE — Shriners Upper Extremity Evaluation (scale_063)
- House Functional Classification (scale_064)
- Viking Speech Scale (scale_065)
- BFMF — Bimanual Fine Motor Function Classification (scale_066)
- CP QOL-Child (scale_067)
- CP QOL-Teen (scale_068)

### Categorias Pendentes (69-230)

- **Desenvolvimento Infantil (69-82)** — 14 escalas
  - DAYC-2, BDI-3, HELP, AEPS-3, CSBS DP, Rossetti, MacArthur CDI, REEL-4, DP-4, Mullen, ESI-R, ASQ:SE-2, etc.

- **Linguagem, Fala e Comunicação (83-99)** — 17 escalas
  - CCC-2, TOPL-2, CELF, EVT-3, ROWPVT, EOWPVT, TROG-2, TNL-2, OWLS-II, CASL-2, GFTA-3, KLPA-3, SSI-4, OASES

- **TEA, Cognição Social e Sensorial (100-114)** — 15 escalas
  - SRS-2, SCQ, Q-CHAT-10, STAT, BOSA, 3Di, ADI-R, ADOS-2, RBS-R, RBQ-2, Sensory Profile, CAT-Q

- **TDAH, Funções Executivas e Escola (115-126)** — 12 escalas
  - ADHD-RS-5, SKAMP, IRS, APRS, CHEXI, CEFI, D-REF, BDEFS-CA, LEAF, BASC-3 BESS, SSIS SEL

- **Epilepsia, Crises e Impacto (127-139)** — 13 escalas
  - QOLCE-55/76, PedsQL Epilepsy, CHEQOL-25, SSQ, Liverpool, NHS3, PESQ, LAEP, NDDI-E-Y, Seizure Self-Efficacy

- **Dor, Cefaleia e Sintomas Somáticos (140-149)** — 10 escalas
  - FPS-R, NRS, VAS Pain, APPT, CALI, FDI, BAPQ, PCS-C, Headache Impact Test, MADAS

- **Sono (150-157)** — 8 escalas
  - BISQ-R, SDSC, PDSS, ESS-CHAD, ASHS, SSHS, CSHQ (abreviado), ISI Adolescente

- **Alimentação, Seletividade, Disfagia (158-168)** — 11 escalas
  - NIAS (ARFID), EDY-Q, PARDI, MCH-FS, BPFAS, STEP, PediEAT, PRSI, Food Neophobia, Child Food Rejection, MBQ

- **Trauma, Estresse, Maus-tratos e Luto (169-177)** — 9 escalas
  - CPSS-5, UCLA PTSD, TSCC, TSCYC, CATS (cuidador), CTQ-SF, JVQ, ICG-Juvenil, PGD Checklist

- **Humor, Ansiedade, TOC e Desregulação (178-190)** — 13 escalas
  - MASC-2, SCAS-P/C, PAS, MFQ-C/P, SMFQ, CDI-2 Short, CY-BOCS, OCI-CV, ARI, EDI, DERS-Y

- **Comportamento Disruptivo, Oposição e Agressividade (191-200)** — 10 escalas
  - ECBI, SESBI-R, DBD, ODD Rating Scale, CD Rating Scale, MOAS, ABC Irritability, NCBRF, HSQ, SSQ

- **Aprendizagem, Leitura, Escrita e Matemática (201-215)** — 15 escalas
  - WJ-IV, WIAT-4, KTEA-3, GORT-5, TOWRE-2, CTOPP-2, RAN/RAS, DASH, ETCH, TOWL-4, KeyMath-3, TEMA-3, MARS-C, DST Junior, YARC

- **Cognição, Neuropsicologia e Memória (216-230)** — 15 escalas
  - CMS, WRAML-3, CVLT-C, NEPSY-II (multiple), TEA-Ch2, K-CPT 2, CPT-3, CCTT, Tower of London, BRIEF-P

---

## 🔧 Estrutura de Dados

### ScaleEntry (scaleFilter.ts)

```typescript
interface ScaleEntry {
  id: string;                         // ID único (scale_001, scale_002, etc)
  name: string;                       // Nome abreviado
  fullName: string;                   // Nome completo em português
  ageMin: number;                     // Idade mínima (meses)
  ageMax: number;                     // Idade máxima (meses)
  queixas: string[];                  // IDs das queixas clínicas
  respondente: Respondente[];         // Quem responde
  prioridade: Prioridade;             // triagem | diagnostica | monitorizacao
  tempo: string;                      // Tempo estimado
  description: string;                // Descrição breve
  licencaUso: "livre" | "comercial" | "restrita" | "contato_autor";
  assessment_type: "diagnostic" | "monitoring" | "both";
  verbal?: boolean;                   // Requer linguagem falada
  alphabetic?: boolean;               // Requer leitura/escrita
}
```

### ScaleMetadata (scaleQuestions.ts)

```typescript
interface ScaleMetadata {
  scaleId: string;
  name: string;
  fullName: string;
  ageMin: number;
  ageMax: number;
  estimatedTime: string;
  questions: ScaleQuestion[];         // Array de itens/perguntas
  domains?: ScaleDomain[];            // Subescalas/domínios
  scoringCutoffs?: ScaleScoringCutoff[];  // Tabela de classificação
  totalItems: number;
  minScore: number;
  maxScore: number;
  scoringMethod: "sum" | "average" | "custom";
  validationCountries?: string[];
  clinicalNotes?: string;
  references?: string[];
}
```

### ScaleQuestion

```typescript
interface ScaleQuestion {
  id: string;                         // ID único
  itemNumber: number;                 // Número do item
  text: string;                       // Texto da pergunta
  answerType: AnswerType;            // yes_no | likert_5 | likert_4 | etc
  options?: AnswerOption[];           // Opções de resposta
  reversed?: boolean;                 // Inverter no scoring
  help?: string;                      // Tooltip clínico
  dependsOn?: string;                 // Skip logic (ID da questão anterior)
}
```

---

## 📊 Exemplo de Implementação Completa

### 1. Definir Dados de Escala (scaleQuestions.ts)

```typescript
export const exemploScaleQuestions: ScaleQuestion[] = [
  {
    id: "q1",
    itemNumber: 1,
    text: "Seu filho apresenta interesse por brinquedos?",
    answerType: "yes_no",
    options: [
      { id: "yes", label: "Sim", value: 0 },      // Sem risco
      { id: "no", label: "Não", value: 1 },       // Risco
    ],
    help: "Observe interesse voluntário por objetos apropriados para a idade.",
  },
  // ... mais questões
];

export const exemploMetadata: ScaleMetadata = {
  scaleId: "scale_xyz",
  name: "Escala Exemplo",
  fullName: "Escala de Exemplo Completa",
  ageMin: 12, ageMax: 36,
  estimatedTime: "10 min",
  questions: exemploScaleQuestions,
  totalItems: 5,
  minScore: 0,
  maxScore: 5,
  scoringMethod: "sum",
  scoringCutoffs: [
    {
      minScore: 0,
      maxScore: 2,
      classification: "Sem Risco",
      description: "Desenvolvimento adequado.",
      color: "text-emerald-600",
    },
    {
      minScore: 3,
      maxScore: 5,
      classification: "Risco",
      description: "Encaminhamento para avaliação especializada.",
      color: "text-red-600",
      action: "Solicitar avaliação especializada.",
    },
  ],
};

// Registrar no dicionário global
allScaleMetadata["scale_xyz"] = exemploMetadata;
```

### 2. Usar no Filtro (scaleFilter.ts)

```typescript
const scales: ScaleEntry[] = [
  {
    id: "scale_xyz",
    name: "Escala Exemplo",
    fullName: "Escala de Exemplo Completa",
    ageMin: 12,
    ageMax: 36,
    queixas: ["atraso", "desenvolvimento"],
    respondente: ["pais"],
    prioridade: "triagem",
    tempo: "10 min",
    description: "Exemplo de escala com perguntas estruturadas.",
    assessment_type: "diagnostic",
  },
  // ...
];
```

### 3. Gerar Relatório PDF

```typescript
import { generateScaleReportHTML, generateScaleReportCSV } from "@/server/services/pdf-generator";
import { getScaleMetadata } from "@/data/scaleQuestions";

const scaleData = {
  scaleId: "scale_xyz",
  scaleName: "Escala Exemplo",
  scaleFullName: "Escala de Exemplo Completa",
  totalScore: 2,
  maxScore: 5,
  classification: "Sem Risco",
  description: "Seu filho não apresenta sinais de preocupação nesta escala.",
  answers: [
    { itemNumber: 1, question: "Seu filho apresenta interesse por brinquedos?", answer: "Sim", value: 0 },
    // ... respostas
  ],
  metadata: getScaleMetadata("scale_xyz"),
  options: {
    patientName: "João Silva",
    patientAge: "24 meses",
    applicationDate: new Date().toLocaleDateString("pt-BR"),
    professionalName: "Dr. Jadson Fraga",
    professionalRegistry: "CRM-PE 25227",
    includeInterpretation: true,
    includeReferences: true,
  },
};

// Gerar HTML para visualizar ou imprimir
const html = generateScaleReportHTML(scaleData);

// Gerar CSV para importar em Excel
const csv = generateScaleReportCSV(scaleData);
```

---

## 🌍 Mapeamento de Queixas Clínicas

As 230+ escalas estão mapeadas para as seguintes queixas:

```typescript
const queixasMap = {
  promis_fadiga: ["fadiga", "cansaco", "energia"],
  promis_dor: ["dor", "interfere_atividade", "qualidade_vida"],
  promis_funcao_motora: ["motor", "mobilidade", "funcao_fisica"],
  promis_cognicao: ["cognicao", "memoria", "atencao"],
  promis_emocional: ["raiva", "humor", "emocoes"],
  promis_social: ["amizade", "familia", "estigma"],
  nih_emocional: ["emocoes", "ansiedade", "depressao", "raiva"],
  nih_social: ["amizade", "rejeicao", "solidao"],
  paralisia_cerebral: ["pc", "motor", "espasticidade", "comunicacao"],
  desenvolvimento: ["desenvolvimento", "atraso", "primeira_infancia"],
  linguagem: ["linguagem", "fala", "comunicacao"],
  tea: ["tea", "autismo", "comunicacao_social", "comportamento_repetitivo"],
  tdah: ["tdah", "atencao", "hiperatividade", "funcao_executiva"],
  epilepsia: ["epilepsia", "crises", "convulsoes"],
  dor_cefaleia: ["dor", "cefaleia", "enxaqueca"],
  sono: ["sono", "insonia", "sonolencia"],
  alimentacao: ["alimentacao", "disfagia", "seletividade"],
  trauma: ["trauma", "ptsd", "estresse", "luto"],
  humor_ansiedade: ["depressao", "ansiedade", "humor", "emocoes"],
  comportamento: ["comportamento", "agressividade", "oposicao"],
  aprendizagem: ["aprendizagem", "leitura", "escrita", "matematica"],
  neuropsicologia: ["memoria", "cognicao", "atencao", "funcao_executiva"],
};
```

---

## 📱 Integração com o App

### Frontend — Renderizar Escala Dinamicamente

```tsx
import { getScaleMetadata } from "@/data/scaleQuestions";

export function ScaleRenderer({ scaleId }: { scaleId: string }) {
  const metadata = getScaleMetadata(scaleId);
  if (!metadata) return <div>Escala não encontrada</div>;

  const [answers, setAnswers] = useState<Record<string, number>>({});

  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
  const cutoff = metadata.scoringCutoffs?.find(
    c => totalScore >= c.minScore && totalScore <= c.maxScore
  );

  return (
    <div className="scale-container">
      <h1>{metadata.fullName}</h1>
      <div className="questions">
        {metadata.questions.map(question => (
          <Question
            key={question.id}
            question={question}
            value={answers[question.id]}
            onChange={(v) => setAnswers({ ...answers, [question.id]: v })}
          />
        ))}
      </div>
      <div className="result">
        <h2>Escore: {totalScore}/{metadata.maxScore}</h2>
        <h3 className={cutoff?.color}>{cutoff?.classification}</h3>
        <p>{cutoff?.description}</p>
        <button onClick={() => downloadPDF(scaleId, answers)}>
          Baixar Relatório PDF
        </button>
      </div>
    </div>
  );
}
```

### Backend — API Endpoint

```typescript
// GET /api/scales/:scaleId/metadata
export async function getScaleMetadataAPI(req, res) {
  const { scaleId } = req.params;
  const metadata = getScaleMetadata(scaleId);
  
  if (!metadata) {
    return res.status(404).json({ error: "Escala não encontrada" });
  }
  
  res.json(metadata);
}

// POST /api/scales/:scaleId/report
export async function generateScaleReportAPI(req, res) {
  const { scaleId } = req.params;
  const { answers, patientName, patientAge } = req.body;
  
  const metadata = getScaleMetadata(scaleId);
  if (!metadata) return res.status(404).json({ error: "Escala não encontrada" });
  
  // Calcular escore
  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
  const cutoff = metadata.scoringCutoffs?.find(
    c => totalScore >= c.minScore && totalScore <= c.maxScore
  );
  
  // Preparar dados para PDF
  const reportData = {
    scaleId,
    scaleName: metadata.name,
    scaleFullName: metadata.fullName,
    totalScore,
    maxScore: metadata.maxScore,
    classification: cutoff?.classification || "Desconhecido",
    description: cutoff?.description || "",
    answers: metadata.questions.map(q => ({
      itemNumber: q.itemNumber,
      question: q.text,
      answer: q.options?.find(o => o.value === answers[q.id])?.label || "",
      value: answers[q.id],
    })),
    metadata,
    options: { patientName, patientAge },
  };
  
  // Gerar PDF em HTML
  const html = generateScaleReportHTML(reportData);
  
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
}
```

---

## 🔒 Licenciamento e Conformidade

As 230+ escalas estão classificadas conforme:

- **`licencaUso: "livre"`** — Escalas de domínio público ou sob licença CC/GPL
- **`licencaUso: "comercial"`** — Escalas sob licença comercial (ex: PROMIS, Wechsler)
- **`licencaUso: "restrita"`** — Escalas com permissão limitada (ex: ADOS-2, ADI-R)
- **`licencaUso: "contato_autor"`** — Escalas que requerem contato com autor

**Política NeuroPed:**
- Metadados completos estão disponíveis para todas as 230+ escalas
- Escalas `livre` ou `restrita` podem ser implementadas com formulário
- Escalas `comercial` são oferecidas como **metadados + link para fonte oficial**
- Implementações `embed` incluem itens estruturados; `permission` requer consentimento

---

## 📈 Roadmap

- ✅ **v1.0** — PROMIS (30), NIH Toolbox (13), PC/Motor (19)
- ⏳ **v1.1** — Desenvolvimento (14), Linguagem (17), TEA (15)
- ⏳ **v1.2** — TDAH (12), Epilepsia (13), Dor (10)
- ⏳ **v1.3** — Sono (8), Alimentação (11), Trauma (9)
- ⏳ **v1.4** — Humor (13), Comportamento (10)
- ⏳ **v1.5** — Aprendizagem (15), Cognição (15)
- ⏳ **v2.0** — Integração com IA (sugestões clínicas baseadas em padrão de respostas)

---

## 💡 Exemplos de Uso Clínico

### Triagem de Neurodesenvolvimento (0-24 meses)

```
1. Idade: 18 meses, queixa: atraso
   ↓
   Filtrar por: ["atraso", "primeira_infancia"], idade 18m
   ↓
   Mostrar: M-CHAT-R/F, BAYLEY-III, PROFILES, etc.
```

### Suspeita de TEA (16-30 meses)

```
1. Pais relatam: falta de interesse social, sem linguagem
   ↓
   Filtrar por: ["tea", "comunicacao_social"], respondente: pais
   ↓
   Aplicar: M-CHAT-R/F (triagem) → se positivo → ADOS-2 + ADI-R (diagnóstico)
```

### Avaliação de Qualidade de Vida (criança com epilepsia)

```
1. Paciente: 12 anos, epilepsia
   ↓
   Filtrar por: ["epilepsia", "qualidade_vida"]
   ↓
   Mostrar: QOLCE-55/76, PedsQL Epilepsy, QOLIE-AD-48
   ↓
   Acompanhamento: PROMIS Pediatric Global Health (monitoria contínua)
```

---

## 📞 Suporte

Para dúvidas sobre implementação:
- Email: drjadsonfraga@proton.me
- CRM-PE 25227 · RQE 17756

---

**Versão:** 2026.06  
**Última atualização:** 2026-06-10  
**Status:** 62/230 escalas implementadas (27%)
