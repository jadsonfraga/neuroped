import { Link } from "wouter";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Baby, ClipboardCheck, Activity, BookOpen, ArrowRight, Brain, Stethoscope,
  BarChart3, ShieldAlert, ClipboardList, Users, FileText, CloudRain, HeartPulse,
  Wine, ListChecks, Zap, BrainCircuit, Gauge, Heart, Accessibility, Sparkles,
  Puzzle, Calendar, Moon, Eye, Search, X, GraduationCap, Waves,
  AlertTriangle, Flame, VolumeX, UtensilsCrossed, Pill, Filter,
  BrainCog, Ear, School, ChevronDown, ChevronUp, Target, Lightbulb,
  GitBranch, Ruler, Thermometer, Calculator, LineChart, MessageCircle,
  Scale, Milestone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import drJadsonLogo from "@assets/dr-jadson-logo.jpeg";
import neuralAbstractImg from "@assets/images/neural-abstract.png";
import { softHover, softTap } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import { easing, duration } from "@/lib/motion";
import { FavoritesRecents } from "@/components/FavoritesRecents";

interface ScaleCard {
  href: string;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  ageRange: string;
  gradient: string;
  bgLight: string;
  iconColor: string;
}

/* ─── DATA ARRAYS ─────────────────────────────────────────────── */

const neurodevScales: ScaleCard[] = [
  {
    href: "/mchat", title: "M-CHAT-R/F", subtitle: "Autismo — Triagem Precoce",
    description: "Rastreio de risco para TEA entre 16 e 30 meses.",
    icon: Baby, ageRange: "16-30 meses", gradient: "from-pink-500 to-rose-500",
    bgLight: "bg-pink-50 dark:bg-pink-950/30", iconColor: "text-pink-600 dark:text-pink-400",
  },
  {
    href: "/cars", title: "CARS-2", subtitle: "Autismo — Gravidade",
    description: "Classifica a gravidade dos sintomas do espectro autista.",
    icon: ClipboardCheck, ageRange: "≥ 2 anos", gradient: "from-violet-500 to-purple-500",
    bgLight: "bg-violet-50 dark:bg-violet-950/30", iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    href: "/denver", title: "Denver II", subtitle: "Marcos do Neurodesenvolvimento",
    description: "Avalia marcos motores, linguagem e pessoal-social de 0 a 6 anos.",
    icon: BookOpen, ageRange: "0-6 anos", gradient: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    href: "/asq3", title: "ASQ-3", subtitle: "Ages & Stages",
    description: "Triagem do desenvolvimento em 5 domínios com questionário para pais.",
    icon: Baby, ageRange: "1-60 meses", gradient: "from-emerald-500 to-green-500",
    bgLight: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    href: "/gmfcs", title: "GMFCS", subtitle: "Função Motora Grossa",
    description: "Classificação da função motora em paralisia cerebral (5 níveis).",
    icon: Accessibility, ageRange: "0-18 anos", gradient: "from-teal-500 to-cyan-500",
    bgLight: "bg-teal-50 dark:bg-teal-950/30", iconColor: "text-teal-600 dark:text-teal-400",
  },
  {
    href: "/tea", title: "Checklists TEA", subtitle: "5 Instrumentos de Autismo",
    description: "ADOS-2, ADI-R, CARS-2, GARS-3 e SRS-2 — checklists clínicos adaptados.",
    icon: Puzzle, ageRange: "Variável", gradient: "from-blue-500 to-purple-600",
    bgLight: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    href: "/tea-comportamentos", title: "Comport. Atípicos TEA", subtitle: "100 Itens — 6 Faixas Etárias",
    description: "Escala de Comportamentos Atípicos em TEA: observação por faixa etária (0-18 anos), 6 domínios clínicos.",
    icon: Eye, ageRange: "0-18 anos", gradient: "from-fuchsia-500 to-purple-600",
    bgLight: "bg-fuchsia-50 dark:bg-fuchsia-950/30", iconColor: "text-fuchsia-600 dark:text-fuchsia-400",
  },
];

const behaviorScales: ScaleCard[] = [
  {
    href: "/snap", title: "SNAP-IV", subtitle: "TDAH — Rastreio",
    description: "Avalia desatenção e hiperatividade/impulsividade.",
    icon: Activity, ageRange: "6-18 anos", gradient: "from-teal-500 to-cyan-500",
    bgLight: "bg-teal-50 dark:bg-teal-950/30", iconColor: "text-teal-600 dark:text-teal-400",
  },
  {
    href: "/sdq", title: "SDQ", subtitle: "Capacidades e Dificuldades",
    description: "Avalia comportamento pró-social, hiperatividade, emoções, conduta.",
    icon: BarChart3, ageRange: "4-17 anos", gradient: "from-green-500 to-emerald-500",
    bgLight: "bg-green-50 dark:bg-green-950/30", iconColor: "text-green-600 dark:text-green-400",
  },
  {
    href: "/conners", title: "Conners", subtitle: "Comportamento e TDAH",
    description: "Problemas de conduta, aprendizagem, queixas somáticas e impulsividade.",
    icon: ClipboardList, ageRange: "6-18 anos", gradient: "from-rose-500 to-red-500",
    bgLight: "bg-rose-50 dark:bg-rose-950/30", iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    href: "/cbcl", title: "CBCL", subtitle: "Problemas Comportamentais",
    description: "Triagem de problemas internalizantes, externalizantes e sociais.",
    icon: ListChecks, ageRange: "4-18 anos", gradient: "from-blue-500 to-indigo-600",
    bgLight: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    href: "/vanderbilt", title: "Vanderbilt", subtitle: "TDAH — NICHQ",
    description: "Escala para pais com domínios de desatenção, hiperatividade e conduta.",
    icon: Zap, ageRange: "6-12 anos", gradient: "from-orange-500 to-red-500",
    bgLight: "bg-orange-50 dark:bg-orange-950/30", iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    href: "/brief2", title: "BRIEF-2", subtitle: "Funções Executivas",
    description: "Inibição, flexibilidade, controle emocional, memória de trabalho e planejamento.",
    icon: BrainCircuit, ageRange: "5-18 anos", gradient: "from-purple-500 to-violet-600",
    bgLight: "bg-purple-50 dark:bg-purple-950/30", iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    href: "/abc", title: "ABC", subtitle: "Comportamento Aberrante",
    description: "Irritabilidade, letargia, estereotipia, hiperatividade e fala inadequada.",
    icon: Gauge, ageRange: "DI / TEA", gradient: "from-red-500 to-orange-500",
    bgLight: "bg-red-50 dark:bg-red-950/30", iconColor: "text-red-600 dark:text-red-400",
  },
  {
    href: "/vineland", title: "Vineland-3", subtitle: "Comportamento Adaptativo",
    description: "Comunicação, vida diária, socialização e motricidade.",
    icon: Users, ageRange: "0-18 anos", gradient: "from-cyan-500 to-sky-500",
    bgLight: "bg-cyan-50 dark:bg-cyan-950/30", iconColor: "text-cyan-600 dark:text-cyan-400",
  },
];

