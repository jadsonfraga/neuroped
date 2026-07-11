// ============================================================
// Itens interativos por escala — transforma fichas técnicas em
// APLICAÇÕES REAIS (itens respondíveis + cálculo de escore).
//
// A página /generic-scale/:id detecta automaticamente quando uma
// escala tem itens aqui e renderiza a aplicação interativa
// (GenericScale) no lugar da ficha técnica.
//
// Direção do escore: maior = melhor (mais marcos alcançados).
// As faixas de interpretação são heurísticas de TRIAGEM — nunca
// diagnóstico. Conteúdo autoral (Dr. Jadson Fraga) baseado em
// marcos do neurodesenvolvimento amplamente estabelecidos.
// ============================================================
import {
  Baby, Activity, MessageCircle, Heart, Hand, Eye, Ear, Sparkles,
  ClipboardList, ShieldAlert, Moon, Pill, type LucideIcon,
} from "lucide-react";
import type { ScaleEntry } from "./scaleFilter";
import type { ScaleConfig } from "@/components/GenericScale";
import { j26Bloco1Items } from "./interactiveScaleItemsJ26Bloco1";
import { j26Bloco2Items } from "./interactiveScaleItemsJ26Bloco2";
import { j26Bloco3Items } from "./interactiveScaleItemsJ26Bloco3";
import { j26Bloco4Items } from "./interactiveScaleItemsJ26Bloco4";
import { driveImport2026Items } from "./interactiveScaleItemsDrive2026";

export interface InteractiveBand {
  /** Percentual mínimo do escore máximo (0-100) para cair nesta faixa. */
  minPct: number;
  classification: string;
  /** "emerald" | "amber" | "orange" | "red" (cores aceitas pelo GenericScale). */
  color: string;
  description: string;
}

export interface InteractiveDomainDef {
  name: string;
  color?: string; // classe tailwind de texto (ex.: "text-pink-600 dark:text-pink-400")
  items: string[];
}

export interface InteractiveScaleDef {
  icon?: LucideIcon;
  gradient?: string;
  instruction: string;
  infoBox?: string;
  /** Opções de resposta (índice 0..n). */
  labels: string[];
  /** Pontos por opção (default: o próprio índice). */
  optionPoints?: number[];
  scoreDirection?: "higher_better" | "higher_worse";
  totalLabel?: string;
  domains: InteractiveDomainDef[];
  /** Faixas de interpretação por % do escore máximo (maior = melhor). */
  bands: InteractiveBand[];
}

// ------------------------------------------------------------
// Padrões reutilizáveis para escalas de marcos do desenvolvimento
// ------------------------------------------------------------
const MILESTONE_LABELS = ["Ainda não", "Às vezes / começando", "Sim, já faz"];

// Faixas de triagem do desenvolvimento (maior % = mais marcos alcançados).
const DEV_BANDS: InteractiveBand[] = [
  {
    minPct: 85,
    classification: "Desenvolvimento adequado para a idade",
    color: "emerald",
    description:
      "A maioria dos marcos esperados está presente. Mantenha o acompanhamento de rotina e a estimulação no dia a dia. Triagem não substitui avaliação clínica.",
  },
  {
    minPct: 65,
    classification: "Em desenvolvimento — vigiar e reavaliar",
    color: "amber",
    description:
      "Vários marcos já aparecem, mas alguns ainda estão emergindo. Reforce a estimulação e reavalie em 1–2 meses. Se houver outros sinais de alerta, antecipe a avaliação.",
  },
  {
    minPct: 45,
    classification: "Sinais de alerta — reavaliar em curto prazo",
    color: "orange",
    description:
      "Há marcos importantes ainda ausentes para a faixa etária. Recomenda-se reavaliação dirigida em curto prazo e considerar encaminhamento para estimulação/avaliação especializada.",
  },
  {
    minPct: 0,
    classification: "Atraso provável — investigar e encaminhar",
    color: "red",
    description:
      "Muitos marcos esperados estão ausentes. Recomenda-se investigação e encaminhamento para avaliação especializada (neuropediatria e/ou terapias). Está é uma triagem, não um diagnóstico.",
  },
];

function pickBand(bands: InteractiveBand[], pct: number): InteractiveBand {
  // bands em ordem decrescente de minPct; pega a primeira satisfeita.
  const sorted = [...bands].sort((a, b) => b.minPct - a.minPct);
  return sorted.find((b) => pct >= b.minPct) ?? sorted[sorted.length - 1];
}

/**
 * Converte uma definição declarativa de itens em uma config completa do
 * GenericScale (com onCalculate gerado automaticamente a partir das faixas).
 */
export function makeInteractiveConfig(scale: ScaleEntry, def: InteractiveScaleDef): ScaleConfig {
  const labels = def.labels;
  const pts = def.optionPoints ?? labels.map((_, i) => i);
  const maxPerItem = Math.max(...pts);
  const nItems = def.domains.reduce((s, d) => s + d.items.length, 0);
  const maxTotal = maxPerItem * nItems;
  // Título limpo: remove o código "(NEXUS-xxx)" do fim, se houver.
  const cleanTitle = scale.name.replace(/\s*\(NEXUS-\d+\)\s*$/i, "").trim() || scale.name;

  return {
    title: cleanTitle,
    subtitle: scale.fullName,
    icon: def.icon ?? ClipboardList,
    gradient: def.gradient ?? "from-primary to-chart-2",
    instruction: def.instruction,
    labels,
    infoBox: def.infoBox,
    scaleId: scale.id,
    domains: def.domains.map((d) => ({
      name: d.name,
      color: d.color ?? "text-primary",
      items: d.items,
    })),
    onCalculate: (answers) => {
      let total = 0;
      const domainResults = def.domains.map((d, di) => {
        let dscore = 0;
        d.items.forEach((_, ii) => {
          const ans = answers[`${di}-${ii}`];
          if (ans !== undefined) dscore += pts[ans] ?? 0;
        });
        total += dscore;
        const dmax = maxPerItem * d.items.length || 1;
        const band = pickBand(def.bands, (dscore / dmax) * 100);
        return { domain: d.name, score: dscore, classification: band.classification, color: band.color };
      });
      const pct = maxTotal ? (total / maxTotal) * 100 : 0;
      const band = pickBand(def.bands, pct);
      return {
        total,
        totalLabel: def.totalLabel ?? `Marcos alcançados — escore ${total} de ${maxTotal}`,
        classification: band.classification,
        color: band.color,
        description: band.description,
        domainResults: def.domains.length > 1 ? domainResults : undefined,
      };
    },
  };
}

const DEV_INSTRUCTION =
  "Para cada marco, marque o que a criança já consegue fazer no dia a dia. Responda com base no que você realmente observa — não no que imagina que ela faria. Responda todos os itens.";

const DEV_INFO =
  "Triagem do neurodesenvolvimento (não é diagnóstico). Escore maior = mais marcos alcançados. Resultados abaixo do esperado indicam reavaliar e, se necessário, encaminhar.";

// ============================================================
// LOTE 1 — Categoria 1: Triagem do Neurodesenvolvimento (autoral)
// ============================================================
const ABSENT_MILD_CLEAR_LABELS = ["Ausente / normal", "Leve / ocasional", "Claro / frequente"];
const PAIN_0_2_LABELS = ["0 - ausente", "1 - leve/moderado", "2 - claro/intenso"];
const SEVERITY_0_3_LABELS = ["0 - ausente", "1 - leve", "2 - moderado", "3 - intenso"];
const COMFORT_1_5_LABELS = ["1 - calmo/confortável", "2", "3", "4", "5 - muito desconfortável"];

const HIGHER_WORSE_0_2_BANDS: InteractiveBand[] = [
  { minPct: 70, classification: "Alteração importante", color: "red", description: "Pontuação elevada. Requer correlação clínica imediata, revisão do contexto e conduta conforme gravidade. A escala apoia monitorização, não fecha diagnóstico isoladamente." },
  { minPct: 40, classification: "Alteração moderada", color: "orange", description: "Há sinais moderados. Reavalie fatores desencadeantes, examine o paciente e considere intervenção/seguimento mais próximo." },
  { minPct: 1, classification: "Sinais leves", color: "amber", description: "Há sinais leves ou ocasionais. Acompanhe evolução, revise medidas de conforto/manejo e repita se houver piora." },
  { minPct: 0, classification: "Sem alteração relevante", color: "emerald", description: "Pontuação baixa. Não há sinal relevante neste registro, mantendo vigilância clínica conforme o caso." },
];

const MED_SIDE_EFFECT_BANDS: InteractiveBand[] = [
  { minPct: 60, classification: "Carga alta de efeitos", color: "red", description: "Muitos efeitos moderados/intensos. Requer revisão medicamentosa, exame clínico e plano de segurança conforme o contexto." },
  { minPct: 35, classification: "Carga moderada de efeitos", color: "orange", description: "Efeitos relevantes presentes. Pondere dose, tempo de uso, comorbidades e necessidade de monitorização mais próxima." },
  { minPct: 1, classification: "Efeitos leves", color: "amber", description: "Efeitos leves/ocasionais. Registre, oriente a família e acompanhe tendência longitudinal." },
  { minPct: 0, classification: "Sem efeitos relevantes", color: "emerald", description: "Sem efeitos clinicamente relevantes neste registro. Manter vigilância de rotina." },
];

const ENGEL_BANDS: InteractiveBand[] = [
  { minPct: 100, classification: "Classe IV - sem melhora útil", color: "red", description: "Desfecho insatisfatório no controle de crises. Revisar plano terapêutico/cirúrgico com equipe especializada." },
  { minPct: 67, classification: "Classe III - melhora limitada", color: "orange", description: "Melhora limitada. Registrar frequência/tipo de crise e discutir reestratificação do manejo." },
  { minPct: 34, classification: "Classe II - crises raras", color: "amber", description: "Bom desfecho parcial, com crises raras ou quase livre de crises. Manter seguimento longitudinal." },
  { minPct: 0, classification: "Classe I - livre de crises incapacitantes", color: "emerald", description: "Melhor categoria funcional de desfecho. Interpretar junto ao diário de crises, medicações e acompanhamento neurológico." },
];

const COMFORT_B_BANDS: InteractiveBand[] = [
  { minPct: 77, classification: "Desconforto/dor importante", color: "red", description: "Escore alto de desconforto comportamental. Reavaliar analgesia/sedação, ambiente, procedimentos e sinais vitais." },
  { minPct: 57, classification: "Desconforto moderado", color: "orange", description: "Há desconforto observável. Correlacione com dor, sedação, ventilação e contexto clínico." },
  { minPct: 37, classification: "Desconforto leve", color: "amber", description: "Sinais leves. Acompanhe tendência e medidas de conforto." },
  { minPct: 0, classification: "Conforto adequado", color: "emerald", description: "Baixo desconforto comportamental no momento observado." },
];

const NEVER_SOMETIMES_OFTEN_LABELS = ["Nunca", "Às vezes", "Frequentemente"];
const FREQUENCY_0_3_LABELS = ["Nunca/quase nunca", "Às vezes", "Frequentemente", "Quase sempre"];
const PERFORMANCE_0_3_LABELS = ["Não realiza", "Emergente", "Parcial", "Adequado"];

const PSYCHOSOCIAL_0_2_BANDS: InteractiveBand[] = [
  { minPct: 65, classification: "Risco psicossocial alto", color: "red", description: "Carga elevada de sintomas. Requer avaliação clínica, risco funcional e plano de seguimento/encaminhamento." },
  { minPct: 45, classification: "Risco psicossocial moderado", color: "orange", description: "Sintomas relevantes. Correlacione com escola, família, duração e prejuizo funcional." },
  { minPct: 25, classification: "Sinais leves", color: "amber", description: "Alguns sinais presentes. Oriente observação, medidas de apoio e reavaliação se persistir." },
  { minPct: 0, classification: "Triagem baixa", color: "emerald", description: "Baixa carga de sintomas neste registro. Mantenha vigilância clínica conforme queixa e contexto." },
];

const MENTAL_HEALTH_0_3_BANDS: InteractiveBand[] = [
  { minPct: 67, classification: "Sintomas intensos", color: "red", description: "Escore elevado. Avalie risco, prejuizo funcional, comorbidades e necessidade de intervenção/encaminhamento." },
  { minPct: 45, classification: "Sintomas moderados", color: "orange", description: "Carga moderada de sintomas. Correlacione com história, escola/família e exame do estado mental." },
  { minPct: 20, classification: "Sintomas leves", color: "amber", description: "Sinais leves. Pode apoiar psicoeducação e monitorização longitudinal." },
  { minPct: 0, classification: "Baixa carga sintomática", color: "emerald", description: "Baixa carga no registro atual. Não exclui diagnóstico se houver sinais clínicos relevantes." },
];

const DEVELOPMENT_0_3_BANDS: InteractiveBand[] = [
  { minPct: 80, classification: "Desempenho adequado/esperado", color: "emerald", description: "Muitos marcos/desempenhos presentes. Interprete conforme idade, prematuridade e exame clínico." },
  { minPct: 60, classification: "Desempenho parcialmente adequado", color: "amber", description: "Há habilidades presentes, mas alguns domínios merecem vigilância e reavaliação." },
  { minPct: 40, classification: "Atraso possível", color: "orange", description: "Desempenho abaixo do esperado em áreas relevantes. Considere avaliação dirigida e intervenção precoce." },
  { minPct: 0, classification: "Atraso provável/importante", color: "red", description: "Poucas habilidades presentes no registro. Investigar, encaminhar e acompanhar de forma estruturada." },
];

const HINE_BANDS: InteractiveBand[] = [
  { minPct: 82, classification: "Exame neurológico global favorável", color: "emerald", description: "Registro com muitos sinais neurológicos adequados. Correlacione com idade corrigida, risco neonatal e exame completo." },
  { minPct: 65, classification: "Sinais discretos - vigiar", color: "amber", description: "Alguns achados merecem seguimento, orientação e reavaliação seriada." },
  { minPct: 45, classification: "Sinais neurológicos moderados", color: "orange", description: "Achados relevantes. Considere encaminhamento, imagem/exames conforme contexto e intervenção precoce." },
  { minPct: 0, classification: "Sinais neurológicos importantes", color: "red", description: "Carga alta de achados neurológicos. Priorize avaliação especializada e plano de cuidado." },
];

