// Filtro Inteligente — Banco de escalas por queixa, idade, respondente e prioridade
import { escalasAutoraisDrJadson } from "./escalasAutorais";
import { escalasImportadasV25Ebook } from "./escalasImportadasV25Ebook";

export type Prioridade = "triagem" | "diagnostica" | "monitorizacao";
export type Respondente = "pais" | "crianca" | "clinico" | "professor" | "autoaplicavel";

export type Licenca = "passiva" | "ativa" | "mista";

export interface ScaleEntry {
  id: string;
  name: string;
  fullName: string;
  ageMin: number;       // months
  ageMax: number;       // months (216 = 18 anos)
  queixas: string[];    // IDs das queixas
  respondente: Respondente[];
  prioridade: Prioridade;
  tempo: string;        // tempo estimado
  appRoute?: string;    // rota no app (se implementada)
  description: string;
  // Campos opcionais de proveniência/curadoria (não usados pelas escalas legadas).
  // Introduzidos na importação SuperNeuroKids v25 + Ebook PANT v7 (2026).
  fonte?: string;                      // citação/origem (PubMed/NICE/AAP/OMS ou ebook)
  licenca?: Licenca;                   // passiva | ativa | mista
  tipo?: string;                       // natureza do instrumento
  pendente_validacao_clinica?: boolean; // true quando algum campo foi inferido/ficou ausente
  pendencia?: string;                  // descrição do que está pendente/inferido
}

export interface QueixaCategory {
  id: string;
  label: string;
  icon: string;         // lucide icon name
  color: string;        // tailwind gradient
  bgLight: string;
  iconColor: string;
}