const mentalHealthScales: ScaleCard[] = [
  {
    href: "/scared", title: "SCARED", subtitle: "Triagem de Ansiedade",
    description: "Pânico, ansiedade generalizada, separação, fobia social e evitação escolar.",
    icon: ShieldAlert, ageRange: "8-18 anos", gradient: "from-indigo-500 to-blue-500",
    bgLight: "bg-indigo-50 dark:bg-indigo-950/30", iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    href: "/cdi2", title: "CDI-2", subtitle: "Depressão Infantil",
    description: "Inventário de Depressão Infantil — sintomas depressivos em 28 itens.",
    icon: CloudRain, ageRange: "7-17 anos", gradient: "from-sky-500 to-blue-600",
    bgLight: "bg-sky-50 dark:bg-sky-950/30", iconColor: "text-sky-600 dark:text-sky-400",
  },
  {
    href: "/phqa", title: "PHQ-A", subtitle: "Depressão — Adolescentes",
    description: "Patient Health Questionnaire adaptado para adolescentes (9 itens).",
    icon: HeartPulse, ageRange: "11-17 anos", gradient: "from-fuchsia-500 to-pink-600",
    bgLight: "bg-fuchsia-50 dark:bg-fuchsia-950/30", iconColor: "text-fuchsia-600 dark:text-fuchsia-400",
  },
  {
    href: "/cssrs", title: "C-SSRS", subtitle: "Risco Suicida",
    description: "Escala Columbia de Gravidade de Ideação Suicida — 6 níveis de risco.",
    icon: ShieldAlert, ageRange: "≥ 6 anos", gradient: "from-red-500 to-rose-600",
    bgLight: "bg-red-50 dark:bg-red-950/30", iconColor: "text-red-600 dark:text-red-400",
  },
  {
    href: "/crafft", title: "CRAFFT", subtitle: "Uso de Substâncias",
    description: "Screening de uso de álcool e drogas para adolescentes.",
    icon: Wine, ageRange: "12-21 anos", gradient: "from-amber-500 to-yellow-600",
    bgLight: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600 dark:text-amber-400",
  },
];

const otherScales: ScaleCard[] = [
  {
    href: "/cshq", title: "CSHQ", subtitle: "Hábitos de Sono",
    description: "Questionário de Hábitos de Sono Infantil — 7 domínios de distúrbio.",
    icon: Moon, ageRange: "4-10 anos", gradient: "from-indigo-500 to-purple-600",
    bgLight: "bg-indigo-50 dark:bg-indigo-950/30", iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    href: "/ygtss", title: "YGTSS", subtitle: "Gravidade de Tiques",
    description: "Yale Global Tic Severity Scale — avaliação de tiques motores e vocais.",
    icon: Sparkles, ageRange: "Variável", gradient: "from-yellow-500 to-orange-500",
    bgLight: "bg-yellow-50 dark:bg-yellow-950/30", iconColor: "text-yellow-600 dark:text-yellow-400",
  },
  {
    href: "/pedsql", title: "PedsQL", subtitle: "Qualidade de Vida",
    description: "Funcionamento físico, emocional, social e escolar.",
    icon: Heart, ageRange: "2-18 anos", gradient: "from-pink-500 to-rose-500",
    bgLight: "bg-pink-50 dark:bg-pink-950/30", iconColor: "text-pink-600 dark:text-pink-400",
  },
];

const diaries = [
  {
    href: "/epilepsia", title: "Diário de Crises Epilépticas", subtitle: "Registro e acompanhamento",
    description: "Registre tipo, duração, consciência, triggers, pós-ictal e medicação de cada crise. Exporta CSV.",
    icon: Zap, gradient: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-50 dark:bg-violet-950/30", iconColor: "text-violet-600 dark:text-violet-400",
    ageRange: "Clínico",
  },
  {
    href: "/cefaleia", title: "Calendário de Cefaleia", subtitle: "Registro diário de episódios",
    description: "Intensidade (EVA), tipo, localização, aura, triggers, sintomas e resposta medicamentosa. Exporta CSV.",
    icon: Calendar, gradient: "from-rose-500 to-red-600",
    bgLight: "bg-rose-50 dark:bg-rose-950/30", iconColor: "text-rose-600 dark:text-rose-400",
    ageRange: "Clínico",
  },
];

const regulacaoEmocionalScales: ScaleCard[] = [
  {
    href: "/ecar-si", title: "ECAR-SI J26", subtitle: "Risco de Autoagressão e Suicidalidade",
    description: "Escala clínica de risco: 36 itens, 9 blocos (8 risco + 1 proteção), alarmes clínicos e conduta vinculada.",
    icon: ShieldAlert, ageRange: "Pediatria", gradient: "from-red-600 to-rose-700",
    bgLight: "bg-red-50 dark:bg-red-950/30", iconColor: "text-red-600 dark:text-red-400",
  },
  {
    href: "/edi", title: "EDI-J26", subtitle: "Depressão Infantil",
    description: "Escala de Depressão Infantil: 24 itens, máximo 72 pontos, domínio único.",
    icon: CloudRain, ageRange: "Pediatria", gradient: "from-sky-500 to-blue-600",
    bgLight: "bg-sky-50 dark:bg-sky-950/30", iconColor: "text-sky-600 dark:text-sky-400",
  },
  {
    href: "/eai", title: "EAI-J26", subtitle: "Ansiedade Infantil",
    description: "Escala de Ansiedade Infantil: 20 itens, máximo 60 pontos, domínio único.",
    icon: AlertTriangle, ageRange: "Pediatria", gradient: "from-amber-500 to-yellow-600",
    bgLight: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    href: "/easi", title: "EASI-J26", subtitle: "Ansiedade Social Infantil",
    description: "Escala de Ansiedade Social Infantil: 15 itens, máximo 45 pontos, domínio único.",
    icon: Users, ageRange: "Pediatria", gradient: "from-orange-500 to-red-500",
    bgLight: "bg-orange-50 dark:bg-orange-950/30", iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    href: "/ems", title: "EMS-J26", subtitle: "Mutismo Seletivo",
    description: "Escala de Mutismo Seletivo: 15 itens, máximo 45 pontos, domínio único.",
    icon: VolumeX, ageRange: "Pediatria", gradient: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-50 dark:bg-violet-950/30", iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    href: "/etare", title: "ETARE-J26", subtitle: "Transtorno Alimentar Restritivo Evitativo",
    description: "Escala TARE: 18 itens, máximo 54 pontos, domínio único. Distingue TARE de anorexia nervosa.",
    icon: UtensilsCrossed, ageRange: "Pediatria", gradient: "from-lime-500 to-green-600",
    bgLight: "bg-lime-50 dark:bg-lime-950/30", iconColor: "text-lime-600 dark:text-lime-400",
  },
  {
    href: "/eaah", title: "EAAH-J26", subtitle: "Autoagressividade e Heteroagressividade",
    description: "Escala de agressividade: 20 itens, 3 domínios (auto, hetero e fatores protetores invertido).",
    icon: Flame, ageRange: "Pediatria", gradient: "from-red-500 to-orange-600",
    bgLight: "bg-red-50 dark:bg-red-950/30", iconColor: "text-red-600 dark:text-red-400",
  },
];