const interactiveScaleItemsCore: Record<string, InteractiveScaleDef> = {
  psc17: {
    icon: ClipboardList,
    gradient: "from-sky-600 to-blue-700",
    instruction: "Marque a frequência dos sinais observados nas últimas semanas. Use como triagem psicossocial breve e correlacione com prejuizo funcional.",
    infoBox: "PSC-17 estruturado para triagem no app. Escore maior = maior carga de sintomas; não substitui entrevista clínica nem formulário oficial quando exigido.",
    labels: NEVER_SOMETIMES_OFTEN_LABELS,
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Carga psicossocial PSC-17 (0-34)",
    bands: PSYCHOSOCIAL_0_2_BANDS,
    domains: [
      { name: "Internalizante", color: "text-blue-600 dark:text-blue-400", items: ["Tristeza, desanimo ou preocupação persistente", "Medos ou ansiedade que atrapalham rotina", "Queixas somáticas associadas a estresse", "Isolamento ou perda de interesse", "Irritabilidade emocional com sofrimento"] },
      { name: "Atenção", color: "text-cyan-600 dark:text-cyan-400", items: ["Dificuldade de manter atenção em tarefas", "Distrai-se facilmente no cotidiano", "Esquece combinados, materiais ou instruções", "Dificuldade de concluir atividades", "Impulsividade cognitiva ou respostas precipitadas"] },
      { name: "Externalizante", color: "text-amber-600 dark:text-amber-400", items: ["Desobedece ou desafia adultos com frequência", "Brigas, agressividade ou explosões de raiva", "Culpa outros ou nega responsabilidade", "Regras quebradas em casa/escola", "Comportamento disruptivo com prejuizo social", "Baixa tolerância a frustração", "Conflitos recorrentes com pares"] },
    ],
  },

  erc: {
    icon: Heart,
    gradient: "from-pink-600 to-rose-700",
    instruction: "Pontue como pais/professores observam regulação emocional e labilidade no cotidiano. Considere as últimas 2-4 semanas.",
    infoBox: "Registro estruturado inspirado nos domínios do ERC. Escore maior = mais dificuldade emocional neste registro.",
    labels: FREQUENCY_0_3_LABELS,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Dificuldade de regulação emocional (0-72)",
    bands: MENTAL_HEALTH_0_3_BANDS,
    domains: [
      { name: "Labilidade/negatividade", color: "text-rose-600 dark:text-rose-400", items: ["Mudancas rapidas de humor", "Explosões emocionais desproporcionais", "Irritabilidade persistente", "Choro ou raiva de difícil recuperação", "Reação intensa a pequenas frustrações", "Dificuldade de voltar ao basal", "Hostilidade verbal ou corporal", "Emoções negativas prolongadas", "Sensibilidade excessiva a correção", "Conflitos por baixa tolerância a espera", "Comportamento imprevisível pela emoção", "Prejuizo social por reatividade emocional"] },
      { name: "Regulação adaptativa", color: "text-pink-600 dark:text-pink-400", items: ["Dificuldade de nomear o que sente", "Dificuldade de pedir ajuda quando aflito", "Pouco uso de estrategias para se acalmar", "Dificuldade de seguir combinados quando frustrado", "Baixa flexibilidade diante de mudancas", "Dificuldade de reparar conflitos", "Pouca empatia quando outra pessoa sofre", "Dificuldade de esperar recompensa", "Reação emocional prejudica aprendizagem", "Precisa de adulto para regular quase sempre", "Evita atividades por medo/raiva", "Dificuldade de aceitar limites"] },
    ],
  },

  hine: {
    icon: Baby,
    gradient: "from-emerald-600 to-teal-700",
    instruction: "Pontue achados do exame neurológico do lactente conforme desempenho observado. Use idade corrigida quando aplicável.",
    infoBox: "Registro estruturado para HINE no app. Escore maior = exame mais favorável; use como apoio, não como substituto do protocolo oficial.",
    labels: PERFORMANCE_0_3_LABELS,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Escore neurológico estruturado (0-78)",
    bands: HINE_BANDS,
    domains: [
      { name: "Nervos cranianos", color: "text-emerald-600 dark:text-emerald-400", items: ["Seguimento visual", "Resposta auditiva", "Movimentos oculares conjugados", "Expressão facial simétrica", "Sucção/deglutição adequadas", "Qualidade do choro/vocalização"] },
      { name: "Postura", color: "text-teal-600 dark:text-teal-400", items: ["Postura de cabeça", "Postura de tronco", "Postura de braços", "Postura de mãos", "Postura de pernas", "Postura de pés"] },
      { name: "Movimentos", color: "text-cyan-600 dark:text-cyan-400", items: ["Quantidade de movimentos espontaneos", "Qualidade dos movimentos", "Simetria dos movimentos", "Controle antigravitacional"] },
      { name: "Tônus", color: "text-lime-600 dark:text-lime-400", items: ["Tônus global", "Traction response", "Suspensão ventral", "Amplitude passiva de ombros", "Prono/sentado conforme idade", "Adutores/angulo popliteo conforme idade"] },
      { name: "Reflexos e reações", color: "text-green-600 dark:text-green-400", items: ["Reflexos tendinosos", "Moro/paraquedas conforme idade", "Reação de proteção", "Resposta plantar"] },
    ],
  },

  catclams: {
    icon: MessageCircle,
    gradient: "from-indigo-600 to-violet-700",
    instruction: "Pontue habilidades adaptativas/cognitivas e de linguagem observadas ou confirmadas por cuidador. Compare com idade cronológica/corrigida.",
    infoBox: "Registro estruturado CAT/CLAMS no app. Escore maior = mais habilidades presentes; não substitui conversão normativa oficial.",
    labels: PERFORMANCE_0_3_LABELS,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Desenvolvimento adaptativo-linguístico (0-72)",
    bands: DEVELOPMENT_0_3_BANDS,
    domains: [
      { name: "CAT - adaptativo/cognitivo", color: "text-indigo-600 dark:text-indigo-400", items: ["Explora objeto com olhar e mãos", "Transfere objeto entre mãos", "Procura objeto parcialmente escondido", "Usa pinça ou pega fina funcional", "Coloca e retira objetos de recipiente", "Imita ação simples com objeto", "Resolve encaixe/formas simples", "Faz brincadeira funcional", "Empilha ou constrói com blocos", "Combina objetos por função", "Aponta/seleciona figura ou objeto nomeado", "Realiza tarefa de causa-efeito"] },
      { name: "CLAMS - linguagem/audição", color: "text-violet-600 dark:text-violet-400", items: ["Reage a sons e voz familiar", "Vocaliza para interagir", "Balbucia sílabas repetidas", "Responde ao próprio nome", "Compreende comando simples com gesto", "Usa gesto comunicativo", "Fala palavra com significado", "Aponta para pedir ou mostrar", "Compreende comando sem gesto", "Nomeia objetos/pessoas familiares", "Combina duas palavras", "Usa fala/gesto para resolver necessidade"] },
    ],
  },

  "fas-fluência": {
    icon: MessageCircle,
    gradient: "from-fuchsia-600 to-purple-700",
    instruction: "Registre desempenho por tarefa de fluência verbal. Use normas por idade/escolaridade quando disponíveis.",
    infoBox: "Registro estruturado de fluência verbal. Escore maior = melhor produção/estrategia; a interpretação final depende de norma local.",
    labels: PERFORMANCE_0_3_LABELS,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_better",
    totalLabel: "Perfil de fluência verbal (0-18)",
    bands: DEVELOPMENT_0_3_BANDS,
    domains: [
      { name: "Fluência fonológica", color: "text-fuchsia-600 dark:text-fuchsia-400", items: ["Letra F - produção adequada para idade/escolaridade", "Letra A - produção adequada para idade/escolaridade", "Letra S - produção adequada para idade/escolaridade"] },
      { name: "Qualidade executiva", color: "text-purple-600 dark:text-purple-400", items: ["Baixa perseveração/repetição", "Mantem regra da tarefa", "Usa estrategia de agrupamento e troca"] },
    ],
  },

  bisq: {
    icon: Moon,
    gradient: "from-slate-700 to-indigo-800",
    instruction: "Pontue padrões de sono do lactente/criança pequena nos últimos 7-14 dias, com base no relato do cuidador.",
    infoBox: "BISQ estruturado para triagem no app. Escore maior = maior carga de problema de sono; não substitui diário de sono quando necessário.",
    labels: ABSENT_MILD_CLEAR_LABELS,
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Carga de problemas de sono infantil (0-16)",
    bands: HIGHER_WORSE_0_2_BANDS,
    domains: [
      { name: "Sono noturno", color: "text-indigo-600 dark:text-indigo-400", items: ["Latência para dormir prolongada", "Despertares noturnos frequentes", "Tempo acordado de madrugada prolongado", "Duração total de sono reduzida"] },
      { name: "Rotina e contexto", color: "text-slate-600 dark:text-slate-400", items: ["Horário de dormir irregular", "Associação intensa para adormecer", "Sonecas desorganizadas para idade", "Sono dos cuidadores prejudicado"] },
    ],
  },

  nddie: {
    icon: Pill,
    gradient: "from-blue-700 to-slate-800",
    instruction: "Pontue sintomas depressivos em pessoa com epilepsia nas últimas 2 semanas. Avalie risco de suicidio separadamente quando houver alerta.",
    infoBox: "Registro estruturado inspirado no NDDI-E. Escore maior = maior carga depressiva; não substitui escala oficial nem avaliação de risco.",
    labels: SEVERITY_0_3_LABELS,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Carga depressiva em epilepsia (0-18)",
    bands: MENTAL_HEALTH_0_3_BANDS,
    domains: [
      { name: "Humor e prazer", color: "text-blue-600 dark:text-blue-400", items: ["Humor deprimido ou desesperanca", "Perda de interesse ou prazer", "Baixa autoestima ou culpa"] },
      { name: "Energia e funcionamento", color: "text-slate-600 dark:text-slate-400", items: ["Fadiga ou lentificação", "Dificuldade de concentração", "Prejuizo funcional por sintomas emocionais"] },
    ],
  },

  scas: {
    icon: ShieldAlert,
    gradient: "from-yellow-600 to-orange-700",
    instruction: "Pontue sintomas de ansiedade nas últimas semanas. Pode ser respondida por cuidador ou auto-relato conforme idade.",
    infoBox: "Registro estruturado por domínios da SCAS. Escore maior = maior carga ansiosa; use normas oficiais quando disponíveis.",
    labels: FREQUENCY_0_3_LABELS,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Carga de ansiedade por domínios (0-72)",
    bands: MENTAL_HEALTH_0_3_BANDS,
    domains: [
      { name: "Separação", color: "text-yellow-600 dark:text-yellow-400", items: ["Medo intenso de ficar longe dos cuidadores", "Preocupação de algo ruim acontecer aos pais", "Dificuldade de dormir longe/cuidador"] },
      { name: "Social", color: "text-orange-600 dark:text-orange-400", items: ["Medo de avaliação por outras pessoas", "Evita falar ou participar em grupo", "Vergonha intensa com pares/adultos"] },
      { name: "Panico/somático", color: "text-red-600 dark:text-red-400", items: ["Crises de medo com sintomas fisicos", "Palpitação/falta de ar/tremor por ansiedade", "Medo de perder controle durante sintomas"] },
      { name: "Generalizada", color: "text-amber-600 dark:text-amber-400", items: ["Preocupação excessiva com muitas coisas", "Dificuldade de controlar preocupação", "Tensão/irritabilidade por preocupação"] },
      { name: "Obsessivo-compulsivo", color: "text-purple-600 dark:text-purple-400", items: ["Pensamentos repetitivos indesejados", "Rituais ou checagens para aliviar ansiedade", "Sofrimento se impedido de fazer ritual"] },
      { name: "Medo de dano", color: "text-lime-600 dark:text-lime-400", items: ["Medo intenso de escuro/animais/altura", "Evita situações por medo específico", "Ansiedade antecipatória antes da exposição"] },
    ],
  },

  rcads: {
    icon: ShieldAlert,
    gradient: "from-cyan-700 to-blue-800",
    instruction: "Pontue sintomas de ansiedade e humor nas últimas semanas. Use como triagem dimensional e correlacione com entrevista clínica.",
    infoBox: "Registro estruturado por domínios da RCADS. Escore maior = maior carga de sintomas; interpretação normativa exige escore padronizado quando aplicável.",
    labels: FREQUENCY_0_3_LABELS,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Carga ansiedade/depressão RCADS (0-90)",
    bands: MENTAL_HEALTH_0_3_BANDS,
    domains: [
      { name: "Ansiedade de separação", color: "text-cyan-600 dark:text-cyan-400", items: ["Sofrimento ao separar-se de cuidadores", "Medo de perder ou algo acontecer aos cuidadores", "Evita dormir/sair sem cuidador", "Preocupação antes de separações", "Busca checagem/reasseguramento"] },
      { name: "Ansiedade social", color: "text-blue-600 dark:text-blue-400", items: ["Medo de parecer inadequado", "Evita desempenho público", "Ansiedade com pessoas novas", "Medo de ser ridicularizado", "Dificuldade de participar em sala/grupo"] },
      { name: "Ansiedade generalizada", color: "text-amber-600 dark:text-amber-400", items: ["Preocupações excessivas", "Tensão por desempenho/escola", "Necessidade frequente de reasseguramento", "Dificuldade de relaxar", "Irritabilidade ligada a preocupação"] },
      { name: "Panico/somático", color: "text-red-600 dark:text-red-400", items: ["Medo abrupto intenso", "Sintomas fisicos de ansiedade", "Medo de nova crise", "Evita locais por medo de sintomas", "Procura fuga/segurança durante sintomas"] },
      { name: "TOC", color: "text-purple-600 dark:text-purple-400", items: ["Pensamentos repetitivos intrusivos", "Rituais/checagens", "Tempo gasto com repetições", "Sofrimento se interrompido", "Impacto em rotina por obsessão/compulsão"] },
      { name: "Humor depressivo", color: "text-slate-600 dark:text-slate-400", items: ["Tristeza ou vazio", "Perda de interesse", "Culpa/baixa autoestima", "Fadiga ou lentificação", "Prejuizo escolar/social por humor"] },
    ],
  },

  "fas-pr": {
    icon: Heart,
    gradient: "from-rose-700 to-purple-800",
    instruction: "Pontue o quanto a família modifica a rotina para acomodar sintomas obsessivo-compulsivos da criança/adolescente.",
    infoBox: "Registro estruturado FAS-PR no app. Escore maior = maior acomodação familiar; use para planejamento terapêutico.",
    labels: FREQUENCY_0_3_LABELS,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Acomodação familiar ao TOC (0-36)",
    bands: MENTAL_HEALTH_0_3_BANDS,
    domains: [
      { name: "Participação familiar", color: "text-rose-600 dark:text-rose-400", items: ["Participa de rituais/checagens", "Fornece reasseguramento repetitivo", "Ajuda a evitar gatilhos", "Repete respostas ou ações para reduzir ansiedade"] },
      { name: "Modificação de rotina", color: "text-purple-600 dark:text-purple-400", items: ["Altera horários ou trajetos por sintomas", "Evita locais/atividades familiares", "Muda regras domésticas para prevenir crise", "Interrompe escola/trabalho/família por rituais"] },
      { name: "Impacto e sofrimento", color: "text-fuchsia-600 dark:text-fuchsia-400", items: ["Conflitos familiares por acomodação", "Sofrimento do cuidador", "Prejuizo em autonomia da criança", "Dificuldade de reduzir acomodações"] },
    ],
  },

  engel: {
    icon: Activity,
    gradient: "from-violet-600 to-indigo-700",
    instruction: "Selecione a classe que melhor descreve o desfecho atual das crises. Use junto ao diário de crises e ao julgamento neurológico.",
    infoBox: "Classificação de desfecho em epilepsia. Escore maior = pior classe funcional. Não substitui revisão especializada.",
    labels: ["Classe I - livre de crises incapacitantes", "Classe II - crises raras / quase livre", "Classe III - melhora relevante, mas crises persistem", "Classe IV - sem melhora útil"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Classe Engel (0=I, 3=IV)",
    bands: ENGEL_BANDS,
    domains: [{ name: "Desfecho de crises", color: "text-violet-600 dark:text-violet-400", items: ["Classe de desfecho atual"] }],
  },

  bears: {
    icon: Moon,
    gradient: "from-indigo-600 to-slate-900",
    instruction: "Marque a melhor descrição para cada área do sono nos últimos 14 dias. Se houver ronco importante, pausas respiratórias ou sonolência intensa, priorize avaliação clínica.",
    infoBox: "BEARS e uma triagem rápida de sono. Escore maior = mais problemas relatados; interprete por domínio.",
    labels: ABSENT_MILD_CLEAR_LABELS,
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Sinais de problemas do sono (0-10)",
    bands: HIGHER_WORSE_0_2_BANDS,
    domains: [{ name: "BEARS", color: "text-indigo-600 dark:text-indigo-400", items: ["B - Dificuldade para iniciar o sono ou resistência para dormir", "E - Sonolência diurna excessiva", "A - Despertares noturnos frequentes ou prolongados", "R - Rotina/regularidade de sono inadequada", "S - Ronco, respiração ruidosa ou suspeita de apneia"] }],
  },

  flacc: {
    icon: Heart,
    gradient: "from-rose-600 to-red-700",
    instruction: "Observe a criança em repouso ou durante o cuidado e pontue cada domínio de 0 a 2. Escore total maior indica mais dor/desconforto.",
    infoBox: "FLACC: Face, Legs, Activity, Cry, Consolability. Triagem observacional de dor; correlacione com exame e contexto.",
    labels: PAIN_0_2_LABELS,
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Escore FLACC (0-10)",
    bands: HIGHER_WORSE_0_2_BANDS,
    domains: [{ name: "Dor observacional", color: "text-rose-600 dark:text-rose-400", items: ["Face", "Pernas", "Atividade corporal", "Choro/vocalização", "Consolabilidade"] }],
  },

  rflacc: {
    icon: Heart,
    gradient: "from-red-600 to-rose-800",
    instruction: "Use os comportamentos basais da criança como referência e pontue mudancas de face, pernas, atividade, choro/vocalização e consolabilidade.",
    infoBox: "r-FLACC adapta a observação de dor para crianças com deficiência ou comunicação limitada. Escore maior = mais dor/desconforto.",
    labels: PAIN_0_2_LABELS,
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Escore r-FLACC (0-10)",
    bands: HIGHER_WORSE_0_2_BANDS,
    domains: [{ name: "Dor observacional adaptada", color: "text-red-600 dark:text-red-400", items: ["Face em relação ao basal", "Pernas ou postura em relação ao basal", "Atividade/movimento em relação ao basal", "Choro, gemido ou vocalização atípica", "Consolabilidade ou resposta ao cuidador"] }],
  },

  "comfort-b": {
    icon: Heart,
    gradient: "from-orange-600 to-red-700",
    instruction: "Observe o paciente por um período curto e pontue cada comportamento de 1 a 5. Escore maior indica mais desconforto/dor comportamental.",
    infoBox: "COMFORT-B e observacional, muito útil em paciente não verbal/UTI. Interprete junto a sinais vitais, sedação e contexto clínico.",
    labels: COMFORT_1_5_LABELS,
    optionPoints: [1, 2, 3, 4, 5],
    scoreDirection: "higher_worse",
    totalLabel: "Escore COMFORT-B (6-30)",
    bands: COMFORT_B_BANDS,
    domains: [{ name: "Comportamento observado", color: "text-orange-600 dark:text-orange-400", items: ["Alerta/estado de vigilia", "Calma ou agitação", "Resposta respiratória/choro", "Movimento corporal", "Tensão facial", "Tônus muscular"] }],
  },

  bars: {
    icon: Pill,
    gradient: "from-amber-600 to-orange-700",
    instruction: "Pontue sinais objetivos e subjetivos de acatisia observados/relatados no atendimento atual.",
    infoBox: "BARS monitora acatisia, especialmente em uso de antipsicóticos. Escore maior = maior suspeita/gravidade; avalie urgência conforme sofrimento.",
    labels: SEVERITY_0_3_LABELS,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Carga de acatisia (0-12)",
    bands: MED_SIDE_EFFECT_BANDS,
    domains: [{ name: "Acatisia", color: "text-amber-600 dark:text-amber-400", items: ["Movimentos inquietos observáveis", "Sensação subjetiva de inquietude", "Sofrimento/desconforto associado", "Impressão clínica global de acatisia"] }],
  },

  uku: {
    icon: Pill,
    gradient: "from-slate-600 to-cyan-800",
    instruction: "Registre efeitos possivelmente associados a medicação nos últimos 7-14 dias. Escore maior = maior carga de efeitos; correlacione com dose, tempo de uso e exame.",
    infoBox: "Registro estruturado de efeitos colaterais por domínios da UKU. Não substitui avaliação medica nem a versão oficial quando ela for exigida.",
    labels: SEVERITY_0_3_LABELS,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Carga de efeitos colaterais (0-144)",
    bands: MED_SIDE_EFFECT_BANDS,
    domains: [
      { name: "Psiquicos", color: "text-sky-600 dark:text-sky-400", items: ["Sonolência/sedação", "Fadiga", "Dificuldade de concentração", "Alteração de memória", "Ansiedade/inquietação", "Humor deprimido", "Irritabilidade", "Insonia", "Sonhos vividos", "Apatia", "Tontura subjetiva", "Outro efeito psíquico"] },
      { name: "Neurológicos", color: "text-violet-600 dark:text-violet-400", items: ["Tremor", "Rigidez", "Acatisia", "Distonia", "Discinesia", "Marcha instável", "Parestesias", "Cefaleia", "Convulsão/piora de crise", "Lentificação motora", "Alteração de fala/deglutição", "Outro efeito neurológico"] },
      { name: "Autonomicos", color: "text-teal-600 dark:text-teal-400", items: ["Boca seca", "Sialorreia", "Nausea/vomitos", "Constipação", "Diarreia", "Sudorese", "Palpitações", "Hipotensão/tontura postural", "Retenção urinária", "Alteração visual", "Aumento de apetite", "Outro efeito autonômico"] },
      { name: "Outros", color: "text-slate-600 dark:text-slate-400", items: ["Ganho de peso", "Perda de peso", "Alteração de libido/puberdade", "Alteração menstrual/prolactina", "Erupção cutânea", "Prurido", "Edema", "Dor abdominal", "Febre/mal-estar", "Alteração laboratorial conhecida", "Queda ou acidente relacionado", "Outro efeito relevante"] },
    ],
  },

  // ---- J26-001 — Motor grosso 0-6 meses ----
  "j26-001": {
    icon: Baby,
    gradient: "from-amber-500 to-orange-600",
    instruction: DEV_INSTRUCTION,
    infoBox: DEV_INFO,
    labels: MILESTONE_LABELS,
    totalLabel: "Marcos motores 0–6 meses",
    bands: DEV_BANDS,
    domains: [
      {
        name: "Motor grosso 0–6 meses",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "De bruços, levanta o queixo e vira a cabeça para o lado",
          "De bruços, sustenta a cabeça a ~45° apoiado nos antebraços",
          "Quando puxado para sentar, a cabeça acompanha o tronco (não cai para trás)",
          "Sustenta a cabeça firme e estável quando no colo, na vertical",
          "De bruços, eleva o tronco com os braços esticados",
          "Junta as duas mãos na linha média (sobre o peito)",
          "Leva as mãos ou objetos à boca",
          "Rola da barriga para as costas",
          "Rola das costas para a barriga",
          "Senta com apoio mantendo as costas eretas por alguns instantes",
          "Segurado em pé, suporta parte do peso nas pernas",
          "Estende os braços para alcançar um objeto à frente",
        ],
      },
    ],
  },

  // ---- J26-002 — Motor grosso 6-12 meses ----
  "j26-002": {
    icon: Activity,
    gradient: "from-amber-500 to-orange-600",
    instruction: DEV_INSTRUCTION,
    infoBox: DEV_INFO,
    labels: MILESTONE_LABELS,
    totalLabel: "Marcos motores 6–12 meses",
    bands: DEV_BANDS,
    domains: [
      {
        name: "Motor grosso 6–12 meses",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Senta sem apoio por vários minutos, com as mãos livres",
          "Passa de deitado para sentado sozinho",
          "Arrasta-se ou rasteja pelo chão",
          "Engatinha apoiado em mãos e joelhos",
          "Puxa-se para ficar de pé apoiando em móveis",
          "Fica de pé segurando com as duas mãos",
          "Anda de lado apoiado nos móveis (marcha lateral)",
          "Fica de pé sozinho por alguns segundos",
          "Abaixa-se e levanta-se segurando em um apoio",
          "Dá passos segurando em uma das mãos do adulto",
          "Dá os primeiros passos sozinho",
          "Mantém o equilíbrio sentado quando empurrado de leve",
          "Gira o tronco sentado para pegar um objeto ao lado",
          "Sustenta o peso firme nas pernas quando segurado em pé",
        ],
      },
    ],
  },

  // ---- J26-003 — Linguagem 0-24 meses ----
  "j26-003": {
    icon: MessageCircle,
    gradient: "from-blue-500 to-indigo-600",
    instruction: DEV_INSTRUCTION,
    infoBox: DEV_INFO,
    labels: MILESTONE_LABELS,
    totalLabel: "Marcos de linguagem 0–24 meses",
    bands: DEV_BANDS,
    domains: [
      {
        name: "Linguagem receptiva e expressiva 0–24 meses",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Reage a sons altos (assusta, pisca ou se aquieta)",
          "Acalma-se ou presta atenção ao ouvir a voz da mãe/pai",
          "Vira a cabeça em direção a um som ou voz",
          "Balbucia sons repetidos (“agu”, “ba-ba”, “da-da”)",
          "Ri alto e faz sons para chamar atenção",
          "Responde ao próprio nome virando-se",
          "Entende “não” e para por um instante",
          "Imita sons ou sílabas que você faz",
          "Fala a primeira palavra com sentido (“mamã”, “papá”, “dá”)",
          "Usa gestos como dar tchau, mandar beijo ou apontar",
          "Aponta para pedir ou mostrar algo",
          "Entende ordens simples sem gesto (“cadê a bola?”, “vem”)",
          "Fala 5 ou mais palavras com sentido",
          "Aponta partes do corpo ou figuras quando você nomeia",
          "Fala 10 a 20 palavras ou mais",
          "Junta duas palavrinhas (“quer água”, “cadê papá”)",
        ],
      },
    ],
  },

  // ---- J26-007 — Socioemocional 0-3 anos ----
  "j26-007": {
    icon: Heart,
    gradient: "from-pink-500 to-rose-600",
    instruction: DEV_INSTRUCTION,
    infoBox: DEV_INFO,
    labels: MILESTONE_LABELS,
    totalLabel: "Marcos socioemocionais 0–36 meses",
    bands: DEV_BANDS,
    domains: [
      {
        name: "Desenvolvimento socioemocional 0–3 anos",
        color: "text-pink-600 dark:text-pink-400",
        items: [
          "Olha nos seus olhos durante o cuidado e a mamada",
          "Sorri quando você sorri ou conversa com ele (sorriso social)",
          "Acalma-se no colo quando está aflito",
          "Demonstra prazer ao ver rostos conhecidos",
          "Ri alto e demonstra alegria nas brincadeiras",
          "Estranha pessoas desconhecidas",
          "Procura o cuidador quando está inseguro ou assustado",
          "Mostra apego a uma pessoa principal",
          "Imita expressões faciais (caretas, língua de fora)",
          "Brinca de “achou!” (esconde-esconde) com prazer",
          "Estende os braços pedindo colo",
          "Mostra objetos a você só para compartilhar interesse",
          "Demonstra afeto (abraça, dá beijo, encosta o rosto)",
          "Reage às emoções dos outros (preocupa-se se alguém chora)",
          "Brinca perto de outras crianças com interesse",
          "Busca aprovação ou mostra orgulho ao conseguir algo",
          "Começa a brincar de faz de conta (dar comida à boneca)",
          "Separa-se do cuidador sem crise intensa e prolongada",
        ],
      },
    ],
  },

  // ---- J26-008 — Motor fino 12-36 meses ----
  "j26-008": {
    icon: Hand,
    gradient: "from-teal-500 to-cyan-600",
    instruction: DEV_INSTRUCTION,
    infoBox: DEV_INFO,
    labels: MILESTONE_LABELS,
    totalLabel: "Marcos motor fino 12–36 meses",
    bands: DEV_BANDS,
    domains: [
      {
        name: "Motor fino 12–36 meses",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Faz pinça fina (polegar e indicador) para pegar objetos pequenos",
          "Bate dois objetos ou cubos um no outro",
          "Solta objetos voluntariamente (entrega na sua mão quando pedido)",
          "Empilha 2 cubos",
          "Empilha 3 a 4 cubos",
          "Coloca objetos pequenos dentro de um recipiente",
          "Vira páginas de um livro (mesmo várias de uma vez)",
          "Segura o lápis/giz e rabisca espontaneamente",
          "Empilha 6 ou mais cubos",
          "Imita um traço com direção no papel",
          "Imita uma linha vertical",
          "Encaixa formas simples num tabuleiro de encaixe",
          "Rosqueia ou desrosqueia uma tampa",
          "Come sozinho com a colher derramando pouco",
          "Faz torre de 8 cubos ou imita um círculo",
        ],
      },
    ],
  },

  // ---- J26-009 — Atenção conjunta 9-18 meses ----
  "j26-009": {
    icon: Sparkles,
    gradient: "from-violet-500 to-purple-600",
    instruction: DEV_INSTRUCTION,
    infoBox:
      "Atenção conjunta é uma das sementes da comunicação social. Ausência consistente destes marcos após 12–18 meses é sinal de alerta para encaminhamento. Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS,
    totalLabel: "Marcos de atenção conjunta 9–18 meses",
    bands: DEV_BANDS,
    domains: [
      {
        name: "Atenção conjunta e apontamento 9–18 meses",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Segue com o olhar quando você aponta para algo distante",
          "Olha na direção para onde você vira a cabeça ou os olhos",
          "Aponta com o dedo para PEDIR algo que quer",
          "Aponta com o dedo para MOSTRAR/compartilhar algo interessante",
          "Alterna o olhar entre você e o objeto de interesse",
          "Traz ou mostra objetos a você só para compartilhar",
          "Olha para o seu rosto para checar sua reação (referência social)",
          "Responde ao nome virando-se e olhando",
          "Imita gestos sociais (dar tchau, bater palma)",
          "Compartilha sorriso e alegria olhando para você na brincadeira",
          "Segue uma ordem simples acompanhada de gesto",
          "Busca o seu olhar para iniciar uma interação ou brincadeira",
        ],
      },
    ],
  },

  // ---- J26-013 — Triagem auditiva funcional 0-24 meses ----
  "j26-013": {
    icon: Ear,
    gradient: "from-cyan-500 to-blue-600",
    instruction: DEV_INSTRUCTION,
    infoBox:
      "Triagem comportamental da audição — não substitui a triagem auditiva neonatal (teste da orelhinha) nem a audiometria. Respostas ausentes indicam encaminhamento para avaliação auditiva formal.",
    labels: MILESTONE_LABELS,
    totalLabel: "Resposta auditiva funcional 0–24 meses",
    bands: DEV_BANDS,
    domains: [
      {
        name: "Função auditiva comportamental 0–24 meses",
        color: "text-cyan-600 dark:text-cyan-400",
        items: [
          "Assusta-se ou pisca com sons altos e inesperados",
          "Acalma-se ao ouvir a voz da mãe/pai",
          "Vira os olhos ou a cabeça procurando a origem do som",
          "Mexe-se ou acorda com barulhos altos durante o sono leve",
          "Reage à música (aquieta-se, anima-se ou balança)",
          "Vira-se em direção ao próprio nome quando chamado",
          "Entende e responde a “não” ou “tchau” pelo som",
          "Imita sons e sílabas que escuta",
          "Olha ou aponta o objeto certo quando você nomeia sem gesto",
          "Atende a pedidos simples só pela fala (sem você mostrar)",
        ],
      },
    ],
  },

  // ---- J26-014 — Triagem visual funcional 0-12 meses ----
  "j26-014": {
    icon: Eye,
    gradient: "from-indigo-500 to-blue-600",
    instruction: DEV_INSTRUCTION,
    infoBox:
      "Triagem comportamental da visão — não substitui o teste do olhinho (reflexo vermelho) nem a avaliação oftalmológica. Respostas ausentes indicam encaminhamento.",
    labels: MILESTONE_LABELS,
    totalLabel: "Resposta visual funcional 0–12 meses",
    bands: DEV_BANDS,
    domains: [
      {
        name: "Função visual comportamental 0–12 meses",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Fixa o olhar no rosto de quem o segura",
          "Segue um rosto ou objeto que se move lentamente na horizontal",
          "Segue um objeto na vertical e em círculo",
          "Olha para as próprias mãos e as explora visualmente",
          "Sorri ao ver o rosto da mãe/pai a alguma distância",
          "Procura com os olhos a origem de um som",
          "Alcança com precisão um objeto que vê (coordenação olho-mão)",
          "Olha para objetos pequenos (migalha, pequeno brinquedo)",
          "Reconhece visualmente o peito/mamadeira e se anima",
          "Acompanha com o olhar objetos que caem ou se afastam",
          "Mantém contato visual durante a interação",
          "Reage a expressões faciais (responde a sorriso ou careta)",
        ],
      },
    ],
  },

  // ---- J26-015 — Autonomia e autocuidado 2-5 anos ----
  "j26-015": {
    icon: Sparkles,
    gradient: "from-emerald-500 to-green-600",
    instruction: DEV_INSTRUCTION,
    infoBox: DEV_INFO,
    labels: MILESTONE_LABELS,
    totalLabel: "Autonomia e autocuidado 2–5 anos",
    bands: DEV_BANDS,
    domains: [
      {
        name: "Autonomia e autocuidado 2–5 anos",
        color: "text-emerald-600 dark:text-emerald-400",
        items: [
          "Come sozinho com a colher sem derramar muito",
          "Bebe no copo sozinho sem entornar",
          "Usa o garfo para se alimentar",
          "Tira peças simples de roupa (meia, sapato, casaco aberto)",
          "Veste peças simples (calça, blusa) com pouca ajuda",
          "Lava e seca as mãos sozinho",
          "Escova os dentes com supervisão",
          "Avisa quando está com vontade de fazer xixi ou cocô",
          "Usa o penico ou o vaso com ajuda",
          "Fica seco durante o dia (controle do xixi)",
          "Tenta calçar os sapatos (mesmo no pé trocado)",
          "Abre e fecha fechos simples (velcro, zíper grande)",
          "Guarda os brinquedos quando pedido",
          "Ajuda em tarefas simples de casa",
          "Esfrega o corpo no banho com supervisão",
          "Assoa o nariz com ajuda",
          "Come uma refeição completa sozinho",
          "Veste-se quase sozinho",
        ],
      },
    ],
  },

  // ============================================================
  // LOTE 2 — Categoria 2: Espectro Autista Expandido (autoral)
  // ============================================================

  // ---- J26-021 — Atenção Conjunta TEA (habilidade; maior = melhor) ----
  "j26-021": {
    icon: Sparkles,
    gradient: "from-pink-500 to-rose-600",
    instruction: DEV_INSTRUCTION,
    infoBox:
      "Atenção conjunta é central no diagnóstico precoce de TEA. Ausência consistente após 12–18 meses é sinal de alerta. Maior escore = mais habilidade. Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS,
    totalLabel: "Atenção conjunta (maior = mais habilidade)",
    bands: DEV_BANDS,
    domains: [
      {
        name: "Atenção compartilhada",
        color: "text-pink-600 dark:text-pink-400",
        items: [
          "Segue o olhar ou o apontar do adulto para um objeto distante",
          "Aponta com o dedo para PEDIR algo que quer",
          "Aponta com o dedo para MOSTRAR/compartilhar (apontar declarativo)",
          "Mostra ou traz objetos ao adulto só para compartilhar interesse",
          "Alterna o olhar entre o objeto e o rosto do adulto",
          "Olha para o rosto do adulto para checar a reação (referência social)",
          "Responde ao próprio nome olhando",
          "Compartilha sorriso e alegria olhando para o adulto",
          "Imita gestos sociais (tchau, palmas, mandar beijo)",
          "Inicia momentos de atenção compartilhada (mostrar um livro, brincar junto)",
          "Segue uma ordem simples acompanhada de gesto",
          "Busca o olhar do adulto para iniciar uma interação",
        ],
      },
    ],
  },

  // ---- J26-022 — Teoria da Mente TEA (habilidade; maior = melhor) ----
  "j26-022": {
    icon: Sparkles,
    gradient: "from-cyan-500 to-blue-600",
    instruction: DEV_INSTRUCTION,
    infoBox:
      "Avalia a compreensão de estados mentais do outro (maior escore = mais habilidade). Explica parte da dificuldade social no TEA. Triagem clínica, não diagnóstico.",
    labels: MILESTONE_LABELS,
    totalLabel: "Teoria da mente (maior = mais habilidade)",
    bands: DEV_BANDS,
    domains: [
      {
        name: "Compreensão de estados mentais",
        color: "text-cyan-600 dark:text-cyan-400",
        items: [
          "Reconhece emoções básicas em rostos (alegre, triste, bravo, com medo)",
          "Nomeia como ela mesma está se sentindo",
          "Entende que outra pessoa pode querer algo diferente do que ela quer",
          "Entende que alguém pode não saber de algo que ela sabe",
          "Passa em tarefa de falsa crença de 1ª ordem (“onde ele vai procurar?”)",
          "Entende que as pessoas agem conforme acreditam, mesmo quando estão erradas",
          "Percebe quando alguém está brincando, mentindo ou sendo irônico",
          "Entende uma piada ou expressão figurada simples",
          "Ajusta o que fala conforme o que o ouvinte já sabe",
          "Demonstra empatia — preocupa-se quando alguém se machuca ou chora",
          "Prevê como o outro vai reagir a uma situação",
          "Entende falsa crença de 2ª ordem (“o que ele acha que ela pensa?”)",
        ],
      },
    ],
  },

  // ---- J26-026 — Habilidades de Brincar TEA (habilidade; maior = melhor) ----
  "j26-026": {
    icon: Sparkles,
    gradient: "from-teal-500 to-cyan-600",
    instruction: DEV_INSTRUCTION,
    infoBox:
      "O brincar é uma janela do desenvolvimento social e simbólico. Maior escore = brincar mais elaborado e social. Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS,
    totalLabel: "Habilidades de brincar (maior = mais elaborado)",
    bands: DEV_BANDS,
    domains: [
      {
        name: "Desenvolvimento do brincar",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Explora os brinquedos de forma variada (não só leva à boca ou joga)",
          "Usa os objetos pela função (empurra o carrinho, alimenta a boneca)",
          "Brinca de faz de conta simples (fingir comer, falar ao telefone)",
          "Cria histórias ou cenários no faz de conta",
          "Usa um objeto representando outro (banana vira telefone)",
          "Brinca de forma sequenciada (encadeia ações com sentido)",
          "Aceita que o adulto entre na brincadeira e a modifique",
          "Brinca ao lado de outras crianças (jogo paralelo)",
          "Brinca junto com outras crianças (jogo cooperativo)",
          "Respeita a vez nos jogos de turnos",
          "Imita brincadeiras que viu outras crianças fazendo",
          "Demonstra prazer e flexibilidade ao brincar (não fica preso a um único padrão)",
        ],
      },
    ],
  },

  // ---- J26-020 — Linguagem Pragmática TEA (habilidade; maior = melhor) ----
  "j26-020": {
    icon: MessageCircle,
    gradient: "from-sky-500 to-blue-600",
    instruction: DEV_INSTRUCTION,
    infoBox:
      "Avalia o USO social da linguagem (funções comunicativas), além da forma da fala. Maior escore = comunicação mais funcional. Triagem clínica, não diagnóstico.",
    labels: MILESTONE_LABELS,
    totalLabel: "Linguagem pragmática (maior = mais funcional)",
    bands: DEV_BANDS,
    domains: [
      {
        name: "Funções e uso social da linguagem",
        color: "text-sky-600 dark:text-sky-400",
        items: [
          "Usa a linguagem para PEDIR o que quer",
          "Usa a linguagem para COMENTAR e compartilhar (não só para pedir)",
          "Faz perguntas para obter informação",
          "Responde a perguntas de forma pertinente (no assunto)",
          "Inicia uma conversa espontaneamente",
          "Mantém o tema da conversa por várias trocas",
          "Respeita a vez de falar (não monopoliza nem interrompe sempre)",
          "Repara a comunicação quando não é entendida (tenta de novo de outro jeito)",
          "Ajusta a fala ao interlocutor (fala diferente com um bebê e com um adulto)",
          "Usa e entende gestos, expressão facial e tom junto com a fala",
          "Entende linguagem não-literal simples (ironia, expressões, piadas)",
          "Usa saudações e fórmulas sociais (oi, tchau, obrigado) no momento certo",
          "Conta um acontecimento de forma que o ouvinte acompanhe (narrativa)",
          "Percebe e responde às pistas do ouvinte (interesse, tédio, dúvida)",
        ],
      },
    ],
  },

  // ---- J26-027 — Necessidades de Comunicação Alternativa (CAA) ----
  "j26-027": {
    icon: MessageCircle,
    gradient: "from-teal-500 to-emerald-600",
    instruction: DEV_INSTRUCTION,
    infoBox:
      "Avalia as habilidades comunicativas atuais (maior escore = mais recursos próprios). Quanto MENOR o escore, maior a necessidade e o benefício de CAA (figuras/PECS, prancha, tablet). Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS,
    totalLabel: "Recursos comunicativos atuais (menor = mais necessidade de CAA)",
    bands: DEV_BANDS,
    domains: [
      {
        name: "Intenção e funções comunicativas atuais",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Demonstra intenção de se comunicar (mesmo sem fala)",
          "Usa o olhar dirigido para se comunicar",
          "Usa gestos para pedir ou recusar",
          "Aponta para pedir ou para mostrar",
          "Leva o adulto pela mão até o que quer",
          "Entende ordens simples faladas",
          "Entende figuras ou fotos de objetos e ações",
          "Faz escolhas quando lhe mostram duas opções",
          "Usa sons, palavras ou aproximações para se comunicar",
          "Comunica diferentes funções (pedir, recusar, comentar, cumprimentar)",
          "Responde quando alguém tenta se comunicar com ela",
          "Usa ou aceitaria recursos visuais (figuras, prancha, tablet) para se expressar",
        ],
      },
    ],
  },

  // ---- J26-030 — Evolução Clínica TEA (funcionamento atual; multidomínio) ----
  "j26-030": {
    icon: Activity,
    gradient: "from-emerald-500 to-teal-600",
    instruction:
      "Para cada item, marque como está a criança HOJE. Aplique a cada ~3 meses e compare com a avaliação anterior para acompanhar a evolução nas terapias. Responda todos os itens.",
    infoBox:
      "Monitorização da evolução (maior escore = melhor funcionamento atual). Compare o escore ao longo do tempo para ver a resposta às terapias. Não é diagnóstico.",
    labels: MILESTONE_LABELS,
    totalLabel: "Funcionamento atual (maior = melhor)",
    bands: DEV_BANDS,
    domains: [
      {
        name: "Comunicação",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Comunica o que quer de forma clara",
          "Usa mais palavras ou frases do que antes",
          "Responde quando falam com ela",
          "Inicia comunicação espontaneamente",
          "Entende o que lhe é pedido",
        ],
      },
      {
        name: "Social",
        color: "text-pink-600 dark:text-pink-400",
        items: [
          "Busca e aceita interação com outras pessoas",
          "Brinca ou convive melhor com outras crianças",
          "Faz contato visual e compartilha atenção",
          "Demonstra afeto e reciprocidade",
          "Tolera melhor estar em grupo",
        ],
      },
      {
        name: "Comportamento",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Tem menos crises de comportamento",
          "Lida melhor com mudanças e frustrações",
          "Reduziu comportamentos repetitivos prejudiciais",
          "Regula melhor as emoções",
          "Dorme e se alimenta melhor",
        ],
      },
      {
        name: "Autonomia",
        color: "text-emerald-600 dark:text-emerald-400",
        items: [
          "Faz mais tarefas de autocuidado sozinha",
          "Participa melhor da rotina da casa",
          "Acompanha melhor a rotina escolar",
          "Generaliza para casa/escola o que aprende nas terapias",
          "Ganhou mais independência desde a última avaliação",
        ],
      },
    ],
  },

  // ============================================================
  // LOTE 3 — Categoria 3: TDAH e Funções Executivas (autoral)
  // ============================================================

  // ============================================================
  // LOTE 4 — Categoria 4: Comportamento e Conduta (autoral)
  // ============================================================

  // ---- J26-051 — Flexibilidade Comportamental (habilidade; maior = melhor) ----
  "j26-051": {
    icon: Sparkles,
    gradient: "from-teal-500 to-cyan-600",
    instruction: DEV_INSTRUCTION,
    infoBox:
      "Avalia a flexibilidade adaptativa no cotidiano (maior escore = mais flexível). A rigidez aparece no TDAH, no TEA e nos quadros de oposição. Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS,
    totalLabel: "Flexibilidade comportamental (maior = mais flexível)",
    bands: DEV_BANDS,
    domains: [
      {
        name: "Flexibilidade adaptativa",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Aceita mudanças de rotina sem grande sofrimento",
          "Muda de plano quando é necessário",
          "Aceita quando as regras mudam",
          "Lida bem quando o resultado não é o esperado",
          "Aceita ajuda ou sugestões para fazer diferente",
          "Transita entre atividades sem travar",
          "Tolera os imprevistos do dia a dia",
          "Aceita perder ou empatar em jogos",
          "Considera mais de uma forma de resolver um problema",
          "Aceita um “agora não” e tenta de novo depois",
          "Adapta-se a ambientes e pessoas novas",
          "Recupera-se rápido quando algo dá errado",
        ],
      },
    ],
  },

  // ============================================================
  // LOTE 5 — Categoria 5: Ansiedade Infantil (autoral)
  // ============================================================

  // ============================================================
  // LOTE 6 — Categoria 6: Depressão e Humor (autoral)
  // (J26-072 — Diário de Humor — segue como ferramenta diária, não escala)
  // ============================================================

  // ============================================================
  // LOTE 7 — Categoria 7: Linguagem e Comunicação (autoral)
  // ============================================================

  // ---- J26-082 — Linguagem Pragmática Escolar (habilidade) ----
  "j26-082": {
    icon: MessageCircle, gradient: "from-sky-500 to-blue-600",
    instruction: DEV_INSTRUCTION,
    infoBox: "Avalia o uso social da linguagem na escola (maior escore = mais funcional). Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Pragmática escolar (maior = mais funcional)", bands: DEV_BANDS,
    domains: [{ name: "Uso social da linguagem na escola", color: "text-sky-600 dark:text-sky-400", items: [
      "Pede ajuda ao professor quando precisa",
      "Faz e responde perguntas de forma pertinente",
      "Mantém o tema numa conversa",
      "Espera a vez de falar e não interrompe sempre",
      "Entende piadas e brincadeiras dos colegas",
      "Interpreta expressões e sentido figurado simples",
      "Ajusta a fala ao contexto (professor × colega)",
      "Usa cumprimentos e fórmulas sociais adequadas",
      "Repara a comunicação quando não é entendido",
      "Entende instruções dadas ao grupo",
      "Participa de trocas conversacionais com os colegas",
      "Percebe as pistas sociais do interlocutor (interesse, tédio)",
    ]}],
  },

  // ---- J26-083 — Narrativa Oral (habilidade) ----
  "j26-083": {
    icon: MessageCircle, gradient: "from-blue-500 to-indigo-600",
    instruction: DEV_INSTRUCTION,
    infoBox: "Avalia as habilidades narrativas orais (maior escore = narrativa mais elaborada). Sensível para linguagem e cognição. Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Narrativa oral (maior = mais elaborada)", bands: DEV_BANDS,
    domains: [{ name: "Habilidades narrativas", color: "text-blue-600 dark:text-blue-400", items: [
      "Conta um acontecimento com início, meio e fim",
      "Inclui personagens na história",
      "Mantém a sequência temporal (o que veio antes e depois)",
      "Estabelece relações de causa e efeito",
      "Usa conectivos (aí, então, porque, mas)",
      "Mantém o tema sem se perder",
      "Dá detalhes suficientes para o ouvinte entender",
      "Usa vocabulário adequado para narrar",
      "Marca quem fala (discurso direto ou indireto)",
      "Conclui a história de forma coerente",
      "Reconta uma história ouvida mantendo o sentido",
      "A narrativa é compreensível para quem ouve",
    ]}],
  },

  // ---- J26-084 — Consciência Fonológica (habilidade) ----
  "j26-084": {
    icon: Ear, gradient: "from-violet-500 to-purple-600",
    instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a consciência fonológica em níveis progressivos (maior escore = mais habilidade). Base para o risco de dislexia. Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Consciência fonológica (maior = mais habilidade)", bands: DEV_BANDS,
    domains: [{ name: "Habilidades fonológicas", color: "text-violet-600 dark:text-violet-400", items: [
      "Reconhece e produz rimas",
      "Identifica palavras que começam com o mesmo som (aliteração)",
      "Separa a palavra em sílabas (batendo palmas)",
      "Conta o número de sílabas de uma palavra",
      "Junta sílabas para formar a palavra (síntese silábica)",
      "Identifica o primeiro som (fonema) da palavra",
      "Identifica o último som da palavra",
      "Separa a palavra em sons (segmentação fonêmica)",
      "Junta sons para formar a palavra (síntese fonêmica)",
      "Tira um som e diz o que sobra (manipulação)",
      "Troca um som por outro",
      "Identifica sons iguais ou diferentes entre palavras",
    ]}],
  },

  // ---- J26-085 — Vocabulário em Profundidade (habilidade) ----
  "j26-085": {
    icon: MessageCircle, gradient: "from-teal-500 to-cyan-600",
    instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a profundidade do vocabulário, além do nomear (maior escore = mais rico). Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Vocabulário em profundidade (maior = mais rico)", bands: DEV_BANDS,
    domains: [{ name: "Profundidade lexical", color: "text-teal-600 dark:text-teal-400", items: [
      "Explica o significado de palavras comuns",
      "Dá sinônimos de palavras",
      "Dá antônimos de palavras",
      "Agrupa palavras por categoria (frutas, animais)",
      "Entende que uma palavra pode ter vários sentidos",
      "Usa as palavras de forma precisa ao se expressar",
      "Entende palavras menos frequentes para a idade",
      "Relaciona palavras de um mesmo campo semântico",
      "Usa palavras novas que aprende",
      "Entende definições e adivinhas",
      "Percebe diferenças sutis entre palavras parecidas",
      "Tem vocabulário compatível com a idade",
    ]}],
  },

  // ---- J26-086 — Fluência Verbal (habilidade) ----
  "j26-086": {
    icon: Sparkles, gradient: "from-amber-500 to-orange-600",
    instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a fluência verbal semântica e fonológica (maior escore = mais fluente). Sensível para acesso lexical e funções executivas. Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Fluência verbal (maior = mais fluente)", bands: DEV_BANDS,
    domains: [{ name: "Acesso lexical e fluência", color: "text-amber-600 dark:text-amber-400", items: [
      "Diz muitos animais em pouco tempo (fluência semântica)",
      "Diz muitas palavras de uma categoria sem repetir",
      "Diz palavras que começam com um som dado (fluência fonológica)",
      "Acessa as palavras com rapidez (sem ficar “travando”)",
      "Organiza a busca por subgrupos (animais da fazenda, do mar)",
      "Evita repetir palavras já ditas",
      "Mantém o critério pedido (categoria ou letra)",
      "Não foge da tarefa proposta",
      "Recupera palavras menos comuns",
      "Tem ritmo de produção compatível com a idade",
      "Corrige-se quando foge do critério",
      "A quantidade de palavras é adequada para a idade",
    ]}],
  },

  // ---- J26-089 — Necessidades de CAA (habilidade comunicativa) ----
  "j26-089": {
    icon: MessageCircle, gradient: "from-teal-500 to-emerald-600",
    instruction: DEV_INSTRUCTION,
    infoBox: "Avalia as habilidades para uso de CAA (maior escore = mais recursos próprios; MENOR escore = maior necessidade e benefício de prancha/PECS/tablet). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Recursos para CAA (menor = mais necessidade)", bands: DEV_BANDS,
    domains: [{ name: "Comunicação e pré-requisitos para CAA", color: "text-teal-600 dark:text-teal-400", items: [
      "Demonstra intenção de se comunicar",
      "Usa o olhar dirigido para se comunicar",
      "Usa gestos para pedir ou recusar",
      "Aponta para pedir ou mostrar",
      "Entende ordens simples faladas",
      "Entende figuras ou fotos",
      "Faz escolhas entre opções apresentadas",
      "Usa sons, palavras ou aproximações",
      "Tem controle motor para apontar ou tocar (prancha/tablet)",
      "Responde quando alguém se comunica com ela",
      "Comunica diferentes funções (pedir, recusar, comentar)",
      "Aceita e se interessa por recursos visuais de comunicação",
    ]}],
  },

  // ---- J26-090 — Compreensão Oral Complexa (habilidade) ----
  "j26-090": {
    icon: Ear, gradient: "from-blue-500 to-indigo-600",
    instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a compreensão de linguagem oral complexa (maior escore = mais habilidade). Essencial antes de concluir sobre dificuldade de leitura. Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Compreensão oral complexa (maior = mais habilidade)", bands: DEV_BANDS,
    domains: [{ name: "Compreensão oral", color: "text-blue-600 dark:text-blue-400", items: [
      "Entende frases longas e compostas",
      "Segue instruções com 2-3 passos",
      "Entende instruções com conceitos (antes/depois, se/então)",
      "Faz inferências (deduz o que não foi dito)",
      "Entende perguntas de “por que” e “como”",
      "Entende metáforas e sentido figurado simples",
      "Entende ironia e duplo sentido (conforme a idade)",
      "Acompanha uma história ouvida e responde sobre ela",
      "Entende relações de causa e efeito no que ouve",
      "Reconta o que entendeu mantendo o sentido",
      "Identifica a ideia principal de um texto ouvido",
      "Compreende vocabulário compatível com a idade",
    ]}],
  },

  // ---- J26-091 — Triagem de Linguagem 18-36 meses (marcos) ----
  "j26-091": {
    icon: Baby, gradient: "from-blue-500 to-indigo-600",
    instruction: DEV_INSTRUCTION,
    infoBox: "Triagem rápida de atraso de linguagem entre 18 e 36 meses (maior escore = mais marcos). Escore baixo indica encaminhamento à fonoaudiologia. Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Marcos de linguagem 18–36 meses", bands: DEV_BANDS,
    domains: [{ name: "Linguagem 18–36 meses", color: "text-blue-600 dark:text-blue-400", items: [
      "Fala pelo menos 10 a 20 palavras com sentido",
      "Aponta para pedir ou mostrar",
      "Entende ordens simples sem gesto",
      "Aponta partes do corpo ou figuras quando são nomeadas",
      "Junta duas palavras (“quer água”)",
      "Responde ao nome",
      "Imita palavras que ouve",
      "Nomeia objetos e pessoas familiares",
      "Usa palavras para pedir o que quer",
      "Entende perguntas simples (“cadê?”)",
    ]}],
  },

  // ---- J26-092 — Discurso e Linguagem Acadêmica (habilidade) ----
  "j26-092": {
    icon: MessageCircle, gradient: "from-emerald-500 to-teal-600",
    instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a linguagem acadêmica em sala (maior escore = mais habilidade). Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Linguagem acadêmica (maior = mais habilidade)", bands: DEV_BANDS,
    domains: [{ name: "Discurso e linguagem escolar", color: "text-emerald-600 dark:text-emerald-400", items: [
      "Explica um procedimento ou como algo funciona",
      "Argumenta e defende uma opinião",
      "Descreve objetos, lugares ou pessoas com detalhes",
      "Relata acontecimentos de forma organizada",
      "Usa vocabulário acadêmico adequado",
      "Responde a perguntas abertas com elaboração",
      "Organiza as ideias de forma lógica",
      "Usa conectivos para ligar as ideias",
      "Adapta a linguagem à tarefa escolar",
      "Compreende e usa os termos de cada matéria",
      "Participa de discussões em sala",
      "Comunica o que aprendeu de forma clara",
    ]}],
  },

  // ---- J26-093 — Prosódia e Entonação (habilidade) ----
  "j26-093": {
    icon: MessageCircle, gradient: "from-pink-500 to-rose-600",
    instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a prosódia funcional (maior escore = mais típica/funcional). Alterações de prosódia são comuns no TEA. Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Prosódia funcional (maior = mais típica)", bands: DEV_BANDS,
    domains: [{ name: "Prosódia, entonação e ritmo", color: "text-pink-600 dark:text-pink-400", items: [
      "A fala tem entonação natural (sobe e desce)",
      "Demonstra emoção pela voz (alegria, dúvida, surpresa)",
      "Não soa monótona ou robótica",
      "Não soa “cantada” ou artificial demais",
      "Usa um ritmo de fala adequado (nem rápido, nem lento demais)",
      "Faz as pausas certas entre as ideias",
      "Dá ênfase às palavras importantes",
      "Ajusta o volume ao contexto",
      "A entonação combina com a intenção (pergunta, afirmação)",
      "Entende a emoção do outro pelo tom de voz",
      "Diferência pergunta de afirmação pela entonação",
      "A prosódia ajuda (e não atrapalha) a comunicação",
    ]}],
  },

  // ============================================================
  // LOTE 8 — Categoria 8: Aprendizagem e Escola (autoral)
  // ============================================================

  "j26-094": {
    icon: Eye, gradient: "from-emerald-500 to-teal-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a fluência de leitura oral — velocidade, precisão e compreensão (maior = melhor). Sensível para dislexia. Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Fluência de leitura (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Leitura oral", color: "text-emerald-600 dark:text-emerald-400", items: [
      "Lê palavras conhecidas com rapidez (sem soletrar)",
      "Lê com precisão (poucos erros)",
      "Lê palavras novas decodificando os sons",
      "Lê com ritmo e fluidez (não silabado)",
      "Respeita a pontuação ao ler",
      "Lê com entonação adequada",
      "Tem velocidade de leitura compatível com a série",
      "Não troca, omite ou inverte letras ao ler",
      "Reconhece palavras frequentes de imediato",
      "Entende o que leu (compreensão)",
      "Mantém o lugar na linha sem se perder",
      "Lê textos da série sem grande esforço",
    ]}],
  },

  "j26-097": {
    icon: Hand, gradient: "from-teal-500 to-cyan-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a expressão escrita e a caligrafia (maior = mais competente). Escore baixo sugere disgrafia — diferenciar de falta de prática. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Expressão escrita (maior = mais competente)", bands: DEV_BANDS,
    domains: [{ name: "Escrita e caligrafia", color: "text-teal-600 dark:text-teal-400", items: [
      "Tem letra legível",
      "Mantém o tamanho das letras uniforme",
      "Respeita a linha e as margens",
      "Tem espaçamento adequado entre as palavras",
      "Escreve com velocidade compatível com a série",
      "Forma as letras corretamente (traçado)",
      "Organiza o texto no espaço da folha",
      "Compõe frases completas e organizadas",
      "Organiza as ideias em parágrafos",
      "Usa pontuação ao escrever",
      "Escreve sem dor ou cansaço excessivo na mão",
      "Copia e produz texto sem esforço excessivo",
    ]}],
  },

  "j26-098": {
    icon: ClipboardList, gradient: "from-blue-500 to-indigo-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia as habilidades de estudo e organização (maior = melhor). Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Habilidades de estudo (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Estudo e organização", color: "text-blue-600 dark:text-blue-400", items: [
      "Organiza o material de estudo",
      "Tem um lugar e um horário para estudar",
      "Anota as tarefas e os prazos",
      "Faz resumos ou esquemas do conteúdo",
      "Revisa o que aprendeu",
      "Planeja a semana de provas",
      "Divide tarefas grandes em partes",
      "Estuda sem precisar de lembrete constante",
      "Identifica o que não entendeu e busca ajuda",
      "Administra o tempo durante as tarefas",
      "Mantém o foco enquanto estuda",
      "Usa estratégias para memorizar (associação, repetição)",
    ]}],
  },

  "j26-101": {
    icon: Sparkles, gradient: "from-cyan-500 to-blue-600", instruction: DEV_INSTRUCTION,
    infoBox: "Triagem dos componentes do raciocínio numérico (maior = mais habilidade; escore baixo sugere risco de discalculia). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Habilidades numéricas (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Raciocínio numérico", color: "text-cyan-600 dark:text-cyan-400", items: [
      "Conta objetos corretamente (contagem)",
      "Reconhece os números (símbolos)",
      "Compara quantidades (qual é maior ou menor)",
      "Entende o valor posicional (unidade, dezena)",
      "Faz somas simples",
      "Faz subtrações simples",
      "Sabe as operações básicas para a série",
      "Resolve problemas matemáticos simples",
      "Estima quantidades de forma razoável",
      "Memoriza fatos numéricos (tabuada básica)",
      "Entende conceitos de tempo, dinheiro e medida",
      "Acompanha a matemática da série sem grande dificuldade",
    ]}],
  },

  "j26-102": {
    icon: Hand, gradient: "from-indigo-500 to-blue-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a cópia e o ditado, mapeando onde a criança trava — motor, fonológico ou ortográfico (maior = melhor). Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Cópia e ditado (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Cópia e ditado", color: "text-indigo-600 dark:text-indigo-400", items: [
      "Copia do quadro sem omitir partes",
      "Copia com velocidade compatível com a turma",
      "Copia sem trocar ou inverter letras",
      "Mantém a organização ao copiar (alinhamento)",
      "Escreve corretamente palavras ditadas",
      "Escreve frases ditadas mantendo o sentido",
      "Acompanha o ritmo do ditado da turma",
      "Não se perde de onde parou ao copiar",
      "Faz a correspondência som-letra ao escrever",
      "Mantém a legibilidade na cópia e no ditado",
      "Copia textos longos sem grande esforço",
      "Termina as tarefas de cópia no tempo da aula",
    ]}],
  },

  "j26-104": {
    icon: Sparkles, gradient: "from-emerald-500 to-green-600", instruction: DEV_INSTRUCTION,
    infoBox: "Monitora o sucesso da inclusão escolar (maior = melhor). Útil para o relatório de acompanhamento. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Inclusão escolar (maior = funcionando melhor)", bands: DEV_BANDS,
    domains: [{ name: "Sucesso da inclusão", color: "text-emerald-600 dark:text-emerald-400", items: [
      "A escola fez as adaptações necessárias",
      "O professor compreende as necessidades da criança",
      "A criança participa das atividades da turma",
      "A criança está avançando na aprendizagem",
      "A criança é aceita e incluída pelos colegas",
      "Há comunicação entre escola e família",
      "A criança tem apoio (mediador/AEE) quando necessário",
      "As avaliações são adaptadas quando preciso",
      "A criança se sente bem em ir à escola",
      "Há um plano educacional individualizado em uso",
      "Os profissionais externos dialogam com a escola",
      "A inclusão está, no geral, funcionando bem",
    ]}],
  },

  // ============================================================
  // LOTE 9 — Categoria 9: Motor e Coordenação (autoral)
  // ============================================================

  "j26-106": {
    icon: Hand, gradient: "from-teal-500 to-cyan-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia o motor fino no contexto escolar (maior = melhor). Útil antes de encaminhar à terapia ocupacional. Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Motor fino escolar (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Motor fino na escola", color: "text-teal-600 dark:text-teal-400", items: [
      "Pega o lápis com preensão adequada","Tem força e controle ao escrever ou desenhar","Usa a tesoura para recortar com precisão","Cola e monta com cuidado","Pinta dentro dos limites","Encaixa e manuseia peças pequenas","Abotoa, amarra e usa fechos","Aponta o lápis e usa a borracha bem","Manuseia régua e materiais escolares","Coordena as duas mãos nas tarefas","Tem velocidade adequada nas tarefas manuais","Não se cansa demais ao usar as mãos",
    ]}],
  },
  "j26-107": {
    icon: Baby, gradient: "from-amber-500 to-orange-600", instruction: DEV_INSTRUCTION,
    infoBox: "Acompanha os marcos de motor grosso de 1 a 5 anos (maior = mais marcos). Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Motor grosso 1–5 anos", bands: DEV_BANDS,
    domains: [{ name: "Marcos motores grossos", color: "text-amber-600 dark:text-amber-400", items: [
      "Anda sozinha com firmeza","Corre sem cair com frequência","Sobe e desce escada (com apoio conforme a idade)","Chuta uma bola","Pula com os dois pés juntos","Pula em um pé só (conforme a idade)","Joga e pega uma bola","Anda na ponta dos pés quando pede","Pedala um triciclo (conforme a idade)","Equilibra-se em um pé por alguns segundos","Agacha e levanta sem apoio","Tem coordenação corporal compatível com a idade",
    ]}],
  },
  "j26-108": {
    icon: Hand, gradient: "from-blue-500 to-indigo-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a integração visomotora e a coordenação olho-mão (maior = melhor). Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Integração visomotora (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Coordenação olho-mão", color: "text-blue-600 dark:text-blue-400", items: [
      "Copia formas simples (círculo, cruz, quadrado)","Copia formas complexas (triângulo, losango)","Liga pontos seguindo um modelo","Encaixa peças observando o formato","Monta quebra-cabeças da idade","Desenha figuras reconhecíveis","Coordena olho e mão para alcançar e pegar","Empilha ou alinha objetos com precisão","Traça dentro de um caminho ou labirinto","Reproduz um padrão visual","Copia letras e números com a forma correta","Coordena visão e mão sem grande esforço",
    ]}],
  },
  "j26-109": {
    icon: Hand, gradient: "from-violet-500 to-purple-600", instruction: DEV_INSTRUCTION,
    infoBox: "Triagem de praxia/dispraxia do desenvolvimento (maior = melhor planejamento motor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Praxia (maior = melhor planejamento motor)", bands: DEV_BANDS,
    domains: [{ name: "Planejamento motor (praxia)", color: "text-violet-600 dark:text-violet-400", items: [
      "Imita gestos simples sob modelo","Imita sequências de gestos","Faz gestos com significado (tchau, beijo) sob comando","Usa ferramentas e objetos corretamente (pente, colher)","Aprende uma sequência motora nova","Planeja os movimentos de uma tarefa nova","Executa os movimentos na ordem certa","Coordena os movimentos da boca para a fala (praxia oral)","Realiza tarefas motoras de várias etapas","Adapta o movimento a um novo objeto ou situação","Faz movimentos finos sob comando verbal","Realiza gestos sem precisar de muitas tentativas",
    ]}],
  },
  "j26-111": {
    icon: Activity, gradient: "from-teal-500 to-emerald-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avaliação funcional do motor na paralisia cerebral (maior = mais funcional dentro do quadro). Base para o plano de terapias. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Função motora na PC (maior = mais funcional)", bands: DEV_BANDS,
    domains: [{ name: "Funcionalidade motora", color: "text-teal-600 dark:text-teal-400", items: [
      "Mantém a cabeça e o tronco controlados","Senta-se com o controle possível para o seu quadro","Faz transferências com a ajuda esperada","Desloca-se pelo ambiente (engatinha, anda, cadeira)","Caminha conforme seu nível (com ou sem apoio/órtese)","Usa as mãos para manipular objetos","Alcança e segura objetos","Participa das AVDs com a assistência necessária","Mantém posturas funcionais ao longo do dia","Usa adaptações ou órteses de forma efetiva","Comunica necessidades motoras (ajuda, posição)","Participa de atividades dentro das suas possibilidades",
    ]}],
  },
  "j26-112": {
    icon: Activity, gradient: "from-cyan-500 to-blue-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia equilíbrio estático/dinâmico e marcha (maior = melhor). Detecta sinais cerebelares, vestibulares e motores. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Equilíbrio e marcha (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Equilíbrio e marcha", color: "text-cyan-600 dark:text-cyan-400", items: [
      "Fica em pé parada sem se desequilibrar","Equilibra-se em um pé por alguns segundos","Anda em linha reta (um pé à frente do outro)","Anda na ponta dos pés quando pede","Anda sobre os calcanhares","Sobe degraus alternando os pés","Desce degraus com controle","Agacha e levanta sem apoio","Muda de direção ao correr sem cair","Mantém o equilíbrio ao ser levemente empurrada","Tem marcha simétrica e harmoniosa","Mantém o equilíbrio com os olhos fechados (conforme a idade)",
    ]}],
  },
  "j26-113": {
    icon: Hand, gradient: "from-indigo-500 to-blue-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avaliação detalhada da caligrafia (maior = melhor). Subsidia decisões como o uso de computador na escola. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Escrita manual (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Qualidade da escrita manual", color: "text-indigo-600 dark:text-indigo-400", items: [
      "Tem letra legível","Faz pressão adequada no papel (nem fraca, nem forte demais)","Mantém o tamanho das letras uniforme","Mantém a inclinação constante das letras","Tem espaçamento regular entre letras e palavras","Mantém as letras sobre a linha","Forma as letras com o traçado correto","Escreve com velocidade compatível com a série","Mantém a legibilidade ao escrever rápido","Não apaga nem rabisca excessivamente","Escreve sem dor ou cansaço excessivo na mão","Organiza bem o texto na folha",
    ]}],
  },
  "j26-115": {
    icon: Activity, gradient: "from-emerald-500 to-teal-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia habilidades motoras para esportes e brincadeiras coletivas (maior = melhor). Importante para o desenvolvimento social. Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Habilidades esportivas (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Motor para esportes", color: "text-emerald-600 dark:text-emerald-400", items: [
      "Corre com coordenação","Pula corda","Pega e arremessa bola","Chuta bola com direção","Participa de jogos coletivos","Acompanha o ritmo dos colegas no esporte","Tem equilíbrio para atividades físicas","Coordena braços e pernas em movimentos esportivos","Aprende novas habilidades esportivas","Tem resistência física para brincar e jogar","Nada ou anda de bicicleta (conforme a idade)","Sente-se confiante em atividades físicas",
    ]}],
  },
  "j26-117": {
    icon: Baby, gradient: "from-pink-500 to-rose-600", instruction: DEV_INSTRUCTION,
    infoBox: "Acompanhamento motor de prematuros nos primeiros 2 anos — usar IDADE CORRIGIDA (maior = mais marcos). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Motor do prematuro (idade corrigida)", bands: DEV_BANDS,
    domains: [{ name: "Marcos motores (idade corrigida)", color: "text-pink-600 dark:text-pink-400", items: [
      "Sustenta a cabeça (idade corrigida)","Apoia-se nos antebraços de bruços","Rola","Senta com e depois sem apoio","Alcança e pega objetos","Passa objetos de uma mão para a outra","Engatinha ou se desloca","Fica de pé com apoio","Anda com e depois sem apoio","Tem tônus e postura simétricos","Faz movimentos variados e fluidos (não estereotipados)","Acompanha os marcos esperados para a idade corrigida",
    ]}],
  },

  // ============================================================
  // LOTE 10 — Categoria 10: Sensorial e Integração (autoral)
  // ============================================================

  "j26-126": {
    icon: Sparkles, gradient: "from-emerald-500 to-teal-600", instruction: DEV_INSTRUCTION,
    infoBox: "Monitora a eficácia da dieta sensorial prescrita pelo TO (maior = funcionando melhor). Aplicar mensalmente. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Eficácia da dieta sensorial (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Resposta às estratégias sensoriais", color: "text-emerald-600 dark:text-emerald-400", items: [
      "As estratégias sensoriais ajudam a criança a se regular","A criança fica mais calma após as atividades sensoriais","Melhorou o foco com a dieta sensorial","Melhorou o comportamento em casa","Melhorou o comportamento na escola","Reduziram as crises de sobrecarga","A criança aceita bem as estratégias","As estratégias são usadas na rotina diária","Melhorou o sono","Melhorou a alimentação","A família consegue aplicar as estratégias","No geral, a dieta sensorial está funcionando",
    ]}],
  },
  // ============================================================
  // LOTE 11 — Categoria 11: Sono Expandido (autoral)
  // ============================================================

  "j26-130": {
    icon: Sparkles, gradient: "from-indigo-500 to-blue-700", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia as práticas de higiene do sono (maior = mais saudáveis). Base antes de indicar melatonina. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Higiene do sono (maior = mais saudável)", bands: DEV_BANDS,
    domains: [{ name: "Práticas de sono", color: "text-indigo-600 dark:text-indigo-400", items: [
      "Tem horário fixo para dormir","Tem horário fixo para acordar","Faz um ritual calmo antes de dormir (banho, leitura)","O quarto é escuro na hora de dormir","O quarto é silencioso e tranquilo","Evita telas na hora antes de dormir","Evita cafeína ou refrigerante à noite","Não faz atividade agitada perto da hora de dormir","Dorme na própria cama","Tem ambiente com temperatura agradável","Evita refeições pesadas antes de dormir","Mantém a rotina de sono nos fins de semana",
    ]}],
  },
  "j26-136": {
    icon: Sparkles, gradient: "from-emerald-500 to-teal-600", instruction:
      "Marque como está o sono desde o início da melatonina. Aplique semanalmente. Responda todos os itens.",
    infoBox: "Monitorização da resposta à melatonina (maior = melhor resposta). Ajustes de dose/horário com o médico. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Resposta à melatonina (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Resposta ao tratamento", color: "text-emerald-600 dark:text-emerald-400", items: [
      "Demora menos para pegar no sono desde a melatonina","Pega no sono em menos de 30 minutos","Acorda menos vezes durante a noite","Dorme mais horas no total","Acorda mais descansada de manhã","Está menos irritada durante o dia","Aceita bem a medicação","Não tem efeitos adversos (sonolência diurna, dor de cabeça)","A rotina de sono melhorou","O comportamento diurno melhorou","A família está dormindo melhor também","No geral, a melatonina está ajudando",
    ]}],
  },
  "j26-137": {
    icon: Sparkles, gradient: "from-teal-500 to-cyan-600", instruction: DEV_INSTRUCTION,
    infoBox: "Estrutura e monitora a rotina noturna (maior = melhor estruturada). Intervenção de primeira linha, antes de medicação. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Rotina noturna (maior = melhor estruturada)", bands: DEV_BANDS,
    domains: [{ name: "Estrutura da rotina", color: "text-teal-600 dark:text-teal-400", items: [
      "Tem horário definido para começar a rotina da noite","Faz o banho como parte da rotina","Janta em horário adequado","Tem um período de brincadeira calma antes de dormir","Faz leitura ou história antes de dormir","Diminui as luzes e os estímulos ao se aproximar a hora","Apaga a luz em horário consistente","A criança sabe o que vem a seguir na rotina","A rotina é tranquila (sem brigas)","A rotina é mantida todos os dias","A rotina é mantida nos fins de semana","A rotina ajuda a criança a dormir melhor",
    ]}],
  },
  // ============================================================
  // LOTE 12 — Categoria 12: Alimentação e Nutrição (autoral)
  // ============================================================

  "j26-146": {
    icon: Baby, gradient: "from-emerald-500 to-teal-600", instruction: DEV_INSTRUCTION,
    infoBox: "Marcos de autonomia alimentar de 6 a 36 meses (maior = mais marcos). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Autonomia alimentar 6–36 meses", bands: DEV_BANDS,
    domains: [{ name: "Marcos de autonomia alimentar", color: "text-emerald-600 dark:text-emerald-400", items: [
      "Leva a mão ou objetos à boca (início da introdução)","Come pedaços com a mão","Segura e bebe no copo","Segura a colher (mesmo sem precisão)","Leva a colher à boca sozinha","Come sozinha derramando pouco","Mastiga alimentos em pedaços","Senta na cadeirinha para comer","Aceita texturas progressivamente mais complexas","Sinaliza fome e saciedade","Participa da refeição da família","Usa garfo (conforme a idade)",
    ]}],
  },
  // ============================================================
  // LOTE 13 — Categoria 13: Dor e Cefaleia (autoral)
  // (J26-150 — Diário de Cefaleia — segue como ferramenta diária)
  // ============================================================

  // ============================================================
  // LOTE 14 — Categoria 14: Epilepsia Expandida (autoral)
  // ============================================================

  // ============================================================
  // LOTE 15 — Categoria 15: Saúde Mental e Psiquiatria (autoral)
  // ============================================================

  "j26-176": {
    icon: Sparkles, gradient: "from-emerald-500 to-teal-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia resiliência e fatores protetores (maior = mais protegida). Orienta o plano terapêutico. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Resiliência (maior = mais protegida)", bands: DEV_BANDS,
    domains: [{ name: "Fatores protetores", color: "text-emerald-600 dark:text-emerald-400", items: [
      "Tem um vínculo seguro com um cuidador","Tem ao menos um adulto de confiança","Sente-se apoiada pela escola","Tem amigos ou rede de apoio","Acredita que pode superar dificuldades","Tem um senso de propósito ou sonhos","Recupera-se após situações difíceis","Pede e aceita ajuda","Tem autoestima razoável","Consegue ver o lado bom das coisas","Tem rotinas e estrutura que a apoiam","Tem estratégias para lidar com o estresse",
    ]}],
  },
  // ============================================================
  // LOTE 16 — Categoria 16: Qualidade de Vida e Funcionalidade (autoral)
  // (J26-188 — Metas/GAS — segue como ferramenta de planejamento individual)
  // ============================================================

  "j26-180": {
    icon: Hand, gradient: "from-cyan-500 to-sky-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia as atividades de vida diária (maior = mais funcional/autônoma). Para crianças com PC, TEA, DI e outras condições. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "AVDs (maior = mais funcional)", bands: DEV_BANDS,
    domains: [{ name: "Atividades de vida diária", color: "text-cyan-600 dark:text-cyan-400", items: [
      "Alimenta-se sozinha (com a assistência esperada)","Veste-se e despe-se (com a assistência esperada)","Faz a própria higiene (mãos, dentes, banho)","Usa o banheiro de forma independente","Desloca-se pelo ambiente","Comunica as suas necessidades","Participa das tarefas simples de casa","Move-se com segurança (transferências)","Manuseia objetos do dia a dia","Organiza os seus pertences","Realiza a rotina diária com a autonomia possível","Pede ajuda quando necessário",
    ]}],
  },
  "j26-181": {
    icon: Sparkles, gradient: "from-blue-500 to-indigo-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a participação social (maior = mais participação). Meta importante das intervenções. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Participação social (maior = mais)", bands: DEV_BANDS,
    domains: [{ name: "Participação na comunidade", color: "text-blue-600 dark:text-blue-400", items: [
      "Participa de festas de aniversário","Brinca com outras crianças","Participa de atividades na escola","Participa de esportes ou atividades de grupo","Vai a passeios com a família","Frequenta lugares públicos (praça, igreja, mercado)","Tem amigos","Participa de atividades religiosas ou culturais","Aceita convites sociais","Comunica-se nas situações sociais","Participa das rotinas familiares","Tem oportunidades de participação na comunidade",
    ]}],
  },
  "j26-184": {
    icon: Sparkles, gradient: "from-emerald-500 to-teal-600", instruction:
      "Para cada frase, marque o quanto concorda. Responda com sinceridade — sua opinião ajuda a melhorar o atendimento. Responda todos os itens.",
    infoBox: "Avalia a satisfação da família com o tratamento (maior = mais satisfeita). Usado para melhorar o atendimento. Não é diagnóstico.",
    labels: ["Discordo", "Mais ou menos", "Concordo"], totalLabel: "Satisfação com o tratamento (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Satisfação com a equipe e o cuidado", color: "text-emerald-600 dark:text-emerald-400", items: [
      "Sinto-me bem acolhido(a) no atendimento","O médico explica de forma clara","Tenho as minhas dúvidas respondidas","Sinto que a minha opinião é considerada","As terapias estão sendo úteis","A equipe se comunica bem entre si","Consigo contato quando preciso","Os horários e o acesso são adequados","Vejo evolução no meu filho","Confio na equipe","Recomendaria o atendimento","No geral, estou satisfeito(a) com o tratamento",
    ]}],
  },
  "j26-185": {
    icon: ClipboardList, gradient: "from-teal-500 to-cyan-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia o engajamento e as barreiras de acesso às terapias (maior = mais engajamento e menos barreiras). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Engajamento nas terapias (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Engajamento e acesso", color: "text-teal-600 dark:text-teal-400", items: [
      "Conseguimos manter a frequência das terapias","Temos transporte para as terapias","Conseguimos arcar com os custos","A criança aceita e colabora nas terapias","Fazemos as atividades de casa orientadas","Vemos evolução com as terapias","Conseguimos conciliar com a rotina","Temos acesso aos serviços necessários","A escola colabora com o tratamento","A família está engajada no plano","Não há barreiras importantes ao tratamento","No geral, o engajamento está bom",
    ]}],
  },
  "j26-186": {
    icon: Sparkles, gradient: "from-emerald-500 to-green-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia o sucesso real da inclusão escolar (maior = mais efetiva). Para as reuniões com a escola. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Inclusão efetiva (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Inclusão e participação ativa", color: "text-emerald-600 dark:text-emerald-400", items: [
      "A criança tem amigos na escola","Participa ativamente das aulas","O professor faz as adaptações necessárias","O AEE ou apoio funciona","A criança é aceita pelos colegas","A criança está avançando na aprendizagem","Há comunicação entre escola e família","A criança se sente bem na escola","As avaliações são adaptadas quando preciso","A escola tem postura inclusiva","A criança participa dos eventos escolares","No geral, a inclusão é efetiva",
    ]}],
  },
  "j26-187": {
    icon: Sparkles, gradient: "from-violet-500 to-purple-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a autonomia e o projeto de vida do adolescente com necessidades especiais (maior = mais autônomo). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Autonomia e projeto de vida (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Autonomia do adolescente", color: "text-violet-600 dark:text-violet-400", items: [
      "Realiza as AVDs com a autonomia possível","Cuida da própria higiene e aparência","Administra a própria rotina com o apoio adequado","Tem habilidades para tarefas domésticas","Comunica as suas necessidades e decisões","Tem vida social e amizades","Tem um projeto profissional ou ocupacional","Participa de atividades na comunidade","Tem noções de segurança e autocuidado","Lida com dinheiro e transações simples","Recebeu orientação sobre sexualidade e relações","Caminha para a maior independência possível",
    ]}],
  },
  "j26-189": {
    icon: Activity, gradient: "from-teal-500 to-emerald-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a funcionalidade motora grossa na PC (maior = mais funcional). Complementa a classificação GMFCS. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Funcionalidade motora na PC (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Função motora grossa", color: "text-teal-600 dark:text-teal-400", items: [
      "Controla a cabeça e o tronco","Senta-se com a estabilidade possível","Faz transferências com a assistência esperada","Desloca-se pelo ambiente (anda, cadeira, engatinha)","Caminha em casa conforme o nível","Caminha fora de casa ou na comunidade conforme o nível","Sobe e desce superfícies ou degraus conforme o nível","Usa as mãos para tarefas funcionais","Usa dispositivos ou órteses de forma efetiva","Participa de atividades físicas adaptadas","Mantém posturas funcionais ao longo do dia","Tem a mobilidade necessária para a rotina",
    ]}],
  },

  // ============================================================
  // LOTE 17 — Categoria 17: Neonatal e Prematuridade (autoral)
  // ============================================================

  "j26-191": {
    icon: Baby, gradient: "from-amber-500 to-orange-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a prontidão para alimentação oral do prematuro (maior = mais pronto). Uso na UTIN. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Prontidão alimentar (maior = mais pronto)", bands: DEV_BANDS,
    domains: [{ name: "Prontidão para via oral", color: "text-amber-600 dark:text-amber-400", items: [
      "Mantém estado de alerta adequado","Tem estabilidade respiratória","Tem reflexo de sucção presente","Coordena sucção e deglutição","Coordena sucção, deglutição e respiração","Mantém a saturação durante a tentativa","Não engasga nem aspira nas tentativas","Demonstra sinais de fome ou procura","Tem tônus oral adequado","Ganha peso de forma adequada","Tolera o volume oferecido","Mostra prontidão para retirar a sonda",
    ]}],
  },
  "j26-192": {
    icon: Baby, gradient: "from-rose-500 to-pink-600", instruction: DEV_INSTRUCTION,
    infoBox: "Monitorização do Método Canguru até 6 meses de idade corrigida (maior = melhor evolução). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Follow-up do canguru (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Vínculo, amamentação e evolução", color: "text-rose-600 dark:text-rose-400", items: [
      "Os pais fazem a posição canguru regularmente","O vínculo pais-bebê está fortalecido","A amamentação está estabelecida ou evoluindo","O bebê ganha peso adequadamente","O bebê regula bem a temperatura","Os pais se sentem confiantes nos cuidados","Os pais percebem os sinais do bebê","O bebê tem bons períodos de sono","O bebê está mais calmo e regulado","A família tem rede de apoio","O bebê comparece ao follow-up","No geral, o seguimento do canguru vai bem",
    ]}],
  },
  "j26-194": {
    icon: Baby, gradient: "from-emerald-500 to-teal-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a prontidão para alta da UTIN e a transição para casa (maior = mais pronto). Reduz reinternações. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Prontidão para alta (maior = mais pronto)", bands: DEV_BANDS,
    domains: [{ name: "Prontidão de bebê e família", color: "text-emerald-600 dark:text-emerald-400", items: [
      "O bebê se alimenta o suficiente por via oral","Mantém a temperatura estável fora da incubadora","Tem ganho de peso consistente","Tem estabilidade respiratória e cardíaca","Não tem mais episódios de apneia significativos","A mãe ou o pai foi treinado(a) nos cuidados","A família sabe reconhecer sinais de alerta","A amamentação ou a alimentação está estabelecida","Há rede de apoio em casa","Os retornos e o seguimento estão agendados","As medicações de casa estão organizadas","No geral, bebê e família estão prontos para a alta",
    ]}],
  },
  "j26-195": {
    icon: Baby, gradient: "from-blue-500 to-indigo-600", instruction: DEV_INSTRUCTION,
    infoBox: "Seguimento do neurodesenvolvimento do prematuro aos 2 anos de idade CORRIGIDA (maior = mais adequado). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Follow-up 2 anos corrigidos (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Desenvolvimento (idade corrigida)", color: "text-blue-600 dark:text-blue-400", items: [
      "Tem motor grosso adequado (idade corrigida)","Tem motor fino adequado","Tem linguagem compatível (idade corrigida)","Tem desenvolvimento cognitivo adequado","Tem desenvolvimento social adequado","Anda com firmeza","Fala palavras ou frases esperadas","Brinca de forma simbólica","Tem boa interação social","Tem tônus e postura adequados","Tem crescimento adequado (peso/altura/PC)","Acompanha os marcos para a idade corrigida",
    ]}],
  },
  // ============================================================
  // LOTE 18 — Categoria 18: Monitorização de Medicação + finais (autoral)
  // ============================================================

  "j26-201": {
    icon: ClipboardList, gradient: "from-emerald-500 to-teal-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a adesão ao tratamento farmacológico (maior = melhor adesão). Orienta estratégias de melhora. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Adesão (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Adesão à medicação", color: "text-emerald-600 dark:text-emerald-400", items: [
      "Dá o remédio todos os dias","Dá nos horários certos","Dá a dose correta","Não esquece doses","A criança aceita ou engole o remédio","Mantém estoque (não falta)","Não interrompe por conta própria","Consegue arcar com o custo","Continua mesmo quando a criança está bem","Sabe o que fazer se esquecer uma dose","Comparece às consultas e exames","No geral, segue o tratamento corretamente",
    ]}],
  },
  "j26-203": {
    icon: MessageCircle, gradient: "from-sky-500 to-blue-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a comunicação social no pré-escolar e início do fundamental (maior = melhor). Identifica risco de TEA/TDL. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Comunicação social 3–7 anos (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Comunicação social", color: "text-sky-600 dark:text-sky-400", items: [
      "Responde ao nome","Mantém contato visual na interação","Espera e respeita os turnos na conversa","Mantém um assunto compartilhado","Pede ajuda quando precisa","Inicia interação com outras crianças","Responde a perguntas de forma pertinente","Usa e entende gestos sociais","Compartilha interesse (mostra coisas)","Brinca de forma cooperativa","Entende regras sociais simples","Comunica-se de forma funcional no grupo",
    ]}],
  },
  "j26-205": {
    icon: Sparkles, gradient: "from-cyan-500 to-blue-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a cognição social na criança com TEA (maior = melhor). Base para a intervenção social. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Cognição social (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Cognição social", color: "text-cyan-600 dark:text-cyan-400", items: [
      "Reconhece emoções básicas em faces","Reconhece emoções complexas","Entende a intenção dos outros","Lê a linguagem corporal","Tem empatia cognitiva (entende o que o outro sente)","Entende perspectivas diferentes da sua","Percebe quando alguém está brincando ou sendo irônico","Ajusta o comportamento ao contexto social","Reconhece expressões pela voz e pelo tom","Antecipa as reações dos outros","Entende regras sociais implícitas","Aplica a cognição social no dia a dia",
    ]}],
  },
  "j26-208": {
    icon: Sparkles, gradient: "from-emerald-500 to-teal-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia habilidades de vida independente em adolescentes com DI ou TEA (maior = mais independente). Para a transição à vida adulta. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Vida independente (maior = mais autônomo)", bands: DEV_BANDS,
    domains: [{ name: "Habilidades de vida independente", color: "text-emerald-600 dark:text-emerald-400", items: [
      "Usa transporte público","Faz uma compra simples e confere o troco","Prepara um lanche ou refeição simples","Usa o celular com segurança","Administra dinheiro básico","Cuida da própria higiene e aparência","Faz tarefas domésticas","Toma os próprios medicamentos com supervisão","Conhece regras de segurança (rua, estranhos)","Pede ajuda quando necessário","Organiza a própria rotina","Tem habilidades para uma ocupação ou trabalho apoiado",
    ]}],
  },
  "j26-209": {
    icon: ShieldAlert, gradient: "from-pink-500 to-rose-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia conhecimento e proteção em saúde sexual de adolescentes com NEE (maior = mais protegido e orientado). Orienta a educação sexual adaptada. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Saúde sexual e proteção (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Educação e proteção sexual", color: "text-pink-600 dark:text-pink-400", items: [
      "Conhece as partes do corpo e a privacidade corporal","Diferência toque adequado de inadequado","Sabe dizer “não” a toques indesejados","Sabe a quem recorrer se algo errado acontecer","Entende noções de puberdade e mudanças do corpo","Tem noções de relacionamentos saudáveis","Entende limites e consentimento (no nível possível)","Tem a sua privacidade respeitada e compreende a dos outros","Conhece riscos básicos (abuso, exposição online)","Recebe educação sexual adaptada","Comunica desconfortos relacionados ao corpo","Tem proteção e orientação adequadas",
    ]}],
  },
  "j26-210": {
    icon: Sparkles, gradient: "from-blue-500 to-indigo-600", instruction:
      "Marque como está a criança HOJE em relação ao trimestre anterior. Responda todos os itens.",
    infoBox: "Avaliação trimestral de evolução pós-intervenção multidisciplinar (maior = mais evolução). Base para o relatório de acompanhamento. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Evolução trimestral (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Evolução pós-terapia", color: "text-blue-600 dark:text-blue-400", items: [
      "Houve evolução na área principal tratada","Houve evolução na comunicação","Houve evolução no comportamento","Houve evolução na autonomia","Houve evolução social","As metas do trimestre foram alcançadas","A família percebe melhora no dia a dia","A escola percebe melhora","A criança está mais regulada","As terapias estão sendo efetivas","O plano atual continua adequado","No geral, a evolução é positiva",
    ]}],
  },

  // ============================================================
  // COMPLEMENTO — Categoria 1 restante (004, 005, 006, 010, 011, 012)
  // ============================================================

  "j26-004": {
    icon: Sparkles, gradient: "from-amber-500 to-yellow-600", instruction: DEV_INSTRUCTION,
    infoBox: "Triagem de cognição e resolução de problemas de 0 a 18 meses (maior = mais marcos). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Cognição precoce 0–18 meses", bands: DEV_BANDS,
    domains: [{ name: "Cognição e resolução de problemas", color: "text-amber-600 dark:text-amber-400", items: [
      "Procura um objeto que sumiu (permanência do objeto)","Explora os brinquedos de formas variadas","Imita ações simples (bater palmas)","Usa um objeto para alcançar outro (resolve problema)","Encontra um objeto escondido sob um pano","Manipula o brinquedo para entender como funciona","Busca ou aponta o que quer (intencionalidade)","Empilha ou encaixa objetos simples","Reconhece objetos e pessoas familiares","Antecipa rotinas (sabe o que vem depois)","Imita gestos novos","Brinca de causa e efeito (aperta botão e faz tocar)",
    ]}],
  },
  "j26-005": {
    icon: Baby, gradient: "from-pink-500 to-rose-600", instruction: DEV_INSTRUCTION,
    infoBox: "Triagem da regulação sensorial e comportamental do neonato (maior = melhor regulação). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Regulação sensorial neonatal (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Regulação do recém-nascido", color: "text-pink-600 dark:text-pink-400", items: [
      "Acalma-se quando embalado ou aconchegado","Tolera o toque do cuidado (banho, troca)","Mantém-se calmo com estímulos comuns","Tem períodos de alerta tranquilo","Transita suavemente entre sono e vigília","Reage de forma proporcional a sons","Reage de forma proporcional à luz","Mantém o tônus organizado (nem muito mole, nem rígido)","Suga e se alimenta de forma organizada","Recupera-se após um estímulo intenso","Não se sobressalta excessivamente","No geral, regula bem os estímulos",
    ]}],
  },
  "j26-010": {
    icon: Baby, gradient: "from-blue-500 to-indigo-600", instruction: DEV_INSTRUCTION,
    infoBox: "Triagem global de 24 a 36 meses nas 5 áreas (maior = mais marcos). O detalhamento por domínio mostra a área mais frágil. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Triagem global 24–36 meses", bands: DEV_BANDS,
    domains: [
      { name: "Motor grosso", color: "text-amber-600 dark:text-amber-400", items: ["Corre sem cair","Sobe escada com apoio","Chuta uma bola"] },
      { name: "Motor fino", color: "text-teal-600 dark:text-teal-400", items: ["Empilha 4 ou mais cubos","Rabisca espontaneamente","Vira páginas de um livro"] },
      { name: "Linguagem expressiva", color: "text-blue-600 dark:text-blue-400", items: ["Fala frases de 2-3 palavras","Nomeia objetos comuns","Usa o próprio nome ou “eu”"] },
      { name: "Linguagem receptiva", color: "text-sky-600 dark:text-sky-400", items: ["Segue ordens de 2 passos","Aponta figuras quando nomeadas","Entende conceitos (grande/pequeno)"] },
      { name: "Social", color: "text-pink-600 dark:text-pink-400", items: ["Brinca perto de outras crianças","Imita tarefas do dia a dia","Faz de conta (boneca, telefone)"] },
    ],
  },
  "j26-011": {
    icon: Baby, gradient: "from-indigo-500 to-blue-600", instruction: DEV_INSTRUCTION,
    infoBox: "Triagem global de 36 a 60 meses, pré-escolar (maior = mais marcos). Útil antes da entrada na escola. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Triagem global 36–60 meses", bands: DEV_BANDS,
    domains: [
      { name: "Motor grosso", color: "text-amber-600 dark:text-amber-400", items: ["Pula em um pé só","Sobe escada alternando os pés","Equilibra-se brevemente em um pé"] },
      { name: "Motor fino", color: "text-teal-600 dark:text-teal-400", items: ["Copia um círculo ou uma cruz","Usa a tesoura","Veste-se com pouca ajuda"] },
      { name: "Linguagem", color: "text-blue-600 dark:text-blue-400", items: ["Conta uma história curta","Fala frases completas","Faz perguntas"] },
      { name: "Cognição", color: "text-violet-600 dark:text-violet-400", items: ["Entende conceitos (cores, números)","Segue ordens de 3 passos","Entende “por quê”"] },
      { name: "Autonomia e social", color: "text-pink-600 dark:text-pink-400", items: ["Usa o banheiro sozinha","Brinca cooperativamente","Espera a vez"] },
    ],
  },
  "j26-012": {
    icon: Sparkles, gradient: "from-emerald-500 to-teal-600", instruction: DEV_INSTRUCTION,
    infoBox: "Guia de estimulação e triagem tipo Portage adaptado (maior = mais marcos por área). Referência para estimulação domiciliar. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Triagem tipo Portage (maior = mais marcos)", bands: DEV_BANDS,
    domains: [
      { name: "Socialização", color: "text-pink-600 dark:text-pink-400", items: ["Interage e busca o outro","Brinca com outras crianças","Demonstra afeto"] },
      { name: "Linguagem", color: "text-blue-600 dark:text-blue-400", items: ["Comunica o que quer","Fala conforme a idade","Entende ordens"] },
      { name: "Autocuidado", color: "text-cyan-600 dark:text-cyan-400", items: ["Come e bebe com a autonomia da idade","Veste-se conforme a idade","Faz a higiene conforme a idade"] },
      { name: "Cognição", color: "text-violet-600 dark:text-violet-400", items: ["Resolve problemas simples","Reconhece formas/cores/números conforme a idade","Brinca de faz de conta"] },
      { name: "Motor", color: "text-amber-600 dark:text-amber-400", items: ["Tem motor grosso adequado","Tem motor fino adequado","Coordena os movimentos"] },
    ],
  },

  // ============================================================
  // LOTE 19A — Evolução/Monitorização J26-211 a 235 (autoral)
  // ============================================================

  "j26-211": { icon: MessageCircle, gradient: "from-pink-500 to-rose-600", instruction: DEV_INSTRUCTION,
    infoBox: "Registro evolutivo trimestral da comunicação social no TEA (maior = melhor). Compare com o registro anterior. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Comunicação social — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Comunicação social", color: "text-pink-600 dark:text-pink-400", items: ["Faz contato visual na interação","Responde ao nome","Inicia comunicação espontaneamente","Usa gestos sociais","Tem atenção compartilhada","Mantém a troca social","Responde a perguntas","Demonstra interesse por outras crianças"] }] },
  "j26-213": { icon: Sparkles, gradient: "from-teal-500 to-cyan-600", instruction: DEV_INSTRUCTION,
    infoBox: "Monitorização trimestral das habilidades adaptativas no TEA (maior = mais autônoma). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Habilidades adaptativas — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "AVDs e autonomia", color: "text-teal-600 dark:text-teal-400", items: ["Cuida da própria higiene","Alimenta-se com autonomia","Veste-se com autonomia","Organiza seus pertences","Segue a rotina com autonomia","Comunica necessidades","Ajuda em tarefas domésticas","Tem noções de segurança"] }] },
  "j26-216": { icon: Sparkles, gradient: "from-pink-500 to-rose-600", instruction: DEV_INSTRUCTION,
    infoBox: "Monitorização sequencial de contato visual e atenção conjunta no TEA (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Contato visual e atenção conjunta (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Atenção conjunta", color: "text-pink-600 dark:text-pink-400", items: ["Faz contato visual espontâneo","Sustenta o olhar na interação","Segue o apontar do adulto","Aponta para mostrar","Alterna o olhar objeto-pessoa","Faz referência social","Compartilha interesse","Responde ao nome olhando"] }] },
  "j26-217": { icon: Sparkles, gradient: "from-teal-500 to-cyan-600", instruction: DEV_INSTRUCTION,
    infoBox: "Acompanhamento trimestral da brincadeira funcional e simbólica no TEA (maior = mais elaborada). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Brincadeira — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Brincar funcional e simbólico", color: "text-teal-600 dark:text-teal-400", items: ["Explora os brinquedos de forma variada","Usa os objetos pela função","Faz de conta simples","Cria cenários no faz de conta","Substitui um objeto por outro","Brinca em sequência","Aceita o adulto na brincadeira","Brinca de forma cooperativa"] }] },
  "j26-218": { icon: Heart, gradient: "from-emerald-500 to-teal-600", instruction:
      "Marque como está a criança HOJE em relação ao início do tratamento. Responda todos os itens.",
    infoBox: "Impressão global de melhora no TEA relatada pelos pais (maior = mais melhora). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Impressão de melhora TEA (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Melhora percebida", color: "text-emerald-600 dark:text-emerald-400", items: ["Melhorou a comunicação","Melhorou o social","Melhorou o comportamento","Melhorou a autonomia","Tem menos crises","Melhorou o sono","Melhorou a alimentação","Houve melhora geral percebida"] }] },
  "j26-220": { icon: Sparkles, gradient: "from-amber-500 to-orange-600", instruction: DEV_INSTRUCTION,
    infoBox: "Acompanhamento trimestral das funções executivas no cotidiano do TDAH (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Funções executivas — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Funções executivas", color: "text-amber-600 dark:text-amber-400", items: ["Inicia as tarefas","Organiza materiais e tarefas","Planeja os passos","Usa a memória de trabalho","Tem flexibilidade","Tem controle inibitório","Termina o que começa","Administra o tempo"] }] },
  "j26-221": { icon: Sparkles, gradient: "from-blue-500 to-indigo-600", instruction: DEV_INSTRUCTION,
    infoBox: "Registro trimestral do desempenho escolar no TDAH (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Desempenho escolar — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Desempenho escolar", color: "text-blue-600 dark:text-blue-400", items: ["Acompanha o conteúdo","Faz as tarefas","Participa das aulas","Tem notas adequadas","Mantém o foco em sala","Organiza o material","Entrega no prazo","Tem bom comportamento em sala"] }] },
  "j26-223": { icon: Sparkles, gradient: "from-orange-500 to-red-600", instruction: DEV_INSTRUCTION,
    infoBox: "Acompanhamento sequencial da regulação emocional no TDAH (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Regulação emocional — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Regulação emocional", color: "text-orange-600 dark:text-orange-400", items: ["Acalma-se sozinha","Tolera a frustração","Controla a raiva","Recupera-se rápido","Expressa sem agredir","Lida com mudanças","Pede ajuda","Mantém o humor estável"] }] },
  "j26-225": { icon: Sparkles, gradient: "from-emerald-500 to-green-600", instruction: DEV_INSTRUCTION,
    infoBox: "Feedback do professor sobre a evolução comportamental em sala no TDAH (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Comportamento em sala — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Evolução em sala", color: "text-emerald-600 dark:text-emerald-400", items: ["Está mais focada em sala","Está menos agitada","Espera a vez","Termina as atividades","Relaciona-se melhor","Segue as regras","Participa das aulas","Houve melhora geral em sala"] }] },
  "j26-226": { icon: Heart, gradient: "from-teal-500 to-cyan-600", instruction:
      "Marque como está a criança HOJE em relação ao início do tratamento. Responda todos os itens.",
    infoBox: "Impressão global de melhora no TDAH (versão clínica e de pais) — maior = mais melhora. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Impressão de melhora TDAH (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Melhora percebida", color: "text-teal-600 dark:text-teal-400", items: ["Melhorou a atenção","Melhorou a agitação","Melhorou a impulsividade","Melhorou na escola","Melhorou em casa","Melhorou a autoestima","Melhorou as relações","Houve melhora geral"] }] },
  "j26-233": { icon: MessageCircle, gradient: "from-blue-500 to-indigo-600", instruction: DEV_INSTRUCTION,
    infoBox: "Acompanhamento trimestral do vocabulário expressivo pós-fonoterapia (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Vocabulário expressivo — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Vocabulário expressivo", color: "text-blue-600 dark:text-blue-400", items: ["Usa mais palavras do que antes","Nomeia objetos","Combina palavras em frases","Usa palavras novas que aprende","Tem vocabulário compatível com a idade","Expressa-se com mais clareza","Fala em vez de só apontar","Evoluiu desde a última avaliação"] }] },
  "j26-234": { icon: MessageCircle, gradient: "from-sky-500 to-blue-600", instruction: DEV_INSTRUCTION,
    infoBox: "Monitorização da inteligibilidade de fala pós-fonoterapia (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Inteligibilidade de fala — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Inteligibilidade", color: "text-sky-600 dark:text-sky-400", items: ["É entendida por pessoas de fora da família","Pronuncia os sons corretamente","Reduziu as trocas de sons","Fala claro em frases","Melhorou a articulação","É entendida pela família","Reduziu as omissões de sons","Evoluiu desde a última avaliação"] }] },
  "j26-235": { icon: MessageCircle, gradient: "from-teal-500 to-cyan-600", instruction: DEV_INSTRUCTION,
    infoBox: "Acompanhamento da linguagem pragmática — uso social da linguagem (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Linguagem pragmática — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Uso social da linguagem", color: "text-teal-600 dark:text-teal-400", items: ["Inicia conversa","Mantém o tema","Respeita os turnos","Faz perguntas","Repara a comunicação","Usa gestos sociais","Entende sentido figurado simples","O uso social melhorou"] }] },

  // ============================================================
  // LOTE 19B — Evolução/Monitorização J26-236 a 260 (autoral)
  // ============================================================

  "j26-237": { icon: MessageCircle, gradient: "from-blue-500 to-indigo-600", instruction: DEV_INSTRUCTION,
    infoBox: "Registro longitudinal dos marcos de comunicação atingidos (maior = mais marcos). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Marcos de comunicação (maior = mais)", bands: DEV_BANDS,
    domains: [{ name: "Marcos atingidos", color: "text-blue-600 dark:text-blue-400", items: ["Balbucia","Fala as primeiras palavras","Aponta para pedir/mostrar","Combina palavras","Fala frases","Segue ordens simples","Conta acontecimentos","Atingiu os marcos esperados para a idade"] }] },
  "j26-238": { icon: Activity, gradient: "from-teal-500 to-emerald-600", instruction: DEV_INSTRUCTION,
    infoBox: "Reclassificação anual da função motora grossa na PC, complementando o GMFCS (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Função motora (GMFCS) — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Função motora grossa", color: "text-teal-600 dark:text-teal-400", items: ["Controla a cabeça e o tronco","Senta-se com estabilidade","Faz transferências","Desloca-se pelo ambiente","Caminha em casa (conforme o nível)","Caminha na comunidade (conforme o nível)","Sobe e desce degraus","Tem a mobilidade necessária para a rotina"] }] },
  "j26-239": { icon: Activity, gradient: "from-cyan-500 to-blue-600", instruction: DEV_INSTRUCTION,
    infoBox: "Monitorização da amplitude de movimento pós-fisioterapia na PC (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Amplitude de movimento — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "ADM e contraturas", color: "text-cyan-600 dark:text-cyan-400", items: ["Boa amplitude de quadril","Boa amplitude de joelho","Boa amplitude de tornozelo","Boa amplitude de ombro","Boa amplitude de cotovelo e punho","Tem menos contraturas","Mantém o alongamento","Melhorou desde a última avaliação"] }] },
  "j26-240": { icon: Hand, gradient: "from-blue-500 to-indigo-600", instruction: DEV_INSTRUCTION,
    infoBox: "Evolução anual da função manual na PC, complementando o MACS (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Função manual (MACS) — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Função manual", color: "text-blue-600 dark:text-blue-400", items: ["Pega objetos","Manipula objetos pequenos","Usa as duas mãos juntas","Usa utensílios","Manuseia objetos do dia a dia","Tem destreza manual","Usa adaptações de forma efetiva","Tem função manual para a rotina"] }] },
  "j26-242": { icon: Activity, gradient: "from-emerald-500 to-teal-600", instruction: DEV_INSTRUCTION,
    infoBox: "Acompanhamento de postura e marcha na PC (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Postura e marcha — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Postura e marcha", color: "text-emerald-600 dark:text-emerald-400", items: ["Mantém a postura sentada","Mantém a postura em pé","Tem equilíbrio","Caminha (conforme o nível)","Tem simetria corporal","Faz transferências","Usa órteses de forma efetiva","Tem mobilidade funcional"] }] },
  "j26-243": { icon: Activity, gradient: "from-violet-500 to-purple-600", instruction:
      "Marque como está a criança após a aplicação, comparado a antes. Responda todos os itens.",
    infoBox: "Registro antes e depois da toxina botulínica na PC (maior = mais melhora). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Resposta à toxina botulínica (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Melhora após a aplicação", color: "text-violet-600 dark:text-violet-400", items: ["Reduziu o tônus","Melhorou a amplitude de movimento","Melhorou a postura","Melhorou a marcha","Reduziu a dor","Melhorou a função manual","Facilitou os cuidados","Houve melhora geral após a aplicação"] }] },
  "j26-244": { icon: Eye, gradient: "from-emerald-500 to-green-600", instruction: DEV_INSTRUCTION,
    infoBox: "Acompanhamento trimestral de fluência e compreensão de leitura pós-intervenção (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Leitura — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Leitura", color: "text-emerald-600 dark:text-emerald-400", items: ["Lê com mais fluência","Lê com precisão","Tem velocidade adequada","Entende o que lê","Respeita a pontuação","Reduziu trocas e omissões","Lê textos da série","Evoluiu desde a última avaliação"] }] },
  "j26-245": { icon: Hand, gradient: "from-teal-500 to-cyan-600", instruction: DEV_INSTRUCTION,
    infoBox: "Comparação de amostras de produção escrita ao longo do tempo (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Escrita — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Produção escrita", color: "text-teal-600 dark:text-teal-400", items: ["Letra mais legível","Menos erros ortográficos","Melhor organização do texto","Respeita linhas e margens","Escreve mais rápido","Compõe frases melhores","Menos rasuras","Evoluiu desde a última amostra"] }] },
  "j26-246": { icon: Sparkles, gradient: "from-cyan-500 to-blue-600", instruction: DEV_INSTRUCTION,
    infoBox: "Acompanhamento trimestral de matemática pós-intervenção psicopedagógica (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Matemática — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Matemática", color: "text-cyan-600 dark:text-cyan-400", items: ["Conta e compara quantidades","Faz operações básicas","Resolve problemas","Memoriza fatos numéricos","Entende conceitos","Acompanha a série","Tem menos ansiedade com matemática","Evoluiu desde a última avaliação"] }] },
  "j26-247": { icon: Sparkles, gradient: "from-blue-500 to-indigo-600", instruction: DEV_INSTRUCTION,
    infoBox: "Feedback escolar sobre a adaptação curricular e a adesão da escola (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Adaptação curricular — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Adaptação e adesão da escola", color: "text-blue-600 dark:text-blue-400", items: ["A escola adapta as atividades","A escola adapta as avaliações","O professor segue o plano","A criança acompanha com as adaptações","Há material adaptado","Há apoio do AEE","Há comunicação escola-família","As adaptações são efetivas no geral"] }] },
  "j26-248": { icon: ClipboardList, gradient: "from-emerald-500 to-teal-600", instruction: DEV_INSTRUCTION,
    infoBox: "Registro trimestral da evolução das metas do Plano Educacional Individualizado (maior = mais progresso). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Metas do PEI — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Metas do PEI", color: "text-emerald-600 dark:text-emerald-400", items: ["Metas claras definidas","Metas acadêmicas alcançadas","Metas sociais alcançadas","Metas de autonomia alcançadas","A equipe acompanha as metas","A família participa","O PEI é revisado periodicamente","Há progresso geral nas metas"] }] },
  "j26-260": { icon: ClipboardList, gradient: "from-emerald-500 to-teal-600", instruction: DEV_INSTRUCTION,
    infoBox: "Checklist de monitorização laboratorial periódica por medicação (maior = monitorização mais completa e em dia). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Monitorização laboratorial (maior = mais em dia)", bands: DEV_BANDS,
    domains: [{ name: "Exames de rotina em dia", color: "text-emerald-600 dark:text-emerald-400", items: ["Hemograma em dia","Função hepática em dia","Função renal em dia","Nível sérico da medicação em dia","Perfil metabólico (glicemia/lipídios) em dia","Eletrólitos em dia","Exames específicos da medicação em dia","Monitorização em dia no geral"] }] },

  // ===== Livres clássicas (domínio público) — itens reais, escore uniforme =====
  "ess-adol": {
    icon: Moon, gradient: "from-indigo-500 to-violet-600",
    instruction: "Qual a chance de você cochilar ou adormecer (não apenas se sentir cansado) nas situações abaixo, considerando seu dia a dia recente? Se não viveu alguma delas, imagine como reagiria.",
    infoBox: "Escala de Sonolência de Epworth (domínio público). Corte: 0–7 normal; 8–9 limítrofe; 10–15 sonolência diurna excessiva moderada; ≥16 intensa. Não substitui polissonografia.",
    labels: ["Nunca cochilaria", "Pequena chance", "Chance moderada", "Grande chance"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore Epworth (0–24)",
    bands: [
      { minPct: 0, classification: "Sonolência diurna normal", color: "emerald", description: "Escore 0–7: propensão ao sono diurno dentro do esperado." },
      { minPct: 33, classification: "Sonolência diurna limítrofe", color: "amber", description: "Escore 8–9: leve excesso de sonolência — vigiar higiene do sono." },
      { minPct: 41, classification: "Sonolência diurna excessiva (moderada)", color: "orange", description: "Escore 10–15: sonolência diurna excessiva — investigar causas (sono insuficiente, apneia, etc.)." },
      { minPct: 66, classification: "Sonolência diurna excessiva (intensa)", color: "red", description: "Escore ≥16: sonolência intensa — avaliação especializada do sono recomendada." },
    ],
    domains: [{ name: "Propensão ao sono diurno", color: "text-indigo-600 dark:text-indigo-400", items: [
      "Sentado(a) e lendo",
      "Assistindo à televisão",
      "Sentado(a), quieto(a), em um lugar público (sala de aula, cinema, reunião)",
      "Como passageiro(a) em um carro por uma hora, sem parar",
      "Deitado(a) para descansar à tarde, quando possível",
      "Sentado(a) conversando com alguém",
      "Sentado(a) quieto(a) após o almoço, sem ter bebido álcool",
      "No carro, parado(a) por alguns minutos no trânsito",
    ] }],
  },
  "mfq": {
    icon: Heart, gradient: "from-blue-500 to-indigo-600",
    instruction: "Pensando nas ÚLTIMAS DUAS SEMANAS, marque o quanto cada frase descreveu você (ou seu filho[a], se respondendo como cuidador).",
    infoBox: "Questionário de Humor e Sentimentos — versão curta (SMFQ, Angold & Costello; domínio público). Triagem de sintomas depressivos. Corte: ≥12 sugere possível depressão — confirmar com avaliação clínica. Não é diagnóstico.",
    labels: ["Não é verdade", "Às vezes verdade", "Verdade"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Escore SMFQ (0–26)",
    bands: [
      { minPct: 0, classification: "Sintomas mínimos", color: "emerald", description: "Escore <8: poucos sintomas depressivos nas últimas duas semanas." },
      { minPct: 30, classification: "Sintomas leves / subliminares", color: "amber", description: "Escore 8–11: monitorar e reavaliar; considerar contexto e estressores." },
      { minPct: 46, classification: "Possível depressão", color: "red", description: "Escore ≥12: triagem positiva — avaliação clínica para confirmar e conduzir." },
    ],
    domains: [{ name: "Humor e sentimentos (2 semanas)", color: "text-blue-600 dark:text-blue-400", items: [
      "Eu me senti muito triste ou infeliz",
      "Eu não consegui aproveitar nada (não senti prazer nas coisas)",
      "Eu me senti tão cansado(a) que fiquei só sentado(a) sem fazer nada",
      "Eu fiquei muito inquieto(a)",
      "Eu senti que não valia nada",
      "Eu chorei muito",
      "Eu tive dificuldade de pensar ou de me concentrar",
      "Eu não gostei de mim mesmo(a)",
      "Eu achei que eu era uma pessoa ruim",
      "Eu me senti sozinho(a)",
      "Eu pensei que ninguém me amava de verdade",
      "Eu achei que eu nunca seria tão bom(boa) quanto outras pessoas",
      "Eu senti que fazia tudo errado",
    ] }],
  },
  "asq-suicide": {
    icon: ShieldAlert, gradient: "from-rose-500 to-red-600",
    instruction: "Pergunte em particular, com acolhimento e sem julgamento. Marque conforme o relato do paciente.",
    infoBox: "ASQ — Ask Suicide-Screening Questions (NIMH; domínio público). QUALQUER 'Sim' nas 4 perguntas = triagem POSITIVA → conduzir avaliação de risco imediata (ex.: C-SSRS) e plano de segurança. Não é diagnóstico. Em risco iminente, acione emergência ou o CVV (188).",
    labels: ["Não", "Sim"],
    optionPoints: [0, 1],
    scoreDirection: "higher_worse",
    totalLabel: "Respostas afirmativas",
    bands: [
      { minPct: 0, classification: "Triagem negativa", color: "emerald", description: "Nenhum 'Sim' — sem indicação de risco nesta triagem. Reavaliar conforme o contexto clínico." },
      { minPct: 1, classification: "Triagem POSITIVA — avaliar risco agora", color: "red", description: "Pelo menos um 'Sim' — conduza avaliação de risco de suicídio imediata e plano de segurança; não deixe o paciente sozinho até avaliar." },
    ],
    domains: [{ name: "Perguntas de triagem (NIMH ASQ)", color: "text-rose-600 dark:text-rose-400", items: [
      "Nas últimas semanas, você desejou estar morto(a)?",
      "Nas últimas semanas, você sentiu que você ou sua família estariam melhor se você estivesse morto(a)?",
      "Na última semana, você teve pensamentos sobre se matar?",
      "Você já tentou se matar alguma vez?",
    ] }],
  },
  "cries13": {
    icon: ShieldAlert, gradient: "from-slate-500 to-rose-600",
    instruction: "Pensando no evento difícil/traumático, marque com que frequência cada coisa aconteceu com você na ÚLTIMA SEMANA.",
    infoBox: "CRIES-13 (Children's Revised Impact of Event Scale; domínio público). Pontuação 0/1/3/5. Regra de triagem validada: subescala de Intrusão + Evitação (8 itens) ≥ 17 indica risco de TEPT. A excitação complementa o quadro. Não é diagnóstico.",
    labels: ["Nunca", "Raramente", "Às vezes", "Frequentemente"],
    optionPoints: [0, 1, 3, 5],
    scoreDirection: "higher_worse",
    totalLabel: "Escore CRIES-13 (0–65)",
    bands: [
      { minPct: 0, classification: "Sintomas pós-traumáticos baixos", color: "emerald", description: "Poucos sintomas relatados na última semana. Reavaliar conforme contexto." },
      { minPct: 26, classification: "Sintomas pós-traumáticos moderados", color: "amber", description: "Atenção: ver subescala Intrusão+Evitação (≥17 = risco de TEPT)." },
      { minPct: 46, classification: "Sintomas pós-traumáticos elevados", color: "red", description: "Quadro sugestivo — avaliação especializada para TEPT recomendada." },
    ],
    domains: [
      { name: "Intrusão", color: "text-rose-600 dark:text-rose-400", items: [
        "Penso no evento mesmo sem querer", "Tenho imagens ou sonhos sobre o que aconteceu", "Sinto como se estivesse acontecendo de novo", "Fico aflito(a) quando algo me lembra do evento" ] },
      { name: "Evitação", color: "text-amber-600 dark:text-amber-400", items: [
        "Tento não pensar no que aconteceu", "Evito lugares ou coisas que me lembram do evento", "Tento apagar o evento da memória", "Evito falar sobre o assunto" ] },
      { name: "Excitação (arousal)", color: "text-orange-600 dark:text-orange-400", items: [
        "Fico mais irritado(a) ou com raiva", "Tenho dificuldade de me concentrar", "Durmo pior por causa disso", "Fico em alerta, como se algo ruim fosse acontecer", "Assusto-me com facilidade" ] },
    ],
  },
  "oci-cv": {
    icon: ClipboardList, gradient: "from-cyan-500 to-blue-600",
    instruction: "Marque com que frequência cada situação tem incomodado ou atrapalhado você no último mês.",
    infoBox: "OCI-CV (Obsessive-Compulsive Inventory — Child Version, Foa et al.; uso em pesquisa). 21 itens, 0–2, escore 0–42 em 6 dimensões. Maior = mais sintomas obsessivo-compulsivos. Triagem — não substitui avaliação clínica.",
    labels: ["Nunca", "Às vezes", "Sempre"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "Escore OCI-CV (0–42)",
    bands: [
      { minPct: 0, classification: "Sintomas mínimos", color: "emerald", description: "Poucos sintomas obsessivo-compulsivos relatados." },
      { minPct: 30, classification: "Sintomas moderados", color: "amber", description: "Sintomas presentes — avaliar impacto funcional e contexto." },
      { minPct: 48, classification: "Sintomas elevados", color: "red", description: "Quadro sugestivo de TOC — avaliação clínica especializada recomendada." },
    ],
    domains: [
      { name: "Lavar/limpar", color: "text-cyan-600 dark:text-cyan-400", items: ["Lavo as mãos mais vezes ou mais tempo que o necessário", "Preocupo-me muito com sujeira ou germes", "Tomo banho ou me limpo de forma exagerada"] },
      { name: "Verificar", color: "text-blue-600 dark:text-blue-400", items: ["Verifico portas, fogão ou luzes várias vezes", "Preciso conferir as coisas repetidamente", "Tenho medo de que algo ruim aconteça por minha culpa", "Peço para outras pessoas confirmarem que está tudo bem"] },
      { name: "Ordenar", color: "text-indigo-600 dark:text-indigo-400", items: ["Preciso que as coisas fiquem em ordem exata", "Fico aflito(a) se algo está fora do lugar", "Arrumo objetos até ficarem 'certos'"] },
      { name: "Obsessões", color: "text-violet-600 dark:text-violet-400", items: ["Tenho pensamentos ruins que voltam sem querer", "Tenho pensamentos que me assustam e não consigo parar", "Imagens ou ideias indesejadas surgem na minha cabeça", "Preciso pensar em algo 'bom' para neutralizar um pensamento ruim"] },
      { name: "Acumular", color: "text-fuchsia-600 dark:text-fuchsia-400", items: ["Tenho dificuldade de jogar coisas fora", "Guardo coisas que não preciso", "Fico aflito(a) só de pensar em descartar objetos"] },
      { name: "Neutralizar/repetir", color: "text-purple-600 dark:text-purple-400", items: ["Repito ações um número certo de vezes", "Conto coisas ou repito palavras mentalmente", "Faço rituais para me sentir 'em paz'", "Preciso refazer tarefas até parecerem certas"] },
    ],
  },
  "cats": {
    icon: ShieldAlert, gradient: "from-teal-500 to-emerald-600",
    instruction: "Após o evento difícil, marque com que frequência cada problema incomodou você no último mês.",
    infoBox: "CATS (Child and Adolescent Trauma Screen; domínio público). 20 sintomas pós-traumáticos, 0–3. Corte de triagem: escore total ≥ 21 (com prejuízo funcional) sugere estresse pós-traumático clinicamente relevante. Não é diagnóstico.",
    labels: ["Nunca", "Um pouco", "Bastante", "Quase sempre"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore CATS (0–60)",
    bands: [
      { minPct: 0, classification: "Abaixo do corte de triagem", color: "emerald", description: "Escore < 21: triagem negativa para estresse pós-traumático. Reavaliar conforme contexto." },
      { minPct: 35, classification: "Triagem positiva (≥ 21)", color: "red", description: "Escore ≥ 21: triagem positiva — avaliar TEPT e prejuízo funcional, com encaminhamento se indicado." },
    ],
    domains: [
      { name: "Reexperiência", color: "text-teal-600 dark:text-teal-400", items: ["Lembranças do evento que vêm sem eu querer", "Pesadelos sobre o evento", "Sentir como se o evento acontecesse de novo", "Ficar muito aflito(a) ao lembrar", "Reações no corpo ao lembrar (coração acelerado, suor)"] },
      { name: "Evitação", color: "text-cyan-600 dark:text-cyan-400", items: ["Evitar pensar ou falar sobre o evento", "Evitar pessoas, lugares ou coisas que lembrem o evento"] },
      { name: "Cognição e humor", color: "text-amber-600 dark:text-amber-400", items: ["Dificuldade de lembrar partes do evento", "Pensar que o mundo é muito perigoso", "Culpar a si mesmo(a) pelo que aconteceu", "Sentir-se triste, com medo ou com raiva quase sempre", "Perder o interesse por coisas de que gostava", "Sentir-se distante das pessoas", "Dificuldade de sentir emoções boas"] },
      { name: "Alerta", color: "text-orange-600 dark:text-orange-400", items: ["Ficar irritado(a) ou ter explosões de raiva", "Fazer coisas arriscadas ou se machucar", "Ficar muito vigilante, esperando algo ruim", "Assustar-se com facilidade", "Dificuldade de concentração", "Dificuldade para dormir"] },
    ],
  },
  "cpss-v": {
    icon: ShieldAlert, gradient: "from-slate-500 to-indigo-600",
    instruction: "Pensando no evento traumático, marque com que frequência cada problema incomodou você no ÚLTIMO MÊS.",
    infoBox: "CPSS-5 (Child PTSD Symptom Scale para DSM-5, Foa et al.; uso em pesquisa). 20 sintomas, 0–4. Corte de triagem: escore total ≥ 31 sugere TEPT provável. Não é diagnóstico.",
    labels: ["Nunca", "Uma vez/semana ou menos", "2–3x por semana", "4–5x por semana", "Quase todo dia"],
    optionPoints: [0, 1, 2, 3, 4],
    scoreDirection: "higher_worse",
    totalLabel: "Escore CPSS-5 (0–80)",
    bands: [
      { minPct: 0, classification: "Abaixo do corte", color: "emerald", description: "Escore < 31: triagem negativa para TEPT. Reavaliar conforme contexto." },
      { minPct: 20, classification: "Sintomas em monitorização", color: "amber", description: "Sintomas presentes — acompanhar evolução e prejuízo funcional." },
      { minPct: 39, classification: "TEPT provável (≥ 31)", color: "red", description: "Escore ≥ 31: triagem positiva — avaliação clínica especializada para TEPT." },
    ],
    domains: [
      { name: "Intrusão", color: "text-indigo-600 dark:text-indigo-400", items: ["Lembranças aflitivas que voltam sem querer", "Pesadelos sobre o evento", "Reviver o evento como se acontecesse de novo", "Aflição intensa ao lembrar", "Reações físicas ao lembrar (coração disparado, suor)"] },
      { name: "Evitação", color: "text-cyan-600 dark:text-cyan-400", items: ["Evitar pensamentos ou sentimentos sobre o evento", "Evitar lugares, pessoas ou coisas que lembrem o evento"] },
      { name: "Cognição e humor", color: "text-amber-600 dark:text-amber-400", items: ["Dificuldade de lembrar partes importantes do evento", "Crenças negativas sobre si, os outros ou o mundo", "Culpar a si mesmo(a) ou aos outros pelo ocorrido", "Sentir-se mal (medo, raiva, culpa, vergonha) quase sempre", "Perda de interesse em atividades", "Sentir-se distante das pessoas", "Dificuldade de sentir emoções positivas"] },
      { name: "Alerta e reatividade", color: "text-orange-600 dark:text-orange-400", items: ["Irritabilidade ou explosões de raiva", "Comportamento imprudente ou autodestrutivo", "Estar excessivamente vigilante", "Sobressaltar-se com facilidade", "Dificuldade de concentração", "Dificuldade para dormir"] },
    ],
  },
  "docs": {
    icon: ClipboardList, gradient: "from-cyan-500 to-teal-600",
    instruction: "Nos ÚLTIMOS 30 DIAS, o quanto cada tipo de pensamento/comportamento obsessivo-compulsivo afetou você?",
    infoBox: "DOCS (Dimensional Obsessive-Compulsive Scale; uso em pesquisa). 20 itens, 0–4, em 4 dimensões (5 itens cada: tempo, evitação, sofrimento, dificuldade de ignorar, interferência). Maior = mais grave. Triagem — não é diagnóstico.",
    labels: ["Nenhum", "Leve", "Moderado", "Grave", "Extremo"],
    optionPoints: [0, 1, 2, 3, 4],
    scoreDirection: "higher_worse",
    totalLabel: "Escore DOCS (0–80)",
    bands: [
      { minPct: 0, classification: "Sintomas mínimos", color: "emerald", description: "Pouco impacto obsessivo-compulsivo no último mês." },
      { minPct: 25, classification: "Sintomas moderados", color: "amber", description: "Impacto presente — avaliar prejuízo e contexto." },
      { minPct: 45, classification: "Sintomas graves", color: "red", description: "Impacto importante — avaliação clínica especializada para TOC recomendada." },
    ],
    domains: [
      { name: "Contaminação", color: "text-cyan-600 dark:text-cyan-400", items: ["Tempo gasto com medo de contaminação/limpeza", "Evitação por medo de germes/sujeira", "Sofrimento causado por esses medos", "Dificuldade de ignorar pensamentos de contaminação", "Interferência na rotina por causa disso"] },
      { name: "Responsabilidade por dano/erro", color: "text-blue-600 dark:text-blue-400", items: ["Tempo gasto verificando para evitar danos", "Evitação de situações por medo de causar erro", "Sofrimento com a possibilidade de algo dar errado", "Dificuldade de parar de verificar", "Interferência na rotina pelas verificações"] },
      { name: "Pensamentos inaceitáveis", color: "text-violet-600 dark:text-violet-400", items: ["Tempo tomado por pensamentos indesejados/intrusivos", "Evitação de gatilhos desses pensamentos", "Sofrimento causado por esses pensamentos", "Dificuldade de afastá-los da mente", "Interferência na rotina por causa deles"] },
      { name: "Simetria/incompletude", color: "text-fuchsia-600 dark:text-fuchsia-400", items: ["Tempo gasto ordenando até parecer 'certo'", "Evitação de deixar coisas fora de ordem", "Sofrimento quando algo está 'incompleto'", "Dificuldade de ignorar a necessidade de simetria", "Interferência na rotina por arrumar/repetir"] },
    ],
  },
  "ace": {
    icon: ShieldAlert, gradient: "from-amber-500 to-rose-600",
    instruction: "Antes dos 18 anos, alguma destas experiências aconteceu? Responda com acolhimento e sigilo. (Sim/Não)",
    infoBox: "ACE — Adverse Childhood Experiences (Felitti et al.; domínio público). 10 itens sim/não. Escore = nº de adversidades. ≥ 4 indica risco elevado para desfechos de saúde — abrir conversa de cuidado e proteção. Não é diagnóstico.",
    labels: ["Não", "Sim"],
    optionPoints: [0, 1],
    scoreDirection: "higher_worse",
    totalLabel: "Escore ACE (0–10)",
    bands: [
      { minPct: 0, classification: "Baixa exposição (0–1)", color: "emerald", description: "Poucas adversidades relatadas. Manter cuidado preventivo." },
      { minPct: 20, classification: "Exposição moderada (2–3)", color: "amber", description: "Adversidades presentes — atenção a fatores de proteção e suporte." },
      { minPct: 40, classification: "Exposição elevada (≥ 4)", color: "red", description: "Risco elevado para desfechos de saúde física e mental — abordagem de cuidado, rede de apoio e proteção." },
    ],
    domains: [
      { name: "Abuso", color: "text-rose-600 dark:text-rose-400", items: ["Abuso emocional recorrente (humilhações, ameaças)", "Abuso físico (agressão que machucou)", "Abuso sexual"] },
      { name: "Negligência", color: "text-amber-600 dark:text-amber-400", items: ["Negligência emocional (não se sentir amado/apoiado)", "Negligência física (faltou comida, cuidado ou proteção)"] },
      { name: "Disfunção familiar", color: "text-orange-600 dark:text-orange-400", items: ["Separação ou divórcio dos pais", "Violência contra a mãe/cuidadora", "Convívio com uso problemático de álcool/drogas", "Convívio com doença mental ou tentativa de suicídio na família", "Familiar preso"] },
    ],
  },
  "cybocs-sr": {
    icon: ClipboardList, gradient: "from-blue-500 to-violet-600",
    instruction: "Pensando na ÚLTIMA SEMANA, avalie o quanto as obsessões (pensamentos) e compulsões (rituais) têm afetado você.",
    infoBox: "CY-BOCS — autorrelato (Children's Yale-Brown Obsessive Compulsive Scale; uso em pesquisa). 10 itens de gravidade (5 obsessões + 5 compulsões), 0–4. Faixas: 0–7 subclínico · 8–15 leve · 16–23 moderado · 24–31 grave · 32–40 extremo. Triagem/monitorização — não é diagnóstico.",
    labels: ["Nenhum", "Leve", "Moderado", "Grave", "Extremo"],
    optionPoints: [0, 1, 2, 3, 4],
    scoreDirection: "higher_worse",
    totalLabel: "Escore CY-BOCS (0–40)",
    bands: [
      { minPct: 0, classification: "Subclínico (0–7)", color: "emerald", description: "Sintomas mínimos no período." },
      { minPct: 20, classification: "Leve (8–15)", color: "amber", description: "Sintomas leves — monitorar." },
      { minPct: 40, classification: "Moderado (16–23)", color: "orange", description: "Impacto moderado — avaliação clínica indicada." },
      { minPct: 60, classification: "Grave a extremo (≥ 24)", color: "red", description: "Impacto importante — avaliação especializada e plano terapêutico." },
    ],
    domains: [
      { name: "Obsessões (pensamentos)", color: "text-blue-600 dark:text-blue-400", items: ["Tempo ocupado por obsessões", "Interferência das obsessões na rotina", "Sofrimento causado pelas obsessões", "Esforço para resistir às obsessões", "Controle sobre as obsessões"] },
      { name: "Compulsões (rituais)", color: "text-violet-600 dark:text-violet-400", items: ["Tempo gasto com compulsões", "Interferência das compulsões na rotina", "Aflição se impedido(a) de realizar o ritual", "Esforço para resistir às compulsões", "Controle sobre as compulsões"] },
    ],
  },
  "gad7": {
    icon: Activity, gradient: "from-amber-500 to-orange-600",
    instruction: "Nas ÚLTIMAS 2 SEMANAS, com que frequência você foi incomodado(a) por cada um dos problemas abaixo?",
    infoBox: "GAD-7 (Generalized Anxiety Disorder 7-item, Spitzer et al.; domínio público). Escore 0–21. Faixas: 0–4 mínima · 5–9 leve · 10–14 moderada · 15–21 grave. Corte ≥10 = ansiedade clinicamente significativa. Não é diagnóstico.",
    labels: ["Nenhuma vez", "Vários dias", "Mais da metade dos dias", "Quase todos os dias"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "Escore GAD-7 (0–21)",
    bands: [
      { minPct: 0, classification: "Ansiedade mínima", color: "emerald", description: "Escore 0–4: sintomas mínimos de ansiedade." },
      { minPct: 23, classification: "Ansiedade leve", color: "amber", description: "Escore 5–9: ansiedade leve — monitorar." },
      { minPct: 47, classification: "Ansiedade moderada", color: "orange", description: "Escore 10–14: avaliação clínica recomendada." },
      { minPct: 71, classification: "Ansiedade grave", color: "red", description: "Escore 15–21: ansiedade grave — avaliação e manejo especializados." },
    ],
    domains: [{ name: "Sintomas de ansiedade (2 semanas)", color: "text-amber-600 dark:text-amber-400", items: [
      "Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)",
      "Não conseguir parar ou controlar as preocupações",
      "Preocupar-se demais com diferentes coisas",
      "Dificuldade para relaxar",
      "Ficar tão agitado(a) que se torna difícil permanecer parado(a)",
      "Ficar facilmente aborrecido(a) ou irritado(a)",
      "Sentir medo, como se algo terrível fosse acontecer",
    ] }],
  },
  "scoff": {
    icon: Heart, gradient: "from-pink-500 to-rose-600",
    instruction: "Responda com sinceridade às 5 perguntas abaixo (Sim/Não).",
    infoBox: "SCOFF (Morgan et al., 1999; domínio público). Triagem de transtornos alimentares. ≥ 2 respostas 'Sim' = rastreio positivo → avaliação clínica adicional. Não é diagnóstico.",
    labels: ["Não", "Sim"],
    optionPoints: [0, 1],
    scoreDirection: "higher_worse",
    totalLabel: "Respostas afirmativas (0–5)",
    bands: [
      { minPct: 0, classification: "Rastreio negativo", color: "emerald", description: "0–1 'Sim': baixa probabilidade de transtorno alimentar nesta triagem." },
      { minPct: 40, classification: "Rastreio POSITIVO (≥ 2)", color: "red", description: "≥ 2 'Sim': avaliação clínica para transtorno alimentar recomendada." },
    ],
    domains: [{ name: "Triagem SCOFF", color: "text-rose-600 dark:text-rose-400", items: [
      "Você se faz vomitar porque se sente desconfortavelmente cheio(a)?",
      "Você se preocupa por ter perdido o controle sobre o quanto come?",
      "Você perdeu mais de 6 kg em um período de cerca de 3 meses?",
      "Você acredita estar gordo(a) mesmo quando os outros dizem que está magro(a)?",
      "Você diria que a comida domina sua vida?",
    ] }],
  },
  "who5": {
    icon: Heart, gradient: "from-emerald-500 to-teal-600",
    instruction: "Pensando nas ÚLTIMAS DUAS SEMANAS, marque com que frequência cada frase descreveu você.",
    infoBox: "WHO-5 — Índice de Bem-Estar da OMS (domínio público). Escore bruto 0–25 (×4 = 0–100). Escore <13 (de 25) rastreia baixo bem-estar / possível depressão — considerar avaliação. Não é diagnóstico.",
    labels: ["Em nenhum momento", "De vez em quando", "Menos da metade do tempo", "Mais da metade do tempo", "Na maior parte do tempo", "O tempo todo"],
    optionPoints: [0, 1, 2, 3, 4, 5],
    scoreDirection: "higher_better",
    totalLabel: "Bem-estar WHO-5 (0–25)",
    bands: [
      { minPct: 0, classification: "Bem-estar reduzido — rastrear depressão", color: "red", description: "Escore <13 (de 25): baixo bem-estar — considerar avaliação de humor/depressão." },
      { minPct: 52, classification: "Bem-estar moderado", color: "amber", description: "Escore 13–17: bem-estar intermediário — acompanhar." },
      { minPct: 72, classification: "Bem-estar bom", color: "emerald", description: "Escore ≥18: bom bem-estar psicológico no período." },
    ],
    domains: [{ name: "Bem-estar psicológico (2 semanas)", color: "text-emerald-600 dark:text-emerald-400", items: [
      "Tenho me sentido alegre e de bom humor",
      "Tenho me sentido calmo(a) e relaxado(a)",
      "Tenho me sentido ativo(a) e com energia",
      "Tenho acordado me sentindo descansado(a) e revigorado(a)",
      "Meu dia a dia tem sido cheio de coisas que me interessam",
    ] }],
  },
  "ita-adultos": {
    icon: Sparkles, gradient: "from-violet-500 to-fuchsia-600",
    instruction: "Para cada frase, marque o quanto ela descreve como você se sente ou age, com base nas suas experiências. Não há resposta certa ou errada.",
    infoBox: "Inventário de Traços Autísticos — Adultos (inspirado no AQ). 50 itens, 5 áreas, escore 50–250. Faixas: 200–250 alta · 150–199 moderada · 100–149 baixa · 50–99 muito baixa presença de traços. Triagem — NÃO substitui diagnóstico (DSM-5/CID-11).",
    labels: ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"],
    optionPoints: [1, 2, 3, 4, 5],
    scoreDirection: "higher_worse",
    totalLabel: "Escore total (50–250)",
    bands: [
      { minPct: 0, classification: "Presença muito baixa de traços", color: "emerald", description: "Poucos traços do espectro relatados no período." },
      { minPct: 40, classification: "Presença baixa de traços", color: "amber", description: "Alguns traços presentes, abaixo do limiar de preocupação." },
      { minPct: 60, classification: "Presença moderada de traços", color: "orange", description: "Traços relevantes — acompanhamento e observação recomendados." },
      { minPct: 80, classification: "Presença alta de traços", color: "red", description: "Traços intensos — avaliação aprofundada com instrumentos diagnósticos formais." },
    ],
    domains: [
      { name: "Interação social", color: "text-violet-600 dark:text-violet-400", items: [
        "Eu me sinto desconfortável em situações sociais, mesmo quando estou rodeado de pessoas conhecidas.",
        "Eu evito falar com pessoas que não conheço bem, mesmo que haja uma oportunidade de interação.",
        "Eu tenho dificuldades para entender se alguém está interessado ou não no que estou dizendo.",
        "Costumo sentir que as pessoas estão me observando de forma crítica em ambientes sociais.",
        "Muitas vezes, eu me sinto ansioso antes de eventos sociais, mesmo sabendo que são importantes.",
        "Prefiro interagir com um pequeno número de pessoas, em vez de grandes grupos.",
        "Eu tenho dificuldade em entender as piadas ou sarcasmo de outras pessoas.",
        "Em grupos, frequentemente me sinto deslocado ou fora de lugar.",
        "Evito fazer novas amizades, mesmo quando as oportunidades aparecem.",
        "Eu tenho dificuldades em expressar meus sentimentos em uma conversa social.",
      ] },
      { name: "Comunicação", color: "text-fuchsia-600 dark:text-fuchsia-400", items: [
        "Eu tenho dificuldades para entender as emoções dos outros através de expressões faciais.",
        "Quando estou conversando, posso achar difícil manter o fluxo da conversa.",
        "Eu frequentemente falo sobre meus próprios interesses sem perceber que os outros não estão tão envolvidos.",
        "Eu tenho dificuldade para saber quando é apropriado fazer uma pausa em uma conversa.",
        "Eu sou muito direto e, às vezes, sinto que as pessoas acham isso insensível.",
        "Eu fico incerto sobre como lidar com o silêncio em uma conversa.",
        "Em situações sociais, tenho dificuldades para compreender piadas e humor.",
        "Eu me sinto mais confortável em comunicar-me por mensagens escritas do que pessoalmente.",
        "Frequentemente, não entendo as nuances de um tom de voz e como ele altera a mensagem.",
        "Eu tenho dificuldades em fazer elogios ou expressar apreciação em uma conversa.",
      ] },
      { name: "Imaginatividade", color: "text-purple-600 dark:text-purple-400", items: [
        "Prefiro atividades práticas e objetivas em vez de jogos criativos ou imaginativos.",
        "Eu me sinto mais confortável com tarefas estruturadas e com regras claras do que com tarefas abertas e criativas.",
        "Eu raramente invento histórias ou crio cenários imaginários.",
        "Eu sou mais interessado em fatos concretos do que em ideias abstratas ou filosóficas.",
        "Eu encontro mais prazer em resolver problemas práticos do que em atividades criativas ou artísticas.",
        "Eu tenho uma tendência a ser muito literal e ter dificuldades para entender significados figurados ou metafóricos.",
        "Eu me sinto mais confortável com uma rotina fixa do que com atividades espontâneas e criativas.",
        "Eu tenho dificuldade em planejar atividades ou eventos que não sigam uma estrutura pré-determinada.",
        "Eu sou mais produtivo quando trabalho com instruções claras e metas específicas, em vez de trabalhar em um projeto criativo.",
        "Eu não gosto de jogos ou atividades que exijam imaginação ou fantasia.",
      ] },
      { name: "Atenção a detalhes", color: "text-blue-600 dark:text-blue-400", items: [
        "Eu sou capaz de perceber detalhes em ambientes ou situações que outras pessoas podem não notar.",
        "Eu fico incomodado com falhas ou imperfeições em coisas que outras pessoas podem ignorar.",
        "Eu consigo organizar objetos ou informações de uma maneira extremamente detalhada.",
        "Eu noto padrões e repetições em situações que outras pessoas não percebem.",
        "Eu prefiro atividades que envolvem atenção aos detalhes, como quebra-cabeças ou tarefas de precisão.",
        "Eu tenho facilidade para memorizar pequenos detalhes de eventos passados.",
        "Eu sou meticuloso na revisão de informações ou documentos para detectar erros.",
        "Eu fico irritado quando as coisas não estão organizadas ou arrumadas de maneira detalhada.",
        "Quando observo algo, sou capaz de identificar pequenas discrepâncias que outros não percebem.",
        "Eu sou mais eficiente quando sou capaz de focar nos detalhes ao realizar tarefas.",
      ] },
      { name: "Mudanças de rotina e flexibilidade", color: "text-cyan-600 dark:text-cyan-400", items: [
        "Eu me sinto desconfortável quando minha rotina diária é alterada inesperadamente.",
        "Eu preciso de tempo para me adaptar a novas situações ou mudanças de planos.",
        "Eu tenho dificuldade em mudar de atividades ou tarefas, mesmo quando a mudança é necessária.",
        "Eu fico ansioso quando as coisas não acontecem como esperado.",
        "Eu prefiro manter as coisas do mesmo jeito e evito mudanças sempre que possível.",
        "Quando enfrento mudanças, sinto que preciso de mais tempo do que outras pessoas para me ajustar.",
        "Eu tenho dificuldades em improvisar ou ser flexível quando algo não sai como planejado.",
        "Eu me sinto frustrado quando preciso mudar a minha forma de fazer as coisas.",
        "Eu me estresso mais do que outras pessoas quando enfrento imprevistos ou alterações no plano.",
        "Eu sou mais produtivo quando sigo uma rotina estruturada e preestabelecida.",
      ] },
    ],
  },
};

// ------------------------------------------------------------
// ATEC — Autism Treatment Evaluation Checklist (Rimland & Edelson,
// Autism Research Institute). Formato de MONITORAMENTO adaptado: cada item é
// avaliado pelo GRAU DE PREOCUPAÇÃO/DIFICULDADE atual (0 = sem preocupação /
// faz bem; 3 = intensa / sempre), de modo que MAIOR pontuação = MAIOR
// preocupação em todos os domínios. Faixas por % do escore (triagem/
// acompanhamento — não é diagnóstico nem o escore ponderado oficial).
// ------------------------------------------------------------
const ATEC_LABELS = ["Sem preocupação / faz bem", "Leve", "Moderada", "Intensa / sempre"];
const ATEC_BANDS: InteractiveBand[] = [
  { minPct: 40, classification: "Suspeita alta", color: "red", description: "Muitos sinais presentes com intensidade relevante. Priorize avaliação diagnóstica estruturada e suporte." },
  { minPct: 20, classification: "Suspeita moderada", color: "amber", description: "Sinais presentes em vários domínios. Aprofundar com instrumentos específicos e observação em múltiplos contextos." },
  { minPct: 0, classification: "Baixa suspeita", color: "emerald", description: "Poucos sinais ou de baixa intensidade neste momento. Reavaliar se surgirem novas preocupações." },
];
const atecItems: Record<string, InteractiveScaleDef> = {
  atec: {
    instruction: "Para cada item, marque o GRAU DE PREOCUPAÇÃO ou DIFICULDADE que você observa na criança hoje. Considere diferentes contextos (casa, escola, comunidade). Maior pontuação indica maior preocupação.",
    infoBox: "Formato de monitoramento adaptado do ATEC (Autism Treatment Evaluation Checklist — Rimland & Edelson, Autism Research Institute). Instrumento de triagem e acompanhamento de resposta ao longo do tempo — não substitui avaliação diagnóstica nem reproduz o escore ponderado oficial.",
    labels: ATEC_LABELS,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "grau global de preocupação",
    bands: ATEC_BANDS,
    domains: [
      { name: "I. Fala / Linguagem / Comunicação", color: "text-blue-600 dark:text-blue-400", items: [
        "Sabe o próprio nome",
        "Responde ao \"sim\" e ao \"não\"",
        "Segue alguns comandos",
        "Usa uma palavra por vez (ex.: \"não\", \"comer\", \"água\")",
        "Usa duas palavras juntas (ex.: \"quero ir\")",
        "Usa três palavras juntas (ex.: \"não quero leite\")",
        "Sabe 10 ou mais palavras",
        "Usa frases com 4 ou mais palavras",
        "Explica o que quer",
        "Faz perguntas com sentido",
        "Fala de forma significativa e relevante",
        "Usa frases sucessivas / encadeadas",
        "Mantém uma boa conversa",
        "Comunica-se normalmente para a idade",
      ] },
      { name: "II. Sociabilidade", color: "text-violet-600 dark:text-violet-400", items: [
        "Parece fechado, difícil de alcançar",
        "Ignora as outras pessoas",
        "Presta pouca ou nenhuma atenção quando abordado",
        "Pouco cooperativo e resistente",
        "Pouco ou nenhum contato visual",
        "Prefere ficar sozinho",
        "Demonstra pouca afeição",
        "Não cumprimenta os pais",
        "Evita contato com os outros",
        "Não imita",
        "Não gosta de ser segurado / aconchegado",
        "Não compartilha nem mostra coisas aos outros",
        "Não acena \"tchau\"",
        "Desobediente / opositor",
        "Faz birras",
        "Falta de amigos / companheiros",
        "Raramente sorri",
        "Insensível aos sentimentos dos outros",
        "Indiferente a ser querido",
        "Indiferente quando os pais saem",
      ] },
      { name: "III. Consciência sensorial / cognitiva", color: "text-teal-600 dark:text-teal-400", items: [
        "Responde ao próprio nome",
        "Reage ao elogio",
        "Olha para pessoas e animais",
        "Olha para fotos e TV",
        "Desenha, pinta, usa cores",
        "Brinca de forma apropriada com os brinquedos",
        "Tem expressões faciais apropriadas ao contexto",
        "Compreende histórias na TV",
        "Compreende explicações",
        "Tem noção do ambiente ao redor",
        "Tem noção de perigo",
        "Demonstra imaginação",
        "Inicia atividades por conta própria",
        "Veste-se sozinho",
        "É curioso e interessado",
        "É aventureiro, explorador",
        "Vive num mundo à parte",
      ] },
      { name: "IV. Saúde / Comportamento", color: "text-amber-600 dark:text-amber-400", items: [
        "Faz xixi na cama",
        "Faz xixi nas calças / fraldas",
        "Evacua nas calças / fraldas",
        "Diarreia",
        "Prisão de ventre",
        "Problemas de sono",
        "Come demais ou de menos",
        "Dieta extremamente restrita",
        "Hiperativo",
        "Letárgico / apático",
        "Machuca a si mesmo",
        "Machuca os outros",
        "Destrutivo",
        "Sensível ao som",
        "Ansioso / medroso",
        "Triste / choroso",
        "Convulsões",
        "Fala / linguagem obsessiva",
        "Rotinas rígidas",
        "Grita",
        "Exige que as coisas sejam sempre do mesmo jeito",
        "Fica agitado com frequência",
        "Insensível à dor",
        "Obcecado por certos objetos ou temas",
        "Faz gestos / movimentos repetitivos",
      ] },
    ],
  },
};

// ------------------------------------------------------------
// AQ-10 Adolescente — triagem rápida de traços do espectro autista (12–16a),
// baseada no Autism Spectrum Quotient (Allison, Auyeung & Baron-Cohen, 2012).
// Itens operacionalizados em redação própria, todos no MESMO sentido (concordar/
// "Sim" = traço presente), de modo que a soma binária é direta e o corte ≥6/10
// mantém sentido clínico. Triagem — não diagnóstico.
// ------------------------------------------------------------
const AQ10_LABELS = ["Não / discordo", "Sim / concordo"];
const AQ10_BANDS: InteractiveBand[] = [
  { minPct: 60, classification: "Rastreio positivo (≥6/10)", color: "red", description: "Vários traços presentes. Sugere encaminhamento para avaliação diagnóstica especializada do espectro autista." },
  { minPct: 30, classification: "Alguns traços (3–5/10)", color: "amber", description: "Presença parcial de traços. Reavaliar com história, observação e instrumentos complementares." },
  { minPct: 0, classification: "Baixa probabilidade (0–2/10)", color: "emerald", description: "Poucos traços neste rastreio. Manter atenção clínica se houver preocupação persistente." },
];
const aq10Items: Record<string, InteractiveScaleDef> = {
  "aq10-adolescente": {
    instruction: "Rastreio rápido de traços do espectro autista em adolescentes. Para cada afirmação, marque se descreve o adolescente. Pode ser respondido pelo próprio adolescente ou por um cuidador que o conhece bem.",
    infoBox: "Baseado no AQ-10 Adolescente (Allison, Auyeung & Baron-Cohen, 2012). Itens em redação própria para triagem. Corte ≥6/10 sugere encaminhamento para avaliação — não é diagnóstico.",
    labels: AQ10_LABELS,
    optionPoints: [0, 1],
    scoreDirection: "higher_worse",
    totalLabel: "traços presentes (0–10)",
    bands: AQ10_BANDS,
    domains: [
      { name: "AQ-10 Adolescente", color: "text-violet-600 dark:text-violet-400", items: [
        "Percebe pequenos sons, padrões ou detalhes que a maioria das pessoas não nota",
        "Tende a focar tanto em detalhes que perde a visão do todo",
        "Acha difícil perceber a intenção de alguém apenas pela expressão facial ou tom de voz",
        "Tem dificuldade em manter uma conversa de ida-e-volta, com trocas fluidas",
        "Percebe com dificuldade quando o outro está perdendo o interesse na conversa",
        "Interpreta frases de forma muito literal (dificuldade com ironia, piadas ou duplo sentido)",
        "Tem dificuldade em imaginar situações ou entrar em brincadeiras de faz-de-conta / ficção",
        "Prefere fazer as coisas sempre da mesma maneira e incomoda-se com mudanças de rotina",
        "Tem dificuldade em fazer ou manter amizades com colegas da mesma idade",
        "Tem interesses muito intensos e restritos que ocupam grande parte do tempo",
      ] },
    ],
  },
};

// ------------------------------------------------------------
// LOTE 1 de escalas gratuitas que estavam só como ficha (agora preenchíveis).
// Instrumentos de domínio público / uso livre; itens em redação clínica própria
// (critérios objetivos), com a fonte creditada. Triagem — não diagnóstico.
// ------------------------------------------------------------
const P012_LABELS = ["0 ponto", "1 ponto", "2 pontos"];
const freeBatch1Items: Record<string, InteractiveScaleDef> = {
  apgar: {
    instruction: "Avalie o recém-nascido no 1º e no 5º minuto de vida. Some os 5 componentes (0–10). Maior pontuação = melhor vitalidade.",
    infoBox: "APGAR (Virginia Apgar, 1953) — domínio público. Avaliação de vitalidade ao nascer; repita no 1º, 5º (e 10º) minuto. Não substitui o julgamento neonatal.",
    labels: P012_LABELS,
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_better",
    totalLabel: "vitalidade (0–10)",
    bands: [
      { minPct: 70, classification: "Boa vitalidade (7–10)", color: "emerald", description: "Recém-nascido vigoroso. Cuidados de rotina; reavaliar no 5º minuto." },
      { minPct: 40, classification: "Depressão moderada (4–6)", color: "amber", description: "Depressão moderada. Estimulação, aquecimento e assistência conforme protocolo de reanimação neonatal." },
      { minPct: 0, classification: "Depressão grave (0–3)", color: "red", description: "Depressão grave. Reanimação neonatal imediata." },
    ],
    domains: [
      { name: "Componentes APGAR", color: "text-rose-600 dark:text-rose-400", items: [
        "Frequência cardíaca — 0: ausente · 1: menor que 100 bpm · 2: 100 bpm ou mais",
        "Esforço respiratório — 0: ausente · 1: irregular ou choro fraco · 2: choro forte, respiração regular",
        "Tônus muscular — 0: flácido · 1: alguma flexão de extremidades · 2: movimento ativo, boa flexão",
        "Irritabilidade reflexa — 0: sem resposta ao estímulo · 1: careta · 2: choro, tosse ou espirro",
        "Cor da pele — 0: cianótico ou pálido · 1: corpo rosado com extremidades azuladas · 2: totalmente rosado",
      ] },
    ],
  },
  cries: {
    instruction: "Avalie os 5 sinais de dor pós-operatória no recém-nascido/lactente. Some (0–10). Maior pontuação = mais dor.",
    infoBox: "CRIES (Krechel SW & Bildner J, 1995) — instrumento de uso livre. Dor pós-operatória neonatal; reavaliar em série. Itens em redação própria; não substitui avaliação clínica.",
    labels: P012_LABELS,
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_worse",
    totalLabel: "dor (0–10)",
    bands: [
      { minPct: 70, classification: "Dor severa (≥7)", color: "red", description: "Dor intensa. Intervenção analgésica e reavaliação precoce." },
      { minPct: 30, classification: "Dor moderada (4–6)", color: "amber", description: "Dor moderada. Considerar analgesia e medidas de conforto." },
      { minPct: 0, classification: "Dor mínima/ausente (0–3)", color: "emerald", description: "Sem dor significativa. Manter conforto e observação." },
    ],
    domains: [
      { name: "Sinais CRIES", color: "text-amber-600 dark:text-amber-400", items: [
        "Choro — 0: ausente ou não agudo · 1: agudo, mas consolável · 2: agudo e inconsolável",
        "Necessidade de oxigênio para SatO₂ acima de 95% — 0: não · 1: até 30% · 2: mais de 30%",
        "Aumento de sinais vitais (FC e PA) — 0: iguais ou abaixo do basal · 1: aumento de até 20% · 2: aumento acima de 20%",
        "Expressão facial — 0: relaxada/neutra · 1: careta · 2: careta com grunhido",
        "Sono nas últimas horas — 0: dorme normalmente · 1: desperta em intervalos frequentes · 2: permanece acordado",
      ] },
    ],
  },
  "eva-ped": {
    instruction: "Peça à criança para indicar a intensidade da dor de 0 (sem dor) a 10 (pior dor imaginável). Requer compreensão abstrata — a partir de ~7 anos.",
    infoBox: "Escala Visual Analógica adaptada. Autorrelato de dor; combine com observação quando a criança não conseguir abstrair a régua de 0–10.",
    labels: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    optionPoints: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    scoreDirection: "higher_worse",
    totalLabel: "intensidade da dor (0–10)",
    bands: [
      { minPct: 70, classification: "Dor intensa (7–10)", color: "red", description: "Dor intensa. Analgesia e reavaliação." },
      { minPct: 40, classification: "Dor moderada (4–6)", color: "orange", description: "Dor moderada. Considerar analgesia e medidas de conforto." },
      { minPct: 10, classification: "Dor leve (1–3)", color: "amber", description: "Dor leve. Medidas de conforto e observação." },
      { minPct: 0, classification: "Sem dor (0)", color: "emerald", description: "Sem dor relatada no momento." },
    ],
    domains: [
      { name: "Intensidade da dor", color: "text-rose-600 dark:text-rose-400", items: [
        "Intensidade da dor agora (0 = sem dor · 10 = pior dor imaginável)",
      ] },
    ],
  },
  dvss: {
    instruction: "Pensando no último mês, marque a frequência de cada situação. Some (0–30). Maior pontuação = mais sintomas de disfunção miccional.",
    infoBox: "DVSS — Dysfunctional Voiding Symptom Score (Farhat W et al., 2000), uso livre. Itens em redação própria. Cortes de referência aproximados: meninos ≥9 e meninas ≥6 sugerem disfunção miccional — confirmar clinicamente. Triagem, não diagnóstico.",
    labels: ["Quase nunca (0)", "Menos da metade das vezes (1)", "Cerca de metade das vezes (2)", "Quase sempre (3)"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "sintomas miccionais (0–30)",
    bands: [
      { minPct: 30, classification: "Acima do corte de referência", color: "red", description: "Sintomas relevantes — investigar disfunção miccional (confira o corte por sexo). Orientar hábito miccional/intestinal." },
      { minPct: 15, classification: "Sintomas leves/limítrofes", color: "amber", description: "Sintomas leves. Reforçar hidratação, rotina miccional e tratar constipação; reavaliar." },
      { minPct: 0, classification: "Poucos sintomas", color: "emerald", description: "Poucos sintomas miccionais neste período." },
    ],
    domains: [
      { name: "Sintomas do último mês", color: "text-cyan-600 dark:text-cyan-400", items: [
        "Escapou urina na roupa durante o dia",
        "Quando escapa, molha a roupa íntima (poucas gotas) sem perceber",
        "Sente vontade súbita e precisa correr ao banheiro (urgência)",
        "Faz manobras para segurar (cruza as pernas, agacha, aperta a região)",
        "Precisa fazer força ou empurrar para começar a urinar",
        "Urina poucas vezes ao dia (1 a 2 vezes)",
        "Sente dor ou ardência ao urinar",
        "Tem evacuação difícil, endurecida ou infrequente (constipação)",
        "Adia ir ao banheiro / segura o xixi o máximo possível",
        "Passou por situação estressante recente (mudança, escola, família)",
      ] },
    ],
  },
};

// ------------------------------------------------------------
// LOTE 2 — classificações funcionais do CanChild (família GMFCS), uso livre
// com citação. Item único: seleção do nível funcional (I–V). Níveis descritos
// em redação clínica própria; fonte creditada. Apoio à classificação, não
// diagnóstico. Maior nível = maior limitação.
// ------------------------------------------------------------
// 5 faixas monotônicas I→V (0..4 pontos): pickBand por % do máximo.
const LEVEL5_BANDS = (labels: [string, string, string, string, string]): InteractiveBand[] => [
  { minPct: 88, classification: `Nível V — ${labels[4]}`, color: "red", description: `Nível V. ${labels[4]}` },
  { minPct: 63, classification: `Nível IV — ${labels[3]}`, color: "orange", description: `Nível IV. ${labels[3]}` },
  { minPct: 38, classification: `Nível III — ${labels[2]}`, color: "amber", description: `Nível III. ${labels[2]}` },
  { minPct: 13, classification: `Nível II — ${labels[1]}`, color: "amber", description: `Nível II. ${labels[1]}` },
  { minPct: 0, classification: `Nível I — ${labels[0]}`, color: "emerald", description: `Nível I. ${labels[0]}` },
];
const freeBatch2Items: Record<string, InteractiveScaleDef> = {
  macs: {
    instruction: "Selecione o nível que melhor descreve como a criança MANUSEIA OBJETOS nas atividades do dia a dia (não a melhor capacidade em teste, mas o desempenho habitual).",
    infoBox: "MACS — Manual Ability Classification System (Eliasson AC et al., CanChild), uso livre com citação. Classificação de apoio para paralisia cerebral; níveis em redação própria. Não é diagnóstico.",
    labels: [
      "Nível I — manuseia objetos com facilidade e sucesso",
      "Nível II — manuseia a maioria, com qualidade/rapidez um pouco reduzidas",
      "Nível III — manuseia com dificuldade; precisa de ajuda para preparar/adaptar",
      "Nível IV — manuseia seleção limitada de objetos fáceis, em situação adaptada",
      "Nível V — não manuseia objetos; capacidade muito limitada",
    ],
    optionPoints: [0, 1, 2, 3, 4],
    scoreDirection: "higher_worse",
    totalLabel: "nível manual (I–V)",
    bands: LEVEL5_BANDS([
      "Manuseia objetos com facilidade e sucesso.",
      "Manuseia a maioria dos objetos, com qualidade ou rapidez um pouco reduzidas.",
      "Manuseia objetos com dificuldade; precisa de ajuda para preparar ou adaptar a atividade.",
      "Manuseia uma seleção limitada de objetos fáceis, em situações adaptadas.",
      "Não manuseia objetos; capacidade muito limitada mesmo em ações simples.",
    ]),
    domains: [{ name: "Classificação da habilidade manual", color: "text-teal-600 dark:text-teal-400", items: [
      "Nível de habilidade manual no dia a dia",
    ] }],
  },
  cfcs: {
    instruction: "Selecione o nível que melhor descreve a EFICÁCIA DA COMUNICAÇÃO da criança no dia a dia, considerando emissor e receptor, com pessoas conhecidas e desconhecidas.",
    infoBox: "CFCS — Communication Function Classification System (Hidecker MJC et al., CanChild), uso livre com citação. Classificação de apoio; níveis em redação própria. Não é diagnóstico.",
    labels: [
      "Nível I — comunica-se com eficácia com conhecidos e desconhecidos",
      "Nível II — eficaz, porém mais lento, com conhecidos e desconhecidos",
      "Nível III — comunica-se com eficácia com pessoas conhecidas",
      "Nível IV — comunicação inconsistente, mesmo com conhecidos",
      "Nível V — raramente comunica-se com eficácia, mesmo com conhecidos",
    ],
    optionPoints: [0, 1, 2, 3, 4],
    scoreDirection: "higher_worse",
    totalLabel: "nível de comunicação (I–V)",
    bands: LEVEL5_BANDS([
      "Emissor e receptor eficaz com parceiros conhecidos e desconhecidos.",
      "Emissor e receptor eficaz, porém mais lento, com conhecidos e desconhecidos.",
      "Emissor e receptor eficaz com parceiros conhecidos.",
      "Emissor e/ou receptor inconsistente com parceiros conhecidos.",
      "Emissor e receptor raramente eficaz, mesmo com parceiros conhecidos.",
    ]),
    domains: [{ name: "Classificação da comunicação", color: "text-blue-600 dark:text-blue-400", items: [
      "Nível de eficácia da comunicação no dia a dia",
    ] }],
  },
  edacs: {
    instruction: "Selecione o nível que melhor descreve a HABILIDADE DE COMER E BEBER da criança, priorizando SEGURANÇA (via aérea) e, depois, eficiência.",
    infoBox: "EDACS — Eating and Drinking Ability Classification System (Sellers D et al.), uso livre com citação. Classificação de apoio; níveis em redação própria. Sinais de aspiração exigem avaliação especializada. Não é diagnóstico.",
    labels: [
      "Nível I — come e bebe com segurança e eficiência",
      "Nível II — come e bebe com segurança, com eficiência reduzida",
      "Nível III — alguma limitação de segurança; eficiência reduzida",
      "Nível IV — limitação significativa de segurança",
      "Nível V — incapaz de comer/beber com segurança; pode exigir via alternativa",
    ],
    optionPoints: [0, 1, 2, 3, 4],
    scoreDirection: "higher_worse",
    totalLabel: "nível alimentar (I–V)",
    bands: LEVEL5_BANDS([
      "Come e bebe com segurança e eficiência.",
      "Come e bebe com segurança, mas com eficiência reduzida.",
      "Come e bebe com alguma limitação de segurança; eficiência reduzida.",
      "Come e bebe com limitação significativa de segurança.",
      "Incapaz de comer/beber com segurança; pode requerer nutrição por via alternativa.",
    ]),
    domains: [{ name: "Classificação de comer e beber", color: "text-lime-600 dark:text-lime-400", items: [
      "Nível de habilidade para comer e beber com segurança",
    ] }],
  },
};

// ------------------------------------------------------------
// LOTES 3–5 de escalas gratuitas antes só como ficha. Itens em redação clínica
// própria (observações objetivas / situações), como ADAPTAÇÃO para triagem —
// fonte creditada; não reproduzem o texto oficial nem substituem o instrumento
// validado. Maior pontuação = maior gravidade/preocupação (salvo indicado).
// ------------------------------------------------------------
const P0123_LABELS = ["Nada (0)", "Pouco (1)", "Bastante (2)", "Muito (3)"];
const SEV0123_BANDS = (redPct: number, amberPct: number, note: string): InteractiveBand[] => [
  { minPct: redPct, classification: "Gravidade alta", color: "red", description: `Sinais intensos e/ou frequentes. ${note}` },
  { minPct: amberPct, classification: "Gravidade leve a moderada", color: "amber", description: `Sinais presentes — reavaliar e acompanhar. ${note}` },
  { minPct: 0, classification: "Baixa gravidade", color: "emerald", description: `Poucos sinais neste momento. ${note}` },
];
const freeBatch3Items: Record<string, InteractiveScaleDef> = {
  // ---- LOTE 3 · DOR ----
  wongbaker: {
    instruction: "Peça à criança para escolher o rosto que mostra o quanto ela sente dor agora (do rosto feliz, sem dor, ao rosto que chora, pior dor).",
    infoBox: "Escala de faces de dor (inspirada em Wong-Baker FACES). Autorrelato a partir de ~3 anos; combine com observação quando necessário. Triagem, não diagnóstico.",
    labels: ["0 — sem dor (rosto feliz)", "2 — dói um pouquinho", "4 — dói um pouco mais", "6 — dói ainda mais", "8 — dói muito", "10 — dói o máximo (chora)"],
    optionPoints: [0, 2, 4, 6, 8, 10],
    scoreDirection: "higher_worse",
    totalLabel: "dor (0–10)",
    bands: [
      { minPct: 70, classification: "Dor intensa (7–10)", color: "red", description: "Dor intensa. Analgesia e reavaliação." },
      { minPct: 40, classification: "Dor moderada (4–6)", color: "orange", description: "Dor moderada. Considerar analgesia e conforto." },
      { minPct: 10, classification: "Dor leve (1–3)", color: "amber", description: "Dor leve. Medidas de conforto." },
      { minPct: 0, classification: "Sem dor (0)", color: "emerald", description: "Sem dor relatada agora." },
    ],
    domains: [{ name: "Intensidade da dor", color: "text-rose-600 dark:text-rose-400", items: ["Qual rosto mostra a dor agora?"] }],
  },
  ppp: {
    instruction: "Observando as últimas horas, marque o quanto cada sinal esteve presente. Útil quando a criança tem dificuldade de relatar dor (ex.: deficiência grave). Some (0–60).",
    infoBox: "Adaptação observacional para triagem de dor (inspirada no Paediatric Pain Profile). Itens em redação própria. Pontuações mais altas indicam mais sinais de dor/desconforto; ≈14+ merece atenção. Não substitui avaliação clínica.",
    labels: P0123_LABELS,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "sinais de dor (0–60)",
    bands: SEV0123_BANDS(40, 20, "Considerar analgesia/medidas de conforto e reavaliar."),
    domains: [{ name: "Sinais observáveis de dor", color: "text-amber-600 dark:text-amber-400", items: [
      "Choramingou, gemeu ou vocalizou sofrimento", "Ficou agitado ou inquieto sem se acalmar", "Expressão facial de dor (testa franzida, olhos apertados)",
      "Chorou e foi difícil de consolar", "Ficou mais quieto ou retraído que o habitual", "Enrijeceu o corpo ou aumentou o tônus muscular",
      "Fez caretas ou estremeceu ao ser tocado/movido", "Protegeu ou evitou mexer numa parte do corpo", "Dormiu mal / sono interrompido",
      "Comeu ou bebeu menos que o habitual", "Sudorese, palidez ou mudança de cor", "Movimentos de defesa (afastar, empurrar) ao manuseio",
      "Ranger de dentes, morder ou autoestimulação aumentada", "Parecia sofrido mesmo em repouso", "Não se interessou pelo ambiente/brincadeira como de costume",
    ] }],
  },
  // ---- LOTE 4 · EPILEPSIA (adaptações de gravidade de crises) ----
  lsss: {
    instruction: "Pensando nas crises do último período, marque o quanto cada aspecto ocorre. Some para estimar a gravidade das crises (0–30).",
    infoBox: "Adaptação para triagem da gravidade de crises (inspirada na Liverpool Seizure Severity Scale). Itens em redação própria; acompanha evolução ao longo do tempo. Não substitui o instrumento validado nem a avaliação neurológica.",
    labels: P0123_LABELS,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "gravidade das crises (0–30)",
    bands: SEV0123_BANDS(50, 20, "Rever controle das crises e adesão ao tratamento."),
    domains: [{ name: "Aspectos das crises", color: "text-violet-600 dark:text-violet-400", items: [
      "As crises acontecem sem aviso (sem aura/pródromo)", "A criança perde a consciência durante a crise", "As crises são longas (mais de alguns minutos)",
      "Ocorrem quedas ou risco de lesão durante a crise", "Há perda de urina ou fezes durante a crise", "Há confusão ou agitação logo após a crise",
      "A recuperação é lenta (sonolência/cansaço prolongado)", "As crises atrapalham as atividades do dia", "A criança se machucou em alguma crise recente",
      "Há pouco controle das crises apesar do tratamento",
    ] }],
  },
  "hague-szs": {
    instruction: "Marque o quanto cada característica descreve as crises atuais da criança. Some (0–21).",
    infoBox: "Adaptação para triagem da gravidade de crises (inspirada na Hague Seizure Severity Scale). Itens em redação própria; útil para acompanhamento. Não substitui o instrumento validado.",
    labels: P0123_LABELS,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "gravidade (0–21)",
    bands: SEV0123_BANDS(50, 20, "Correlacionar com frequência de crises e ajuste terapêutico."),
    domains: [{ name: "Características das crises", color: "text-fuchsia-600 dark:text-fuchsia-400", items: [
      "Alteração ou perda de consciência", "Quedas ou tombos durante a crise", "Movimentos ou automatismos intensos",
      "Duração longa das crises", "Crises frequentes", "Generalização (envolve o corpo todo)", "Necessidade de socorro/medicação de resgate",
    ] }],
  },
  // ---- LOTE 5 · COMPORTAMENTO + INTESTINO ----
  hsq: {
    instruction: "Para cada situação do dia a dia, marque o quanto o comportamento da criança é um problema (obediência, birra, agitação). Some (0–42).",
    infoBox: "Adaptação para triagem de problemas de comportamento por situação (inspirada no Home Situations Questionnaire, Barkley). Itens em redação própria. Mostra ONDE o comportamento pesa mais; não substitui avaliação clínica.",
    labels: P0123_LABELS,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "situações com problema (0–42)",
    bands: SEV0123_BANDS(40, 15, "Orientar manejo comportamental e rotina; reavaliar."),
    domains: [{ name: "Situações do dia a dia", color: "text-orange-600 dark:text-orange-400", items: [
      "Durante as refeições", "Ao brincar sozinho", "Ao brincar com outras crianças", "Na hora de se vestir", "Durante o banho/higiene",
      "Ao assistir TV ou usar telas", "Quando há visitas em casa", "Em casa de outras pessoas", "Em lojas ou lugares públicos",
      "Na hora do dever de casa / atividades", "Na hora de dormir", "No carro / transporte", "Quando o adulto está ao telefone / ocupado", "Ao ser contrariado ou ouvir 'não'",
    ] }],
  },
  "bristol-stool": {
    instruction: "Selecione o tipo de fezes que melhor representa o padrão habitual da criança (formato e consistência).",
    infoBox: "Escala de forma das fezes (inspirada na Bristol Stool Form Scale). Tipos 1–2 sugerem constipação; 3–4 são normais; 5–7 sugerem fezes amolecidas/diarreia. Triagem, não diagnóstico.",
    labels: [
      "Tipo 1 — bolinhas duras separadas, difíceis de eliminar",
      "Tipo 2 — em forma de salsicha, mas com grumos/endurecida",
      "Tipo 3 — como salsicha, com rachaduras na superfície",
      "Tipo 4 — como salsicha ou cobra, lisa e macia",
      "Tipo 5 — pedaços macios com bordas nítidas",
      "Tipo 6 — pedaços pastosos com bordas irregulares",
      "Tipo 7 — totalmente líquida, sem pedaços sólidos",
    ],
    optionPoints: [0, 1, 2, 3, 4, 5, 6],
    scoreDirection: "higher_worse",
    totalLabel: "forma das fezes (tipo 1–7)",
    bands: [
      { minPct: 62, classification: "Fezes amolecidas / diarreia (tipos 5–7)", color: "amber", description: "Padrão amolecido/líquido. Avaliar hidratação, dieta e causas de diarreia." },
      { minPct: 29, classification: "Padrão normal (tipos 3–4)", color: "emerald", description: "Forma normal das fezes." },
      { minPct: 0, classification: "Constipação (tipos 1–2)", color: "amber", description: "Padrão endurecido. Avaliar constipação, fibras, hidratação e rotina intestinal." },
    ],
    domains: [{ name: "Forma das fezes", color: "text-cyan-600 dark:text-cyan-400", items: ["Tipo habitual das fezes"] }],
  },
};

export const interactiveScaleItems: Record<string, InteractiveScaleDef> = {
  ...j26Bloco1Items,
  ...j26Bloco2Items,
  ...j26Bloco3Items,
  ...j26Bloco4Items,
  ...driveImport2026Items,
  ...interactiveScaleItemsCore,
  ...atecItems,
  ...aq10Items,
  ...freeBatch1Items,
  ...freeBatch2Items,
  ...freeBatch3Items,
};

/** Retorna a definição interativa de uma escala, se existir. */
export function getInteractiveScale(id: string | undefined): InteractiveScaleDef | undefined {
  return id ? interactiveScaleItems[id] : undefined;
}