export const queixas: QueixaCategory[] = [
  { id: "atraso", label: "Atraso do Desenvolvimento", icon: "baby", color: "from-amber-500 to-orange-500", bgLight: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600 dark:text-amber-400" },
  { id: "tea", label: "Autismo / TEA", icon: "puzzle", color: "from-pink-500 to-rose-500", bgLight: "bg-pink-50 dark:bg-pink-950/30", iconColor: "text-pink-600 dark:text-pink-400" },
  { id: "tdah", label: "TDAH", icon: "zap", color: "from-teal-500 to-cyan-500", bgLight: "bg-teal-50 dark:bg-teal-950/30", iconColor: "text-teal-600 dark:text-teal-400" },
  { id: "comportamento", label: "Comportamento / Externalizantes", icon: "flame", color: "from-orange-500 to-red-500", bgLight: "bg-orange-50 dark:bg-orange-950/30", iconColor: "text-orange-600 dark:text-orange-400" },
  { id: "ansiedade", label: "Ansiedade", icon: "alert-triangle", color: "from-indigo-500 to-blue-500", bgLight: "bg-indigo-50 dark:bg-indigo-950/30", iconColor: "text-indigo-600 dark:text-indigo-400" },
  { id: "depressao", label: "Depressão / Humor", icon: "cloud-rain", color: "from-sky-500 to-blue-600", bgLight: "bg-sky-50 dark:bg-sky-950/30", iconColor: "text-sky-600 dark:text-sky-400" },
  { id: "epilepsia", label: "Epilepsia", icon: "activity", color: "from-violet-500 to-purple-600", bgLight: "bg-violet-50 dark:bg-violet-950/30", iconColor: "text-violet-600 dark:text-violet-400" },
  { id: "pc", label: "Paralisia Cerebral / Motor", icon: "accessibility", color: "from-teal-500 to-emerald-500", bgLight: "bg-teal-50 dark:bg-teal-950/30", iconColor: "text-teal-600 dark:text-teal-400" },
  { id: "linguagem", label: "Linguagem / Comunicação", icon: "message-circle", color: "from-blue-500 to-indigo-500", bgLight: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-600 dark:text-blue-400" },
  { id: "sono", label: "Sono", icon: "moon", color: "from-indigo-500 to-purple-600", bgLight: "bg-indigo-50 dark:bg-indigo-950/30", iconColor: "text-indigo-600 dark:text-indigo-400" },
  { id: "alimentacao", label: "Alimentação / Disfagia", icon: "utensils-crossed", color: "from-lime-500 to-green-600", bgLight: "bg-lime-50 dark:bg-lime-950/30", iconColor: "text-lime-600 dark:text-lime-400" },
  { id: "dor", label: "Dor / Cefaleia", icon: "heart-pulse", color: "from-rose-500 to-red-600", bgLight: "bg-rose-50 dark:bg-rose-950/30", iconColor: "text-rose-600 dark:text-rose-400" },
  { id: "cognicao", label: "Cognição / Neuropsicologia", icon: "brain", color: "from-purple-500 to-violet-600", bgLight: "bg-purple-50 dark:bg-purple-950/30", iconColor: "text-purple-600 dark:text-purple-400" },
  { id: "aprendizagem", label: "Aprendizagem / Leitura", icon: "graduation-cap", color: "from-emerald-500 to-green-600", bgLight: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
  { id: "funcionalidade", label: "Funcionalidade / Habilidades Adaptativas", icon: "users", color: "from-cyan-500 to-sky-500", bgLight: "bg-cyan-50 dark:bg-cyan-950/30", iconColor: "text-cyan-600 dark:text-cyan-400" },
  { id: "neonatal", label: "Neonatal / Prematuridade", icon: "baby", color: "from-pink-400 to-rose-400", bgLight: "bg-pink-50 dark:bg-pink-950/30", iconColor: "text-pink-500 dark:text-pink-400" },
  { id: "suicidio", label: "Risco de Suicídio / Autolesão", icon: "shield-alert", color: "from-red-600 to-rose-700", bgLight: "bg-red-50 dark:bg-red-950/30", iconColor: "text-red-600 dark:text-red-400" },
  { id: "psicose", label: "Psicose / Mania", icon: "zap-off", color: "from-fuchsia-500 to-purple-600", bgLight: "bg-fuchsia-50 dark:bg-fuchsia-950/30", iconColor: "text-fuchsia-600 dark:text-fuchsia-400" },
  { id: "tiques", label: "Tiques / Tourette", icon: "sparkles", color: "from-yellow-500 to-orange-500", bgLight: "bg-yellow-50 dark:bg-yellow-950/30", iconColor: "text-yellow-600 dark:text-yellow-400" },
  { id: "efeitos", label: "Efeitos Colaterais / Monitorização", icon: "pill", color: "from-gray-500 to-slate-600", bgLight: "bg-gray-50 dark:bg-gray-950/30", iconColor: "text-gray-600 dark:text-gray-400" },
  { id: "toc", label: "TOC / Obsessões", icon: "repeat", color: "from-purple-500 to-fuchsia-600", bgLight: "bg-purple-50 dark:bg-purple-950/30", iconColor: "text-purple-600 dark:text-purple-400" },
  { id: "trauma", label: "Trauma / TEPT", icon: "shield-alert", color: "from-slate-500 to-gray-700", bgLight: "bg-slate-50 dark:bg-slate-950/30", iconColor: "text-slate-600 dark:text-slate-400" },
  { id: "enurese", label: "Enurese / Eliminação", icon: "droplet", color: "from-cyan-500 to-blue-500", bgLight: "bg-cyan-50 dark:bg-cyan-950/30", iconColor: "text-cyan-600 dark:text-cyan-400" },
  { id: "motor", label: "Coordenação Motora", icon: "move", color: "from-emerald-500 to-teal-600", bgLight: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
  { id: "sensorial", label: "Sensorial / Integração", icon: "hand", color: "from-amber-500 to-yellow-500", bgLight: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600 dark:text-amber-400" },
  { id: "social", label: "Social / Relações", icon: "users", color: "from-blue-500 to-indigo-500", bgLight: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-600 dark:text-blue-400" },
  { id: "autonomia", label: "Autonomia / AVDs", icon: "home", color: "from-cyan-500 to-sky-500", bgLight: "bg-cyan-50 dark:bg-cyan-950/30", iconColor: "text-cyan-600 dark:text-sky-400" },
  { id: "evolucao", label: "Reavaliação / Evolução", icon: "trending-up", color: "from-emerald-500 to-green-600", bgLight: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
];

// Faixas etárias para o filtro (em meses)
export const faixasEtarias = [
  { id: "0-6m", label: "0–6 meses", min: 0, max: 6 },
  { id: "6-12m", label: "6–12 meses", min: 6, max: 12 },
  { id: "1-2a", label: "1–2 anos", min: 12, max: 24 },
  { id: "2-4a", label: "2–4 anos", min: 24, max: 48 },
  { id: "4-6a", label: "4–6 anos", min: 48, max: 72 },
  { id: "6-12a", label: "6–12 anos", min: 72, max: 144 },
  { id: "12-18a", label: "12–18 anos", min: 144, max: 216 },
];

export const scales: ScaleEntry[] = [
  // ===== ATRASO DO DESENVOLVIMENTO =====
  { id: "denver", name: "Denver II", fullName: "Denver Developmental Screening Test II", ageMin: 0, ageMax: 72, queixas: ["atraso", "funcionalidade"], respondente: ["clinico"], prioridade: "triagem", tempo: "15–20 min", appRoute: "/denver", description: "Avalia marcos motores, linguagem, pessoal-social e motor fino-adaptativo." },
  { id: "bayley", name: "Bayley-III", fullName: "Bayley Scales of Infant Development III", ageMin: 1, ageMax: 42, queixas: ["atraso", "neonatal"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–90 min", description: "Padrão-ouro para avaliação cognitiva, motora e de linguagem em lactentes." },
  { id: "griffiths", name: "Griffiths III", fullName: "Griffiths Scales of Child Development III", ageMin: 0, ageMax: 72, queixas: ["atraso"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "40–60 min", description: "Avalia 5 áreas: fundamentos da aprendizagem, linguagem, olho-mão, pessoal-social-emocional e motricidade grossa." },
  { id: "asq3", name: "ASQ-3", fullName: "Ages & Stages Questionnaire 3", ageMin: 1, ageMax: 66, queixas: ["atraso"], respondente: ["pais"], prioridade: "triagem", tempo: "10–15 min", appRoute: "/asq3", description: "Triagem do desenvolvimento em 5 domínios com questionário para pais." },
  { id: "peds", name: "PEDS", fullName: "Parents' Evaluation of Developmental Status", ageMin: 0, ageMax: 96, queixas: ["atraso"], respondente: ["pais"], prioridade: "triagem", tempo: "5 min", description: "10 perguntas de triagem respondidas pelos pais sobre preocupações com o desenvolvimento." },
  { id: "catclams", name: "CAT/CLAMS", fullName: "Clinical Adaptive Test / Clinical Linguistic and Auditory Milestone Scale", ageMin: 0, ageMax: 36, queixas: ["atraso", "linguagem"], respondente: ["clinico"], prioridade: "triagem", tempo: "15–20 min", description: "Avalia desenvolvimento cognitivo e de linguagem em crianças pequenas." },
  { id: "aims", name: "AIMS", fullName: "Alberta Infant Motor Scale", ageMin: 0, ageMax: 18, queixas: ["atraso", "pc"], respondente: ["clinico"], prioridade: "triagem", tempo: "20 min", description: "Avalia desenvolvimento motor grosso de lactentes em posições prono, supino, sentado e de pé." },
  { id: "ims", name: "IMS", fullName: "Escala Motora Infantil de Alberta", ageMin: 0, ageMax: 18, queixas: ["atraso", "pc"], respondente: ["clinico"], prioridade: "triagem", tempo: "20 min", description: "Avaliação observacional do desenvolvimento motor grosso." },
  { id: "timp", name: "TIMP", fullName: "Test of Infant Motor Performance", ageMin: 0, ageMax: 4, queixas: ["atraso", "neonatal", "pc"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "25–35 min", description: "Avalia controle postural e motor em lactentes de risco." },
  { id: "gma", name: "GMA", fullName: "General Movements Assessment", ageMin: 0, ageMax: 5, queixas: ["atraso", "neonatal", "pc"], respondente: ["clinico"], prioridade: "triagem", tempo: "5–10 min", description: "Avaliação da qualidade dos movimentos generalizados do neonato. Padrão-ouro precoce para risco de PC." },

  // ===== TEA =====
  { id: "mchat", name: "M-CHAT-R/F", fullName: "Modified Checklist for Autism in Toddlers - Revised with Follow-Up", ageMin: 16, ageMax: 30, queixas: ["tea"], respondente: ["pais"], prioridade: "triagem", tempo: "5–10 min", appRoute: "/mchat", description: "Rastreio de risco para TEA entre 16 e 30 meses." },
  { id: "cars", name: "CARS-2", fullName: "Childhood Autism Rating Scale 2", ageMin: 24, ageMax: 216, queixas: ["tea"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–20 min", appRoute: "/cars", description: "Classifica a gravidade dos sintomas do espectro autista." },
  { id: "ados2", name: "ADOS-2", fullName: "Autism Diagnostic Observation Schedule 2", ageMin: 12, ageMax: 216, queixas: ["tea"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "40–60 min", description: "Padrão-ouro observacional para diagnóstico de TEA. 5 módulos por nível de linguagem." },
  { id: "adir", name: "ADI-R", fullName: "Autism Diagnostic Interview - Revised", ageMin: 24, ageMax: 216, queixas: ["tea"], respondente: ["pais"], prioridade: "diagnostica", tempo: "90–150 min", description: "Entrevista semiestruturada com cuidadores. Padrão-ouro complementar ao ADOS-2." },
  { id: "scq", name: "SCQ", fullName: "Social Communication Questionnaire", ageMin: 48, ageMax: 216, queixas: ["tea"], respondente: ["pais"], prioridade: "triagem", tempo: "10 min", description: "40 itens derivados do ADI-R. Triagem rápida para TEA." },
  { id: "srs2", name: "SRS-2", fullName: "Social Responsiveness Scale 2", ageMin: 30, ageMax: 216, queixas: ["tea"], respondente: ["pais", "professor"], prioridade: "triagem", tempo: "15–20 min", description: "Quantifica déficits de responsividade social associados ao TEA." },
  { id: "cast", name: "CAST", fullName: "Childhood Autism Spectrum Test", ageMin: 48, ageMax: 132, queixas: ["tea"], respondente: ["pais"], prioridade: "triagem", tempo: "10 min", description: "37 itens para triagem de TEA em idade escolar." },
  { id: "gars3", name: "GARS-3", fullName: "Gilliam Autism Rating Scale 3", ageMin: 36, ageMax: 216, queixas: ["tea"], respondente: ["pais", "clinico"], prioridade: "diagnostica", tempo: "10–15 min", description: "Avalia comportamentos restritos/repetitivos, interação social e comunicação." },
  { id: "atec", name: "ATEC", fullName: "Autism Treatment Evaluation Checklist", ageMin: 24, ageMax: 216, queixas: ["tea"], respondente: ["pais"], prioridade: "monitorizacao", tempo: "10 min", description: "Monitoriza resposta ao tratamento em TEA. 77 itens em 4 subescalas." },
  { id: "assq", name: "ASSQ", fullName: "Autism Spectrum Screening Questionnaire", ageMin: 72, ageMax: 204, queixas: ["tea"], respondente: ["pais", "professor"], prioridade: "triagem", tempo: "10 min", description: "27 itens para triagem de TEA de alto funcionamento / Asperger." },
  { id: "tea-checklists", name: "Checklists TEA", fullName: "ADOS-2, ADI-R, CARS-2, GARS-3, SRS-2 — Resumo Clínico", ageMin: 12, ageMax: 216, queixas: ["tea"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "Variável", appRoute: "/tea", description: "Checklists clínicos adaptados dos 5 principais instrumentos de TEA." },
  { id: "tea-comportamentos", name: "Comport. Atípicos TEA", fullName: "Escala de Comportamentos Atípicos em TEA — 6 Faixas Etárias", ageMin: 0, ageMax: 216, queixas: ["tea", "comportamento"], respondente: ["clinico", "pais"], prioridade: "diagnostica", tempo: "15–25 min", appRoute: "/tea-comportamentos", description: "100 itens observacionais em 6 domínios, por faixa etária (0–18 anos)." },

  // ===== TDAH =====
  { id: "snap", name: "SNAP-IV", fullName: "Swanson, Nolan and Pelham Rating Scale IV", ageMin: 72, ageMax: 216, queixas: ["tdah"], respondente: ["pais", "professor"], prioridade: "triagem", tempo: "10 min", appRoute: "/snap", description: "Avalia desatenção e hiperatividade/impulsividade — 18 itens DSM." },
  { id: "conners", name: "Conners 3", fullName: "Conners Rating Scales 3", ageMin: 72, ageMax: 216, queixas: ["tdah", "comportamento"], respondente: ["pais", "professor", "autoaplicavel"], prioridade: "diagnostica", tempo: "15–20 min", appRoute: "/conners", description: "Problemas de conduta, aprendizagem, queixas somáticas e impulsividade." },
  { id: "vanderbilt", name: "Vanderbilt", fullName: "NICHQ Vanderbilt Assessment Scale", ageMin: 72, ageMax: 144, queixas: ["tdah", "comportamento"], respondente: ["pais", "professor"], prioridade: "triagem", tempo: "10–15 min", appRoute: "/vanderbilt", description: "Escala para pais com domínios de desatenção, hiperatividade e conduta." },
  { id: "brief2", name: "BRIEF-2", fullName: "Behavior Rating Inventory of Executive Function 2", ageMin: 60, ageMax: 216, queixas: ["tdah", "cognicao"], respondente: ["pais", "professor"], prioridade: "diagnostica", tempo: "10–15 min", appRoute: "/brief2", description: "Inibição, flexibilidade, controle emocional, memória de trabalho e planejamento." },
  { id: "barkley", name: "Barkley", fullName: "Barkley Functional Impairment Scale - Children", ageMin: 72, ageMax: 216, queixas: ["tdah"], respondente: ["pais"], prioridade: "monitorizacao", tempo: "10 min", description: "Avalia prejuízo funcional associado ao TDAH em múltiplos contextos." },
  { id: "brown-add", name: "Brown ADD", fullName: "Brown Attention-Deficit Disorder Scales", ageMin: 36, ageMax: 216, queixas: ["tdah"], respondente: ["clinico", "autoaplicavel"], prioridade: "diagnostica", tempo: "15–20 min", description: "Avalia funções executivas e atenção com foco em aspectos cognitivos do TDAH." },

  // ===== COMPORTAMENTO =====
  { id: "cbcl", name: "CBCL", fullName: "Child Behavior Checklist", ageMin: 18, ageMax: 216, queixas: ["comportamento", "tdah", "ansiedade", "depressao"], respondente: ["pais"], prioridade: "triagem", tempo: "15–20 min", appRoute: "/cbcl", description: "Triagem de problemas internalizantes, externalizantes e sociais." },
  { id: "sdq", name: "SDQ", fullName: "Strengths and Difficulties Questionnaire", ageMin: 48, ageMax: 204, queixas: ["comportamento", "tdah", "ansiedade"], respondente: ["pais", "professor", "autoaplicavel"], prioridade: "triagem", tempo: "5–10 min", appRoute: "/sdq", description: "Comportamento pró-social, hiperatividade, emoções, conduta e pares." },
  { id: "abc", name: "ABC", fullName: "Aberrant Behavior Checklist", ageMin: 36, ageMax: 216, queixas: ["comportamento", "tea"], respondente: ["pais", "clinico"], prioridade: "monitorizacao", tempo: "10–15 min", appRoute: "/abc", description: "Irritabilidade, letargia, estereotipia, hiperatividade e fala inadequada." },
  { id: "ecbi", name: "ECBI", fullName: "Eyberg Child Behavior Inventory", ageMin: 24, ageMax: 192, queixas: ["comportamento"], respondente: ["pais"], prioridade: "triagem", tempo: "10 min", description: "36 itens de problemas de conduta com escalas de intensidade e problema." },
  { id: "psc17", name: "PSC-17", fullName: "Pediatric Symptom Checklist 17", ageMin: 48, ageMax: 192, queixas: ["comportamento", "ansiedade", "depressao"], respondente: ["pais"], prioridade: "triagem", tempo: "5 min", description: "Triagem breve de problemas psicossociais em pediatria." },
  { id: "hsq", name: "HSQ", fullName: "Home Situations Questionnaire", ageMin: 48, ageMax: 144, queixas: ["comportamento", "tdah"], respondente: ["pais"], prioridade: "monitorizacao", tempo: "5 min", description: "Avalia problemas de comportamento em 16 situações domésticas." },

  // ===== ANSIEDADE =====
  { id: "scared", name: "SCARED", fullName: "Screen for Child Anxiety Related Disorders", ageMin: 96, ageMax: 216, queixas: ["ansiedade"], respondente: ["autoaplicavel", "pais"], prioridade: "triagem", tempo: "10 min", appRoute: "/scared", description: "Pânico, ansiedade generalizada, separação, fobia social e evitação escolar." },
  { id: "masc2", name: "MASC-2", fullName: "Multidimensional Anxiety Scale for Children 2", ageMin: 96, ageMax: 228, queixas: ["ansiedade"], respondente: ["autoaplicavel"], prioridade: "diagnostica", tempo: "15 min", description: "50 itens em 4 escalas: ansiedade física, evitação de dano, ansiedade social e separação/pânico." },
  { id: "rcads", name: "RCADS", fullName: "Revised Children's Anxiety and Depression Scale", ageMin: 96, ageMax: 216, queixas: ["ansiedade", "depressao"], respondente: ["autoaplicavel", "pais"], prioridade: "triagem", tempo: "10 min", description: "47 itens cobrindo 6 subescalas baseadas no DSM (ansiedade e depressão)." },
  { id: "scas", name: "SCAS", fullName: "Spence Children's Anxiety Scale", ageMin: 36, ageMax: 216, queixas: ["ansiedade"], respondente: ["autoaplicavel", "pais"], prioridade: "triagem", tempo: "10 min", description: "Avalia 6 domínios de ansiedade: separação, social, obsessões, pânico, generalizada, medo de lesão." },
  { id: "staic", name: "STAIC", fullName: "State-Trait Anxiety Inventory for Children", ageMin: 72, ageMax: 168, queixas: ["ansiedade"], respondente: ["autoaplicavel"], prioridade: "diagnostica", tempo: "10 min", description: "Diferencia ansiedade-estado (transitória) de ansiedade-traço (tendência estável)." },
  { id: "gad7ped", name: "GAD-7 Pediátrico", fullName: "Generalized Anxiety Disorder 7 — Versão Pediátrica", ageMin: 96, ageMax: 216, queixas: ["ansiedade"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "3 min", description: "7 itens de triagem rápida para ansiedade generalizada." },

  // ===== DEPRESSÃO =====
  { id: "cdi2", name: "CDI-2", fullName: "Children's Depression Inventory 2", ageMin: 84, ageMax: 204, queixas: ["depressao"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "10–15 min", appRoute: "/cdi2", description: "Inventário de Depressão Infantil — 28 itens." },
  { id: "phqa", name: "PHQ-A", fullName: "Patient Health Questionnaire - Adolescentes", ageMin: 132, ageMax: 204, queixas: ["depressao"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "5 min", appRoute: "/phqa", description: "9 itens para triagem de depressão em adolescentes." },
  { id: "mfq", name: "MFQ", fullName: "Mood and Feelings Questionnaire", ageMin: 72, ageMax: 216, queixas: ["depressao"], respondente: ["autoaplicavel", "pais"], prioridade: "triagem", tempo: "10 min", description: "33 itens avaliando humor depressivo nas últimas 2 semanas." },
  { id: "cdrsr", name: "CDRS-R", fullName: "Children's Depression Rating Scale - Revised", ageMin: 72, ageMax: 144, queixas: ["depressao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–20 min", description: "17 itens aplicados pelo clínico. Padrão-ouro para gravidade de depressão infantil." },
  { id: "rads2", name: "RADS-2", fullName: "Reynolds Adolescent Depression Scale 2", ageMin: 132, ageMax: 216, queixas: ["depressao"], respondente: ["autoaplicavel"], prioridade: "diagnostica", tempo: "10 min", description: "30 itens de autoaplicação para depressão na adolescência." },

  // ===== EPILEPSIA =====
  { id: "epilepsia-diario", name: "Diário de Crises", fullName: "Diário de Crises Epilépticas — Registro e Acompanhamento", ageMin: 0, ageMax: 216, queixas: ["epilepsia"], respondente: ["pais", "clinico"], prioridade: "monitorizacao", tempo: "5 min/registro", appRoute: "/epilepsia", description: "Registro de tipo, duração, consciência, triggers e pós-ictal." },
  { id: "qvce50", name: "QVCE-50", fullName: "Qualidade de Vida da Criança com Epilepsia", ageMin: 24, ageMax: 216, queixas: ["epilepsia"], respondente: ["pais"], prioridade: "monitorizacao", tempo: "15 min", description: "50 itens sobre impacto da epilepsia na qualidade de vida." },
  { id: "hine", name: "HINE", fullName: "Hammersmith Infant Neurological Examination", ageMin: 2, ageMax: 24, queixas: ["epilepsia", "neonatal", "pc"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10–15 min", description: "Exame neurológico padronizado para lactentes — 26 itens." },
  { id: "pedsql-epilepsia", name: "PedsQL Epilepsia", fullName: "PedsQL Epilepsy Module", ageMin: 24, ageMax: 216, queixas: ["epilepsia"], respondente: ["pais", "autoaplicavel"], prioridade: "monitorizacao", tempo: "10 min", description: "Módulo específico de epilepsia do PedsQL." },
  { id: "qolie-ad", name: "QOLIE-AD-48", fullName: "Quality of Life in Epilepsy - Adolescent", ageMin: 132, ageMax: 216, queixas: ["epilepsia"], respondente: ["autoaplicavel"], prioridade: "monitorizacao", tempo: "15 min", description: "Qualidade de vida em epilepsia para adolescentes — 48 itens." },
  { id: "nddie", name: "NDDI-E", fullName: "Neurological Disorders Depression Inventory for Epilepsy", ageMin: 132, ageMax: 216, queixas: ["epilepsia", "depressao"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "3 min", description: "6 itens de triagem de depressão em pacientes com epilepsia." },

  // ===== PARALISIA CEREBRAL / MOTOR =====
  { id: "gmfcs", name: "GMFCS", fullName: "Gross Motor Function Classification System", ageMin: 0, ageMax: 216, queixas: ["pc"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5 min", appRoute: "/gmfcs", description: "Classificação da função motora grossa em PC — 5 níveis." },
  { id: "gmfm", name: "GMFM-88/66", fullName: "Gross Motor Function Measure", ageMin: 0, ageMax: 216, queixas: ["pc"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "45–60 min", description: "88 itens em 5 dimensões motoras. Padrão-ouro para medir função motora na PC." },
  { id: "macs", name: "MACS", fullName: "Manual Ability Classification System", ageMin: 48, ageMax: 216, queixas: ["pc"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5 min", description: "Classifica habilidade manual na PC em 5 níveis." },
  { id: "cfcs", name: "CFCS", fullName: "Communication Function Classification System", ageMin: 24, ageMax: 216, queixas: ["pc", "linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5 min", description: "Classifica a eficácia da comunicação na PC em 5 níveis." },
  { id: "edacs", name: "EDACS", fullName: "Eating and Drinking Ability Classification System", ageMin: 36, ageMax: 216, queixas: ["pc", "alimentacao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5 min", description: "Classifica habilidade alimentar na PC em 5 níveis." },
  { id: "ashworth", name: "Ashworth Modificada", fullName: "Escala de Ashworth Modificada", ageMin: 0, ageMax: 216, queixas: ["pc"], respondente: ["clinico"], prioridade: "monitorizacao", tempo: "5–10 min", description: "Avalia espasticidade muscular em escala 0–4." },

  // ===== LINGUAGEM =====
  { id: "cdi-macarthur", name: "CDI MacArthur", fullName: "MacArthur-Bates Communicative Development Inventories", ageMin: 8, ageMax: 37, queixas: ["linguagem", "atraso"], respondente: ["pais"], prioridade: "triagem", tempo: "20–30 min", description: "Inventário de vocabulário e gestos comunicativos para lactentes e crianças pequenas." },
  { id: "reel3", name: "REEL-3", fullName: "Receptive-Expressive Emergent Language Test 3", ageMin: 0, ageMax: 36, queixas: ["linguagem", "atraso"], respondente: ["clinico", "pais"], prioridade: "diagnostica", tempo: "20 min", description: "Avalia linguagem receptiva e expressiva emergente de 0 a 3 anos." },
  { id: "celf5", name: "CELF-5", fullName: "Clinical Evaluation of Language Fundamentals 5", ageMin: 60, ageMax: 252, queixas: ["linguagem", "aprendizagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–60 min", description: "Avaliação abrangente de linguagem receptiva e expressiva." },
  { id: "ppvt4", name: "PPVT-4", fullName: "Peabody Picture Vocabulary Test 4", ageMin: 30, ageMax: 216, queixas: ["linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15 min", description: "Vocabulário receptivo por identificação de figuras." },

  // ===== SONO =====
  { id: "cshq", name: "CSHQ", fullName: "Children's Sleep Habits Questionnaire", ageMin: 48, ageMax: 120, queixas: ["sono"], respondente: ["pais"], prioridade: "triagem", tempo: "10–15 min", appRoute: "/cshq", description: "Hábitos de sono infantil — 7 domínios de distúrbio." },
  { id: "bisq", name: "BISQ", fullName: "Brief Infant Sleep Questionnaire", ageMin: 0, ageMax: 36, queixas: ["sono"], respondente: ["pais"], prioridade: "triagem", tempo: "5 min", description: "Triagem breve de padrões de sono em lactentes." },
  { id: "bears", name: "BEARS", fullName: "Bedtime, Excessive Daytime Sleepiness, Awakenings, Regularity, Snoring", ageMin: 24, ageMax: 216, queixas: ["sono"], respondente: ["pais", "autoaplicavel"], prioridade: "triagem", tempo: "5 min", description: "5 perguntas-chave para triagem de distúrbios do sono." },
  { id: "sdsc", name: "SDSC", fullName: "Sleep Disturbance Scale for Children", ageMin: 36, ageMax: 216, queixas: ["sono"], respondente: ["pais"], prioridade: "diagnostica", tempo: "10 min", description: "26 itens em 6 categorias de distúrbio do sono." },
  { id: "psq", name: "PSQ", fullName: "Pediatric Sleep Questionnaire", ageMin: 24, ageMax: 216, queixas: ["sono"], respondente: ["pais"], prioridade: "triagem", tempo: "10 min", description: "Triagem de distúrbios respiratórios do sono e sonolência." },

  // ===== ALIMENTAÇÃO =====
  { id: "soma", name: "SOMA", fullName: "Schedule for Oral Motor Assessment", ageMin: 8, ageMax: 24, queixas: ["alimentacao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "20 min", description: "Avaliação padronizada da função motora oral durante alimentação." },
  { id: "eda", name: "EDA", fullName: "Escala de Dificuldade Alimentar", ageMin: 6, ageMax: 72, queixas: ["alimentacao"], respondente: ["pais"], prioridade: "triagem", tempo: "10 min", description: "Triagem de dificuldades alimentares na primeira infância." },

  // ===== DOR / CEFALEIA =====
  { id: "cefaleia-calendario", name: "Calendário de Cefaleia", fullName: "Calendário de Cefaleia — Registro Diário", ageMin: 36, ageMax: 216, queixas: ["dor"], respondente: ["pais", "autoaplicavel"], prioridade: "monitorizacao", tempo: "5 min/registro", appRoute: "/cefaleia", description: "Intensidade, tipo, localização, aura, triggers e resposta medicamentosa." },
  { id: "wongbaker", name: "Wong-Baker FACES", fullName: "Wong-Baker FACES Pain Rating Scale", ageMin: 36, ageMax: 216, queixas: ["dor"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "1 min", description: "6 faces para autoavaliação de intensidade da dor (0–10)." },
  { id: "flacc", name: "FLACC", fullName: "Face, Legs, Activity, Cry, Consolability", ageMin: 0, ageMax: 84, queixas: ["dor"], respondente: ["clinico"], prioridade: "triagem", tempo: "2 min", description: "Avaliação comportamental de dor em crianças pré-verbais." },
  { id: "pedmidas", name: "PedMIDAS", fullName: "Pediatric Migraine Disability Assessment", ageMin: 72, ageMax: 216, queixas: ["dor"], respondente: ["autoaplicavel"], prioridade: "monitorizacao", tempo: "5 min", description: "6 itens avaliando impacto funcional da enxaqueca nos últimos 3 meses." },

  // ===== COGNIÇÃO =====
  { id: "wppsi", name: "WPPSI-IV", fullName: "Wechsler Preschool and Primary Scale of Intelligence IV", ageMin: 24, ageMax: 90, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–60 min", description: "Avaliação de inteligência para pré-escolares — QI verbal, execução e total." },
  { id: "wisc5", name: "WISC-V", fullName: "Wechsler Intelligence Scale for Children V", ageMin: 72, ageMax: 192, queixas: ["cognicao", "aprendizagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "60–90 min", description: "Padrão-ouro para avaliação de inteligência em escolares. 5 índices fatoriais." },
  { id: "leiter3", name: "Leiter-3", fullName: "Leiter International Performance Scale 3", ageMin: 36, ageMax: 216, queixas: ["cognicao", "tea"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–45 min", description: "Avaliação não-verbal de inteligência — útil em TEA e deficiência auditiva." },
  { id: "raven", name: "Raven Colorido", fullName: "Matrizes Progressivas de Raven — Colorido", ageMin: 60, ageMax: 132, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "triagem", tempo: "15–25 min", description: "Raciocínio não-verbal por matrizes progressivas coloridas." },
  { id: "nepsy2", name: "NEPSY-II", fullName: "Neuropsychological Assessment II", ageMin: 36, ageMax: 192, queixas: ["cognicao", "tdah"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "45–90 min", description: "Bateria neuropsicológica: atenção, linguagem, memória, sensório-motor, visuoespacial e social." },

  // ===== APRENDIZAGEM =====
  { id: "tde", name: "TDE", fullName: "Teste de Desempenho Escolar", ageMin: 72, ageMax: 168, queixas: ["aprendizagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "20–30 min", description: "Avalia escrita, aritmética e leitura — padronizado para Brasil." },
  { id: "prolec", name: "PROLEC-SE", fullName: "Provas de Avaliação dos Processos de Leitura", ageMin: 72, ageMax: 144, queixas: ["aprendizagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–40 min", description: "Avalia processos léxicos, sintáticos e semânticos da leitura." },
  { id: "confias", name: "CONFIAS", fullName: "Consciência Fonológica: Instrumento de Avaliação Sequencial", ageMin: 48, ageMax: 96, queixas: ["aprendizagem", "linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "20 min", description: "Avalia consciência fonológica em nível de sílaba e fonema." },

  // ===== FUNCIONALIDADE =====
  { id: "vineland", name: "Vineland-3", fullName: "Vineland Adaptive Behavior Scales 3", ageMin: 0, ageMax: 216, queixas: ["funcionalidade", "tea", "atraso"], respondente: ["pais", "clinico"], prioridade: "diagnostica", tempo: "20–60 min", appRoute: "/vineland", description: "Comunicação, vida diária, socialização e motricidade." },
  { id: "pedsql", name: "PedsQL", fullName: "Pediatric Quality of Life Inventory", ageMin: 24, ageMax: 216, queixas: ["funcionalidade"], respondente: ["pais", "autoaplicavel"], prioridade: "monitorizacao", tempo: "10 min", appRoute: "/pedsql", description: "Funcionamento físico, emocional, social e escolar." },
  { id: "pedicat", name: "PEDI-CAT", fullName: "Pediatric Evaluation of Disability Inventory - CAT", ageMin: 0, ageMax: 252, queixas: ["funcionalidade", "pc"], respondente: ["pais"], prioridade: "diagnostica", tempo: "15 min", description: "Avalia mobilidade, atividades diárias, social/cognitivo e responsabilidade." },
  { id: "weefim", name: "WeeFIM", fullName: "Functional Independence Measure for Children", ageMin: 6, ageMax: 84, queixas: ["funcionalidade", "pc"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–20 min", description: "18 itens de independência funcional: autocuidado, mobilidade e cognição." },

  // ===== NEONATAL =====
  { id: "napi", name: "NAPI", fullName: "Neurobehavioral Assessment of Preterm Infant", ageMin: 0, ageMax: 4, queixas: ["neonatal"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "20 min", description: "Avalia estado comportamental, tônus motor e orientação em RNPT." },
  { id: "nnns", name: "NNNS", fullName: "NICU Network Neurobehavioral Scale", ageMin: 0, ageMax: 2, queixas: ["neonatal"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "20–30 min", description: "115 itens avaliando neurointegridade, maturidade e estresse em RN de risco." },
  { id: "nbas", name: "NBAS", fullName: "Neonatal Behavioral Assessment Scale (Brazelton)", ageMin: 0, ageMax: 2, queixas: ["neonatal"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "20–30 min", description: "Avalia capacidades comportamentais e reflexos do neonato a termo." },

  // ===== RISCO SUICÍDIO =====
  { id: "cssrs", name: "C-SSRS", fullName: "Columbia Suicide Severity Rating Scale", ageMin: 72, ageMax: 216, queixas: ["suicidio", "depressao"], respondente: ["clinico"], prioridade: "triagem", tempo: "5–10 min", appRoute: "/cssrs", description: "Escala Columbia — 6 níveis de gravidade de ideação suicida." },
  { id: "asq-suicide", name: "ASQ", fullName: "Ask Suicide-Screening Questions", ageMin: 120, ageMax: 216, queixas: ["suicidio"], respondente: ["clinico"], prioridade: "triagem", tempo: "2 min", description: "4 perguntas de triagem rápida de risco suicida em emergência." },
  { id: "siqjr", name: "SIQ-Jr", fullName: "Suicidal Ideation Questionnaire - Junior", ageMin: 84, ageMax: 168, queixas: ["suicidio"], respondente: ["autoaplicavel"], prioridade: "diagnostica", tempo: "10 min", description: "15 itens de autoavaliação de ideação suicida em crianças e adolescentes." },
  { id: "ecar-si", name: "ECAR-SI J26", fullName: "Escala Clínica de Avaliação de Risco — Suicidalidade Infantojuvenil", ageMin: 0, ageMax: 216, queixas: ["suicidio"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–20 min", appRoute: "/ecar-si", description: "36 itens, 9 blocos (8 risco + 1 proteção), alarmes clínicos e conduta." },

  // ===== PSICOSE / MANIA =====
  { id: "ymrs", name: "YMRS", fullName: "Young Mania Rating Scale", ageMin: 60, ageMax: 216, queixas: ["psicose"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–20 min", description: "11 itens avaliando gravidade de mania — humor, atividade, sono, fala, pensamento." },
  { id: "bprsc", name: "BPRS-C", fullName: "Brief Psychiatric Rating Scale for Children", ageMin: 60, ageMax: 216, queixas: ["psicose", "comportamento"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–20 min", description: "21 itens de sintomas psiquiátricos: ansiedade, depressão, psicose, hostilidade." },
  { id: "panss-ped", name: "PANSS Pediátrico", fullName: "Positive and Negative Syndrome Scale — Pediátrico", ageMin: 72, ageMax: 216, queixas: ["psicose"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–40 min", description: "30 itens: sintomas positivos, negativos e psicopatologia geral." },

  // ===== TIQUES =====
  { id: "ygtss", name: "YGTSS", fullName: "Yale Global Tic Severity Scale", ageMin: 36, ageMax: 216, queixas: ["tiques"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–20 min", appRoute: "/ygtss", description: "Tiques motores e vocais: número, frequência, intensidade, complexidade e interferência." },

  // ===== EFEITOS COLATERAIS =====
  { id: "aims-efeitos", name: "AIMS", fullName: "Abnormal Involuntary Movement Scale", ageMin: 0, ageMax: 216, queixas: ["efeitos"], respondente: ["clinico"], prioridade: "monitorizacao", tempo: "10 min", description: "12 itens avaliando movimentos involuntários — discinesia tardia." },
  { id: "bars", name: "BARS", fullName: "Barnes Akathisia Rating Scale", ageMin: 0, ageMax: 216, queixas: ["efeitos"], respondente: ["clinico"], prioridade: "monitorizacao", tempo: "5 min", description: "4 itens de avaliação global e objetiva de acatisia." },
  { id: "uku", name: "UKU", fullName: "UKU Side Effect Rating Scale", ageMin: 0, ageMax: 216, queixas: ["efeitos"], respondente: ["clinico"], prioridade: "monitorizacao", tempo: "15 min", description: "48 itens de efeitos colaterais psiquiátricos, neurológicos, autonômicos e outros." },

  // ===== SUBSTÂNCIAS =====
  { id: "crafft", name: "CRAFFT", fullName: "Car, Relax, Alone, Forget, Friends, Trouble", ageMin: 144, ageMax: 252, queixas: ["comportamento", "substancias"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "5 min", appRoute: "/crafft", description: "Screening de uso de álcool e drogas para adolescentes." },

  // ===== PANT E BATERIAS DR. JADSON =====
  { id: "pant", name: "PANT", fullName: "Protocolo de Avaliação do Neurodesenvolvimento Típico — 100 Escalas", ageMin: 0, ageMax: 216, queixas: ["atraso", "funcionalidade", "tea"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–60 min", appRoute: "/pant", description: "100 escalas passivas em 5 macrodomínios: comunicação, linguagem, executiva, sensorial, emocional." },
  { id: "emdi", name: "EMDI", fullName: "Escala Médica do Desenvolvimento Infantil", ageMin: 12, ageMax: 72, queixas: ["atraso"], respondente: ["clinico"], prioridade: "triagem", tempo: "10 min", appRoute: "/emdi", description: "Triagem estruturada do desenvolvimento infantil — Bateria Dr. Jadson." },
  { id: "eaf", name: "EAF", fullName: "Escala de Adaptação Funcional", ageMin: 24, ageMax: 216, queixas: ["funcionalidade"], respondente: ["pais", "clinico"], prioridade: "diagnostica", tempo: "10 min", appRoute: "/eaf", description: "Adaptação funcional em contextos diários — Bateria Dr. Jadson." },
  { id: "pdae", name: "PDAE", fullName: "Protocolo de Desempenho Acadêmico e Escolar", ageMin: 72, ageMax: 216, queixas: ["aprendizagem"], respondente: ["professor", "pais"], prioridade: "triagem", tempo: "10 min", appRoute: "/pdae", description: "Desempenho acadêmico e escolar — Bateria Dr. Jadson." },
  { id: "ecsm", name: "ECSM", fullName: "Escala de Cognição Social e Mentalização", ageMin: 48, ageMax: 216, queixas: ["tea", "cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10 min", appRoute: "/ecsm", description: "Cognição social e metacognição — Bateria Dr. Jadson." },
  { id: "ips", name: "IPS", fullName: "Inventário de Processamento Sensorial", ageMin: 24, ageMax: 144, queixas: ["tea", "atraso"], respondente: ["pais"], prioridade: "triagem", tempo: "10 min", appRoute: "/ips", description: "Processamento sensorial — Bateria Dr. Jadson." },
  { id: "edi", name: "EDI-J26", fullName: "Escala de Depressão Infantil — Bateria Dr. Jadson", ageMin: 48, ageMax: 216, queixas: ["depressao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10 min", appRoute: "/edi", description: "24 itens de depressão infantil — Bateria de Regulação Emocional." },
  { id: "eai", name: "EAI-J26", fullName: "Escala de Ansiedade Infantil — Bateria Dr. Jadson", ageMin: 48, ageMax: 216, queixas: ["ansiedade"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10 min", appRoute: "/eai", description: "20 itens de ansiedade infantil — Bateria de Regulação Emocional." },
  { id: "easi", name: "EASI-J26", fullName: "Escala de Ansiedade Social Infantil — Bateria Dr. Jadson", ageMin: 48, ageMax: 216, queixas: ["ansiedade"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10 min", appRoute: "/easi", description: "15 itens de ansiedade social infantil — Bateria de Regulação Emocional." },
  { id: "ems", name: "EMS-J26", fullName: "Escala de Mutismo Seletivo — Bateria Dr. Jadson", ageMin: 24, ageMax: 144, queixas: ["ansiedade", "linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10 min", appRoute: "/ems", description: "15 itens de mutismo seletivo — Bateria de Regulação Emocional." },
  { id: "etare", name: "ETARE-J26", fullName: "Escala de Transtorno Alimentar Restritivo Evitativo — Bateria Dr. Jadson", ageMin: 24, ageMax: 216, queixas: ["alimentacao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10 min", appRoute: "/etare", description: "18 itens de TARE — Bateria de Regulação Emocional." },
  { id: "eaah", name: "EAAH-J26", fullName: "Escala de Autoagressividade e Heteroagressividade — Bateria Dr. Jadson", ageMin: 36, ageMax: 216, queixas: ["comportamento", "suicidio"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10 min", appRoute: "/eaah", description: "20 itens de agressividade — Bateria de Regulação Emocional." },

  // ===== COGNIÇÃO / NEUROPSICOLOGIA (novas) =====
  { id: "wisc5-ext", name: "WISC-V", fullName: "Wechsler Intelligence Scale for Children V", ageMin: 72, ageMax: 192, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "60–90 min", description: "Avalia inteligência em 5 índices fatoriais: compreensão verbal, visual-espacial, raciocínio fluido, memória de trabalho e velocidade de processamento." },
  { id: "wppsi4-ext", name: "WPPSI-IV", fullName: "Wechsler Preschool and Primary Scale of Intelligence IV", ageMin: 24, ageMax: 84, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–60 min", description: "Bateria de inteligência para pré-escolares com índices de compreensão verbal, visual-espacial, fluido, memória de trabalho e velocidade de processamento." },
  { id: "leiter3-ext", name: "Leiter-3", fullName: "Leiter International Performance Scale 3", ageMin: 36, ageMax: 900, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30 min", description: "Avaliação não-verbal de inteligência e memória. Indicada para crianças com barreira de linguagem, surdes ou TEA." },
  { id: "toni4", name: "TONI-4", fullName: "Test of Nonverbal Intelligence 4", ageMin: 72, ageMax: 1068, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–20 min", description: "Teste de inteligência não-verbal com resposta gestual; mínima dependência de linguagem ou motricidade." },
  { id: "cpt3", name: "CPT-3", fullName: "Conners Continuous Performance Test 3", ageMin: 96, ageMax: 216, queixas: ["cognicao", "tdah"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "14 min", description: "Avalia atenção sustentada, impulsividade e vigilidade por desempenho computadorizado em 14 minutos." },
  { id: "sb5", name: "Stanford-Binet 5", fullName: "Stanford-Binet Intelligence Scales 5", ageMin: 24, ageMax: 1020, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "45–60 min", description: "Avalia 5 fatores cognitivos: raciocínio fluido, conhecimento, processamento quantitativo, processamento visual-espacial e memória de trabalho." },
  { id: "raven-std", name: "Raven Matrizes", fullName: "Matrizes Progressivas de Raven — Escala Geral", ageMin: 60, ageMax: 132, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "triagem", tempo: "20–30 min", description: "Avalia raciocínio não-verbal e educação da relação por matrizes progressivas. Amplamente utilizado como triagem de QI." },
  { id: "kabc2", name: "K-ABC-II", fullName: "Kaufman Assessment Battery for Children II", ageMin: 36, ageMax: 216, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–70 min", description: "Bateria cognitiva com dois modelos interpretativos (Luria e CHC). Avalia processamento sequencial, simultâneo, aprendizagem e planejamento." },
  { id: "wcst", name: "WCST", fullName: "Wisconsin Card Sorting Test", ageMin: 72, ageMax: 1068, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "20–30 min", description: "Avalia flexibilidade cognitiva, formação de conceitos e função do lóbulo frontal por classificação de cartões." },
  { id: "tmt", name: "Trail Making A e B", fullName: "Trail Making Test A e B", ageMin: 108, ageMax: 216, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5–10 min", description: "Avalia velocidade de processamento, atenção e flexibilidade cognitiva. Parte A: sequenciamento; parte B: alternância." },
  { id: "stroop", name: "Stroop", fullName: "Stroop Color and Word Test", ageMin: 84, ageMax: 216, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5 min", description: "Avalia inibição de resposta, atenção seletiva e velocidade de processamento pelo efeito de interferência cor-palavra." },
  { id: "rey-figure", name: "Figura de Rey", fullName: "Rey Complex Figure Test", ageMin: 72, ageMax: 216, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10–20 min", description: "Avalia organização perceptiva, planejamento e memória visual por cópia e evocação de figura complexa." },
  { id: "ravlt", name: "RAVLT", fullName: "Rey Auditory Verbal Learning Test", ageMin: 84, ageMax: 216, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15 min", description: "Avalia aprendizagem verbal, memória episódica e suscetibilidade à interferência por listas de palavras." },
  { id: "fas-fluencia", name: "FAS Fluência Verbal", fullName: "Teste de Fluência Verbal FAS", ageMin: 72, ageMax: 216, queixas: ["cognicao", "linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5 min", description: "Avalia fluência verbal fonológica (letras F, A, S) e semântica. Sensivel a disfunções frontais e de linguagem." },
  { id: "torre-londres", name: "Torre de Londres", fullName: "Tower of London Test", ageMin: 84, ageMax: 216, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10–15 min", description: "Avalia planejamento, solução de problemas e funções executivas por tarefa de movimento de discos em pinos." },
  { id: "d2", name: "d2 Cancelamento", fullName: "Teste de Cancelamento d2", ageMin: 108, ageMax: 720, queixas: ["cognicao", "tdah"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "8 min", description: "Avalia atenção concentrada, velocidade de processamento e controle inibitório por tarefa de cancelamento de símbolos." },

  // ===== LINGUAGEM (novas) =====
  { id: "celf5-new", name: "CELF-5", fullName: "Clinical Evaluation of Language Fundamentals 5", ageMin: 60, ageMax: 252, queixas: ["linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–60 min", description: "Avaliação clínica de fundamentos da linguagem: estrutura de frases, conceitos e direções, recado, repetição de frases e compreensão de palavras." },
  { id: "pls5", name: "PLS-5", fullName: "Preschool Language Scales 5", ageMin: 0, ageMax: 84, queixas: ["linguagem"], respondente: ["clinico"], prioridade: "triagem", tempo: "20–45 min", description: "Avalia habilidades de comunicação pré-verbal e verbal em crianças pequenas: atenção auditiva e habilidades expressivas." },
  { id: "ppvt4-new", name: "PPVT-4 Peabody", fullName: "Peabody Picture Vocabulary Test 4", ageMin: 30, ageMax: 1080, queixas: ["linguagem", "cognicao"], respondente: ["clinico"], prioridade: "triagem", tempo: "10–15 min", description: "Avalia vocabulário receptivo por identificação de figuras. Não requer resposta verbal; útil em crianças não-verbais." },
  { id: "told-p5", name: "TOLD-P:5", fullName: "Test of Language Development Primary 5", ageMin: 48, ageMax: 96, queixas: ["linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–60 min", description: "Bateria de linguagem para pré-escolares e escolares iniciais: vocabulário, morfologia, sintaxe e fonologia." },
  { id: "ctopp2", name: "CTOPP-2", fullName: "Comprehensive Test of Phonological Processing 2", ageMin: 48, ageMax: 288, queixas: ["linguagem", "aprendizagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30 min", description: "Avalia consciência fonológica, memória fonológica e velocidade de nomeação. Essencial para investigação de dislexia." },
  { id: "abfw-fono", name: "ABFW Fonologia", fullName: "Teste de Linguagem Infantil ABFW — Fonologia", ageMin: 36, ageMax: 144, queixas: ["linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "20 min", description: "Avalia o sistema fonológico da criança por nomeação de figuras. Padronizado para o Português Brasileiro." },
  { id: "token-test", name: "Token Test", fullName: "Token Test Pediátrico", ageMin: 36, ageMax: 144, queixas: ["linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10 min", description: "Avalia compreensão auditiva de ordens simples e complexas com tokens coloridos. Sensivel a afasias e atrasos de linguagem." },
  { id: "eowpvt4", name: "EOWPVT-4", fullName: "Expressive One-Word Picture Vocabulary Test 4", ageMin: 24, ageMax: 960, queixas: ["linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–20 min", description: "Avalia vocabulário expressivo por nomeação de figuras. Complementar ao PPVT para perfil receptivo-expressivo." },
  { id: "adl3", name: "ADL-3", fullName: "Auditory and Language Disorders Test 3", ageMin: 0, ageMax: 132, queixas: ["linguagem"], respondente: ["clinico"], prioridade: "triagem", tempo: "15–20 min", description: "Triagem de distúrbios de linguagem auditiva em crianças de 0 a 11 anos." },
  { id: "disc-auditiva", name: "Discriminação Auditiva", fullName: "Teste de Discriminação Auditiva", ageMin: 48, ageMax: 96, queixas: ["linguagem"], respondente: ["clinico"], prioridade: "triagem", tempo: "10 min", description: "Avalia a capacidade da criança de diferenciar pares de sons e palavras semelhantes. Indicado na investigação de dificuldades fonológicas." },

  // ===== MOTOR / COORDENAÇÃO (novas) =====
  { id: "mabc2", name: "MABC-2", fullName: "Movement Assessment Battery for Children 2", ageMin: 36, ageMax: 192, queixas: ["motor", "pc"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "20–30 min", description: "Avalia destreza manual, lançar e pegar bola e equilíbrio estático/dinâmico. Padrão-ouro para Transtorno do Desenvolvimento da Coordenação Motora." },
  { id: "bot2", name: "BOT-2", fullName: "Bruininks-Oseretsky Test of Motor Proficiency 2", ageMin: 48, ageMax: 252, queixas: ["motor"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "45–60 min", description: "Bateria abrangente de proficiência motora grossa e fina em 8 subáreas para crianças e adultos jovens." },
  { id: "pdms2", name: "PDMS-2", fullName: "Peabody Developmental Motor Scales 2", ageMin: 0, ageMax: 60, queixas: ["motor", "atraso"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "45–60 min", description: "Avalia desenvolvimento motor grosso e fino de 0 a 5 anos. Fornece quocientes motores padronizados." },
  { id: "beery-vmi", name: "Beery VMI", fullName: "Beery-Buktenica Developmental Test of Visual-Motor Integration", ageMin: 24, ageMax: 216, queixas: ["motor", "aprendizagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10–15 min", description: "Avalia integração visomotora, percepção visual e coordenação motora por cópia de figuras geométricas." },
  { id: "hammersmith-infant", name: "Hammersmith Infant", fullName: "Hammersmith Infant Neurological Examination", ageMin: 2, ageMax: 24, queixas: ["motor", "pc", "neonatal"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10–15 min", description: "Exame neurológico padronizado para lactentes. Prediz PC e desfechos motores com alta sensibilidade." },
  { id: "pedi-cat", name: "PEDI-CAT", fullName: "Pediatric Evaluation of Disability Inventory Computer Adaptive Test", ageMin: 0, ageMax: 240, queixas: ["pc", "funcionalidade"], respondente: ["clinico", "pais"], prioridade: "diagnostica", tempo: "10–15 min", description: "Versão computadorizada adaptativa do PEDI. Avalia função diária em atividades, mobilidade, social-cognitivo e responsabilidade." },
  { id: "tgmd3", name: "TGMD-3", fullName: "Test of Gross Motor Development 3", ageMin: 36, ageMax: 120, queixas: ["motor"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–20 min", description: "Avalia habilidades motoras grossas locomotoras e de controle de objetos em crianças de 3 a 10 anos." },
  { id: "sfa", name: "SFA", fullName: "School Function Assessment", ageMin: 60, ageMax: 144, queixas: ["funcionalidade", "aprendizagem"], respondente: ["clinico", "professor"], prioridade: "diagnostica", tempo: "15–20 min", description: "Avalia participação escolar, suporte necessário e desempenho em atividades acadêmicas e funcionais na escola." },

  // ===== EPILEPSIA (novas) =====
  { id: "lsss", name: "LSSS", fullName: "Liverpool Seizure Severity Scale", ageMin: 72, ageMax: 216, queixas: ["epilepsia"], respondente: ["autoaplicavel", "pais"], prioridade: "monitorizacao", tempo: "10 min", description: "Avalia a gravidade subjetiva das crises epilépticas: controle ictal, efeitos pós-ictais e impacto na vida diária." },
  { id: "nddi-e-new", name: "NDDI-E", fullName: "Neurological Disorders Depression Inventory for Epilepsy", ageMin: 144, ageMax: 216, queixas: ["epilepsia", "depressao"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "5 min", description: "6 itens de triagem rápida para depressão em pacientes com epilepsia, diferenciando de efeitos do tratamento." },
  { id: "qolie31", name: "QOLIE-31", fullName: "Quality of Life in Epilepsy 31", ageMin: 144, ageMax: 216, queixas: ["epilepsia"], respondente: ["autoaplicavel"], prioridade: "monitorizacao", tempo: "10 min", description: "31 itens avaliando qualidade de vida em epilepsia: preocupações com crises, bem-estar emocional, energia, cognição e efeitos da medicação." },
  { id: "qolie-ad48", name: "QOLIE-AD-48", fullName: "Quality of Life in Epilepsy for Adolescents 48", ageMin: 132, ageMax: 204, queixas: ["epilepsia"], respondente: ["autoaplicavel"], prioridade: "monitorizacao", tempo: "15 min", description: "48 itens de qualidade de vida em epilepsia adaptados para adolescentes, incluindo impacto escolar e social." },
  { id: "engel", name: "Engel Classification", fullName: "Engel Seizure Outcome Scale", ageMin: 0, ageMax: 216, queixas: ["epilepsia"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5 min", description: "Classifica desfecho de crises após cirurgia de epilepsia em 4 classes (I: livre de crises; IV: sem melhora)." },
  { id: "hague-szs", name: "Hague Seizure Severity", fullName: "Hague Seizure Severity Scale", ageMin: 48, ageMax: 192, queixas: ["epilepsia"], respondente: ["pais", "clinico"], prioridade: "monitorizacao", tempo: "5 min", description: "Avalia gravidade e freqüência das crises em crianças com epilepsia, considerando estado pós-ictal e recuperação." },
  { id: "chalfont", name: "Chalfont", fullName: "Escala de Chalfont de Gravidade de Crises", ageMin: 0, ageMax: 216, queixas: ["epilepsia"], respondente: ["clinico", "pais"], prioridade: "monitorizacao", tempo: "10 min", description: "Avalia gravidade global das crises epilépticas considerando frequência, duração, estado pós-ictal e tipo de crise." },
  { id: "ipes", name: "IPES", fullName: "Impact of Pediatric Epilepsy Scale", ageMin: 24, ageMax: 216, queixas: ["epilepsia"], respondente: ["pais"], prioridade: "monitorizacao", tempo: "10 min", description: "Avalia o impacto da epilepsia pediátrica nas atividades diárias, educação, desenvolvimento e bem-estar familiar." },

  // ===== NEONATAL (novas) =====
  { id: "dubowitz", name: "Dubowitz Neurológico", fullName: "Dubowitz Neurological Examination for the Newborn", ageMin: 0, ageMax: 12, queixas: ["neonatal"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15 min", description: "Exame neurológico padronizado para recém-nascidos, avaliando reflexos, tono e comportamento." },
  { id: "ballard", name: "Ballard", fullName: "New Ballard Score", ageMin: 0, ageMax: 0, queixas: ["neonatal"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5 min", description: "Avalia maturidade neuromuscular e física do recém-nascido para estimar idade gestacional ao nascimento." },
  { id: "apgar", name: "APGAR", fullName: "APGAR Score", ageMin: 0, ageMax: 0, queixas: ["neonatal"], respondente: ["clinico"], prioridade: "triagem", tempo: "1 min", description: "Avalia vitalidade do recém-nascido no 1º e 5º minuto de vida: aparência, pulso, grimacea, atividade e respiração." },
  { id: "snappe2", name: "SNAPPE-II", fullName: "Score for Neonatal Acute Physiology Perinatal Extension II", ageMin: 0, ageMax: 1, queixas: ["neonatal"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5 min", description: "Pontuacao de gravidade neonatal nas primeiras 12h de vida. Prediz mortalidade e morbidade em UTI neonatal." },
  { id: "crib2", name: "CRIB-II", fullName: "Clinical Risk Index for Babies II", ageMin: 0, ageMax: 0, queixas: ["neonatal"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5 min", description: "Avalia risco clínico de recém-nascidos pré-termo nas primeiras 12 horas. Considera sexo, idade gestacional, peso e temperatura." },

  // ===== DOR (novas) =====
  { id: "wong-baker-new", name: "Wong-Baker FACES", fullName: "Wong-Baker FACES Pain Rating Scale", ageMin: 36, ageMax: 216, queixas: ["dor"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "1 min", description: "Seis faces ilustradas para autoavaliação de intensidade de dor em crianças a partir de 3 anos, variando de sem dor a dor máxima." },
  { id: "flacc-new", name: "FLACC", fullName: "Face, Legs, Activity, Cry, Consolability Scale", ageMin: 0, ageMax: 84, queixas: ["dor"], respondente: ["clinico"], prioridade: "triagem", tempo: "2 min", description: "Avalia dor comportamental em crianças pré-verbais observando face, pernas, atividade, choro e consolabilidade (0–10)." },
  { id: "cries", name: "CRIES", fullName: "Crying Requires Oxygen Increased Vital Signs Expression Sleepless Scale", ageMin: 0, ageMax: 6, queixas: ["dor", "neonatal"], respondente: ["clinico"], prioridade: "triagem", tempo: "2 min", description: "Avalia dor pós-operatória neonatal por choro, saturação, sinais vitais, expressão facial e sonolencia." },
  { id: "nips", name: "NIPS", fullName: "Neonatal Infant Pain Scale", ageMin: 0, ageMax: 12, queixas: ["dor", "neonatal"], respondente: ["clinico"], prioridade: "triagem", tempo: "1 min", description: "6 indicadores comportamentais de dor em recém-nascidos: expressão facial, choro, respiração, braços, pernas e estado." },
  { id: "rflacc", name: "r-FLACC", fullName: "Revised FLACC Scale", ageMin: 48, ageMax: 216, queixas: ["dor", "pc"], respondente: ["clinico"], prioridade: "triagem", tempo: "2 min", description: "Versão revisada do FLACC para crianças com deficiência intelectual ou incapacidades comunicativas." },
  { id: "eva-ped", name: "EVA Pediátrica", fullName: "Escala Visual Analógica Pediátrica", ageMin: 84, ageMax: 216, queixas: ["dor"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "1 min", description: "Linha horizontal de 10cm com ancora verbal/visual. Requer compreensão abstrata; indicada a partir de 7 anos." },
  { id: "ppp", name: "PPP", fullName: "Paediatric Pain Profile", ageMin: 12, ageMax: 216, queixas: ["dor", "pc"], respondente: ["pais", "clinico"], prioridade: "monitorizacao", tempo: "5 min", description: "20 itens comportamentais para avaliação de dor em crianças com deficiência intelectual ou comunicação limitada." },
  { id: "comfort-b", name: "COMFORT-B", fullName: "COMFORT-Behavioral Scale", ageMin: 0, ageMax: 216, queixas: ["dor", "neonatal"], respondente: ["clinico"], prioridade: "triagem", tempo: "2 min", description: "Avalia distúress e dor em UTI pediátrica/neonatal por 6 comportamentos observacionais. Amplamente validada para pacientes não-verbais." },

  // ===== SONO ADICIONAL =====
  { id: "psq-new", name: "PSQ", fullName: "Pediatric Sleep Questionnaire", ageMin: 24, ageMax: 216, queixas: ["sono"], respondente: ["pais"], prioridade: "triagem", tempo: "5 min", description: "22 itens para triagem de distúrbios respiratórios do sono, hiperatividade e sonolência diurna em crianças." },
  { id: "bears-new", name: "BEARS", fullName: "Bedtime, Excessive Daytime Sleepiness, Awakenings, Regularity, Snoring", ageMin: 24, ageMax: 216, queixas: ["sono"], respondente: ["pais", "autoaplicavel"], prioridade: "triagem", tempo: "5 min", description: "5 perguntas de triagem de distúrbios do sono adaptadas para cada faixa etária pediátrica." },
  { id: "ess-adol", name: "ESS Adolescente", fullName: "Epworth Sleepiness Scale — Versão Adolescente Modificada", ageMin: 144, ageMax: 216, queixas: ["sono"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "5 min", description: "8 situações cotidianas para medir sonolência diurna excessiva em adolescentes." },
  { id: "psqi-ped", name: "PSQI Pediátrico", fullName: "Pittsburgh Sleep Quality Index — Adaptado Pediátrico", ageMin: 96, ageMax: 216, queixas: ["sono"], respondente: ["autoaplicavel", "pais"], prioridade: "monitorizacao", tempo: "10 min", description: "Avalia qualidade subjetiva do sono no último mês: latência, duração, eficiência, distúrbios e sonolência diurna." },
  { id: "sdsc-new", name: "SDSC", fullName: "Sleep Disturbance Scale for Children", ageMin: 36, ageMax: 216, queixas: ["sono"], respondente: ["pais"], prioridade: "diagnostica", tempo: "10 min", description: "26 itens classificando distúrbios do sono em 6 categorias: iniciação/manutenção, respiratórios, arousáis, transição sono-vigília, sonolência excessiva e hiperidrose." },

  // ===== TOC =====
  { id: "cybocs", name: "CY-BOCS", fullName: "Children’s Yale-Brown Obsessive Compulsive Scale", ageMin: 72, ageMax: 204, queixas: ["toc"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–30 min", description: "Padrão-ouro para avaliação de gravidade de TOC em crianças e adolescentes. 10 itens em obsessões e compulsões." },
  { id: "oci-cv", name: "OCI-CV", fullName: "Obsessive Compulsive Inventory — Child Version", ageMin: 84, ageMax: 204, queixas: ["toc"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "10 min", description: "21 itens de triagem de sintomas obsessivo-compulsivos em crianças e adolescentes. Versão pediátrica do OCI." },
  { id: "docs", name: "DOCS", fullName: "Dimensional Obsessive-Compulsive Scale", ageMin: 144, ageMax: 216, queixas: ["toc"], respondente: ["autoaplicavel"], prioridade: "monitorizacao", tempo: "10 min", description: "20 itens avaliando 4 dimensões de TOC: contaminãção, responsabilidade/dano, inaceitável/intrusivo e simetria." },
  { id: "cybocs-sr", name: "CY-BOCS-SR", fullName: "Children’s Yale-Brown OCS — Self-Report", ageMin: 96, ageMax: 204, queixas: ["toc"], respondente: ["autoaplicavel"], prioridade: "monitorizacao", tempo: "10 min", description: "Versão de autoavaliacão do CY-BOCS para monitorização de sintomas em crianças a partir de 8 anos." },
  { id: "fas-pr", name: "FAS-PR", fullName: "Family Accommodation Scale for Pediatric OCD — Parent Report", ageMin: 0, ageMax: 204, queixas: ["toc"], respondente: ["pais"], prioridade: "monitorizacao", tempo: "10 min", description: "Avalia o grau de acomodação familiar aos sintomas de TOC da criança. Importante para planejamento do tratamento." },

  // ===== TRAUMA / TEPT =====
  { id: "cpss-v", name: "CPSS-V", fullName: "Child PTSD Symptom Scale for DSM-5", ageMin: 96, ageMax: 216, queixas: ["trauma"], respondente: ["autoaplicavel"], prioridade: "diagnostica", tempo: "15 min", description: "20 itens alinhados ao DSM-5 para diagnóstico e monitorização de TEPT em crianças e adolescentes." },
  { id: "ucla-ptsd", name: "UCLA PTSD-RI", fullName: "UCLA PTSD Reaction Index for DSM-5", ageMin: 84, ageMax: 216, queixas: ["trauma"], respondente: ["autoaplicavel", "clinico"], prioridade: "diagnostica", tempo: "20–30 min", description: "Instrumento estruturado para diagnóstico de TEPT em crianças e adolescentes com sequência de triagem de eventos traumáticos." },
  { id: "cries13", name: "CRIES-13", fullName: "Children’s Revised Impact of Event Scale 13", ageMin: 96, ageMax: 216, queixas: ["trauma"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "5 min", description: "13 itens avaliando intrusão, evitação e exitação após eventos traumáticos em crianças." },
  { id: "tscc", name: "TSCC", fullName: "Trauma Symptom Checklist for Children", ageMin: 96, ageMax: 192, queixas: ["trauma"], respondente: ["autoaplicavel"], prioridade: "diagnostica", tempo: "15–20 min", description: "54 itens avaliando angúistia pós-traumática, depressão, ansiedade, raiva, dissociacião e preocupações sexuais." },
  { id: "ace", name: "ACE", fullName: "Adverse Childhood Experiences Questionnaire", ageMin: 216, ageMax: 1200, queixas: ["trauma"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "5 min", description: "10 categorias de experíncias adversas na infância relatadas retrospectivamente por adultos. Forte preditor de desfechos em saúde." },
  { id: "csbi", name: "CSBI", fullName: "Child Sexual Behavior Inventory", ageMin: 24, ageMax: 144, queixas: ["trauma", "comportamento"], respondente: ["pais"], prioridade: "diagnostica", tempo: "15 min", description: "38 itens avaliando comportamentos sexuais em crianças de 2 a 12 anos. Identifica comportamentos fora do desenvolvimento normativo." },
  { id: "cdi-screen-trauma", name: "CDI Trauma Screen", fullName: "Child Dissociative Inventory — Screen for Trauma", ageMin: 96, ageMax: 216, queixas: ["trauma"], respondente: ["autoaplicavel", "pais"], prioridade: "triagem", tempo: "5 min", description: "Triagem rápida de sintomas dissociativos e traumáticos em crianças e adolescentes." },
  { id: "cats", name: "CATS", fullName: "Child and Adolescent Trauma Screen", ageMin: 36, ageMax: 204, queixas: ["trauma"], respondente: ["autoaplicavel", "pais"], prioridade: "triagem", tempo: "5–10 min", description: "Triagem de exposição a traumas e sintomas de TEPT em crianças de 3 a 17 anos, com versões para pais e autoaplicada." },

  // ===== FUNCIONALIDADE / ADAPTAÇÃO =====
  { id: "abas3", name: "ABAS-3", fullName: "Adaptive Behavior Assessment System 3", ageMin: 0, ageMax: 1068, queixas: ["funcionalidade"], respondente: ["pais", "professor", "clinico"], prioridade: "diagnostica", tempo: "15–20 min", description: "Avalia habilidades adaptativas em 10 áreas: comunicação, vida comunitária, acadêmico, lazer, autocuidado, saúde/segurança, autonomia, social e trabalho." },
  { id: "copm", name: "COPM", fullName: "Canadian Occupational Performance Measure", ageMin: 0, ageMax: 216, queixas: ["funcionalidade", "pc"], respondente: ["clinico", "pais", "crianca"], prioridade: "monitorizacao", tempo: "20–40 min", description: "Medida centrada no cliente que identifica problemas de desempenho ocupacional e monitora mudanças ao longo do tratamento." },
  { id: "gas", name: "GAS", fullName: "Goal Attainment Scaling", ageMin: 0, ageMax: 216, queixas: ["funcionalidade"], respondente: ["clinico"], prioridade: "monitorizacao", tempo: "15 min", description: "Método individualizado de definição e mensuração de metas terapêuticas em uma escala de -2 a +2 para cada objetivo." },
  { id: "life-h", name: "LIFE-H", fullName: "Assessment of Life Habits for Children", ageMin: 60, ageMax: 156, queixas: ["funcionalidade", "pc"], respondente: ["pais", "clinico"], prioridade: "diagnostica", tempo: "30–60 min", description: "Avalia participação social e realização de hábitos diários em crianças com deficiência ou condição crônica." },
  { id: "pedi", name: "PEDI", fullName: "Pediatric Evaluation of Disability Inventory", ageMin: 6, ageMax: 84, queixas: ["funcionalidade", "pc"], respondente: ["clinico", "pais"], prioridade: "diagnostica", tempo: "45 min", description: "Avalia habilidades funcionais de autocuidado, mobilidade e função social em 3 escalas: capacidade, assistência e modificações." },

  // ===== QUALIDADE DE VIDA =====
  { id: "kidscreen52", name: "KIDSCREEN-52", fullName: "KIDSCREEN-52 Health-Related Quality of Life Questionnaire", ageMin: 96, ageMax: 216, queixas: ["funcionalidade"], respondente: ["autoaplicavel", "pais"], prioridade: "monitorizacao", tempo: "15 min", description: "52 itens em 10 dimensões de qualidade de vida: saúde física, bem-estar, humor, autopercepção, autonomia, pais, pares, escola, financeiro e social." },
  { id: "auquei", name: "AUQUEI", fullName: "Autoquestionnaire Qualité de Vie Enfant Imagé", ageMin: 48, ageMax: 144, queixas: ["funcionalidade"], respondente: ["autoaplicavel"], prioridade: "monitorizacao", tempo: "10 min", description: "26 itens ilustrados de qualidade de vida para crianças de 4 a 12 anos. Explora família, pares, saúde e atividades." },
  { id: "chq-pf50", name: "CHQ-PF50", fullName: "Child Health Questionnaire — Parent Form 50", ageMin: 60, ageMax: 216, queixas: ["funcionalidade"], respondente: ["pais"], prioridade: "monitorizacao", tempo: "10 min", description: "50 itens de qualidade de vida pediátrica respondidos pelos pais. Cobre saúde física, emocional, social e escolar." },
  { id: "disabkids", name: "DISABKIDS", fullName: "DISABKIDS Chronic Generic Measure", ageMin: 96, ageMax: 192, queixas: ["funcionalidade"], respondente: ["autoaplicavel", "pais"], prioridade: "monitorizacao", tempo: "15 min", description: "Qualidade de vida genérica para crianças com condições crônicas. Avalia independência, inclusão social e emoções." },
  { id: "whoqol-ped", name: "WHOQOL-BREF Pediátrico", fullName: "WHOQOL-BREF Adaptado para Adolescentes", ageMin: 144, ageMax: 216, queixas: ["funcionalidade"], respondente: ["autoaplicavel"], prioridade: "monitorizacao", tempo: "10 min", description: "26 itens da OMS de qualidade de vida em 4 domínios: físico, psicológico, social e ambiental. Adaptado para adolescentes." },

  // ===== REGULAÇÃO EMOCIONAL ADICIONAL =====
  { id: "ders", name: "DERS", fullName: "Difficulties in Emotion Regulation Scale", ageMin: 144, ageMax: 216, queixas: ["ansiedade", "depressao"], respondente: ["autoaplicavel"], prioridade: "diagnostica", tempo: "10 min", description: "36 itens avaliando múltiplas facetas da desregulação emocional: consciência, clareza, aceitacao, metas, impulso e estratégias." },
  { id: "erc", name: "ERC", fullName: "Emotion Regulation Checklist", ageMin: 24, ageMax: 144, queixas: ["comportamento"], respondente: ["pais", "professor"], prioridade: "diagnostica", tempo: "10 min", description: "24 itens avaliando regulação emocional e labilidade/negatividade em crianças de 2 a 12 anos respondidos por pais ou professores." },
  { id: "cems", name: "CEMS", fullName: "Children’s Emotion Management Scales", ageMin: 108, ageMax: 144, queixas: ["depressao"], respondente: ["autoaplicavel"], prioridade: "diagnostica", tempo: "10 min", description: "Avalia estratégias de gestão de raiva e tristeza em crianças de 9 a 12 anos: expressão, repressão e coping." },
  { id: "casi", name: "CASI", fullName: "Child Anxiety Sensitivity Index", ageMin: 72, ageMax: 204, queixas: ["ansiedade"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "10 min", description: "18 itens mensurando sensibilidade à ansiedade (medo de sintomas ansiosos) em crianças e adolescentes. Fator de risco para transtornos de ansiedade." },
  { id: "scared-r", name: "SCARED Revisada", fullName: "Screen for Child Anxiety Related Disorders — Revisão", ageMin: 96, ageMax: 216, queixas: ["ansiedade"], respondente: ["autoaplicavel", "pais"], prioridade: "diagnostica", tempo: "10 min", description: "41 itens cobrindo 5 domínios de ansiedade: pânico, TAG, ansiedade de separação, fobia escolar e fobia social." },

  // ===== ENURESE =====
  { id: "dvss", name: "DVSS", fullName: "Dysfunctional Voiding Symptom Score", ageMin: 36, ageMax: 216, queixas: ["enurese"], respondente: ["pais", "autoaplicavel"], prioridade: "triagem", tempo: "5 min", description: "10 itens avaliando sintomas de disfunção miccional em crianças: urgência, freqüência, esforço, incontinencia e constipação." },
  { id: "bristol-stool", name: "Bristol Stool Scale", fullName: "Bristol Stool Form Scale Adaptada Pediátrica", ageMin: 48, ageMax: 216, queixas: ["enurese"], respondente: ["pais", "autoaplicavel"], prioridade: "triagem", tempo: "2 min", description: "7 tipos de fezes ilustrados para avaliação de constipação e diarreia. Adaptada com figuras para crianças a partir de 4 anos." },
  { id: "bladder-diary", name: "Diário Vesical Pediátrico", fullName: "Bladder Diary Pediátrico", ageMin: 60, ageMax: 216, queixas: ["enurese"], respondente: ["pais", "autoaplicavel"], prioridade: "monitorizacao", tempo: "7 dias", description: "Registro diário de frequência miccional, volume, episódios de escape, ingestão hídrica e hábitos defecacionais por 7 dias." },

  // ===== PSICOSE ADICIONAL =====
  { id: "sips", name: "SIPS/SOPS", fullName: "Structured Interview for Prodromal Syndromes / Scale of Prodromal Symptoms", ageMin: 144, ageMax: 300, queixas: ["psicose"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–60 min", description: "Entrevista estruturada para identificação de síndromes prodrômicas de psicose (UHR) em adolescentes e adultos jovens." },
  { id: "prime-screen", name: "PRIME Screen", fullName: "PRIME Screen for Psychosis Risk", ageMin: 144, ageMax: 300, queixas: ["psicose"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "10 min", description: "12 itens de triagem de risco ultra-alto para psicose em adolescentes. Baseado nos critérios do SIPS/SOPS." },
];

// Normaliza texto para busca (remove acentos, lowercase)
function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Sinônimos clínicos para busca inteligente
const synonymMap: Record<string, string[]> = {
  "autismo": ["tea", "autista", "espectro", "asd"],
  "tdah": ["deficit", "atencao", "hiperatividade", "impulsividade", "desatencao", "adhd"],
  "ansiedade": ["ansioso", "ansiosa", "medo", "fobia", "panico", "preocupacao"],
  "depressao": ["depressivo", "deprimido", "humor", "tristeza"],
  "epilepsia": ["convulsao", "crise", "epileptico", "seizure"],
  "sono": ["insonia", "dormir", "sonolencia", "apneia"],
  "motor": ["paralisia", "cerebral", "espasticidade", "motricidade", "coordenacao"],
  "linguagem": ["fala", "comunicacao", "verbal", "vocabulario", "fonologia"],
  "comportamento": ["agressividade", "oposicao", "conduta", "externalizante"],
  "aprendizagem": ["leitura", "escrita", "dislexia", "discalculia", "escolar", "academico"],
  "suicidio": ["autolesao", "autoagressao", "risco"],
  "tique": ["tiques", "tourette", "tic"],
  "alimentacao": ["disfagia", "seletividade", "alimentar", "tare"],
  "cognicao": ["intelectual", "qi", "neuropsicologico", "executiva", "memoria"],
  "dor": ["cefaleia", "enxaqueca", "migranea"],
  "neonatal": ["prematuro", "prematuridade", "recem-nascido", "rn"],
};

// Busca inteligente multi-palavra com scoring
export function searchScales(query: string, scaleList: ScaleEntry[]): { scale: ScaleEntry; score: number }[] {
  const raw = normalize(query.trim());
  if (!raw) return scaleList.map(s => ({ scale: s, score: 0 }));

  // Tokeniza a busca em palavras individuais
  const tokens = raw.split(/\s+/).filter(t => t.length >= 2);
  if (tokens.length === 0) return scaleList.map(s => ({ scale: s, score: 0 }));

  // Expande tokens com sinônimos
  const expandedTokens: string[][] = tokens.map(token => {
    const expanded = [token];
    for (const [key, syns] of Object.entries(synonymMap)) {
      if (normalize(key).includes(token) || syns.some(s => normalize(s).includes(token))) {
        expanded.push(normalize(key), ...syns.map(normalize));
      }
    }
    return [...new Set(expanded)];
  });

  return scaleList.map(scale => {
    const searchable = normalize(`${scale.name} ${scale.fullName} ${scale.description} ${scale.queixas.join(" ")}`);
    let score = 0;
    let allTokensMatch = true;

    for (const tokenGroup of expandedTokens) {
      const tokenMatched = tokenGroup.some(t => searchable.includes(t));
      if (tokenMatched) {
        score += 1;
        // Bonus: match no nome da escala vale mais
        if (tokenGroup.some(t => normalize(scale.name).includes(t))) score += 2;
        // Bonus: match no fullName
        if (tokenGroup.some(t => normalize(scale.fullName).includes(t))) score += 1;
      } else {
        allTokensMatch = false;
      }
    }

    // Se todas as palavras deram match, bonus grande
    if (allTokensMatch && tokens.length > 1) score += 3;

    return { scale, score };
  }).filter(r => r.score > 0);
}

// Merge autoral scales + escalas importadas (SuperNeuroKids v25 + Ebook PANT v7)
export const allScales: ScaleEntry[] = [...scales, ...escalasAutoraisDrJadson, ...escalasImportadasV25Ebook];

// Filtrar escalas por queixa(s) e faixa etária (min/max em meses)
export function filterScales(
  selectedQueixas: string[],
  ageRange: { min: number; max: number } | null
): ScaleEntry[] {
  return allScales
    .filter(s => {
      // Queixa: a escala deve ter pelo menos uma queixa selecionada
      const matchQueixa = selectedQueixas.length === 0 || s.queixas.some(q => selectedQueixas.includes(q));
      // Idade: sobreposição de faixas (a escala cobre algum ponto da faixa selecionada)
      const matchAge = ageRange === null || (s.ageMax >= ageRange.min && s.ageMin <= ageRange.max);
      return matchQueixa && matchAge;
    })
    .map(s => {
      // Scoring de relevância: mais queixas matching = mais relevante
      let relevance = 0;
      if (selectedQueixas.length > 0) {
        relevance = s.queixas.filter(q => selectedQueixas.includes(q)).length;
      }
      // Bonus: se está implementada no app
      if (s.appRoute) relevance += 0.5;
      return { scale: s, relevance };
    })
    .sort((a, b) => {
      // Prioridade: triagem > diagnóstica > monitorização
      const prio = { triagem: 0, diagnostica: 1, monitorizacao: 2 };
      const prioDiff = prio[a.scale.prioridade] - prio[b.scale.prioridade];
      if (prioDiff !== 0) return prioDiff;
      // Dentro da mesma prioridade, mais relevante primeiro
      if (b.relevance !== a.relevance) return b.relevance - a.relevance;
      // Escalas com rota no app primeiro
      if (a.scale.appRoute && !b.scale.appRoute) return -1;
      if (!a.scale.appRoute && b.scale.appRoute) return 1;
      return a.scale.name.localeCompare(b.scale.name);
    })
    .map(r => r.scale);
}