const bateriaJadsonCard: ScaleCard = {
  href: "/bateria-jadson",
  title: "Bateria Autoral Dr. Jadson — 2026",
  subtitle: "5 Protocolos — Triagem e Acompanhamento",
  description: "Protocolos estruturados de triagem e acompanhamento do neurodesenvolvimento: EMDI (desenvolvimento infantil), EAF (adaptação funcional), PDAE (desempenho acadêmico), ECSM (cognição social), IPS (processamento sensorial).",
  icon: Stethoscope,
  ageRange: "12m–18 anos",
  gradient: "from-emerald-500 to-teal-600",
  bgLight: "bg-emerald-50 dark:bg-emerald-950/30",
  iconColor: "text-emerald-600 dark:text-emerald-400",
};

const pacientesCard: ScaleCard = {
  href: "/pacientes",
  title: "Meus Pacientes",
  subtitle: "Cadastre, acompanhe e gere relatórios",
  description: "Registre seus pacientes, salve resultados das escalas, acompanhe a evolução longitudinal e exporte relatórios profissionais.",
  icon: Users,
  ageRange: "Gestão",
  gradient: "from-primary to-chart-2",
  bgLight: "bg-primary/5 dark:bg-primary/10",
  iconColor: "text-primary",
};

const farmacologiaCard: ScaleCard = {
  href: "/farmacologia",
  title: "Farmacologia em Neuropediatria",
  subtitle: "Doses Práticas por Indicação Clínica",
  description: "Resumo prático dos principais psicofármacos e antiepilépticos usados em neuropediatria e psiquiatria infantil, organizados por indicação clínica, com doses, comentários e alertas de monitorização.",
  icon: Pill,
  ageRange: "Pediatria",
  gradient: "from-emerald-600 to-cyan-600",
  bgLight: "bg-emerald-50 dark:bg-emerald-950/30",
  iconColor: "text-emerald-600 dark:text-emerald-400",
};

