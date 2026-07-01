// Filtro Inteligente — Banco de escalas por queixa, idade, respondente e prioridade
import { escalasAutoraisDrJadson } from "./escalasAutorais";
import { escalasAutoraisAprovadas } from "./escalasAutoraisCuradoria";
import { escalasImportadasV25Ebook } from "./escalasImportadasV25Ebook";
import { scalasOpenAccessMundiais } from "./scalasOpenAccessMundiais";
import { todasAsEscalasComplementares } from "./indiceEscalasComplementares230";
import { escalasPsiquiatricasImportadas2026 } from "./escalasPsiquiatricasImportadas2026";
import { descricoesMelhoradas } from "./descricoesMelhoradas";

export type Prioridade = "triagem" | "diagnostica" | "monitorizacao";
// "crianca" e "teste_direto_crianca" são tratados como aplicação direta com a criança.
// "crianca" é mantido por compatibilidade com o catálogo legado.
export type Respondente =
  | "pais"
  | "clinico"
  | "professor"
  | "autoaplicavel"
  | "crianca"
  | "teste_direto_crianca";

// Modo concreto de aplicação do instrumento (quem responde e como).
export type ApplicationMode =
  | "questionario_pais"
  | "questionario_professor"
  | "autoquestionario_crianca_adolescente"
  | "teste_direto_crianca"
  | "observacional_clinico"
  | "entrevista_clinica"
  | "registro_clinico"
  | "psicoeducacao";

// Finalidade clínica do instrumento.
export type AssessmentUse =
  | "triagem"
  | "diagnostico"
  | "monitorizacao"
  | "seguimento"
  | "psicoeducacao";

// Status real de implementação dentro do app (honestidade clínica).
export type ImplementationStatus =
  | "complete" // aplicação completa: itens + cálculo/interpretação + fluxo
  | "metadata_only" // apenas ficha técnica/informativa
  | "external_only" // instrumento externo/licenciado — não embutir itens/escore
  | "not_implemented"; // recomendação clínica; sem aplicação no app

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
  licenca?: Licenca;                   // passiva | ativa | mista (modo de aplicação)
  tipo?: string;                       // natureza do instrumento
  pendente_validacao_clinica?: boolean; // true quando algum campo foi inferido/ficou ausente
  pendencia?: string;                  // descrição do que está pendente/inferido
  // Proveniência clínica validada (ChatGPT→PubMed, 2026). 37 instrumentos.
  // `licenca` acima descreve o MODO de aplicação (passiva/ativa); `licencaUso`
  // descreve o LICENCIAMENTO do instrumento (livre/comercial/restrita/contato_autor).
  pubmedId?: string | null;            // ex.: "PMID 24422648" (null = sem PMID aplicável)
  validacaoBrasil?: string;            // status de adaptação/validação brasileira
  scoringCutoff?: string;              // ponto de corte / interpretação de escore
  licencaUso?: "livre" | "comercial" | "restrita" | "contato_autor" | "autoral"; // licenciamento de uso
  // Metadados clínicos consumidos pelo motor de filtragem avançada (advancedFilterLogic).
  // Quando ausentes, o motor deriva um valor padrão a partir dos campos existentes
  // (respondente, prioridade, appRoute, licença) — nunca assume aplicação completa.
  verbalRequirement?: "indiferente" | "verbal" | "nao_verbal_compativel"; // exigência de linguagem verbal
  literacyRequirement?: "indiferente" | "alfabetizado" | "pre_alfabetizado"; // exigência de alfabetização
  assessmentUse?: AssessmentUse;       // finalidade clínica explícita (sobrepõe a derivação por prioridade)
  applicationMode?: ApplicationMode;   // modo concreto de aplicação (sobrepõe a derivação por respondente)
  implementationStatus?: ImplementationStatus; // status real no app (sobrepõe a derivação por appRoute/licença)
  signalTags?: string[];               // pistas clínicas/sintomas que refinam o ranking do filtro
  // Proveniência do índice das 230 escalas complementares (curadoria interna).
  modoApp?: string;                    // "aplicar" | "monitorar" (hint de uso da curadoria)
  duplicataStatus?: string;            // "nova" | "possivel_duplicata" (controle de deduplicação)
}

export interface QueixaCategory {
  id: string;
  label: string;
  icon: string;         // lucide icon name
  color: string;        // tailwind gradient
  bgLight: string;
  iconColor: string;
  emoji?: string;       // unicode emoji for visual appeal
  appRoute?: string;    // atalho opcional para a ficha/aplicação da categoria
}

