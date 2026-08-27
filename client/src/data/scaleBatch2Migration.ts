/**
 * scaleBatch2Migration.ts — Phase 2 Batch 2 Classification Data
 *
 * 80 scales of MEDIUM difficulty requiring clinical judgment.
 *
 * Characteristics:
 * - Multiple respondent types (pais + clinico, professor + pais)
 * - Mix of task types (questionario + observational)
 * - Require careful distinction between respondent versions
 * - Some conditional respondent types based on age/ability
 *
 * Organization: 5 lotes by classification approach
 * - Lote 2A: Multi-respondent screening tools (parental + professional versions)
 * - Lote 2B: Teacher + parent scales (school-based assessments)
 * - Lote 2C: Multi-modal instruments (combined questionnaire + observational)
 * - Lote 2D: Performance tests with professional administration (mixed modality)
 * - Lote 2E: Specialized scales (psychiatric, specialty assessments)
 */

import type { RespondentType, TarefaTipo } from "../types/scaleClassification";

export interface ScaleBatch2Entry {
  id: string;
  respondente_novo: RespondentType;
  tarefa_tipo: TarefaTipo;
  lote: "2A" | "2B" | "2C" | "2D" | "2E";
  justificacao: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// LOTE 2A: Multi-respondent screening tools (Parental + Professional versions)
// ═══════════════════════════════════════════════════════════════════════════
// Scales with parallel parental and clinician forms; classification depends on
// which version is being used. In scaleFilter.ts, we classify the PRIMARY form.

export const lote2A: ScaleBatch2Entry[] = [
  {
    id: "peds",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2A",
    justificacao: "PEDS — Parents' Evaluation of Developmental Status. Triagem de desenvolvimento com 10 perguntas. Respondido por pais. Closed-ended questionnaire format.",
  },
  {
    id: "catclams",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "2A",
    justificacao: "CAT/CLAMS — Clinical Adaptive Test / Clinical Linguistic and Auditory Milestone Scale. Performance test administered by clinician. Direct assessment of cognitive and language milestones.",
  },
  {
    id: "portage",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "observacao-comportamental",
    lote: "2A",
    justificacao: "Portage — Guia Portage de Educação Pré-Escolar. Clinician observes child's abilities across developmental domains. Observational assessment format used for intervention planning.",
  },
  {
    id: "aims",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-motor",
    lote: "2A",
    justificacao: "AIMS — Alberta Infant Motor Scale. Clinician observes infant motor development across postural positions. Direct performance assessment of motor milestones.",
  },
  {
    id: "ims",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-motor",
    lote: "2A",
    justificacao: "IMS — Escala Motora Infantil de Alberta. Observational motor scale administered by clinician. Direct assessment of gross motor development.",
  },
  {
    id: "timp",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-motor",
    lote: "2A",
    justificacao: "TIMP — Test of Infant Motor Performance. Performance-based assessment of postural control and motor function in at-risk infants. Clinician-administered direct test.",
  },
  {
    id: "cars",
    respondente_novo: "observacao-clinica-estruturada",
    tarefa_tipo: "observacao-comportamental",
    lote: "2A",
    justificacao: "CARS-2 — Childhood Autism Rating Scale 2. Clinician rates observed behaviors during interaction. Structured clinical observation of autism symptoms (15–20 min).",
  },
  {
    id: "adir",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "entrevista-estruturada",
    lote: "2A",
    justificacao: "ADI-R — Autism Diagnostic Interview Revised. Semi-structured interview with parent/caregiver. Parent reports child's developmental history and behavior (90–150 min).",
  },
  {
    id: "scq",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2A",
    justificacao: "SCQ — Social Communication Questionnaire. 40-item parental questionnaire derived from ADI-R. Closed-ended format (10 min).",
  },
  {
    id: "cast",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2A",
    justificacao: "CAST — Childhood Autism Spectrum Test. 37-item parental screening questionnaire for school-age children. Closed-ended format (10 min).",
  },
  {
    id: "gars3",
    respondente_novo: "misto",
    tarefa_tipo: "questionario-fechado",
    lote: "2A",
    justificacao: "GARS-3 — Gilliam Autism Rating Scale 3. Can be completed by parent OR clinician. Mixed respondent type (either pais or clinico observes behavior). Questionnaire format (10–15 min).",
  },
  {
    id: "atec",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2A",
    justificacao: "ATEC — Autism Treatment Evaluation Checklist. Parental screening and monitoring checklist. Closed-ended format across 4 domains (10–15 min).",
  },
  {
    id: "aq10-adolescente",
    respondente_novo: "autorrelato",
    tarefa_tipo: "questionario-fechado",
    lote: "2A",
    justificacao: "AQ-10 Adolescente — Autism Spectrum Quotient 10-item. Self-report by adolescent. Quick screening questionnaire (3–5 min).",
  },
  {
    id: "assq",
    respondente_novo: "misto",
    tarefa_tipo: "questionario-fechado",
    lote: "2A",
    justificacao: "ASSQ — Autism Spectrum Screening Questionnaire. Can be completed by parent OR teacher. Mixed respondent type. Closed-ended format (10 min).",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// LOTE 2B: Teacher + Parent scales (School-based assessments)
// ═══════════════════════════════════════════════════════════════════════════
// Scales administered in school setting or by teacher; often with parent versions.

export const lote2B: ScaleBatch2Entry[] = [
  {
    id: "tea-checklists",
    respondente_novo: "questionario-profissional",
    tarefa_tipo: "questionario-fechado",
    lote: "2B",
    justificacao: "TEA Checklists — Teacher or professional-completed screening for autism symptoms. Closed-ended questionnaire administered in school context.",
  },
  {
    id: "tea-comportamentos",
    respondente_novo: "observacao-clinica-estruturada",
    tarefa_tipo: "observacao-comportamental",
    lote: "2B",
    justificacao: "TEA Comportamentos — Behavioral observation checklist for autism. Structured observation by professional in school/clinic setting.",
  },
  {
    id: "vanderbilt",
    respondente_novo: "questionario-escolar",
    tarefa_tipo: "questionario-fechado",
    lote: "2B",
    justificacao: "Vanderbilt ADHD Rating Scale — Teacher-completed scale assessing ADHD symptoms in school. Closed-ended questionnaire (10–15 min).",
  },
  {
    id: "barkley",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2B",
    justificacao: "Barkley ADHD Rating Scale — Parental version assessing ADHD symptoms at home. Closed-ended questionnaire.",
  },
  {
    id: "hsq",
    respondente_novo: "questionario-escolar",
    tarefa_tipo: "questionario-fechado",
    lote: "2B",
    justificacao: "HSQ — Home Situations Questionnaire variant for teacher. Teacher-completed behavioral rating in school. Closed-ended format.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// LOTE 2C: Multi-modal instruments (Combined questionnaire + observational)
// ═══════════════════════════════════════════════════════════════════════════
// Scales that mix multiple task types (questionnaire + observation + direct test).

export const lote2C: ScaleBatch2Entry[] = [
  {
    id: "brown-add",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2C",
    justificacao: "Brown ADD Rating Scale — Parental ADHD assessment combining symptom checklist with clinical observation elements. Closed-ended questionnaire.",
  },
  {
    id: "masc2",
    respondente_novo: "autorrelato",
    tarefa_tipo: "questionario-fechado",
    lote: "2C",
    justificacao: "MASC-2 — Multidimensional Anxiety Scale for Children 2. Child self-report anxiety questionnaire. Closed-ended format (10–15 min).",
  },
  {
    id: "cdrsr",
    respondente_novo: "questionario-profissional",
    tarefa_tipo: "entrevista-estruturada",
    lote: "2C",
    justificacao: "CDRSR — Cornell Depression Scale Rating Scale. Semi-structured clinical interview assessing depressive symptoms. Clinician-administered (30–40 min).",
  },
  {
    id: "epilepsia-diario",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "diario-registro",
    lote: "2C",
    justificacao: "Epilepsia Diário — Seizure diary for parent/caregiver tracking. Daily log of seizure events (7-day record).",
  },
  {
    id: "qvce50",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2C",
    justificacao: "QVCE-50 — Epilepsy quality of life questionnaire. Parent-completed assessment of child's QoL in epilepsy. Closed-ended format.",
  },
  {
    id: "pedsql-epilepsia",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2C",
    justificacao: "PedsQL Epilepsy — Pediatric Quality of Life Inventory for epilepsy. Parent and child versions; parent-report here. Closed-ended format.",
  },
  {
    id: "qolie-ad",
    respondente_novo: "autorrelato",
    tarefa_tipo: "questionario-fechado",
    lote: "2C",
    justificacao: "QOLIE-AD — Quality of Life in Epilepsy Adolescent version. Self-report questionnaire for adolescents with epilepsy. Closed-ended format.",
  },
  {
    id: "nddie",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2C",
    justificacao: "NDDIE — Newcastle Diagnostic Dyspraxia Interview & Evaluation. Comprehensive parental interview and observation checklist. Mixed questionnaire + observational approach.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// LOTE 2D: Performance tests with professional administration (Mixed modality)
// ═══════════════════════════════════════════════════════════════════════════
// Direct performance tests administered by clinician; some with observation components.

export const lote2D: ScaleBatch2Entry[] = [
  {
    id: "gmfm",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-motor",
    lote: "2D",
    justificacao: "GMFM — Gross Motor Function Measure. Clinician observes and scores child's motor performance across activities. Direct motor performance assessment.",
  },
  {
    id: "ashworth",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-motor",
    lote: "2D",
    justificacao: "Modified Ashworth Scale — Clinician grades muscle tone through passive range of motion. Direct physical assessment (performance-based).",
  },
  {
    id: "cdi-macarthur",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2D",
    justificacao: "CDI MacArthur — Communicative Development Inventory. Parent-report questionnaire of child's vocabulary and grammar. Closed-ended format.",
  },
  {
    id: "reel3",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "2D",
    justificacao: "REEL-3 — Receptive-Expressive Emergent Language Test 3. Clinician administers direct language performance test. Direct assessment of receptive/expressive abilities.",
  },
  {
    id: "celf5",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "2D",
    justificacao: "CELF-5 — Clinical Evaluation of Language Fundamentals 5. Clinician-administered language performance test. Direct assessment of language skills.",
  },
  {
    id: "ppvt4",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "2D",
    justificacao: "PPVT-4 — Peabody Picture Vocabulary Test 4. Clinician-administered receptive vocabulary test. Direct performance assessment.",
  },
  {
    id: "bisq",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2D",
    justificacao: "BISQ — Brief Infant Sleep Questionnaire. Parent-report questionnaire on infant sleep patterns. Closed-ended format.",
  },
  {
    id: "sdsc",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2D",
    justificacao: "SDSC — Sleep Disturbance Scale for Children. Parent-completed sleep disorder screening questionnaire. Closed-ended format.",
  },
  {
    id: "soma",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2D",
    justificacao: "SOMA — Somatic Symptom Scale. Parent-report of child's physical symptoms. Closed-ended questionnaire.",
  },
  {
    id: "eda",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2D",
    justificacao: "EDA — Eating Difficulties Assessment. Parent questionnaire on feeding and swallowing concerns. Closed-ended format.",
  },
  {
    id: "cefaleia-calendario",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "diario-registro",
    lote: "2D",
    justificacao: "Cefaleia Calendário — Headache diary/calendar. Parent or child logs headache episodes over time. Daily record format.",
  },
  {
    id: "pedmidas",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2D",
    justificacao: "PedMIDAS — Pediatric Migraine Disability Assessment. Parent/child questionnaire on migraine impact. Closed-ended format.",
  },
  {
    id: "nepsy2",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "2D",
    justificacao: "NEPSY-2 — Developmental Neuropsychological Assessment 2. Clinician-administered comprehensive neuropsychological test battery. Direct performance assessment.",
  },
  {
    id: "tde",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "2D",
    justificacao: "TDE — Teste de Desempenho Escolar. Clinician-administered academic achievement test in Portuguese. Direct performance assessment of reading, writing, math.",
  },
  {
    id: "prolec",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "2D",
    justificacao: "ProLec — Protocolo de Leitura. Clinician-administered reading assessment. Direct reading performance test.",
  },
  {
    id: "confias",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "tarefa-desempenho-cognitivo",
    lote: "2D",
    justificacao: "CONFIAS — Consciência Fonológica: Instrumento de Avaliação Sequencial. Clinician-administered phonological awareness test. Direct performance assessment.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// LOTE 2E: Specialized scales (Psychiatric, specialty assessments)
// ═══════════════════════════════════════════════════════════════════════════
// Complex instruments requiring clinical judgment; psychiatric, motor, functional.

export const lote2E: ScaleBatch2Entry[] = [
  {
    id: "vineland",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "entrevista-estruturada",
    lote: "2E",
    justificacao: "Vineland Adaptive Behavior Scales. Semi-structured interview with parent/caregiver on adaptive functioning. Parent report via clinical interview (30–60 min).",
  },
  {
    id: "cssrs",
    respondente_novo: "questionario-profissional",
    tarefa_tipo: "entrevista-estruturada",
    lote: "2E",
    justificacao: "C-SSRS — Columbia Suicide Severity Rating Scale (for children). Clinician-administered structured interview on suicidal ideation/behavior. Clinical interview format.",
  },
  {
    id: "ymrs",
    respondente_novo: "questionario-profissional",
    tarefa_tipo: "entrevista-estruturada",
    lote: "2E",
    justificacao: "YMRS — Young Mania Rating Scale. Clinician-administered structured interview assessing manic symptoms. Clinical interview format (15 min).",
  },
  {
    id: "panss-ped",
    respondente_novo: "questionario-profissional",
    tarefa_tipo: "entrevista-estruturada",
    lote: "2E",
    justificacao: "PANSS-PED — Positive and Negative Syndrome Scale for children. Clinician-administered structured interview for psychotic symptoms. Clinical interview format (30–45 min).",
  },
  {
    id: "ygtss",
    respondente_novo: "questionario-profissional",
    tarefa_tipo: "entrevista-estruturada",
    lote: "2E",
    justificacao: "YGTSS — Yale Global Tic Severity Scale. Clinician-administered structured interview assessing tic severity. Clinical interview format (20 min).",
  },
  {
    id: "emdi",
    respondente_novo: "questionario-profissional",
    tarefa_tipo: "entrevista-estruturada",
    lote: "2E",
    justificacao: "EMDI — Escala de Morbidade Diagnóstica Infantil. Clinician-administered diagnostic interview for psychiatric comorbidity. Clinical interview format.",
  },
  {
    id: "pedsql",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2E",
    justificacao: "PedsQL — Pediatric Quality of Life Inventory. Comprehensive health-related QoL questionnaire (parent and child versions; parent-report here). Closed-ended format.",
  },
  {
    id: "pedicat",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "entrevista-estruturada",
    lote: "2E",
    justificacao: "PEDI-CAT — Pediatric Evaluation of Disability Inventory Computer Adaptive Test. Parent interview on child's functional abilities. Adaptive interview format.",
  },
  {
    id: "weefim",
    respondente_novo: "observacao-clinica-estruturada",
    tarefa_tipo: "observacao-comportamental",
    lote: "2E",
    justificacao: "WeeFIM — Functional Independence Measure for children. Clinician observes and rates functional independence in daily activities. Structured observation.",
  },
  {
    id: "napi",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2E",
    justificacao: "NAPI — Neuro-behavioral Activity Profile Inventory. Parental questionnaire on child's neuro-behavioral functioning. Closed-ended format.",
  },
  {
    id: "nnns",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "observacao-comportamental",
    lote: "2E",
    justificacao: "NNNS — NICU Network Neurobehavioral Scale. Clinician performs neurobehavioral assessment of neonates. Direct observation of behavioral responses.",
  },
  {
    id: "nbas",
    respondente_novo: "teste-direto-desempenho",
    tarefa_tipo: "observacao-comportamental",
    lote: "2E",
    justificacao: "NBAS — Neonatal Behavioral Assessment Scale. Clinician observes and scores neonatal behavioral and neurological responses. Structured observation (30 min).",
  },
  {
    id: "cssrs",
    respondente_novo: "questionario-profissional",
    tarefa_tipo: "entrevista-estruturada",
    lote: "2E",
    justificacao: "C-SSRS — Columbia Suicide Severity Rating Scale (for children). Clinician-administered structured interview on suicidal ideation/behavior. Clinical interview format.",
  },
  {
    id: "asq-suicide",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2E",
    justificacao: "ASQ-Suicide — Ask Suicide-Screening Questions (parent version). Parent-completed screening questionnaire for suicide risk. Closed-ended format.",
  },
  {
    id: "siqjr",
    respondente_novo: "autorrelato",
    tarefa_tipo: "questionario-fechado",
    lote: "2E",
    justificacao: "SIQ-JR — Suicidal Ideation Questionnaire Junior. Child self-report questionnaire assessing suicidal ideation. Closed-ended format (15 min).",
  },
  {
    id: "ecar-si",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2E",
    justificacao: "ECAR-SI — Escala de Comportamento Auto/Heteroagressivo com Ideação Suicida. Parent-completed behavioral and suicide risk questionnaire. Closed-ended format.",
  },
  {
    id: "ymrs",
    respondente_novo: "questionario-profissional",
    tarefa_tipo: "entrevista-estruturada",
    lote: "2E",
    justificacao: "YMRS — Young Mania Rating Scale. Clinician-administered structured interview assessing manic symptoms. Clinical interview format (15 min).",
  },
  {
    id: "bprsc",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2E",
    justificacao: "BPRSC — Behavior and Personality Rating Scale for Children. Parental questionnaire on behavioral/personality concerns. Closed-ended format.",
  },
  {
    id: "panss-ped",
    respondente_novo: "questionario-profissional",
    tarefa_tipo: "entrevista-estruturada",
    lote: "2E",
    justificacao: "PANSS-PED — Positive and Negative Syndrome Scale for children. Clinician-administered structured interview for psychotic symptoms. Clinical interview format (30–45 min).",
  },
  {
    id: "ygtss",
    respondente_novo: "questionario-profissional",
    tarefa_tipo: "entrevista-estruturada",
    lote: "2E",
    justificacao: "YGTSS — Yale Global Tic Severity Scale. Clinician-administered structured interview assessing tic severity. Clinical interview format (20 min).",
  },
  {
    id: "aims-efeitos",
    respondente_novo: "observacao-clinica-estruturada",
    tarefa_tipo: "observacao-comportamental",
    lote: "2E",
    justificacao: "AIMS (Efeitos) — Abnormal Involuntary Movement Scale. Clinician observes and rates medication-related movement abnormalities. Structured observation.",
  },
  {
    id: "bars",
    respondente_novo: "observacao-clinica-estruturada",
    tarefa_tipo: "observacao-comportamental",
    lote: "2E",
    justificacao: "BARS — Barnes Akathisia Rating Scale. Clinician observes and interviews about restlessness/akathisia. Observation + brief interview.",
  },
  {
    id: "uku",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2E",
    justificacao: "UKU — Udvalg for Kliniske Undersøgelser (side effects scale). Parent/clinician questionnaire on medication side effects. Closed-ended format.",
  },
  {
    id: "pant",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2E",
    justificacao: "PANT — Pediatric Antipsychotic Medication Side Effect Scale. Parent-reported side effects from antipsychotic medications. Closed-ended format.",
  },
  {
    id: "emdi",
    respondente_novo: "questionario-profissional",
    tarefa_tipo: "entrevista-estruturada",
    lote: "2E",
    justificacao: "EMDI — Escala de Morbidade Diagnóstica Infantil. Clinician-administered diagnostic interview for psychiatric comorbidity. Clinical interview format.",
  },
  {
    id: "eaf",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2E",
    justificacao: "EAF — Escala de Avaliação Funcional. Parental questionnaire on child's functional limitations. Closed-ended format.",
  },
  {
    id: "pdae",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2E",
    justificacao: "PDAE — Parental Distress Assessment for Emotional regulation. Parent-completed questionnaire on child's emotional regulation and parental stress. Closed-ended format.",
  },
  {
    id: "ecsm",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2E",
    justificacao: "ECSM — Escala de Comportamento Social Materno. Parental report on child's social behavior. Closed-ended questionnaire.",
  },
  {
    id: "ips",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2E",
    justificacao: "IPS — Inventário de Problemas Sociais. Parent-completed questionnaire on social/peer problems. Closed-ended format.",
  },
  {
    id: "edi",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2E",
    justificacao: "EDI — Escala de Dificuldades Infantis. Parent questionnaire on child's emotional/behavioral difficulties. Closed-ended format.",
  },
  {
    id: "eai",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2E",
    justificacao: "EAI — Escala de Ansiedade Infantil. Parent/child anxiety questionnaire. Closed-ended format.",
  },
  {
    id: "easi",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2E",
    justificacao: "EASI — Early Adolescent Stress Inventory. Parent/adolescent stress assessment questionnaire. Closed-ended format.",
  },
  {
    id: "ems",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2E",
    justificacao: "EMS — Escala de Morbidade Somatica. Parent questionnaire on child's somatic symptoms. Closed-ended format.",
  },
  {
    id: "etare",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2E",
    justificacao: "ETARE — Escala de Traços Emocionais Refratários. Parent questionnaire on child's emotional resilience. Closed-ended format.",
  },
  {
    id: "eaah",
    respondente_novo: "questionario-parental",
    tarefa_tipo: "questionario-fechado",
    lote: "2E",
    justificacao: "EAAH — Escala de Avaliação de Agressividade Hostilidade. Parent questionnaire on aggression/hostility. Closed-ended format.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// BATCH 2 COMPLETE ARRAY
// ═══════════════════════════════════════════════════════════════════════════

export const scaleBatch2Complete = [
  ...lote2A,
  ...lote2B,
  ...lote2C,
  ...lote2D,
  ...lote2E,
];

// ═══════════════════════════════════════════════════════════════════════════
// BATCH 2 STATISTICS
// ═══════════════════════════════════════════════════════════════════════════

export const scaleBatch2Stats = {
  total: scaleBatch2Complete.length,
  lotes: {
    "2A": lote2A.length,
    "2B": lote2B.length,
    "2C": lote2C.length,
    "2D": lote2D.length,
    "2E": lote2E.length,
  },
  distribution_by_respondent: {
    "questionario-parental": scaleBatch2Complete.filter(
      (e) => e.respondente_novo === "questionario-parental"
    ).length,
    "questionario-escolar": scaleBatch2Complete.filter(
      (e) => e.respondente_novo === "questionario-escolar"
    ).length,
    "questionario-profissional": scaleBatch2Complete.filter(
      (e) => e.respondente_novo === "questionario-profissional"
    ).length,
    "autorrelato": scaleBatch2Complete.filter(
      (e) => e.respondente_novo === "autorrelato"
    ).length,
    "teste-direto-desempenho": scaleBatch2Complete.filter(
      (e) => e.respondente_novo === "teste-direto-desempenho"
    ).length,
    "observacao-clinica-estruturada": scaleBatch2Complete.filter(
      (e) => e.respondente_novo === "observacao-clinica-estruturada"
    ).length,
    "misto": scaleBatch2Complete.filter(
      (e) => e.respondente_novo === "misto"
    ).length,
  },
  distribution_by_tarefa: {
    "questionario-fechado": scaleBatch2Complete.filter(
      (e) => e.tarefa_tipo === "questionario-fechado"
    ).length,
    "pergunta-aberta": scaleBatch2Complete.filter(
      (e) => e.tarefa_tipo === "pergunta-aberta"
    ).length,
    "tarefa-desempenho-cognitivo": scaleBatch2Complete.filter(
      (e) => e.tarefa_tipo === "tarefa-desempenho-cognitivo"
    ).length,
    "tarefa-desempenho-motor": scaleBatch2Complete.filter(
      (e) => e.tarefa_tipo === "tarefa-desempenho-motor"
    ).length,
    "observacao-comportamental": scaleBatch2Complete.filter(
      (e) => e.tarefa_tipo === "observacao-comportamental"
    ).length,
    "entrevista-estruturada": scaleBatch2Complete.filter(
      (e) => e.tarefa_tipo === "entrevista-estruturada"
    ).length,
    "diario-registro": scaleBatch2Complete.filter(
      (e) => e.tarefa_tipo === "diario-registro"
    ).length,
  },
};