/* Bateria Dr. Jadson scales */
const bateriaScales: ScaleCard[] = [
  bateriaJadsonCard,
  { href: "/emdi", title: "EMDI", subtitle: "Desenvolvimento Infantil", description: "Escala de Marcos do Desenvolvimento Infantil — triagem por faixa etária.", icon: Baby, ageRange: "12m–6a", gradient: "from-emerald-500 to-teal-600", bgLight: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
  { href: "/eaf", title: "EAF", subtitle: "Adaptação Funcional", description: "Escala de Adaptação Funcional — autonomia e atividades de vida diária.", icon: Accessibility, ageRange: "2-18 anos", gradient: "from-teal-500 to-cyan-500", bgLight: "bg-teal-50 dark:bg-teal-950/30", iconColor: "text-teal-600 dark:text-teal-400" },
  { href: "/pdae", title: "PDAE", subtitle: "Desempenho Acadêmico", description: "Protocolo de Desempenho Acadêmico e Escolar — leitura, escrita, cálculo.", icon: GraduationCap, ageRange: "6-18 anos", gradient: "from-amber-500 to-orange-500", bgLight: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600 dark:text-amber-400" },
  { href: "/ecsm", title: "ECSM", subtitle: "Cognição Social", description: "Escala de Cognição Social e Mentalização — empatia, teoria da mente.", icon: Users, ageRange: "4-14 anos", gradient: "from-violet-500 to-purple-600", bgLight: "bg-violet-50 dark:bg-violet-950/30", iconColor: "text-violet-600 dark:text-violet-400" },
  { href: "/ips", title: "IPS", subtitle: "Processamento Sensorial", description: "Inventário de Processamento Sensorial — hipo e hipersensibilidade por domínio.", icon: Waves, ageRange: "18m-14 anos", gradient: "from-fuchsia-500 to-pink-600", bgLight: "bg-fuchsia-50 dark:bg-fuchsia-950/30", iconColor: "text-fuchsia-600 dark:text-fuchsia-400" },
];

/* Searchable index */
const allSearchableCards = [
  { ...pacientesCard, section: "Gestão" },
  ...neurodevScales.map(s => ({ ...s, section: "Neurodesenvolvimento e TEA" })),
  ...behaviorScales.map(s => ({ ...s, section: "Comportamento e TDAH" })),
  ...mentalHealthScales.map(s => ({ ...s, section: "Saúde Mental" })),
  { ...farmacologiaCard, section: "Farmacologia em Neuropediatria" },
  { ...bateriaJadsonCard, section: "Bateria Autoral Dr. Jadson" },
  ...regulacaoEmocionalScales.map(s => ({ ...s, section: "Regulação Emocional e Psiquiatria" })),
  ...otherScales.map(s => ({ ...s, section: "Sono, Tiques e Qualidade de Vida" })),
  ...diaries.map(d => ({ ...d, section: "Diários Clínicos" })),
  ...bateriaScales.slice(1).map(s => ({ ...s, section: "Bateria Dr. Jadson" })),
  { href: "/avaliacao-multiprofissional", title: "Avaliação Multiprofissional", subtitle: "Instrumentos por faixa etária e área", description: "Guia completo: quem avalia, o que usar, quando solicitar. Mapa de instrumentos de 18 meses a adultos.", icon: ClipboardCheck, ageRange: "Guia", gradient: "from-emerald-500 to-teal-600", bgLight: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400", section: "Guias e Referências" },
  { href: "/plano-terapeutico", title: "Plano Terapêutico (PTI)", subtitle: "Gerador interativo de plano individualizado", description: "Monte o plano terapêutico multiprofissional: objetivos, estratégias, frequência — gera PDF e envia por email.", icon: Target, ageRange: "Ferramenta", gradient: "from-rose-500 to-pink-600", bgLight: "bg-rose-50 dark:bg-rose-950/30", iconColor: "text-rose-600 dark:text-rose-400", section: "Guias e Referências" },
  { href: "/plano-intervencao", title: "Intervenção por Habilidades", subtitle: "7 áreas com estratégias práticas", description: "Como intervir em cada domínio: social, cognitivo, linguagem, motor, sensorial — com atividades recomendadas.", icon: Lightbulb, ageRange: "Guia", gradient: "from-amber-500 to-orange-500", bgLight: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600 dark:text-amber-400", section: "Guias e Referências" },
  { href: "/fluxogramas", title: "Fluxogramas de Decisão", subtitle: "Algoritmos clínicos interativos", description: "Fluxogramas de decisão clínica para TDAH, Epilepsia e Atraso de Linguagem.", icon: GitBranch, ageRange: "Clínico", gradient: "from-cyan-500 to-blue-600", bgLight: "bg-cyan-50 dark:bg-cyan-950/30", iconColor: "text-cyan-600 dark:text-cyan-400", section: "Ferramentas Clínicas" },
  { href: "/marcos-desenvolvimento", title: "Marcos do Desenvolvimento", subtitle: "0-60 meses — visual e interativo", description: "Marcos do desenvolvimento infantil por idade.", icon: Milestone, ageRange: "0-60m", gradient: "from-emerald-500 to-green-600", bgLight: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400", section: "Ferramentas Clínicas" },
  { href: "/valores-referencia", title: "Valores de Referência", subtitle: "Sinais vitais + Labs por idade", description: "Tabelas de sinais vitais e laboratório por faixa etária.", icon: Thermometer, ageRange: "Pediatria", gradient: "from-red-500 to-orange-600", bgLight: "bg-red-50 dark:bg-red-950/30", iconColor: "text-red-600 dark:text-red-400", section: "Ferramentas Clínicas" },
  { href: "/calculadora-dose", title: "Calculadora de Dose", subtitle: "Cálculo por peso/idade", description: "Calcule doses de medicamentos pediátricos por peso e idade.", icon: Calculator, ageRange: "Ferramenta", gradient: "from-amber-500 to-yellow-600", bgLight: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600 dark:text-amber-400", section: "Ferramentas Clínicas" },
  { href: "/curvas-crescimento", title: "Curvas de Crescimento", subtitle: "OMS — peso, altura, IMC, PC", description: "Curvas de crescimento da OMS por idade e sexo.", icon: LineChart, ageRange: "0-19a", gradient: "from-blue-500 to-cyan-600", bgLight: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-600 dark:text-blue-400", section: "Ferramentas Clínicas" },
  { href: "/orientacao-parental", title: "Orientação Parental", subtitle: "Guias para famílias", description: "Orientações práticas para pais por diagnóstico.", icon: MessageCircle, ageRange: "Família", gradient: "from-pink-500 to-rose-500", bgLight: "bg-pink-50 dark:bg-pink-950/30", iconColor: "text-pink-600 dark:text-pink-400", section: "Ferramentas Clínicas" },
  { href: "/espasticidade", title: "Espasticidade", subtitle: "Ashworth e Tardieu", description: "Escalas de espasticidade com interpretação.", icon: Ruler, ageRange: "Clínico", gradient: "from-violet-500 to-purple-600", bgLight: "bg-violet-50 dark:bg-violet-950/30", iconColor: "text-violet-600 dark:text-violet-400", section: "Ferramentas Clínicas" },
  { href: "/classificacoes", title: "Classificações Clínicas", subtitle: "ILAE, FMS, CIF, GMFCS", description: "Classificações internacionais.", icon: Scale, ageRange: "Referência", gradient: "from-slate-500 to-gray-600", bgLight: "bg-slate-50 dark:bg-slate-950/30", iconColor: "text-slate-600 dark:text-slate-400", section: "Ferramentas Clínicas" },
  { href: "/psc17", title: "PSC-17", subtitle: "Triagem Psicossocial", description: "17 itens para rastreio de problemas psicossociais.", icon: HeartPulse, ageRange: "4-16 anos", gradient: "from-indigo-500 to-blue-500", bgLight: "bg-indigo-50 dark:bg-indigo-950/30", iconColor: "text-indigo-600 dark:text-indigo-400", section: "Saúde Mental" },
  { href: "/gad7", title: "GAD-7", subtitle: "Ansiedade Generalizada", description: "Escala de ansiedade — 7 itens.", icon: AlertTriangle, ageRange: "12+ anos", gradient: "from-yellow-500 to-amber-600", bgLight: "bg-yellow-50 dark:bg-yellow-950/30", iconColor: "text-yellow-600 dark:text-yellow-400", section: "Saúde Mental" },
  { href: "/aq10", title: "AQ-10", subtitle: "Rastreio de TEA", description: "10 itens para rastreio rápido de TEA.", icon: Puzzle, ageRange: "Adolescente+", gradient: "from-purple-500 to-violet-600", bgLight: "bg-purple-50 dark:bg-purple-950/30", iconColor: "text-purple-600 dark:text-purple-400", section: "Neurodesenvolvimento e TEA" },
  { href: "/fichas-registro", title: "Fichas de Registro", subtitle: "Bayley, WISC, HINE, GMFM, ADOS-2", description: "Fichas comerciais para registro de resultados.", icon: FileText, ageRange: "Clínico", gradient: "from-teal-500 to-emerald-600", bgLight: "bg-teal-50 dark:bg-teal-950/30", iconColor: "text-teal-600 dark:text-teal-400", section: "Ferramentas Clínicas" },
];

/* ─── COMPACT SCALE CARD ─────────────────────────────────────── */

function ScaleCardItem({ scale }: { scale: ScaleCard }) {
  const Icon = scale.icon;
  return (
    <Link href={scale.href}>
      <div
        onMouseEnter={() => softHover()}
        onClick={() => { softTap(); haptic.select(); }}
        className="card-premium group cursor-pointer flex items-start gap-3 p-4 min-h-[118px]"
      >
        <div className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${scale.gradient} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
          <Icon className="w-4 h-4 text-white" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[15px] font-semibold text-foreground leading-snug tracking-[-0.01em]">{scale.title}</span>
            <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 shrink-0 bg-background/70">{scale.ageRange}</Badge>
          </div>
          <p className={`text-xs font-medium mt-1 ${scale.iconColor} leading-tight`}>{scale.subtitle}</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-2 line-clamp-2">{scale.description}</p>
        </div>
        <ArrowRight className="shrink-0 w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all mt-0.5" />
      </div>
    </Link>
  );
}

/* ─── COLLAPSIBLE SECTION ─────────────────────────────────────── */

interface SectionProps {
  title: string;
  icon: any;
  accentColor: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, icon: Icon, accentColor, count, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-card/55 p-3 shadow-sm">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 group rounded-xl px-1 py-1"
        aria-expanded={open}
      >
        <div className={`w-1 h-6 rounded-full ${accentColor} shrink-0`} />
        <div className={`w-7 h-7 rounded-lg ${accentColor.replace("bg-", "bg-").replace("bg-", "")} flex items-center justify-center`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-foreground flex-1 text-left group-hover:text-primary transition-colors">{title}</h2>
        <Badge variant="secondary" className="text-xs font-medium">{count}</Badge>
        {open
          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="stagger-in grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── COLLAPSIBLE SECTION WITH EXPAND ────────────────────────── */

interface ExpandableSectionProps {
  title: string;
  icon: any;
  accentColor: string;
  items: ScaleCard[];
  previewCount?: number;
  defaultOpen?: boolean;
}

function ExpandableSection({ title, icon, accentColor, items, previewCount = 4, defaultOpen = false }: ExpandableSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? items : items.slice(0, previewCount);
  const hasMore = items.length > previewCount;

  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-card/55 p-3 shadow-sm">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 group rounded-xl px-1 py-1"
        aria-expanded={open}
      >
        <SectionAccent color={accentColor} Icon={icon} title={title} count={items.length} open={open} />
      </button>
      {open && (
        <>
          <div className="stagger-in grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {visibleItems.map(s => <ScaleCardItem key={s.href} scale={s} />)}
          </div>
          {hasMore && (
            <div className="pt-1">
              <button
                onClick={() => setExpanded(v => !v)}
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
              >
                {expanded
                  ? <><ChevronUp className="w-3 h-3" />Mostrar menos</>
                  : <><ChevronDown className="w-3 h-3" />Ver todos ({items.length})</>}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SectionAccent({ color, Icon, title, count, open }: { color: string; Icon: any; title: string; count: number; open: boolean }) {
  return (
    <>
      <div className={`w-1 h-6 rounded-full ${color} shrink-0`} />
      <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <h2 className="text-sm font-semibold tracking-[-0.01em] text-foreground flex-1 text-left group-hover:text-primary transition-colors">{title}</h2>
      <Badge variant="secondary" className="text-xs font-medium">{count}</Badge>
      {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
    </>
  );
}


/* ─── PRIMARY ACTIONS ───────────────────────────────────────── */

function PrimaryAction({ href, title, description, Icon, color }: { href: string; title: string; description: string; Icon: any; color: string }) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.18, ease: easing.smooth }}
        onMouseEnter={() => softHover()}
        onClick={() => { softTap(); haptic.tap(); }}
        className="group card-premium min-h-[168px] p-5 cursor-pointer border-primary/10 hover:border-primary/30 focus-within:ring-2 focus-within:ring-primary/30"
        role="link"
        aria-label={`${title}: ${description}`}
      >
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shadow-sm shrink-0`}>
            <Icon className="w-5 h-5 text-white" strokeWidth={1.85} aria-hidden="true" />
          </div>
          <div className="min-w-0 space-y-2">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground group-hover:text-primary transition-colors">{title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-primary">
          Começar agora <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
        </div>
      </motion.div>
    </Link>
  );
}

/* ─── QUICK ACCESS LINK ───────────────────────────────────────── */

function QuickLink({ href, label, Icon, color }: { href: string; label: string; Icon: any; color: string }) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.18, ease: easing.smooth }}
        onMouseEnter={() => softHover()}
        onClick={() => { softTap(); haptic.tap(); }}
        className="card-premium flex flex-col items-center gap-2 px-4 py-3 cursor-pointer shrink-0 min-w-[94px]"
      >
        <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shadow-sm`}>
          <Icon className="w-4 h-4 text-white" strokeWidth={1.75} />
        </div>
        <span className="text-[11px] font-semibold text-foreground whitespace-nowrap">{label}</span>
      </motion.div>
    </Link>
  );
}

/* ─── STAT COUNTER ────────────────────────────────────────────── */

function StatCounter({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="count-up text-lg font-semibold text-foreground leading-none tracking-[-0.02em]">{value}</span>
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.08em]">{label}</span>
    </div>
  );
}

/* ─── PAGE ────────────────────────────────────────────────────── */

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const isSearching = searchQuery.trim().length > 0;
  const filteredCards = useMemo(() => {
    if (!isSearching) return [];
    const q = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return allSearchableCards.filter(s => {
      const text = `${s.title} ${s.subtitle} ${s.description} ${s.ageRange} ${s.section}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return text.includes(q);
    });
  }, [searchQuery, isSearching]);

  /* Custom cards for sections that need inline cards */
  const testesCards: ScaleCard[] = [
    { href: "/testes-reconhecimento", title: "Reconhecimento (2-7a)", subtitle: "Cores, letras, animais e partes do corpo", description: "Testes de reconhecimento por faixa etária — 4 domínios, 5 faixas.", icon: Baby, ageRange: "2-7 anos", gradient: "from-pink-500 to-rose-500", bgLight: "bg-pink-50 dark:bg-pink-950/30", iconColor: "text-pink-600 dark:text-pink-400" },
    { href: "/testes-academicos", title: "Acadêmico (5-14a)", subtitle: "Leitura, escrita e aritmética", description: "Testes de desempenho acadêmico por faixa etária — 3 domínios, 120 itens.", icon: GraduationCap, ageRange: "5-14 anos", gradient: "from-blue-500 to-indigo-600", bgLight: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-600 dark:text-blue-400" },
    { href: "/inventarios-auto", title: "Autoavaliação (8-17a)", subtitle: "8 inventários respondidos pela criança", description: "Humor, ansiedade, atenção, sono, alimentação e mais — autoaplicado.", icon: ClipboardCheck, ageRange: "8-17 anos", gradient: "from-violet-500 to-purple-600", bgLight: "bg-violet-50 dark:bg-violet-950/30", iconColor: "text-violet-600 dark:text-violet-400" },
    { href: "/tde2", title: "TDE-2", subtitle: "Teste de Desempenho Escolar", description: "Avaliação padronizada de leitura, escrita e aritmética.", icon: BookOpen, ageRange: "Escolar", gradient: "from-amber-500 to-orange-500", bgLight: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600 dark:text-amber-400" },
    { href: "/ahsd-tea", title: "AH/SD-TEA", subtitle: "Altas Habilidades e TEA", description: "Rastreio de superdotação com sobreposição de perfil autista.", icon: Sparkles, ageRange: "Escolar", gradient: "from-yellow-500 to-orange-500", bgLight: "bg-yellow-50 dark:bg-yellow-950/30", iconColor: "text-yellow-600 dark:text-yellow-400" },
  ];

  const ferramentasCards: ScaleCard[] = [
    { href: "/inventarios-escola", title: "Inventários para Escola", subtitle: "4 questionários para professores", description: "Comportamento, TEA, alfabetização e funções executivas — aplicados na escola.", icon: School, ageRange: "Escolar", gradient: "from-emerald-500 to-teal-600", bgLight: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { href: "/filtro", title: "Filtro Inteligente", subtitle: "Escalas + Medicações por queixa", description: "Busque por queixa e idade. Encontre escalas e medicações recomendadas automaticamente.", icon: Filter, ageRange: "Clínico", gradient: "from-primary to-chart-2", bgLight: "bg-primary/5 dark:bg-primary/10", iconColor: "text-primary" },
    { href: "/prontuario", title: "Prontuário Clínico", subtitle: "Anamnese + Linha do Tempo", description: "Preencha o prontuário durante a consulta e gere relatório para impressão.", icon: ClipboardList, ageRange: "Clínico", gradient: "from-violet-600 to-purple-700", bgLight: "bg-violet-50 dark:bg-violet-950/30", iconColor: "text-violet-600 dark:text-violet-400" },
    { href: "/satisfacao-medicacao", title: "Satisfação com Medicação", subtitle: "Adesão e resposta terapêutica", description: "Avalie a percepção do paciente e família sobre o tratamento medicamentoso.", icon: Pill, ageRange: "Clínico", gradient: "from-emerald-600 to-cyan-600", bgLight: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
    farmacologiaCard,
  ];

  const clinicalToolsCards: ScaleCard[] = [
    { href: "/fluxogramas", title: "Fluxogramas de Decisão", subtitle: "Algoritmos clínicos interativos", description: "Fluxogramas de decisão clínica para TDAH, Epilepsia e Atraso de Linguagem — passo a passo visual.", icon: GitBranch, ageRange: "Clínico", gradient: "from-cyan-500 to-blue-600", bgLight: "bg-cyan-50 dark:bg-cyan-950/30", iconColor: "text-cyan-600 dark:text-cyan-400" },
    { href: "/marcos-desenvolvimento", title: "Marcos do Desenvolvimento", subtitle: "0-60 meses — visual e interativo", description: "Marcos do desenvolvimento infantil por idade: motor, linguagem, cognitivo e social com sinais de alerta.", icon: Milestone, ageRange: "0-60m", gradient: "from-emerald-500 to-green-600", bgLight: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { href: "/valores-referencia", title: "Valores de Referência", subtitle: "Sinais vitais + Labs por idade", description: "Tabelas de sinais vitais, laboratório e equipamentos por faixa etária — referência rápida na consulta.", icon: Thermometer, ageRange: "Pediatria", gradient: "from-red-500 to-orange-600", bgLight: "bg-red-50 dark:bg-red-950/30", iconColor: "text-red-600 dark:text-red-400" },
    { href: "/calculadora-dose", title: "Calculadora de Dose", subtitle: "Cálculo por peso/idade", description: "Calcule doses de medicamentos pediátricos por peso e idade com alertas de dose máxima.", icon: Calculator, ageRange: "Ferramenta", gradient: "from-amber-500 to-yellow-600", bgLight: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600 dark:text-amber-400" },
    { href: "/curvas-crescimento", title: "Curvas de Crescimento", subtitle: "OMS — peso, altura, IMC, PC", description: "Curvas de crescimento da OMS: peso, estatura, IMC e perímetro cefálico por idade e sexo.", icon: LineChart, ageRange: "0-19a", gradient: "from-blue-500 to-cyan-600", bgLight: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-600 dark:text-blue-400" },
    { href: "/orientacao-parental", title: "Orientação Parental", subtitle: "Guias para famílias por diagnóstico", description: "Orientações práticas para pais por diagnóstico: TEA, TDAH, epilepsia, sono e mais.", icon: MessageCircle, ageRange: "Família", gradient: "from-pink-500 to-rose-500", bgLight: "bg-pink-50 dark:bg-pink-950/30", iconColor: "text-pink-600 dark:text-pink-400" },
    { href: "/espasticidade", title: "Espasticidade", subtitle: "Ashworth e Tardieu Modificados", description: "Escalas de espasticidade: Ashworth Modificada (0-4) e Tardieu (V1/V3/R1/R2) com interpretação.", icon: Ruler, ageRange: "Clínico", gradient: "from-violet-500 to-purple-600", bgLight: "bg-violet-50 dark:bg-violet-950/30", iconColor: "text-violet-600 dark:text-violet-400" },
    { href: "/classificacoes", title: "Classificações Clínicas", subtitle: "ILAE, FMS, CIF, GMFCS", description: "Classificações internacionais: ILAE (epilepsias), FMS (função motora), CIF (funcionalidade), GMFCS.", icon: Scale, ageRange: "Referência", gradient: "from-slate-500 to-gray-600", bgLight: "bg-slate-50 dark:bg-slate-950/30", iconColor: "text-slate-600 dark:text-slate-400" },
  ];

  const saude_mental_extra: ScaleCard[] = [
    { href: "/psc17", title: "PSC-17", subtitle: "Triagem Psicossocial", description: "Pediatric Symptom Checklist — 17 itens para rastreio de problemas psicossociais.", icon: HeartPulse, ageRange: "4-16 anos", gradient: "from-indigo-500 to-blue-500", bgLight: "bg-indigo-50 dark:bg-indigo-950/30", iconColor: "text-indigo-600 dark:text-indigo-400" },
    { href: "/gad7", title: "GAD-7", subtitle: "Ansiedade Generalizada", description: "Escala de Ansiedade Generalizada — 7 itens, triagem rápida e monitoramento.", icon: AlertTriangle, ageRange: "12+ anos", gradient: "from-yellow-500 to-amber-600", bgLight: "bg-yellow-50 dark:bg-yellow-950/30", iconColor: "text-yellow-600 dark:text-yellow-400" },
    { href: "/aq10", title: "AQ-10", subtitle: "Rastreio de TEA", description: "Autism-Spectrum Quotient — 10 itens para rastreio rápido de TEA em adolescentes e adultos.", icon: Puzzle, ageRange: "Adolescente+", gradient: "from-purple-500 to-violet-600", bgLight: "bg-purple-50 dark:bg-purple-950/30", iconColor: "text-purple-600 dark:text-purple-400" },
    { href: "/fichas-registro", title: "Fichas de Registro", subtitle: "Bayley, WISC, HINE, GMFM, ADOS-2", description: "Fichas comerciais para registro de resultados de testes padronizados.", icon: FileText, ageRange: "Clínico", gradient: "from-teal-500 to-emerald-600", bgLight: "bg-teal-50 dark:bg-teal-950/30", iconColor: "text-teal-600 dark:text-teal-400" },
  ];

  const guiasCards: ScaleCard[] = [
    { href: "/neuropsicologia", title: "Avaliação Neuropsicológica", subtitle: "Guia didático completo", description: "O que é, quando pedir e como interpretar — 9 domínios, 15 testes.", icon: BrainCog, ageRange: "Guia", gradient: "from-violet-500 to-indigo-600", bgLight: "bg-violet-50 dark:bg-violet-950/30", iconColor: "text-violet-600 dark:text-violet-400" },
    { href: "/pac", title: "Processamento Auditivo", subtitle: "PAC — habilidades auditivas", description: "Avaliação, diferencial com TDAH e tratamento — 11 habilidades, 10 testes.", icon: Ear, ageRange: "Guia", gradient: "from-fuchsia-500 to-purple-600", bgLight: "bg-fuchsia-50 dark:bg-fuchsia-950/30", iconColor: "text-fuchsia-600 dark:text-fuchsia-400" },
    { href: "/psiquiatria", title: "Guia de Psiquiatria Infantil", subtitle: "30 Transtornos — DSM-5", description: "Resumos clínicos: critérios, diagnóstico diferencial, tratamento e pérolas clínicas.", icon: Brain, ageRange: "Guia", gradient: "from-blue-500 to-indigo-600", bgLight: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-600 dark:text-blue-400" },
    { href: "/pant", title: "PANT — 100 Escalas Passivas", subtitle: "Avaliação Funcional do Neurodesenvolvimento", description: "Manual técnico com 100 escalas passivas em 5 macrodomínios, régua 0-4 com ancoragem clínica.", icon: FileText, ageRange: "Guia", gradient: "from-primary to-chart-2", bgLight: "bg-primary/5 dark:bg-primary/10", iconColor: "text-primary" },
    { href: "/avaliacao-multiprofissional", title: "Avaliação Multiprofissional", subtitle: "Instrumentos por faixa etária e área", description: "Guia completo: quem avalia, o que usar, quando solicitar. Mapa de instrumentos de 18 meses a adultos.", icon: ClipboardCheck, ageRange: "Guia", gradient: "from-emerald-500 to-teal-600", bgLight: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600 dark:text-emerald-400" },
    { href: "/plano-terapeutico", title: "Plano Terapêutico (PTI)", subtitle: "Gerador interativo de plano individualizado", description: "Monte o plano terapêutico multiprofissional: objetivos, estratégias, frequência — gera PDF e envia por email.", icon: Target, ageRange: "Ferramenta", gradient: "from-rose-500 to-pink-600", bgLight: "bg-rose-50 dark:bg-rose-950/30", iconColor: "text-rose-600 dark:text-rose-400" },
    { href: "/plano-intervencao", title: "Intervenção por Habilidades", subtitle: "7 áreas com estratégias práticas", description: "Como intervir em cada domínio: social, cognitivo, linguagem, motor, sensorial — com atividades recomendadas.", icon: Lightbulb, ageRange: "Guia", gradient: "from-amber-500 to-orange-500", bgLight: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600 dark:text-amber-400" },
  ];

  return (
    <div className="page-enter space-y-6 pb-8">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal, ease: easing.smooth }}
        className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/70 shadow-xl shadow-slate-950/[0.04] mb-6"
      >
        <div className="absolute inset-0">
          <img src={neuralAbstractImg} alt="" className="w-full h-full object-cover opacity-10 dark:opacity-20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.12),transparent_42%),linear-gradient(180deg,hsl(var(--background)/0.84),hsl(var(--background)/0.96))]" />
        </div>
        <div className="relative text-center space-y-5 px-5 py-8 sm:px-8 sm:py-10">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: duration.normal, ease: easing.spring }}
            className="flex justify-center"
          >
            <img
              src={drJadsonLogo}
              alt="Dr. Jadson Fraga"
              className="w-16 h-16 object-cover rounded-2xl shadow-lg shadow-slate-950/10 ring-1 ring-primary/15"
              data-testid="img-dr-jadson-logo"
            />
          </motion.div>
          <div>
            <h1
              className="text-4xl text-gradient tracking-[-0.04em] sm:text-5xl"
              style={{ fontFamily: "var(--font-sans)", fontWeight: 650 }}
              data-testid="text-page-title"
            >
              NeuroPed
            </h1>
            <p className="text-sm text-muted-foreground mt-2">Cockpit de escalas, pacientes e documentos em neuropediatria</p>
          </div>

          {/* Stat counters */}
          <div className="mx-auto flex max-w-xl flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-2xl border border-border/70 bg-background/65 px-4 py-3">
            <StatCounter value="75+" label="Páginas" />
            <div className="w-px h-8 bg-border" />
            <StatCounter value="495+" label="Escalas" />
            <div className="w-px h-8 bg-border" />
            <StatCounter value="142" label="Medicações" />
            <div className="w-px h-8 bg-border" />
            <StatCounter value="30" label="Categorias" />
          </div>

          {/* Search */}
          <div className="relative max-w-md mx-auto" data-testid="search-container">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar escala, área ou faixa etária..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-11 rounded-2xl bg-background/80 border-border/80 text-sm shadow-sm"
              data-testid="input-search"
            />
            {isSearching && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            Ferramenta educacional para uso profissional responsável
          </p>
        </div>
      </motion.div>

      {!isSearching && (
        <section className="space-y-5 rounded-[2rem] border border-border/70 bg-card/80 p-4 shadow-lg shadow-slate-950/[0.04] sm:p-6" aria-labelledby="acoes-principais">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.18em]">Cockpit clínico</p>
              <h2 id="acoes-principais" className="text-2xl font-semibold tracking-[-0.03em] text-foreground">Quatro caminhos essenciais</h2>
              <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">A home prioriza as decisões que sustentam a consulta: aplicar escala, localizar paciente, acompanhar evolução e preparar documentos.</p>
            </div>
            <Badge variant="outline" className="hidden sm:inline-flex text-[10px] bg-background/70">Foco assistencial</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <PrimaryAction href="/filtro" title="Aplicar Escala" description="Escolha o instrumento por idade, queixa, objetivo e contexto clínico." Icon={ClipboardCheck} color="bg-gradient-to-br from-primary to-cyan-700" />
            <PrimaryAction href="/pacientes" title="Pacientes" description="Acesse cadastro, histórico e resultados vinculados ao prontuário." Icon={Users} color="bg-gradient-to-br from-slate-700 to-slate-950" />
            <PrimaryAction href="/pacientes" title="Evolução" description="Revise tendências longitudinais e compare resultados de escalas salvas." Icon={LineChart} color="bg-gradient-to-br from-teal-600 to-cyan-700" />
            <PrimaryAction href="/prontuario" title="Documentos" description="Prepare anamnese, relatório clínico e materiais para impressão." Icon={FileText} color="bg-gradient-to-br from-blue-700 to-slate-900" />
          </div>
          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
            <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <strong className="font-semibold">Uso responsável:</strong> escalas orientam rastreio e acompanhamento, mas não fecham diagnóstico isoladamente. Confirme a adequação do instrumento, consentimento e contexto clínico antes de salvar ou exportar dados.
            </p>
          </div>
        </section>
      )}

      {/* ── SEARCH RESULTS ───────────────────────────────────── */}
      {isSearching ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {filteredCards.length === 0
              ? "Nenhuma escala encontrada."
              : `${filteredCards.length} resultado${filteredCards.length > 1 ? "s" : ""}`}
          </p>
          <div className="stagger-in grid gap-2 sm:grid-cols-2">
            {filteredCards.map((s) => <ScaleCardItem key={s.href} scale={s as ScaleCard} />)}
          </div>
        </div>
      ) : (
        <>
          {/* ── FAVORITOS E RECENTES (D3) ────────────────────── */}
          <FavoritesRecents />

          {/* ── SECONDARY GROUPED ACCESS ──────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-card/65 p-4 space-y-3 shadow-sm">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ferramentas rápidas</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <QuickLink href="/prontuario" label="Prontuário" Icon={ClipboardList} color="bg-gradient-to-br from-violet-600 to-purple-700" />
                <QuickLink href="/satisfacao-medicacao" label="Medicação" Icon={Pill} color="bg-gradient-to-br from-emerald-600 to-cyan-600" />
                <QuickLink href="/testes-reconhecimento" label="Testes" Icon={GraduationCap} color="bg-gradient-to-br from-pink-500 to-rose-500" />
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/65 p-4 space-y-3 shadow-sm">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Biblioteca</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <QuickLink href="/inventarios-escola" label="Escola" Icon={School} color="bg-gradient-to-br from-emerald-500 to-teal-600" />
                <QuickLink href="/fluxogramas" label="Fluxos" Icon={GitBranch} color="bg-gradient-to-br from-cyan-500 to-blue-600" />
                <QuickLink href="/marcos-desenvolvimento" label="Marcos" Icon={Milestone} color="bg-gradient-to-br from-emerald-500 to-green-600" />
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/65 p-4 space-y-3 shadow-sm">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Referência</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <QuickLink href="/valores-referencia" label="Valores" Icon={Thermometer} color="bg-gradient-to-br from-red-500 to-orange-600" />
                <QuickLink href="/farmacologia" label="Fármacos" Icon={Pill} color="bg-gradient-to-br from-emerald-600 to-cyan-600" />
                <QuickLink href="/ajuda" label="Ajuda" Icon={Lightbulb} color="bg-gradient-to-br from-amber-500 to-orange-500" />
              </div>
            </div>
          </div>

 {/* ── SECTION DIVIDER ──────────────────────────────── */}
          <div className="h-px bg-border" />

          {/* ── CATEGORY SECTIONS ────────────────────────────── */}
          <div className="space-y-5">

            {/* 1 — Investigação Diagnóstica */}
            <ExpandableSection
              title="Investigação Diagnóstica"
              icon={Brain}
              accentColor="bg-gradient-to-b from-violet-500 to-purple-600"
              items={neurodevScales}
              previewCount={4}
              defaultOpen={true}
            />

            {/* 2 — Comportamento e TDAH */}
            <ExpandableSection
              title="Comportamento e TDAH"
              icon={Activity}
              accentColor="bg-gradient-to-b from-teal-500 to-cyan-500"
              items={behaviorScales}
              previewCount={4}
            />

            {/* 3 — Saúde Mental */}
            <ExpandableSection
              title="Saúde Mental"
              icon={HeartPulse}
              accentColor="bg-gradient-to-b from-indigo-500 to-blue-500"
              items={mentalHealthScales}
              previewCount={4}
            />

            {/* 4 — Regulação Emocional */}
            <ExpandableSection
              title="Regulação Emocional"
              icon={ShieldAlert}
              accentColor="bg-gradient-to-b from-red-500 to-rose-600"
              items={regulacaoEmocionalScales}
              previewCount={4}
            />

            {/* 5 — Testes Diretos para Criança */}
            <ExpandableSection
              title="Testes Diretos para Criança"
              icon={GraduationCap}
              accentColor="bg-gradient-to-b from-pink-500 to-rose-500"
              items={testesCards}
              previewCount={4}
            />

            {/* 6 — Sono, Tiques e QV */}
            <ExpandableSection
              title="Sono, Tiques e Qualidade de Vida"
              icon={Moon}
              accentColor="bg-gradient-to-b from-indigo-500 to-purple-600"
              items={otherScales}
              previewCount={4}
            />

            {/* 7 — Diários Clínicos */}
            <CollapsibleSection
              title="Diários Clínicos"
              icon={Calendar}
              accentColor="bg-gradient-to-b from-rose-500 to-red-600"
              count={diaries.length}
            >
              {diaries.map(d => (
                <ScaleCardItem key={d.href} scale={d as ScaleCard} />
              ))}
            </CollapsibleSection>

            {/* 8 — Bateria Dr. Jadson */}
            <ExpandableSection
              title="Bateria Dr. Jadson"
              icon={Stethoscope}
              accentColor="bg-gradient-to-b from-emerald-500 to-teal-600"
              items={bateriaScales}
              previewCount={4}
            />

            {/* 9 — Ferramentas e Escola */}
            <ExpandableSection
              title="Ferramentas e Escola"
              icon={Filter}
              accentColor="bg-gradient-to-b from-primary to-chart-2"
              items={ferramentasCards}
              previewCount={4}
            />

            {/* 10 — Guias Educativos */}
            <ExpandableSection
              title="Guias Educativos"
              icon={BookOpen}
              accentColor="bg-gradient-to-b from-blue-500 to-indigo-600"
              items={guiasCards}
              previewCount={4}
            />

            {/* 11 — Ferramentas Clínicas */}
            <ExpandableSection
              title="Ferramentas Clínicas"
              icon={Stethoscope}
              accentColor="bg-gradient-to-b from-cyan-500 to-blue-600"
              items={clinicalToolsCards}
              previewCount={4}
              defaultOpen={true}
            />

            {/* 12 — Escalas Adicionais */}
            <ExpandableSection
              title="Escalas Adicionais"
              icon={ClipboardCheck}
              accentColor="bg-gradient-to-b from-teal-500 to-emerald-600"
              items={saude_mental_extra}
              previewCount={4}
            />

          </div>

          {/* ── FOOTER ───────────────────────────────────────── */}
          <div className="pt-4 space-y-3">
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-3.5">
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>Aviso educacional:</strong> Este app é uma ferramenta de estudo. As escalas são simplificações didáticas. O diagnóstico clínico real requer avaliação multidisciplinar e aplicação padronizada por profissionais treinados.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 py-2">
              <img
                src={drJadsonLogo}
                alt="Dr. Jadson Fraga"
                className="w-6 h-6 rounded-lg object-cover"
              />
              <span className="text-xs text-muted-foreground font-medium">Dr. Jadson Fraga Araújo Júnior — Neuropediatra</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground/50">
              <span>Petrolina — PE</span>
              <span>·</span>
              <span>v2.0.0</span>
              <span>·</span>
              <Link href="/sobre"><span className="hover:text-primary cursor-pointer transition-colors">Sobre</span></Link>
              <span>·</span>
              <Link href="/ajuda"><span className="hover:text-primary cursor-pointer transition-colors">Ajuda</span></Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