export const queixas: QueixaCategory[] = [
  { id: "atraso", label: "Atraso do Desenvolvimento", icon: "baby", color: "from-amber-500 to-orange-500", bgLight: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600 dark:text-amber-400", emoji: "👶", appRoute: "/generic-scale/atraso"},
  { id: "tea", label: "Autismo / TEA", icon: "puzzle", color: "from-pink-500 to-rose-500", bgLight: "bg-pink-50 dark:bg-pink-950/30", iconColor: "text-pink-600 dark:text-pink-400", emoji: "🧩", appRoute: "/generic-scale/tea"},
  { id: "tdah", label: "TDAH", icon: "zap", color: "from-teal-500 to-cyan-500", bgLight: "bg-teal-50 dark:bg-teal-950/30", iconColor: "text-teal-600 dark:text-teal-400", emoji: "⚡", appRoute: "/generic-scale/tdah"},
  { id: "comportamento", label: "Comportamento / Externalizantes", icon: "flame", color: "from-orange-500 to-red-500", bgLight: "bg-orange-50 dark:bg-orange-950/30", iconColor: "text-orange-600 dark:text-orange-400", emoji: "🔥", appRoute: "/generic-scale/comportamento"},
  { id: "ansiedade", label: "Ansiedade", icon: "alert-triangle", color: "from-indigo-500 to-blue-500", bgLight: "bg-indigo-50 dark:bg-indigo-950/30", iconColor: "text-indigo-600 dark:text-indigo-400", emoji: "😰", appRoute: "/generic-scale/ansiedade"},
  { id: "depressao", label: "Depressão / Humor", icon: "cloud-rain", color: "from-sky-500 to-blue-600", bgLight: "bg-sky-50 dark:bg-sky-950/30", iconColor: "text-sky-600 dark:text-sky-400", emoji: "☁️", appRoute: "/generic-scale/depressao"},
  { id: "epilepsia", label: "Epilepsia", icon: "activity", color: "from-violet-500 to-purple-600", bgLight: "bg-violet-50 dark:bg-violet-950/30", iconColor: "text-violet-600 dark:text-violet-400", emoji: "⚠️", appRoute: "/generic-scale/epilepsia"},
  { id: "pc", label: "Paralisia Cerebral / Motor", icon: "accessibility", color: "from-teal-500 to-emerald-500", bgLight: "bg-teal-50 dark:bg-teal-950/30", iconColor: "text-teal-600 dark:text-teal-400", emoji: "🚶", appRoute: "/generic-scale/pc"},
  { id: "linguagem", label: "Linguagem / Comunicação", icon: "message-circle", color: "from-blue-500 to-indigo-500", bgLight: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-600 dark:text-blue-400", emoji: "💬", appRoute: "/generic-scale/linguagem"},
  { id: "sono", label: "Sono", icon: "moon", color: "from-indigo-500 to-purple-600", bgLight: "bg-indigo-50 dark:bg-indigo-950/30", iconColor: "text-indigo-600 dark:text-indigo-400", emoji: "😴", appRoute: "/generic-scale/sono"},
  { id: "alimentacao", label: "Alimentação / Disfagia", icon: "utensils-crossed", color: "from-lime-500 to-green-600", bgLight: "bg-lime-50 dark:bg-lime-950/30", iconColor: "text-lime-600 dark:text-lime-400", emoji: "🍴", appRoute: "/generic-scale/alimentacao"},
  { id: "dor", label: "Dor / Cefaleia", icon: "heart-pulse", color: "from-rose-500 to-red-600", bgLight: "bg-rose-50 dark:bg-rose-950/30", iconColor: "text-rose-600 dark:text-rose-400", emoji: "🤕", appRoute: "/generic-scale/dor"},
  { id: "cognicao", label: "Cognição / Neuropsicologia", icon: "brain", color: "from-purple-500 to-violet-600", bgLight: "bg-purple-50 dark:bg-purple-950/30", iconColor: "text-purple-600 dark:text-purple-400", emoji: "🧠", appRoute: "/generic-scale/cognicao"},
  { id: "aprendizagem", label: "Aprendizagem / Leitura", icon: "graduation-cap", color: "from-emerald-500 to-green-600", bgLight: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400", emoji: "📚", appRoute: "/generic-scale/aprendizagem"},
  { id: "funcionalidade", label: "Funcionalidade / Habilidades Adaptativas", icon: "users", color: "from-cyan-500 to-sky-500", bgLight: "bg-cyan-50 dark:bg-cyan-950/30", iconColor: "text-cyan-600 dark:text-cyan-400", emoji: "👥", appRoute: "/generic-scale/funcionalidade"},
  { id: "neonatal", label: "Neonatal / Prematuridade", icon: "baby", color: "from-pink-400 to-rose-400", bgLight: "bg-pink-50 dark:bg-pink-950/30", iconColor: "text-pink-500 dark:text-pink-400", emoji: "🍼", appRoute: "/generic-scale/neonatal"},
  { id: "suicidio", label: "Risco de Suicídio / Autolesão", icon: "shield-alert", color: "from-red-600 to-rose-700", bgLight: "bg-red-50 dark:bg-red-950/30", iconColor: "text-red-600 dark:text-red-400", emoji: "🆘", appRoute: "/generic-scale/suicidio"},
  { id: "psicose", label: "Psicose / Mania", icon: "zap-off", color: "from-fuchsia-500 to-purple-600", bgLight: "bg-fuchsia-50 dark:bg-fuchsia-950/30", iconColor: "text-fuchsia-600 dark:text-fuchsia-400", emoji: "💫", appRoute: "/generic-scale/psicose"},
  { id: "tiques", label: "Tiques / Tourette", icon: "sparkles", color: "from-yellow-500 to-orange-500", bgLight: "bg-yellow-50 dark:bg-yellow-950/30", iconColor: "text-yellow-600 dark:text-yellow-400", emoji: "✨", appRoute: "/generic-scale/tiques"},
  { id: "efeitos", label: "Efeitos Colaterais / Monitorização", icon: "pill", color: "from-gray-500 to-slate-600", bgLight: "bg-gray-50 dark:bg-gray-950/30", iconColor: "text-gray-600 dark:text-gray-400", emoji: "💊", appRoute: "/generic-scale/efeitos"},
  { id: "toc", label: "TOC / Obsessões", icon: "repeat", color: "from-purple-500 to-fuchsia-600", bgLight: "bg-purple-50 dark:bg-purple-950/30", iconColor: "text-purple-600 dark:text-purple-400", emoji: "🔄", appRoute: "/generic-scale/toc"},
  { id: "trauma", label: "Trauma / TEPT", icon: "shield-alert", color: "from-slate-500 to-gray-700", bgLight: "bg-slate-50 dark:bg-slate-950/30", iconColor: "text-slate-600 dark:text-slate-400", emoji: "🛡️", appRoute: "/generic-scale/trauma"},
  { id: "enurese", label: "Enurese / Eliminação", icon: "droplet", color: "from-cyan-500 to-blue-500", bgLight: "bg-cyan-50 dark:bg-cyan-950/30", iconColor: "text-cyan-600 dark:text-cyan-400", emoji: "💧", appRoute: "/generic-scale/enurese"},
  { id: "motor", label: "Coordenação Motora", icon: "move", color: "from-emerald-500 to-teal-600", bgLight: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400", emoji: "🏃", appRoute: "/generic-scale/motor"},
  { id: "sensorial", label: "Sensorial / Integração", icon: "hand", color: "from-amber-500 to-yellow-500", bgLight: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600 dark:text-amber-400", emoji: "👋", appRoute: "/generic-scale/sensorial"},
  { id: "social", label: "Social / Relações", icon: "users", color: "from-blue-500 to-indigo-500", bgLight: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-600 dark:text-blue-400", emoji: "🤝", appRoute: "/generic-scale/social"},
  { id: "autonomia", label: "Autonomia / AVDs", icon: "home", color: "from-cyan-500 to-sky-500", bgLight: "bg-cyan-50 dark:bg-cyan-950/30", iconColor: "text-cyan-600 dark:text-sky-400", emoji: "🏠", appRoute: "/generic-scale/autonomia"},
  { id: "evolucao", label: "Reavaliação / Evolução", icon: "trending-up", color: "from-emerald-500 to-green-600", bgLight: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400", emoji: "📈", appRoute: "/generic-scale/evolucao"},
  { id: "substancias", label: "Uso de Substâncias", icon: "wine", color: "from-rose-500 to-pink-600", bgLight: "bg-rose-50 dark:bg-rose-950/30", iconColor: "text-rose-600 dark:text-rose-400", emoji: "🍷", appRoute: "/generic-scale/substancias"},
];

// Faixas etárias para o filtro (em meses)
export const faixasEtarias = [
  { id: "0-6m", label: "0–6 meses", min: 0, max: 5.99, appRoute: "/generic-scale/0-6m"},
  { id: "6-12m", label: "6–12 meses", min: 6, max: 11.99, appRoute: "/generic-scale/6-12m"},
  { id: "1-2a", label: "1–2 anos", min: 12, max: 23.99, appRoute: "/generic-scale/1-2a"},
  { id: "2-4a", label: "2–4 anos", min: 24, max: 47.99, appRoute: "/generic-scale/2-4a"},
  { id: "4-6a", label: "4–6 anos", min: 48, max: 71.99, appRoute: "/generic-scale/4-6a"},
  { id: "6-12a", label: "6–12 anos", min: 72, max: 143.99, appRoute: "/generic-scale/6-12a"},
  { id: "12-18a", label: "12–18 anos", min: 144, max: 215.99, appRoute: "/generic-scale/12-18a"},
];

export const scales: ScaleEntry[] = [
  // ===== ATRASO DO DESENVOLVIMENTO =====
  { id: "denver", name: "Denver II", fullName: "Denver Developmental Screening Test II", ageMin: 0, ageMax: 72, queixas: ["atraso", "funcionalidade"], respondente: ["clinico"], prioridade: "triagem", tempo: "15–20 min", appRoute: "/denver", description: "Avalia marcos motores, linguagem, pessoal-social e motor fino-adaptativo.", fonte: "Frankenburg WK et al., 1992", validacaoBrasil: "Sim", scoringCutoff: "Avanço normal (dentro esperado); Cautela (75-90° percentil); Risco (abaixo 10º percentil)", licencaUso: "comercial" },
  { id: "bayley", name: "Bayley-III", fullName: "Bayley Scales of Infant Development III", ageMin: 1, ageMax: 42, queixas: ["atraso", "neonatal"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–90 min", description: "Padrão-ouro para avaliação cognitiva, motora e de linguagem em lactentes.", fonte: "Bayley N, 2006 - Pearson Clinical", validacaoBrasil: "Parcial", scoringCutoff: "composite score <85 abaixo do esperado", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/bayley"},
  { id: "griffiths", name: "Griffiths III", fullName: "Griffiths Scales of Child Development III", ageMin: 0, ageMax: 72, queixas: ["atraso"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "40–60 min", description: "Avalia 5 áreas: fundamentos da aprendizagem, linguagem, olho-mão, pessoal-social-emocional e motricidade grossa.", fonte: "Griffiths R, 2006 (Griffiths-3)", validacaoBrasil: "Parcial", scoringCutoff: "GQ Quotient ≥115 superior; 85-114 médio; <70 atraso moderado a severo", licencaUso: "comercial", appRoute: "/generic-scale/griffiths"},
  { id: "asq3", name: "ASQ-3", fullName: "Ages & Stages Questionnaire 3", ageMin: 1, ageMax: 66, queixas: ["atraso"], respondente: ["pais"], prioridade: "triagem", tempo: "10–15 min", appRoute: "/asq3", description: "Triagem do desenvolvimento em 5 domínios com questionário para pais.", fonte: "Squires J & Bricker D, 2009", validacaoBrasil: "Sim", scoringCutoff: "Escore <cut-off por idade/domínio = encaminhamento recomendado; acima = desenvolvimento típico", licencaUso: "comercial" },
  { id: "peds", name: "PEDS", fullName: "Parents' Evaluation of Developmental Status", ageMin: 0, ageMax: 96, queixas: ["atraso"], respondente: ["pais"], prioridade: "triagem", tempo: "5 min", description: "10 perguntas de triagem respondidas pelos pais sobre preocupações com o desenvolvimento.", fonte: "Glascoe FP, 1997", validacaoBrasil: "Sim", scoringCutoff: "≥2 preocupações em qualquer domínio = encaminhamento para avaliação", licencaUso: "comercial", appRoute: "/generic-scale/peds"},
  { id: "catclams", name: "CAT/CLAMS", fullName: "Clinical Adaptive Test / Clinical Linguistic and Auditory Milestone Scale", ageMin: 0, ageMax: 36, queixas: ["atraso", "linguagem"], respondente: ["clinico"], prioridade: "triagem", tempo: "15–20 min", description: "Avalia desenvolvimento cognitivo e de linguagem em crianças pequenas.", fonte: "Accardo PJ et al., 1992", validacaoBrasil: "Parcial", scoringCutoff: "Escore bruto convertido para age-equivalent (meses de desenvolvimento); gap >3 meses = atraso suspeito", licencaUso: "livre", appRoute: "/generic-scale/catclams"},
  { id: "aims", name: "AIMS", fullName: "Alberta Infant Motor Scale", ageMin: 0, ageMax: 18, queixas: ["atraso", "pc"], respondente: ["clinico"], prioridade: "triagem", tempo: "20 min", description: "Avalia desenvolvimento motor grosso de lactentes em posições prono, supino, sentado e de pé.", fonte: "Piper MC & Darrah J, 1994 - University of Alberta", validacaoBrasil: "Sim", scoringCutoff: "Percentis por idade; <10º percentil = atraso suspeito", licencaUso: "comercial", appRoute: "/generic-scale/aims"},
  { id: "ims", name: "IMS", fullName: "Escala Motora Infantil de Alberta", ageMin: 0, ageMax: 18, queixas: ["atraso", "pc"], respondente: ["clinico"], prioridade: "triagem", tempo: "20 min", description: "Avaliação observacional do desenvolvimento motor grosso.", appRoute: "/generic-scale/ims"},
  { id: "timp", name: "TIMP", fullName: "Test of Infant Motor Performance", ageMin: 0, ageMax: 4, queixas: ["atraso", "neonatal", "pc"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "25–35 min", description: "Avalia controle postural e motor em lactentes de risco.", appRoute: "/generic-scale/timp"},
  { id: "gma", name: "GMA", fullName: "General Movements Assessment (Prechtl)", ageMin: 0, ageMax: 5, queixas: ["atraso", "neonatal", "pc"], respondente: ["clinico"], prioridade: "triagem", tempo: "5–10 min", description: "Avaliação da qualidade dos movimentos generalizados do neonato. Padrão-ouro precoce para risco de PC.", fonte: "Prechtl HFR et al.", validacaoBrasil: "Sim", scoringCutoff: "ausência de fidgety movements sugere risco neurológico", licencaUso: "restrita", pendente_validacao_clinica: false, appRoute: "/generic-scale/gma"},

  // ===== TEA =====
  { id: "mchat", name: "M-CHAT-R/F", fullName: "Modified Checklist for Autism in Toddlers - Revised with Follow-Up", ageMin: 16, ageMax: 30, queixas: ["tea"], respondente: ["pais"], prioridade: "triagem", tempo: "5–10 min", appRoute: "/mchat", description: "Rastreio de risco para TEA entre 16 e 30 meses.", fonte: "Robins DL et al., 2014 - Pediatrics", pubmedId: "PMID 24422648", validacaoBrasil: "Sim - Losapio MF et al., 2011", scoringCutoff: ">=3 risco inicial; >=8 alto risco; follow-up reduz falso-positivo", licencaUso: "livre", pendente_validacao_clinica: false },
  { id: "cars", name: "CARS-2", fullName: "Childhood Autism Rating Scale 2", ageMin: 24, ageMax: 216, queixas: ["tea"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–20 min", appRoute: "/cars", description: "Classifica a gravidade dos sintomas do espectro autista.", fonte: "Schopler E et al., 2010", validacaoBrasil: "Parcial - adaptações brasileiras publicadas", scoringCutoff: ">=30 sugere TEA", licencaUso: "comercial", pendente_validacao_clinica: false },
  { id: "ados2", name: "ADOS-2", fullName: "Autism Diagnostic Observation Schedule 2", ageMin: 12, ageMax: 216, queixas: ["tea"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "40–60 min", description: "Padrão-ouro observacional para diagnóstico de TEA. 5 módulos por nível de linguagem.", fonte: "Lord C et al., 2012 - Western Psychological Services", validacaoBrasil: "Parcial - uso clínico e estudos brasileiros", scoringCutoff: "algoritmos por módulo", licencaUso: "restrita", pendente_validacao_clinica: false, appRoute: "/generic-scale/ados2"},
  { id: "adir", name: "ADI-R", fullName: "Autism Diagnostic Interview - Revised", ageMin: 24, ageMax: 216, queixas: ["tea"], respondente: ["pais"], prioridade: "diagnostica", tempo: "90–150 min", description: "Entrevista semiestruturada com cuidadores. Padrão-ouro complementar ao ADOS-2.", fonte: "Rutter M et al., 2003", validacaoBrasil: "Parcial", scoringCutoff: "cutoffs por domínio diagnóstico", licencaUso: "restrita", pendente_validacao_clinica: false, appRoute: "/generic-scale/adir"},
  { id: "scq", name: "SCQ", fullName: "Social Communication Questionnaire", ageMin: 48, ageMax: 216, queixas: ["tea"], respondente: ["pais"], prioridade: "triagem", tempo: "10 min", description: "40 itens derivados do ADI-R. Triagem rápida para TEA.", fonte: "Rutter M et al., 2003", validacaoBrasil: "Parcial", scoringCutoff: ">=15 sugere TEA", licencaUso: "restrita", pendente_validacao_clinica: false, appRoute: "/generic-scale/scq"},
  { id: "srs2", name: "SRS-2", fullName: "Social Responsiveness Scale 2", ageMin: 30, ageMax: 216, queixas: ["tea"], respondente: ["pais", "professor"], prioridade: "triagem", tempo: "15–20 min", description: "Quantifica déficits de responsividade social associados ao TEA.", fonte: "Constantino JN, Gruber CP, 2012", validacaoBrasil: "Sim - adaptação brasileira disponível", scoringCutoff: "T-score >=60 sugere alterações sociais", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/srs2"},
  { id: "cast", name: "CAST", fullName: "Childhood Autism Spectrum Test", ageMin: 48, ageMax: 132, queixas: ["tea"], respondente: ["pais"], prioridade: "triagem", tempo: "10 min", description: "37 itens para triagem de TEA em idade escolar.", fonte: "Scott FJ et al., 2002", pubmedId: "PMID 12199139", validacaoBrasil: "Parcial", scoringCutoff: ">=15 risco aumentado", licencaUso: "contato_autor", pendente_validacao_clinica: false, appRoute: "/generic-scale/cast"},
  { id: "gars3", name: "GARS-3", fullName: "Gilliam Autism Rating Scale 3", ageMin: 36, ageMax: 216, queixas: ["tea"], respondente: ["pais", "clinico"], prioridade: "diagnostica", tempo: "10–15 min", description: "Avalia comportamentos restritos/repetitivos, interação social e comunicação.", appRoute: "/generic-scale/gars3"},
  { id: "atec", name: "ATEC", fullName: "Autism Treatment Evaluation Checklist", ageMin: 24, ageMax: 216, queixas: ["tea"], respondente: ["pais"], prioridade: "monitorizacao", tempo: "10 min", description: "Monitoriza resposta ao tratamento em TEA. 77 itens em 4 subescalas.", appRoute: "/generic-scale/atec"},
  { id: "assq", name: "ASSQ", fullName: "Autism Spectrum Screening Questionnaire", ageMin: 84, ageMax: 204, queixas: ["tea"], respondente: ["pais", "professor"], prioridade: "triagem", tempo: "10 min", description: "27 itens para triagem de TEA de alto funcionamento / Asperger.", fonte: "Ehlers S et al., 1999", pubmedId: "PMID 10382131", validacaoBrasil: "Sim", scoringCutoff: ">=19 sugere risco", licencaUso: "restrita", pendente_validacao_clinica: false, appRoute: "/generic-scale/assq"},
  { id: "tea-checklists", name: "Checklists TEA", fullName: "ADOS-2, ADI-R, CARS-2, GARS-3, SRS-2 — Resumo Clínico", ageMin: 12, ageMax: 216, queixas: ["tea"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "Variável", appRoute: "/tea", description: "Checklists clínicos adaptados dos 5 principais instrumentos de TEA." },
  { id: "tea-comportamentos", name: "Comport. Atípicos TEA", fullName: "Escala de Comportamentos Atípicos em TEA — 6 Faixas Etárias", ageMin: 0, ageMax: 216, queixas: ["tea", "comportamento"], respondente: ["clinico", "pais"], prioridade: "diagnostica", tempo: "15–25 min", appRoute: "/tea-comportamentos", description: "100 itens observacionais em 6 domínios, por faixa etária (0–18 anos)." },
  { id: "podj-tea-prime-familiar", name: "PODJ-TEA Familiar", fullName: "PODJ-TEA PRIME — Ficha de Entrevista Familiar", ageMin: 12, ageMax: 228, queixas: ["tea", "social", "linguagem", "sensorial", "funcionalidade"], respondente: ["pais", "clinico"], prioridade: "diagnostica", tempo: "10–20 min", description: "Ficha complementar por paciente para colher exemplos familiares de história inicial, regressão, linguagem, atenção compartilhada, socialização, brincadeira, rigidez, RRB, sensorialidade, funcionalidade, diferenciais, camuflagem e evolução. Não substitui avaliação diagnóstica formal.", fonte: "PODJ-TEA PRIME — Kit Fichas por Paciente, Dr. Jadson Fraga", licencaUso: "autoral", validacaoBrasil: "Autoral — ficha complementar observacional", scoringCutoff: "Pontuação qualitativa 0 adequado; 1 discreto; 2 claro/moderado; 3 intenso/importante; NO/NA quando não observado/não aplicável", appRoute: "/generic-scale/podj-tea-prime-familiar", applicationMode: "entrevista_clinica", assessmentUse: "diagnostico", implementationStatus: "metadata_only" },
  { id: "podj-tea-prime-escola-terapia", name: "PODJ-TEA Escola/Terapia", fullName: "PODJ-TEA PRIME — Ficha Escola / Terapia", ageMin: 24, ageMax: 228, queixas: ["tea", "social", "linguagem", "sensorial", "funcionalidade", "aprendizagem"], respondente: ["professor", "clinico"], prioridade: "diagnostica", tempo: "10–20 min", description: "Ficha complementar para escola ou terapia com foco em socialização, reciprocidade, pragmática, rotina, regras, hiperfoco, sensorialidade, funcionalidade e forças observadas em contexto real. Útil para documentar pervasividade e impacto funcional fora do consultório.", fonte: "PODJ-TEA PRIME — Kit Fichas por Paciente, Dr. Jadson Fraga", licencaUso: "autoral", validacaoBrasil: "Autoral — ficha complementar observacional", scoringCutoff: "Registro por frequência, impacto, exemplo observado e contexto; usar como evidência complementar, não como diagnóstico isolado", appRoute: "/generic-scale/podj-tea-prime-escola-terapia", applicationMode: "questionario_professor", assessmentUse: "diagnostico", implementationStatus: "metadata_only" },
  { id: "podj-tea-prime-1-6a", name: "PODJ-TEA PRIME 1–6A", fullName: "PODJ-TEA PRIME — Ficha de Aplicação 1–6A", ageMin: 12, ageMax: 71, queixas: ["tea", "atraso", "linguagem", "social", "sensorial", "funcionalidade"], respondente: ["clinico", "pais"], prioridade: "diagnostica", tempo: "20–30 min", description: "Ficha observacional para 12 meses a 5 anos e 11 meses, organizada para consulta, escola, terapia ou avaliação estruturada. Abrange atenção compartilhada, comunicação social, brincadeira, criatividade lúdica, interesses incomuns, rigidez, sensorialidade, seletividade alimentar, funcionalidade e fechamento por pervasividade, impacto e confiabilidade.", fonte: "PODJ-TEA PRIME — Kit Fichas por Paciente, Dr. Jadson Fraga", licencaUso: "autoral", validacaoBrasil: "Autoral — ficha complementar observacional", scoringCutoff: "0 adequado; 1 discreto; 2 claro/moderado; 3 intenso/importante; registrar ajuda A0-A4 e exemplos objetivos", appRoute: "/generic-scale/podj-tea-prime-1-6a", applicationMode: "observacional_clinico", assessmentUse: "diagnostico", implementationStatus: "metadata_only", verbalRequirement: "nao_verbal_compativel", literacyRequirement: "pre_alfabetizado" },
  { id: "podj-tea-prime-6-12a", name: "PODJ-TEA PRIME 6–12A", fullName: "PODJ-TEA PRIME — Ficha de Aplicação 6–12A", ageMin: 72, ageMax: 155, queixas: ["tea", "social", "linguagem", "sensorial", "funcionalidade", "aprendizagem"], respondente: ["clinico", "pais", "professor"], prioridade: "diagnostica", tempo: "20–30 min", description: "Ficha observacional para 6 anos a 12 anos e 11 meses, com itens de pragmática, piadas/duplo sentido, amizades, regras, flexibilidade, hiperfoco, sobrecarga sensorial, seletividade alimentar, autonomia, mediação de adultos, sofrimento social, bullying/isolamento e prejuízo em múltiplos contextos.", fonte: "PODJ-TEA PRIME — Kit Fichas por Paciente, Dr. Jadson Fraga", licencaUso: "autoral", validacaoBrasil: "Autoral — ficha complementar observacional", scoringCutoff: "0 adequado; 1 discreto; 2 claro/moderado; 3 intenso/importante; fechamento por pervasividade, impacto funcional, diferenciais e confiabilidade", appRoute: "/generic-scale/podj-tea-prime-6-12a", applicationMode: "observacional_clinico", assessmentUse: "diagnostico", implementationStatus: "metadata_only" },
  { id: "podj-tea-prime-12-19a", name: "PODJ-TEA PRIME 12–19A", fullName: "PODJ-TEA PRIME — Ficha de Aplicação 12–19A", ageMin: 144, ageMax: 228, queixas: ["tea", "social", "linguagem", "sensorial", "funcionalidade", "ansiedade"], respondente: ["clinico", "pais", "autoaplicavel"], prioridade: "diagnostica", tempo: "20–30 min", description: "Ficha observacional para 12 a 19 anos, com foco em reciprocidade social, amizades, julgamento social, vulnerabilidade/ingenuidade, camuflagem, flexibilidade, tolerância à incerteza, sensorialidade, autonomia, funcionalidade escolar/global, sofrimento, exaustão social e necessidade de plano de proteção quando indicado.", fonte: "PODJ-TEA PRIME — Kit Fichas por Paciente, Dr. Jadson Fraga", licencaUso: "autoral", validacaoBrasil: "Autoral — ficha complementar observacional", scoringCutoff: "0 adequado; 1 discreto; 2 claro/moderado; 3 intenso/importante; correlacionar com entrevista, escola/família e diferenciais clínicos", appRoute: "/generic-scale/podj-tea-prime-12-19a", applicationMode: "observacional_clinico", assessmentUse: "diagnostico", implementationStatus: "metadata_only", literacyRequirement: "indiferente" },

  // ===== TDAH =====
  { id: "snap", name: "SNAP-IV", fullName: "Swanson, Nolan and Pelham Rating Scale IV", ageMin: 72, ageMax: 204, queixas: ["tdah"], respondente: ["pais", "professor"], prioridade: "triagem", tempo: "10 min", appRoute: "/snap", description: "Avalia desatenção e hiperatividade/impulsividade — 18 itens DSM.", fonte: "Swanson JM et al., 2001 - University of California", validacaoBrasil: "Sim", scoringCutoff: ">=6 sintomas frequentes por domínio", licencaUso: "livre", pendente_validacao_clinica: false },
  { id: "conners", name: "Conners 3", fullName: "Conners Rating Scales 3", ageMin: 72, ageMax: 216, queixas: ["tdah", "comportamento"], respondente: ["pais", "professor", "autoaplicavel"], prioridade: "diagnostica", tempo: "15–20 min", appRoute: "/conners", description: "Problemas de conduta, aprendizagem, queixas somáticas e impulsividade.", fonte: "Conners CK, 2008 - Multi-Health Systems", validacaoBrasil: "Parcial", scoringCutoff: "T-score >=65 clinicamente relevante", licencaUso: "comercial", pendente_validacao_clinica: false },
  { id: "vanderbilt", name: "Vanderbilt", fullName: "NICHQ Vanderbilt Assessment Scale", ageMin: 72, ageMax: 144, queixas: ["tdah", "comportamento"], respondente: ["pais", "professor"], prioridade: "triagem", tempo: "10–15 min", appRoute: "/vanderbilt", description: "Escala para pais com domínios de desatenção, hiperatividade e conduta." },
  { id: "brief2", name: "BRIEF-2", fullName: "Behavior Rating Inventory of Executive Function 2", ageMin: 60, ageMax: 216, queixas: ["tdah", "cognicao"], respondente: ["pais", "professor"], prioridade: "diagnostica", tempo: "10–15 min", appRoute: "/brief2", description: "Inibição, flexibilidade, controle emocional, memória de trabalho e planejamento.", fonte: "Gioia GA et al., 2015", validacaoBrasil: "Parcial", scoringCutoff: "T-score >=65 elevado", licencaUso: "comercial", pendente_validacao_clinica: false },
  { id: "barkley", name: "Barkley", fullName: "Barkley Functional Impairment Scale - Children", ageMin: 72, ageMax: 216, queixas: ["tdah"], respondente: ["pais"], prioridade: "monitorizacao", tempo: "10 min", description: "Avalia prejuízo funcional associado ao TDAH em múltiplos contextos.", appRoute: "/generic-scale/barkley"},
  { id: "brown-add", name: "Brown ADD", fullName: "Brown Attention-Deficit Disorder Scales", ageMin: 36, ageMax: 216, queixas: ["tdah"], respondente: ["clinico", "autoaplicavel"], prioridade: "diagnostica", tempo: "15–20 min", description: "Avalia funções executivas e atenção com foco em aspectos cognitivos do TDAH.", appRoute: "/generic-scale/brown-add"},

  // ===== COMPORTAMENTO =====
  { id: "cbcl", name: "CBCL", fullName: "Child Behavior Checklist (1.5-5 e 6-18)", ageMin: 18, ageMax: 216, queixas: ["comportamento", "tdah", "ansiedade", "depressao"], respondente: ["pais"], prioridade: "triagem", tempo: "15–20 min", appRoute: "/cbcl", description: "Triagem de problemas internalizantes, externalizantes e sociais. Cobre as versões 1.5-5 e 6-18.", fonte: "Achenbach TM & Rescorla LA, 2001", validacaoBrasil: "Sim - Bordin IAS et al.", scoringCutoff: "T-score >=64 clínico", licencaUso: "comercial", pendente_validacao_clinica: false },
  { id: "sdq", name: "SDQ", fullName: "Strengths and Difficulties Questionnaire", ageMin: 24, ageMax: 204, queixas: ["comportamento", "tdah", "ansiedade"], respondente: ["pais", "professor", "autoaplicavel", "crianca"], prioridade: "triagem", tempo: "5–10 min", appRoute: "/sdq", description: "Comportamento pró-social, hiperatividade, emoções, conduta e pares.", fonte: "Goodman R, 1997 - Cambridge University", pubmedId: "PMID 9255702", validacaoBrasil: "Sim - Fleitlich-Bilyk B et al.", scoringCutoff: "score total >=17 alterado", licencaUso: "livre", pendente_validacao_clinica: false },
  { id: "abc", name: "ABC", fullName: "Aberrant Behavior Checklist", ageMin: 36, ageMax: 216, queixas: ["comportamento", "tea"], respondente: ["pais", "clinico"], prioridade: "monitorizacao", tempo: "10–15 min", appRoute: "/abc", description: "Irritabilidade, letargia, estereotipia, hiperatividade e fala inadequada." },
  { id: "ecbi", name: "ECBI", fullName: "Eyberg Child Behavior Inventory", ageMin: 24, ageMax: 192, queixas: ["comportamento"], respondente: ["pais"], prioridade: "triagem", tempo: "10 min", description: "36 itens de problemas de conduta com escalas de intensidade e problema.", fonte: "Eyberg SM & Ross AW, 1978", validacaoBrasil: "Sim", scoringCutoff: "Intensidade >131; Problema >11 = clínicamente significativo", licencaUso: "comercial", appRoute: "/generic-scale/ecbi"},
  { id: "psc17", name: "PSC-17", fullName: "Pediatric Symptom Checklist 17", ageMin: 48, ageMax: 192, queixas: ["comportamento", "ansiedade", "depressao"], respondente: ["pais"], prioridade: "triagem", tempo: "5 min", description: "Triagem breve de problemas psicossociais em pediatria.", appRoute: "/generic-scale/psc17"},
  { id: "hsq", name: "HSQ", fullName: "Home Situations Questionnaire", ageMin: 48, ageMax: 144, queixas: ["comportamento", "tdah"], respondente: ["pais"], prioridade: "monitorizacao", tempo: "5 min", description: "Avalia problemas de comportamento em 16 situações domésticas.", appRoute: "/generic-scale/hsq"},
  { id: "psi", name: "PSI", fullName: "Parenting Stress Index", ageMin: 0, ageMax: 144, queixas: ["comportamento", "funcionalidade"], respondente: ["pais"], prioridade: "triagem", tempo: "12–15 min", description: "Mede o estresse parental no sistema pai-criança (domínios da criança, dos pais e situacional). Útil para planejar intervenção familiar.", fonte: "Abidin RR, 1995 (Parenting Stress Index)", validacaoBrasil: "Parcial", scoringCutoff: "percentil >=85 estresse clinicamente significativo", licencaUso: "comercial", appRoute: "/generic-scale/psi"},

  // ===== ANSIEDADE =====
  { id: "scared", name: "SCARED", fullName: "Screen for Child Anxiety Related Disorders", ageMin: 96, ageMax: 216, queixas: ["ansiedade"], respondente: ["pais", "autoaplicavel", "crianca"], prioridade: "triagem", tempo: "10 min", appRoute: "/scared", description: "Pânico, ansiedade generalizada, separação, fobia social e evitação escolar.", fonte: "Birmaher B et al., 1997 - University of Pittsburgh", pubmedId: "PMID 9136490", validacaoBrasil: "Sim", scoringCutoff: ">=25 sugere transtorno ansioso", licencaUso: "livre", pendente_validacao_clinica: false },
  { id: "masc2", name: "MASC-2", fullName: "Multidimensional Anxiety Scale for Children 2", ageMin: 96, ageMax: 216, queixas: ["ansiedade"], respondente: ["autoaplicavel", "pais"], prioridade: "diagnostica", tempo: "15 min", description: "50 itens em 4 escalas: ansiedade física, evitação de dano, ansiedade social e separação/pânico.", fonte: "March JS, 2013", validacaoBrasil: "Parcial", scoringCutoff: "T-score >=65", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/masc2"},
  { id: "rcads", name: "RCADS", fullName: "Revised Children's Anxiety and Depression Scale", ageMin: 96, ageMax: 216, queixas: ["ansiedade", "depressao"], respondente: ["autoaplicavel", "pais", "crianca"], prioridade: "triagem", tempo: "10 min", description: "47 itens cobrindo 6 subescalas baseadas no DSM (ansiedade e depressão).", fonte: "Chorpita BF et al., 2000 - Journal of the American Academy of Child & Adolescent Psychiatry", validacaoBrasil: "Parcial", scoringCutoff: "Total ≥63 provável transtorno; subescalas interpretadas conforme T-score", licencaUso: "livre", appRoute: "/generic-scale/rcads"},
  { id: "scas", name: "SCAS", fullName: "Spence Children's Anxiety Scale", ageMin: 36, ageMax: 216, queixas: ["ansiedade"], respondente: ["autoaplicavel", "pais"], prioridade: "triagem", tempo: "10 min", description: "Avalia 6 domínios de ansiedade: separação, social, obsessões, pânico, generalizada, medo de lesão.", appRoute: "/generic-scale/scas"},
  { id: "staic", name: "STAIC", fullName: "State-Trait Anxiety Inventory for Children", ageMin: 72, ageMax: 168, queixas: ["ansiedade"], respondente: ["autoaplicavel"], prioridade: "diagnostica", tempo: "10 min", description: "Diferencia ansiedade-estado (transitória) de ansiedade-traço (tendência estável).", appRoute: "/generic-scale/staic"},
  { id: "gad7ped", name: "GAD-7 Pediátrico", fullName: "Generalized Anxiety Disorder 7 — Versão Pediátrica", ageMin: 144, ageMax: 216, queixas: ["ansiedade"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "3 min", description: "7 itens de triagem rápida para ansiedade generalizada.", fonte: "Spitzer RL et al., 2006", pubmedId: "PMID 16717171", validacaoBrasil: "Sim", scoringCutoff: ">=10 ansiedade moderada", licencaUso: "livre", pendente_validacao_clinica: false, appRoute: "/gad7", implementationStatus: "complete"},

  // ===== DEPRESSÃO =====
  { id: "cdi2", name: "CDI-2", fullName: "Children's Depression Inventory 2", ageMin: 84, ageMax: 204, queixas: ["depressao"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "10–15 min", appRoute: "/cdi2", description: "Inventário de Depressão Infantil — 28 itens.", fonte: "Kovacs M, 2011 - Multi-Health Systems", validacaoBrasil: "Parcial", scoringCutoff: "T-score >=65", licencaUso: "comercial", pendente_validacao_clinica: false },
  { id: "phqa", name: "PHQ-A", fullName: "Patient Health Questionnaire - Adolescentes", ageMin: 132, ageMax: 216, queixas: ["depressao"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "5 min", appRoute: "/phqa", description: "9 itens para triagem de depressão em adolescentes.", fonte: "Johnson JG et al., 2002", pubmedId: "PMID 12090817", validacaoBrasil: "Parcial", scoringCutoff: ">=10 depressao moderada", licencaUso: "livre", pendente_validacao_clinica: false },
  { id: "mfq", name: "MFQ", fullName: "Mood and Feelings Questionnaire", ageMin: 72, ageMax: 216, queixas: ["depressao"], respondente: ["autoaplicavel", "pais"], prioridade: "triagem", tempo: "10 min", description: "33 itens avaliando humor depressivo nas últimas 2 semanas.", appRoute: "/generic-scale/mfq"},
  { id: "cdrsr", name: "CDRS-R", fullName: "Children's Depression Rating Scale - Revised", ageMin: 72, ageMax: 144, queixas: ["depressao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–20 min", description: "17 itens aplicados pelo clínico. Padrão-ouro para gravidade de depressão infantil.", appRoute: "/generic-scale/cdrsr"},
  { id: "rads2", name: "RADS-2", fullName: "Reynolds Adolescent Depression Scale 2", ageMin: 132, ageMax: 216, queixas: ["depressao"], respondente: ["autoaplicavel"], prioridade: "diagnostica", tempo: "10 min", description: "30 itens de autoaplicação para depressão na adolescência.", appRoute: "/generic-scale/rads2"},

  // ===== EPILEPSIA =====
  { id: "epilepsia-diario", name: "Diário de Crises", fullName: "Diário de Crises Epilépticas — Registro e Acompanhamento", ageMin: 0, ageMax: 216, queixas: ["epilepsia"], respondente: ["pais", "clinico"], prioridade: "monitorizacao", tempo: "5 min/registro", appRoute: "/epilepsia", description: "Registro de tipo, duração, consciência, triggers e pós-ictal." },
  { id: "qvce50", name: "QVCE-50", fullName: "Qualidade de Vida da Criança com Epilepsia", ageMin: 24, ageMax: 216, queixas: ["epilepsia"], respondente: ["pais"], prioridade: "monitorizacao", tempo: "15 min", description: "50 itens sobre impacto da epilepsia na qualidade de vida.", appRoute: "/generic-scale/qvce50"},
  { id: "hine", name: "HINE", fullName: "Hammersmith Infant Neurological Examination", ageMin: 2, ageMax: 24, queixas: ["epilepsia", "neonatal", "pc"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10–15 min", description: "Exame neurológico padronizado para lactentes — 26 itens.", fonte: "Dubowitz L et al., 2008", validacaoBrasil: "Parcial", scoringCutoff: "26 itens objetivos com padrões normal/anormal; anormalidades precoces sugerem lesão neurológica", licencaUso: "livre", appRoute: "/generic-scale/hine"},
  { id: "pedsql-epilepsia", name: "PedsQL Epilepsia", fullName: "PedsQL Epilepsy Module", ageMin: 24, ageMax: 216, queixas: ["epilepsia"], respondente: ["pais", "autoaplicavel"], prioridade: "monitorizacao", tempo: "10 min", description: "Módulo específico de epilepsia do PedsQL.", appRoute: "/generic-scale/pedsql-epilepsia"},
  { id: "qolie-ad", name: "QOLIE-AD-48", fullName: "Quality of Life in Epilepsy - Adolescent", ageMin: 132, ageMax: 216, queixas: ["epilepsia"], respondente: ["autoaplicavel"], prioridade: "monitorizacao", tempo: "15 min", description: "Qualidade de vida em epilepsia para adolescentes — 48 itens.", appRoute: "/generic-scale/qolie-ad"},
  { id: "nddie", name: "NDDI-E", fullName: "Neurological Disorders Depression Inventory for Epilepsy", ageMin: 132, ageMax: 216, queixas: ["epilepsia", "depressao"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "3 min", description: "6 itens de triagem de depressão em pacientes com epilepsia.", appRoute: "/generic-scale/nddie"},

  // ===== PARALISIA CEREBRAL / MOTOR =====
  { id: "gmfcs", name: "GMFCS", fullName: "Gross Motor Function Classification System", ageMin: 0, ageMax: 216, queixas: ["pc"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5 min", appRoute: "/gmfcs", description: "Classificação da função motora grossa em PC — 5 níveis.", fonte: "Palisano R et al., 2007", validacaoBrasil: "Sim", scoringCutoff: "Nível I: marcha sem restrição; II: marcha com limitações; III: requer assistência; IV: mobilidade motorizada; V: transportado", licencaUso: "livre" },
  { id: "gmfm", name: "GMFM-88/66", fullName: "Gross Motor Function Measure", ageMin: 0, ageMax: 216, queixas: ["pc"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "45–60 min", description: "88 itens em 5 dimensões motoras. Padrão-ouro para medir função motora na PC.", fonte: "Russell DJ et al., 2002", validacaoBrasil: "Sim", scoringCutoff: "Escore 0-100% por dimensão; <50% inibição grave; >80% próximo ao normal", licencaUso: "comercial", appRoute: "/generic-scale/gmfm"},
  { id: "macs", name: "MACS", fullName: "Manual Ability Classification System", ageMin: 48, ageMax: 216, queixas: ["pc"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5 min", description: "Classifica habilidade manual na PC em 5 níveis.", appRoute: "/generic-scale/macs"},
  { id: "cfcs", name: "CFCS", fullName: "Communication Function Classification System", ageMin: 24, ageMax: 216, queixas: ["pc", "linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5 min", description: "Classifica a eficácia da comunicação na PC em 5 níveis.", appRoute: "/generic-scale/cfcs"},
  { id: "edacs", name: "EDACS", fullName: "Eating and Drinking Ability Classification System", ageMin: 36, ageMax: 216, queixas: ["pc", "alimentacao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5 min", description: "Classifica habilidade alimentar na PC em 5 níveis.", appRoute: "/generic-scale/edacs"},
  { id: "ashworth", name: "Ashworth Modificada", fullName: "Escala de Ashworth Modificada", ageMin: 0, ageMax: 216, queixas: ["pc"], respondente: ["clinico"], prioridade: "monitorizacao", tempo: "5–10 min", description: "Avalia espasticidade muscular em escala 0–4 (Ashworth + Tardieu).", appRoute: "/espasticidade", implementationStatus: "complete"},

  // ===== LINGUAGEM =====
  { id: "cdi-macarthur", name: "CDI MacArthur", fullName: "MacArthur-Bates Communicative Development Inventories", ageMin: 8, ageMax: 37, queixas: ["linguagem", "atraso"], respondente: ["pais"], prioridade: "triagem", tempo: "20–30 min", description: "Inventário de vocabulário e gestos comunicativos para lactentes e crianças pequenas.", fonte: "Fenson L et al., 2007 - Brookes Publishing", validacaoBrasil: "Sim", scoringCutoff: "Vocabulário <10º percentil para idade = atraso suspeito; <25º = monitorar", licencaUso: "comercial", appRoute: "/generic-scale/cdi-macarthur"},
  { id: "reel3", name: "REEL-3", fullName: "Receptive-Expressive Emergent Language Test 3", ageMin: 0, ageMax: 36, queixas: ["linguagem", "atraso"], respondente: ["clinico", "pais"], prioridade: "diagnostica", tempo: "20 min", description: "Avalia linguagem receptiva e expressiva emergente de 0 a 3 anos.", appRoute: "/generic-scale/reel3"},
  { id: "celf5", name: "CELF-5", fullName: "Clinical Evaluation of Language Fundamentals 5", ageMin: 60, ageMax: 216, queixas: ["linguagem", "aprendizagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–60 min", description: "Avaliação abrangente de linguagem receptiva e expressiva.", appRoute: "/generic-scale/celf5"},
  { id: "ppvt4", name: "PPVT-4", fullName: "Peabody Picture Vocabulary Test 4", ageMin: 30, ageMax: 216, queixas: ["linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15 min", description: "Vocabulário receptivo por identificação de figuras.", appRoute: "/generic-scale/ppvt4"},

  // ===== SONO =====
  { id: "cshq", name: "CSHQ", fullName: "Children's Sleep Habits Questionnaire", ageMin: 48, ageMax: 120, queixas: ["sono"], respondente: ["pais"], prioridade: "triagem", tempo: "10–15 min", appRoute: "/cshq", description: "Hábitos de sono infantil — 7 domínios de distúrbio.", fonte: "Owens JA et al., 2000", pubmedId: "PMID 11174669", validacaoBrasil: "Sim", scoringCutoff: ">41 distúrbio do sono provável", licencaUso: "restrita", pendente_validacao_clinica: false },
  { id: "bisq", name: "BISQ", fullName: "Brief Infant Sleep Questionnaire", ageMin: 0, ageMax: 36, queixas: ["sono"], respondente: ["pais"], prioridade: "triagem", tempo: "5 min", description: "Triagem breve de padrões de sono em lactentes.", appRoute: "/generic-scale/bisq"},
  { id: "bears", name: "BEARS", fullName: "Bedtime, Excessive Daytime Sleepiness, Awakenings, Regularity, Snoring", ageMin: 24, ageMax: 216, queixas: ["sono"], respondente: ["pais", "autoaplicavel"], prioridade: "triagem", tempo: "5 min", description: "5 perguntas-chave para triagem de distúrbios do sono.", fonte: "Owens JA & Dalzell V, 2005 - Brown University", pubmedId: "PMID 15764706", validacaoBrasil: "Parcial", scoringCutoff: "triagem qualitativa sem cutoff único", licencaUso: "livre", pendente_validacao_clinica: false, appRoute: "/generic-scale/bears"},
  { id: "sdsc", name: "SDSC", fullName: "Sleep Disturbance Scale for Children", ageMin: 72, ageMax: 180, queixas: ["sono"], respondente: ["pais"], prioridade: "diagnostica", tempo: "10 min", description: "26 itens em 6 categorias de distúrbio do sono.", fonte: "Bruni O et al., 1996", pubmedId: "PMID 8989069", validacaoBrasil: "Sim", scoringCutoff: "T-score >70", licencaUso: "restrita", pendente_validacao_clinica: false, appRoute: "/generic-scale/sdsc"},
  { id: "psq", name: "PSQ", fullName: "Pediatric Sleep Questionnaire", ageMin: 24, ageMax: 216, queixas: ["sono"], respondente: ["pais"], prioridade: "triagem", tempo: "10 min", description: "Triagem de distúrbios respiratórios do sono e sonolência.", fonte: "Chervin RD et al., 2000 - University of Michigan", validacaoBrasil: "Parcial", scoringCutoff: "escores brutos interpretados; ≥0.33 prevalência suspeita de apneia", licencaUso: "comercial", appRoute: "/generic-scale/psq"},

  // ===== ALIMENTAÇÃO =====
  { id: "soma", name: "SOMA", fullName: "Schedule for Oral Motor Assessment", ageMin: 8, ageMax: 24, queixas: ["alimentacao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "20 min", description: "Avaliação padronizada da função motora oral durante alimentação.", appRoute: "/generic-scale/soma"},
  { id: "eda", name: "EDA", fullName: "Escala de Dificuldade Alimentar", ageMin: 6, ageMax: 72, queixas: ["alimentacao"], respondente: ["pais"], prioridade: "triagem", tempo: "10 min", description: "Triagem de dificuldades alimentares na primeira infância.", appRoute: "/generic-scale/eda"},

  // ===== DOR / CEFALEIA =====
  { id: "cefaleia-calendario", name: "Calendário de Cefaleia", fullName: "Calendário de Cefaleia — Registro Diário", ageMin: 36, ageMax: 216, queixas: ["dor"], respondente: ["pais", "autoaplicavel"], prioridade: "monitorizacao", tempo: "5 min/registro", appRoute: "/cefaleia", description: "Intensidade, tipo, localização, aura, triggers e resposta medicamentosa." },
  { id: "wongbaker", name: "Wong-Baker FACES", fullName: "Wong-Baker FACES Pain Rating Scale", ageMin: 36, ageMax: 216, queixas: ["dor"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "1 min", description: "6 faces para autoavaliação de intensidade da dor (0–10).", appRoute: "/generic-scale/wongbaker"},
  { id: "flacc", name: "FLACC", fullName: "Face, Legs, Activity, Cry, Consolability", ageMin: 0, ageMax: 84, queixas: ["dor"], respondente: ["clinico"], prioridade: "triagem", tempo: "2 min", description: "Avaliação comportamental de dor em crianças pré-verbais.", fonte: "Merkel SI et al., 1997 - University of Michigan", validacaoBrasil: "Sim", scoringCutoff: "0-3 nenhuma/dor mínima; 4-6 dor moderada; 7-10 dor severa", licencaUso: "livre", appRoute: "/generic-scale/flacc"},
  { id: "pedmidas", name: "PedMIDAS", fullName: "Pediatric Migraine Disability Assessment", ageMin: 72, ageMax: 216, queixas: ["dor"], respondente: ["autoaplicavel"], prioridade: "monitorizacao", tempo: "5 min", description: "6 itens avaliando impacto funcional da enxaqueca nos últimos 3 meses.", appRoute: "/generic-scale/pedmidas"},

  // ===== COGNIÇÃO =====
  { id: "wppsi", name: "WPPSI-IV", fullName: "Wechsler Preschool and Primary Scale of Intelligence IV", ageMin: 24, ageMax: 90, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–60 min", description: "Avaliação de inteligência para pré-escolares — QI verbal, execução e total.", appRoute: "/generic-scale/wppsi"},
  { id: "wisc5", name: "WISC-V", fullName: "Wechsler Intelligence Scale for Children V", ageMin: 72, ageMax: 204, queixas: ["cognicao", "aprendizagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "60–90 min", description: "Padrão-ouro para avaliação de inteligência em escolares. 5 índices fatoriais.", fonte: "Wechsler D, 2014", validacaoBrasil: "Sim", scoringCutoff: "QI <70 deficiência intelectual provável", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/wisc5"},
  { id: "leiter3", name: "Leiter-3", fullName: "Leiter International Performance Scale 3", ageMin: 36, ageMax: 216, queixas: ["cognicao", "tea"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–45 min", description: "Avaliação não-verbal de inteligência — útil em TEA e deficiência auditiva.", appRoute: "/generic-scale/leiter3"},
  { id: "raven", name: "Raven Colorido", fullName: "Matrizes Progressivas de Raven — Colorido", ageMin: 60, ageMax: 132, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "triagem", tempo: "15–25 min", description: "Raciocínio não-verbal por matrizes progressivas coloridas.", appRoute: "/generic-scale/raven"},
  { id: "nepsy2", name: "NEPSY-II", fullName: "Neuropsychological Assessment II", ageMin: 36, ageMax: 192, queixas: ["cognicao", "tdah"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "45–90 min", description: "Bateria neuropsicológica: atenção, linguagem, memória, sensório-motor, visuoespacial e social.", fonte: "Korkman M et al., 2007", validacaoBrasil: "Parcial", scoringCutoff: "scaled score <=6 baixo desempenho", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/nepsy2"},

  // ===== APRENDIZAGEM =====
  { id: "tde", name: "TDE", fullName: "Teste de Desempenho Escolar", ageMin: 72, ageMax: 168, queixas: ["aprendizagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "20–30 min", description: "Avalia escrita, aritmética e leitura — padronizado para Brasil.", fonte: "Stein LM, 1994", validacaoBrasil: "Sim", scoringCutoff: "Escore bruto convertido a escore padrão; <80 abaixo do esperado; 80-119 adequado; >120 superior", licencaUso: "comercial", appRoute: "/generic-scale/tde"},
  { id: "prolec", name: "PROLEC-SE", fullName: "Provas de Avaliação dos Processos de Leitura", ageMin: 72, ageMax: 144, queixas: ["aprendizagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–40 min", description: "Avalia processos léxicos, sintáticos e semânticos da leitura.", appRoute: "/generic-scale/prolec"},
  { id: "confias", name: "CONFIAS", fullName: "Consciência Fonológica: Instrumento de Avaliação Sequencial", ageMin: 48, ageMax: 96, queixas: ["aprendizagem", "linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "20 min", description: "Avalia consciência fonológica em nível de sílaba e fonema.", appRoute: "/generic-scale/confias"},

  // ===== FUNCIONALIDADE =====
  // /vineland abre só ficha de referência (interpretação de escore), não a
  // aplicação preenchível (instrumento licenciado) — metadata_only tira do filtro.
  { id: "vineland", name: "Vineland-3", fullName: "Vineland Adaptive Behavior Scales 3", ageMin: 0, ageMax: 216, queixas: ["funcionalidade", "tea", "atraso"], respondente: ["pais", "clinico"], prioridade: "diagnostica", tempo: "20–60 min", appRoute: "/vineland", implementationStatus: "metadata_only", description: "Comunicação, vida diária, socialização e motricidade.", fonte: "Sparrow SS et al., 2016", validacaoBrasil: "Parcial", scoringCutoff: "score adaptativo <70 significativo", licencaUso: "comercial", pendente_validacao_clinica: false },
  { id: "pedsql", name: "PedsQL", fullName: "Pediatric Quality of Life Inventory", ageMin: 24, ageMax: 216, queixas: ["funcionalidade"], respondente: ["pais", "autoaplicavel"], prioridade: "monitorizacao", tempo: "10 min", appRoute: "/pedsql", description: "Funcionamento físico, emocional, social e escolar.", fonte: "Varni JW et al., 2001", validacaoBrasil: "Sim", scoringCutoff: "0-100 (100=melhor QV); <60 impacto clínico significativo; >80 QV adequada", licencaUso: "comercial" },
  { id: "pedicat", name: "PEDI-CAT", fullName: "Pediatric Evaluation of Disability Inventory - CAT", ageMin: 0, ageMax: 216, queixas: ["funcionalidade", "pc"], respondente: ["pais", "clinico"], prioridade: "diagnostica", tempo: "15 min", description: "Avalia mobilidade, atividades diárias, social/cognitivo e responsabilidade.", fonte: "Haley SM et al., 2012", validacaoBrasil: "Sim", scoringCutoff: "normas padronizadas por idade", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/pedicat"},
  { id: "weefim", name: "WeeFIM", fullName: "Functional Independence Measure for Children", ageMin: 6, ageMax: 96, queixas: ["funcionalidade", "pc"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–20 min", description: "18 itens de independência funcional: autocuidado, mobilidade e cognição.", fonte: "Msall ME et al., 1994", pubmedId: "PMID 8014620", validacaoBrasil: "Sim", scoringCutoff: "maiores escores indicam maior independência", licencaUso: "restrita", pendente_validacao_clinica: false, appRoute: "/generic-scale/weefim"},

  // ===== NEONATAL =====
  { id: "napi", name: "NAPI", fullName: "Neurobehavioral Assessment of Preterm Infant", ageMin: 0, ageMax: 4, queixas: ["neonatal"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "20 min", description: "Avalia estado comportamental, tônus motor e orientação em RNPT.", appRoute: "/generic-scale/napi"},
  { id: "nnns", name: "NNNS", fullName: "NICU Network Neurobehavioral Scale", ageMin: 0, ageMax: 2, queixas: ["neonatal"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "20–30 min", description: "115 itens avaliando neurointegridade, maturidade e estresse em RN de risco.", fonte: "Lester BM et al., 2004", pubmedId: "PMID 14993575", validacaoBrasil: "Parcial", scoringCutoff: "perfil neurocomportamental dimensional", licencaUso: "restrita", pendente_validacao_clinica: false, appRoute: "/generic-scale/nnns"},
  { id: "nbas", name: "NBAS", fullName: "Neonatal Behavioral Assessment Scale (Brazelton)", ageMin: 0, ageMax: 2, queixas: ["neonatal"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "20–30 min", description: "Avalia capacidades comportamentais e reflexos do neonato a termo.", fonte: "Brazelton TB, Nugent JK, 1995", validacaoBrasil: "Parcial", scoringCutoff: "interpretação dimensional", licencaUso: "restrita", pendente_validacao_clinica: false, appRoute: "/generic-scale/nbas"},

  // ===== RISCO SUICÍDIO =====
  { id: "cssrs", name: "C-SSRS", fullName: "Columbia Suicide Severity Rating Scale", ageMin: 72, ageMax: 216, queixas: ["suicidio", "depressao"], respondente: ["clinico"], prioridade: "triagem", tempo: "5–10 min", appRoute: "/cssrs", description: "Escala Columbia — 6 níveis de gravidade de ideação suicida.", fonte: "Posner K et al., 2011", validacaoBrasil: "Sim", scoringCutoff: "Ideação: nível 1 desejo passivo; 2-3 ideação ativa; 4-5 plano/intenção suicida; Comportamento: qualquer resposta SIM requer intervenção", licencaUso: "livre" },
  { id: "asq-suicide", name: "ASQ", fullName: "Ask Suicide-Screening Questions", ageMin: 120, ageMax: 216, queixas: ["suicidio"], respondente: ["clinico"], prioridade: "triagem", tempo: "2 min", description: "4 perguntas de triagem rápida de risco suicida em emergência.", appRoute: "/generic-scale/asq-suicide"},
  { id: "siqjr", name: "SIQ-Jr", fullName: "Suicidal Ideation Questionnaire - Junior", ageMin: 84, ageMax: 168, queixas: ["suicidio"], respondente: ["autoaplicavel"], prioridade: "diagnostica", tempo: "10 min", description: "15 itens de autoavaliação de ideação suicida em crianças e adolescentes.", appRoute: "/generic-scale/siqjr"},
  { id: "ecar-si", name: "ECAR-SI NEXUS", fullName: "Escala Clínica de Avaliação de Risco — Suicidalidade Infantojuvenil", ageMin: 96, ageMax: 216, queixas: ["suicidio"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–20 min", appRoute: "/ecar-si", description: "36 itens, 9 blocos (8 risco + 1 proteção), alarmes clínicos e conduta." },

  // ===== PSICOSE / MANIA =====
  { id: "ymrs", name: "YMRS", fullName: "Young Mania Rating Scale", ageMin: 144, ageMax: 216, queixas: ["psicose"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–20 min", description: "11 itens avaliando gravidade de mania — humor, atividade, sono, fala, pensamento.", appRoute: "/generic-scale/ymrs"},
  { id: "bprsc", name: "BPRS-C", fullName: "Brief Psychiatric Rating Scale for Children", ageMin: 60, ageMax: 216, queixas: ["psicose", "comportamento"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–20 min", description: "21 itens de sintomas psiquiátricos: ansiedade, depressão, psicose, hostilidade.", appRoute: "/generic-scale/bprsc"},
  { id: "panss-ped", name: "PANSS Pediátrico", fullName: "Positive and Negative Syndrome Scale — Pediátrico", ageMin: 144, ageMax: 216, queixas: ["psicose"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–40 min", description: "30 itens: sintomas positivos, negativos e psicopatologia geral.", appRoute: "/generic-scale/panss-ped"},

  // ===== TIQUES =====
  { id: "ygtss", name: "YGTSS", fullName: "Yale Global Tic Severity Scale", ageMin: 36, ageMax: 216, queixas: ["tiques"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–20 min", appRoute: "/ygtss", description: "Tiques motores e vocais: número, frequência, intensidade, complexidade e interferência." },

  // ===== EFEITOS COLATERAIS =====
  { id: "aims-efeitos", name: "AIMS", fullName: "Abnormal Involuntary Movement Scale", ageMin: 0, ageMax: 216, queixas: ["efeitos"], respondente: ["clinico"], prioridade: "monitorizacao", tempo: "10 min", description: "12 itens avaliando movimentos involuntários — discinesia tardia.", appRoute: "/generic-scale/aims-efeitos"},
  { id: "bars", name: "BARS", fullName: "Barnes Akathisia Rating Scale", ageMin: 0, ageMax: 216, queixas: ["efeitos"], respondente: ["clinico"], prioridade: "monitorizacao", tempo: "5 min", description: "4 itens de avaliação global e objetiva de acatisia.", appRoute: "/generic-scale/bars"},
  { id: "uku", name: "UKU", fullName: "UKU Side Effect Rating Scale", ageMin: 0, ageMax: 216, queixas: ["efeitos"], respondente: ["clinico"], prioridade: "monitorizacao", tempo: "15 min", description: "48 itens de efeitos colaterais psiquiátricos, neurológicos, autonômicos e outros.", appRoute: "/generic-scale/uku"},

  // ===== SUBSTÂNCIAS =====
  { id: "crafft", name: "CRAFFT", fullName: "Car, Relax, Alone, Forget, Friends, Trouble", ageMin: 144, ageMax: 216, queixas: ["comportamento", "substancias"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "5 min", appRoute: "/crafft", description: "Screening de uso de álcool e drogas para adolescentes." },

  // ===== PANT E BATERIAS DR. JADSON =====
  { id: "pant", name: "PANT", fullName: "Protocolo de Avaliação do Neurodesenvolvimento Típico — 100 Escalas", ageMin: 0, ageMax: 216, queixas: ["atraso", "funcionalidade", "tea"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–60 min", appRoute: "/pant", description: "100 escalas passivas em 5 macrodomínios: comunicação, linguagem, executiva, sensorial, emocional." },
  { id: "emdi", name: "EMDI", fullName: "Escala Médica do Desenvolvimento Infantil", ageMin: 12, ageMax: 72, queixas: ["atraso"], respondente: ["clinico"], prioridade: "triagem", tempo: "10 min", appRoute: "/emdi", description: "Triagem estruturada do desenvolvimento infantil — Bateria Dr. Jadson." },
  { id: "eaf", name: "EAF", fullName: "Escala de Adaptação Funcional", ageMin: 24, ageMax: 216, queixas: ["funcionalidade"], respondente: ["pais", "clinico"], prioridade: "diagnostica", tempo: "10 min", appRoute: "/eaf", description: "Adaptação funcional em contextos diários — Bateria Dr. Jadson." },
  { id: "pdae", name: "PDAE", fullName: "Protocolo de Desempenho Acadêmico e Escolar", ageMin: 72, ageMax: 216, queixas: ["aprendizagem"], respondente: ["professor", "pais"], prioridade: "triagem", tempo: "10 min", appRoute: "/pdae", description: "Desempenho acadêmico e escolar — Bateria Dr. Jadson.", implementationStatus: "complete" },
  { id: "ecsm", name: "ECSM", fullName: "Escala de Cognição Social e Mentalização", ageMin: 48, ageMax: 216, queixas: ["tea", "cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10 min", appRoute: "/ecsm", description: "Cognição social e metacognição — Bateria Dr. Jadson." },
  { id: "ips", name: "IPS", fullName: "Inventário de Processamento Sensorial", ageMin: 24, ageMax: 144, queixas: ["tea", "atraso"], respondente: ["pais"], prioridade: "triagem", tempo: "10 min", appRoute: "/ips", description: "Processamento sensorial — Bateria Dr. Jadson." },
  { id: "edi", name: "EDI-NEXUS", fullName: "Escala de Depressão Infantil — Bateria Dr. Jadson", ageMin: 48, ageMax: 216, queixas: ["depressao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10 min", appRoute: "/edi", description: "24 itens de depressão infantil — Bateria de Regulação Emocional." },
  { id: "eai", name: "EAI-NEXUS", fullName: "Escala de Ansiedade Infantil — Bateria Dr. Jadson", ageMin: 48, ageMax: 216, queixas: ["ansiedade"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10 min", appRoute: "/eai", description: "20 itens de ansiedade infantil — Bateria de Regulação Emocional." },
  { id: "easi", name: "EASI-NEXUS", fullName: "Escala de Ansiedade Social Infantil — Bateria Dr. Jadson", ageMin: 48, ageMax: 216, queixas: ["ansiedade"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10 min", appRoute: "/easi", description: "15 itens de ansiedade social infantil — Bateria de Regulação Emocional." },
  { id: "ems", name: "EMS-NEXUS", fullName: "Escala de Mutismo Seletivo — Bateria Dr. Jadson", ageMin: 24, ageMax: 144, queixas: ["ansiedade", "linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10 min", appRoute: "/ems", description: "15 itens de mutismo seletivo — Bateria de Regulação Emocional." },
  { id: "etare", name: "ETARE-NEXUS", fullName: "Escala de Transtorno Alimentar Restritivo Evitativo — Bateria Dr. Jadson", ageMin: 24, ageMax: 216, queixas: ["alimentacao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10 min", appRoute: "/etare", description: "18 itens de TARE — Bateria de Regulação Emocional." },
  { id: "eaah", name: "EAAH-NEXUS", fullName: "Escala de Autoagressividade e Heteroagressividade — Bateria Dr. Jadson", ageMin: 36, ageMax: 216, queixas: ["comportamento", "suicidio"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10 min", appRoute: "/eaah", description: "20 itens de agressividade — Bateria de Regulação Emocional." },

  // ===== COGNIÇÃO / NEUROPSICOLOGIA (novas) =====
  { id: "wisc5-ext", name: "WISC-V", fullName: "Wechsler Intelligence Scale for Children V", ageMin: 72, ageMax: 204, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "60–90 min", description: "Avalia inteligência em 5 índices fatoriais: compreensão verbal, visual-espacial, raciocínio fluido, memória de trabalho e velocidade de processamento.", fonte: "Wechsler D, 2014", validacaoBrasil: "Sim", scoringCutoff: "QI <70 deficiência intelectual provável", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/wisc5-ext"},
  { id: "wppsi4-ext", name: "WPPSI-IV", fullName: "Wechsler Preschool and Primary Scale of Intelligence IV", ageMin: 24, ageMax: 84, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–60 min", description: "Bateria de inteligência para pré-escolares com índices de compreensão verbal, visual-espacial, fluido, memória de trabalho e velocidade de processamento.", appRoute: "/generic-scale/wppsi4-ext"},
  { id: "leiter3-ext", name: "Leiter-3", fullName: "Leiter International Performance Scale 3", ageMin: 36, ageMax: 216, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30 min", description: "Avaliação não-verbal de inteligência e memória. Indicada para crianças com barreira de linguagem, surdes ou TEA.", appRoute: "/generic-scale/leiter3-ext"},
  { id: "toni4", name: "TONI-4", fullName: "Test of Nonverbal Intelligence 4", ageMin: 72, ageMax: 216, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–20 min", description: "Teste de inteligência não-verbal com resposta gestual; mínima dependência de linguagem ou motricidade.", appRoute: "/generic-scale/toni4"},
  { id: "cpt3", name: "CPT-3", fullName: "Conners Continuous Performance Test 3", ageMin: 96, ageMax: 216, queixas: ["cognicao", "tdah"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "14 min", description: "Avalia atenção sustentada, impulsividade e vigilidade por desempenho computadorizado em 14 minutos.", appRoute: "/generic-scale/cpt3"},
  { id: "sb5", name: "Stanford-Binet 5", fullName: "Stanford-Binet Intelligence Scales 5", ageMin: 24, ageMax: 216, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "45–60 min", description: "Avalia 5 fatores cognitivos: raciocínio fluido, conhecimento, processamento quantitativo, processamento visual-espacial e memória de trabalho.", appRoute: "/generic-scale/sb5"},
  { id: "raven-std", name: "Raven Matrizes", fullName: "Matrizes Progressivas de Raven — Escala Geral", ageMin: 60, ageMax: 132, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "triagem", tempo: "20–30 min", description: "Avalia raciocínio não-verbal e educação da relação por matrizes progressivas. Amplamente utilizado como triagem de QI.", appRoute: "/generic-scale/raven-std"},
  { id: "kabc2", name: "K-ABC-II", fullName: "Kaufman Assessment Battery for Children II", ageMin: 36, ageMax: 216, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–70 min", description: "Bateria cognitiva com dois modelos interpretativos (Luria e CHC). Avalia processamento sequencial, simultâneo, aprendizagem e planejamento.", appRoute: "/generic-scale/kabc2"},
  { id: "wcst", name: "WCST", fullName: "Wisconsin Card Sorting Test", ageMin: 72, ageMax: 216, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "20–30 min", description: "Avalia flexibilidade cognitiva, formação de conceitos e função do lóbulo frontal por classificação de cartões.", appRoute: "/generic-scale/wcst"},
  { id: "tmt", name: "Trail Making A e B", fullName: "Trail Making Test A e B", ageMin: 108, ageMax: 216, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5–10 min", description: "Avalia velocidade de processamento, atenção e flexibilidade cognitiva. Parte A: sequenciamento; parte B: alternância.", appRoute: "/generic-scale/tmt"},
  { id: "stroop", name: "Stroop", fullName: "Stroop Color and Word Test", ageMin: 84, ageMax: 216, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5 min", description: "Avalia inibição de resposta, atenção seletiva e velocidade de processamento pelo efeito de interferência cor-palavra.", appRoute: "/generic-scale/stroop"},
  { id: "rey-figure", name: "Figura de Rey", fullName: "Rey Complex Figure Test", ageMin: 72, ageMax: 216, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10–20 min", description: "Avalia organização perceptiva, planejamento e memória visual por cópia e evocação de figura complexa.", appRoute: "/generic-scale/rey-figure"},
  { id: "ravlt", name: "RAVLT", fullName: "Rey Auditory Verbal Learning Test", ageMin: 84, ageMax: 216, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15 min", description: "Avalia aprendizagem verbal, memória episódica e suscetibilidade à interferência por listas de palavras.", appRoute: "/generic-scale/ravlt"},
  { id: "fas-fluencia", name: "FAS Fluência Verbal", fullName: "Teste de Fluência Verbal FAS", ageMin: 72, ageMax: 216, queixas: ["cognicao", "linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5 min", description: "Avalia fluência verbal fonológica (letras F, A, S) e semântica. Sensivel a disfunções frontais e de linguagem.", appRoute: "/generic-scale/fas-fluencia"},
  { id: "torre-londres", name: "Torre de Londres", fullName: "Tower of London Test", ageMin: 84, ageMax: 216, queixas: ["cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10–15 min", description: "Avalia planejamento, solução de problemas e funções executivas por tarefa de movimento de discos em pinos.", appRoute: "/generic-scale/torre-londres"},
  { id: "d2", name: "d2 Cancelamento", fullName: "Teste de Cancelamento d2", ageMin: 108, ageMax: 216, queixas: ["cognicao", "tdah"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "8 min", description: "Avalia atenção concentrada, velocidade de processamento e controle inibitório por tarefa de cancelamento de símbolos.", appRoute: "/generic-scale/d2"},

  // ===== LINGUAGEM (novas) =====
  { id: "celf5-new", name: "CELF-5", fullName: "Clinical Evaluation of Language Fundamentals 5", ageMin: 60, ageMax: 216, queixas: ["linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–60 min", description: "Avaliação clínica de fundamentos da linguagem: estrutura de frases, conceitos e direções, recado, repetição de frases e compreensão de palavras.", appRoute: "/generic-scale/celf5-new"},
  { id: "pls5", name: "PLS-5", fullName: "Preschool Language Scales 5", ageMin: 0, ageMax: 84, queixas: ["linguagem"], respondente: ["clinico"], prioridade: "triagem", tempo: "20–45 min", description: "Avalia habilidades de comunicação pré-verbal e verbal em crianças pequenas: atenção auditiva e habilidades expressivas.", appRoute: "/generic-scale/pls5"},
  { id: "ppvt4-new", name: "PPVT-4 Peabody", fullName: "Peabody Picture Vocabulary Test 4", ageMin: 30, ageMax: 216, queixas: ["linguagem", "cognicao"], respondente: ["clinico"], prioridade: "triagem", tempo: "10–15 min", description: "Avalia vocabulário receptivo por identificação de figuras. Não requer resposta verbal; útil em crianças não-verbais.", appRoute: "/generic-scale/ppvt4-new"},
  { id: "told-p5", name: "TOLD-P:5", fullName: "Test of Language Development Primary 5", ageMin: 48, ageMax: 96, queixas: ["linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–60 min", description: "Bateria de linguagem para pré-escolares e escolares iniciais: vocabulário, morfologia, sintaxe e fonologia.", appRoute: "/generic-scale/told-p5"},
  { id: "ctopp2", name: "CTOPP-2", fullName: "Comprehensive Test of Phonological Processing 2", ageMin: 48, ageMax: 216, queixas: ["linguagem", "aprendizagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30 min", description: "Avalia consciência fonológica, memória fonológica e velocidade de nomeação. Essencial para investigação de dislexia.", appRoute: "/generic-scale/ctopp2"},
  { id: "abfw-fono", name: "ABFW Fonologia", fullName: "Teste de Linguagem Infantil ABFW — Fonologia", ageMin: 36, ageMax: 144, queixas: ["linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "20 min", description: "Avalia o sistema fonológico da criança por nomeação de figuras. Padronizado para o Português Brasileiro.", appRoute: "/generic-scale/abfw-fono"},
  { id: "token-test", name: "Token Test", fullName: "Token Test Pediátrico", ageMin: 36, ageMax: 144, queixas: ["linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10 min", description: "Avalia compreensão auditiva de ordens simples e complexas com tokens coloridos. Sensivel a afasias e atrasos de linguagem.", appRoute: "/generic-scale/token-test"},
  { id: "eowpvt4", name: "EOWPVT-4", fullName: "Expressive One-Word Picture Vocabulary Test 4", ageMin: 24, ageMax: 216, queixas: ["linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–20 min", description: "Avalia vocabulário expressivo por nomeação de figuras. Complementar ao PPVT para perfil receptivo-expressivo.", appRoute: "/generic-scale/eowpvt4"},
  { id: "adl3", name: "ADL-3", fullName: "Auditory and Language Disorders Test 3", ageMin: 0, ageMax: 132, queixas: ["linguagem"], respondente: ["clinico"], prioridade: "triagem", tempo: "15–20 min", description: "Triagem de distúrbios de linguagem auditiva em crianças de 0 a 11 anos.", appRoute: "/generic-scale/adl3"},
  { id: "disc-auditiva", name: "Discriminação Auditiva", fullName: "Teste de Discriminação Auditiva", ageMin: 48, ageMax: 96, queixas: ["linguagem"], respondente: ["clinico"], prioridade: "triagem", tempo: "10 min", description: "Avalia a capacidade da criança de diferenciar pares de sons e palavras semelhantes. Indicado na investigação de dificuldades fonológicas.", appRoute: "/generic-scale/disc-auditiva"},

  // ===== MOTOR / COORDENAÇÃO (novas) =====
  { id: "mabc2", name: "MABC-2", fullName: "Movement Assessment Battery for Children 2", ageMin: 36, ageMax: 192, queixas: ["motor", "pc"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "20–30 min", description: "Avalia destreza manual, lançar e pegar bola e equilíbrio estático/dinâmico. Padrão-ouro para Transtorno do Desenvolvimento da Coordenação Motora.", fonte: "Henderson SE et al., 2007", validacaoBrasil: "Sim", scoringCutoff: "<5 percentil dificuldade motora significativa", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/mabc2"},
  { id: "bot2", name: "BOT-2", fullName: "Bruininks-Oseretsky Test of Motor Proficiency 2", ageMin: 48, ageMax: 216, queixas: ["motor"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "45–60 min", description: "Bateria abrangente de proficiência motora grossa e fina em 8 subáreas para crianças e adultos jovens.", appRoute: "/generic-scale/bot2"},
  { id: "pdms2", name: "PDMS-2", fullName: "Peabody Developmental Motor Scales 2", ageMin: 0, ageMax: 60, queixas: ["motor", "atraso"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "45–60 min", description: "Avalia desenvolvimento motor grosso e fino de 0 a 5 anos. Fornece quocientes motores padronizados.", appRoute: "/generic-scale/pdms2"},
  { id: "beery-vmi", name: "Beery VMI", fullName: "Beery-Buktenica Developmental Test of Visual-Motor Integration", ageMin: 24, ageMax: 216, queixas: ["motor", "aprendizagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10–15 min", description: "Avalia integração visomotora, percepção visual e coordenação motora por cópia de figuras geométricas.", appRoute: "/generic-scale/beery-vmi"},
  { id: "hammersmith-infant", name: "Hammersmith Infant", fullName: "Hammersmith Infant Neurological Examination", ageMin: 2, ageMax: 24, queixas: ["motor", "pc", "neonatal"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10–15 min", description: "Exame neurológico padronizado para lactentes. Prediz PC e desfechos motores com alta sensibilidade.", appRoute: "/generic-scale/hammersmith-infant"},
  { id: "pedi-cat", name: "PEDI-CAT", fullName: "Pediatric Evaluation of Disability Inventory Computer Adaptive Test", ageMin: 0, ageMax: 216, queixas: ["pc", "funcionalidade"], respondente: ["pais", "clinico"], prioridade: "diagnostica", tempo: "10–15 min", description: "Versão computadorizada adaptativa do PEDI. Avalia função diária em atividades, mobilidade, social-cognitivo e responsabilidade.", fonte: "Haley SM et al., 2012", validacaoBrasil: "Sim", scoringCutoff: "normas padronizadas por idade", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/pedi-cat"},
  { id: "tgmd3", name: "TGMD-3", fullName: "Test of Gross Motor Development 3", ageMin: 36, ageMax: 120, queixas: ["motor"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–20 min", description: "Avalia habilidades motoras grossas locomotoras e de controle de objetos em crianças de 3 a 10 anos.", appRoute: "/generic-scale/tgmd3"},
  { id: "sfa", name: "SFA", fullName: "School Function Assessment", ageMin: 60, ageMax: 144, queixas: ["funcionalidade", "aprendizagem"], respondente: ["clinico", "professor"], prioridade: "diagnostica", tempo: "15–20 min", description: "Avalia participação escolar, suporte necessário e desempenho em atividades acadêmicas e funcionais na escola.", appRoute: "/generic-scale/sfa"},

  // ===== EPILEPSIA (novas) =====
  { id: "lsss", name: "LSSS", fullName: "Liverpool Seizure Severity Scale", ageMin: 72, ageMax: 216, queixas: ["epilepsia"], respondente: ["autoaplicavel", "pais"], prioridade: "monitorizacao", tempo: "10 min", description: "Avalia a gravidade subjetiva das crises epilépticas: controle ictal, efeitos pós-ictais e impacto na vida diária.", appRoute: "/generic-scale/lsss"},
  { id: "nddi-e-new", name: "NDDI-E", fullName: "Neurological Disorders Depression Inventory for Epilepsy", ageMin: 144, ageMax: 216, queixas: ["epilepsia", "depressao"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "5 min", description: "6 itens de triagem rápida para depressão em pacientes com epilepsia, diferenciando de efeitos do tratamento.", appRoute: "/generic-scale/nddi-e-new"},
  { id: "qolie31", name: "QOLIE-31", fullName: "Quality of Life in Epilepsy 31", ageMin: 132, ageMax: 216, queixas: ["epilepsia"], respondente: ["autoaplicavel"], prioridade: "monitorizacao", tempo: "10 min", description: "31 itens avaliando qualidade de vida em epilepsia: preocupações com crises, bem-estar emocional, energia, cognição e efeitos da medicação. (Proveniência mapeada do QOLIE-31-P, forma parental.)", fonte: "Cramer JA et al.", validacaoBrasil: "Parcial", scoringCutoff: "escores maiores indicam melhor qualidade de vida", licencaUso: "restrita", pendente_validacao_clinica: false, appRoute: "/generic-scale/qolie31"},
  { id: "qolie-ad48", name: "QOLIE-AD-48", fullName: "Quality of Life in Epilepsy for Adolescents 48", ageMin: 132, ageMax: 204, queixas: ["epilepsia"], respondente: ["autoaplicavel"], prioridade: "monitorizacao", tempo: "15 min", description: "48 itens de qualidade de vida em epilepsia adaptados para adolescentes, incluindo impacto escolar e social.", appRoute: "/generic-scale/qolie-ad48"},
  { id: "engel", name: "Engel Classification", fullName: "Engel Seizure Outcome Scale", ageMin: 0, ageMax: 216, queixas: ["epilepsia"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5 min", description: "Classifica desfecho de crises após cirurgia de epilepsia em 4 classes (I: livre de crises; IV: sem melhora).", appRoute: "/generic-scale/engel"},
  { id: "hague-szs", name: "Hague Seizure Severity", fullName: "Hague Seizure Severity Scale", ageMin: 48, ageMax: 192, queixas: ["epilepsia"], respondente: ["pais", "clinico"], prioridade: "monitorizacao", tempo: "5 min", description: "Avalia gravidade e freqüência das crises em crianças com epilepsia, considerando estado pós-ictal e recuperação.", appRoute: "/generic-scale/hague-szs"},
  { id: "chalfont", name: "Chalfont", fullName: "Escala de Chalfont de Gravidade de Crises", ageMin: 0, ageMax: 216, queixas: ["epilepsia"], respondente: ["clinico", "pais"], prioridade: "monitorizacao", tempo: "10 min", description: "Avalia gravidade global das crises epilépticas considerando frequência, duração, estado pós-ictal e tipo de crise.", appRoute: "/generic-scale/chalfont"},
  { id: "ipes", name: "IPES", fullName: "Impact of Pediatric Epilepsy Scale", ageMin: 24, ageMax: 216, queixas: ["epilepsia"], respondente: ["pais"], prioridade: "monitorizacao", tempo: "10 min", description: "Avalia o impacto da epilepsia pediátrica nas atividades diárias, educação, desenvolvimento e bem-estar familiar.", appRoute: "/generic-scale/ipes"},

  // ===== NEONATAL (novas) =====
  { id: "dubowitz", name: "Dubowitz Neurológico", fullName: "Dubowitz Neurological Examination for the Newborn", ageMin: 0, ageMax: 12, queixas: ["neonatal"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15 min", description: "Exame neurológico padronizado para recém-nascidos, avaliando reflexos, tono e comportamento.", appRoute: "/generic-scale/dubowitz"},
  { id: "ballard", name: "Ballard", fullName: "New Ballard Score", ageMin: 0, ageMax: 0, queixas: ["neonatal"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5 min", description: "Avalia maturidade neuromuscular e física do recém-nascido para estimar idade gestacional ao nascimento.", appRoute: "/generic-scale/ballard"},
  { id: "apgar", name: "APGAR", fullName: "APGAR Score", ageMin: 0, ageMax: 0, queixas: ["neonatal"], respondente: ["clinico"], prioridade: "triagem", tempo: "1 min", description: "Avalia vitalidade do recém-nascido no 1º e 5º minuto de vida: aparência, pulso, grimacea, atividade e respiração.", appRoute: "/generic-scale/apgar"},
  { id: "snappe2", name: "SNAPPE-II", fullName: "Score for Neonatal Acute Physiology Perinatal Extension II", ageMin: 0, ageMax: 1, queixas: ["neonatal"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5 min", description: "Pontuacao de gravidade neonatal nas primeiras 12h de vida. Prediz mortalidade e morbidade em UTI neonatal.", appRoute: "/generic-scale/snappe2"},
  { id: "crib2", name: "CRIB-II", fullName: "Clinical Risk Index for Babies II", ageMin: 0, ageMax: 0, queixas: ["neonatal"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5 min", description: "Avalia risco clínico de recém-nascidos pré-termo nas primeiras 12 horas. Considera sexo, idade gestacional, peso e temperatura.", appRoute: "/generic-scale/crib2"},

  // ===== DOR (novas) =====
  { id: "wong-baker-new", name: "Wong-Baker FACES", fullName: "Wong-Baker FACES Pain Rating Scale", ageMin: 36, ageMax: 216, queixas: ["dor"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "1 min", description: "Seis faces ilustradas para autoavaliação de intensidade de dor em crianças a partir de 3 anos, variando de sem dor a dor máxima.", appRoute: "/generic-scale/wong-baker-new"},
  { id: "flacc-new", name: "FLACC", fullName: "Face, Legs, Activity, Cry, Consolability Scale", ageMin: 0, ageMax: 84, queixas: ["dor"], respondente: ["clinico"], prioridade: "triagem", tempo: "2 min", description: "Avalia dor comportamental em crianças pré-verbais observando face, pernas, atividade, choro e consolabilidade (0–10).", appRoute: "/generic-scale/flacc-new"},
  { id: "cries", name: "CRIES", fullName: "Crying Requires Oxygen Increased Vital Signs Expression Sleepless Scale", ageMin: 0, ageMax: 6, queixas: ["dor", "neonatal"], respondente: ["clinico"], prioridade: "triagem", tempo: "2 min", description: "Avalia dor pós-operatória neonatal por choro, saturação, sinais vitais, expressão facial e sonolencia.", fonte: "Krechel SW & Bildner J, 1995", validacaoBrasil: "Sim", scoringCutoff: "0-3 nenhuma/dor mínima; 4-6 dor moderada; ≥7 dor severa", licencaUso: "livre", appRoute: "/generic-scale/cries"},
  { id: "nips", name: "NIPS", fullName: "Neonatal Infant Pain Scale", ageMin: 0, ageMax: 12, queixas: ["dor", "neonatal"], respondente: ["clinico"], prioridade: "triagem", tempo: "1 min", description: "6 indicadores comportamentais de dor em recém-nascidos: expressão facial, choro, respiração, braços, pernas e estado.", appRoute: "/generic-scale/nips"},
  { id: "rflacc", name: "r-FLACC", fullName: "Revised FLACC Scale", ageMin: 48, ageMax: 216, queixas: ["dor", "pc"], respondente: ["clinico"], prioridade: "triagem", tempo: "2 min", description: "Versão revisada do FLACC para crianças com deficiência intelectual ou incapacidades comunicativas.", appRoute: "/generic-scale/rflacc"},
  { id: "eva-ped", name: "EVA Pediátrica", fullName: "Escala Visual Analógica Pediátrica", ageMin: 84, ageMax: 216, queixas: ["dor"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "1 min", description: "Linha horizontal de 10cm com ancora verbal/visual. Requer compreensão abstrata; indicada a partir de 7 anos.", appRoute: "/generic-scale/eva-ped"},
  { id: "ppp", name: "PPP", fullName: "Paediatric Pain Profile", ageMin: 12, ageMax: 216, queixas: ["dor", "pc"], respondente: ["pais", "clinico"], prioridade: "monitorizacao", tempo: "5 min", description: "20 itens comportamentais para avaliação de dor em crianças com deficiência intelectual ou comunicação limitada.", appRoute: "/generic-scale/ppp"},
  { id: "comfort-b", name: "COMFORT-B", fullName: "COMFORT-Behavioral Scale", ageMin: 0, ageMax: 216, queixas: ["dor", "neonatal"], respondente: ["clinico"], prioridade: "triagem", tempo: "2 min", description: "Avalia distúress e dor em UTI pediátrica/neonatal por 6 comportamentos observacionais. Amplamente validada para pacientes não-verbais.", appRoute: "/generic-scale/comfort-b"},

  // ===== SONO ADICIONAL =====
  { id: "psq-new", name: "PSQ", fullName: "Pediatric Sleep Questionnaire", ageMin: 24, ageMax: 216, queixas: ["sono"], respondente: ["pais"], prioridade: "triagem", tempo: "5 min", description: "22 itens para triagem de distúrbios respiratórios do sono, hiperatividade e sonolência diurna em crianças.", appRoute: "/generic-scale/psq-new"},
  { id: "bears-new", name: "BEARS", fullName: "Bedtime, Excessive Daytime Sleepiness, Awakenings, Regularity, Snoring", ageMin: 24, ageMax: 216, queixas: ["sono"], respondente: ["pais", "autoaplicavel"], prioridade: "triagem", tempo: "5 min", description: "5 perguntas de triagem de distúrbios do sono adaptadas para cada faixa etária pediátrica.", fonte: "Owens JA, Dalzell V, 2005", pubmedId: "PMID 15764706", validacaoBrasil: "Parcial", scoringCutoff: "triagem qualitativa sem cutoff único", licencaUso: "livre", pendente_validacao_clinica: false, appRoute: "/generic-scale/bears-new"},
  { id: "ess-adol", name: "ESS Adolescente", fullName: "Epworth Sleepiness Scale — Versão Adolescente Modificada", ageMin: 144, ageMax: 216, queixas: ["sono"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "5 min", description: "8 situações cotidianas para medir sonolência diurna excessiva em adolescentes.", appRoute: "/generic-scale/ess-adol"},
  { id: "psqi-ped", name: "PSQI Pediátrico", fullName: "Pittsburgh Sleep Quality Index — Adaptado Pediátrico", ageMin: 96, ageMax: 216, queixas: ["sono"], respondente: ["autoaplicavel", "pais"], prioridade: "monitorizacao", tempo: "10 min", description: "Avalia qualidade subjetiva do sono no último mês: latência, duração, eficiência, distúrbios e sonolência diurna.", appRoute: "/generic-scale/psqi-ped"},
  { id: "sdsc-new", name: "SDSC", fullName: "Sleep Disturbance Scale for Children", ageMin: 72, ageMax: 180, queixas: ["sono"], respondente: ["pais"], prioridade: "diagnostica", tempo: "10 min", description: "26 itens classificando distúrbios do sono em 6 categorias: iniciação/manutenção, respiratórios, arousáis, transição sono-vigília, sonolência excessiva e hiperidrose.", fonte: "Bruni O et al., 1996", pubmedId: "PMID 8989069", validacaoBrasil: "Sim", scoringCutoff: "T-score >70", licencaUso: "restrita", pendente_validacao_clinica: false, appRoute: "/generic-scale/sdsc-new"},

  // ===== TOC =====
  { id: "cybocs", name: "CY-BOCS", fullName: "Children’s Yale-Brown Obsessive Compulsive Scale", ageMin: 72, ageMax: 204, queixas: ["toc"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–30 min", description: "Padrão-ouro para avaliação de gravidade de TOC em crianças e adolescentes. 10 itens em obsessões e compulsões.", appRoute: "/generic-scale/cybocs"},
  { id: "oci-cv", name: "OCI-CV", fullName: "Obsessive Compulsive Inventory — Child Version", ageMin: 84, ageMax: 204, queixas: ["toc"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "10 min", description: "21 itens de triagem de sintomas obsessivo-compulsivos em crianças e adolescentes. Versão pediátrica do OCI.", appRoute: "/generic-scale/oci-cv"},
  { id: "docs", name: "DOCS", fullName: "Dimensional Obsessive-Compulsive Scale", ageMin: 144, ageMax: 216, queixas: ["toc"], respondente: ["autoaplicavel"], prioridade: "monitorizacao", tempo: "10 min", description: "20 itens avaliando 4 dimensões de TOC: contaminãção, responsabilidade/dano, inaceitável/intrusivo e simetria.", appRoute: "/generic-scale/docs"},
  { id: "cybocs-sr", name: "CY-BOCS-SR", fullName: "Children’s Yale-Brown OCS — Self-Report", ageMin: 96, ageMax: 204, queixas: ["toc"], respondente: ["autoaplicavel"], prioridade: "monitorizacao", tempo: "10 min", description: "Versão de autoavaliacão do CY-BOCS para monitorização de sintomas em crianças a partir de 8 anos.", appRoute: "/generic-scale/cybocs-sr"},
  { id: "fas-pr", name: "FAS-PR", fullName: "Family Accommodation Scale for Pediatric OCD — Parent Report", ageMin: 0, ageMax: 204, queixas: ["toc"], respondente: ["pais"], prioridade: "monitorizacao", tempo: "10 min", description: "Avalia o grau de acomodação familiar aos sintomas de TOC da criança. Importante para planejamento do tratamento.", appRoute: "/generic-scale/fas-pr"},

  // ===== TRAUMA / TEPT =====
  { id: "cpss-v", name: "CPSS-V", fullName: "Child PTSD Symptom Scale for DSM-5", ageMin: 96, ageMax: 216, queixas: ["trauma"], respondente: ["autoaplicavel", "crianca"], prioridade: "diagnostica", tempo: "15 min", description: "20 itens alinhados ao DSM-5 para diagnóstico e monitorização de TEPT em crianças e adolescentes.", appRoute: "/generic-scale/cpss-v"},
  { id: "ucla-ptsd", name: "UCLA PTSD-RI", fullName: "UCLA PTSD Reaction Index for DSM-5", ageMin: 84, ageMax: 216, queixas: ["trauma"], respondente: ["autoaplicavel", "clinico"], prioridade: "diagnostica", tempo: "20–30 min", description: "Instrumento estruturado para diagnóstico de TEPT em crianças e adolescentes com sequência de triagem de eventos traumáticos.", appRoute: "/generic-scale/ucla-ptsd"},
  { id: "cries13", name: "CRIES-13", fullName: "Children’s Revised Impact of Event Scale 13", ageMin: 96, ageMax: 216, queixas: ["trauma"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "5 min", description: "13 itens avaliando intrusão, evitação e exitação após eventos traumáticos em crianças.", appRoute: "/generic-scale/cries13"},
  { id: "tscc", name: "TSCC", fullName: "Trauma Symptom Checklist for Children", ageMin: 96, ageMax: 192, queixas: ["trauma"], respondente: ["autoaplicavel"], prioridade: "diagnostica", tempo: "15–20 min", description: "54 itens avaliando angúistia pós-traumática, depressão, ansiedade, raiva, dissociacião e preocupações sexuais.", appRoute: "/generic-scale/tscc"},
  { id: "ace", name: "ACE", fullName: "Adverse Childhood Experiences Questionnaire", ageMin: 144, ageMax: 216, queixas: ["trauma"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "5 min", description: "10 categorias de experiências adversas na infância. Em pediatria, aplicável a adolescentes. Forte preditor de desfechos em saúde.", appRoute: "/generic-scale/ace"},
  { id: "csbi", name: "CSBI", fullName: "Child Sexual Behavior Inventory", ageMin: 24, ageMax: 144, queixas: ["trauma", "comportamento"], respondente: ["pais"], prioridade: "diagnostica", tempo: "15 min", description: "38 itens avaliando comportamentos sexuais em crianças de 2 a 12 anos. Identifica comportamentos fora do desenvolvimento normativo.", appRoute: "/generic-scale/csbi"},
  { id: "cdi-screen-trauma", name: "CDI Trauma Screen", fullName: "Child Dissociative Inventory — Screen for Trauma", ageMin: 96, ageMax: 216, queixas: ["trauma"], respondente: ["autoaplicavel", "pais"], prioridade: "triagem", tempo: "5 min", description: "Triagem rápida de sintomas dissociativos e traumáticos em crianças e adolescentes.", appRoute: "/generic-scale/cdi-screen-trauma"},
  { id: "cats", name: "CATS", fullName: "Child and Adolescent Trauma Screen", ageMin: 36, ageMax: 204, queixas: ["trauma"], respondente: ["autoaplicavel", "pais"], prioridade: "triagem", tempo: "5–10 min", description: "Triagem de exposição a traumas e sintomas de TEPT em crianças de 3 a 17 anos, com versões para pais e autoaplicada.", appRoute: "/generic-scale/cats"},

  // ===== FUNCIONALIDADE / ADAPTAÇÃO =====
  { id: "abas3", name: "ABAS-3", fullName: "Adaptive Behavior Assessment System 3", ageMin: 0, ageMax: 216, queixas: ["funcionalidade"], respondente: ["pais", "professor"], prioridade: "diagnostica", tempo: "15–20 min", description: "Avalia habilidades adaptativas em 10 áreas: comunicação, vida comunitária, acadêmico, lazer, autocuidado, saúde/segurança, autonomia, social e trabalho.", fonte: "Harrison PL, Oakland T, 2015", validacaoBrasil: "Parcial", scoringCutoff: "GAC <70", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/abas3"},
  { id: "copm", name: "COPM", fullName: "Canadian Occupational Performance Measure", ageMin: 0, ageMax: 216, queixas: ["funcionalidade", "pc"], respondente: ["clinico", "pais", "autoaplicavel"], prioridade: "monitorizacao", tempo: "20–40 min", description: "Medida centrada no cliente que identifica problemas de desempenho ocupacional e monitora mudanças ao longo do tratamento.", appRoute: "/generic-scale/copm"},
  { id: "gas", name: "GAS", fullName: "Goal Attainment Scaling", ageMin: 0, ageMax: 216, queixas: ["funcionalidade"], respondente: ["clinico"], prioridade: "monitorizacao", tempo: "15 min", description: "Método individualizado de definição e mensuração de metas terapêuticas em uma escala de -2 a +2 para cada objetivo.", appRoute: "/generic-scale/gas"},
  { id: "life-h", name: "LIFE-H", fullName: "Assessment of Life Habits for Children", ageMin: 60, ageMax: 156, queixas: ["funcionalidade", "pc"], respondente: ["pais", "clinico"], prioridade: "diagnostica", tempo: "30–60 min", description: "Avalia participação social e realização de hábitos diários em crianças com deficiência ou condição crônica.", appRoute: "/generic-scale/life-h"},
  { id: "pedi", name: "PEDI", fullName: "Pediatric Evaluation of Disability Inventory", ageMin: 6, ageMax: 84, queixas: ["funcionalidade", "pc"], respondente: ["clinico", "pais"], prioridade: "diagnostica", tempo: "45 min", description: "Avalia habilidades funcionais de autocuidado, mobilidade e função social em 3 escalas: capacidade, assistência e modificações.", appRoute: "/generic-scale/pedi"},

  // ===== QUALIDADE DE VIDA =====
  { id: "kidscreen52", name: "KIDSCREEN-52", fullName: "KIDSCREEN-52 Health-Related Quality of Life Questionnaire", ageMin: 96, ageMax: 216, queixas: ["funcionalidade"], respondente: ["autoaplicavel", "pais"], prioridade: "monitorizacao", tempo: "15 min", description: "52 itens em 10 dimensões de qualidade de vida: saúde física, bem-estar, humor, autopercepção, autonomia, pais, pares, escola, financeiro e social.", appRoute: "/generic-scale/kidscreen52"},
  { id: "auquei", name: "AUQUEI", fullName: "Autoquestionnaire Qualité de Vie Enfant Imagé", ageMin: 48, ageMax: 144, queixas: ["funcionalidade"], respondente: ["autoaplicavel"], prioridade: "monitorizacao", tempo: "10 min", description: "26 itens ilustrados de qualidade de vida para crianças de 4 a 12 anos. Explora família, pares, saúde e atividades.", appRoute: "/generic-scale/auquei"},
  { id: "chq-pf50", name: "CHQ-PF50", fullName: "Child Health Questionnaire — Parent Form 50", ageMin: 60, ageMax: 216, queixas: ["funcionalidade"], respondente: ["pais"], prioridade: "monitorizacao", tempo: "10 min", description: "50 itens de qualidade de vida pediátrica respondidos pelos pais. Cobre saúde física, emocional, social e escolar.", appRoute: "/generic-scale/chq-pf50"},
  { id: "disabkids", name: "DISABKIDS", fullName: "DISABKIDS Chronic Generic Measure", ageMin: 96, ageMax: 192, queixas: ["funcionalidade"], respondente: ["autoaplicavel", "pais"], prioridade: "monitorizacao", tempo: "15 min", description: "Qualidade de vida genérica para crianças com condições crônicas. Avalia independência, inclusão social e emoções.", appRoute: "/generic-scale/disabkids"},
  { id: "whoqol-ped", name: "WHOQOL-BREF Pediátrico", fullName: "WHOQOL-BREF Adaptado para Adolescentes", ageMin: 144, ageMax: 216, queixas: ["funcionalidade"], respondente: ["autoaplicavel"], prioridade: "monitorizacao", tempo: "10 min", description: "26 itens da OMS de qualidade de vida em 4 domínios: físico, psicológico, social e ambiental. Adaptado para adolescentes.", appRoute: "/generic-scale/whoqol-ped"},

  // ===== REGULAÇÃO EMOCIONAL ADICIONAL =====
  { id: "ders", name: "DERS", fullName: "Difficulties in Emotion Regulation Scale", ageMin: 144, ageMax: 216, queixas: ["ansiedade", "depressao"], respondente: ["autoaplicavel"], prioridade: "diagnostica", tempo: "10 min", description: "36 itens avaliando múltiplas facetas da desregulação emocional: consciência, clareza, aceitacao, metas, impulso e estratégias.", appRoute: "/generic-scale/ders"},
  { id: "erc", name: "ERC", fullName: "Emotion Regulation Checklist", ageMin: 24, ageMax: 144, queixas: ["comportamento"], respondente: ["pais", "professor"], prioridade: "diagnostica", tempo: "10 min", description: "24 itens avaliando regulação emocional e labilidade/negatividade em crianças de 2 a 12 anos respondidos por pais ou professores.", appRoute: "/generic-scale/erc"},
  { id: "cems", name: "CEMS", fullName: "Children’s Emotion Management Scales", ageMin: 108, ageMax: 144, queixas: ["depressao"], respondente: ["autoaplicavel"], prioridade: "diagnostica", tempo: "10 min", description: "Avalia estratégias de gestão de raiva e tristeza em crianças de 9 a 12 anos: expressão, repressão e coping.", appRoute: "/generic-scale/cems"},
  { id: "casi", name: "CASI", fullName: "Child Anxiety Sensitivity Index", ageMin: 72, ageMax: 204, queixas: ["ansiedade"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "10 min", description: "18 itens mensurando sensibilidade à ansiedade (medo de sintomas ansiosos) em crianças e adolescentes. Fator de risco para transtornos de ansiedade.", appRoute: "/generic-scale/casi"},
  { id: "scared-r", name: "SCARED Revisada", fullName: "Screen for Child Anxiety Related Disorders — Revisão", ageMin: 96, ageMax: 216, queixas: ["ansiedade"], respondente: ["autoaplicavel", "pais"], prioridade: "diagnostica", tempo: "10 min", description: "41 itens cobrindo 5 domínios de ansiedade: pânico, TAG, ansiedade de separação, fobia escolar e fobia social.", appRoute: "/generic-scale/scared-r"},

  // ===== ENURESE =====
  { id: "dvss", name: "DVSS", fullName: "Dysfunctional Voiding Symptom Score", ageMin: 36, ageMax: 216, queixas: ["enurese"], respondente: ["pais", "autoaplicavel"], prioridade: "triagem", tempo: "5 min", description: "10 itens avaliando sintomas de disfunção miccional em crianças: urgência, freqüência, esforço, incontinencia e constipação.", appRoute: "/generic-scale/dvss"},
  { id: "bristol-stool", name: "Bristol Stool Scale", fullName: "Bristol Stool Form Scale Adaptada Pediátrica", ageMin: 48, ageMax: 216, queixas: ["enurese"], respondente: ["pais", "autoaplicavel"], prioridade: "triagem", tempo: "2 min", description: "7 tipos de fezes ilustrados para avaliação de constipação e diarreia. Adaptada com figuras para crianças a partir de 4 anos.", appRoute: "/generic-scale/bristol-stool"},
  { id: "bladder-diary", name: "Diário Vesical Pediátrico", fullName: "Bladder Diary Pediátrico", ageMin: 60, ageMax: 216, queixas: ["enurese"], respondente: ["pais", "autoaplicavel"], prioridade: "monitorizacao", tempo: "7 dias", description: "Registro diário de frequência miccional, volume, episódios de escape, ingestão hídrica e hábitos defecacionais por 7 dias.", appRoute: "/generic-scale/bladder-diary"},

  // ===== PSICOSE ADICIONAL =====
  { id: "sips", name: "SIPS/SOPS", fullName: "Structured Interview for Prodromal Syndromes / Scale of Prodromal Symptoms", ageMin: 144, ageMax: 216, queixas: ["psicose"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–60 min", description: "Entrevista estruturada para identificação de síndromes prodrômicas de psicose (UHR) em adolescentes e adultos jovens.", appRoute: "/generic-scale/sips"},
  { id: "prime-screen", name: "PRIME Screen", fullName: "PRIME Screen for Psychosis Risk", ageMin: 144, ageMax: 216, queixas: ["psicose"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "10 min", description: "12 itens de triagem de risco ultra-alto para psicose em adolescentes. Baseado nos critérios do SIPS/SOPS.", appRoute: "/generic-scale/prime-screen"},

  // ===== NOVOS INSTRUMENTOS — BLOCO 0 (lista Dr. Jadson, 2026) =====
  // ----- Desenvolvimento / Cognição -----
  { id: "das2", name: "DAS-II", fullName: "Differential Ability Scales II", ageMin: 30, ageMax: 216, queixas: ["cognicao", "aprendizagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "45–60 min", description: "Bateria cognitiva diferencial com habilidade conceitual geral (GCA) e clusters verbal, não-verbal e espacial. Útil em deficiência intelectual e dificuldades de aprendizagem.", fonte: "Elliott CD, 2007 (DAS-II), Pearson", validacaoBrasil: "Não", scoringCutoff: "GCA <70 sugere déficit cognitivo significativo", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/das2"},
  { id: "mullen", name: "Mullen", fullName: "Mullen Scales of Early Learning", ageMin: 0, ageMax: 68, queixas: ["atraso", "cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "30–60 min", description: "Avaliação do desenvolvimento precoce em 5 escalas: motora grossa, visual receptiva, motora fina, linguagem receptiva e expressiva. Muito usada em pesquisa de TEA.", fonte: "Mullen EM, 1995 (Mullen Scales of Early Learning), AGS/Pearson", validacaoBrasil: "Não", scoringCutoff: "Early Learning Composite <70 abaixo do esperado", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/mullen"},
  { id: "battelle3", name: "Battelle-3", fullName: "Battelle Developmental Inventory 3", ageMin: 0, ageMax: 95, queixas: ["atraso", "funcionalidade"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "60–90 min", description: "Inventário do desenvolvimento em 5 domínios: pessoal-social, adaptativo, motor, comunicação e cognitivo. Inclui triagem rápida.", fonte: "Newborg J, 2020 (Battelle Developmental Inventory 3), Riverside", validacaoBrasil: "Não", scoringCutoff: "Developmental Quotient <80 atraso provável", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/battelle3"},
  // ----- Motricidade / Sensorial -----
  { id: "spm2", name: "SPM-2", fullName: "Sensory Processing Measure 2", ageMin: 60, ageMax: 216, queixas: ["sensorial", "tea"], respondente: ["pais", "clinico"], prioridade: "diagnostica", tempo: "15–20 min", description: "Avalia processamento sensorial, práxis e participação social em casa, escola e comunidade. Conjunto de formulários por contexto.", fonte: "Parham LD et al., 2021 (SPM-2), WPS", validacaoBrasil: "Não", scoringCutoff: "T-score >=60 disfunção provável", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/spm2"},
  { id: "sensory-profile2", name: "Sensory Profile-2", fullName: "Sensory Profile 2 (Dunn)", ageMin: 0, ageMax: 168, queixas: ["sensorial", "tea", "atraso"], respondente: ["pais"], prioridade: "diagnostica", tempo: "15–20 min", description: "Caracteriza padrões de processamento sensorial (registro, busca, sensibilidade, evitação) segundo o modelo de Dunn. Formulários por faixa etária.", fonte: "Dunn W, 2014 (Sensory Profile 2), Pearson", validacaoBrasil: "Parcial", scoringCutoff: "classificação por quadrantes (mais/menos que a maioria)", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/sensory-profile2"},
  // ----- Neonatal / Primeira infância -----
  { id: "infanib", name: "INFANIB", fullName: "Infant Neurological International Battery", ageMin: 0, ageMax: 18, queixas: ["neonatal", "motor", "pc"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–20 min", description: "Bateria neurológica padronizada para lactentes: tônus, reflexos, ângulos e controle postural. Classifica em normal, transitório ou anormal.", fonte: "Ellison PH, 1994 (INFANIB)", validacaoBrasil: "Parcial", scoringCutoff: "escore baixo sugere anormalidade neurológica", licencaUso: "livre", pendente_validacao_clinica: false, appRoute: "/generic-scale/infanib"},
  // ----- Linguagem / Comunicação -----
  { id: "evt2", name: "EVT-2", fullName: "Expressive Vocabulary Test 2", ageMin: 30, ageMax: 216, queixas: ["linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "10–20 min", description: "Avalia vocabulário expressivo e recuperação de palavras por nomeação e sinônimos. Co-normatizado com o PPVT-4.", fonte: "Williams KT, 2007 (EVT-2), Pearson", validacaoBrasil: "Não", scoringCutoff: "standard score <85 abaixo do esperado", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/evt2"},
  { id: "csbs-dp", name: "CSBS-DP", fullName: "Communication and Symbolic Behavior Scales Developmental Profile", ageMin: 6, ageMax: 24, queixas: ["linguagem", "tea", "atraso"], respondente: ["pais", "clinico"], prioridade: "triagem", tempo: "15–30 min", description: "Avalia comunicação social, uso de gestos, sons, palavras e comportamento simbólico em lactentes. Checklist do cuidador + amostra comportamental.", fonte: "Wetherby AM, Prizant BM, 2002 (CSBS-DP), Brookes", validacaoBrasil: "Não", scoringCutoff: "escore abaixo do ponto de corte indica risco comunicativo", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/csbs-dp"},
  // ----- TDAH / Atenção -----
  { id: "tova", name: "TOVA", fullName: "Test of Variables of Attention", ageMin: 48, ageMax: 216, queixas: ["tdah", "cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "20 min", description: "Teste computadorizado de desempenho contínuo, livre de linguagem/cultura, que mede atenção sustentada, tempo de reação, variabilidade e impulsividade.", fonte: "Greenberg LM, 2007 (TOVA), The TOVA Company", validacaoBrasil: "Não", scoringCutoff: "ADHD Score negativo sugere perfil compatível com TDAH", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/tova"},
  // ----- Aprendizagem / Escolaridade -----
  { id: "wrat5", name: "WRAT-5", fullName: "Wide Range Achievement Test 5", ageMin: 60, ageMax: 216, queixas: ["aprendizagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "15–45 min", description: "Avalia desempenho acadêmico básico: leitura de palavras, compreensão de frases, soletração e matemática.", fonte: "Wilkinson GS, Robertson GJ, 2017 (WRAT-5), Pearson", validacaoBrasil: "Não", scoringCutoff: "standard score <85 abaixo da média", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/wrat5"},
  { id: "wj4", name: "WJ-IV", fullName: "Woodcock-Johnson IV", ageMin: 24, ageMax: 216, queixas: ["aprendizagem", "cognicao"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "60–120 min", description: "Bateria abrangente de habilidades cognitivas e de desempenho acadêmico (leitura, escrita, matemática) ancorada no modelo CHC.", fonte: "Schrank FA et al., 2014 (Woodcock-Johnson IV), Riverside", validacaoBrasil: "Não", scoringCutoff: "standard score <85 abaixo do esperado", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/wj4"},
  { id: "towl4", name: "TOWL-4", fullName: "Test of Written Language 4", ageMin: 84, ageMax: 216, queixas: ["aprendizagem", "linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "60–90 min", description: "Avalia linguagem escrita em componentes contrived (vocabulário, pontuação, gramática) e espontâneo (composição de história).", fonte: "Hammill DD, Larsen SC, 2009 (TOWL-4), PRO-ED", validacaoBrasil: "Não", scoringCutoff: "standard score <85 dificuldade de escrita", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/towl4"},
  { id: "gort5", name: "GORT-5", fullName: "Gray Oral Reading Tests 5", ageMin: 72, ageMax: 216, queixas: ["aprendizagem", "linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "20–30 min", description: "Avalia fluência de leitura oral (taxa, precisão, fluência) e compreensão. Sensível à dislexia e a dificuldades de leitura.", fonte: "Wiederholt JL, Bryant BR, 2012 (GORT-5), PRO-ED", validacaoBrasil: "Não", scoringCutoff: "Oral Reading Index <85 abaixo do esperado", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/gort5"},
  { id: "ran-ras", name: "RAN/RAS", fullName: "Rapid Automatized Naming / Rapid Alternating Stimulus Tests", ageMin: 60, ageMax: 216, queixas: ["aprendizagem", "linguagem"], respondente: ["clinico"], prioridade: "diagnostica", tempo: "5–10 min", description: "Mede velocidade de nomeação automatizada de objetos, cores, letras e números. Forte preditor de fluência de leitura e dislexia.", fonte: "Wolf M, Denckla MB, 2005 (RAN/RAS), PRO-ED", validacaoBrasil: "Parcial", scoringCutoff: "tempos elevados / escores baixos sugerem déficit de nomeação", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/ran-ras"},
  // ----- Comportamento / TEA -----
  { id: "stat", name: "STAT", fullName: "Screening Tool for Autism in Toddlers and Young Children", ageMin: 24, ageMax: 36, queixas: ["tea"], respondente: ["clinico"], prioridade: "triagem", tempo: "20 min", description: "Triagem interativa de TEA de nível 2 com 12 itens em brincadeira, imitação e comunicação. Aplicada por clínico treinado.", fonte: "Stone WL et al., 2000 (STAT)", pubmedId: "PMID 11055461", validacaoBrasil: "Não", scoringCutoff: ">2.0 risco de TEA", licencaUso: "restrita", pendente_validacao_clinica: false, appRoute: "/generic-scale/stat"},
  { id: "abc-autism", name: "ABC (Autism)", fullName: "Autism Behavior Checklist (ABC / ABC-Krug)", ageMin: 18, ageMax: 216, queixas: ["tea", "comportamento"], respondente: ["pais", "professor"], prioridade: "triagem", tempo: "10–15 min", description: "57 itens em 5 áreas (sensorial, relacionamento, uso do corpo/objeto, linguagem e social/autocuidado) para triagem de TEA. Distinto do Aberrant Behavior Checklist.", fonte: "Krug DA, Arick J, Almond P, 1980 (Autism Behavior Checklist)", validacaoBrasil: "Parcial", scoringCutoff: ">=67 alta probabilidade de TEA", licencaUso: "restrita", pendente_validacao_clinica: false, appRoute: "/generic-scale/abc-autism"},
  { id: "basc3", name: "BASC-3", fullName: "Behavior Assessment System for Children 3", ageMin: 24, ageMax: 216, queixas: ["comportamento", "tdah", "ansiedade", "depressao"], respondente: ["pais", "professor"], prioridade: "diagnostica", tempo: "15–30 min", description: "Sistema multidimensional de avaliação comportamental e emocional com escalas clínicas e adaptativas, formulários para pais, professores e autoavaliação.", fonte: "Reynolds CR, Kamphaus RW, 2015 (BASC-3), Pearson", validacaoBrasil: "Não", scoringCutoff: "T-score >=70 clinicamente significativo", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/basc3"},
  { id: "trf", name: "TRF", fullName: "Teacher's Report Form (ASEBA)", ageMin: 72, ageMax: 216, queixas: ["comportamento", "tdah", "ansiedade"], respondente: ["professor"], prioridade: "triagem", tempo: "15–20 min", description: "Versão para professores do sistema ASEBA. Avalia problemas internalizantes, externalizantes e desempenho escolar em 6–18 anos.", fonte: "Achenbach TM, Rescorla LA, 2001 (TRF / ASEBA), ASEBA", validacaoBrasil: "Parcial", scoringCutoff: "T-score >=64 (escala total) clínico", licencaUso: "comercial", pendente_validacao_clinica: false, appRoute: "/generic-scale/trf"},
  // ----- Backlog livre/domínio público (SCALES_PARA_ADICIONAR) -----
  // CY-BOCS já existe no catálogo (cybocs); só BBD era genuinamente novo.
  { id: "bowel-bladder-checklist", name: "BBD Checklist", fullName: "Bowel and Bladder Dysfunction Symptom Checklist", ageMin: 48, ageMax: 204, queixas: ["enurese"], respondente: ["pais"], prioridade: "triagem", tempo: "5–10 min", description: "Avaliação de sintomas de disfunção intestinal e vesical combinados.", fonte: "NIH-funded research", licencaUso: "livre", pendente_validacao_clinica: false, appRoute: "/generic-scale/bowel-bladder-checklist"},
  { id: "gad7", name: "GAD-7", fullName: "Generalized Anxiety Disorder 7-item", ageMin: 132, ageMax: 216, queixas: ["ansiedade"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "2–5 min", description: "Triagem de transtorno de ansiedade generalizada — 7 itens, autoaplicável (adolescentes/adultos).", fonte: "Spitzer RL et al., 2006 - Arch Intern Med", validacaoBrasil: "Sim", scoringCutoff: ">=10 ansiedade moderada; >=15 grave", licencaUso: "livre", pendente_validacao_clinica: false, appRoute: "/generic-scale/gad7"},
  { id: "scoff", name: "SCOFF", fullName: "SCOFF Questionnaire (transtornos alimentares)", ageMin: 132, ageMax: 216, queixas: ["alimentacao"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "2 min", description: "Triagem rápida de transtornos alimentares — 5 perguntas sim/não. ≥2 'sim' sugere avaliação adicional.", fonte: "Morgan JF et al., 1999 - BMJ", validacaoBrasil: "Parcial", scoringCutoff: ">=2 respostas afirmativas = rastreio positivo", licencaUso: "livre", pendente_validacao_clinica: false, appRoute: "/generic-scale/scoff"},
  { id: "who5", name: "WHO-5", fullName: "Índice de Bem-Estar da OMS (WHO-5)", ageMin: 108, ageMax: 216, queixas: ["depressao"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "2 min", description: "Índice de bem-estar psicológico — 5 itens. Escore baixo (<13 de 25) rastreia baixo bem-estar / risco de depressão.", fonte: "WHO Collaborating Centre, 1998", validacaoBrasil: "Sim", scoringCutoff: "<13 (de 25) ou queda de 10% sugere avaliar depressão", licencaUso: "livre", pendente_validacao_clinica: false, appRoute: "/generic-scale/who5"},
  { id: "ita-adultos", name: "ITA-Adultos", fullName: "Inventário de Traços Autísticos — Adultos (inspirado no AQ)", ageMin: 192, ageMax: 1080, queixas: ["tea", "social"], respondente: ["autoaplicavel"], prioridade: "triagem", tempo: "15–20 min", description: "Triagem de traços do espectro autista em adultos — 50 itens em 5 áreas (interação social, comunicação, imaginatividade, atenção a detalhes, flexibilidade). Escore 50–250. Não é diagnóstico.", fonte: "Instrumento inspirado no AQ (Autism Spectrum Quotient)", validacaoBrasil: "Instrumento em português", scoringCutoff: "200–250 alta; 150–199 moderada; 100–149 baixa; 50–99 muito baixa presença de traços", licencaUso: "livre", pendente_validacao_clinica: false, appRoute: "/generic-scale/ita-adultos"},
  { id: "raisd", name: "RAISD", fullName: "Avaliação de Reforçadores (Reinforcement Assessment for Individuals with Severe Disabilities)", ageMin: 24, ageMax: 216, queixas: ["tea", "sensorial"], respondente: ["pais", "clinico"], prioridade: "triagem", tempo: "10–15 min", description: "Entrevista estruturada (10 perguntas abertas) para mapear reforçadores/preferências sensoriais — apoio ao planejamento de intervenção (ex.: ABA). Qualitativa, sem escore.", fonte: "Fisher, Piazza, Bowman & Amari, 1996", validacaoBrasil: "Versão em português", scoringCutoff: "Instrumento qualitativo — sem pontuação; orienta seleção de reforçadores", licencaUso: "livre", pendente_validacao_clinica: false, appRoute: "/generic-scale/raisd"},
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

// ============================================================================
// PROVENIÊNCIA CLÍNICA DO CATÁLOGO LEGADO (Bloco 1 — Consolidação 9.0, 2026)
// ----------------------------------------------------------------------------
// Mapa de proveniência aplicado por `id` aos instrumentos legados de `scales`
// que ainda não traziam o campo `fonte` inline. Estratégia documentada:
//   • `fonte` = autor + ano + instrumento (citação canônica verificável).
//   • `pubmedId` é preenchido APENAS quando o PMID foi fornecido na lista
//     oficial do Dr. Jadson (Bloco 0/1.3). Não fabricamos PMIDs de memória —
//     a citação autor/ano basta como proveniência; o PMID exato pode ser
//     confirmado em revisão clínica.
//   • Instrumentos autorais (baterias NEXUS, PANT, ferramentas de registro) →
//     `licencaUso: "autoral"`, fonte do Dr. Jadson Fraga.
//   • Itens genuinamente sem fonte identificável → "Pendente revisão clínica"
//     + `pendente_validacao_clinica: true` (rastreado, não contabilizado como
//     "com fonte").
// O merge é NÃO destrutivo: valores inline existentes sempre prevalecem
// ({ ...prov, ...s }).
// ============================================================================
const NEXUS = "Dr. Jadson Fraga, NeuroPed — Protocolo Autoral (NEXUS)";
const provenanciaLegado: Record<string, Partial<ScaleEntry>> = {
  // ----- Desenvolvimento / triagem -----
  denver: { fonte: "Frankenburg WK et al., 1992 (Denver II), Pediatrics", validacaoBrasil: "Sim (Denver II adaptado)", scoringCutoff: ">=2 atrasos = suspeito", licencaUso: "comercial" },
  griffiths: { fonte: "Green E, Stroud L et al. / Griffiths R, 2016 (Griffiths III), Hogrefe", validacaoBrasil: "Não", scoringCutoff: "quociente geral <85 abaixo do esperado", licencaUso: "comercial" },
  asq3: { fonte: "Squires J, Bricker D, 2009 (ASQ-3), Brookes", validacaoBrasil: "Sim (Filgueiras et al., 2013)", scoringCutoff: "abaixo do ponto de corte do domínio = monitorar/encaminhar", licencaUso: "comercial" },
  peds: { fonte: "Glascoe FP, 1997 (PEDS)", validacaoBrasil: "Parcial", scoringCutoff: "preocupações preditivas conforme algoritmo", licencaUso: "comercial" },
  catclams: { fonte: "Capute AJ, Accardo PJ, 1996 (CAT/CLAMS)", validacaoBrasil: "Não", scoringCutoff: "quociente de desenvolvimento <70 atraso", licencaUso: "restrita" },
  aims: { fonte: "Piper MC, Darrah J, 1994 (Alberta Infant Motor Scale)", validacaoBrasil: "Sim (Saccani & Valentini, 2012)", scoringCutoff: "<=5º percentil atraso motor", licencaUso: "restrita" },
  ims: { fonte: "Piper MC, Darrah J, 1994 (Alberta Infant Motor Scale); validação BR Saccani & Valentini, 2012", validacaoBrasil: "Sim", scoringCutoff: "<=5º percentil atraso motor", licencaUso: "restrita" },
  timp: { fonte: "Campbell SK et al., 1995 (Test of Infant Motor Performance)", pubmedId: "PMID 7722118", validacaoBrasil: "Parcial", scoringCutoff: "abaixo de -0,5 DP risco motor", licencaUso: "restrita" },
  gars3: { fonte: "Gilliam JE, 2014 (GARS-3), PRO-ED", validacaoBrasil: "Não", scoringCutoff: "Autism Index >=70 muito provável", licencaUso: "comercial" },
  atec: { fonte: "Rimland B, Edelson SM, 1999 (ATEC), Autism Research Institute", validacaoBrasil: "Não", scoringCutoff: "escores menores = menor gravidade (monitorização)", licencaUso: "livre" },
  "tea-checklists": { fonte: "Compilação clínica NeuroPed dos instrumentos ADOS-2, ADI-R, CARS-2, GARS-3 e SRS-2", licencaUso: "autoral" },
  "tea-comportamentos": { fonte: NEXUS, licencaUso: "autoral" },
  vanderbilt: { fonte: "Wolraich ML et al., 2003 (NICHQ Vanderbilt)", pubmedId: "PMID 12777548", validacaoBrasil: "Parcial", scoringCutoff: ">=6 itens 2/3 por domínio + prejuízo", licencaUso: "livre" },
  barkley: { fonte: "Barkley RA, 2012 (Barkley Functional Impairment Scale - Children)", validacaoBrasil: "Não", scoringCutoff: "prejuízo em >=2 domínios", licencaUso: "comercial" },
  "brown-add": { fonte: "Brown TE, 2001 (Brown ADD Scales)", validacaoBrasil: "Não", scoringCutoff: "T-score elevado sugere disfunção executiva", licencaUso: "comercial" },
  abc: { fonte: "Aman MG et al., 1985 (Aberrant Behavior Checklist)", validacaoBrasil: "Parcial", scoringCutoff: "perfil dimensional por subescala", licencaUso: "comercial" },
  ecbi: { fonte: "Eyberg SM, Pincus D, 1999 (ECBI)", validacaoBrasil: "Parcial", scoringCutoff: "Intensity >=131 ou Problem >=15", licencaUso: "comercial" },
  psc17: { fonte: "Jellinek MS et al., 1988 (Pediatric Symptom Checklist); PSC-17 Gardner W et al., 1999", pubmedId: "PMID 3362581", validacaoBrasil: "Parcial", scoringCutoff: ">=15 (PSC-17 total) risco psicossocial", licencaUso: "livre" },
  hsq: { fonte: "Barkley RA, 1987 (Home Situations Questionnaire)", validacaoBrasil: "Não", scoringCutoff: "nº de situações e gravidade média", licencaUso: "livre" },
  // ----- Ansiedade / depressão -----
  rcads: { fonte: "Chorpita BF et al., 2000 (RCADS)", validacaoBrasil: "Parcial", scoringCutoff: "T-score >=65 elevado", licencaUso: "livre" },
  scas: { fonte: "Spence SH, 1998 (Spence Children's Anxiety Scale)", validacaoBrasil: "Parcial", scoringCutoff: "escore total elevado por idade/sexo", licencaUso: "livre" },
  staic: { fonte: "Spielberger CD, 1973 (STAIC)", validacaoBrasil: "Sim (Biaggio, 1980)", scoringCutoff: "percentis estado/traço", licencaUso: "comercial" },
  mfq: { fonte: "Angold A, Costello EJ, 1987 (Mood and Feelings Questionnaire)", validacaoBrasil: "Parcial", scoringCutoff: ">=27 (versão longa) provável depressão", licencaUso: "livre" },
  cdrsr: { fonte: "Poznanski EO, Mokros HB, 1996 (CDRS-R)", validacaoBrasil: "Parcial", scoringCutoff: ">=40 episódio depressivo provável", licencaUso: "comercial" },
  rads2: { fonte: "Reynolds WM, 2002 (RADS-2)", validacaoBrasil: "Não", scoringCutoff: "T-score >=61 clinicamente relevante", licencaUso: "comercial" },
  // ----- Epilepsia -----
  "epilepsia-diario": { fonte: "Ferramenta de registro clínico NeuroPed (diário de crises)", licencaUso: "autoral" },
  qvce50: { fonte: "Maia Filho HS et al., 2007 (QVCE-50), J Pediatr (Rio J)", validacaoBrasil: "Sim (instrumento brasileiro)", scoringCutoff: "escores maiores = melhor qualidade de vida", licencaUso: "livre" },
  hine: { fonte: "Romeo DM et al., 2016 (Hammersmith Infant Neurological Examination)", pubmedId: "PMID 27009691", validacaoBrasil: "Parcial", scoringCutoff: ">=73 ótimo; escores baixos = risco", licencaUso: "restrita" },
  "pedsql-epilepsia": { fonte: "Modi AC et al., 2009 (PedsQL Epilepsy Module); Varni JW (PedsQL)", validacaoBrasil: "Parcial", scoringCutoff: "escores menores = pior QV", licencaUso: "restrita" },
  "qolie-ad": { fonte: "Cramer JA et al., 1999 (QOLIE-AD-48)", validacaoBrasil: "Parcial", scoringCutoff: "escores maiores = melhor QV", licencaUso: "restrita" },
  nddie: { fonte: "Gilliam FG et al., 2006 (NDDI-E)", validacaoBrasil: "Sim (versão brasileira)", scoringCutoff: ">15 sugere depressão", licencaUso: "livre" },
  // ----- Paralisia cerebral / motor -----
  gmfcs: { fonte: "Palisano R et al., 1997 (GMFCS); revisão expandida 2007", validacaoBrasil: "Sim", scoringCutoff: "níveis I–V (maior = maior limitação)", licencaUso: "livre" },
  gmfm: { fonte: "Russell DJ et al., 1989 (GMFM-88); Russell DJ et al., 2000 (GMFM-66)", validacaoBrasil: "Sim", scoringCutoff: "escore percentual de função motora grossa", licencaUso: "restrita" },
  macs: { fonte: "Eliasson AC et al., 2006 (MACS)", validacaoBrasil: "Sim", scoringCutoff: "níveis I–V de habilidade manual", licencaUso: "livre" },
  cfcs: { fonte: "Hidecker MJC et al., 2011 (CFCS)", validacaoBrasil: "Sim", scoringCutoff: "níveis I–V de comunicação", licencaUso: "livre" },
  edacs: { fonte: "Sellers D et al., 2014 (EDACS)", validacaoBrasil: "Parcial", scoringCutoff: "níveis I–V de alimentação", licencaUso: "livre" },
  ashworth: { fonte: "Bohannon RW, Smith MB, 1987 (Modified Ashworth Scale)", validacaoBrasil: "Sim", scoringCutoff: "0–4 (maior = maior espasticidade)", licencaUso: "livre" },
  // ----- Linguagem -----
  "cdi-macarthur": { fonte: "Fenson L et al., 2007 (MacArthur-Bates CDI)", validacaoBrasil: "Parcial (LAVE/adaptações BR)", scoringCutoff: "<=10º percentil de vocabulário = risco", licencaUso: "livre" },
  reel3: { fonte: "Bzoch KR, League R, Brown VL, 2003 (REEL-3), PRO-ED", validacaoBrasil: "Não", scoringCutoff: "quociente de linguagem <85 atraso", licencaUso: "comercial" },
  celf5: { fonte: "Wiig EH, Semel E, Secord WA, 2013 (CELF-5), Pearson", validacaoBrasil: "Não", scoringCutoff: "Core Language Score <85 abaixo do esperado", licencaUso: "comercial" },
  ppvt4: { fonte: "Dunn LM, Dunn DM, 2007 (PPVT-4), Pearson", validacaoBrasil: "Não", scoringCutoff: "standard score <85 abaixo do esperado", licencaUso: "comercial" },
  // ----- Sono -----
  bisq: { fonte: "Sadeh A, 2004 (Brief Infant Sleep Questionnaire)", validacaoBrasil: "Sim (Nunes et al.)", scoringCutoff: ">3 despertares ou >1h acordado à noite = problema", licencaUso: "livre" },
  psq: { fonte: "Chervin RD et al., 2000 (Pediatric Sleep Questionnaire — SRBD)", pubmedId: "PMID 11382441", validacaoBrasil: "Parcial", scoringCutoff: ">=0,33 sugere distúrbio respiratório do sono", licencaUso: "livre" },
  // ----- Alimentação -----
  soma: { fonte: "Reilly S, Skuse D, Wolke D, 1995 (Schedule for Oral Motor Assessment)", validacaoBrasil: "Não", scoringCutoff: "perfil de disfunção motora oral", licencaUso: "restrita" },
  eda: { fonte: "Pendente revisão clínica", pendente_validacao_clinica: true, pendencia: "Sigla EDA ambígua (várias escalas de dificuldade alimentar); fonte canônica a confirmar." },
  // ----- Dor / cefaleia -----
  "cefaleia-calendario": { fonte: "Ferramenta de registro clínico NeuroPed (calendário de cefaleia)", licencaUso: "autoral" },
  wongbaker: { fonte: "Wong DL, Baker CM, 1988 (Wong-Baker FACES Pain Rating Scale)", validacaoBrasil: "Sim", scoringCutoff: "0–10 autorrelato de intensidade", licencaUso: "livre" },
  flacc: { fonte: "Merkel SI et al., 1997 (FLACC)", pubmedId: "PMID 9093498", validacaoBrasil: "Sim", scoringCutoff: "0–10 (>=4 dor moderada)", licencaUso: "livre" },
  pedmidas: { fonte: "Hershey AD et al., 2001 (PedMIDAS)", validacaoBrasil: "Parcial", scoringCutoff: ">30 incapacidade moderada-grave", licencaUso: "livre" },
  // ----- Cognição / neuropsicologia -----
  wppsi: { fonte: "Wechsler D, 2012 (WPPSI-IV), Pearson", validacaoBrasil: "Parcial", scoringCutoff: "QI <70 deficiência intelectual provável", licencaUso: "comercial" },
  leiter3: { fonte: "Roid GH, Miller LJ, Pomplun M, 2013 (Leiter-3)", validacaoBrasil: "Não", scoringCutoff: "QI não-verbal <70 déficit", licencaUso: "comercial" },
  raven: { fonte: "Raven JC, 1947 (Raven Colorido); normas BR Angelini et al., 1999", validacaoBrasil: "Sim", scoringCutoff: "percentis por idade", licencaUso: "comercial" },
  pant: { fonte: NEXUS + " — Protocolo PANT (100 escalas passivas)", licencaUso: "autoral" },
  // ----- Aprendizagem (BR) -----
  tde: { fonte: "Stein LM, 1994 (Teste de Desempenho Escolar — TDE)", validacaoBrasil: "Sim (instrumento brasileiro)", scoringCutoff: "classificação inferior/médio/superior por série", licencaUso: "comercial" },
  prolec: { fonte: "Cuetos F et al. (PROLEC); adaptação BR Capellini SA et al.", validacaoBrasil: "Sim", scoringCutoff: "perfil por processo de leitura", licencaUso: "comercial" },
  confias: { fonte: "Moojen S et al., 2003 (CONFIAS)", validacaoBrasil: "Sim (instrumento brasileiro)", scoringCutoff: "escore por nível (sílaba/fonema)", licencaUso: "comercial" },
  // ----- Funcionalidade / QV -----
  pedsql: { fonte: "Varni JW et al., 2001 (PedsQL 4.0 Generic Core Scales)", pubmedId: "PMID 11695583", validacaoBrasil: "Sim (Klatchoian et al., 2008)", scoringCutoff: "escores menores = pior QV", licencaUso: "restrita" },
  // ----- Neonatal -----
  napi: { fonte: "Korner AF et al., 1987 (Neurobehavioral Assessment of the Preterm Infant)", validacaoBrasil: "Não", scoringCutoff: "perfil neurocomportamental por idade pós-concepcional", licencaUso: "restrita" },
  // ----- Risco de suicídio -----
  cssrs: { fonte: "Posner K et al., 2011 (Columbia Suicide Severity Rating Scale)", validacaoBrasil: "Sim", scoringCutoff: "ideação 1–5 / comportamento presente = risco", licencaUso: "livre" },
  "asq-suicide": { fonte: "Horowitz LM et al., 2012 (Ask Suicide-Screening Questions)", validacaoBrasil: "Parcial", scoringCutoff: "qualquer 'sim' = triagem positiva", licencaUso: "livre" },
  siqjr: { fonte: "Reynolds WM, 1988 (Suicidal Ideation Questionnaire - JR)", validacaoBrasil: "Parcial", scoringCutoff: ">=31 risco elevado", licencaUso: "comercial" },
  "ecar-si": { fonte: NEXUS, licencaUso: "autoral" },
  // ----- Psicose / mania -----
  ymrs: { fonte: "Young RC et al., 1978 (Young Mania Rating Scale)", validacaoBrasil: "Sim (Vilela et al.)", scoringCutoff: ">=20 mania significativa", licencaUso: "livre" },
  bprsc: { fonte: "Overall JE, Pfefferbaum B, 1982 (BPRS for Children)", validacaoBrasil: "Não", scoringCutoff: "escore total dimensional", licencaUso: "livre" },
  "panss-ped": { fonte: "Kay SR, Fiszbein A, Opler LA, 1987 (PANSS)", validacaoBrasil: "Sim", scoringCutoff: "escores positivos/negativos/geral", licencaUso: "comercial" },
  // ----- Tiques -----
  ygtss: { fonte: "Leckman JF et al., 1989 (Yale Global Tic Severity Scale)", validacaoBrasil: "Sim", scoringCutoff: "gravidade 0–50 + prejuízo 0–50", licencaUso: "livre" },
  // ----- Efeitos colaterais -----
  "aims-efeitos": { fonte: "Guy W, 1976 (Abnormal Involuntary Movement Scale — AIMS)", validacaoBrasil: "Sim", scoringCutoff: ">=2 em >=1 item = discinesia provável", licencaUso: "livre" },
  bars: { fonte: "Barnes TRE, 1989 (Barnes Akathisia Rating Scale)", validacaoBrasil: "Parcial", scoringCutoff: "avaliação global >=2 = acatisia", licencaUso: "livre" },
  uku: { fonte: "Lingjaerde O et al., 1987 (UKU Side Effect Rating Scale)", validacaoBrasil: "Parcial", scoringCutoff: "gravidade 0–3 por item", licencaUso: "livre" },
  // ----- Substâncias -----
  crafft: { fonte: "Knight JR et al., 2002 (CRAFFT)", validacaoBrasil: "Sim", scoringCutoff: ">=2 risco de uso problemático", licencaUso: "livre" },
  // ----- Baterias autorais NEXUS -----
  emdi: { fonte: NEXUS, licencaUso: "autoral" },
  eaf: { fonte: NEXUS, licencaUso: "autoral" },
  pdae: { fonte: NEXUS, licencaUso: "autoral" },
  ecsm: { fonte: NEXUS, licencaUso: "autoral" },
  ips: { fonte: NEXUS, licencaUso: "autoral" },
  edi: { fonte: NEXUS, licencaUso: "autoral" },
  eai: { fonte: NEXUS, licencaUso: "autoral" },
  easi: { fonte: NEXUS, licencaUso: "autoral" },
  ems: { fonte: NEXUS, licencaUso: "autoral" },
  etare: { fonte: NEXUS, licencaUso: "autoral" },
  eaah: { fonte: NEXUS, licencaUso: "autoral" },
  // ----- Cognição / neuropsicologia (lote "novas") -----
  "wppsi4-ext": { fonte: "Wechsler D, 2012 (WPPSI-IV), Pearson", validacaoBrasil: "Parcial", scoringCutoff: "QI <70 deficiência intelectual provável", licencaUso: "comercial" },
  "leiter3-ext": { fonte: "Roid GH, Miller LJ, Pomplun M, 2013 (Leiter-3)", validacaoBrasil: "Não", scoringCutoff: "QI não-verbal <70 déficit", licencaUso: "comercial" },
  toni4: { fonte: "Brown L, Sherbenou RJ, Johnsen SK, 2010 (TONI-4)", validacaoBrasil: "Não", scoringCutoff: "QI não-verbal <85 abaixo do esperado", licencaUso: "comercial" },
  cpt3: { fonte: "Conners CK, 2014 (Conners CPT-3)", validacaoBrasil: "Não", scoringCutoff: "T-scores de omissão/comissão/RT elevados", licencaUso: "comercial" },
  sb5: { fonte: "Roid GH, 2003 (Stanford-Binet Intelligence Scales 5)", validacaoBrasil: "Não", scoringCutoff: "QI <70 deficiência intelectual provável", licencaUso: "comercial" },
  "raven-std": { fonte: "Raven J, Court JH, Raven JC, 1998 (Standard Progressive Matrices)", validacaoBrasil: "Sim", scoringCutoff: "percentis por idade", licencaUso: "comercial" },
  kabc2: { fonte: "Kaufman AS, Kaufman NL, 2004 (KABC-II)", validacaoBrasil: "Não", scoringCutoff: "MPI/FCI <70 déficit", licencaUso: "comercial" },
  wcst: { fonte: "Heaton RK et al., 1993 (Wisconsin Card Sorting Test)", validacaoBrasil: "Sim", scoringCutoff: "erros perseverativos elevados = disfunção executiva", licencaUso: "comercial" },
  tmt: { fonte: "Reitan RM, 1958 (Trail Making Test A & B)", validacaoBrasil: "Sim", scoringCutoff: "tempo elevado por idade = lentificação/disfunção", licencaUso: "livre" },
  stroop: { fonte: "Golden CJ, 1978 (Stroop Color and Word Test); Stroop JR, 1935", validacaoBrasil: "Sim", scoringCutoff: "efeito de interferência elevado", licencaUso: "comercial" },
  "rey-figure": { fonte: "Rey A, 1941; Osterrieth PA, 1944 (Rey-Osterrieth Complex Figure)", validacaoBrasil: "Sim", scoringCutoff: "escore de cópia/evocação por norma", licencaUso: "livre" },
  ravlt: { fonte: "Rey A, 1964 (Rey Auditory Verbal Learning Test)", validacaoBrasil: "Sim", scoringCutoff: "curva de aprendizagem/evocação por norma", licencaUso: "livre" },
  "fas-fluencia": { fonte: "Benton AL, Hamsher K, 1976 (Controlled Oral Word Association — FAS)", validacaoBrasil: "Sim", scoringCutoff: "nº de palavras por norma", licencaUso: "livre" },
  "torre-londres": { fonte: "Shallice T, 1982 (Tower of London)", validacaoBrasil: "Parcial", scoringCutoff: "nº de movimentos/acertos por norma", licencaUso: "livre" },
  d2: { fonte: "Brickenkamp R, 1962 (d2 Test of Attention)", validacaoBrasil: "Sim", scoringCutoff: "índice de concentração por norma", licencaUso: "comercial" },
  // ----- Linguagem (lote "novas") -----
  "celf5-new": { fonte: "Wiig EH, Semel E, Secord WA, 2013 (CELF-5), Pearson", validacaoBrasil: "Não", scoringCutoff: "Core Language Score <85", licencaUso: "comercial" },
  pls5: { fonte: "Zimmerman IL, Steiner VG, Pond RE, 2011 (PLS-5), Pearson", validacaoBrasil: "Não", scoringCutoff: "standard score <85 atraso de linguagem", licencaUso: "comercial" },
  "ppvt4-new": { fonte: "Dunn LM, Dunn DM, 2007 (PPVT-4), Pearson", validacaoBrasil: "Não", scoringCutoff: "standard score <85", licencaUso: "comercial" },
  "told-p5": { fonte: "Newcomer PL, Hammill DD, 2008 (TOLD-P:5), PRO-ED", validacaoBrasil: "Não", scoringCutoff: "índices <85 abaixo do esperado", licencaUso: "comercial" },
  ctopp2: { fonte: "Wagner RK, Torgesen JK, Rashotte CA, Pearson NA, 2013 (CTOPP-2), PRO-ED", validacaoBrasil: "Não", scoringCutoff: "composite <85 risco de dislexia", licencaUso: "comercial" },
  "abfw-fono": { fonte: "Andrade CRF, Béfi-Lopes DM, Fernandes FDM, Wertzner HF, 2004 (ABFW)", validacaoBrasil: "Sim (instrumento brasileiro)", scoringCutoff: "perfil fonológico por idade", licencaUso: "comercial" },
  "token-test": { fonte: "De Renzi E, Vignolo LA, 1962 (Token Test)", validacaoBrasil: "Parcial", scoringCutoff: "erros elevados = déficit de compreensão", licencaUso: "livre" },
  eowpvt4: { fonte: "Martin NA, Brownell R, 2011 (EOWPVT-4), Academic Therapy", validacaoBrasil: "Não", scoringCutoff: "standard score <85", licencaUso: "comercial" },
  adl3: { fonte: "Pendente revisão clínica", pendente_validacao_clinica: true, pendencia: "Sigla ADL-3 não corresponde a instrumento padronizado reconhecido; confirmar identidade." },
  "disc-auditiva": { fonte: "Pendente revisão clínica", pendente_validacao_clinica: true, pendencia: "Teste de discriminação auditiva genérico; fonte/versão específica a definir." },
  // ----- Motor / coordenação (lote "novas") -----
  bot2: { fonte: "Bruininks RH, Bruininks BD, 2005 (BOT-2), Pearson", validacaoBrasil: "Parcial", scoringCutoff: "standard score baixo = déficit motor", licencaUso: "comercial" },
  pdms2: { fonte: "Folio MR, Fewell RR, 2000 (PDMS-2), PRO-ED", validacaoBrasil: "Parcial", scoringCutoff: "quociente motor <85 atraso", licencaUso: "comercial" },
  "beery-vmi": { fonte: "Beery KE, Buktenica NA, Beery NA, 2010 (Beery VMI-6), Pearson", validacaoBrasil: "Parcial", scoringCutoff: "standard score <85 déficit visomotor", licencaUso: "comercial" },
  "hammersmith-infant": { fonte: "Romeo DM et al., 2016 (Hammersmith Infant Neurological Examination)", pubmedId: "PMID 27009691", validacaoBrasil: "Parcial", scoringCutoff: ">=73 ótimo; baixo = risco", licencaUso: "restrita" },
  tgmd3: { fonte: "Ulrich DA, 2019 (Test of Gross Motor Development 3)", validacaoBrasil: "Parcial", scoringCutoff: "percentis locomotor/controle de objetos", licencaUso: "comercial" },
  sfa: { fonte: "Coster W et al., 1998 (School Function Assessment), Pearson", validacaoBrasil: "Não", scoringCutoff: "critério de participação/assistência", licencaUso: "comercial" },
  // ----- Epilepsia (lote "novas") -----
  lsss: { fonte: "Baker GA et al., 1991 (Liverpool Seizure Severity Scale)", validacaoBrasil: "Parcial", scoringCutoff: "escores maiores = crises mais graves", licencaUso: "livre" },
  "nddi-e-new": { fonte: "Gilliam FG et al., 2006 (NDDI-E)", validacaoBrasil: "Sim", scoringCutoff: ">15 sugere depressão", licencaUso: "livre" },
  qolie31: { fonte: "Cramer JA et al., 1998 (QOLIE-31)", validacaoBrasil: "Sim (da Silva et al.)", scoringCutoff: "escores maiores = melhor QV", licencaUso: "restrita" },
  "qolie-ad48": { fonte: "Cramer JA et al., 1999 (QOLIE-AD-48)", validacaoBrasil: "Parcial", scoringCutoff: "escores maiores = melhor QV", licencaUso: "restrita" },
  engel: { fonte: "Engel J et al., 1993 (Engel Surgical Outcome Classification)", validacaoBrasil: "Sim", scoringCutoff: "Classe I (livre de crises) a IV (sem melhora)", licencaUso: "livre" },
  "hague-szs": { fonte: "Carpay HA et al., 1997 (Hague Seizure Severity Scale)", validacaoBrasil: "Não", scoringCutoff: "escores maiores = maior gravidade", licencaUso: "livre" },
  chalfont: { fonte: "Duncan JS, Sander JW, 1991 (Chalfont Seizure Severity Scale)", validacaoBrasil: "Não", scoringCutoff: "escore ponderado de gravidade", licencaUso: "livre" },
  ipes: { fonte: "Camfield C et al., 2001 (Impact of Pediatric Epilepsy Scale)", validacaoBrasil: "Parcial", scoringCutoff: "escores maiores = maior impacto", licencaUso: "restrita" },
  // ----- Neonatal (lote "novas") -----
  dubowitz: { fonte: "Dubowitz L, Dubowitz V, Mercuri E, 1999 (Dubowitz Neurological Examination)", validacaoBrasil: "Parcial", scoringCutoff: "perfil neurológico por itens optimais", licencaUso: "restrita" },
  ballard: { fonte: "Ballard JL et al., 1991 (New Ballard Score)", validacaoBrasil: "Sim", scoringCutoff: "escore → idade gestacional estimada", licencaUso: "livre" },
  apgar: { fonte: "Apgar V, 1953 (APGAR Score)", validacaoBrasil: "Sim", scoringCutoff: "<7 no 5º min = depressão neonatal", licencaUso: "livre" },
  snappe2: { fonte: "Richardson DK et al., 2001 (SNAPPE-II)", validacaoBrasil: "Sim", scoringCutoff: "escores maiores = maior risco de mortalidade", licencaUso: "livre" },
  crib2: { fonte: "Parry G, Tucker J, Tarnow-Mordi W, 2003 (CRIB-II)", validacaoBrasil: "Sim", scoringCutoff: "escores maiores = maior risco", licencaUso: "livre" },
  // ----- Dor (lote "novas") -----
  "wong-baker-new": { fonte: "Wong DL, Baker CM, 1988 (Wong-Baker FACES Pain Rating Scale)", validacaoBrasil: "Sim", scoringCutoff: "0–10 autorrelato", licencaUso: "livre" },
  "flacc-new": { fonte: "Merkel SI et al., 1997 (FLACC)", pubmedId: "PMID 9093498", validacaoBrasil: "Sim", scoringCutoff: "0–10 (>=4 dor moderada)", licencaUso: "livre" },
  cries: { fonte: "Krechel SW, Bildner J, 1995 (CRIES)", validacaoBrasil: "Parcial", scoringCutoff: ">=4 dor neonatal significativa", licencaUso: "livre" },
  nips: { fonte: "Lawrence J et al., 1993 (Neonatal Infant Pain Scale)", pubmedId: "PMID 7683847", validacaoBrasil: "Sim", scoringCutoff: ">3 dor presente", licencaUso: "livre" },
  rflacc: { fonte: "Malviya S et al., 2006 (revised FLACC)", validacaoBrasil: "Parcial", scoringCutoff: "0–10 (>=4 dor moderada)", licencaUso: "livre" },
  "eva-ped": { fonte: "Escala Visual Analógica (VAS) — uso pediátrico (a partir de ~7 anos)", validacaoBrasil: "Sim", scoringCutoff: "0–10 cm autorrelato", licencaUso: "livre" },
  ppp: { fonte: "Hunt A et al., 2004 (Paediatric Pain Profile)", validacaoBrasil: "Não", scoringCutoff: "escore por linha de base individual", licencaUso: "livre" },
  "comfort-b": { fonte: "van Dijk M et al., 2005 (COMFORT-Behavioral Scale)", validacaoBrasil: "Sim", scoringCutoff: "6–30 (maior = mais desconforto/dor)", licencaUso: "livre" },
  // ----- Sono adicional -----
  "psq-new": { fonte: "Chervin RD et al., 2000 (Pediatric Sleep Questionnaire — SRBD)", pubmedId: "PMID 11382441", validacaoBrasil: "Parcial", scoringCutoff: ">=0,33 sugere SDB", licencaUso: "livre" },
  "ess-adol": { fonte: "Johns MW, 1991 (Epworth Sleepiness Scale); versão pediátrica Melendres MC et al., 2004 (ESS-DASC)", pubmedId: "PMID 15173547", validacaoBrasil: "Parcial", scoringCutoff: ">10 sonolência diurna excessiva", licencaUso: "livre" },
  "psqi-ped": { fonte: "Buysse DJ et al., 1989 (Pittsburgh Sleep Quality Index)", validacaoBrasil: "Sim", scoringCutoff: ">5 má qualidade de sono", licencaUso: "livre" },
  // ----- TOC -----
  cybocs: { fonte: "Scahill L et al., 1997 (CY-BOCS)", validacaoBrasil: "Sim", scoringCutoff: ">=16 TOC moderado", licencaUso: "livre" },
  "oci-cv": { fonte: "Foa EB et al., 2010 (OCI-CV)", validacaoBrasil: "Parcial", scoringCutoff: ">=11 triagem positiva", licencaUso: "livre" },
  docs: { fonte: "Abramowitz JS et al., 2010 (Dimensional Obsessive-Compulsive Scale)", validacaoBrasil: "Parcial", scoringCutoff: "escores maiores = maior gravidade", licencaUso: "livre" },
  "cybocs-sr": { fonte: "Scahill L et al., 1997 (CY-BOCS) — versão autorrelato", validacaoBrasil: "Parcial", scoringCutoff: ">=16 TOC moderado", licencaUso: "livre" },
  "fas-pr": { fonte: "Calvocoressi L et al., 1999 (Family Accommodation Scale)", validacaoBrasil: "Parcial", scoringCutoff: "escores maiores = maior acomodação", licencaUso: "livre" },
  // ----- Trauma / TEPT -----
  "cpss-v": { fonte: "Foa EB et al., 2018 (CPSS-5)", validacaoBrasil: "Parcial", scoringCutoff: ">=31 TEPT provável", licencaUso: "livre" },
  "ucla-ptsd": { fonte: "Steinberg AM et al., 2013 (UCLA PTSD Reaction Index for DSM-5)", validacaoBrasil: "Parcial", scoringCutoff: ">=35 TEPT provável", licencaUso: "contato_autor" },
  cries13: { fonte: "Perrin S et al., 2005 (Children's Revised Impact of Event Scale 13)", validacaoBrasil: "Parcial", scoringCutoff: ">=30 risco de TEPT", licencaUso: "livre" },
  tscc: { fonte: "Briere J, 1996 (Trauma Symptom Checklist for Children), PAR", validacaoBrasil: "Não", scoringCutoff: "T-score >=65 clínico", licencaUso: "comercial" },
  ace: { fonte: "Felitti VJ et al., 1998 (Adverse Childhood Experiences)", validacaoBrasil: "Parcial", scoringCutoff: ">=4 risco elevado em saúde", licencaUso: "livre" },
  csbi: { fonte: "Friedrich WN et al., 1992 (Child Sexual Behavior Inventory)", validacaoBrasil: "Não", scoringCutoff: "T-score elevado = comportamento atípico", licencaUso: "comercial" },
  "cdi-screen-trauma": { fonte: "Putnam FW, Helmers K, Trickett PK, 1993 (Child Dissociative Checklist)", validacaoBrasil: "Parcial", scoringCutoff: ">=12 sugere dissociação", licencaUso: "livre" },
  cats: { fonte: "Sachser C et al., 2017 (Child and Adolescent Trauma Screen)", validacaoBrasil: "Parcial", scoringCutoff: ">=21 TEPT provável", licencaUso: "livre" },
  // ----- Funcionalidade / adaptação / QV -----
  copm: { fonte: "Law M et al., 1990 (Canadian Occupational Performance Measure)", validacaoBrasil: "Sim", scoringCutoff: "mudança >=2 pontos = clinicamente relevante", licencaUso: "comercial" },
  gas: { fonte: "Kiresuk TJ, Sherman RE, 1968 (Goal Attainment Scaling)", validacaoBrasil: "Sim", scoringCutoff: "T-score 50 = meta atingida", licencaUso: "livre" },
  "life-h": { fonte: "Noreau L et al., 2007 (Assessment of Life Habits for Children — LIFE-H)", validacaoBrasil: "Parcial", scoringCutoff: "escores menores = maior restrição de participação", licencaUso: "restrita" },
  pedi: { fonte: "Haley SM et al., 1992 (Pediatric Evaluation of Disability Inventory)", validacaoBrasil: "Sim (Mancini, 2005)", scoringCutoff: "escore normativo <30 (—1,5 DP) déficit", licencaUso: "comercial" },
  kidscreen52: { fonte: "Ravens-Sieberer U et al., 2005 (KIDSCREEN-52)", validacaoBrasil: "Sim", scoringCutoff: "T-score por dimensão (menor = pior QV)", licencaUso: "livre" },
  auquei: { fonte: "Manificat S, Dazord A, 1997 (AUQUEI)", validacaoBrasil: "Sim (Assumpção et al.)", scoringCutoff: "escore total de QV", licencaUso: "livre" },
  "chq-pf50": { fonte: "Landgraf JM, Abetz L, Ware JE, 1996 (CHQ-PF50)", validacaoBrasil: "Parcial", scoringCutoff: "escores menores = pior QV", licencaUso: "comercial" },
  disabkids: { fonte: "Simeoni MC et al., 2007 (DISABKIDS Chronic Generic Measure)", validacaoBrasil: "Sim", scoringCutoff: "escores menores = pior QV", licencaUso: "restrita" },
  "whoqol-ped": { fonte: "WHOQOL Group, 1998 (WHOQOL-BREF) — adaptação adolescente", validacaoBrasil: "Sim (Fleck et al.)", scoringCutoff: "escores maiores = melhor QV", licencaUso: "livre" },
  // ----- Regulação emocional adicional -----
  ders: { fonte: "Gratz KL, Roemer L, 2004 (Difficulties in Emotion Regulation Scale)", validacaoBrasil: "Sim (Coutinho et al.)", scoringCutoff: "escores maiores = maior desregulação", licencaUso: "livre" },
  erc: { fonte: "Shields A, Cicchetti D, 1997 (Emotion Regulation Checklist)", validacaoBrasil: "Sim (Reis et al.)", scoringCutoff: "subescalas regulação/labilidade", licencaUso: "livre" },
  cems: { fonte: "Zeman J et al., 2001 (Children's Emotion Management Scales)", validacaoBrasil: "Não", scoringCutoff: "subescalas coping/inibição/disregulação", licencaUso: "livre" },
  casi: { fonte: "Silverman WK et al., 1991 (Childhood Anxiety Sensitivity Index)", validacaoBrasil: "Parcial", scoringCutoff: "escores maiores = maior sensibilidade", licencaUso: "livre" },
  "scared-r": { fonte: "Birmaher B et al., 1999 (SCARED — 41 itens)", validacaoBrasil: "Sim", scoringCutoff: ">=25 provável transtorno ansioso", licencaUso: "livre" },
  // ----- Enurese / eliminação -----
  dvss: { fonte: "Farhat W et al., 2000 (Dysfunctional Voiding Symptom Score)", validacaoBrasil: "Parcial", scoringCutoff: ">=6 (meninas) / >=9 (meninos) disfunção", licencaUso: "livre" },
  "bristol-stool": { fonte: "Lewis SJ, Heaton KW, 1997 (Bristol Stool Form Scale)", validacaoBrasil: "Sim", scoringCutoff: "Tipos 1–2 constipação; 6–7 diarreia", licencaUso: "livre" },
  "bladder-diary": { fonte: "International Children's Continence Society (ICCS) — diário miccional padronizado", validacaoBrasil: "Sim", scoringCutoff: "padrões de frequência/volume/escape", licencaUso: "livre" },
  // ----- Psicose adicional -----
  sips: { fonte: "Miller TJ et al., 2003 (SIPS/SOPS)", validacaoBrasil: "Parcial", scoringCutoff: "critérios de síndromes prodrômicas (UHR)", licencaUso: "restrita" },
  "prime-screen": { fonte: "Miller TJ et al., 2004 (PRIME Screen for Psychosis Risk)", validacaoBrasil: "Parcial", scoringCutoff: "escores elevados = risco de psicose", licencaUso: "livre" },
};

// Aplica proveniência (não destrutivo) aos instrumentos legados.
const scalesComProveniencia: ScaleEntry[] = scales.map((s) =>
  provenanciaLegado[s.id] ? { ...provenanciaLegado[s.id], ...s } : s
);

// Merge: legado (com proveniência) + autorais NEXUS + escalas importadas (Ebook PANT v7 / SuperNeuroKids v25) + open-access mundiais + 230 complementares
const allScalesBase: ScaleEntry[] = [
  ...scalesComProveniencia,
  // Curadoria clínica: das 257 autorais NEXUS, só as aprovadas (marcos do
  // neurodesenvolvimento, baixo/médio risco) entram no filtro. Ver
  // escalasAutoraisCuradoria.ts para o critério e a lista.
  ...escalasAutoraisDrJadson.filter((s) => escalasAutoraisAprovadas.has(s.id)),
  ...escalasImportadasV25Ebook,
  ...scalasOpenAccessMundiais,
  ...todasAsEscalasComplementares,
  ...escalasPsiquiatricasImportadas2026,
];

// Aplicar descrições melhoradas (com exemplos de perguntas para pais/professores)
const allScalesComDescricoes: ScaleEntry[] = allScalesBase.map(escala => {
  const appRoute = escala.appRoute ?? `/generic-scale/${escala.id}`;
  if (descricoesMelhoradas[escala.id]) {
    return {
      ...escala,
      appRoute,
      description: descricoesMelhoradas[escala.id],
    };
  }
  return { ...escala, appRoute };
});

// Deduplicação por id E por nome. O merge de lotes de importação (legado + v25 +
// open-access + 230 complementares) reintroduzia o MESMO instrumento com ids ou
// nomes repetidos — gerando ids duplicados (erro estrutural) e cards repetidos no
// filtro. Aqui consolidamos: mantém a primeira ocorrência e preenche campos
// ausentes a partir das duplicatas (preferindo rota dedicada sobre /generic-scale).
function mergeDuplicateScale(keep: ScaleEntry, dup: ScaleEntry): ScaleEntry {
  const out: ScaleEntry = { ...keep };
  for (const key of Object.keys(dup) as (keyof ScaleEntry)[]) {
    const cur = out[key];
    const isEmpty =
      cur === undefined ||
      cur === null ||
      (typeof cur === "string" && cur.trim() === "") ||
      (Array.isArray(cur) && cur.length === 0);
    if (isEmpty) (out as unknown as Record<string, unknown>)[key] = dup[key];
  }
  // Preferir uma rota dedicada (aplicação real) sobre uma ficha /generic-scale.
  if (
    dup.appRoute &&
    (!keep.appRoute || (keep.appRoute.startsWith("/generic-scale/") && !dup.appRoute.startsWith("/generic-scale/")))
  ) {
    out.appRoute = dup.appRoute;
  }
  return out;
}

function dedupeCatalog(items: ScaleEntry[]): ScaleEntry[] {
  const result: ScaleEntry[] = [];
  const idIndex = new Map<string, number>();
  const nameIndex = new Map<string, number>();
  for (const s of items) {
    const nameKey = s.name.trim().toLowerCase();
    const existing = idIndex.has(s.id) ? idIndex.get(s.id)! : nameIndex.get(nameKey);
    if (existing !== undefined) {
      result[existing] = mergeDuplicateScale(result[existing], s);
      idIndex.set(result[existing].id, existing);
      nameIndex.set(result[existing].name.trim().toLowerCase(), existing);
      idIndex.set(s.id, existing);
      nameIndex.set(nameKey, existing);
    } else {
      const idx = result.length;
      result.push(s);
      idIndex.set(s.id, idx);
      nameIndex.set(nameKey, idx);
    }
  }
  return result;
}

export const allScales: ScaleEntry[] = dedupeCatalog(allScalesComDescricoes);

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

// Validation: detect duplicate scale IDs in catalog
function validateNoDuplicateIds(catalog: ScaleEntry[]): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const scale of catalog) {
    if (seen.has(scale.id)) {
      duplicates.push(scale.id);
    }
    seen.add(scale.id);
  }
  return duplicates;
}

// Validation: detect invalid age ranges (ageMin > ageMax)
function validateAgeRanges(catalog: ScaleEntry[]): Array<{ id: string; ageMin: number; ageMax: number }> {
  return catalog.filter(s => s.ageMin > s.ageMax);
}

const duplicateIds = validateNoDuplicateIds(allScales);
if (duplicateIds.length > 0) {
  console.warn(`[scaleFilter] Duplicate scale IDs detected: ${duplicateIds.join(", ")}`);
}

const invalidRanges = validateAgeRanges(allScales);
if (invalidRanges.length > 0) {
  console.warn(`[scaleFilter] Invalid age ranges (ageMin > ageMax): ${invalidRanges.map(s => `${s.id} (${s.ageMin}-${s.ageMax})`).join(", ")}`);
}
