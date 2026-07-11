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
import type { ScaleConfig, ScaleItem } from "@/components/GenericScale";
import { j26Bloco1Items } from "./interactiveScaleItemsJ26Bloco1";
import { j26Bloco2Items } from "./interactiveScaleItemsJ26Bloco2";
import { j26Bloco3Items } from "./interactiveScaleItemsJ26Bloco3";
import { j26Bloco4Items } from "./interactiveScaleItemsJ26Bloco4";
import { driveImport2026Items } from "./interactiveScaleItemsDrive2026";
import { podjTeaPrimeItems } from "./interactiveScaleItemsPodjTeaPrime";

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
  /**
   * Itens do domínio. Cada item pode ser uma string simples ou um objeto
   * { text, emoji?, example? } — o emoji e o exemplo prático ajudam a família
   * a entender o que a pergunta quer saber. Retrocompatível com string pura.
   */
  items: ScaleItem[];
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
      { name: "Internalizante", color: "text-blue-600 dark:text-blue-400", items: [{ text: "Tristeza, desanimo ou preocupação persistente", emoji: "😔", example: "Ex.: A criança fica triste e cabisbaixa por vários dias, sem vontade de brincar como antes." }, { text: "Medos ou ansiedade que atrapalham rotina", emoji: "😰", example: "Ex.: Fica tão nervosa antes da escola que chora e não consegue sair de casa." }, { text: "Queixas somáticas associadas a estresse", emoji: "🤕", example: "Ex.: Reclama de dor de barriga ou de cabeça sempre que precisa apresentar um trabalho." }, { text: "Isolamento ou perda de interesse", emoji: "🙍", example: "Ex.: Deixou de querer brincar com amigos e passa muito tempo sozinha no quarto." }, { text: "Irritabilidade emocional com sofrimento", emoji: "😤", example: "Ex.: Fica irritada e chorosa com facilidade e demonstra estar sofrendo por dentro." }] },
      { name: "Atenção", color: "text-cyan-600 dark:text-cyan-400", items: [{ text: "Dificuldade de manter atenção em tarefas", emoji: "🎯", example: "Ex.: Começa a lição, mas larga no meio e não consegue manter o foco por muito tempo." }, { text: "Distrai-se facilmente no cotidiano", emoji: "🦋", example: "Ex.: Qualquer barulho ou movimento na sala já tira a atenção dela da tarefa." }, { text: "Esquece combinados, materiais ou instruções", emoji: "🎒", example: "Ex.: Esquece o material na escola ou não lembra do que foi combinado em casa." }, { text: "Dificuldade de concluir atividades", emoji: "🧩", example: "Ex.: Inicia várias atividades, mas raramente termina o que começou." }, { text: "Impulsividade cognitiva ou respostas precipitadas", emoji: "⚡", example: "Ex.: Responde antes da pergunta terminar ou age sem pensar nas consequências." }] },
      { name: "Externalizante", color: "text-amber-600 dark:text-amber-400", items: [{ text: "Desobedece ou desafia adultos com frequência", emoji: "🙅", example: "Ex.: Frequentemente não obedece e discute quando um adulto pede algo simples." }, { text: "Brigas, agressividade ou explosões de raiva", emoji: "👊", example: "Ex.: Entra em brigas, bate nos colegas ou tem explosões de raiva intensas." }, { text: "Culpa outros ou nega responsabilidade", emoji: "🫵", example: "Ex.: Quando faz algo errado, sempre diz que a culpa foi do outro." }, { text: "Regras quebradas em casa/escola", emoji: "🚫", example: "Ex.: Desrespeita regras combinadas em casa ou na escola com frequência." }, { text: "Comportamento disruptivo com prejuizo social", emoji: "💥", example: "Ex.: O comportamento agitado atrapalha a convivência e afasta os colegas." }, { text: "Baixa tolerância a frustração", emoji: "😣", example: "Ex.: Ao perder num jogo ou ouvir um 'não', reage com raiva ou choro imediato." }, { text: "Conflitos recorrentes com pares", emoji: "🤼", example: "Ex.: Vive brigando com os mesmos colegas e tem dificuldade de fazer amizades." }] },
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
      { name: "Labilidade/negatividade", color: "text-rose-600 dark:text-rose-400", items: [{ text: "Mudancas rapidas de humor", emoji: "🎭", example: "Ex.: Passa de alegre a irritada em poucos minutos, sem motivo claro." }, { text: "Explosões emocionais desproporcionais", emoji: "🌋", example: "Ex.: Por um problema pequeno, tem uma explosão de raiva bem maior do que o esperado." }, { text: "Irritabilidade persistente", emoji: "😖", example: "Ex.: Fica de mau humor e irritada na maior parte do dia, quase todos os dias." }, { text: "Choro ou raiva de difícil recuperação", emoji: "😢", example: "Ex.: Quando começa a chorar ou se irritar, demora muito para conseguir se acalmar." }, { text: "Reação intensa a pequenas frustrações", emoji: "🔥", example: "Ex.: Um lápis que quebra já é suficiente para desencadear uma reação intensa." }, { text: "Dificuldade de voltar ao basal", emoji: "🔄", example: "Ex.: Depois de uma crise, custa muito a voltar ao estado calmo de sempre." }, { text: "Hostilidade verbal ou corporal", emoji: "🗯️", example: "Ex.: Xinga, grita ou empurra quando está com raiva de alguém." }, { text: "Emoções negativas prolongadas", emoji: "☁️", example: "Ex.: A tristeza ou a raiva permanecem por muito tempo depois do que as causou." }, { text: "Sensibilidade excessiva a correção", emoji: "🪞", example: "Ex.: Fica muito magoada ou brava quando é corrigida, mesmo com jeito." }, { text: "Conflitos por baixa tolerância a espera", emoji: "⏳", example: "Ex.: Não consegue esperar a vez e acaba brigando na fila ou no jogo." }, { text: "Comportamento imprevisível pela emoção", emoji: "🎢", example: "Ex.: É difícil prever como vai reagir, pois depende muito do humor do momento." }, { text: "Prejuizo social por reatividade emocional", emoji: "🧍", example: "Ex.: As reações emocionais fortes afastam os colegas e atrapalham as brincadeiras." }] },
      { name: "Regulação adaptativa", color: "text-pink-600 dark:text-pink-400", items: [{ text: "Dificuldade de nomear o que sente", emoji: "💬", example: "Ex.: Fica mal, mas não sabe dizer se está com raiva, medo ou tristeza." }, { text: "Dificuldade de pedir ajuda quando aflito", emoji: "🆘", example: "Ex.: Mesmo aflita, não procura um adulto nem pede ajuda para resolver." }, { text: "Pouco uso de estrategias para se acalmar", emoji: "🧘", example: "Ex.: Não usa formas de se acalmar, como respirar fundo ou beber água." }, { text: "Dificuldade de seguir combinados quando frustrado", emoji: "🤝", example: "Ex.: Quando frustrada, esquece o que foi combinado e não segue as regras." }, { text: "Baixa flexibilidade diante de mudancas", emoji: "🌪️", example: "Ex.: Uma mudança de planos, como trocar de atividade, a desorganiza muito." }, { text: "Dificuldade de reparar conflitos", emoji: "🩹", example: "Ex.: Depois de uma briga, tem dificuldade de pedir desculpas e fazer as pazes." }, { text: "Pouca empatia quando outra pessoa sofre", emoji: "💗", example: "Ex.: Quando um colega se machuca ou chora, parece não se importar." }, { text: "Dificuldade de esperar recompensa", emoji: "🍬", example: "Ex.: Não aguenta esperar por um prêmio e quer tudo na hora." }, { text: "Reação emocional prejudica aprendizagem", emoji: "📚", example: "Ex.: A raiva ou o medo tomam conta e ela não consegue aprender na hora da lição." }, { text: "Precisa de adulto para regular quase sempre", emoji: "🫂", example: "Ex.: Quase sempre precisa de um adulto ao lado para conseguir se acalmar." }, { text: "Evita atividades por medo/raiva", emoji: "🚪", example: "Ex.: Evita brincadeiras ou tarefas novas por medo ou por raiva antecipada." }, { text: "Dificuldade de aceitar limites", emoji: "🛑", example: "Ex.: Tem muita dificuldade de aceitar um 'não' ou os limites combinados." }] },
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
      { name: "Nervos cranianos", color: "text-emerald-600 dark:text-emerald-400", items: [{ text: "Seguimento visual", emoji: "👁️", example: "Ex.: Observe se o bebê acompanha com os olhos um objeto colorido movido lentamente." }, { text: "Resposta auditiva", emoji: "👂", example: "Ex.: Observe se o bebê reage a um som ou chocalho fora do seu campo de visão." }, { text: "Movimentos oculares conjugados", emoji: "🔀", example: "Ex.: Observe se os dois olhos se movem juntos, sem um desviar para outro lado." }, { text: "Expressão facial simétrica", emoji: "🙂", example: "Ex.: Observe se, ao sorrir ou chorar, os dois lados do rosto se mexem igualmente." }, { text: "Sucção/deglutição adequadas", emoji: "🍼", example: "Ex.: Observe se o bebê suga e engole bem durante a mamada, sem engasgos." }, { text: "Qualidade do choro/vocalização", emoji: "🔊", example: "Ex.: Observe se o choro tem tom e força normais, nem fraco nem muito agudo." }] },
      { name: "Postura", color: "text-teal-600 dark:text-teal-400", items: [{ text: "Postura de cabeça", emoji: "🧠", example: "Ex.: Observe se o bebê sustenta a cabeça de acordo com a idade esperada." }, { text: "Postura de tronco", emoji: "🧍", example: "Ex.: Observe o alinhamento e a sustentação do tronco na posição sentada." }, { text: "Postura de braços", emoji: "💪", example: "Ex.: Observe a posição de repouso dos braços, se estão fletidos e simétricos." }, { text: "Postura de mãos", emoji: "✋", example: "Ex.: Observe se as mãos ficam abertas ou fechadas e como se posicionam." }, { text: "Postura de pernas", emoji: "🦵", example: "Ex.: Observe a postura das pernas em repouso, se estão fletidas e simétricas." }, { text: "Postura de pés", emoji: "🦶", example: "Ex.: Observe a posição dos pés em repouso e ao apoiar na superfície." }] },
      { name: "Movimentos", color: "text-cyan-600 dark:text-cyan-400", items: [{ text: "Quantidade de movimentos espontaneos", emoji: "🤸", example: "Ex.: Observe a quantidade de movimentos espontâneos que o bebê faz sozinho." }, { text: "Qualidade dos movimentos", emoji: "🎞️", example: "Ex.: Observe se os movimentos são suaves e variados ou bruscos e repetitivos." }, { text: "Simetria dos movimentos", emoji: "⚖️", example: "Ex.: Observe se o lado direito e o esquerdo se movem de forma parecida." }, { text: "Controle antigravitacional", emoji: "🏋️", example: "Ex.: Observe se o bebê consegue vencer a gravidade, como levantar a cabeça no colo." }] },
      { name: "Tônus", color: "text-lime-600 dark:text-lime-400", items: [{ text: "Tônus global", emoji: "🧵", example: "Ex.: Observe o tônus geral do corpo, se está mole demais ou muito rígido." }, { text: "Traction response", emoji: "🤲", example: "Ex.: Ao puxar o bebê pelas mãos para sentar, observe se a cabeça acompanha o tronco." }, { text: "Suspensão ventral", emoji: "✈️", example: "Ex.: Ao suspender o bebê de bruços na mão, observe se sustenta cabeça e tronco." }, { text: "Amplitude passiva de ombros", emoji: "🔄", example: "Ex.: Observe a amplitude ao mover passivamente os ombros do bebê para todos os lados." }, { text: "Prono/sentado conforme idade", emoji: "🪑", example: "Ex.: Observe se fica de bruços ou sentado conforme o esperado para a idade." }, { text: "Adutores/angulo popliteo conforme idade", emoji: "📐", example: "Ex.: Meça o ângulo dos adutores e o poplíteo para avaliar o tônus conforme a idade." }] },
      { name: "Reflexos e reações", color: "text-green-600 dark:text-green-400", items: [{ text: "Reflexos tendinosos", emoji: "🔨", example: "Ex.: Teste os reflexos com o martelinho, como o do joelho, avaliando a resposta." }, { text: "Moro/paraquedas conforme idade", emoji: "🪂", example: "Ex.: Verifique reflexos como Moro e paraquedas de acordo com a idade do bebê." }, { text: "Reação de proteção", emoji: "🛟", example: "Ex.: Observe se, ao inclinar o bebê, ele estende os braços para se proteger." }, { text: "Resposta plantar", emoji: "🦶", example: "Ex.: Ao estimular a sola do pé, observe a resposta plantar dos dedos." }] },
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
      { name: "CAT - adaptativo/cognitivo", color: "text-indigo-600 dark:text-indigo-400", items: [{ text: "Explora objeto com olhar e mãos", emoji: "🔍", example: "Ex.: Observe se o bebê pega um brinquedo, olha e explora com as mãos." }, { text: "Transfere objeto entre mãos", emoji: "🤲", example: "Ex.: Observe se passa o brinquedo de uma mão para a outra." }, { text: "Procura objeto parcialmente escondido", emoji: "🫣", example: "Ex.: Esconda parte de um brinquedo com um pano e veja se a criança o procura." }, { text: "Usa pinça ou pega fina funcional", emoji: "🤏", example: "Ex.: Observe se pega objetos pequenos, como uma migalha, usando a pinça de polegar e indicador." }, { text: "Coloca e retira objetos de recipiente", emoji: "🪣", example: "Ex.: Observe se coloca blocos dentro de um potinho e depois os tira." }, { text: "Imita ação simples com objeto", emoji: "🙌", example: "Ex.: Veja se imita uma ação simples, como bater um bloco no outro ao ver o adulto fazer." }, { text: "Resolve encaixe/formas simples", emoji: "🧩", example: "Ex.: Ofereça um brinquedo de encaixar formas e observe se ela resolve os encaixes." }, { text: "Faz brincadeira funcional", emoji: "🚗", example: "Ex.: Observe se usa o brinquedo pela função, como empurrar o carrinho ou dar comida à boneca." }, { text: "Empilha ou constrói com blocos", emoji: "🧱", example: "Ex.: Observe se empilha blocos formando uma torre ou constrói algo simples." }, { text: "Combina objetos por função", emoji: "🔗", example: "Ex.: Veja se junta objetos que combinam, como colocar a xícara sobre o pires." }, { text: "Aponta/seleciona figura ou objeto nomeado", emoji: "👉", example: "Ex.: Peça 'cadê o cachorro?' e observe se aponta ou escolhe a figura certa." }, { text: "Realiza tarefa de causa-efeito", emoji: "🎛️", example: "Ex.: Ofereça um brinquedo de apertar botão que faz som e veja se entende causa e efeito." }] },
      { name: "CLAMS - linguagem/audição", color: "text-violet-600 dark:text-violet-400", items: [{ text: "Reage a sons e voz familiar", emoji: "🗣️", example: "Ex.: Observe se o bebê vira em direção a um som ou à voz da mãe." }, { text: "Vocaliza para interagir", emoji: "🐣", example: "Ex.: Observe se emite sons para chamar atenção ou responder ao adulto." }, { text: "Balbucia sílabas repetidas", emoji: "👶", example: "Ex.: Observe se repete sílabas como 'dadada' ou 'mamama'." }, { text: "Responde ao próprio nome", emoji: "📛", example: "Ex.: Chame o bebê pelo nome e veja se ele se vira ou reage." }, { text: "Compreende comando simples com gesto", emoji: "🫳", example: "Ex.: Diga 'me dá' estendendo a mão e veja se entende o pedido com o gesto." }, { text: "Usa gesto comunicativo", emoji: "👋", example: "Ex.: Observe se usa gestos como dar tchau, mandar beijo ou apontar." }, { text: "Fala palavra com significado", emoji: "💬", example: "Ex.: Observe se fala uma palavra com sentido, como 'mamãe' para chamar a mãe." }, { text: "Aponta para pedir ou mostrar", emoji: "☝️", example: "Ex.: Observe se aponta para pedir algo que quer ou para mostrar o que viu." }, { text: "Compreende comando sem gesto", emoji: "👂", example: "Ex.: Peça 'pega a bola' sem apontar e veja se entende só pela fala." }, { text: "Nomeia objetos/pessoas familiares", emoji: "🏷️", example: "Ex.: Observe se diz o nome de objetos ou pessoas conhecidas, como 'bola' ou 'papai'." }, { text: "Combina duas palavras", emoji: "🔤", example: "Ex.: Observe se junta duas palavras, como 'quer água' ou 'cadê mamãe'." }, { text: "Usa fala/gesto para resolver necessidade", emoji: "🙋", example: "Ex.: Observe se usa fala ou gestos para resolver o que precisa, como pedir para pegar algo alto." }] },
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
      { name: "Fluência fonológica", color: "text-fuchsia-600 dark:text-fuchsia-400", items: [{ text: "Letra F - produção adequada para idade/escolaridade", emoji: "🔡", example: "Ex.: Peça para dizer palavras com F, como 'faca', e avalie se pronuncia bem para a idade." }, { text: "Letra A - produção adequada para idade/escolaridade", emoji: "🔡", example: "Ex.: Peça palavras com o som de A e avalie se a produção é adequada para a idade." }, { text: "Letra S - produção adequada para idade/escolaridade", emoji: "🔡", example: "Ex.: Peça palavras com S, como 'sapo', e avalie se pronuncia bem para a idade." }] },
      { name: "Qualidade executiva", color: "text-purple-600 dark:text-purple-400", items: [{ text: "Baixa perseveração/repetição", emoji: "♻️", example: "Ex.: Observe se a criança evita repetir a mesma resposta ou ação sem necessidade." }, { text: "Mantem regra da tarefa", emoji: "📋", example: "Ex.: Observe se ela mantém a regra da tarefa do início ao fim, sem se perder." }, { text: "Usa estrategia de agrupamento e troca", emoji: "🗂️", example: "Ex.: Observe se agrupa itens por categoria e troca de estratégia quando pedido." }] },
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
      { name: "Sono noturno", color: "text-indigo-600 dark:text-indigo-400", items: [{ text: "Latência para dormir prolongada", emoji: "🛌", example: "Ex.: A criança demora mais de meia hora deitada até conseguir pegar no sono." }, { text: "Despertares noturnos frequentes", emoji: "🌙", example: "Ex.: Acorda várias vezes durante a noite e precisa de ajuda para voltar a dormir." }, { text: "Tempo acordado de madrugada prolongado", emoji: "🕐", example: "Ex.: Acorda de madrugada e fica bastante tempo desperta antes de dormir de novo." }, { text: "Duração total de sono reduzida", emoji: "⏱️", example: "Ex.: Dorme bem menos horas por dia do que o esperado para a idade." }] },
      { name: "Rotina e contexto", color: "text-slate-600 dark:text-slate-400", items: [{ text: "Horário de dormir irregular", emoji: "📅", example: "Ex.: O horário de deitar muda muito de um dia para o outro, sem rotina fixa." }, { text: "Associação intensa para adormecer", emoji: "🍼", example: "Ex.: Só consegue dormir mamando, no colo ou com a chupeta, sempre da mesma forma." }, { text: "Sonecas desorganizadas para idade", emoji: "😴", example: "Ex.: As sonecas do dia são muito irregulares ou fora do esperado para a idade." }, { text: "Sono dos cuidadores prejudicado", emoji: "😩", example: "Ex.: Os pais estão exaustos porque acordam várias vezes junto com a criança." }] },
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
      { name: "Humor e prazer", color: "text-blue-600 dark:text-blue-400", items: [{ text: "Humor deprimido ou desesperanca", emoji: "😞", example: "Ex.: Anda desanimado, dizendo que nada tem graça ou que nada vai melhorar." }, { text: "Perda de interesse ou prazer", emoji: "🎈", example: "Ex.: Perdeu o interesse por brincadeiras e hobbies que antes adorava." }, { text: "Baixa autoestima ou culpa", emoji: "🪫", example: "Ex.: Fala que não presta ou se culpa demais por coisas pequenas." }] },
      { name: "Energia e funcionamento", color: "text-slate-600 dark:text-slate-400", items: [{ text: "Fadiga ou lentificação", emoji: "😪", example: "Ex.: Reclama de cansaço o tempo todo e faz tudo mais devagar que o normal." }, { text: "Dificuldade de concentração", emoji: "🌫️", example: "Ex.: Não consegue se concentrar nas tarefas e diz que a cabeça 'não funciona'." }, { text: "Prejuizo funcional por sintomas emocionais", emoji: "📉", example: "Ex.: Os sintomas emocionais estão atrapalhando a escola, a família ou os amigos." }] },
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
      { name: "Separação", color: "text-yellow-600 dark:text-yellow-400", items: [{ text: "Medo intenso de ficar longe dos cuidadores", emoji: "🧷", example: "Ex.: Fica desesperada quando precisa se afastar dos pais, mesmo por pouco tempo." }, { text: "Preocupação de algo ruim acontecer aos pais", emoji: "😨", example: "Ex.: Vive preocupada achando que algo ruim vai acontecer com os pais." }, { text: "Dificuldade de dormir longe/cuidador", emoji: "🛏️", example: "Ex.: Só consegue dormir se um dos pais estiver junto na cama." }] },
      { name: "Social", color: "text-orange-600 dark:text-orange-400", items: [{ text: "Medo de avaliação por outras pessoas", emoji: "😳", example: "Ex.: Tem muito medo de ser observada ou julgada pelos outros." }, { text: "Evita falar ou participar em grupo", emoji: "🤐", example: "Ex.: Evita falar ou participar quando está em grupo, com medo de errar." }, { text: "Vergonha intensa com pares/adultos", emoji: "🙈", example: "Ex.: Sente vergonha intensa perto de colegas ou adultos, a ponto de se esconder." }] },
      { name: "Panico/somático", color: "text-red-600 dark:text-red-400", items: [{ text: "Crises de medo com sintomas fisicos", emoji: "💓", example: "Ex.: Tem crises de medo súbitas com coração acelerado e sensação de que vai passar mal." }, { text: "Palpitação/falta de ar/tremor por ansiedade", emoji: "😮‍💨", example: "Ex.: Durante a ansiedade, sente falta de ar, tremores e coração disparado." }, { text: "Medo de perder controle durante sintomas", emoji: "🌀", example: "Ex.: Durante a crise, teme perder o controle ou enlouquecer." }] },
      { name: "Generalizada", color: "text-amber-600 dark:text-amber-400", items: [{ text: "Preocupação excessiva com muitas coisas", emoji: "🌩️", example: "Ex.: Preocupa-se em excesso com muitas coisas ao mesmo tempo: escola, saúde, família." }, { text: "Dificuldade de controlar preocupação", emoji: "🎚️", example: "Ex.: Não consegue 'desligar' a preocupação, mesmo tentando pensar em outra coisa." }, { text: "Tensão/irritabilidade por preocupação", emoji: "😬", example: "Ex.: Fica tensa e irritada por causa das preocupações constantes." }] },
      { name: "Obsessivo-compulsivo", color: "text-purple-600 dark:text-purple-400", items: [{ text: "Pensamentos repetitivos indesejados", emoji: "🔁", example: "Ex.: Tem pensamentos que voltam sem parar e que ela não quer ter." }, { text: "Rituais ou checagens para aliviar ansiedade", emoji: "🔒", example: "Ex.: Repete rituais, como checar a porta várias vezes, para aliviar a ansiedade." }, { text: "Sofrimento se impedido de fazer ritual", emoji: "😖", example: "Ex.: Fica muito angustiada se é impedida de completar seu ritual." }] },
      { name: "Medo de dano", color: "text-lime-600 dark:text-lime-400", items: [{ text: "Medo intenso de escuro/animais/altura", emoji: "🕷️", example: "Ex.: Tem medo intenso e específico de escuro, animais ou lugares altos." }, { text: "Evita situações por medo específico", emoji: "🚷", example: "Ex.: Evita situações inteiras por causa de um medo específico, como não entrar em elevador." }, { text: "Ansiedade antecipatória antes da exposição", emoji: "⏰", example: "Ex.: Já fica ansiosa horas antes de enfrentar o que teme." }] },
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
      { name: "Ansiedade de separação", color: "text-cyan-600 dark:text-cyan-400", items: [{ text: "Sofrimento ao separar-se de cuidadores", emoji: "😢", example: "Ex.: Chora e sofre muito toda vez que precisa se separar dos pais." }, { text: "Medo de perder ou algo acontecer aos cuidadores", emoji: "💔", example: "Ex.: Teme constantemente que algo aconteça e ela perca os pais." }, { text: "Evita dormir/sair sem cuidador", emoji: "🚪", example: "Ex.: Recusa dormir na casa de amigos ou sair sem um dos cuidadores." }, { text: "Preocupação antes de separações", emoji: "😟", example: "Ex.: Fica preocupada e agitada bem antes de uma separação prevista." }, { text: "Busca checagem/reasseguramento", emoji: "❓", example: "Ex.: Pergunta várias vezes se está tudo bem, buscando ser tranquilizada." }] },
      { name: "Ansiedade social", color: "text-blue-600 dark:text-blue-400", items: [{ text: "Medo de parecer inadequado", emoji: "😓", example: "Ex.: Tem medo constante de agir de forma errada ou parecer inadequada." }, { text: "Evita desempenho público", emoji: "🎤", example: "Ex.: Evita apresentar trabalhos ou falar na frente da turma." }, { text: "Ansiedade com pessoas novas", emoji: "👥", example: "Ex.: Fica muito ansiosa ao conhecer pessoas novas." }, { text: "Medo de ser ridicularizado", emoji: "😰", example: "Ex.: Tem medo intenso de ser motivo de piada ou de ser zombada." }, { text: "Dificuldade de participar em sala/grupo", emoji: "🙊", example: "Ex.: Tem dificuldade de participar das atividades em sala ou em grupo." }] },
      { name: "Ansiedade generalizada", color: "text-amber-600 dark:text-amber-400", items: [{ text: "Preocupações excessivas", emoji: "💭", example: "Ex.: Vive preocupada com coisas variadas, muito além do esperado para a idade." }, { text: "Tensão por desempenho/escola", emoji: "📝", example: "Ex.: Fica tensa e nervosa com provas, notas e cobranças da escola." }, { text: "Necessidade frequente de reasseguramento", emoji: "🔁", example: "Ex.: Precisa ouvir várias vezes que vai dar tudo certo para se acalmar." }, { text: "Dificuldade de relaxar", emoji: "🛀", example: "Ex.: Tem dificuldade de relaxar e parece sempre 'ligada' e tensa." }, { text: "Irritabilidade ligada a preocupação", emoji: "😠", example: "Ex.: Fica irritada e de pavio curto por causa das preocupações." }] },
      { name: "Panico/somático", color: "text-red-600 dark:text-red-400", items: [{ text: "Medo abrupto intenso", emoji: "⚡", example: "Ex.: Tem um medo que surge de repente, muito forte e sem aviso." }, { text: "Sintomas fisicos de ansiedade", emoji: "💗", example: "Ex.: Sente sintomas no corpo, como coração acelerado e suor, quando fica ansiosa." }, { text: "Medo de nova crise", emoji: "😨", example: "Ex.: Depois de uma crise, vive com medo de ter outra." }, { text: "Evita locais por medo de sintomas", emoji: "🏃", example: "Ex.: Evita ir a certos lugares com medo de passar mal ali de novo." }, { text: "Procura fuga/segurança durante sintomas", emoji: "🚪", example: "Ex.: Durante a crise, procura sair correndo ou buscar um lugar seguro." }] },
      { name: "TOC", color: "text-purple-600 dark:text-purple-400", items: [{ text: "Pensamentos repetitivos intrusivos", emoji: "🔁", example: "Ex.: Tem pensamentos incômodos que invadem a mente e se repetem sozinhos." }, { text: "Rituais/checagens", emoji: "🔒", example: "Ex.: Faz rituais ou checagens repetidas, como lavar as mãos muitas vezes." }, { text: "Tempo gasto com repetições", emoji: "⏳", example: "Ex.: Perde bastante tempo do dia preso a repetições e rituais." }, { text: "Sofrimento se interrompido", emoji: "😣", example: "Ex.: Fica muito angustiada se alguém a interrompe no meio de um ritual." }, { text: "Impacto em rotina por obsessão/compulsão", emoji: "🔁", example: "Ex.: A criança chega atrasada à escola porque precisa lavar as mãos várias vezes antes de sair." }] },
      { name: "Humor depressivo", color: "text-slate-600 dark:text-slate-400", items: [{ text: "Tristeza ou vazio", emoji: "😔", example: "Ex.: A criança diz que se sente triste ou 'vazia' quase todos os dias, sem motivo aparente." }, { text: "Perda de interesse", emoji: "🎈", example: "Ex.: Deixou de querer brincar ou ver desenhos que antes adorava." }, { text: "Culpa/baixa autoestima", emoji: "💭", example: "Ex.: A criança se culpa por tudo e diz que 'não presta' ou 'faz tudo errado'." }, { text: "Fadiga ou lentificação", emoji: "🔋", example: "Ex.: Passa o dia cansada e lentificada, sem energia até para tarefas simples." }, { text: "Prejuizo escolar/social por humor", emoji: "🏫", example: "Ex.: As notas caíram e a criança se afastou dos amigos por causa do humor abatido." }] },
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
      { name: "Participação familiar", color: "text-rose-600 dark:text-rose-400", items: [{ text: "Participa de rituais/checagens", emoji: "✔️", example: "Ex.: Os pais conferem junto o fogão várias vezes para acalmar a criança antes de dormir." }, { text: "Fornece reasseguramento repetitivo", emoji: "🗣️", example: "Ex.: A criança pergunta repetidamente 'você tem certeza que estou bem?' e o adulto sempre responde." }, { text: "Ajuda a evitar gatilhos", emoji: "🚧", example: "Ex.: A família muda o caminho ou esconde objetos para a criança não encontrar o que a assusta." }, { text: "Repete respostas ou ações para reduzir ansiedade", emoji: "🔂", example: "Ex.: A criança repete a mesma frase ou refaz o gesto até 'ficar certo' e diminuir a aflição." }] },
      { name: "Modificação de rotina", color: "text-purple-600 dark:text-purple-400", items: [{ text: "Altera horários ou trajetos por sintomas", emoji: "🕐", example: "Ex.: A família adianta o banho ou troca o trajeto para evitar disparar os sintomas." }, { text: "Evita locais/atividades familiares", emoji: "🚫", example: "Ex.: Deixaram de ir à casa dos avós porque lá a criança fica muito ansiosa." }, { text: "Muda regras domésticas para prevenir crise", emoji: "🏠", example: "Ex.: Os pais criaram regras novas em casa só para evitar que a criança entre em crise." }, { text: "Interrompe escola/trabalho/família por rituais", emoji: "⏸️", example: "Ex.: A mãe falta ao trabalho ou a criança perde aula porque os rituais tomam muito tempo." }] },
      { name: "Impacto e sofrimento", color: "text-fuchsia-600 dark:text-fuchsia-400", items: [{ text: "Conflitos familiares por acomodação", emoji: "💥", example: "Ex.: Os pais discutem entre si sobre até onde ceder às exigências da criança." }, { text: "Sofrimento do cuidador", emoji: "😟", example: "Ex.: O cuidador se sente esgotado e angustiado por lidar com os sintomas todos os dias." }, { text: "Prejuizo em autonomia da criança", emoji: "🧒", example: "Ex.: A criança deixou de fazer sozinha coisas que já sabia, pois o adulto passou a fazer por ela." }, { text: "Dificuldade de reduzir acomodações", emoji: "⚖️", example: "Ex.: Quando a família tenta parar de ceder aos rituais, a criança tem crises intensas." }] },
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
    domains: [{ name: "Desfecho de crises", color: "text-violet-600 dark:text-violet-400", items: [{ text: "Classe de desfecho atual", emoji: "📊", example: "Ex.: O clínico registra o desfecho atual: melhora, estável ou piora do quadro." }] }],
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
    domains: [{ name: "BEARS", color: "text-indigo-600 dark:text-indigo-400", items: [{ text: "B - Dificuldade para iniciar o sono ou resistência para dormir", emoji: "🛏️", example: "Ex.: Na hora de dormir a criança resiste, enrola e demora mais de 30 minutos para pegar no sono." }, { text: "E - Sonolência diurna excessiva", emoji: "😴", example: "Ex.: Cochila na aula ou no carro e parece sonolenta durante o dia." }, { text: "A - Despertares noturnos frequentes ou prolongados", emoji: "🌙", example: "Ex.: Acorda várias vezes de madrugada e demora a voltar a dormir." }, { text: "R - Rotina/regularidade de sono inadequada", emoji: "📆", example: "Ex.: Dorme e acorda em horários muito diferentes a cada dia, sem rotina fixa." }, { text: "S - Ronco, respiração ruidosa ou suspeita de apneia", emoji: "💤", example: "Ex.: Ronca alto e às vezes parece parar de respirar por instantes durante o sono." }] }],
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
    domains: [{ name: "Dor observacional", color: "text-rose-600 dark:text-rose-400", items: [{ text: "Face", emoji: "😣", example: "Ex.: Observar se o rosto está franzido ou com testa enrugada (expressão de dor)." }, { text: "Pernas", emoji: "🦵", example: "Ex.: Observar se as pernas estão esticadas e relaxadas ou encolhidas e tensas." }, { text: "Atividade corporal", emoji: "🤸", example: "Ex.: Observar se o corpo está calmo ou inquieto, contorcendo-se na cama." }, { text: "Choro/vocalização", emoji: "😢", example: "Ex.: Observar se não chora, geme baixinho ou chora forte e contínuo." }, { text: "Consolabilidade", emoji: "🤱", example: "Ex.: Observar se acalma logo no colo ou se é difícil de consolar mesmo com carinho." }] }],
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
    domains: [{ name: "Dor observacional adaptada", color: "text-red-600 dark:text-red-400", items: [{ text: "Face em relação ao basal", emoji: "😐", example: "Ex.: Comparar a expressão do rosto agora com o estado habitual de repouso da criança." }, { text: "Pernas ou postura em relação ao basal", emoji: "🧎", example: "Ex.: Observar se as pernas ou a postura mudaram em relação ao normal da criança." }, { text: "Atividade/movimento em relação ao basal", emoji: "🏃", example: "Ex.: Observar se está mais parada ou mais agitada que o habitual." }, { text: "Choro, gemido ou vocalização atípica", emoji: "🔊", example: "Ex.: Observar choro, gemido ou som fora do comum para aquela criança." }, { text: "Consolabilidade ou resposta ao cuidador", emoji: "🫂", example: "Ex.: Observar se responde ao cuidador e se acalma ao ser acolhida." }] }],
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
    domains: [{ name: "Comportamento observado", color: "text-orange-600 dark:text-orange-400", items: [{ text: "Alerta/estado de vigilia", emoji: "👁️", example: "Ex.: Observar se o bebê está acordado e atento ou sonolento e pouco reativo." }, { text: "Calma ou agitação", emoji: "🧘", example: "Ex.: Observar se está tranquila ou agitada e difícil de acalmar." }, { text: "Resposta respiratória/choro", emoji: "🫁", example: "Ex.: Observar a respiração e o choro: calmo, ofegante ou choroso." }, { text: "Movimento corporal", emoji: "🤾", example: "Ex.: Observar se o corpo está quieto ou com movimentos agitados." }, { text: "Tensão facial", emoji: "😬", example: "Ex.: Observar se o rosto está relaxado ou com músculos tensos e franzidos." }, { text: "Tônus muscular", emoji: "💪", example: "Ex.: Observar se os músculos estão moles, normais ou muito rígidos ao toque." }] }],
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
    domains: [{ name: "Acatisia", color: "text-amber-600 dark:text-amber-400", items: [{ text: "Movimentos inquietos observáveis", emoji: "🦿", example: "Ex.: Observar se a criança balança as pernas, cruza e descruza os pés sem parar." }, { text: "Sensação subjetiva de inquietude", emoji: "🌀", example: "Ex.: A criança relata uma sensação interna de inquietude, como se 'precisasse se mexer'." }, { text: "Sofrimento/desconforto associado", emoji: "😖", example: "Ex.: A criança demonstra desconforto e aflição junto com a inquietação." }, { text: "Impressão clínica global de acatisia", emoji: "🩺", example: "Ex.: Impressão geral do clínico sobre a gravidade da inquietação motora observada." }] }],
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
      { name: "Psiquicos", color: "text-sky-600 dark:text-sky-400", items: [{ text: "Sonolência/sedação", emoji: "😪", example: "Ex.: Depois de começar o remédio, a criança fica sonolenta e sedada durante o dia." }, { text: "Fadiga", emoji: "🥱", example: "Ex.: Sente-se cansada e sem energia mesmo tendo dormido bem." }, { text: "Dificuldade de concentração", emoji: "🎯", example: "Ex.: Tem dificuldade de manter a atenção nas tarefas depois do início do medicamento." }, { text: "Alteração de memória", emoji: "🧠", example: "Ex.: Anda esquecendo recados ou o que acabou de estudar." }, { text: "Ansiedade/inquietação", emoji: "😰", example: "Ex.: Fica mais ansiosa e agitada do que antes de tomar o remédio." }, { text: "Humor deprimido", emoji: "😞", example: "Ex.: O humor ficou mais abatido e triste após iniciar a medicação." }, { text: "Irritabilidade", emoji: "😤", example: "Ex.: Fica facilmente irritada e explode por pequenas coisas." }, { text: "Insonia", emoji: "🌃", example: "Ex.: Passou a ter dificuldade para dormir depois de começar o medicamento." }, { text: "Sonhos vividos", emoji: "💫", example: "Ex.: Relata sonhos muito intensos ou pesadelos vívidos à noite." }, { text: "Apatia", emoji: "😶", example: "Ex.: Fica apática, sem vontade ou reação para as coisas do dia a dia." }, { text: "Tontura subjetiva", emoji: "🌫️", example: "Ex.: Queixa-se de tontura ou sensação de cabeça leve." }, { text: "Outro efeito psíquico", emoji: "🧩", example: "Ex.: Outro efeito no humor ou comportamento notado após o medicamento." }] },
      { name: "Neurológicos", color: "text-violet-600 dark:text-violet-400", items: [{ text: "Tremor", emoji: "🤲", example: "Ex.: As mãos tremem ao segurar o copo ou o lápis após iniciar o remédio." }, { text: "Rigidez", emoji: "🦾", example: "Ex.: Os braços ficam duros e a criança se move de forma rígida." }, { text: "Acatisia", emoji: "🚶", example: "Ex.: Não consegue ficar parada, anda de um lado para o outro por inquietação." }, { text: "Distonia", emoji: "🌀", example: "Ex.: O pescoço ou os olhos entortam de repente numa contração involuntária." }, { text: "Discinesia", emoji: "👅", example: "Ex.: Faz movimentos involuntários da boca ou da língua sem querer." }, { text: "Marcha instável", emoji: "🥴", example: "Ex.: Anda cambaleando, com o equilíbrio instável após o medicamento." }, { text: "Parestesias", emoji: "🐜", example: "Ex.: Sente formigamento ou dormência nas mãos ou nos pés." }, { text: "Cefaleia", emoji: "🤕", example: "Ex.: Queixa-se de dor de cabeça frequente depois de iniciar o remédio." }, { text: "Convulsão/piora de crise", emoji: "⚡", example: "Ex.: As crises convulsivas voltaram ou pioraram após a mudança de medicação." }, { text: "Lentificação motora", emoji: "🐌", example: "Ex.: Os movimentos ficaram mais lentos, demora para reagir e se mexer." }, { text: "Alteração de fala/deglutição", emoji: "🗨️", example: "Ex.: A fala ficou arrastada ou surgiu dificuldade para engolir." }, { text: "Outro efeito neurológico", emoji: "🧩", example: "Ex.: Outro sintoma neurológico observado após o medicamento." }] },
      { name: "Autonomicos", color: "text-teal-600 dark:text-teal-400", items: [{ text: "Boca seca", emoji: "👄", example: "Ex.: Reclama que a boca vive seca e pede água o tempo todo." }, { text: "Sialorreia", emoji: "💧", example: "Ex.: Baba mais que o normal, molhando o travesseiro ou a blusa." }, { text: "Nausea/vomitos", emoji: "🤢", example: "Ex.: Sente enjoo ou vomita depois de tomar o remédio." }, { text: "Constipação", emoji: "🚽", example: "Ex.: Passou a ficar dias sem evacuar, com intestino preso." }, { text: "Diarreia", emoji: "💩", example: "Ex.: Apresenta fezes amolecidas ou diarreia após iniciar a medicação." }, { text: "Sudorese", emoji: "💦", example: "Ex.: Sua muito mais que o normal, mesmo sem calor ou esforço." }, { text: "Palpitações", emoji: "💓", example: "Ex.: Sente o coração acelerado ou batendo forte, como palpitação." }, { text: "Hipotensão/tontura postural", emoji: "🪑", example: "Ex.: Ao levantar rápido, fica tonta e sente que vai desmaiar." }, { text: "Retenção urinária", emoji: "🚻", example: "Ex.: Tem dificuldade para urinar ou sensação de bexiga que não esvazia." }, { text: "Alteração visual", emoji: "👓", example: "Ex.: Queixa-se de visão embaçada depois de começar o medicamento." }, { text: "Aumento de apetite", emoji: "🍽️", example: "Ex.: Passou a sentir muito mais fome e a comer bem mais que antes." }, { text: "Outro efeito autonômico", emoji: "🧩", example: "Ex.: Outro efeito no corpo (autonômico) percebido após o remédio." }] },
      { name: "Outros", color: "text-slate-600 dark:text-slate-400", items: [{ text: "Ganho de peso", emoji: "⚖️", example: "Ex.: A criança ganhou peso de forma nítida desde que iniciou a medicação." }, { text: "Perda de peso", emoji: "📉", example: "Ex.: A criança emagreceu sem explicação após começar o remédio." }, { text: "Alteração de libido/puberdade", emoji: "🌱", example: "Ex.: Notou mudança no interesse afetivo ou nos sinais da puberdade." }, { text: "Alteração menstrual/prolactina", emoji: "🩸", example: "Ex.: A menstruação ficou irregular ou surgiu saída de leite fora da amamentação." }, { text: "Erupção cutânea", emoji: "🌡️", example: "Ex.: Apareceram manchas ou vermelhidão na pele após iniciar o medicamento." }, { text: "Prurido", emoji: "🙌", example: "Ex.: A criança se coça muito, com a pele irritada e com prurido." }, { text: "Edema", emoji: "🫧", example: "Ex.: Notou inchaço nos pés, nas pernas ou no rosto." }, { text: "Dor abdominal", emoji: "🤰", example: "Ex.: Queixa-se de dor na barriga com frequência após o remédio." }, { text: "Febre/mal-estar", emoji: "🤒", example: "Ex.: Apresentou febre ou mal-estar geral depois de iniciar a medicação." }, { text: "Alteração laboratorial conhecida", emoji: "🧪", example: "Ex.: Um exame de sangue já mostrou alteração conhecida ligada ao medicamento." }, { text: "Queda ou acidente relacionado", emoji: "🩹", example: "Ex.: Sofreu uma queda ou acidente por tontura ou desequilíbrio do remédio." }, { text: "Outro efeito relevante", emoji: "🧩", example: "Ex.: Outro efeito importante notado que vale registrar para o médico." }] },
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
          { text: "De bruços, levanta o queixo e vira a cabeça para o lado", emoji: "👶", example: "Ex.: De barriga para baixo, o bebê levanta o queixo e vira a cabeça de lado." },
          { text: "De bruços, sustenta a cabeça a ~45° apoiado nos antebraços", emoji: "💪", example: "Ex.: De bruços, apoia nos antebraços e ergue a cabeça uns 45° para olhar em volta." },
          { text: "Quando puxado para sentar, a cabeça acompanha o tronco (não cai para trás)", emoji: "🤲", example: "Ex.: Ao ser puxado pelas mãos para sentar, a cabeça vem junto e não cai para trás." },
          { text: "Sustenta a cabeça firme e estável quando no colo, na vertical", emoji: "🧍", example: "Ex.: No colo, na vertical, mantém a cabeça firme e estável sem balançar." },
          { text: "De bruços, eleva o tronco com os braços esticados", emoji: "🙆", example: "Ex.: De bruços, estica os braços e ergue o peito do chão, olhando para frente." },
          { text: "Junta as duas mãos na linha média (sobre o peito)", emoji: "🙏", example: "Ex.: Deitado, junta as duas mãozinhas no meio do peito e brinca com elas." },
          { text: "Leva as mãos ou objetos à boca", emoji: "👐", example: "Ex.: Leva as próprias mãos ou um brinquedo à boca para explorar." },
          { text: "Rola da barriga para as costas", emoji: "🔄", example: "Ex.: Sozinho, rola da barriga para as costas." },
          { text: "Rola das costas para a barriga", emoji: "↩️", example: "Ex.: Sozinho, rola das costas para a barriga." },
          { text: "Senta com apoio mantendo as costas eretas por alguns instantes", emoji: "🪑", example: "Ex.: Com um apoio, fica sentado de costas eretas por alguns instantes." },
          { text: "Segurado em pé, suporta parte do peso nas pernas", emoji: "🦵", example: "Ex.: Segurado em pé, empurra e aguenta parte do peso do corpo nas pernas." },
          { text: "Estende os braços para alcançar um objeto à frente", emoji: "🫳", example: "Ex.: Estica o braço para alcançar um brinquedo colocado à frente dele." },
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
          { text: "Senta sem apoio por vários minutos, com as mãos livres", emoji: "🧘", example: "Ex.: Fica sentado sozinho por vários minutos, com as mãos livres para brincar." },
          { text: "Passa de deitado para sentado sozinho", emoji: "⬆️", example: "Ex.: Sozinho, sai da posição deitada e se senta sem ajuda." },
          { text: "Arrasta-se ou rasteja pelo chão", emoji: "🐛", example: "Ex.: Arrasta-se ou rasteja pelo chão para alcançar o que quer." },
          { text: "Engatinha apoiado em mãos e joelhos", emoji: "🐾", example: "Ex.: Engatinha apoiado nas mãos e nos joelhos pela casa." },
          { text: "Puxa-se para ficar de pé apoiando em móveis", emoji: "🛋️", example: "Ex.: Segura no sofá ou na mesa e se puxa até ficar de pé." },
          { text: "Fica de pé segurando com as duas mãos", emoji: "🧍", example: "Ex.: Fica de pé segurando com as duas mãos em um apoio." },
          { text: "Anda de lado apoiado nos móveis (marcha lateral)", emoji: "↔️", example: "Ex.: De pé, anda de lado dando passinhos apoiado nos móveis." },
          { text: "Fica de pé sozinho por alguns segundos", emoji: "🕴️", example: "Ex.: Fica de pé sozinho, sem apoio, por alguns segundos." },
          { text: "Abaixa-se e levanta-se segurando em um apoio", emoji: "🤸", example: "Ex.: Segurando em um apoio, agacha para pegar algo e volta a levantar." },
          { text: "Dá passos segurando em uma das mãos do adulto", emoji: "🤝", example: "Ex.: Dá passos segurando em apenas uma das mãos do adulto." },
          { text: "Dá os primeiros passos sozinho", emoji: "👣", example: "Ex.: Solta o apoio e dá os primeiros passinhos sozinho." },
          { text: "Mantém o equilíbrio sentado quando empurrado de leve", emoji: "⚖️", example: "Ex.: Sentado, se equilibra e não cai quando recebe um empurrãozinho leve." },
          { text: "Gira o tronco sentado para pegar um objeto ao lado", emoji: "🔃", example: "Ex.: Sentado, gira o tronco para pegar um brinquedo que está ao lado." },
          { text: "Sustenta o peso firme nas pernas quando segurado em pé", emoji: "🦿", example: "Ex.: Segurado em pé, firma bem as pernas e sustenta o próprio peso." },
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
          { text: "Reage a sons altos (assusta, pisca ou se aquieta)", emoji: "🔔", example: "Ex.: Ao ouvir um barulho alto, o bebê se assusta, pisca ou se aquieta." },
          { text: "Acalma-se ou presta atenção ao ouvir a voz da mãe/pai", emoji: "🗣️", example: "Ex.: Ao ouvir a voz da mãe ou do pai, o bebê se acalma e presta atenção." },
          { text: "Vira a cabeça em direção a um som ou voz", emoji: "👂", example: "Ex.: Vira a cabeça na direção de um som ou de uma voz que o chama." },
          { text: "Balbucia sons repetidos (“agu”, “ba-ba”, “da-da”)", emoji: "🍼", example: "Ex.: Balbucia sons repetidos como 'agu', 'ba-ba' ou 'da-da'." },
          { text: "Ri alto e faz sons para chamar atenção", emoji: "😄", example: "Ex.: Ri alto e faz sons para chamar a atenção dos adultos." },
          { text: "Responde ao próprio nome virando-se", emoji: "🙋", example: "Ex.: Quando você chama pelo nome, ele se vira para olhar." },
          { text: "Entende “não” e para por um instante", emoji: "🚫", example: "Ex.: Ao ouvir 'não', para por um instante o que estava fazendo." },
          { text: "Imita sons ou sílabas que você faz", emoji: "🦜", example: "Ex.: Repete os sons ou sílabas que você faz, como numa brincadeira de imitar." },
          { text: "Fala a primeira palavra com sentido (“mamã”, “papá”, “dá”)", emoji: "💬", example: "Ex.: Fala a primeira palavra com sentido, como 'mamã', 'papá' ou 'dá'." },
          { text: "Usa gestos como dar tchau, mandar beijo ou apontar", emoji: "👋", example: "Ex.: Dá tchau, manda beijo ou aponta para se comunicar por gestos." },
          { text: "Aponta para pedir ou mostrar algo", emoji: "☝️", example: "Ex.: Aponta com o dedo para pedir um objeto ou mostrar algo que viu." },
          { text: "Entende ordens simples sem gesto (“cadê a bola?”, “vem”)", emoji: "🧠", example: "Ex.: Entende pedidos simples sem gesto, como 'cadê a bola?' ou 'vem cá'." },
          { text: "Fala 5 ou mais palavras com sentido", emoji: "🗨️", example: "Ex.: Já fala cinco ou mais palavras com sentido no dia a dia." },
          { text: "Aponta partes do corpo ou figuras quando você nomeia", emoji: "👉", example: "Ex.: Quando você nomeia, aponta partes do corpo ou figuras num livro." },
          { text: "Fala 10 a 20 palavras ou mais", emoji: "📚", example: "Ex.: Já usa de 10 a 20 palavras ou mais para se comunicar." },
          { text: "Junta duas palavrinhas (“quer água”, “cadê papá”)", emoji: "🔗", example: "Ex.: Junta duas palavrinhas, como 'quer água' ou 'cadê papá'." },
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
          { text: "Olha nos seus olhos durante o cuidado e a mamada", emoji: "👀", example: "Ex.: Olha nos seus olhos durante a mamada e os cuidados." },
          { text: "Sorri quando você sorri ou conversa com ele (sorriso social)", emoji: "😊", example: "Ex.: Sorri de volta quando você sorri ou conversa com ele." },
          { text: "Acalma-se no colo quando está aflito", emoji: "🤱", example: "Ex.: Quando está aflito, acalma-se ao ser pego no colo." },
          { text: "Demonstra prazer ao ver rostos conhecidos", emoji: "🥰", example: "Ex.: Fica alegre e animado ao ver rostos conhecidos, como os avós." },
          { text: "Ri alto e demonstra alegria nas brincadeiras", emoji: "😆", example: "Ex.: Ri alto e demonstra alegria durante as brincadeiras." },
          { text: "Estranha pessoas desconhecidas", emoji: "🙈", example: "Ex.: Fica desconfiado ou chora diante de pessoas desconhecidas." },
          { text: "Procura o cuidador quando está inseguro ou assustado", emoji: "🫂", example: "Ex.: Quando se assusta, procura o cuidador em busca de segurança." },
          { text: "Mostra apego a uma pessoa principal", emoji: "💞", example: "Ex.: Mostra apego especial a uma pessoa principal que cuida dele." },
          { text: "Imita expressões faciais (caretas, língua de fora)", emoji: "😜", example: "Ex.: Imita caretas ou põe a língua para fora copiando você." },
          { text: "Brinca de “achou!” (esconde-esconde) com prazer", emoji: "🙈", example: "Ex.: Brinca de 'achou!', escondendo o rosto e revelando com prazer." },
          { text: "Estende os braços pedindo colo", emoji: "🙆", example: "Ex.: Estica os bracinhos para cima pedindo para ser pego no colo." },
          { text: "Mostra objetos a você só para compartilhar interesse", emoji: "🎁", example: "Ex.: Mostra um brinquedo a você só para dividir o que achou interessante." },
          { text: "Demonstra afeto (abraça, dá beijo, encosta o rosto)", emoji: "🤗", example: "Ex.: Demonstra carinho abraçando, dando beijo ou encostando o rosto." },
          { text: "Reage às emoções dos outros (preocupa-se se alguém chora)", emoji: "💗", example: "Ex.: Fica preocupado ou sério quando vê outra criança chorando." },
          { text: "Brinca perto de outras crianças com interesse", emoji: "🧸", example: "Ex.: Brinca perto de outras crianças, observando e se interessando por elas." },
          { text: "Busca aprovação ou mostra orgulho ao conseguir algo", emoji: "🏅", example: "Ex.: Ao conseguir algo, olha buscando elogio e mostra orgulho." },
          { text: "Começa a brincar de faz de conta (dar comida à boneca)", emoji: "🍽️", example: "Ex.: Brinca de faz de conta, como dar comidinha à boneca." },
          { text: "Separa-se do cuidador sem crise intensa e prolongada", emoji: "👋", example: "Ex.: Consegue se separar do cuidador sem crise intensa e demorada." },
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
          { text: "Faz pinça fina (polegar e indicador) para pegar objetos pequenos", emoji: "🤏", example: "Ex.: Pega uma migalha ou objeto pequeno usando polegar e indicador (pinça)." },
          { text: "Bate dois objetos ou cubos um no outro", emoji: "🧱", example: "Ex.: segura um bloco em cada mão e bate um no outro para fazer barulho." },
          { text: "Solta objetos voluntariamente (entrega na sua mão quando pedido)", emoji: "🤲", example: "Ex.: quando você pede 'me dá', ele abre a mão e coloca o brinquedo na sua palma." },
          { text: "Empilha 2 cubos", emoji: "🧱", example: "Ex.: coloca um cubo em cima do outro sem derrubar." },
          { text: "Empilha 3 a 4 cubos", emoji: "🏗️", example: "Ex.: monta uma torrinha de 3 ou 4 blocos empilhados." },
          { text: "Coloca objetos pequenos dentro de um recipiente", emoji: "🪣", example: "Ex.: pega tampinhas ou peças pequenas e coloca dentro de um potinho." },
          { text: "Vira páginas de um livro (mesmo várias de uma vez)", emoji: "📖", example: "Ex.: folheia um livro de figuras, às vezes virando várias páginas juntas." },
          { text: "Segura o lápis/giz e rabisca espontaneamente", emoji: "✏️", example: "Ex.: pega o giz e faz rabiscos no papel por conta própria." },
          { text: "Empilha 6 ou mais cubos", emoji: "🗼", example: "Ex.: empilha 6 ou mais cubos numa torre alta." },
          { text: "Imita um traço com direção no papel", emoji: "〰️", example: "Ex.: você faz um risco e ela tenta copiar um traço na mesma direção." },
          { text: "Imita uma linha vertical", emoji: "📏", example: "Ex.: observe se ela copia uma linha de cima para baixo depois de você desenhar." },
          { text: "Encaixa formas simples num tabuleiro de encaixe", emoji: "🧩", example: "Ex.: coloca o círculo e o quadrado nos buracos certos do tabuleiro." },
          { text: "Rosqueia ou desrosqueia uma tampa", emoji: "🍯", example: "Ex.: gira a tampa de um potinho para abrir ou fechar." },
          { text: "Come sozinho com a colher derramando pouco", emoji: "🥄", example: "Ex.: leva a colher com comida à boca deixando cair só um pouquinho." },
          { text: "Faz torre de 8 cubos ou imita um círculo", emoji: "⭕", example: "Ex.: faz torre de 8 cubos ou copia um círculo que você desenhou." },
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
          { text: "Segue com o olhar quando você aponta para algo distante", emoji: "👉", example: "Ex.: você aponta para o avião no céu e ela olha na direção que você indicou." },
          { text: "Olha na direção para onde você vira a cabeça ou os olhos", emoji: "👀", example: "Ex.: quando você vira a cabeça para a porta, ela também olha para lá." },
          { text: "Aponta com o dedo para PEDIR algo que quer", emoji: "☝️", example: "Ex.: aponta para o biscoito na prateleira para você pegar para ele." },
          { text: "Aponta com o dedo para MOSTRAR/compartilhar algo interessante", emoji: "👆", example: "Ex.: aponta para o cachorro na rua só para você ver junto com ela." },
          { text: "Alterna o olhar entre você e o objeto de interesse", emoji: "🔄", example: "Ex.: olha o brinquedo, olha para você e volta a olhar o brinquedo." },
          { text: "Traz ou mostra objetos a você só para compartilhar", emoji: "🎁", example: "Ex.: traz um brinquedo até você só para mostrar, sem querer nada em troca." },
          { text: "Olha para o seu rosto para checar sua reação (referência social)", emoji: "🙂", example: "Ex.: antes de mexer em algo novo, olha seu rosto para ver se pode." },
          { text: "Responde ao nome virando-se e olhando", emoji: "📛", example: "Ex.: você chama o nome dela e ela se vira para olhar." },
          { text: "Imita gestos sociais (dar tchau, bater palma)", emoji: "👋", example: "Ex.: imita quando você dá tchau ou bate palmas." },
          { text: "Compartilha sorriso e alegria olhando para você na brincadeira", emoji: "😄", example: "Ex.: durante a brincadeira, ela ri olhando para o seu rosto compartilhando a alegria." },
          { text: "Segue uma ordem simples acompanhada de gesto", emoji: "🖐️", example: "Ex.: você diz 'me dá' estendendo a mão e ela entrega o objeto." },
          { text: "Busca o seu olhar para iniciar uma interação ou brincadeira", emoji: "🤝", example: "Ex.: procura o seu olhar para chamar você para brincar de novo." },
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
          { text: "Assusta-se ou pisca com sons altos e inesperados", emoji: "😨", example: "Ex.: uma porta bate forte e ela pisca ou se assusta com o barulho." },
          { text: "Acalma-se ao ouvir a voz da mãe/pai", emoji: "🫂", example: "Ex.: está chorando e se acalma ao ouvir a voz da mãe ou do pai." },
          { text: "Vira os olhos ou a cabeça procurando a origem do som", emoji: "👂", example: "Ex.: ouve um chocalho ao lado e vira os olhos ou a cabeça para o som." },
          { text: "Mexe-se ou acorda com barulhos altos durante o sono leve", emoji: "😴", example: "Ex.: durante o soninho leve, se mexe ou acorda quando há um barulho alto." },
          { text: "Reage à música (aquieta-se, anima-se ou balança)", emoji: "🎵", example: "Ex.: quando toca uma música, ela para para ouvir, se anima ou balança o corpo." },
          { text: "Vira-se em direção ao próprio nome quando chamado", emoji: "🗣️", example: "Ex.: você chama o nome dela do outro cômodo e ela se vira para a sua voz." },
          { text: "Entende e responde a “não” ou “tchau” pelo som", emoji: "🚫", example: "Ex.: para o que está fazendo ao ouvir 'não' ou acena ao ouvir 'tchau'." },
          { text: "Imita sons e sílabas que escuta", emoji: "🔁", example: "Ex.: você faz 'ba-ba-ba' e ela tenta repetir os mesmos sons." },
          { text: "Olha ou aponta o objeto certo quando você nomeia sem gesto", emoji: "🎯", example: "Ex.: você diz 'cadê a bola?' sem apontar e ela olha para a bola certa." },
          { text: "Atende a pedidos simples só pela fala (sem você mostrar)", emoji: "🦻", example: "Ex.: você pede 'pega o sapato' só falando e ela busca sem você mostrar." },
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
          { text: "Fixa o olhar no rosto de quem o segura", emoji: "👁️", example: "Ex.: no colo, fixa o olhar no rosto de quem está segurando." },
          { text: "Segue um rosto ou objeto que se move lentamente na horizontal", emoji: "↔️", example: "Ex.: acompanha com os olhos um brinquedo que você move devagar de um lado ao outro." },
          { text: "Segue um objeto na vertical e em círculo", emoji: "🔵", example: "Ex.: segue com o olhar um objeto que sobe, desce e faz círculos." },
          { text: "Olha para as próprias mãos e as explora visualmente", emoji: "✋", example: "Ex.: fica olhando e examinando as próprias mãos, mexendo os dedos." },
          { text: "Sorri ao ver o rosto da mãe/pai a alguma distância", emoji: "😊", example: "Ex.: sorri ao reconhecer o rosto do pai ou da mãe de longe." },
          { text: "Procura com os olhos a origem de um som", emoji: "🔊", example: "Ex.: ouve um som e move os olhos procurando de onde vem." },
          { text: "Alcança com precisão um objeto que vê (coordenação olho-mão)", emoji: "🖐️", example: "Ex.: vê um brinquedo e estende a mão pegando com precisão." },
          { text: "Olha para objetos pequenos (migalha, pequeno brinquedo)", emoji: "🔎", example: "Ex.: repara em coisas pequenas, como uma migalha ou um brinquedinho no chão." },
          { text: "Reconhece visualmente o peito/mamadeira e se anima", emoji: "🍼", example: "Ex.: vê a mamadeira ou o peito chegando e se agita de alegria." },
          { text: "Acompanha com o olhar objetos que caem ou se afastam", emoji: "⬇️", example: "Ex.: acompanha com o olhar a bola que cai da mesa ou rola para longe." },
          { text: "Mantém contato visual durante a interação", emoji: "👁️", example: "Ex.: mantém o olhar nos seus olhos durante a conversa ou brincadeira." },
          { text: "Reage a expressões faciais (responde a sorriso ou careta)", emoji: "😲", example: "Ex.: você sorri e ela sorri de volta, ou estranha quando você faz careta." },
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
          { text: "Come sozinho com a colher sem derramar muito", emoji: "🥄", example: "Ex.: come sozinha usando a colher sem sujar muito ao redor." },
          { text: "Bebe no copo sozinho sem entornar", emoji: "🥤", example: "Ex.: bebe água no copo segurando sozinha sem derramar." },
          { text: "Usa o garfo para se alimentar", emoji: "🍴", example: "Ex.: espeta a comida com o garfo e leva à boca sozinha." },
          { text: "Tira peças simples de roupa (meia, sapato, casaco aberto)", emoji: "🧦", example: "Ex.: tira sozinha a meia, o sapato ou o casaco já aberto." },
          { text: "Veste peças simples (calça, blusa) com pouca ajuda", emoji: "👕", example: "Ex.: veste a calça ou a blusa precisando de pouca ajuda." },
          { text: "Lava e seca as mãos sozinho", emoji: "🧼", example: "Ex.: lava as mãos com sabonete e seca na toalha sozinha." },
          { text: "Escova os dentes com supervisão", emoji: "🪥", example: "Ex.: escova os dentes enquanto um adulto acompanha e ajuda a finalizar." },
          { text: "Avisa quando está com vontade de fazer xixi ou cocô", emoji: "🚽", example: "Ex.: avisa 'xixi' ou faz sinal antes de fazer nas fraldas." },
          { text: "Usa o penico ou o vaso com ajuda", emoji: "🚽", example: "Ex.: senta no penico ou no vaso quando um adulto ajuda a posicionar." },
          { text: "Fica seco durante o dia (controle do xixi)", emoji: "☀️", example: "Ex.: passa o dia todo sem molhar a roupa, controlando o xixi." },
          { text: "Tenta calçar os sapatos (mesmo no pé trocado)", emoji: "👟", example: "Ex.: tenta colocar os sapatos sozinha, às vezes no pé trocado." },
          { text: "Abre e fecha fechos simples (velcro, zíper grande)", emoji: "🤐", example: "Ex.: abre e fecha o velcro do tênis ou um zíper grande do casaco." },
          { text: "Guarda os brinquedos quando pedido", emoji: "🧸", example: "Ex.: quando você pede, guarda os brinquedos na caixa." },
          { text: "Ajuda em tarefas simples de casa", emoji: "🧹", example: "Ex.: ajuda a colocar a roupa no cesto ou levar o prato à pia." },
          { text: "Esfrega o corpo no banho com supervisão", emoji: "🛁", example: "Ex.: no banho, passa a esponja no corpo enquanto o adulto supervisiona." },
          { text: "Assoa o nariz com ajuda", emoji: "🤧", example: "Ex.: assoa o nariz no lenço quando um adulto ajuda a segurar." },
          { text: "Come uma refeição completa sozinho", emoji: "🍽️", example: "Ex.: come do começo ao fim uma refeição sem precisar ser alimentada." },
          { text: "Veste-se quase sozinho", emoji: "🧥", example: "Ex.: coloca quase todas as roupas sozinha, precisando de ajuda só nos detalhes." },
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
          { text: "Segue o olhar ou o apontar do adulto para um objeto distante", emoji: "👉", example: "Ex.: o adulto aponta para um brinquedo longe e a criança olha para lá." },
          { text: "Aponta com o dedo para PEDIR algo que quer", emoji: "☝️", example: "Ex.: aponta para o pote de bolacha no alto para pedir que peguem para ela." },
          { text: "Aponta com o dedo para MOSTRAR/compartilhar (apontar declarativo)", emoji: "👆", example: "Ex.: aponta para o passarinho só para mostrar e dividir a descoberta." },
          { text: "Mostra ou traz objetos ao adulto só para compartilhar interesse", emoji: "🎁", example: "Ex.: leva um desenho até o adulto apenas para mostrar, sem pedir nada." },
          { text: "Alterna o olhar entre o objeto e o rosto do adulto", emoji: "🔄", example: "Ex.: olha o brinquedo, olha o rosto do adulto e volta a olhar o brinquedo." },
          { text: "Olha para o rosto do adulto para checar a reação (referência social)", emoji: "🙂", example: "Ex.: antes de fazer algo novo, olha o rosto do adulto para ver a reação." },
          { text: "Responde ao próprio nome olhando", emoji: "📛", example: "Ex.: alguém chama seu nome e ela levanta o olhar em resposta." },
          { text: "Compartilha sorriso e alegria olhando para o adulto", emoji: "😄", example: "Ex.: ri de alegria olhando para o rosto do adulto durante a brincadeira." },
          { text: "Imita gestos sociais (tchau, palmas, mandar beijo)", emoji: "👋", example: "Ex.: imita dar tchau, bater palmas ou mandar beijo." },
          { text: "Inicia momentos de atenção compartilhada (mostrar um livro, brincar junto)", emoji: "🤗", example: "Ex.: chama o adulto para ver um livro ou puxa para brincar junto." },
          { text: "Segue uma ordem simples acompanhada de gesto", emoji: "🖐️", example: "Ex.: você diz 'me dá a bola' com a mão estendida e ela entrega." },
          { text: "Busca o olhar do adulto para iniciar uma interação", emoji: "🤝", example: "Ex.: procura o olhar do adulto para começar uma brincadeira." },
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
          { text: "Reconhece emoções básicas em rostos (alegre, triste, bravo, com medo)", emoji: "😊", example: "Ex.: vê uma foto e diz se a pessoa está feliz, triste, brava ou com medo." },
          { text: "Nomeia como ela mesma está se sentindo", emoji: "💬", example: "Ex.: consegue dizer 'estou com raiva' ou 'estou triste' quando sente." },
          { text: "Entende que outra pessoa pode querer algo diferente do que ela quer", emoji: "🤔", example: "Ex.: entende que o amigo pode querer o brinquedo azul enquanto ela quer o vermelho." },
          { text: "Entende que alguém pode não saber de algo que ela sabe", emoji: "🧠", example: "Ex.: percebe que a mãe não sabe onde ela escondeu o brinquedo." },
          { text: "Passa em tarefa de falsa crença de 1ª ordem (“onde ele vai procurar?”)", emoji: "🔍", example: "Ex.: na história, sabe que o personagem vai procurar onde ele deixou, não onde está agora." },
          { text: "Entende que as pessoas agem conforme acreditam, mesmo quando estão erradas", emoji: "💭", example: "Ex.: entende que alguém pega a caixa achando que tem bolacha, mesmo estando vazia." },
          { text: "Percebe quando alguém está brincando, mentindo ou sendo irônico", emoji: "😜", example: "Ex.: percebe quando alguém está de brincadeira, contando mentira ou falando irônico." },
          { text: "Entende uma piada ou expressão figurada simples", emoji: "😂", example: "Ex.: ri e entende uma piada simples ou uma expressão como 'chover canivete'." },
          { text: "Ajusta o que fala conforme o que o ouvinte já sabe", emoji: "🗣️", example: "Ex.: explica com mais detalhes para quem não estava presente na história." },
          { text: "Demonstra empatia — preocupa-se quando alguém se machuca ou chora", emoji: "❤️", example: "Ex.: fica preocupada e tenta consolar quando um amigo se machuca e chora." },
          { text: "Prevê como o outro vai reagir a uma situação", emoji: "🔮", example: "Ex.: prevê que o irmão vai ficar bravo se ela pegar o brinquedo dele." },
          { text: "Entende falsa crença de 2ª ordem (“o que ele acha que ela pensa?”)", emoji: "🧩", example: "Ex.: entende o que o João pensa que a Maria está pensando na história." },
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
          { text: "Explora os brinquedos de forma variada (não só leva à boca ou joga)", emoji: "🧸", example: "Ex.: explora os brinquedos de várias formas, não só levando à boca ou jogando." },
          { text: "Usa os objetos pela função (empurra o carrinho, alimenta a boneca)", emoji: "🚗", example: "Ex.: empurra o carrinho fazendo de conta que anda e dá comida à boneca." },
          { text: "Brinca de faz de conta simples (fingir comer, falar ao telefone)", emoji: "📞", example: "Ex.: finge comer de um prato vazio ou falar num telefone de brinquedo." },
          { text: "Cria histórias ou cenários no faz de conta", emoji: "🎭", example: "Ex.: inventa histórias, como a boneca que vai ao médico e depois à escola." },
          { text: "Usa um objeto representando outro (banana vira telefone)", emoji: "🍌", example: "Ex.: usa uma banana fingindo que é um telefone." },
          { text: "Brinca de forma sequenciada (encadeia ações com sentido)", emoji: "🔗", example: "Ex.: encadeia ações com sentido: enche a panela, cozinha e serve a comida." },
          { text: "Aceita que o adulto entre na brincadeira e a modifique", emoji: "🙋", example: "Ex.: deixa o adulto entrar na brincadeira e aceita quando ele muda o rumo." },
          { text: "Brinca ao lado de outras crianças (jogo paralelo)", emoji: "👫", example: "Ex.: brinca ao lado de outras crianças, cada uma no seu, sem se juntarem." },
          { text: "Brinca junto com outras crianças (jogo cooperativo)", emoji: "🤸", example: "Ex.: brinca junto com outras crianças, combinando e cooperando na mesma brincadeira." },
          { text: "Respeita a vez nos jogos de turnos", emoji: "🎲", example: "Ex.: espera a sua vez de jogar o dado ou de brincar no jogo de turnos." },
          { text: "Imita brincadeiras que viu outras crianças fazendo", emoji: "👀", example: "Ex.: repete uma brincadeira que viu outras crianças fazendo." },
          { text: "Demonstra prazer e flexibilidade ao brincar (não fica preso a um único padrão)", emoji: "😁", example: "Ex.: se diverte brincando e aceita variar, sem ficar preso a um único jeito." },
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
          { text: "Usa a linguagem para PEDIR o que quer", emoji: "🙏", example: "Ex.: fala 'quero água' ou 'me dá' para pedir o que deseja." },
          { text: "Usa a linguagem para COMENTAR e compartilhar (não só para pedir)", emoji: "💬", example: "Ex.: comenta 'olha o cachorro!' só para compartilhar, sem pedir nada." },
          { text: "Faz perguntas para obter informação", emoji: "❓", example: "Ex.: pergunta 'o que é isso?' ou 'cadê a vovó?' para saber." },
          { text: "Responde a perguntas de forma pertinente (no assunto)", emoji: "✅", example: "Ex.: você pergunta 'o que você comeu?' e ela responde no assunto." },
          { text: "Inicia uma conversa espontaneamente", emoji: "🗨️", example: "Ex.: começa a conversar sozinha, contando algo que aconteceu." },
          { text: "Mantém o tema da conversa por várias trocas", emoji: "🔗", example: "Ex.: continua falando sobre o mesmo assunto por várias trocas de fala." },
          { text: "Respeita a vez de falar (não monopoliza nem interrompe sempre)", emoji: "⏳", example: "Ex.: espera o outro terminar de falar antes de responder, sem interromper sempre." },
          { text: "Repara a comunicação quando não é entendida (tenta de novo de outro jeito)", emoji: "🔄", example: "Ex.: quando não entendem, ela repete de outro jeito para se fazer clara." },
          { text: "Ajusta a fala ao interlocutor (fala diferente com um bebê e com um adulto)", emoji: "👶", example: "Ex.: fala mais devagar e simples com um bebê e diferente com um adulto." },
          { text: "Usa e entende gestos, expressão facial e tom junto com a fala", emoji: "🙌", example: "Ex.: usa gestos, expressão do rosto e tom de voz junto com as palavras." },
          { text: "Entende linguagem não-literal simples (ironia, expressões, piadas)", emoji: "😏", example: "Ex.: entende uma ironia ou piada simples sem levar tudo ao pé da letra." },
          { text: "Usa saudações e fórmulas sociais (oi, tchau, obrigado) no momento certo", emoji: "🤝", example: "Ex.: diz 'oi', 'tchau' e 'obrigado' na hora certa." },
          { text: "Conta um acontecimento de forma que o ouvinte acompanhe (narrativa)", emoji: "📖", example: "Ex.: conta o passeio na ordem, de modo que quem ouve entenda a história." },
          { text: "Percebe e responde às pistas do ouvinte (interesse, tédio, dúvida)", emoji: "👂", example: "Ex.: percebe quando o ouvinte perde o interesse e muda ou encerra o assunto." },
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
          { text: "Demonstra intenção de se comunicar (mesmo sem fala)", emoji: "💡", example: "Ex.: mesmo sem falar, mostra que quer se comunicar puxando ou olhando." },
          { text: "Usa o olhar dirigido para se comunicar", emoji: "👁️", example: "Ex.: olha para o objeto e depois para você para indicar o que quer." },
          { text: "Usa gestos para pedir ou recusar", emoji: "🙅", example: "Ex.: estende a mão para pedir ou empurra e balança a cabeça para recusar." },
          { text: "Aponta para pedir ou para mostrar", emoji: "☝️", example: "Ex.: aponta para pedir a bolacha ou para mostrar um avião no céu." },
          { text: "Leva o adulto pela mão até o que quer", emoji: "🤚", example: "Ex.: pega a sua mão e leva até a geladeira para pedir o que quer." },
          { text: "Entende ordens simples faladas", emoji: "🗣️", example: "Ex.: entende pedidos falados simples como 'senta' ou 'vem cá'." },
          { text: "Entende figuras ou fotos de objetos e ações", emoji: "🖼️", example: "Ex.: reconhece na figura um cachorro ou alguém comendo." },
          { text: "Faz escolhas quando lhe mostram duas opções", emoji: "🤲", example: "Ex.: você mostra duas frutas e ela escolhe pegando ou apontando uma." },
          { text: "Usa sons, palavras ou aproximações para se comunicar", emoji: "🔤", example: "Ex.: usa sons, palavras ou aproximações ('ága' para água) para se comunicar." },
          { text: "Comunica diferentes funções (pedir, recusar, comentar, cumprimentar)", emoji: "📣", example: "Ex.: pede, recusa, comenta e cumprimenta em situações diferentes." },
          { text: "Responde quando alguém tenta se comunicar com ela", emoji: "↩️", example: "Ex.: quando alguém fala com ela, responde de algum jeito, olhando ou fazendo som." },
          { text: "Usa ou aceitaria recursos visuais (figuras, prancha, tablet) para se expressar", emoji: "📱", example: "Ex.: usa ou aceitaria figuras, prancha ou tablet para dizer o que quer." },
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
          { text: "Comunica o que quer de forma clara", emoji: "🎯", example: "Ex.: consegue mostrar de forma clara o que deseja, sem gerar confusão." },
          { text: "Usa mais palavras ou frases do que antes", emoji: "📈", example: "Ex.: começou a usar mais palavras ou frases do que usava antes." },
          { text: "Responde quando falam com ela", emoji: "💬", example: "Ex.: quando alguém fala com ela, ela reage e responde." },
          { text: "Inicia comunicação espontaneamente", emoji: "🚀", example: "Ex.: começa a comunicação por conta própria, sem esperar ser chamada." },
          { text: "Entende o que lhe é pedido", emoji: "🧠", example: "Ex.: entende e faz o que foi pedido, como 'pega o copo'." },
        ],
      },
      {
        name: "Social",
        color: "text-pink-600 dark:text-pink-400",
        items: [
          { text: "Busca e aceita interação com outras pessoas", emoji: "🤝", example: "Ex.: procura outras pessoas e aceita brincar ou interagir com elas." },
          { text: "Brinca ou convive melhor com outras crianças", emoji: "👫", example: "Ex.: brinca e convive com outras crianças com mais facilidade que antes." },
          { text: "Faz contato visual e compartilha atenção", emoji: "👁️", example: "Ex.: olha nos olhos e divide a atenção com o outro na brincadeira." },
          { text: "Demonstra afeto e reciprocidade", emoji: "❤️", example: "Ex.: demonstra carinho, abraça e retribui o afeto de quem cuida." },
          { text: "Tolera melhor estar em grupo", emoji: "👨‍👩‍👧", example: "Ex.: consegue ficar em grupo, como na festa ou na sala, com mais calma." },
        ],
      },
      {
        name: "Comportamento",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          { text: "Tem menos crises de comportamento", emoji: "😌", example: "Ex.: tem menos crises de birra ou descontrole ao longo do dia." },
          { text: "Lida melhor com mudanças e frustrações", emoji: "🌊", example: "Ex.: lida melhor com imprevistos e frustrações sem grandes crises." },
          { text: "Reduziu comportamentos repetitivos prejudiciais", emoji: "🔽", example: "Ex.: diminuíram comportamentos repetitivos que atrapalhavam, como bater a cabeça." },
          { text: "Regula melhor as emoções", emoji: "🧘", example: "Ex.: consegue se acalmar melhor quando fica brava ou triste." },
          { text: "Dorme e se alimenta melhor", emoji: "😴", example: "Ex.: passou a dormir melhor e a se alimentar com mais tranquilidade." },
        ],
      },
      {
        name: "Autonomia",
        color: "text-emerald-600 dark:text-emerald-400",
        items: [
          { text: "Faz mais tarefas de autocuidado sozinha", emoji: "🧼", example: "Ex.: faz mais coisas sozinha, como se vestir e escovar os dentes." },
          { text: "Participa melhor da rotina da casa", emoji: "🏠", example: "Ex.: participa mais da rotina da casa, ajudando em pequenas tarefas." },
          { text: "Acompanha melhor a rotina escolar", emoji: "🏫", example: "Ex.: acompanha melhor as atividades e a rotina da escola." },
          { text: "Generaliza para casa/escola o que aprende nas terapias", emoji: "🔁", example: "Ex.: usa em casa e na escola o que aprendeu nas terapias." },
          { text: "Ganhou mais independência desde a última avaliação", emoji: "🦋", example: "Ex.: está mais independente do que na última avaliação." },
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
          { text: "Aceita mudanças de rotina sem grande sofrimento", emoji: "🔀", example: "Ex.: aceita mudanças na rotina, como outro caminho, sem ficar muito abalada." },
          { text: "Muda de plano quando é necessário", emoji: "🗺️", example: "Ex.: se o passeio é cancelado, aceita trocar por outro plano." },
          { text: "Aceita quando as regras mudam", emoji: "📋", example: "Ex.: aceita quando as regras da brincadeira mudam no meio." },
          { text: "Lida bem quando o resultado não é o esperado", emoji: "🎲", example: "Ex.: lida bem quando perde o jogo ou o resultado não sai como esperava." },
          { text: "Aceita ajuda ou sugestões para fazer diferente", emoji: "💡", example: "Ex.: aceita ajuda ou uma sugestão para tentar fazer de outro jeito." },
          { text: "Transita entre atividades sem travar", emoji: "🔄", example: "Ex.: guarda os brinquedos e vai jantar sem chorar ou fazer birra." },
          { text: "Tolera os imprevistos do dia a dia", emoji: "🌦️", example: "Ex.: fica calma quando o passeio é cancelado por causa da chuva." },
          { text: "Aceita perder ou empatar em jogos", emoji: "🎲", example: "Ex.: perde no jogo de tabuleiro e continua brincando sem se irritar." },
          { text: "Considera mais de uma forma de resolver um problema", emoji: "💡", example: "Ex.: se não achou a peça, tenta montar de outro jeito antes de desistir." },
          { text: "Aceita um “agora não” e tenta de novo depois", emoji: "⏳", example: "Ex.: ouve 'agora não posso' e volta a pedir mais tarde com calma." },
          { text: "Adapta-se a ambientes e pessoas novas", emoji: "🏫", example: "Ex.: entra numa escola nova e se acostuma com colegas e professora." },
          { text: "Recupera-se rápido quando algo dá errado", emoji: "🌈", example: "Ex.: erra no dever, respira e tenta de novo em poucos minutos." },
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
      { text: "Pede ajuda ao professor quando precisa", emoji: "🙋", example: "Ex.: levanta a mão e diz 'não entendi' quando fica com dúvida." },
      { text: "Faz e responde perguntas de forma pertinente", emoji: "❓", example: "Ex.: pergunta 'para onde vamos?' e responde 'ao parque' na hora certa." },
      { text: "Mantém o tema numa conversa", emoji: "💬", example: "Ex.: conversa sobre o passeio sem mudar de repente para outro assunto." },
      { text: "Espera a vez de falar e não interrompe sempre", emoji: "✋", example: "Ex.: aguarda o amigo terminar a frase antes de começar a falar." },
      { text: "Entende piadas e brincadeiras dos colegas", emoji: "😄", example: "Ex.: ri junto quando um colega faz uma brincadeira engraçada." },
      { text: "Interpreta expressões e sentido figurado simples", emoji: "🗣️", example: "Ex.: entende que 'está chovendo canivetes' quer dizer chuva forte." },
      { text: "Ajusta a fala ao contexto (professor × colega)", emoji: "🎭", example: "Ex.: fala mais formal com a professora e brinca à vontade com os amigos." },
      { text: "Usa cumprimentos e fórmulas sociais adequadas", emoji: "👋", example: "Ex.: diz 'bom dia', 'com licença' e 'obrigado' nas horas certas." },
      { text: "Repara a comunicação quando não é entendido", emoji: "🔁", example: "Ex.: repete de outro jeito quando o colega não entendeu o que disse." },
      { text: "Entende instruções dadas ao grupo", emoji: "📢", example: "Ex.: quando a professora manda 'peguem o caderno', ela também obedece." },
      { text: "Participa de trocas conversacionais com os colegas", emoji: "🤝", example: "Ex.: conversa indo e voltando com os amigos, ouvindo e respondendo." },
      { text: "Percebe as pistas sociais do interlocutor (interesse, tédio)", emoji: "👀", example: "Ex.: percebe pela cara do colega que ele está entediado e muda de assunto." },
    ]}],
  },

  // ---- J26-083 — Narrativa Oral (habilidade) ----
  "j26-083": {
    icon: MessageCircle, gradient: "from-blue-500 to-indigo-600",
    instruction: DEV_INSTRUCTION,
    infoBox: "Avalia as habilidades narrativas orais (maior escore = narrativa mais elaborada). Sensível para linguagem e cognição. Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Narrativa oral (maior = mais elaborada)", bands: DEV_BANDS,
    domains: [{ name: "Habilidades narrativas", color: "text-blue-600 dark:text-blue-400", items: [
      { text: "Conta um acontecimento com início, meio e fim", emoji: "📖", example: "Ex.: conta o passeio dizendo como começou, o que fez e como terminou." },
      { text: "Inclui personagens na história", emoji: "🧑‍🤝‍🧑", example: "Ex.: na história diz quem estava lá: a vovó, o cachorro e ela." },
      { text: "Mantém a sequência temporal (o que veio antes e depois)", emoji: "🕰️", example: "Ex.: conta os fatos na ordem: primeiro acordou, depois tomou café." },
      { text: "Estabelece relações de causa e efeito", emoji: "➡️", example: "Ex.: explica 'chorei porque caí' ligando o motivo ao que aconteceu." },
      { text: "Usa conectivos (aí, então, porque, mas)", emoji: "🔗", example: "Ex.: usa 'aí', 'então', 'porque' e 'mas' para emendar as frases." },
      { text: "Mantém o tema sem se perder", emoji: "🎯", example: "Ex.: conta sobre o aniversário sem começar a falar de outra coisa." },
      { text: "Dá detalhes suficientes para o ouvinte entender", emoji: "🔍", example: "Ex.: diz onde, com quem e o que aconteceu, sem deixar buracos na história." },
      { text: "Usa vocabulário adequado para narrar", emoji: "📚", example: "Ex.: escolhe palavras certas para contar, como 'escorregou' em vez de 'fez'." },
      { text: "Marca quem fala (discurso direto ou indireto)", emoji: "💭", example: "Ex.: diz 'aí a mãe falou: vem cá', mostrando quem estava falando." },
      { text: "Conclui a história de forma coerente", emoji: "🏁", example: "Ex.: termina a história com um fecho, como 'e aí fomos pra casa dormir'." },
      { text: "Reconta uma história ouvida mantendo o sentido", emoji: "🔁", example: "Ex.: depois de ouvir um conto, reconta mantendo o que era importante." },
      { text: "A narrativa é compreensível para quem ouve", emoji: "👂", example: "Ex.: quem escuta consegue entender a história sem precisar perguntar tudo." },
    ]}],
  },

  // ---- J26-084 — Consciência Fonológica (habilidade) ----
  "j26-084": {
    icon: Ear, gradient: "from-violet-500 to-purple-600",
    instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a consciência fonológica em níveis progressivos (maior escore = mais habilidade). Base para o risco de dislexia. Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Consciência fonológica (maior = mais habilidade)", bands: DEV_BANDS,
    domains: [{ name: "Habilidades fonológicas", color: "text-violet-600 dark:text-violet-400", items: [
      { text: "Reconhece e produz rimas", emoji: "🎵", example: "Ex.: percebe que 'pato' rima com 'gato' e cria rimas próprias." },
      { text: "Identifica palavras que começam com o mesmo som (aliteração)", emoji: "🔤", example: "Ex.: nota que 'bola', 'bota' e 'boca' começam com o mesmo som." },
      { text: "Separa a palavra em sílabas (batendo palmas)", emoji: "👏", example: "Ex.: bate palmas dividindo 'ca-cho-rro' em três partes." },
      { text: "Conta o número de sílabas de uma palavra", emoji: "🔢", example: "Ex.: diz que 'banana' tem três pedacinhos (sílabas)." },
      { text: "Junta sílabas para formar a palavra (síntese silábica)", emoji: "🧩", example: "Ex.: ouve 'sa... pa...' e responde 'sapo'." },
      { text: "Identifica o primeiro som (fonema) da palavra", emoji: "1️⃣", example: "Ex.: diz que 'gato' começa com o som /g/." },
      { text: "Identifica o último som da palavra", emoji: "🔚", example: "Ex.: diz que 'bola' termina com o som /a/." },
      { text: "Separa a palavra em sons (segmentação fonêmica)", emoji: "✂️", example: "Ex.: separa 'sol' nos sons /s/ /o/ /l/." },
      { text: "Junta sons para formar a palavra (síntese fonêmica)", emoji: "🧷", example: "Ex.: ouve /m/ /a/ /r/ e junta na palavra 'mar'." },
      { text: "Tira um som e diz o que sobra (manipulação)", emoji: "➖", example: "Ex.: tira o /s/ de 'sino' e diz que sobra 'ino'." },
      { text: "Troca um som por outro", emoji: "🔀", example: "Ex.: troca o /m/ de 'mala' por /b/ e diz 'bala'." },
      { text: "Identifica sons iguais ou diferentes entre palavras", emoji: "⚖️", example: "Ex.: diz se 'faca' e 'vaca' começam com sons iguais ou diferentes." },
    ]}],
  },

  // ---- J26-085 — Vocabulário em Profundidade (habilidade) ----
  "j26-085": {
    icon: MessageCircle, gradient: "from-teal-500 to-cyan-600",
    instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a profundidade do vocabulário, além do nomear (maior escore = mais rico). Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Vocabulário em profundidade (maior = mais rico)", bands: DEV_BANDS,
    domains: [{ name: "Profundidade lexical", color: "text-teal-600 dark:text-teal-400", items: [
      { text: "Explica o significado de palavras comuns", emoji: "💬", example: "Ex.: explica que 'cadeira' é onde a gente senta." },
      { text: "Dá sinônimos de palavras", emoji: "🟰", example: "Ex.: diz que 'bonito' é o mesmo que 'lindo'." },
      { text: "Dá antônimos de palavras", emoji: "↔️", example: "Ex.: diz que o contrário de 'alto' é 'baixo'." },
      { text: "Agrupa palavras por categoria (frutas, animais)", emoji: "🍎", example: "Ex.: agrupa maçã, banana e uva como frutas." },
      { text: "Entende que uma palavra pode ter vários sentidos", emoji: "🔀", example: "Ex.: entende que 'manga' pode ser a fruta ou a parte da camisa." },
      { text: "Usa as palavras de forma precisa ao se expressar", emoji: "🎯", example: "Ex.: escolhe a palavra exata, dizendo 'gigante' em vez de 'muito grande'." },
      { text: "Entende palavras menos frequentes para a idade", emoji: "🧠", example: "Ex.: entende palavras menos comuns como 'transparente' ou 'fragil'." },
      { text: "Relaciona palavras de um mesmo campo semântico", emoji: "🕸️", example: "Ex.: liga 'médico', 'hospital' e 'remédio' ao mesmo tema." },
      { text: "Usa palavras novas que aprende", emoji: "✨", example: "Ex.: aprende 'enorme' na escola e passa a usar em casa." },
      { text: "Entende definições e adivinhas", emoji: "🧩", example: "Ex.: adivinha 'o que voa e faz mel?' e responde 'abelha'." },
      { text: "Percebe diferenças sutis entre palavras parecidas", emoji: "🔎", example: "Ex.: percebe a diferença entre 'apertar' e 'segurar'." },
      { text: "Tem vocabulário compatível com a idade", emoji: "📏", example: "Ex.: conhece a quantidade de palavras esperada para a idade dela." },
    ]}],
  },

  // ---- J26-086 — Fluência Verbal (habilidade) ----
  "j26-086": {
    icon: Sparkles, gradient: "from-amber-500 to-orange-600",
    instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a fluência verbal semântica e fonológica (maior escore = mais fluente). Sensível para acesso lexical e funções executivas. Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Fluência verbal (maior = mais fluente)", bands: DEV_BANDS,
    domains: [{ name: "Acesso lexical e fluência", color: "text-amber-600 dark:text-amber-400", items: [
      { text: "Diz muitos animais em pouco tempo (fluência semântica)", emoji: "🐾", example: "Ex.: em um minuto fala cão, gato, vaca, leão, macaco, sem parar." },
      { text: "Diz muitas palavras de uma categoria sem repetir", emoji: "📋", example: "Ex.: cita muitas frutas seguidas sem repetir nenhuma." },
      { text: "Diz palavras que começam com um som dado (fluência fonológica)", emoji: "🔡", example: "Ex.: pedindo palavras com /f/, diz faca, foca, fada, festa." },
      { text: "Acessa as palavras com rapidez (sem ficar “travando”)", emoji: "⚡", example: "Ex.: lembra as palavras rápido, sem ficar 'é... hum...' o tempo todo." },
      { text: "Organiza a busca por subgrupos (animais da fazenda, do mar)", emoji: "🗂️", example: "Ex.: agrupa animais por tipo: primeiro os da fazenda, depois os do mar." },
      { text: "Evita repetir palavras já ditas", emoji: "🚫", example: "Ex.: na lista de animais evita dizer 'cachorro' duas vezes." },
      { text: "Mantém o critério pedido (categoria ou letra)", emoji: "📌", example: "Ex.: quando pedem frutas, continua só em frutas e não fala em animais." },
      { text: "Não foge da tarefa proposta", emoji: "🎯", example: "Ex.: mantém-se na tarefa de listar sem começar a brincar ou conversar." },
      { text: "Recupera palavras menos comuns", emoji: "💎", example: "Ex.: além de cão e gato, lembra de 'tatu' ou 'lontra'." },
      { text: "Tem ritmo de produção compatível com a idade", emoji: "⏱️", example: "Ex.: produz palavras num ritmo esperado para a idade dela." },
      { text: "Corrige-se quando foge do critério", emoji: "✏️", example: "Ex.: percebe que disse algo fora da categoria e corrige sozinha." },
      { text: "A quantidade de palavras é adequada para a idade", emoji: "📊", example: "Ex.: o total de palavras ditas fica dentro do esperado para a idade." },
    ]}],
  },

  // ---- J26-089 — Necessidades de CAA (habilidade comunicativa) ----
  "j26-089": {
    icon: MessageCircle, gradient: "from-teal-500 to-emerald-600",
    instruction: DEV_INSTRUCTION,
    infoBox: "Avalia as habilidades para uso de CAA (maior escore = mais recursos próprios; MENOR escore = maior necessidade e benefício de prancha/PECS/tablet). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Recursos para CAA (menor = mais necessidade)", bands: DEV_BANDS,
    domains: [{ name: "Comunicação e pré-requisitos para CAA", color: "text-teal-600 dark:text-teal-400", items: [
      { text: "Demonstra intenção de se comunicar", emoji: "💗", example: "Ex.: puxa a mão do adulto ou faz sons mostrando que quer algo." },
      { text: "Usa o olhar dirigido para se comunicar", emoji: "👁️", example: "Ex.: olha para o adulto e depois para o objeto que deseja." },
      { text: "Usa gestos para pedir ou recusar", emoji: "🙌", example: "Ex.: estende os braços para pedir colo ou balança a cabeça para recusar." },
      { text: "Aponta para pedir ou mostrar", emoji: "👉", example: "Ex.: aponta para o biscoito para pedir ou para o avião para mostrar." },
      { text: "Entende ordens simples faladas", emoji: "👂", example: "Ex.: quando ouve 'me dá a bola', entrega sem precisar de gesto." },
      { text: "Entende figuras ou fotos", emoji: "🖼️", example: "Ex.: aponta a foto do copo quando quer água." },
      { text: "Faz escolhas entre opções apresentadas", emoji: "🔀", example: "Ex.: mostradas duas frutas, ela escolhe qual quer comer." },
      { text: "Usa sons, palavras ou aproximações", emoji: "🔊", example: "Ex.: fala 'papá' ou 'áua' para pedir comida ou água." },
      { text: "Tem controle motor para apontar ou tocar (prancha/tablet)", emoji: "👆", example: "Ex.: consegue tocar com o dedo a figura certa na prancha ou tablet." },
      { text: "Responde quando alguém se comunica com ela", emoji: "💬", example: "Ex.: quando alguém fala com ela, olha, sorri ou responde de algum jeito." },
      { text: "Comunica diferentes funções (pedir, recusar, comentar)", emoji: "🎯", example: "Ex.: usa comunicação para pedir, recusar e também comentar o que vê." },
      { text: "Aceita e se interessa por recursos visuais de comunicação", emoji: "📲", example: "Ex.: gosta de usar figuras ou o tablet para se comunicar." },
    ]}],
  },

  // ---- J26-090 — Compreensão Oral Complexa (habilidade) ----
  "j26-090": {
    icon: Ear, gradient: "from-blue-500 to-indigo-600",
    instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a compreensão de linguagem oral complexa (maior escore = mais habilidade). Essencial antes de concluir sobre dificuldade de leitura. Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Compreensão oral complexa (maior = mais habilidade)", bands: DEV_BANDS,
    domains: [{ name: "Compreensão oral", color: "text-blue-600 dark:text-blue-400", items: [
      { text: "Entende frases longas e compostas", emoji: "🧵", example: "Ex.: entende 'pega o casaco que está na cadeira e traz aqui'." },
      { text: "Segue instruções com 2-3 passos", emoji: "1️⃣", example: "Ex.: cumpre 'pega o sapato, guarda e volta' na ordem pedida." },
      { text: "Entende instruções com conceitos (antes/depois, se/então)", emoji: "🔀", example: "Ex.: entende 'escova os dentes antes de dormir' ou 'se chover, leva guarda-chuva'." },
      { text: "Faz inferências (deduz o que não foi dito)", emoji: "🕵️", example: "Ex.: vê alguém de guarda-chuva molhado e deduz que está chovendo." },
      { text: "Entende perguntas de “por que” e “como”", emoji: "❓", example: "Ex.: responde 'por que você chorou?' e 'como foi na escola?'." },
      { text: "Entende metáforas e sentido figurado simples", emoji: "🗣️", example: "Ex.: entende que 'está com a pulga atrás da orelha' é estar desconfiado." },
      { text: "Entende ironia e duplo sentido (conforme a idade)", emoji: "😏", example: "Ex.: percebe quando alguém diz 'que dia lindo' de brincadeira na chuva." },
      { text: "Acompanha uma história ouvida e responde sobre ela", emoji: "📖", example: "Ex.: depois de ouvir a história, responde perguntas sobre ela." },
      { text: "Entende relações de causa e efeito no que ouve", emoji: "➡️", example: "Ex.: entende na história por que o personagem ficou triste." },
      { text: "Reconta o que entendeu mantendo o sentido", emoji: "🔁", example: "Ex.: reconta com as próprias palavras o que entendeu do que ouviu." },
      { text: "Identifica a ideia principal de um texto ouvido", emoji: "⭐", example: "Ex.: diz do que a história falava, resumindo a ideia principal." },
      { text: "Compreende vocabulário compatível com a idade", emoji: "🧠", example: "Ex.: entende palavras faladas esperadas para a idade dela." },
    ]}],
  },

  // ---- J26-091 — Triagem de Linguagem 18-36 meses (marcos) ----
  "j26-091": {
    icon: Baby, gradient: "from-blue-500 to-indigo-600",
    instruction: DEV_INSTRUCTION,
    infoBox: "Triagem rápida de atraso de linguagem entre 18 e 36 meses (maior escore = mais marcos). Escore baixo indica encaminhamento à fonoaudiologia. Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Marcos de linguagem 18–36 meses", bands: DEV_BANDS,
    domains: [{ name: "Linguagem 18–36 meses", color: "text-blue-600 dark:text-blue-400", items: [
      { text: "Fala pelo menos 10 a 20 palavras com sentido", emoji: "🗣️", example: "Ex.: fala com sentido palavras como mamãe, água, bola, papá, au-au." },
      { text: "Aponta para pedir ou mostrar", emoji: "👉", example: "Ex.: aponta para o brinquedo alto na prateleira para pedir." },
      { text: "Entende ordens simples sem gesto", emoji: "👂", example: "Ex.: obedece a 'senta' mesmo sem o adulto fazer nenhum gesto." },
      { text: "Aponta partes do corpo ou figuras quando são nomeadas", emoji: "👃", example: "Ex.: quando pedem, aponta o nariz ou a figura do cachorro." },
      { text: "Junta duas palavras (“quer água”)", emoji: "➕", example: "Ex.: junta duas palavras como 'quer água' ou 'cadê mamãe'." },
      { text: "Responde ao nome", emoji: "📛", example: "Ex.: vira o rosto e olha quando chamam o nome dela." },
      { text: "Imita palavras que ouve", emoji: "🦜", example: "Ex.: repete 'bola' logo depois de ouvir o adulto falar." },
      { text: "Nomeia objetos e pessoas familiares", emoji: "🏷️", example: "Ex.: aponta e diz 'papai', 'gato', 'copo'." },
      { text: "Usa palavras para pedir o que quer", emoji: "🗣️", example: "Ex.: fala 'água' ou 'quer' para pedir o que deseja." },
      { text: "Entende perguntas simples (“cadê?”)", emoji: "🔍", example: "Ex.: quando perguntam 'cadê o papai?', procura ou aponta." },
    ]}],
  },

  // ---- J26-092 — Discurso e Linguagem Acadêmica (habilidade) ----
  "j26-092": {
    icon: MessageCircle, gradient: "from-emerald-500 to-teal-600",
    instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a linguagem acadêmica em sala (maior escore = mais habilidade). Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Linguagem acadêmica (maior = mais habilidade)", bands: DEV_BANDS,
    domains: [{ name: "Discurso e linguagem escolar", color: "text-emerald-600 dark:text-emerald-400", items: [
      { text: "Explica um procedimento ou como algo funciona", emoji: "⚙️", example: "Ex.: explica como se faz um sanduíche, passo a passo." },
      { text: "Argumenta e defende uma opinião", emoji: "⚖️", example: "Ex.: defende por que acha melhor brincar lá fora, dando motivos." },
      { text: "Descreve objetos, lugares ou pessoas com detalhes", emoji: "🔍", example: "Ex.: descreve o cachorro dizendo que é grande, marrom e peludo." },
      { text: "Relata acontecimentos de forma organizada", emoji: "🗂️", example: "Ex.: relata o passeio em ordem, sem embaralhar os fatos." },
      { text: "Usa vocabulário acadêmico adequado", emoji: "🎓", example: "Ex.: usa termos como 'soma', 'personagem' ou 'experimento' na fala." },
      { text: "Responde a perguntas abertas com elaboração", emoji: "💬", example: "Ex.: à pergunta 'o que você achou?', responde com uma explicação, não só 'sim'." },
      { text: "Organiza as ideias de forma lógica", emoji: "🧩", example: "Ex.: conta as ideias numa ordem que faz sentido, uma puxando a outra." },
      { text: "Usa conectivos para ligar as ideias", emoji: "🔗", example: "Ex.: usa 'porque', 'então', 'além disso' para ligar as ideias." },
      { text: "Adapta a linguagem à tarefa escolar", emoji: "📝", example: "Ex.: fala de um jeito mais formal ao apresentar um trabalho na sala." },
      { text: "Compreende e usa os termos de cada matéria", emoji: "📚", example: "Ex.: usa e entende palavras próprias de matemática ou ciências." },
      { text: "Participa de discussões em sala", emoji: "🙋", example: "Ex.: dá opinião e responde durante um debate em sala." },
      { text: "Comunica o que aprendeu de forma clara", emoji: "💡", example: "Ex.: explica de forma clara o que aprendeu na aula." },
    ]}],
  },

  // ---- J26-093 — Prosódia e Entonação (habilidade) ----
  "j26-093": {
    icon: MessageCircle, gradient: "from-pink-500 to-rose-600",
    instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a prosódia funcional (maior escore = mais típica/funcional). Alterações de prosódia são comuns no TEA. Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Prosódia funcional (maior = mais típica)", bands: DEV_BANDS,
    domains: [{ name: "Prosódia, entonação e ritmo", color: "text-pink-600 dark:text-pink-400", items: [
      { text: "A fala tem entonação natural (sobe e desce)", emoji: "🎶", example: "Ex.: a voz sobe e desce naturalmente, não fica sempre no mesmo tom." },
      { text: "Demonstra emoção pela voz (alegria, dúvida, surpresa)", emoji: "😊", example: "Ex.: dá para perceber pela voz quando está feliz, em dúvida ou surpresa." },
      { text: "Não soa monótona ou robótica", emoji: "🤖", example: "Ex.: observe se a fala não soa monótona, sempre no mesmo tom." },
      { text: "Não soa “cantada” ou artificial demais", emoji: "🎤", example: "Ex.: observe se a fala não soa 'cantada' ou artificial demais." },
      { text: "Usa um ritmo de fala adequado (nem rápido, nem lento demais)", emoji: "⏱️", example: "Ex.: fala num ritmo bom, sem atropelar nem arrastar as palavras." },
      { text: "Faz as pausas certas entre as ideias", emoji: "⏸️", example: "Ex.: faz pausas nos lugares certos, respirando entre as frases." },
      { text: "Dá ênfase às palavras importantes", emoji: "❗", example: "Ex.: reforça a palavra importante, como 'foi ENORME o susto'." },
      { text: "Ajusta o volume ao contexto", emoji: "🔉", example: "Ex.: fala baixinho na biblioteca e mais alto no parque." },
      { text: "A entonação combina com a intenção (pergunta, afirmação)", emoji: "❓", example: "Ex.: a voz sobe no fim de uma pergunta e desce numa afirmação." },
      { text: "Entende a emoção do outro pelo tom de voz", emoji: "💗", example: "Ex.: percebe pelo tom de voz que alguém está bravo ou triste." },
      { text: "Diferência pergunta de afirmação pela entonação", emoji: "↕️", example: "Ex.: distingue 'você foi?' de 'você foi.' só pela entonação." },
      { text: "A prosódia ajuda (e não atrapalha) a comunicação", emoji: "✅", example: "Ex.: observe se o jeito de falar ajuda o ouvinte a entender a mensagem." },
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
      { text: "Lê palavras conhecidas com rapidez (sem soletrar)", emoji: "⚡", example: "Ex.: lê 'casa' e 'menino' na hora, sem soletrar letra por letra." },
      { text: "Lê com precisão (poucos erros)", emoji: "🎯", example: "Ex.: lê o texto trocando pouquíssimas palavras." },
      { text: "Lê palavras novas decodificando os sons", emoji: "🔤", example: "Ex.: diante de uma palavra nova, junta os sons para lê-la." },
      { text: "Lê com ritmo e fluidez (não silabado)", emoji: "🌊", example: "Ex.: lê de forma corrida, não soletrando 'ca-sa-co'." },
      { text: "Respeita a pontuação ao ler", emoji: "⏸️", example: "Ex.: para nas vírgulas e nos pontos ao ler em voz alta." },
      { text: "Lê com entonação adequada", emoji: "🎵", example: "Ex.: lê com entonação, fazendo pergunta soar como pergunta." },
      { text: "Tem velocidade de leitura compatível com a série", emoji: "⏱️", example: "Ex.: lê na velocidade esperada para o ano escolar dela." },
      { text: "Não troca, omite ou inverte letras ao ler", emoji: "🔡", example: "Ex.: observe se lê 'dado' sem trocar por 'bado' ou inverter letras." },
      { text: "Reconhece palavras frequentes de imediato", emoji: "👁️", example: "Ex.: reconhece de imediato palavras comuns como 'que', 'para', 'com'." },
      { text: "Entende o que leu (compreensão)", emoji: "🧠", example: "Ex.: depois de ler, sabe contar do que o texto falava." },
      { text: "Mantém o lugar na linha sem se perder", emoji: "📍", example: "Ex.: segue a linha sem pular ou repetir trechos ao ler." },
      { text: "Lê textos da série sem grande esforço", emoji: "📖", example: "Ex.: lê os textos do livro do ano dela sem grande dificuldade." },
    ]}],
  },

  "j26-097": {
    icon: Hand, gradient: "from-teal-500 to-cyan-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a expressão escrita e a caligrafia (maior = mais competente). Escore baixo sugere disgrafia — diferenciar de falta de prática. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Expressão escrita (maior = mais competente)", bands: DEV_BANDS,
    domains: [{ name: "Escrita e caligrafia", color: "text-teal-600 dark:text-teal-400", items: [
      { text: "Tem letra legível", emoji: "✍️", example: "Ex.: escreve de um jeito que os outros conseguem ler." },
      { text: "Mantém o tamanho das letras uniforme", emoji: "📐", example: "Ex.: as letras têm mais ou menos o mesmo tamanho na frase." },
      { text: "Respeita a linha e as margens", emoji: "📏", example: "Ex.: escreve em cima da linha, sem passar das margens." },
      { text: "Tem espaçamento adequado entre as palavras", emoji: "↔️", example: "Ex.: deixa um espacinho entre uma palavra e outra." },
      { text: "Escreve com velocidade compatível com a série", emoji: "⏱️", example: "Ex.: escreve na velocidade esperada para o ano escolar." },
      { text: "Forma as letras corretamente (traçado)", emoji: "🔡", example: "Ex.: faz o traçado certo das letras, começando do ponto certo." },
      { text: "Organiza o texto no espaço da folha", emoji: "📄", example: "Ex.: distribui bem o texto na folha, sem amontoar num canto." },
      { text: "Compõe frases completas e organizadas", emoji: "📝", example: "Ex.: escreve frases completas, com começo e fim, que fazem sentido." },
      { text: "Organiza as ideias em parágrafos", emoji: "📑", example: "Ex.: separa o texto em parágrafos por assunto." },
      { text: "Usa pontuação ao escrever", emoji: "❕", example: "Ex.: usa ponto final, vírgula e ponto de interrogação ao escrever." },
      { text: "Escreve sem dor ou cansaço excessivo na mão", emoji: "✋", example: "Ex.: escreve um texto sem reclamar de dor ou cansaço na mão." },
      { text: "Copia e produz texto sem esforço excessivo", emoji: "🖊️", example: "Ex.: copia do quadro e escreve sem se esgotar rapidamente." },
    ]}],
  },

  "j26-098": {
    icon: ClipboardList, gradient: "from-blue-500 to-indigo-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia as habilidades de estudo e organização (maior = melhor). Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Habilidades de estudo (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Estudo e organização", color: "text-blue-600 dark:text-blue-400", items: [
      { text: "Organiza o material de estudo", emoji: "🎒", example: "Ex.: mantém cadernos e materiais organizados por matéria." },
      { text: "Tem um lugar e um horário para estudar", emoji: "🕐", example: "Ex.: tem um cantinho e um horário fixo para fazer a lição." },
      { text: "Anota as tarefas e os prazos", emoji: "🗓️", example: "Ex.: anota na agenda as tarefas e quando é a entrega." },
      { text: "Faz resumos ou esquemas do conteúdo", emoji: "🗒️", example: "Ex.: faz resumos ou mapinhas para estudar o conteúdo." },
      { text: "Revisa o que aprendeu", emoji: "📖", example: "Ex.: depois da aula, relê o caderno para relembrar o que foi ensinado." },
      { text: "Planeja a semana de provas", emoji: "🗓️", example: "Ex.: monta um cronograma dizendo o que vai estudar em cada dia antes das provas." },
      { text: "Divide tarefas grandes em partes", emoji: "🧩", example: "Ex.: para um trabalho longo, separa em etapas: pesquisar, escrever e revisar." },
      { text: "Estuda sem precisar de lembrete constante", emoji: "📚", example: "Ex.: senta para estudar por conta própria, sem os pais lembrarem toda hora." },
      { text: "Identifica o que não entendeu e busca ajuda", emoji: "🙋", example: "Ex.: percebe que não entendeu a conta e pergunta ao professor ou colega." },
      { text: "Administra o tempo durante as tarefas", emoji: "⏱️", example: "Ex.: distribui o tempo na prova para não deixar questões sem responder." },
      { text: "Mantém o foco enquanto estuda", emoji: "🎯", example: "Ex.: continua na tarefa sem se distrair com o celular ou barulhos ao redor." },
      { text: "Usa estratégias para memorizar (associação, repetição)", emoji: "🧠", example: "Ex.: repete a lista em voz alta ou cria uma rima para lembrar o conteúdo." },
    ]}],
  },

  "j26-101": {
    icon: Sparkles, gradient: "from-cyan-500 to-blue-600", instruction: DEV_INSTRUCTION,
    infoBox: "Triagem dos componentes do raciocínio numérico (maior = mais habilidade; escore baixo sugere risco de discalculia). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Habilidades numéricas (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Raciocínio numérico", color: "text-cyan-600 dark:text-cyan-400", items: [
      { text: "Conta objetos corretamente (contagem)", emoji: "🔢", example: "Ex.: conta 8 lápis um a um sem pular ou repetir números." },
      { text: "Reconhece os números (símbolos)", emoji: "🔟", example: "Ex.: ao ver o número 7 escrito, sabe dizer que é 'sete'." },
      { text: "Compara quantidades (qual é maior ou menor)", emoji: "⚖️", example: "Ex.: sabe dizer que 9 balas é mais que 5 balas." },
      { text: "Entende o valor posicional (unidade, dezena)", emoji: "🏷️", example: "Ex.: entende que no número 34 o 3 vale 30 e o 4 vale 4 unidades." },
      { text: "Faz somas simples", emoji: "➕", example: "Ex.: resolve 3 + 4 juntando os dedos ou de cabeça." },
      { text: "Faz subtrações simples", emoji: "➖", example: "Ex.: calcula quantas figurinhas sobram ao tirar 2 de 7." },
      { text: "Sabe as operações básicas para a série", emoji: "🧮", example: "Ex.: já domina somar e subtrair como esperado para o ano escolar." },
      { text: "Resolve problemas matemáticos simples", emoji: "💡", example: "Ex.: resolve 'tinha 5 doces, ganhou 2, com quantos ficou?'." },
      { text: "Estima quantidades de forma razoável", emoji: "👀", example: "Ex.: olha um pote e chuta 'tem uns 20 feijões', com valor próximo do real." },
      { text: "Memoriza fatos numéricos (tabuada básica)", emoji: "✖️", example: "Ex.: responde rápido quanto é 3 x 4 sem contar tudo de novo." },
      { text: "Entende conceitos de tempo, dinheiro e medida", emoji: "🕐", example: "Ex.: entende quanto vale R$1 em moedas, que horas são e o que é um metro." },
      { text: "Acompanha a matemática da série sem grande dificuldade", emoji: "📐", example: "Ex.: acompanha as contas da turma sem ficar muito para trás." },
    ]}],
  },

  "j26-102": {
    icon: Hand, gradient: "from-indigo-500 to-blue-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a cópia e o ditado, mapeando onde a criança trava — motor, fonológico ou ortográfico (maior = melhor). Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Cópia e ditado (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Cópia e ditado", color: "text-indigo-600 dark:text-indigo-400", items: [
      { text: "Copia do quadro sem omitir partes", emoji: "📋", example: "Ex.: copia toda a lição do quadro sem esquecer linhas ou palavras." },
      { text: "Copia com velocidade compatível com a turma", emoji: "⚡", example: "Ex.: termina de copiar o quadro mais ou menos junto com os colegas." },
      { text: "Copia sem trocar ou inverter letras", emoji: "🔤", example: "Ex.: ao copiar, não escreve 'b' no lugar de 'd' nem inverte letras." },
      { text: "Mantém a organização ao copiar (alinhamento)", emoji: "📏", example: "Ex.: copia mantendo as palavras alinhadas e o caderno organizado." },
      { text: "Escreve corretamente palavras ditadas", emoji: "✍️", example: "Ex.: no ditado, escreve 'casa' e 'bola' sem trocar letras." },
      { text: "Escreve frases ditadas mantendo o sentido", emoji: "💬", example: "Ex.: escreve a frase ditada 'o gato subiu no muro' com o sentido certo." },
      { text: "Acompanha o ritmo do ditado da turma", emoji: "🏃", example: "Ex.: consegue escrever no ritmo em que a professora dita para a turma." },
      { text: "Não se perde de onde parou ao copiar", emoji: "🔖", example: "Ex.: ao copiar, sabe voltar exatamente à linha onde havia parado." },
      { text: "Faz a correspondência som-letra ao escrever", emoji: "🔊", example: "Ex.: ouve o som 'fa' e escreve as letras f e a corretamente." },
      { text: "Mantém a legibilidade na cópia e no ditado", emoji: "🖊️", example: "Ex.: a letra continua legível tanto ao copiar quanto no ditado." },
      { text: "Copia textos longos sem grande esforço", emoji: "📜", example: "Ex.: copia um texto de uma página inteira sem cansar demais." },
      { text: "Termina as tarefas de cópia no tempo da aula", emoji: "✅", example: "Ex.: termina a cópia dentro do tempo da aula, sem levar para casa." },
    ]}],
  },

  "j26-104": {
    icon: Sparkles, gradient: "from-emerald-500 to-green-600", instruction: DEV_INSTRUCTION,
    infoBox: "Monitora o sucesso da inclusão escolar (maior = melhor). Útil para o relatório de acompanhamento. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Inclusão escolar (maior = funcionando melhor)", bands: DEV_BANDS,
    domains: [{ name: "Sucesso da inclusão", color: "text-emerald-600 dark:text-emerald-400", items: [
      { text: "A escola fez as adaptações necessárias", emoji: "🏫", example: "Ex.: a escola ampliou provas ou deu mais tempo conforme a necessidade." },
      { text: "O professor compreende as necessidades da criança", emoji: "👩‍🏫", example: "Ex.: o professor sabe do diagnóstico e ajusta cobranças à criança." },
      { text: "A criança participa das atividades da turma", emoji: "🙌", example: "Ex.: participa das rodas, trabalhos em grupo e brincadeiras da turma." },
      { text: "A criança está avançando na aprendizagem", emoji: "📈", example: "Ex.: ao longo do ano mostra progresso na leitura, escrita ou contas." },
      { text: "A criança é aceita e incluída pelos colegas", emoji: "🤗", example: "Ex.: é convidada para brincar e é bem recebida pelos colegas." },
      { text: "Há comunicação entre escola e família", emoji: "🔄", example: "Ex.: escola e família trocam recados e conversam sobre a criança." },
      { text: "A criança tem apoio (mediador/AEE) quando necessário", emoji: "🧑‍🤝‍🧑", example: "Ex.: tem mediador ou atendimento no AEE quando a criança precisa." },
      { text: "As avaliações são adaptadas quando preciso", emoji: "📝", example: "Ex.: as provas são adaptadas (menos questões, mais tempo) quando necessário." },
      { text: "A criança se sente bem em ir à escola", emoji: "😊", example: "Ex.: acorda tranquila e gosta de ir para a escola." },
      { text: "Há um plano educacional individualizado em uso", emoji: "📄", example: "Ex.: existe um PEI escrito com metas e adaptações sendo usado na prática." },
      { text: "Os profissionais externos dialogam com a escola", emoji: "🤝", example: "Ex.: a terapeuta ou psicólogo conversa com a escola sobre estratégias." },
      { text: "A inclusão está, no geral, funcionando bem", emoji: "🌟", example: "Ex.: no conjunto, a inclusão da criança está dando certo." },
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
      { text: "Pega o lápis com preensão adequada", emoji: "✏️", example: "Ex.: segura o lápis com os dedos em pinça, sem apertar como uma faca." },{ text: "Tem força e controle ao escrever ou desenhar", emoji: "💪", example: "Ex.: consegue traçar linhas firmes sem a mão tremer ou ceder." },{ text: "Usa a tesoura para recortar com precisão", emoji: "✂️", example: "Ex.: recorta em cima da linha de uma figura sem sair muito do contorno." },{ text: "Cola e monta com cuidado", emoji: "🖇️", example: "Ex.: passa cola na medida certa e monta uma colagem com capricho." },{ text: "Pinta dentro dos limites", emoji: "🖍️", example: "Ex.: pinta o desenho sem ultrapassar as bordas da figura." },{ text: "Encaixa e manuseia peças pequenas", emoji: "🧱", example: "Ex.: encaixa peças de Lego pequenas ou enfia contas em um barbante." },{ text: "Abotoa, amarra e usa fechos", emoji: "🧥", example: "Ex.: abotoa a camisa, amarra o tênis e fecha o zíper sozinha." },{ text: "Aponta o lápis e usa a borracha bem", emoji: "🖊️", example: "Ex.: apita o lápis no apontador e apaga sem rasgar o papel." },{ text: "Manuseia régua e materiais escolares", emoji: "📐", example: "Ex.: segura a régua firme para traçar uma linha reta." },{ text: "Coordena as duas mãos nas tarefas", emoji: "🙌", example: "Ex.: usa uma mão para segurar o papel enquanto a outra recorta." },{ text: "Tem velocidade adequada nas tarefas manuais", emoji: "⚡", example: "Ex.: faz colagens e recortes num ritmo parecido com o dos colegas." },{ text: "Não se cansa demais ao usar as mãos", emoji: "🔋", example: "Ex.: escreve ou recorta por um tempo sem reclamar de cansaço na mão." },
    ]}],
  },
  "j26-107": {
    icon: Baby, gradient: "from-amber-500 to-orange-600", instruction: DEV_INSTRUCTION,
    infoBox: "Acompanha os marcos de motor grosso de 1 a 5 anos (maior = mais marcos). Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Motor grosso 1–5 anos", bands: DEV_BANDS,
    domains: [{ name: "Marcos motores grossos", color: "text-amber-600 dark:text-amber-400", items: [
      { text: "Anda sozinha com firmeza", emoji: "🚶", example: "Ex.: caminha pela casa com segurança, sem se apoiar nos móveis." },{ text: "Corre sem cair com frequência", emoji: "🏃", example: "Ex.: corre no parque brincando sem tropeçar e cair toda hora." },{ text: "Sobe e desce escada (com apoio conforme a idade)", emoji: "🪜", example: "Ex.: sobe e desce a escada segurando o corrimão conforme a idade." },{ text: "Chuta uma bola", emoji: "⚽", example: "Ex.: dá um chute na bola quando está parada no chão." },{ text: "Pula com os dois pés juntos", emoji: "🦘", example: "Ex.: pula para frente com os dois pés saindo do chão juntos." },{ text: "Pula em um pé só (conforme a idade)", emoji: "🦵", example: "Ex.: fica pulando em um pé só por alguns saltos, conforme a idade." },{ text: "Joga e pega uma bola", emoji: "🤾", example: "Ex.: joga a bola para o adulto e consegue segurá-la de volta." },{ text: "Anda na ponta dos pés quando pede", emoji: "🩰", example: "Ex.: caminha na ponta dos pés quando alguém pede de brincadeira." },{ text: "Pedala um triciclo (conforme a idade)", emoji: "🚲", example: "Ex.: pedala o triciclo empurrando com os pés, conforme a idade." },{ text: "Equilibra-se em um pé por alguns segundos", emoji: "🧍", example: "Ex.: fica equilibrada em um pé só por alguns segundos sem apoio." },{ text: "Agacha e levanta sem apoio", emoji: "🏋️", example: "Ex.: abaixa para pegar um brinquedo no chão e levanta sem se segurar." },{ text: "Tem coordenação corporal compatível com a idade", emoji: "🤸", example: "Ex.: mexe o corpo de forma coordenada, como esperado para a idade." },
    ]}],
  },
  "j26-108": {
    icon: Hand, gradient: "from-blue-500 to-indigo-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a integração visomotora e a coordenação olho-mão (maior = melhor). Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Integração visomotora (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Coordenação olho-mão", color: "text-blue-600 dark:text-blue-400", items: [
      { text: "Copia formas simples (círculo, cruz, quadrado)", emoji: "⭕", example: "Ex.: olha um círculo ou um quadrado desenhado e copia parecido." },{ text: "Copia formas complexas (triângulo, losango)", emoji: "🔷", example: "Ex.: consegue copiar formas mais difíceis como um losango." },{ text: "Liga pontos seguindo um modelo", emoji: "🔗", example: "Ex.: liga os pontinhos seguindo o modelo e forma o desenho." },{ text: "Encaixa peças observando o formato", emoji: "🧩", example: "Ex.: observa o formato de uma peça e a encaixa no lugar certo." },{ text: "Monta quebra-cabeças da idade", emoji: "🧩", example: "Ex.: monta sozinha um quebra-cabeça adequado à sua idade." },{ text: "Desenha figuras reconhecíveis", emoji: "🎨", example: "Ex.: desenha uma pessoa ou uma casa que dá para reconhecer o que é." },{ text: "Coordena olho e mão para alcançar e pegar", emoji: "👁️", example: "Ex.: estica o braço e pega um copo na mesa acertando de primeira." },{ text: "Empilha ou alinha objetos com precisão", emoji: "🗼", example: "Ex.: empilha blocos formando uma torre alta sem derrubar." },{ text: "Traça dentro de um caminho ou labirinto", emoji: "🌀", example: "Ex.: faz o traço dentro de um labirinto sem encostar nas paredes." },{ text: "Reproduz um padrão visual", emoji: "🔺", example: "Ex.: vê uma sequência de formas ou cores e a reproduz igual." },{ text: "Copia letras e números com a forma correta", emoji: "🔠", example: "Ex.: copia as letras e os números com o formato correto." },{ text: "Coordena visão e mão sem grande esforço", emoji: "👀", example: "Ex.: faz tarefas de olhar e desenhar sem se esforçar demais." },
    ]}],
  },
  "j26-109": {
    icon: Hand, gradient: "from-violet-500 to-purple-600", instruction: DEV_INSTRUCTION,
    infoBox: "Triagem de praxia/dispraxia do desenvolvimento (maior = melhor planejamento motor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Praxia (maior = melhor planejamento motor)", bands: DEV_BANDS,
    domains: [{ name: "Planejamento motor (praxia)", color: "text-violet-600 dark:text-violet-400", items: [
      { text: "Imita gestos simples sob modelo", emoji: "🙆", example: "Ex.: quando o adulto levanta o braço, ela imita e levanta também." },{ text: "Imita sequências de gestos", emoji: "🔁", example: "Ex.: imita uma sequência: bater palma, tocar a cabeça e os pés." },{ text: "Faz gestos com significado (tchau, beijo) sob comando", emoji: "👋", example: "Ex.: quando pedem, dá tchau com a mão ou manda um beijo." },{ text: "Usa ferramentas e objetos corretamente (pente, colher)", emoji: "🥄", example: "Ex.: usa a colher para comer e o pente para pentear direitinho." },{ text: "Aprende uma sequência motora nova", emoji: "🆕", example: "Ex.: aprende um novo passo de dança ou movimento após ver alguém fazer." },{ text: "Planeja os movimentos de uma tarefa nova", emoji: "🧭", example: "Ex.: antes de montar algo novo, pensa em como vai mexer as mãos." },{ text: "Executa os movimentos na ordem certa", emoji: "🔢", example: "Ex.: faz os passos de uma receita ou tarefa na ordem correta." },{ text: "Coordena os movimentos da boca para a fala (praxia oral)", emoji: "👄", example: "Ex.: observar se mexe lábios e língua para estalar, soprar ou fazer sons." },{ text: "Realiza tarefas motoras de várias etapas", emoji: "🪜", example: "Ex.: cumpre uma tarefa de várias etapas, como se vestir do início ao fim." },{ text: "Adapta o movimento a um novo objeto ou situação", emoji: "🔄", example: "Ex.: ajusta o jeito de pegar um objeto diferente que nunca usou antes." },{ text: "Faz movimentos finos sob comando verbal", emoji: "🤏", example: "Ex.: quando pedem, faz um movimento fino como apertar um botão." },{ text: "Realiza gestos sem precisar de muitas tentativas", emoji: "🎯", example: "Ex.: acerta o gesto pedido logo, sem precisar de muitas tentativas." },
    ]}],
  },
  "j26-111": {
    icon: Activity, gradient: "from-teal-500 to-emerald-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avaliação funcional do motor na paralisia cerebral (maior = mais funcional dentro do quadro). Base para o plano de terapias. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Função motora na PC (maior = mais funcional)", bands: DEV_BANDS,
    domains: [{ name: "Funcionalidade motora", color: "text-teal-600 dark:text-teal-400", items: [
      { text: "Mantém a cabeça e o tronco controlados", emoji: "🧍", example: "Ex.: observar se mantém cabeça e tronco firmes ao ficar sentada." },{ text: "Senta-se com o controle possível para o seu quadro", emoji: "🪑", example: "Ex.: senta com o melhor controle possível para o quadro dela." },{ text: "Faz transferências com a ajuda esperada", emoji: "🔀", example: "Ex.: passa da cadeira para a cama com a ajuda esperada para o caso." },{ text: "Desloca-se pelo ambiente (engatinha, anda, cadeira)", emoji: "🛞", example: "Ex.: se move pelo ambiente engatinhando, andando ou na cadeira de rodas." },{ text: "Caminha conforme seu nível (com ou sem apoio/órtese)", emoji: "🦿", example: "Ex.: caminha no seu nível, com apoio, andador ou órtese se precisar." },{ text: "Usa as mãos para manipular objetos", emoji: "🖐️", example: "Ex.: usa as mãos para segurar e mexer nos brinquedos e objetos." },{ text: "Alcança e segura objetos", emoji: "🤲", example: "Ex.: estica o braço, alcança o objeto e o segura na mão." },{ text: "Participa das AVDs com a assistência necessária", emoji: "🛁", example: "Ex.: participa do banho e de vestir-se com a ajuda que precisa." },{ text: "Mantém posturas funcionais ao longo do dia", emoji: "🧘", example: "Ex.: mantém posturas úteis (sentada, apoiada) ao longo do dia." },{ text: "Usa adaptações ou órteses de forma efetiva", emoji: "🦯", example: "Ex.: usa bem a órtese ou adaptação que ajuda no dia a dia." },{ text: "Comunica necessidades motoras (ajuda, posição)", emoji: "🗣️", example: "Ex.: avisa quando quer mudar de posição ou precisa de ajuda para se mexer." },{ text: "Participa de atividades dentro das suas possibilidades", emoji: "🎉", example: "Ex.: entra nas brincadeiras dentro do que o corpo dela permite." },
    ]}],
  },
  "j26-112": {
    icon: Activity, gradient: "from-cyan-500 to-blue-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia equilíbrio estático/dinâmico e marcha (maior = melhor). Detecta sinais cerebelares, vestibulares e motores. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Equilíbrio e marcha (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Equilíbrio e marcha", color: "text-cyan-600 dark:text-cyan-400", items: [
      { text: "Fica em pé parada sem se desequilibrar", emoji: "🧍", example: "Ex.: fica em pé parada sem balançar ou precisar se segurar." },{ text: "Equilibra-se em um pé por alguns segundos", emoji: "🦵", example: "Ex.: equilibra-se em um pé só por alguns segundos sem cair." },{ text: "Anda em linha reta (um pé à frente do outro)", emoji: "➡️", example: "Ex.: anda sobre uma linha colocando um pé bem na frente do outro." },{ text: "Anda na ponta dos pés quando pede", emoji: "🩰", example: "Ex.: caminha na ponta dos pés quando alguém pede." },{ text: "Anda sobre os calcanhares", emoji: "🦶", example: "Ex.: anda apoiando só os calcanhares, com os dedos levantados." },{ text: "Sobe degraus alternando os pés", emoji: "🪜", example: "Ex.: sobe a escada colocando um pé em cada degrau, alternando." },{ text: "Desce degraus com controle", emoji: "⬇️", example: "Ex.: desce os degraus devagar e com controle, sem se jogar." },{ text: "Agacha e levanta sem apoio", emoji: "🏋️", example: "Ex.: abaixa para pegar algo e levanta sem se apoiar em nada." },{ text: "Muda de direção ao correr sem cair", emoji: "🔄", example: "Ex.: muda de direção enquanto corre no pega-pega sem cair." },{ text: "Mantém o equilíbrio ao ser levemente empurrada", emoji: "🤚", example: "Ex.: ao receber um empurrãozinho leve, se firma e não cai." },{ text: "Tem marcha simétrica e harmoniosa", emoji: "🚶", example: "Ex.: observar se a marcha é simétrica, sem mancar ou arrastar o pé." },{ text: "Mantém o equilíbrio com os olhos fechados (conforme a idade)", emoji: "🙈", example: "Ex.: fica em pé equilibrada mesmo de olhos fechados, conforme a idade." },
    ]}],
  },
  "j26-113": {
    icon: Hand, gradient: "from-indigo-500 to-blue-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avaliação detalhada da caligrafia (maior = melhor). Subsidia decisões como o uso de computador na escola. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Escrita manual (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Qualidade da escrita manual", color: "text-indigo-600 dark:text-indigo-400", items: [
      { text: "Tem letra legível", emoji: "🖊️", example: "Ex.: dá para ler o que ela escreve sem precisar adivinhar as palavras." },{ text: "Faz pressão adequada no papel (nem fraca, nem forte demais)", emoji: "✍️", example: "Ex.: escreve sem marcar o papel demais nem com traço quase invisível." },{ text: "Mantém o tamanho das letras uniforme", emoji: "🔡", example: "Ex.: as letras saem do mesmo tamanho, sem umas gigantes e outras minúsculas." },{ text: "Mantém a inclinação constante das letras", emoji: "📐", example: "Ex.: as letras ficam todas inclinadas para o mesmo lado, não tortas." },{ text: "Tem espaçamento regular entre letras e palavras", emoji: "↔️", example: "Ex.: deixa espaços parecidos entre as palavras, sem colar tudo junto." },{ text: "Mantém as letras sobre a linha", emoji: "📏", example: "Ex.: escreve as letras apoiadas na linha do caderno, sem flutuar." },{ text: "Forma as letras com o traçado correto", emoji: "✏️", example: "Ex.: faz cada letra com o traçado certo, começando no ponto correto." },{ text: "Escreve com velocidade compatível com a série", emoji: "⚡", example: "Ex.: escreve num ritmo parecido com o esperado para o ano escolar." },{ text: "Mantém a legibilidade ao escrever rápido", emoji: "🏃", example: "Ex.: mesmo escrevendo depressa, dá para ler o que ela pôs no papel." },{ text: "Não apaga nem rabisca excessivamente", emoji: "🧽", example: "Ex.: escreve sem ficar apagando e rabiscando o tempo todo." },{ text: "Escreve sem dor ou cansaço excessivo na mão", emoji: "😣", example: "Ex.: escreve um texto sem reclamar de dor ou cansaço na mão." },{ text: "Organiza bem o texto na folha", emoji: "📄", example: "Ex.: distribui bem o texto na folha, com margens e sem amontoar." },
    ]}],
  },
  "j26-115": {
    icon: Activity, gradient: "from-emerald-500 to-teal-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia habilidades motoras para esportes e brincadeiras coletivas (maior = melhor). Importante para o desenvolvimento social. Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Habilidades esportivas (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Motor para esportes", color: "text-emerald-600 dark:text-emerald-400", items: [
      { text: "Corre com coordenação", emoji: "🏃", example: "Ex.: corre de forma coordenada, movendo braços e pernas em harmonia." },{ text: "Pula corda", emoji: "🪢", example: "Ex.: pula corda acertando o tempo do giro por várias vezes." },{ text: "Pega e arremessa bola", emoji: "🤾", example: "Ex.: pega a bola no ar e a arremessa de volta com controle." },{ text: "Chuta bola com direção", emoji: "⚽", example: "Ex.: chuta a bola mirando e acertando a direção que quer." },{ text: "Participa de jogos coletivos", emoji: "🏀", example: "Ex.: entra em jogos de time como futebol ou queimada com a turma." },{ text: "Acompanha o ritmo dos colegas no esporte", emoji: "🏅", example: "Ex.: acompanha o ritmo dos colegas nas brincadeiras e esportes." },{ text: "Tem equilíbrio para atividades físicas", emoji: "🤸", example: "Ex.: mantém o equilíbrio ao correr, pular e mudar de direção no jogo." },{ text: "Coordena braços e pernas em movimentos esportivos", emoji: "🏊", example: "Ex.: coordena braços e pernas juntos, como ao nadar ou dar cambalhota." },{ text: "Aprende novas habilidades esportivas", emoji: "🆕", example: "Ex.: aprende um novo movimento esportivo, como sacar no vôlei." },{ text: "Tem resistência física para brincar e jogar", emoji: "🔋", example: "Ex.: brinca e joga por um bom tempo sem ficar exausta rápido." },{ text: "Nada ou anda de bicicleta (conforme a idade)", emoji: "🚲", example: "Ex.: já anda de bicicleta ou nada conforme o esperado para a idade." },{ text: "Sente-se confiante em atividades físicas", emoji: "😎", example: "Ex.: participa das aulas de educação física animada e sem medo." },
    ]}],
  },
  "j26-117": {
    icon: Baby, gradient: "from-pink-500 to-rose-600", instruction: DEV_INSTRUCTION,
    infoBox: "Acompanhamento motor de prematuros nos primeiros 2 anos — usar IDADE CORRIGIDA (maior = mais marcos). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Motor do prematuro (idade corrigida)", bands: DEV_BANDS,
    domains: [{ name: "Marcos motores (idade corrigida)", color: "text-pink-600 dark:text-pink-400", items: [
      { text: "Sustenta a cabeça (idade corrigida)", emoji: "👶", example: "Ex.: no colo, mantém a cabeça firme conforme a idade corrigida." },{ text: "Apoia-se nos antebraços de bruços", emoji: "🤱", example: "Ex.: de barriga para baixo, se apoia nos cotovelos e levanta o peito." },{ text: "Rola", emoji: "🔄", example: "Ex.: rola de barriga para cima para de bruços sozinha." },{ text: "Senta com e depois sem apoio", emoji: "🪑", example: "Ex.: senta primeiro apoiada e depois sem precisar de apoio." },{ text: "Alcança e pega objetos", emoji: "🤲", example: "Ex.: estica o braço, alcança o chocalho e o segura na mão." },{ text: "Passa objetos de uma mão para a outra", emoji: "🔀", example: "Ex.: passa o brinquedo de uma mãozinha para a outra." },{ text: "Engatinha ou se desloca", emoji: "🐾", example: "Ex.: engatinha ou se arrasta para chegar até um brinquedo." },{ text: "Fica de pé com apoio", emoji: "🧍", example: "Ex.: fica de pé segurando no sofá ou nas mãos do adulto." },{ text: "Anda com e depois sem apoio", emoji: "🚶", example: "Ex.: dá os primeiros passos apoiada e depois anda sozinha." },{ text: "Tem tônus e postura simétricos", emoji: "⚖️", example: "Ex.: observar se os dois lados do corpo têm tônus e postura iguais." },{ text: "Faz movimentos variados e fluidos (não estereotipados)", emoji: "🌊", example: "Ex.: observar se os movimentos são variados e soltos, não repetitivos." },{ text: "Acompanha os marcos esperados para a idade corrigida", emoji: "📊", example: "Ex.: alcança sentar, engatinhar e andar dentro da idade corrigida." },
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
      { text: "As estratégias sensoriais ajudam a criança a se regular", emoji: "🧩", example: "Ex.: um abraço apertado ou um brinquedo de morder ajudam a acalmar." },{ text: "A criança fica mais calma após as atividades sensoriais", emoji: "😌", example: "Ex.: Depois de brincar com massinha ou pular na cama elástica, ela relaxa e briga menos." },{ text: "Melhorou o foco com a dieta sensorial", emoji: "🎯", example: "Ex.: Com as pausas sensoriais no dia, ele consegue terminar a lição sem se dispersar tanto." },{ text: "Melhorou o comportamento em casa", emoji: "🏠", example: "Ex.: Em casa há menos birras e ele coopera mais nas tarefas do dia a dia." },{ text: "Melhorou o comportamento na escola", emoji: "🏫", example: "Ex.: A professora relata que ele fica mais calmo na sala e participa mais das atividades." },{ text: "Reduziram as crises de sobrecarga", emoji: "🌪️", example: "Ex.: Os ataques de choro e descontrole em lugares cheios ficaram mais raros." },{ text: "A criança aceita bem as estratégias", emoji: "👍", example: "Ex.: Ela topa usar o fone abafador ou o colete de peso sem resistir." },{ text: "As estratégias são usadas na rotina diária", emoji: "🔄", example: "Ex.: As pausas para pular ou apertar já fazem parte da rotina antes da escola e da lição." },{ text: "Melhorou o sono", emoji: "😴", example: "Ex.: Dorme mais rápido e acorda menos vezes durante a noite." },{ text: "Melhorou a alimentação", emoji: "🍽️", example: "Ex.: Aceita mais tipos de comida e come melhor nas refeições." },{ text: "A família consegue aplicar as estratégias", emoji: "👨‍👩‍👧", example: "Ex.: Os pais conseguem colocar as estratégias em prática no dia a dia sem grande esforço." },{ text: "No geral, a dieta sensorial está funcionando", emoji: "✅", example: "Ex.: De modo geral, a família sente que a dieta sensorial trouxe melhoras reais." },
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
      { text: "Tem horário fixo para dormir", emoji: "🕘", example: "Ex.: Vai para a cama todos os dias por volta das 20h, sempre no mesmo horário." },{ text: "Tem horário fixo para acordar", emoji: "⏰", example: "Ex.: Acorda todo dia perto das 7h, inclusive na segunda-feira." },{ text: "Faz um ritual calmo antes de dormir (banho, leitura)", emoji: "🛁", example: "Ex.: Antes de dormir faz um banho morno e ouve uma historinha para relaxar." },{ text: "O quarto é escuro na hora de dormir", emoji: "🌑", example: "Ex.: Na hora de dormir o quarto fica escuro, sem luz forte acesa." },{ text: "O quarto é silencioso e tranquilo", emoji: "🤫", example: "Ex.: O quarto fica sem barulho de TV ou conversa alta na hora de dormir." },{ text: "Evita telas na hora antes de dormir", emoji: "📵", example: "Ex.: Desliga tablet e TV pelo menos uma hora antes de ir para a cama." },{ text: "Evita cafeína ou refrigerante à noite", emoji: "🥤", example: "Ex.: Evita refrigerante, chá preto ou chocolate à noite." },{ text: "Não faz atividade agitada perto da hora de dormir", emoji: "🤸", example: "Ex.: Não fica correndo ou pulando pouco antes da hora de dormir." },{ text: "Dorme na própria cama", emoji: "🛏️", example: "Ex.: Dorme na própria cama, sem precisar ir para a cama dos pais." },{ text: "Tem ambiente com temperatura agradável", emoji: "🌡️", example: "Ex.: O quarto não fica nem muito quente nem muito frio na hora de dormir." },{ text: "Evita refeições pesadas antes de dormir", emoji: "🍲", example: "Ex.: Evita jantar comida pesada logo antes de deitar." },{ text: "Mantém a rotina de sono nos fins de semana", emoji: "📅", example: "Ex.: Mantém o mesmo horário de dormir também no sábado e domingo." },
    ]}],
  },
  "j26-136": {
    icon: Sparkles, gradient: "from-emerald-500 to-teal-600", instruction:
      "Marque como está o sono desde o início da melatonina. Aplique semanalmente. Responda todos os itens.",
    infoBox: "Monitorização da resposta à melatonina (maior = melhor resposta). Ajustes de dose/horário com o médico. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Resposta à melatonina (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Resposta ao tratamento", color: "text-emerald-600 dark:text-emerald-400", items: [
      { text: "Demora menos para pegar no sono desde a melatonina", emoji: "⏳", example: "Ex.: Desde que começou a melatonina, demora bem menos para adormecer." },{ text: "Pega no sono em menos de 30 minutos", emoji: "💤", example: "Ex.: Deita e adormece em menos de meia hora." },{ text: "Acorda menos vezes durante a noite", emoji: "🌙", example: "Ex.: Acorda menos vezes de madrugada do que antes." },{ text: "Dorme mais horas no total", emoji: "🛌", example: "Ex.: Dorme mais horas por noite no total." },{ text: "Acorda mais descansada de manhã", emoji: "☀️", example: "Ex.: Levanta de manhã mais disposta, sem aquele cansaço." },{ text: "Está menos irritada durante o dia", emoji: "🙂", example: "Ex.: Fica menos nervosa e irritada ao longo do dia." },{ text: "Aceita bem a medicação", emoji: "💊", example: "Ex.: Toma o remédio sem recusar, engolindo o comprimido ou a gota tranquila." },{ text: "Não tem efeitos adversos (sonolência diurna, dor de cabeça)", emoji: "🚫", example: "Ex.: Não fica sonolenta de dia nem reclama de dor de cabeça por causa do remédio." },{ text: "A rotina de sono melhorou", emoji: "🔁", example: "Ex.: Os horários de dormir e acordar ficaram mais regulares." },{ text: "O comportamento diurno melhorou", emoji: "😃", example: "Ex.: Com o sono melhor, o humor e o comportamento durante o dia melhoraram." },{ text: "A família está dormindo melhor também", emoji: "👪", example: "Ex.: Como a criança dorme melhor, os pais também descansam mais à noite." },{ text: "No geral, a melatonina está ajudando", emoji: "🌟", example: "Ex.: No geral, a família sente que a melatonina está fazendo efeito." },
    ]}],
  },
  "j26-137": {
    icon: Sparkles, gradient: "from-teal-500 to-cyan-600", instruction: DEV_INSTRUCTION,
    infoBox: "Estrutura e monitora a rotina noturna (maior = melhor estruturada). Intervenção de primeira linha, antes de medicação. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Rotina noturna (maior = melhor estruturada)", bands: DEV_BANDS,
    domains: [{ name: "Estrutura da rotina", color: "text-teal-600 dark:text-teal-400", items: [
      { text: "Tem horário definido para começar a rotina da noite", emoji: "🕗", example: "Ex.: Todo dia por volta das 19h começa a rotina de se preparar para dormir." },{ text: "Faz o banho como parte da rotina", emoji: "🛀", example: "Ex.: O banho da noite faz parte do ritual antes de dormir." },{ text: "Janta em horário adequado", emoji: "🍽️", example: "Ex.: Janta em horário certo, sem deixar para muito tarde." },{ text: "Tem um período de brincadeira calma antes de dormir", emoji: "🧸", example: "Ex.: Tem um tempinho de brincadeira calma, como montar blocos, antes de deitar." },{ text: "Faz leitura ou história antes de dormir", emoji: "📖", example: "Ex.: Antes de dormir alguém lê uma historinha na cama." },{ text: "Diminui as luzes e os estímulos ao se aproximar a hora", emoji: "🔅", example: "Ex.: Perto da hora de dormir, diminuem as luzes e o barulho da casa." },{ text: "Apaga a luz em horário consistente", emoji: "💡", example: "Ex.: A luz do quarto é apagada sempre no mesmo horário." },{ text: "A criança sabe o que vem a seguir na rotina", emoji: "🗺️", example: "Ex.: Ela já sabe que depois do banho vem a história e depois apaga a luz." },{ text: "A rotina é tranquila (sem brigas)", emoji: "☮️", example: "Ex.: A hora de dormir acontece sem brigas ou choro." },{ text: "A rotina é mantida todos os dias", emoji: "📆", example: "Ex.: A rotina da noite é a mesma todos os dias da semana." },{ text: "A rotina é mantida nos fins de semana", emoji: "🗓️", example: "Ex.: A rotina se mantém também no fim de semana." },{ text: "A rotina ajuda a criança a dormir melhor", emoji: "😴", example: "Ex.: Com a rotina certinha, a criança pega no sono com mais facilidade." },
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
      { text: "Leva a mão ou objetos à boca (início da introdução)", emoji: "👶", example: "Ex.: Leva a mãozinha ou o brinquedo à boca, mostrando interesse em provar coisas." },{ text: "Come pedaços com a mão", emoji: "✋", example: "Ex.: Pega pedacinhos de fruta ou pão com a mão e leva à boca sozinha." },{ text: "Segura e bebe no copo", emoji: "🥤", example: "Ex.: Segura o copo e bebe água sem ajuda." },{ text: "Segura a colher (mesmo sem precisão)", emoji: "🥄", example: "Ex.: Segura a colher, mesmo derramando um pouco no caminho." },{ text: "Leva a colher à boca sozinha", emoji: "🍚", example: "Ex.: Enche a colher e leva até a boca sozinha." },{ text: "Come sozinha derramando pouco", emoji: "🍽️", example: "Ex.: Come sozinha e suja pouco a mesa e a roupa." },{ text: "Mastiga alimentos em pedaços", emoji: "😋", example: "Ex.: Mastiga bem alimentos em pedaços, como frango desfiado ou legumes." },{ text: "Senta na cadeirinha para comer", emoji: "🪑", example: "Ex.: Fica sentada no cadeirão durante a refeição." },{ text: "Aceita texturas progressivamente mais complexas", emoji: "🥕", example: "Ex.: Passa a aceitar texturas mais firmes, saindo do amassado para o picadinho." },{ text: "Sinaliza fome e saciedade", emoji: "🙌", example: "Ex.: Mostra quando está com fome e avisa quando já ficou satisfeita." },{ text: "Participa da refeição da família", emoji: "🍲", example: "Ex.: Come junto à mesa no mesmo horário da família." },{ text: "Usa garfo (conforme a idade)", emoji: "🍴", example: "Ex.: Já usa o garfo para espetar a comida, conforme a idade." },
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
      { text: "Tem um vínculo seguro com um cuidador", emoji: "🤱", example: "Ex.: Procura o colo do cuidador quando se assusta e se acalma com ele." },{ text: "Tem ao menos um adulto de confiança", emoji: "🫂", example: "Ex.: Tem pelo menos um adulto (mãe, avó, professora) em quem confia." },{ text: "Sente-se apoiada pela escola", emoji: "🏫", example: "Ex.: Sente que a escola acolhe e ajuda quando ela tem dificuldade." },{ text: "Tem amigos ou rede de apoio", emoji: "👫", example: "Ex.: Tem colegas ou parentes com quem pode contar." },{ text: "Acredita que pode superar dificuldades", emoji: "💪", example: "Ex.: Diante de um problema, acredita que é capaz de dar a volta por cima." },{ text: "Tem um senso de propósito ou sonhos", emoji: "⭐", example: "Ex.: Tem sonhos, como querer ser professora ou jogar bola quando crescer." },{ text: "Recupera-se após situações difíceis", emoji: "🌱", example: "Ex.: Depois de uma frustração ou perda, aos poucos volta a ficar bem." },{ text: "Pede e aceita ajuda", emoji: "🙋", example: "Ex.: Pede ajuda quando precisa e aceita quando alguém oferece." },{ text: "Tem autoestima razoável", emoji: "😊", example: "Ex.: Gosta de si mesma e fala coisas boas sobre ela própria." },{ text: "Consegue ver o lado bom das coisas", emoji: "🌈", example: "Ex.: Mesmo num dia ruim, consegue enxergar algo positivo." },{ text: "Tem rotinas e estrutura que a apoiam", emoji: "🧩", example: "Ex.: Tem horários e rotinas que dão segurança ao seu dia." },{ text: "Tem estratégias para lidar com o estresse", emoji: "🧘", example: "Ex.: Quando fica nervosa, respira fundo ou procura um canto calmo para se acalmar." },
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
      { text: "Alimenta-se sozinha (com a assistência esperada)", emoji: "🍴", example: "Ex.: Come sozinha, precisando apenas da ajuda esperada para a idade." },{ text: "Veste-se e despe-se (com a assistência esperada)", emoji: "👕", example: "Ex.: Veste e tira a roupa sozinha, com a ajuda esperada em botões ou cadarços." },{ text: "Faz a própria higiene (mãos, dentes, banho)", emoji: "🪥", example: "Ex.: Lava as mãos, escova os dentes e toma banho fazendo sua parte." },{ text: "Usa o banheiro de forma independente", emoji: "🚽", example: "Ex.: Vai ao banheiro sozinha, sem precisar de fralda ou ajuda." },{ text: "Desloca-se pelo ambiente", emoji: "🚶", example: "Ex.: Anda pela casa e pela escola indo de um cômodo a outro por conta própria." },{ text: "Comunica as suas necessidades", emoji: "🗣️", example: "Ex.: Consegue avisar quando está com fome, com dor ou querendo algo." },{ text: "Participa das tarefas simples de casa", emoji: "🧹", example: "Ex.: Ajuda em tarefinhas de casa, como guardar brinquedos ou pôr a mesa." },{ text: "Move-se com segurança (transferências)", emoji: "🔀", example: "Ex.: Passa da cama para a cadeira com segurança, com o apoio esperado." },{ text: "Manuseia objetos do dia a dia", emoji: "🧰", example: "Ex.: Manuseia objetos do dia a dia, como abrir a mochila ou segurar o lápis." },{ text: "Organiza os seus pertences", emoji: "🎒", example: "Ex.: Guarda e organiza seus próprios pertences, como roupas e material." },{ text: "Realiza a rotina diária com a autonomia possível", emoji: "🔄", example: "Ex.: Cumpre a rotina do dia com a autonomia que consegue ter." },{ text: "Pede ajuda quando necessário", emoji: "🙋", example: "Ex.: Sabe pedir ajuda quando não dá conta sozinha." },
    ]}],
  },
  "j26-181": {
    icon: Sparkles, gradient: "from-blue-500 to-indigo-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a participação social (maior = mais participação). Meta importante das intervenções. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Participação social (maior = mais)", bands: DEV_BANDS,
    domains: [{ name: "Participação na comunidade", color: "text-blue-600 dark:text-blue-400", items: [
      { text: "Participa de festas de aniversário", emoji: "🎂", example: "Ex.: Vai a festas de aniversário e participa da comemoração." },{ text: "Brinca com outras crianças", emoji: "🧒", example: "Ex.: Brinca junto com outras crianças, como no pega-pega ou na casinha." },{ text: "Participa de atividades na escola", emoji: "✏️", example: "Ex.: Participa das atividades propostas em sala, como rodinha e trabalhos." },{ text: "Participa de esportes ou atividades de grupo", emoji: "⚽", example: "Ex.: Participa de esportes ou brincadeiras em grupo, como futebol ou dança." },{ text: "Vai a passeios com a família", emoji: "🚗", example: "Ex.: Sai em passeios com a família, como ir ao parque ou ao shopping." },{ text: "Frequenta lugares públicos (praça, igreja, mercado)", emoji: "⛪", example: "Ex.: Vai a lugares públicos como praça, igreja e mercado." },{ text: "Tem amigos", emoji: "👭", example: "Ex.: Tem amigos com quem gosta de brincar e conversar." },{ text: "Participa de atividades religiosas ou culturais", emoji: "🎉", example: "Ex.: Participa de festas religiosas ou culturais, como missa ou festa junina." },{ text: "Aceita convites sociais", emoji: "💌", example: "Ex.: Quando é convidada para brincar ou para uma festa, ela aceita ir." },{ text: "Comunica-se nas situações sociais", emoji: "💬", example: "Ex.: Consegue conversar e se expressar quando está com outras pessoas." },{ text: "Participa das rotinas familiares", emoji: "🏡", example: "Ex.: Participa das rotinas da casa, como as refeições e os momentos em família." },{ text: "Tem oportunidades de participação na comunidade", emoji: "🌆", example: "Ex.: Tem chances de participar de atividades no bairro e na comunidade." },
    ]}],
  },
  "j26-184": {
    icon: Sparkles, gradient: "from-emerald-500 to-teal-600", instruction:
      "Para cada frase, marque o quanto concorda. Responda com sinceridade — sua opinião ajuda a melhorar o atendimento. Responda todos os itens.",
    infoBox: "Avalia a satisfação da família com o tratamento (maior = mais satisfeita). Usado para melhorar o atendimento. Não é diagnóstico.",
    labels: ["Discordo", "Mais ou menos", "Concordo"], totalLabel: "Satisfação com o tratamento (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Satisfação com a equipe e o cuidado", color: "text-emerald-600 dark:text-emerald-400", items: [
      { text: "Sinto-me bem acolhido(a) no atendimento", emoji: "🤝", example: "Ex.: A família se sente bem recebida e tratada com respeito nas consultas." },{ text: "O médico explica de forma clara", emoji: "👨‍⚕️", example: "Ex.: O médico explica o diagnóstico e o tratamento de um jeito fácil de entender." },{ text: "Tenho as minhas dúvidas respondidas", emoji: "❓", example: "Ex.: Quando os pais perguntam algo, saem da consulta com as dúvidas esclarecidas." },{ text: "Sinto que a minha opinião é considerada", emoji: "👂", example: "Ex.: A opinião da família é levada em conta nas decisões do tratamento." },{ text: "As terapias estão sendo úteis", emoji: "🩺", example: "Ex.: As terapias (fono, TO, psico) estão trazendo resultados percebidos." },{ text: "A equipe se comunica bem entre si", emoji: "🔗", example: "Ex.: Os profissionais conversam entre si e alinham as condutas." },{ text: "Consigo contato quando preciso", emoji: "📞", example: "Ex.: Quando precisa, a família consegue falar com a equipe sem dificuldade." },{ text: "Os horários e o acesso são adequados", emoji: "🗓️", example: "Ex.: Os horários das consultas e o acesso ao serviço funcionam bem para a família." },{ text: "Vejo evolução no meu filho", emoji: "📈", example: "Ex.: Os pais percebem que o filho está evoluindo com o acompanhamento." },{ text: "Confio na equipe", emoji: "💚", example: "Ex.: A família confia no trabalho e nas orientações da equipe." },{ text: "Recomendaria o atendimento", emoji: "👌", example: "Ex.: Indicaria esse atendimento para outra família na mesma situação." },{ text: "No geral, estou satisfeito(a) com o tratamento", emoji: "😀", example: "Ex.: De modo geral, a família está satisfeita com o tratamento oferecido." },
    ]}],
  },
  "j26-185": {
    icon: ClipboardList, gradient: "from-teal-500 to-cyan-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia o engajamento e as barreiras de acesso às terapias (maior = mais engajamento e menos barreiras). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Engajamento nas terapias (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Engajamento e acesso", color: "text-teal-600 dark:text-teal-400", items: [
      { text: "Conseguimos manter a frequência das terapias", emoji: "📅", example: "Ex.: A família consegue levar a criança às terapias sem faltar." },{ text: "Temos transporte para as terapias", emoji: "🚌", example: "Ex.: Há transporte para chegar às sessões de terapia." },{ text: "Conseguimos arcar com os custos", emoji: "💰", example: "Ex.: A família dá conta de pagar os custos do tratamento." },{ text: "A criança aceita e colabora nas terapias", emoji: "🙆", example: "Ex.: A criança colabora e participa das atividades nas sessões." },{ text: "Fazemos as atividades de casa orientadas", emoji: "🏠", example: "Ex.: A família faz em casa os exercícios que a terapeuta orientou." },{ text: "Vemos evolução com as terapias", emoji: "📊", example: "Ex.: Os pais notam progresso da criança com as terapias." },{ text: "Conseguimos conciliar com a rotina", emoji: "⚖️", example: "Ex.: As terapias cabem na rotina da família sem grandes conflitos." },{ text: "Temos acesso aos serviços necessários", emoji: "🏥", example: "Ex.: A família consegue acesso aos serviços que a criança precisa." },{ text: "A escola colabora com o tratamento", emoji: "🏫", example: "Ex.: A escola apoia e segue as orientações do tratamento." },{ text: "A família está engajada no plano", emoji: "🙌", example: "Ex.: A família está envolvida e comprometida com o plano de cuidado." },{ text: "Não há barreiras importantes ao tratamento", emoji: "🚧", example: "Ex.: Não há obstáculos grandes, como falta de vaga ou de dinheiro, atrapalhando." },{ text: "No geral, o engajamento está bom", emoji: "✅", example: "Ex.: No geral, a família está bem engajada no tratamento." },
    ]}],
  },
  "j26-186": {
    icon: Sparkles, gradient: "from-emerald-500 to-green-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia o sucesso real da inclusão escolar (maior = mais efetiva). Para as reuniões com a escola. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Inclusão efetiva (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Inclusão e participação ativa", color: "text-emerald-600 dark:text-emerald-400", items: [
      { text: "A criança tem amigos na escola", emoji: "👫", example: "Ex.: Tem colegas na escola com quem convive e brinca." },{ text: "Participa ativamente das aulas", emoji: "🙋", example: "Ex.: Participa das aulas, respondendo e fazendo as atividades." },{ text: "O professor faz as adaptações necessárias", emoji: "📝", example: "Ex.: O professor adapta as atividades, como dar mais tempo ou material diferente." },{ text: "O AEE ou apoio funciona", emoji: "🧑‍🏫", example: "Ex.: O atendimento educacional especializado ou o apoio na sala está funcionando." },{ text: "A criança é aceita pelos colegas", emoji: "🤗", example: "Ex.: Os colegas incluem a criança e não a deixam de lado." },{ text: "A criança está avançando na aprendizagem", emoji: "📚", example: "Ex.: A criança está aprendendo e avançando nos conteúdos." },{ text: "Há comunicação entre escola e família", emoji: "📨", example: "Ex.: Escola e família trocam informações sobre a criança com frequência." },{ text: "A criança se sente bem na escola", emoji: "😊", example: "Ex.: A criança gosta de ir à escola e se sente bem lá." },{ text: "As avaliações são adaptadas quando preciso", emoji: "🧾", example: "Ex.: As provas são adaptadas quando a criança precisa." },{ text: "A escola tem postura inclusiva", emoji: "🌍", example: "Ex.: A escola acolhe a diversidade e trabalha a inclusão de verdade." },{ text: "A criança participa dos eventos escolares", emoji: "🎪", example: "Ex.: Participa de eventos escolares, como festa junina e apresentações." },{ text: "No geral, a inclusão é efetiva", emoji: "🤝", example: "Ex.: No geral, a inclusão na escola está acontecendo de forma efetiva." },
    ]}],
  },
  "j26-187": {
    icon: Sparkles, gradient: "from-violet-500 to-purple-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a autonomia e o projeto de vida do adolescente com necessidades especiais (maior = mais autônomo). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Autonomia e projeto de vida (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Autonomia do adolescente", color: "text-violet-600 dark:text-violet-400", items: [
      { text: "Realiza as AVDs com a autonomia possível", emoji: "🧍", example: "Ex.: Faz as atividades diárias, como comer e se vestir, com a autonomia possível." },{ text: "Cuida da própria higiene e aparência", emoji: "🪥", example: "Ex.: Cuida da própria higiene e aparência, como banho, cabelo e dentes." },{ text: "Administra a própria rotina com o apoio adequado", emoji: "⏱️", example: "Ex.: Organiza sua rotina, como horários e compromissos, com o apoio adequado." },{ text: "Tem habilidades para tarefas domésticas", emoji: "🧹", example: "Ex.: Dá conta de tarefas de casa, como arrumar o quarto ou lavar louça." },{ text: "Comunica as suas necessidades e decisões", emoji: "🗣️", example: "Ex.: Consegue expressar o que precisa e as suas escolhas." },{ text: "Tem vida social e amizades", emoji: "👯", example: "Ex.: Tem amigos e uma vida social ativa." },{ text: "Tem um projeto profissional ou ocupacional", emoji: "💼", example: "Ex.: Tem um projeto de trabalho ou ocupação para o futuro." },{ text: "Participa de atividades na comunidade", emoji: "🌆", example: "Ex.: Participa de atividades no bairro, como cursos, grupos ou eventos." },{ text: "Tem noções de segurança e autocuidado", emoji: "⚠️", example: "Ex.: Sabe se cuidar e se proteger, como atravessar a rua com atenção." },{ text: "Lida com dinheiro e transações simples", emoji: "💵", example: "Ex.: Lida com dinheiro em compras simples, como pagar e conferir o troco." },{ text: "Recebeu orientação sobre sexualidade e relações", emoji: "❤️", example: "Ex.: Recebeu orientação sobre sexualidade, corpo e relacionamentos." },{ text: "Caminha para a maior independência possível", emoji: "🚀", example: "Ex.: Caminha rumo à maior independência que consegue alcançar." },
    ]}],
  },
  "j26-189": {
    icon: Activity, gradient: "from-teal-500 to-emerald-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a funcionalidade motora grossa na PC (maior = mais funcional). Complementa a classificação GMFCS. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Funcionalidade motora na PC (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Função motora grossa", color: "text-teal-600 dark:text-teal-400", items: [
      { text: "Controla a cabeça e o tronco", emoji: "🧠", example: "Ex.: Observe se sustenta a cabeça e mantém o tronco firme ao ser posicionada." },{ text: "Senta-se com a estabilidade possível", emoji: "🪑", example: "Ex.: Observe se consegue ficar sentada com a estabilidade possível para o nível dela." },{ text: "Faz transferências com a assistência esperada", emoji: "🔀", example: "Ex.: Observe se passa da cadeira para a cama com a ajuda esperada." },{ text: "Desloca-se pelo ambiente (anda, cadeira, engatinha)", emoji: "🦽", example: "Ex.: Observe como se desloca: andando, engatinhando ou na cadeira de rodas." },{ text: "Caminha em casa conforme o nível", emoji: "🚶", example: "Ex.: Observe se caminha dentro de casa conforme o nível motor dela." },{ text: "Caminha fora de casa ou na comunidade conforme o nível", emoji: "🌳", example: "Ex.: Observe se caminha na rua ou na comunidade conforme o nível motor." },{ text: "Sobe e desce superfícies ou degraus conforme o nível", emoji: "🪜", example: "Ex.: Observe se sobe e desce degraus ou rampas conforme o nível dela." },{ text: "Usa as mãos para tarefas funcionais", emoji: "✋", example: "Ex.: Observe se usa as mãos para tarefas úteis, como segurar objetos e manipular." },{ text: "Usa dispositivos ou órteses de forma efetiva", emoji: "🦿", example: "Ex.: Observe se usa órteses ou andador de forma que realmente ajude no dia a dia." },{ text: "Participa de atividades físicas adaptadas", emoji: "🤸", example: "Ex.: Observe se participa de atividades físicas adaptadas, como natação ou jogos." },{ text: "Mantém posturas funcionais ao longo do dia", emoji: "🧍", example: "Ex.: consegue ficar sentado à mesa e em pé para brincar sem se cansar demais." },{ text: "Tem a mobilidade necessária para a rotina", emoji: "🤸", example: "Ex.: move-se pela casa e troca de posição sem depender totalmente de ajuda." },
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
      { text: "Mantém estado de alerta adequado", emoji: "👀", example: "Ex.: fica desperto e atento durante a mamada ou a brincadeira, sem apagar toda hora." },{ text: "Tem estabilidade respiratória", emoji: "🫁", example: "Ex.: respira de forma regular, sem pausas longas ou esforço visível no peito." },{ text: "Tem reflexo de sucção presente", emoji: "🍼", example: "Ex.: ao encostar o dedo ou o bico na boca, o bebê começa a sugar." },{ text: "Coordena sucção e deglutição", emoji: "🍼", example: "Ex.: consegue sugar e depois engolir o leite sem deixar escorrer pela boca." },{ text: "Coordena sucção, deglutição e respiração", emoji: "🍼", example: "Ex.: mama, engole e respira em ritmo, sem precisar parar ofegante." },{ text: "Mantém a saturação durante a tentativa", emoji: "📈", example: "Ex.: o oxímetro mantém a saturação boa enquanto o bebê tenta mamar." },{ text: "Não engasga nem aspira nas tentativas", emoji: "⚠️", example: "Ex.: mama sem tossir, engasgar ou ficar roxo durante a tentativa." },{ text: "Demonstra sinais de fome ou procura", emoji: "😋", example: "Ex.: fica inquieto, leva a mão à boca ou vira procurando o peito quando está com fome." },{ text: "Tem tônus oral adequado", emoji: "👄", example: "Ex.: observar se lábios e língua têm força adequada, sem ficarem moles ou tensos demais." },{ text: "Ganha peso de forma adequada", emoji: "⚖️", example: "Ex.: nas pesagens, o bebê ganha alguns gramas por dia de forma constante." },{ text: "Tolera o volume oferecido", emoji: "🥛", example: "Ex.: aceita a quantidade de leite oferecida sem vomitar ou ficar muito distendido." },{ text: "Mostra prontidão para retirar a sonda", emoji: "✅", example: "Ex.: já mama o suficiente pela boca, sinalizando que a sonda pode ser retirada." },
    ]}],
  },
  "j26-192": {
    icon: Baby, gradient: "from-rose-500 to-pink-600", instruction: DEV_INSTRUCTION,
    infoBox: "Monitorização do Método Canguru até 6 meses de idade corrigida (maior = melhor evolução). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Follow-up do canguru (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Vínculo, amamentação e evolução", color: "text-rose-600 dark:text-rose-400", items: [
      { text: "Os pais fazem a posição canguru regularmente", emoji: "🦘", example: "Ex.: os pais colocam o bebê pele a pele no peito todos os dias, por bons períodos." },{ text: "O vínculo pais-bebê está fortalecido", emoji: "❤️", example: "Ex.: os pais conversam, acariciam e reconhecem o bebê como parte da família." },{ text: "A amamentação está estabelecida ou evoluindo", emoji: "🤱", example: "Ex.: o bebê já pega bem o peito e as mamadas estão cada vez melhores." },{ text: "O bebê ganha peso adequadamente", emoji: "⚖️", example: "Ex.: o peso sobe de forma esperada a cada pesagem." },{ text: "O bebê regula bem a temperatura", emoji: "🌡️", example: "Ex.: mantém-se aquecido no colo, sem esfriar as mãos e os pés facilmente." },{ text: "Os pais se sentem confiantes nos cuidados", emoji: "💪", example: "Ex.: os pais dão banho, trocam e alimentam o bebê sem medo ou insegurança." },{ text: "Os pais percebem os sinais do bebê", emoji: "👂", example: "Ex.: percebem quando o bebê está com fome, com sono ou incomodado." },{ text: "O bebê tem bons períodos de sono", emoji: "😴", example: "Ex.: dorme por períodos tranquilos, sem acordar sobressaltado a cada instante." },{ text: "O bebê está mais calmo e regulado", emoji: "🧘", example: "Ex.: chora menos e se acalma com mais facilidade no colo." },{ text: "A família tem rede de apoio", emoji: "👨‍👩‍👧", example: "Ex.: avós, vizinhos ou amigos ajudam nos cuidados e nas tarefas de casa." },{ text: "O bebê comparece ao follow-up", emoji: "📅", example: "Ex.: a família leva o bebê às consultas de acompanhamento marcadas." },{ text: "No geral, o seguimento do canguru vai bem", emoji: "👍", example: "Ex.: de modo geral, o método canguru está indo bem para o bebê e a família." },
    ]}],
  },
  "j26-194": {
    icon: Baby, gradient: "from-emerald-500 to-teal-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a prontidão para alta da UTIN e a transição para casa (maior = mais pronto). Reduz reinternações. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Prontidão para alta (maior = mais pronto)", bands: DEV_BANDS,
    domains: [{ name: "Prontidão de bebê e família", color: "text-emerald-600 dark:text-emerald-400", items: [
      { text: "O bebê se alimenta o suficiente por via oral", emoji: "🍼", example: "Ex.: consegue toda a alimentação pela boca, sem precisar de sonda." },{ text: "Mantém a temperatura estável fora da incubadora", emoji: "🌡️", example: "Ex.: mantém a temperatura no berço comum, sem a incubadora." },{ text: "Tem ganho de peso consistente", emoji: "📈", example: "Ex.: o peso sobe de forma constante ao longo das semanas." },{ text: "Tem estabilidade respiratória e cardíaca", emoji: "💓", example: "Ex.: batimentos e respiração ficam estáveis, sem alarmes frequentes nos monitores." },{ text: "Não tem mais episódios de apneia significativos", emoji: "🫁", example: "Ex.: já não faz pausas longas na respiração que exijam estímulo." },{ text: "A mãe ou o pai foi treinado(a) nos cuidados", emoji: "🧑‍🏫", example: "Ex.: a mãe ou o pai já sabe dar banho, medicar e cuidar do bebê em casa." },{ text: "A família sabe reconhecer sinais de alerta", emoji: "🚨", example: "Ex.: sabe identificar febre, respiração difícil ou o bebê muito molinho e procurar ajuda." },{ text: "A amamentação ou a alimentação está estabelecida", emoji: "🤱", example: "Ex.: o bebê mama bem e a rotina de alimentação está firme." },{ text: "Há rede de apoio em casa", emoji: "🏠", example: "Ex.: em casa há familiares que ajudam nos cuidados do dia a dia." },{ text: "Os retornos e o seguimento estão agendados", emoji: "📅", example: "Ex.: as consultas de retorno e exames já estão agendados na alta." },{ text: "As medicações de casa estão organizadas", emoji: "💊", example: "Ex.: os remédios de casa estão separados, com horários e doses anotados." },{ text: "No geral, bebê e família estão prontos para a alta", emoji: "🏡", example: "Ex.: de modo geral, bebê e família reúnem condições para ir para casa." },
    ]}],
  },
  "j26-195": {
    icon: Baby, gradient: "from-blue-500 to-indigo-600", instruction: DEV_INSTRUCTION,
    infoBox: "Seguimento do neurodesenvolvimento do prematuro aos 2 anos de idade CORRIGIDA (maior = mais adequado). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Follow-up 2 anos corrigidos (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Desenvolvimento (idade corrigida)", color: "text-blue-600 dark:text-blue-400", items: [
      { text: "Tem motor grosso adequado (idade corrigida)", emoji: "🤸", example: "Ex.: senta, engatinha ou anda conforme o esperado para a idade corrigida." },{ text: "Tem motor fino adequado", emoji: "✏️", example: "Ex.: pega objetos pequenos com os dedinhos e transfere de uma mão para a outra." },{ text: "Tem linguagem compatível (idade corrigida)", emoji: "🗣️", example: "Ex.: balbucia, fala palavras ou frases dentro do esperado para a idade corrigida." },{ text: "Tem desenvolvimento cognitivo adequado", emoji: "🧠", example: "Ex.: procura objetos escondidos e resolve pequenos desafios conforme a idade." },{ text: "Tem desenvolvimento social adequado", emoji: "😊", example: "Ex.: sorri, imita e interage com os pais de forma esperada para a idade." },{ text: "Anda com firmeza", emoji: "🚶", example: "Ex.: anda sozinho sem cambalear muito nem cair a cada passo." },{ text: "Fala palavras ou frases esperadas", emoji: "💬", example: "Ex.: diz palavras ou monta frases curtas conforme o esperado para a idade." },{ text: "Brinca de forma simbólica", emoji: "🧸", example: "Ex.: dá comidinha para a boneca ou faz o carrinho 'andar' de faz de conta." },{ text: "Tem boa interação social", emoji: "🤝", example: "Ex.: busca contato, brinca junto e responde bem a outras crianças e adultos." },{ text: "Tem tônus e postura adequados", emoji: "🧍", example: "Ex.: observar se o corpo tem firmeza e postura adequadas, sem estar mole ou rígido." },{ text: "Tem crescimento adequado (peso/altura/PC)", emoji: "📏", example: "Ex.: peso, altura e perímetro da cabeça sobem dentro das curvas esperadas." },{ text: "Acompanha os marcos para a idade corrigida", emoji: "🎯", example: "Ex.: alcança os marcos (sentar, andar, falar) na época esperada pela idade corrigida." },
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
      { text: "Dá o remédio todos os dias", emoji: "💊", example: "Ex.: dá o remédio à criança todos os dias, sem pular nenhum dia." },{ text: "Dá nos horários certos", emoji: "⏰", example: "Ex.: dá o remédio sempre no mesmo horário combinado, como 8h e 20h." },{ text: "Dá a dose correta", emoji: "🥄", example: "Ex.: mede exatamente os mL ou os comprimidos indicados pelo médico." },{ text: "Não esquece doses", emoji: "🧠", example: "Ex.: usa lembrete ou alarme e não deixa passar nenhuma dose." },{ text: "A criança aceita ou engole o remédio", emoji: "😋", example: "Ex.: a criança engole o remédio sem cuspir ou recusar." },{ text: "Mantém estoque (não falta)", emoji: "📦", example: "Ex.: compra o remédio antes de acabar, sem ficar dias sem ter em casa." },{ text: "Não interrompe por conta própria", emoji: "🚫", example: "Ex.: não para o remédio sozinho sem antes conversar com o médico." },{ text: "Consegue arcar com o custo", emoji: "💰", example: "Ex.: consegue pagar ou obter o medicamento sem que o custo impeça o tratamento." },{ text: "Continua mesmo quando a criança está bem", emoji: "🔄", example: "Ex.: mantém o remédio mesmo quando a criança parece totalmente bem." },{ text: "Sabe o que fazer se esquecer uma dose", emoji: "❓", example: "Ex.: sabe se deve tomar assim que lembrar ou pular, caso esqueça uma dose." },{ text: "Comparece às consultas e exames", emoji: "🏥", example: "Ex.: comparece às consultas e faz os exames de acompanhamento marcados." },{ text: "No geral, segue o tratamento corretamente", emoji: "✅", example: "Ex.: de modo geral, cumpre o tratamento como foi orientado pelo médico." },
    ]}],
  },
  "j26-203": {
    icon: MessageCircle, gradient: "from-sky-500 to-blue-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a comunicação social no pré-escolar e início do fundamental (maior = melhor). Identifica risco de TEA/TDL. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Comunicação social 3–7 anos (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Comunicação social", color: "text-sky-600 dark:text-sky-400", items: [
      { text: "Responde ao nome", emoji: "🙋", example: "Ex.: ao ser chamada pelo nome, vira o rosto ou olha para quem chamou." },{ text: "Mantém contato visual na interação", emoji: "👁️", example: "Ex.: olha nos olhos ao conversar ou brincar com outra pessoa." },{ text: "Espera e respeita os turnos na conversa", emoji: "🔁", example: "Ex.: fala e depois espera o outro responder, sem atropelar a conversa." },{ text: "Mantém um assunto compartilhado", emoji: "💬", example: "Ex.: continua falando do mesmo assunto que o outro trouxe, sem trocar toda hora." },{ text: "Pede ajuda quando precisa", emoji: "🙋", example: "Ex.: chama um adulto ou colega quando não consegue algo sozinha." },{ text: "Inicia interação com outras crianças", emoji: "🤝", example: "Ex.: chega perto e convida outras crianças para brincar." },{ text: "Responde a perguntas de forma pertinente", emoji: "💡", example: "Ex.: quando perguntam a cor da bola, responde algo que faz sentido, não aleatório." },{ text: "Usa e entende gestos sociais", emoji: "👋", example: "Ex.: acena tchau, aponta ou balança a cabeça e entende esses gestos nos outros." },{ text: "Compartilha interesse (mostra coisas)", emoji: "👉", example: "Ex.: mostra um brinquedo ou aponta algo interessante para dividir com o adulto." },{ text: "Brinca de forma cooperativa", emoji: "🧩", example: "Ex.: brinca junto com regras combinadas, dividindo peças e revezando a vez." },{ text: "Entende regras sociais simples", emoji: "📋", example: "Ex.: entende que deve esperar a vez ou guardar o brinquedo quando pedem." },{ text: "Comunica-se de forma funcional no grupo", emoji: "🗣️", example: "Ex.: consegue pedir, avisar e responder de forma útil dentro do grupo." },
    ]}],
  },
  "j26-205": {
    icon: Sparkles, gradient: "from-cyan-500 to-blue-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a cognição social na criança com TEA (maior = melhor). Base para a intervenção social. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Cognição social (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Cognição social", color: "text-cyan-600 dark:text-cyan-400", items: [
      { text: "Reconhece emoções básicas em faces", emoji: "😊", example: "Ex.: reconhece nas fotos ou nas pessoas quem está alegre, triste ou bravo." },{ text: "Reconhece emoções complexas", emoji: "😳", example: "Ex.: percebe emoções mais sutis como vergonha, ciúme ou orgulho nas pessoas." },{ text: "Entende a intenção dos outros", emoji: "🎯", example: "Ex.: entende que o colega estendeu a mão porque quer o brinquedo de volta." },{ text: "Lê a linguagem corporal", emoji: "🧍", example: "Ex.: percebe pela postura ou pelos braços cruzados que alguém está chateado." },{ text: "Tem empatia cognitiva (entende o que o outro sente)", emoji: "💗", example: "Ex.: percebe que o amigo está triste e entende o motivo pelo qual ele se sente assim." },{ text: "Entende perspectivas diferentes da sua", emoji: "🔄", example: "Ex.: entende que o colega pode querer outro jogo, diferente do que ela quer." },{ text: "Percebe quando alguém está brincando ou sendo irônico", emoji: "😜", example: "Ex.: percebe quando alguém fala de brincadeira e não leva tudo ao pé da letra." },{ text: "Ajusta o comportamento ao contexto social", emoji: "🎭", example: "Ex.: fala baixo na biblioteca e mais solto no parque, ajustando-se ao ambiente." },{ text: "Reconhece expressões pela voz e pelo tom", emoji: "🎵", example: "Ex.: percebe pela voz se a pessoa está brava ou animada, mesmo sem ver o rosto." },{ text: "Antecipa as reações dos outros", emoji: "🔮", example: "Ex.: sabe que o amigo vai ficar chateado se ela pegar o brinquedo sem pedir." },{ text: "Entende regras sociais implícitas", emoji: "🤫", example: "Ex.: entende que deve falar baixo num velório mesmo sem ninguém mandar." },{ text: "Aplica a cognição social no dia a dia", emoji: "🌍", example: "Ex.: usa o que sabe de convívio para se sair bem na escola, na fila e nas visitas." },
    ]}],
  },
  "j26-208": {
    icon: Sparkles, gradient: "from-emerald-500 to-teal-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia habilidades de vida independente em adolescentes com DI ou TEA (maior = mais independente). Para a transição à vida adulta. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Vida independente (maior = mais autônomo)", bands: DEV_BANDS,
    domains: [{ name: "Habilidades de vida independente", color: "text-emerald-600 dark:text-emerald-400", items: [
      { text: "Usa transporte público", emoji: "🚌", example: "Ex.: pega o ônibus certo, valida a passagem e desce no ponto correto." },{ text: "Faz uma compra simples e confere o troco", emoji: "🛒", example: "Ex.: compra um pão na padaria, paga e confere se o troco está certo." },{ text: "Prepara um lanche ou refeição simples", emoji: "🥪", example: "Ex.: faz um sanduíche ou esquenta uma refeição simples com segurança." },{ text: "Usa o celular com segurança", emoji: "📱", example: "Ex.: liga, atende e usa aplicativos sem passar dados a estranhos." },{ text: "Administra dinheiro básico", emoji: "💵", example: "Ex.: sabe quanto tem, separa o dinheiro e não gasta tudo de uma vez." },{ text: "Cuida da própria higiene e aparência", emoji: "🧼", example: "Ex.: toma banho, escova os dentes e se veste de forma adequada sozinha." },{ text: "Faz tarefas domésticas", emoji: "🧹", example: "Ex.: arruma a cama, lava a louça ou guarda a roupa em casa." },{ text: "Toma os próprios medicamentos com supervisão", emoji: "💊", example: "Ex.: toma os próprios remédios nos horários, com um adulto por perto conferindo." },{ text: "Conhece regras de segurança (rua, estranhos)", emoji: "🚦", example: "Ex.: olha antes de atravessar e não sai com estranhos que oferecem carona." },{ text: "Pede ajuda quando necessário", emoji: "🆘", example: "Ex.: procura um adulto ou pede orientação quando se perde ou não sabe o que fazer." },{ text: "Organiza a própria rotina", emoji: "🗓️", example: "Ex.: organiza sozinha os horários de acordar, estudar e cumprir seus compromissos." },{ text: "Tem habilidades para uma ocupação ou trabalho apoiado", emoji: "🧑‍🔧", example: "Ex.: realiza tarefas de um trabalho apoiado, como organizar ou embalar itens." },
    ]}],
  },
  "j26-209": {
    icon: ShieldAlert, gradient: "from-pink-500 to-rose-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia conhecimento e proteção em saúde sexual de adolescentes com NEE (maior = mais protegido e orientado). Orienta a educação sexual adaptada. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Saúde sexual e proteção (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Educação e proteção sexual", color: "text-pink-600 dark:text-pink-400", items: [
      { text: "Conhece as partes do corpo e a privacidade corporal", emoji: "🧍", example: "Ex.: nomeia as partes do corpo e entende que partes íntimas são privadas." },{ text: "Diferência toque adequado de inadequado", emoji: "✋", example: "Ex.: entende que um abraço combinado é ok, mas tocar as partes íntimas não é." },{ text: "Sabe dizer “não” a toques indesejados", emoji: "🚫", example: "Ex.: consegue dizer 'não' e se afastar quando um toque a incomoda." },{ text: "Sabe a quem recorrer se algo errado acontecer", emoji: "🆘", example: "Ex.: sabe contar para a mãe, o professor ou um adulto de confiança se algo ruim ocorrer." },{ text: "Entende noções de puberdade e mudanças do corpo", emoji: "🌱", example: "Ex.: entende que na puberdade o corpo muda, como o surgimento de pelos e a menstruação." },{ text: "Tem noções de relacionamentos saudáveis", emoji: "💞", example: "Ex.: entende que numa amizade ou namoro há respeito, e ninguém deve forçar nada." },{ text: "Entende limites e consentimento (no nível possível)", emoji: "🛑", example: "Ex.: entende, no seu nível, que só vale se os dois quiserem e sem obrigar ninguém." },{ text: "Tem a sua privacidade respeitada e compreende a dos outros", emoji: "🚪", example: "Ex.: pede privacidade para se trocar e também respeita a porta fechada dos outros." },{ text: "Conhece riscos básicos (abuso, exposição online)", emoji: "⚠️", example: "Ex.: sabe que não deve enviar fotos íntimas nem aceitar segredos que a assustem." },{ text: "Recebe educação sexual adaptada", emoji: "📚", example: "Ex.: recebe explicações sobre o corpo e a sexualidade adaptadas à sua compreensão." },{ text: "Comunica desconfortos relacionados ao corpo", emoji: "🗣️", example: "Ex.: consegue avisar quando algo no corpo dói, coça ou a deixa desconfortável." },{ text: "Tem proteção e orientação adequadas", emoji: "🛡️", example: "Ex.: observar se a criança recebe supervisão e orientação adequadas dos cuidadores." },
    ]}],
  },
  "j26-210": {
    icon: Sparkles, gradient: "from-blue-500 to-indigo-600", instruction:
      "Marque como está a criança HOJE em relação ao trimestre anterior. Responda todos os itens.",
    infoBox: "Avaliação trimestral de evolução pós-intervenção multidisciplinar (maior = mais evolução). Base para o relatório de acompanhamento. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Evolução trimestral (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Evolução pós-terapia", color: "text-blue-600 dark:text-blue-400", items: [
      { text: "Houve evolução na área principal tratada", emoji: "📈", example: "Ex.: se o foco era a fala, houve avanço claro na comunicação neste período." },{ text: "Houve evolução na comunicação", emoji: "💬", example: "Ex.: passou a usar mais palavras, gestos ou pedidos para se comunicar." },{ text: "Houve evolução no comportamento", emoji: "🎭", example: "Ex.: diminuíram as crises ou os comportamentos que atrapalhavam o dia a dia." },{ text: "Houve evolução na autonomia", emoji: "🦋", example: "Ex.: passou a se vestir, comer ou ir ao banheiro com mais independência." },{ text: "Houve evolução social", emoji: "🤝", example: "Ex.: interage mais e brinca melhor com colegas e familiares do que antes." },{ text: "As metas do trimestre foram alcançadas", emoji: "🎯", example: "Ex.: as metas combinadas no início do trimestre foram, em boa parte, atingidas." },{ text: "A família percebe melhora no dia a dia", emoji: "🏠", example: "Ex.: os pais notam a criança mais fácil de lidar na rotina de casa." },{ text: "A escola percebe melhora", emoji: "🏫", example: "Ex.: os professores relatam progresso na aprendizagem ou no comportamento em sala." },{ text: "A criança está mais regulada", emoji: "🧘", example: "Ex.: a criança lida melhor com frustrações e tem menos explosões." },{ text: "As terapias estão sendo efetivas", emoji: "🩺", example: "Ex.: as sessões de fono, TO ou psicologia mostram resultados concretos." },{ text: "O plano atual continua adequado", emoji: "📋", example: "Ex.: o plano de tratamento atual segue fazendo sentido, sem necessidade de mudança." },{ text: "No geral, a evolução é positiva", emoji: "👍", example: "Ex.: de modo geral, a criança está evoluindo bem no período avaliado." },
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
      { text: "Procura um objeto que sumiu (permanência do objeto)", emoji: "🔍", example: "Ex.: ao esconder o brinquedo, o bebê continua procurando por ele." },{ text: "Explora os brinquedos de formas variadas", emoji: "🧸", example: "Ex.: mexe no brinquedo de várias formas: sacode, bate, vira e leva à boca." },{ text: "Imita ações simples (bater palmas)", emoji: "👏", example: "Ex.: quando o adulto bate palmas, o bebê tenta repetir o gesto." },{ text: "Usa um objeto para alcançar outro (resolve problema)", emoji: "🪃", example: "Ex.: puxa o paninho para alcançar o brinquedo que está em cima dele." },{ text: "Encontra um objeto escondido sob um pano", emoji: "🫥", example: "Ex.: você cobre o brinquedo com um pano e o bebê levanta o pano para achá-lo." },{ text: "Manipula o brinquedo para entender como funciona", emoji: "🔧", example: "Ex.: gira, aperta e examina o brinquedo tentando descobrir como ele funciona." },{ text: "Busca ou aponta o que quer (intencionalidade)", emoji: "👉", example: "Ex.: aponta ou estica os braços para pegar o objeto que deseja." },{ text: "Empilha ou encaixa objetos simples", emoji: "🧱", example: "Ex.: coloca um cubo sobre o outro ou encaixa peças simples." },{ text: "Reconhece objetos e pessoas familiares", emoji: "👨‍👩‍👧", example: "Ex.: reconhece o rosto da mãe e objetos do dia a dia, como a mamadeira." },{ text: "Antecipa rotinas (sabe o que vem depois)", emoji: "🔮", example: "Ex.: ao ver o babador, entende que a comida está chegando." },{ text: "Imita gestos novos", emoji: "🙌", example: "Ex.: aprende a imitar um gesto novo, como mandar beijo, ao ver o adulto fazer." },{ text: "Brinca de causa e efeito (aperta botão e faz tocar)", emoji: "🔘", example: "Ex.: aperta o botão do brinquedo e se anima porque sabe que vai tocar música." },
    ]}],
  },
  "j26-005": {
    icon: Baby, gradient: "from-pink-500 to-rose-600", instruction: DEV_INSTRUCTION,
    infoBox: "Triagem da regulação sensorial e comportamental do neonato (maior = melhor regulação). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Regulação sensorial neonatal (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Regulação do recém-nascido", color: "text-pink-600 dark:text-pink-400", items: [
      { text: "Acalma-se quando embalado ou aconchegado", emoji: "🤗", example: "Ex.: para de chorar quando é embalado no colo ou enrolado com aconchego." },{ text: "Tolera o toque do cuidado (banho, troca)", emoji: "🛁", example: "Ex.: aceita o banho e a troca de fralda sem se irritar demais com o toque." },{ text: "Mantém-se calmo com estímulos comuns", emoji: "🧘", example: "Ex.: continua tranquilo diante de barulhos e movimentos comuns da casa." },{ text: "Tem períodos de alerta tranquilo", emoji: "😌", example: "Ex.: tem momentos acordado e calmo, olhando ao redor sem chorar." },{ text: "Transita suavemente entre sono e vigília", emoji: "🌙", example: "Ex.: passa do sono para o estado acordado sem sobressaltos ou choro intenso." },{ text: "Reage de forma proporcional a sons", emoji: "🔊", example: "Ex.: observar se reage a um som forte sem susto exagerado nem indiferença total." },{ text: "Reage de forma proporcional à luz", emoji: "💡", example: "Ex.: reage à luz acesa de forma moderada, sem se sobressaltar demais." },{ text: "Mantém o tônus organizado (nem muito mole, nem rígido)", emoji: "💪", example: "Ex.: observar se o corpo do bebê fica organizado, nem muito mole nem enrijecido." },{ text: "Suga e se alimenta de forma organizada", emoji: "🍼", example: "Ex.: mama em ritmo organizado, coordenando sucção sem se cansar rápido." },{ text: "Recupera-se após um estímulo intenso", emoji: "🔄", example: "Ex.: após um susto ou barulho forte, se acalma e volta ao normal em pouco tempo." },{ text: "Não se sobressalta excessivamente", emoji: "😲", example: "Ex.: não pula assustado a cada pequeno ruído ou movimento." },{ text: "No geral, regula bem os estímulos", emoji: "🌈", example: "Ex.: de modo geral, lida bem com luzes, sons e toques sem se desorganizar." },
    ]}],
  },
  "j26-010": {
    icon: Baby, gradient: "from-blue-500 to-indigo-600", instruction: DEV_INSTRUCTION,
    infoBox: "Triagem global de 24 a 36 meses nas 5 áreas (maior = mais marcos). O detalhamento por domínio mostra a área mais frágil. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Triagem global 24–36 meses", bands: DEV_BANDS,
    domains: [
      { name: "Motor grosso", color: "text-amber-600 dark:text-amber-400", items: [{ text: "Corre sem cair", emoji: "🏃", example: "Ex.: corre pela sala ou pelo parque sem tropeçar e cair a toda hora." },{ text: "Sobe escada com apoio", emoji: "🪜", example: "Ex.: sobe os degraus segurando no corrimão ou na mão do adulto." },{ text: "Chuta uma bola", emoji: "⚽", example: "Ex.: chuta a bola parada sem perder o equilíbrio." }] },
      { name: "Motor fino", color: "text-teal-600 dark:text-teal-400", items: [{ text: "Empilha 4 ou mais cubos", emoji: "🧱", example: "Ex.: empilha quatro ou mais cubos formando uma torre que se mantém em pé." },{ text: "Rabisca espontaneamente", emoji: "🖍️", example: "Ex.: pega o lápis e faz rabiscos no papel por vontade própria." },{ text: "Vira páginas de um livro", emoji: "📖", example: "Ex.: folheia um livro infantil virando as páginas, mesmo que várias de uma vez." }] },
      { name: "Linguagem expressiva", color: "text-blue-600 dark:text-blue-400", items: [{ text: "Fala frases de 2-3 palavras", emoji: "🗣️", example: "Ex.: junta palavras como 'quer água' ou 'cadê mamãe'." },{ text: "Nomeia objetos comuns", emoji: "🧸", example: "Ex.: ao ver um brinquedo, diz \"bola\", \"cachorro\" ou \"copo\" sem precisar de ajuda." },{ text: "Usa o próprio nome ou “eu”", emoji: "🙋", example: "Ex.: diz \"eu quero\" ou fala o próprio nome, como \"Ana comeu\"." }] },
      { name: "Linguagem receptiva", color: "text-sky-600 dark:text-sky-400", items: [{ text: "Segue ordens de 2 passos", emoji: "👟", example: "Ex.: entende \"pega o sapato e traz aqui\" e faz as duas coisas." },{ text: "Aponta figuras quando nomeadas", emoji: "👉", example: "Ex.: no livro, aponta o cachorro quando você pergunta \"cadê o au-au?\"." },{ text: "Entende conceitos (grande/pequeno)", emoji: "📏", example: "Ex.: sabe mostrar qual bola é a grande e qual é a pequena." }] },
      { name: "Social", color: "text-pink-600 dark:text-pink-400", items: [{ text: "Brinca perto de outras crianças", emoji: "👫", example: "Ex.: brinca ao lado de outras crianças no parquinho, mesmo cada uma no seu." },{ text: "Imita tarefas do dia a dia", emoji: "🧹", example: "Ex.: finge varrer o chão ou passar pano imitando os adultos de casa." },{ text: "Faz de conta (boneca, telefone)", emoji: "📞", example: "Ex.: pega um bloco e finge que é telefone, ou dá comida à boneca." }] },
    ],
  },
  "j26-011": {
    icon: Baby, gradient: "from-indigo-500 to-blue-600", instruction: DEV_INSTRUCTION,
    infoBox: "Triagem global de 36 a 60 meses, pré-escolar (maior = mais marcos). Útil antes da entrada na escola. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Triagem global 36–60 meses", bands: DEV_BANDS,
    domains: [
      { name: "Motor grosso", color: "text-amber-600 dark:text-amber-400", items: [{ text: "Pula em um pé só", emoji: "🦵", example: "Ex.: consegue dar pulinhos apoiada em apenas um pé." },{ text: "Sobe escada alternando os pés", emoji: "🪜", example: "Ex.: sobe a escada colocando um pé em cada degrau, sem juntar os pés." },{ text: "Equilibra-se brevemente em um pé", emoji: "⚖️", example: "Ex.: fica parada em um pé só por alguns segundos sem se apoiar." }] },
      { name: "Motor fino", color: "text-teal-600 dark:text-teal-400", items: [{ text: "Copia um círculo ou uma cruz", emoji: "⭕", example: "Ex.: olha um desenho de círculo ou cruz e tenta copiá-lo no papel." },{ text: "Usa a tesoura", emoji: "✂️", example: "Ex.: segura a tesoura sem ponta e corta uma tira de papel." },{ text: "Veste-se com pouca ajuda", emoji: "👕", example: "Ex.: veste a camiseta e o short quase sozinha, pedindo pouca ajuda." }] },
      { name: "Linguagem", color: "text-blue-600 dark:text-blue-400", items: [{ text: "Conta uma história curta", emoji: "📖", example: "Ex.: conta o que fez no parque, com começo, meio e fim simples." },{ text: "Fala frases completas", emoji: "💬", example: "Ex.: fala frases como \"eu quero mais suco, mamãe\"." },{ text: "Faz perguntas", emoji: "❓", example: "Ex.: pergunta \"o que é isso?\" ou \"onde está o papai?\"." }] },
      { name: "Cognição", color: "text-violet-600 dark:text-violet-400", items: [{ text: "Entende conceitos (cores, números)", emoji: "🔢", example: "Ex.: nomeia cores como azul e vermelho e conta até três." },{ text: "Segue ordens de 3 passos", emoji: "📝", example: "Ex.: cumpre \"pega o copo, joga fora e senta na cadeira\" na ordem." },{ text: "Entende “por quê”", emoji: "🤔", example: "Ex.: responde de forma simples quando você pergunta \"por que você chorou?\"." }] },
      { name: "Autonomia e social", color: "text-pink-600 dark:text-pink-400", items: [{ text: "Usa o banheiro sozinha", emoji: "🚽", example: "Ex.: vai ao banheiro, faz xixi e cocô sozinha, sem precisar de fralda." },{ text: "Brinca cooperativamente", emoji: "🤝", example: "Ex.: monta um quebra-cabeça junto com um amiguinho, dividindo as peças." },{ text: "Espera a vez", emoji: "⏳", example: "Ex.: espera sua vez para descer no escorregador sem empurrar." }] },
    ],
  },
  "j26-012": {
    icon: Sparkles, gradient: "from-emerald-500 to-teal-600", instruction: DEV_INSTRUCTION,
    infoBox: "Guia de estimulação e triagem tipo Portage adaptado (maior = mais marcos por área). Referência para estimulação domiciliar. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Triagem tipo Portage (maior = mais marcos)", bands: DEV_BANDS,
    domains: [
      { name: "Socialização", color: "text-pink-600 dark:text-pink-400", items: [{ text: "Interage e busca o outro", emoji: "🫂", example: "Ex.: procura o adulto para mostrar algo ou chamar para brincar." },{ text: "Brinca com outras crianças", emoji: "🧒", example: "Ex.: participa de brincadeiras junto com outras crianças, como pega-pega." },{ text: "Demonstra afeto", emoji: "❤️", example: "Ex.: dá abraços, beijos e diz que gosta dos pais e dos irmãos." }] },
      { name: "Linguagem", color: "text-blue-600 dark:text-blue-400", items: [{ text: "Comunica o que quer", emoji: "🗣️", example: "Ex.: consegue avisar quando está com fome, sede ou quer um brinquedo." },{ text: "Fala conforme a idade", emoji: "👶", example: "Ex.: fala com clareza e quantidade de palavras esperadas para a idade dela." },{ text: "Entende ordens", emoji: "👂", example: "Ex.: compreende pedidos como \"guarda os brinquedos\" e obedece." }] },
      { name: "Autocuidado", color: "text-cyan-600 dark:text-cyan-400", items: [{ text: "Come e bebe com a autonomia da idade", emoji: "🍽️", example: "Ex.: come com garfo e bebe no copo sozinha, conforme esperado para a idade." },{ text: "Veste-se conforme a idade", emoji: "🧥", example: "Ex.: coloca a roupa e o casaco sozinha, no nível esperado para a idade." },{ text: "Faz a higiene conforme a idade", emoji: "🧼", example: "Ex.: lava as mãos e escova os dentes conforme o esperado para a idade." }] },
      { name: "Cognição", color: "text-violet-600 dark:text-violet-400", items: [{ text: "Resolve problemas simples", emoji: "🧩", example: "Ex.: quando a peça não encaixa, tenta virá-la ou buscar outra." },{ text: "Reconhece formas/cores/números conforme a idade", emoji: "🔷", example: "Ex.: identifica quadrado, a cor verde e conta objetos, conforme a idade." },{ text: "Brinca de faz de conta", emoji: "🦸", example: "Ex.: brinca de super-herói, de médico ou de fazer comidinha." }] },
      { name: "Motor", color: "text-amber-600 dark:text-amber-400", items: [{ text: "Tem motor grosso adequado", emoji: "🏃", example: "Ex.: corre, pula e sobe sem cair mais do que o esperado para a idade." },{ text: "Tem motor fino adequado", emoji: "✏️", example: "Ex.: segura o lápis e encaixa peças pequenas com boa destreza." },{ text: "Coordena os movimentos", emoji: "🤸", example: "Ex.: chuta a bola e pega objetos sem se atrapalhar com os movimentos." }] },
    ],
  },

  // ============================================================
  // LOTE 19A — Evolução/Monitorização J26-211 a 235 (autoral)
  // ============================================================

  "j26-211": { icon: MessageCircle, gradient: "from-pink-500 to-rose-600", instruction: DEV_INSTRUCTION,
    infoBox: "Registro evolutivo trimestral da comunicação social no TEA (maior = melhor). Compare com o registro anterior. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Comunicação social — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Comunicação social", color: "text-pink-600 dark:text-pink-400", items: [{ text: "Faz contato visual na interação", emoji: "👀", example: "Ex.: olha nos seus olhos quando você conversa ou brinca com ela." },{ text: "Responde ao nome", emoji: "📣", example: "Ex.: vira o rosto e olha quando alguém chama pelo nome dela." },{ text: "Inicia comunicação espontaneamente", emoji: "💡", example: "Ex.: chega perto e começa a falar ou mostrar algo por conta própria." },{ text: "Usa gestos sociais", emoji: "👋", example: "Ex.: acena \"tchau\", manda beijo e balança a cabeça para dizer sim ou não." },{ text: "Tem atenção compartilhada", emoji: "🔗", example: "Ex.: olha um avião no céu e depois olha para você, dividindo o interesse." },{ text: "Mantém a troca social", emoji: "🔄", example: "Ex.: mantém uma brincadeira de troca, como jogar a bola de volta várias vezes." },{ text: "Responde a perguntas", emoji: "🙋", example: "Ex.: responde quando você pergunta \"o que você quer comer?\"." },{ text: "Demonstra interesse por outras crianças", emoji: "🧒", example: "Ex.: observa, se aproxima e demonstra vontade de brincar com outras crianças." }] }] },
  "j26-213": { icon: Sparkles, gradient: "from-teal-500 to-cyan-600", instruction: DEV_INSTRUCTION,
    infoBox: "Monitorização trimestral das habilidades adaptativas no TEA (maior = mais autônoma). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Habilidades adaptativas — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "AVDs e autonomia", color: "text-teal-600 dark:text-teal-400", items: [{ text: "Cuida da própria higiene", emoji: "🪥", example: "Ex.: cuida da higiene sozinha, como escovar os dentes e lavar o rosto." },{ text: "Alimenta-se com autonomia", emoji: "🍴", example: "Ex.: come sozinha usando talheres, sem precisar ser alimentada." },{ text: "Veste-se com autonomia", emoji: "👚", example: "Ex.: escolhe e coloca a roupa sozinha, incluindo fechar botões ou zíper." },{ text: "Organiza seus pertences", emoji: "🎒", example: "Ex.: guarda os brinquedos e arruma a mochila sem precisar mandar." },{ text: "Segue a rotina com autonomia", emoji: "📅", example: "Ex.: cumpre a rotina de tomar banho, comer e dormir sem muita cobrança." },{ text: "Comunica necessidades", emoji: "🗣️", example: "Ex.: avisa que está com dor, com fome ou que quer ir ao banheiro." },{ text: "Ajuda em tarefas domésticas", emoji: "🧺", example: "Ex.: ajuda a pôr a mesa, guardar louça ou recolher a roupa." },{ text: "Tem noções de segurança", emoji: "⚠️", example: "Ex.: sabe que não pode mexer no fogão e olha antes de atravessar a rua." }] }] },
  "j26-216": { icon: Sparkles, gradient: "from-pink-500 to-rose-600", instruction: DEV_INSTRUCTION,
    infoBox: "Monitorização sequencial de contato visual e atenção conjunta no TEA (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Contato visual e atenção conjunta (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Atenção conjunta", color: "text-pink-600 dark:text-pink-400", items: [{ text: "Faz contato visual espontâneo", emoji: "👁️", example: "Ex.: olha nos seus olhos por vontade própria, sem você precisar pedir." },{ text: "Sustenta o olhar na interação", emoji: "👀", example: "Ex.: mantém o olhar em você durante a conversa, sem desviar logo." },{ text: "Segue o apontar do adulto", emoji: "👉", example: "Ex.: quando você aponta para o avião, ela olha na direção que você mostrou." },{ text: "Aponta para mostrar", emoji: "☝️", example: "Ex.: aponta para o cachorro só para lhe mostrar, não para pedir." },{ text: "Alterna o olhar objeto-pessoa", emoji: "🔀", example: "Ex.: olha o brinquedo, depois olha para você, e volta a olhar o brinquedo." },{ text: "Faz referência social", emoji: "😊", example: "Ex.: diante de algo novo, olha seu rosto para saber se pode se aproximar." },{ text: "Compartilha interesse", emoji: "🌟", example: "Ex.: mostra o que achou legal e sorri para dividir a alegria com você." },{ text: "Responde ao nome olhando", emoji: "📛", example: "Ex.: ao ouvir o próprio nome, para e olha para quem chamou." }] }] },
  "j26-217": { icon: Sparkles, gradient: "from-teal-500 to-cyan-600", instruction: DEV_INSTRUCTION,
    infoBox: "Acompanhamento trimestral da brincadeira funcional e simbólica no TEA (maior = mais elaborada). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Brincadeira — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Brincar funcional e simbólico", color: "text-teal-600 dark:text-teal-400", items: [{ text: "Explora os brinquedos de forma variada", emoji: "🧸", example: "Ex.: usa os brinquedos de várias formas, não só enfileirando ou girando." },{ text: "Usa os objetos pela função", emoji: "🚗", example: "Ex.: empurra o carrinho pelo chão em vez de só girar as rodinhas." },{ text: "Faz de conta simples", emoji: "🍼", example: "Ex.: finge dar mamadeira à boneca ou dar comidinha ao bichinho." },{ text: "Cria cenários no faz de conta", emoji: "🎭", example: "Ex.: monta uma história, como \"a boneca vai ao médico e depois dorme\"." },{ text: "Substitui um objeto por outro", emoji: "🍌", example: "Ex.: usa uma banana como telefone ou um bloco como carrinho." },{ text: "Brinca em sequência", emoji: "📋", example: "Ex.: brinca em etapas: cozinha, serve o prato e depois lava a louça." },{ text: "Aceita o adulto na brincadeira", emoji: "🧑‍🤝‍🧑", example: "Ex.: deixa você entrar na brincadeira e aceita novas ideias na história." },{ text: "Brinca de forma cooperativa", emoji: "🤝", example: "Ex.: brinca junto combinando papéis, como um ser médico e outro paciente." }] }] },
  "j26-218": { icon: Heart, gradient: "from-emerald-500 to-teal-600", instruction:
      "Marque como está a criança HOJE em relação ao início do tratamento. Responda todos os itens.",
    infoBox: "Impressão global de melhora no TEA relatada pelos pais (maior = mais melhora). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Impressão de melhora TEA (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Melhora percebida", color: "text-emerald-600 dark:text-emerald-400", items: [{ text: "Melhorou a comunicação", emoji: "📈", example: "Ex.: agora fala mais e se faz entender melhor do que antes do tratamento." },{ text: "Melhorou o social", emoji: "🙂", example: "Ex.: está mais próxima das outras crianças e interage mais que antes." },{ text: "Melhorou o comportamento", emoji: "✅", example: "Ex.: reduziu birras e obedece mais às combinações do dia a dia." },{ text: "Melhorou a autonomia", emoji: "🦸", example: "Ex.: passou a fazer mais coisas sozinha, como se vestir e comer." },{ text: "Tem menos crises", emoji: "🌈", example: "Ex.: as crises de choro ou de raiva ficaram menos frequentes." },{ text: "Melhorou o sono", emoji: "😴", example: "Ex.: passou a dormir melhor, acordando menos vezes durante a noite." },{ text: "Melhorou a alimentação", emoji: "🥦", example: "Ex.: passou a aceitar mais alimentos e comer com menos recusa." },{ text: "Houve melhora geral percebida", emoji: "🌟", example: "Ex.: no geral, a família percebe que ela evoluiu bastante." }] }] },
  "j26-220": { icon: Sparkles, gradient: "from-amber-500 to-orange-600", instruction: DEV_INSTRUCTION,
    infoBox: "Acompanhamento trimestral das funções executivas no cotidiano do TDAH (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Funções executivas — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Funções executivas", color: "text-amber-600 dark:text-amber-400", items: [{ text: "Inicia as tarefas", emoji: "🚀", example: "Ex.: começa a tarefa por conta própria, sem precisar de vários avisos." },{ text: "Organiza materiais e tarefas", emoji: "🗂️", example: "Ex.: separa o material e organiza o que precisa antes de começar." },{ text: "Planeja os passos", emoji: "🧭", example: "Ex.: pensa nos passos antes de agir, como o que fazer primeiro na lição." },{ text: "Usa a memória de trabalho", emoji: "🧠", example: "Ex.: guarda uma instrução na cabeça e a usa enquanto faz a atividade." },{ text: "Tem flexibilidade", emoji: "🔄", example: "Ex.: muda de estratégia quando a primeira ideia não deu certo." },{ text: "Tem controle inibitório", emoji: "🛑", example: "Ex.: consegue se segurar e não sair correndo ou falar fora de hora." },{ text: "Termina o que começa", emoji: "🏁", example: "Ex.: leva a tarefa até o fim em vez de largar no meio." },{ text: "Administra o tempo", emoji: "⏰", example: "Ex.: percebe quanto tempo tem e se organiza para não se atrasar." }] }] },
  "j26-221": { icon: Sparkles, gradient: "from-blue-500 to-indigo-600", instruction: DEV_INSTRUCTION,
    infoBox: "Registro trimestral do desempenho escolar no TDAH (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Desempenho escolar — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Desempenho escolar", color: "text-blue-600 dark:text-blue-400", items: [{ text: "Acompanha o conteúdo", emoji: "📚", example: "Ex.: acompanha a matéria dada em aula sem ficar muito para trás." },{ text: "Faz as tarefas", emoji: "📝", example: "Ex.: faz as lições de casa e as atividades pedidas pela escola." },{ text: "Participa das aulas", emoji: "🙋", example: "Ex.: participa da aula respondendo e se envolvendo nas atividades." },{ text: "Tem notas adequadas", emoji: "🎯", example: "Ex.: tira notas dentro do esperado para a série dela." },{ text: "Mantém o foco em sala", emoji: "🔍", example: "Ex.: consegue manter a atenção na aula sem se distrair a todo momento." },{ text: "Organiza o material", emoji: "🗃️", example: "Ex.: mantém o caderno e a mochila organizados, sem perder material." },{ text: "Entrega no prazo", emoji: "📆", example: "Ex.: entrega os trabalhos e as tarefas dentro do prazo pedido." },{ text: "Tem bom comportamento em sala", emoji: "🪑", example: "Ex.: comporta-se bem na sala, respeitando o professor e os colegas." }] }] },
  "j26-223": { icon: Sparkles, gradient: "from-orange-500 to-red-600", instruction: DEV_INSTRUCTION,
    infoBox: "Acompanhamento sequencial da regulação emocional no TDAH (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Regulação emocional — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Regulação emocional", color: "text-orange-600 dark:text-orange-400", items: [{ text: "Acalma-se sozinha", emoji: "🧘", example: "Ex.: consegue se acalmar sozinha depois de se irritar, sem depender de outros." },{ text: "Tolera a frustração", emoji: "😤", example: "Ex.: lida com um \"não\" ou com perder um jogo sem fazer grande crise." },{ text: "Controla a raiva", emoji: "🌡️", example: "Ex.: quando fica com raiva, consegue se controlar sem bater ou gritar." },{ text: "Recupera-se rápido", emoji: "🔋", example: "Ex.: depois de um susto ou frustração, volta ao normal rapidamente." },{ text: "Expressa sem agredir", emoji: "💬", example: "Ex.: diz \"estou bravo\" em vez de bater ou empurrar." },{ text: "Lida com mudanças", emoji: "🔄", example: "Ex.: aceita mudanças de plano, como trocar de passeio, sem se descontrolar." },{ text: "Pede ajuda", emoji: "🙋", example: "Ex.: quando não consegue algo, pede ajuda em vez de desistir ou se irritar." },{ text: "Mantém o humor estável", emoji: "🙂", example: "Ex.: mantém o humor equilibrado, sem oscilar muito entre alegria e choro." }] }] },
  "j26-225": { icon: Sparkles, gradient: "from-emerald-500 to-green-600", instruction: DEV_INSTRUCTION,
    infoBox: "Feedback do professor sobre a evolução comportamental em sala no TDAH (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Comportamento em sala — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Evolução em sala", color: "text-emerald-600 dark:text-emerald-400", items: [{ text: "Está mais focada em sala", emoji: "🔍", example: "Ex.: depois do tratamento, presta mais atenção na aula do que antes." },{ text: "Está menos agitada", emoji: "🍃", example: "Ex.: está mais calma, movimenta-se menos e fica mais tempo sentada." },{ text: "Espera a vez", emoji: "⏳", example: "Ex.: espera sua vez de falar ou de jogar sem interromper os colegas." },{ text: "Termina as atividades", emoji: "🏁", example: "Ex.: conclui as atividades da aula em vez de deixar pela metade." },{ text: "Relaciona-se melhor", emoji: "🤝", example: "Ex.: convive melhor com colegas e professores, com menos conflitos." },{ text: "Segue as regras", emoji: "📏", example: "Ex.: respeita as regras da sala, como levantar a mão para falar." },{ text: "Participa das aulas", emoji: "🙋", example: "Ex.: participa mais das aulas, respondendo e se envolvendo nas tarefas." },{ text: "Houve melhora geral em sala", emoji: "🌟", example: "Ex.: no geral, o professor percebe que ela melhorou em sala de aula." }] }] },
  "j26-226": { icon: Heart, gradient: "from-teal-500 to-cyan-600", instruction:
      "Marque como está a criança HOJE em relação ao início do tratamento. Responda todos os itens.",
    infoBox: "Impressão global de melhora no TDAH (versão clínica e de pais) — maior = mais melhora. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Impressão de melhora TDAH (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Melhora percebida", color: "text-teal-600 dark:text-teal-400", items: [{ text: "Melhorou a atenção", emoji: "🔍", example: "Ex.: consegue se concentrar por mais tempo do que antes do tratamento." },{ text: "Melhorou a agitação", emoji: "🍃", example: "Ex.: ficou mais tranquila, movimentando-se menos e com menos inquietação." },{ text: "Melhorou a impulsividade", emoji: "🛑", example: "Ex.: age com mais calma, pensando antes de fazer as coisas." },{ text: "Melhorou na escola", emoji: "🏫", example: "Ex.: melhorou o desempenho e o comportamento na escola." },{ text: "Melhorou em casa", emoji: "🏠", example: "Ex.: em casa, colabora mais e tem menos conflitos com a família." },{ text: "Melhorou a autoestima", emoji: "💪", example: "Ex.: sente-se mais confiante e fala melhor de si mesma." },{ text: "Melhorou as relações", emoji: "❤️", example: "Ex.: melhorou a convivência com família e amigos." },{ text: "Houve melhora geral", emoji: "🌟", example: "Ex.: de modo geral, a família percebe uma melhora em vários pontos." }] }] },
  "j26-233": { icon: MessageCircle, gradient: "from-blue-500 to-indigo-600", instruction: DEV_INSTRUCTION,
    infoBox: "Acompanhamento trimestral do vocabulário expressivo pós-fonoterapia (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Vocabulário expressivo — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Vocabulário expressivo", color: "text-blue-600 dark:text-blue-400", items: [{ text: "Usa mais palavras do que antes", emoji: "🗣️", example: "Ex.: hoje usa mais palavras diferentes do que usava há alguns meses." },{ text: "Nomeia objetos", emoji: "🏷️", example: "Ex.: dá o nome de objetos do dia a dia, como \"bola\", \"sapato\" e \"leite\"." },{ text: "Combina palavras em frases", emoji: "🔤", example: "Ex.: junta palavras para formar frases, como \"quero água\"." },{ text: "Usa palavras novas que aprende", emoji: "✨", example: "Ex.: começa a usar palavras novas que ouviu, incorporando ao vocabulário." },{ text: "Tem vocabulário compatível com a idade", emoji: "📚", example: "Ex.: conhece e usa a quantidade de palavras esperada para a idade dela." },{ text: "Expressa-se com mais clareza", emoji: "💬", example: "Ex.: consegue se expressar de forma mais clara, sendo bem entendida." },{ text: "Fala em vez de só apontar", emoji: "🗨️", example: "Ex.: pede as coisas falando, em vez de apenas apontar ou puxar." },{ text: "Evoluiu desde a última avaliação", emoji: "📈", example: "Ex.: fala melhor agora do que na última avaliação feita." }] }] },
  "j26-234": { icon: MessageCircle, gradient: "from-sky-500 to-blue-600", instruction: DEV_INSTRUCTION,
    infoBox: "Monitorização da inteligibilidade de fala pós-fonoterapia (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Inteligibilidade de fala — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Inteligibilidade", color: "text-sky-600 dark:text-sky-400", items: [{ text: "É entendida por pessoas de fora da família", emoji: "👥", example: "Ex.: pessoas de fora da família, como a professora, entendem o que ela fala." },{ text: "Pronuncia os sons corretamente", emoji: "🔊", example: "Ex.: pronuncia os sons das palavras de forma correta e clara." },{ text: "Reduziu as trocas de sons", emoji: "🔁", example: "Ex.: troca menos os sons, dizendo \"casa\" em vez de \"tasa\"." },{ text: "Fala claro em frases", emoji: "💬", example: "Ex.: fala frases inteiras de modo que dá para entender bem." },{ text: "Melhorou a articulação", emoji: "🎙️", example: "Ex.: articula melhor as palavras, com fala mais nítida do que antes." },{ text: "É entendida pela família", emoji: "🏠", example: "Ex.: os pais e irmãos entendem o que ela fala no dia a dia." },{ text: "Reduziu as omissões de sons", emoji: "🔤", example: "Ex.: deixou de \"comer\" sons, dizendo \"bola\" em vez de \"boa\"." },{ text: "Evoluiu desde a última avaliação", emoji: "📈", example: "Ex.: a fala está mais clara agora do que na avaliação anterior." }] }] },
  "j26-235": { icon: MessageCircle, gradient: "from-teal-500 to-cyan-600", instruction: DEV_INSTRUCTION,
    infoBox: "Acompanhamento da linguagem pragmática — uso social da linguagem (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Linguagem pragmática — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Uso social da linguagem", color: "text-teal-600 dark:text-teal-400", items: [{ text: "Inicia conversa", emoji: "💬", example: "Ex.: começa uma conversa, como \"sabe o que aconteceu na escola?\"." },{ text: "Mantém o tema", emoji: "🎯", example: "Ex.: mantém-se no mesmo assunto sem mudar de tema o tempo todo." },{ text: "Respeita os turnos", emoji: "🔄", example: "Ex.: fala e escuta na sua vez, sem falar por cima do outro." },{ text: "Faz perguntas", emoji: "❓", example: "Ex.: faz perguntas durante a conversa, como \"e depois?\"." },{ text: "Repara a comunicação", emoji: "🔧", example: "Ex.: quando não é entendida, repete ou explica de outro jeito." },{ text: "Usa gestos sociais", emoji: "👋", example: "Ex.: usa gestos junto com a fala, como acenar, apontar ou balançar a cabeça." },{ text: "Entende sentido figurado simples", emoji: "🎈", example: "Ex.: entende expressões simples, como \"está chovendo canivete\" é chover muito." },{ text: "O uso social melhorou", emoji: "🗣️", example: "Ex.: usa a linguagem em situações sociais melhor do que antes." }] }] },

  // ============================================================
  // LOTE 19B — Evolução/Monitorização J26-236 a 260 (autoral)
  // ============================================================

  "j26-237": { icon: MessageCircle, gradient: "from-blue-500 to-indigo-600", instruction: DEV_INSTRUCTION,
    infoBox: "Registro longitudinal dos marcos de comunicação atingidos (maior = mais marcos). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Marcos de comunicação (maior = mais)", bands: DEV_BANDS,
    domains: [{ name: "Marcos atingidos", color: "text-blue-600 dark:text-blue-400", items: [{ text: "Balbucia", emoji: "👶", example: "Ex.: repete sons como \"dadada\" e \"bababa\" brincando com a voz." },{ text: "Fala as primeiras palavras", emoji: "🗣️", example: "Ex.: já diz as primeiras palavras, como \"mamã\", \"papá\" ou \"au-au\"." },{ text: "Aponta para pedir/mostrar", emoji: "☝️", example: "Ex.: aponta para pedir o biscoito ou para mostrar o passarinho." },{ text: "Combina palavras", emoji: "🔤", example: "Ex.: junta duas palavras, como \"quer bola\" ou \"cadê mamãe\"." },{ text: "Fala frases", emoji: "💬", example: "Ex.: fala frases, como \"o cachorro correu no quintal\"." },{ text: "Segue ordens simples", emoji: "👂", example: "Ex.: entende e cumpre pedidos simples, como \"me dá a bola\"." },{ text: "Conta acontecimentos", emoji: "📖", example: "Ex.: relata algo que aconteceu, como o que fez no aniversário." },{ text: "Atingiu os marcos esperados para a idade", emoji: "✅", example: "Ex.: alcançou os marcos de fala esperados para a idade dela." }] }] },
  "j26-238": { icon: Activity, gradient: "from-teal-500 to-emerald-600", instruction: DEV_INSTRUCTION,
    infoBox: "Reclassificação anual da função motora grossa na PC, complementando o GMFCS (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Função motora (GMFCS) — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Função motora grossa", color: "text-teal-600 dark:text-teal-400", items: [{ text: "Controla a cabeça e o tronco", emoji: "🍼", example: "Ex.: mantém a cabeça firme e o tronco estável quando está no colo ou sentada." },{ text: "Senta-se com estabilidade", emoji: "🪑", example: "Ex.: fica sentada sozinha, sem cair, brincando com as mãos livres." },{ text: "Faz transferências", emoji: "🤲", example: "Ex.: passa o brinquedo de uma mão para a outra com facilidade." },{ text: "Desloca-se pelo ambiente", emoji: "🚶", example: "Ex.: Anda de um cômodo a outro da casa por conta própria." },{ text: "Caminha em casa (conforme o nível)", emoji: "🏠", example: "Ex.: Vai do quarto à cozinha andando, com o apoio que precisa." },{ text: "Caminha na comunidade (conforme o nível)", emoji: "🌳", example: "Ex.: Anda na calçada ou no mercado junto com a família." },{ text: "Sobe e desce degraus", emoji: "🪜", example: "Ex.: Sobe e desce a escada de casa, alternando os pés." },{ text: "Tem a mobilidade necessária para a rotina", emoji: "🔄", example: "Ex.: Consegue se mover o suficiente para comer, brincar e ir ao banheiro." }] }] },
  "j26-239": { icon: Activity, gradient: "from-cyan-500 to-blue-600", instruction: DEV_INSTRUCTION,
    infoBox: "Monitorização da amplitude de movimento pós-fisioterapia na PC (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Amplitude de movimento — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "ADM e contraturas", color: "text-cyan-600 dark:text-cyan-400", items: [{ text: "Boa amplitude de quadril", emoji: "🦵", example: "Ex.: (observar) ao trocar a fralda, as pernas abrem sem resistência ou dor." },{ text: "Boa amplitude de joelho", emoji: "🦵", example: "Ex.: (observar) estica e dobra o joelho totalmente ao sentar e levantar." },{ text: "Boa amplitude de tornozelo", emoji: "🦶", example: "Ex.: (observar) apoia o pé todo no chão ao ficar em pé." },{ text: "Boa amplitude de ombro", emoji: "💪", example: "Ex.: (observar) levanta os dois braços acima da cabeça para vestir a camiseta." },{ text: "Boa amplitude de cotovelo e punho", emoji: "🤲", example: "Ex.: (observar) dobra o braço e vira a mão para levar comida à boca." },{ text: "Tem menos contraturas", emoji: "🔓", example: "Ex.: (observar) articulações menos 'presas' ou encurtadas do que antes." },{ text: "Mantém o alongamento", emoji: "🧘", example: "Ex.: Consegue esticar músculos e articulações sem voltar a encurtar." },{ text: "Melhorou desde a última avaliação", emoji: "📈", example: "Ex.: (observar) ganhos de movimento em relação à consulta anterior." }] }] },
  "j26-240": { icon: Hand, gradient: "from-blue-500 to-indigo-600", instruction: DEV_INSTRUCTION,
    infoBox: "Evolução anual da função manual na PC, complementando o MACS (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Função manual (MACS) — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Função manual", color: "text-blue-600 dark:text-blue-400", items: [{ text: "Pega objetos", emoji: "✋", example: "Ex.: Estende a mão e segura um brinquedo oferecido." },{ text: "Manipula objetos pequenos", emoji: "🤏", example: "Ex.: Pega uma continha ou migalha usando os dedos em pinça." },{ text: "Usa as duas mãos juntas", emoji: "🙌", example: "Ex.: Segura o pote com uma mão e abre a tampa com a outra." },{ text: "Usa utensílios", emoji: "🍴", example: "Ex.: Come sozinho usando colher ou garfo." },{ text: "Manuseia objetos do dia a dia", emoji: "🪥", example: "Ex.: Segura a escova de dente, o copo ou o lápis no dia a dia." },{ text: "Tem destreza manual", emoji: "🧩", example: "Ex.: Abotoa a roupa ou monta peças de encaixe com agilidade." },{ text: "Usa adaptações de forma efetiva", emoji: "🔧", example: "Ex.: Usa o talher adaptado ou o engrossador de lápis e realiza a tarefa." },{ text: "Tem função manual para a rotina", emoji: "🖐️", example: "Ex.: As mãos dão conta de comer, se vestir e brincar na rotina." }] }] },
  "j26-242": { icon: Activity, gradient: "from-emerald-500 to-teal-600", instruction: DEV_INSTRUCTION,
    infoBox: "Acompanhamento de postura e marcha na PC (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Postura e marcha — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Postura e marcha", color: "text-emerald-600 dark:text-emerald-400", items: [{ text: "Mantém a postura sentada", emoji: "🪑", example: "Ex.: Fica sentado sem cair para os lados durante a refeição." },{ text: "Mantém a postura em pé", emoji: "🧍", example: "Ex.: Permanece de pé, firme, enquanto escova os dentes." },{ text: "Tem equilíbrio", emoji: "⚖️", example: "Ex.: Não cai ao ficar num pé só ou ao desviar de um obstáculo." },{ text: "Caminha (conforme o nível)", emoji: "🚶", example: "Ex.: Anda sozinho ou com o apoio adequado ao seu nível." },{ text: "Tem simetria corporal", emoji: "↔️", example: "Ex.: (observar) os dois lados do corpo se movem parecido, sem pender para um lado." },{ text: "Faz transferências", emoji: "🔀", example: "Ex.: Passa da cama para a cadeira de rodas com pouca ou nenhuma ajuda." },{ text: "Usa órteses de forma efetiva", emoji: "🦿", example: "Ex.: Usa a órtese no pé e consegue andar melhor com ela." },{ text: "Tem mobilidade funcional", emoji: "🛴", example: "Ex.: Consegue se deslocar o necessário para participar das atividades." }] }] },
  "j26-243": { icon: Activity, gradient: "from-violet-500 to-purple-600", instruction:
      "Marque como está a criança após a aplicação, comparado a antes. Responda todos os itens.",
    infoBox: "Registro antes e depois da toxina botulínica na PC (maior = mais melhora). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Resposta à toxina botulínica (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Melhora após a aplicação", color: "text-violet-600 dark:text-violet-400", items: [{ text: "Reduziu o tônus", emoji: "📉", example: "Ex.: (observar) menos rigidez ou espasticidade muscular do que antes." },{ text: "Melhorou a amplitude de movimento", emoji: "📈", example: "Ex.: (observar) articulações se movem mais livremente que na avaliação anterior." },{ text: "Melhorou a postura", emoji: "🧍", example: "Ex.: (observar) corpo mais alinhado ao sentar ou ficar em pé." },{ text: "Melhorou a marcha", emoji: "👣", example: "Ex.: (observar) caminhada mais firme e simétrica que antes." },{ text: "Reduziu a dor", emoji: "😌", example: "Ex.: Reclama menos de dor durante os movimentos e os cuidados." },{ text: "Melhorou a função manual", emoji: "✋", example: "Ex.: (observar) mãos mais hábeis nas tarefas do dia a dia." },{ text: "Facilitou os cuidados", emoji: "🧼", example: "Ex.: Ficou mais fácil dar banho, vestir e posicionar a criança." },{ text: "Houve melhora geral após a aplicação", emoji: "💉", example: "Ex.: (observar) ganhos gerais após a aplicação (ex.: toxina botulínica)." }] }] },
  "j26-244": { icon: Eye, gradient: "from-emerald-500 to-green-600", instruction: DEV_INSTRUCTION,
    infoBox: "Acompanhamento trimestral de fluência e compreensão de leitura pós-intervenção (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Leitura — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Leitura", color: "text-emerald-600 dark:text-emerald-400", items: [{ text: "Lê com mais fluência", emoji: "📖", example: "Ex.: Lê o texto de forma corrida, sem soletrar cada palavra." },{ text: "Lê com precisão", emoji: "🎯", example: "Ex.: Lê as palavras certas, sem trocar letras." },{ text: "Tem velocidade adequada", emoji: "⏱️", example: "Ex.: Lê no ritmo esperado para a idade e a série." },{ text: "Entende o que lê", emoji: "💡", example: "Ex.: Consegue recontar a história depois de ler." },{ text: "Respeita a pontuação", emoji: "❔", example: "Ex.: Faz pausas nas vírgulas e nos pontos ao ler em voz alta." },{ text: "Reduziu trocas e omissões", emoji: "✏️", example: "Ex.: (observar) menos letras trocadas ou 'puladas' durante a leitura." },{ text: "Lê textos da série", emoji: "📚", example: "Ex.: Lê os textos do livro do ano escolar em que está." },{ text: "Evoluiu desde a última avaliação", emoji: "📈", example: "Ex.: (observar) leitura melhor que na avaliação anterior." }] }] },
  "j26-245": { icon: Hand, gradient: "from-teal-500 to-cyan-600", instruction: DEV_INSTRUCTION,
    infoBox: "Comparação de amostras de produção escrita ao longo do tempo (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Escrita — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Produção escrita", color: "text-teal-600 dark:text-teal-400", items: [{ text: "Letra mais legível", emoji: "✍️", example: "Ex.: A letra ficou mais clara e fácil de ler." },{ text: "Menos erros ortográficos", emoji: "📝", example: "Ex.: (observar) menos erros de escrita nas palavras." },{ text: "Melhor organização do texto", emoji: "📄", example: "Ex.: O texto tem começo, meio e fim bem organizados." },{ text: "Respeita linhas e margens", emoji: "📐", example: "Ex.: Escreve dentro das linhas e não ultrapassa a margem." },{ text: "Escreve mais rápido", emoji: "⚡", example: "Ex.: Termina de copiar do quadro no tempo da turma." },{ text: "Compõe frases melhores", emoji: "💬", example: "Ex.: Escreve frases completas e com sentido." },{ text: "Menos rasuras", emoji: "🧽", example: "Ex.: (observar) menos apagões e riscos no caderno." },{ text: "Evoluiu desde a última amostra", emoji: "📈", example: "Ex.: (observar) escrita melhor que na amostra anterior." }] }] },
  "j26-246": { icon: Sparkles, gradient: "from-cyan-500 to-blue-600", instruction: DEV_INSTRUCTION,
    infoBox: "Acompanhamento trimestral de matemática pós-intervenção psicopedagógica (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Matemática — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Matemática", color: "text-cyan-600 dark:text-cyan-400", items: [{ text: "Conta e compara quantidades", emoji: "🔢", example: "Ex.: Conta objetos e diz onde há 'mais' ou 'menos'." },{ text: "Faz operações básicas", emoji: "➕", example: "Ex.: Resolve continhas de somar e subtrair." },{ text: "Resolve problemas", emoji: "🧮", example: "Ex.: Entende e resolve um probleminha de matemática do dia a dia." },{ text: "Memoriza fatos numéricos", emoji: "🧠", example: "Ex.: Sabe de cor que 2+2=4 sem contar nos dedos." },{ text: "Entende conceitos", emoji: "💡", example: "Ex.: Compreende ideias como dobro, metade ou dezena." },{ text: "Acompanha a série", emoji: "📚", example: "Ex.: Consegue fazer as atividades de matemática do seu ano escolar." },{ text: "Tem menos ansiedade com matemática", emoji: "😌", example: "Ex.: (observar) fica menos nervoso ou travado nas tarefas de matemática." },{ text: "Evoluiu desde a última avaliação", emoji: "📈", example: "Ex.: (observar) desempenho em matemática melhor que na avaliação anterior." }] }] },
  "j26-247": { icon: Sparkles, gradient: "from-blue-500 to-indigo-600", instruction: DEV_INSTRUCTION,
    infoBox: "Feedback escolar sobre a adaptação curricular e a adesão da escola (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Adaptação curricular — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Adaptação e adesão da escola", color: "text-blue-600 dark:text-blue-400", items: [{ text: "A escola adapta as atividades", emoji: "🏫", example: "Ex.: A professora prepara tarefas ajustadas às necessidades da criança." },{ text: "A escola adapta as avaliações", emoji: "📋", example: "Ex.: As provas têm mais tempo ou formato ajustado." },{ text: "O professor segue o plano", emoji: "👩‍🏫", example: "Ex.: (observar) o plano de adaptação combinado é cumprido em sala." },{ text: "A criança acompanha com as adaptações", emoji: "✅", example: "Ex.: Com os ajustes, consegue acompanhar a turma." },{ text: "Há material adaptado", emoji: "📎", example: "Ex.: Há material com letra ampliada, figuras ou apoio visual." },{ text: "Há apoio do AEE", emoji: "🤝", example: "Ex.: Frequenta a sala de recursos (atendimento educacional especializado)." },{ text: "Há comunicação escola-família", emoji: "📞", example: "Ex.: Escola e família trocam informações sobre o progresso." },{ text: "As adaptações são efetivas no geral", emoji: "👍", example: "Ex.: (observar) no conjunto, os ajustes ajudam a criança a aprender." }] }] },
  "j26-248": { icon: ClipboardList, gradient: "from-emerald-500 to-teal-600", instruction: DEV_INSTRUCTION,
    infoBox: "Registro trimestral da evolução das metas do Plano Educacional Individualizado (maior = mais progresso). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Metas do PEI — evolução (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Metas do PEI", color: "text-emerald-600 dark:text-emerald-400", items: [{ text: "Metas claras definidas", emoji: "🎯", example: "Ex.: O plano tem objetivos bem definidos e escritos." },{ text: "Metas acadêmicas alcançadas", emoji: "🎓", example: "Ex.: Atingiu os objetivos de leitura e matemática combinados." },{ text: "Metas sociais alcançadas", emoji: "🤝", example: "Ex.: Consegue interagir e fazer amigos como previsto no plano." },{ text: "Metas de autonomia alcançadas", emoji: "🧑", example: "Ex.: Já faz sozinho tarefas como se vestir ou organizar o material." },{ text: "A equipe acompanha as metas", emoji: "👥", example: "Ex.: (observar) os profissionais revisam se os objetivos estão sendo atingidos." },{ text: "A família participa", emoji: "👨‍👩‍👧", example: "Ex.: Os pais acompanham e ajudam nas metas em casa." },{ text: "O PEI é revisado periodicamente", emoji: "🔁", example: "Ex.: O plano educacional é atualizado de tempos em tempos." },{ text: "Há progresso geral nas metas", emoji: "📈", example: "Ex.: (observar) avanço no conjunto dos objetivos do plano." }] }] },
  "j26-260": { icon: ClipboardList, gradient: "from-emerald-500 to-teal-600", instruction: DEV_INSTRUCTION,
    infoBox: "Checklist de monitorização laboratorial periódica por medicação (maior = monitorização mais completa e em dia). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Monitorização laboratorial (maior = mais em dia)", bands: DEV_BANDS,
    domains: [{ name: "Exames de rotina em dia", color: "text-emerald-600 dark:text-emerald-400", items: [{ text: "Hemograma em dia", emoji: "🩸", example: "Ex.: O exame de sangue de rotina (hemograma) está atualizado." },{ text: "Função hepática em dia", emoji: "🫁", example: "Ex.: Os exames que avaliam o fígado estão em dia." },{ text: "Função renal em dia", emoji: "💧", example: "Ex.: Os exames que avaliam os rins estão atualizados." },{ text: "Nível sérico da medicação em dia", emoji: "💊", example: "Ex.: A dosagem do remédio no sangue foi medida recentemente." },{ text: "Perfil metabólico (glicemia/lipídios) em dia", emoji: "🧪", example: "Ex.: Exames de açúcar e colesterol no sangue estão atualizados." },{ text: "Eletrólitos em dia", emoji: "⚗️", example: "Ex.: Exames de sódio e potássio no sangue estão em dia." },{ text: "Exames específicos da medicação em dia", emoji: "📋", example: "Ex.: Os exames exigidos por aquele remédio específico foram feitos." },{ text: "Monitorização em dia no geral", emoji: "✅", example: "Ex.: (observar) no conjunto, os exames de acompanhamento estão atualizados." }] }] },

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
      { text: "Sentado(a) e lendo", emoji: "📖", example: "Ex.: Cochilar enquanto lê um livro sentado." },
      { text: "Assistindo à televisão", emoji: "📺", example: "Ex.: Pegar no sono assistindo à televisão." },
      { text: "Sentado(a), quieto(a), em um lugar público (sala de aula, cinema, reunião)", emoji: "🎬", example: "Ex.: Cochilar na sala de aula, no cinema ou numa reunião." },
      { text: "Como passageiro(a) em um carro por uma hora, sem parar", emoji: "🚗", example: "Ex.: Dormir no carro numa viagem de uma hora, sem parar." },
      { text: "Deitado(a) para descansar à tarde, quando possível", emoji: "🛋️", example: "Ex.: Cochilar ao deitar para descansar à tarde." },
      { text: "Sentado(a) conversando com alguém", emoji: "💬", example: "Ex.: Cair no sono enquanto conversa com alguém." },
      { text: "Sentado(a) quieto(a) após o almoço, sem ter bebido álcool", emoji: "🍽️", example: "Ex.: Dar aquela cochilada depois do almoço, sem ter bebido álcool." },
      { text: "No carro, parado(a) por alguns minutos no trânsito", emoji: "🚦", example: "Ex.: Cochilar com o carro parado alguns minutos no trânsito." },
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
      { text: "Eu me senti muito triste ou infeliz", emoji: "😢", example: "Ex.: Passar o dia de baixo astral, com vontade de chorar." },
      { text: "Eu não consegui aproveitar nada (não senti prazer nas coisas)", emoji: "😞", example: "Ex.: Nem as brincadeiras favoritas deram alegria ou vontade." },
      { text: "Eu me senti tão cansado(a) que fiquei só sentado(a) sem fazer nada", emoji: "😴", example: "Ex.: Sentir o corpo pesado e ficar parado, sem energia para nada." },
      { text: "Eu fiquei muito inquieto(a)", emoji: "😣", example: "Ex.: Não conseguir ficar parado, agitado o tempo todo." },
      { text: "Eu senti que não valia nada", emoji: "😔", example: "Ex.: Achar que não sirvo para nada e não sou importante." },
      { text: "Eu chorei muito", emoji: "😭", example: "Ex.: Chorar com facilidade, várias vezes ao dia." },
      { text: "Eu tive dificuldade de pensar ou de me concentrar", emoji: "🤯", example: "Ex.: Não conseguir prestar atenção na tarefa da escola." },
      { text: "Eu não gostei de mim mesmo(a)", emoji: "🪞", example: "Ex.: Não gostar do próprio jeito de ser." },
      { text: "Eu achei que eu era uma pessoa ruim", emoji: "😟", example: "Ex.: Sentir-se uma pessoa ruim, mesmo sem motivo." },
      { text: "Eu me senti sozinho(a)", emoji: "🧍", example: "Ex.: Sentir-se sozinho, mesmo perto de outras pessoas." },
      { text: "Eu pensei que ninguém me amava de verdade", emoji: "💔", example: "Ex.: Achar que ninguém gosta de mim de verdade." },
      { text: "Eu achei que eu nunca seria tão bom(boa) quanto outras pessoas", emoji: "📉", example: "Ex.: Achar que nunca vou ser tão bom quanto os colegas." },
      { text: "Eu senti que fazia tudo errado", emoji: "❌", example: "Ex.: Sentir que erro em tudo o que tento fazer." },
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
      { text: "Nas últimas semanas, você desejou estar morto(a)?", emoji: "🆘", example: "Ex.: Ter tido vontade de não estar mais vivo." },
      { text: "Nas últimas semanas, você sentiu que você ou sua família estariam melhor se você estivesse morto(a)?", emoji: "🆘", example: "Ex.: Pensar que você ou sua família ficariam melhor sem você." },
      { text: "Na última semana, você teve pensamentos sobre se matar?", emoji: "🆘", example: "Ex.: Ter tido pensamentos de acabar com a própria vida." },
      { text: "Você já tentou se matar alguma vez?", emoji: "🆘", example: "Ex.: Já ter feito alguma tentativa contra a própria vida." },
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
        { text: "Penso no evento mesmo sem querer", emoji: "💭", example: "Ex.: A lembrança do que aconteceu volta sozinha à cabeça." }, { text: "Tenho imagens ou sonhos sobre o que aconteceu", emoji: "🌙", example: "Ex.: Ter imagens ou sonhos sobre o que aconteceu." }, { text: "Sinto como se estivesse acontecendo de novo", emoji: "⏪", example: "Ex.: Sentir como se o evento estivesse acontecendo outra vez." }, { text: "Fico aflito(a) quando algo me lembra do evento", emoji: "😰", example: "Ex.: Ficar nervoso ao ver algo que lembra o ocorrido." } ] },
      { name: "Evitação", color: "text-amber-600 dark:text-amber-400", items: [
        { text: "Tento não pensar no que aconteceu", emoji: "🙅", example: "Ex.: Fazer força para não pensar no que aconteceu." }, { text: "Evito lugares ou coisas que me lembram do evento", emoji: "🚫", example: "Ex.: Desviar de lugares ou coisas que trazem a lembrança do evento." }, { text: "Tento apagar o evento da memória", emoji: "🧽", example: "Ex.: Tentar apagar de vez o ocorrido da memória." }, { text: "Evito falar sobre o assunto", emoji: "🤐", example: "Ex.: Não querer conversar sobre o assunto." } ] },
      { name: "Excitação (arousal)", color: "text-orange-600 dark:text-orange-400", items: [
        { text: "Fico mais irritado(a) ou com raiva", emoji: "😠", example: "Ex.: Perder a paciência e ficar bravo com facilidade." }, { text: "Tenho dificuldade de me concentrar", emoji: "😵", example: "Ex.: Não conseguir focar nas tarefas por causa disso." }, { text: "Durmo pior por causa disso", emoji: "🛏️", example: "Ex.: Ter dificuldade para dormir por causa do ocorrido." }, { text: "Fico em alerta, como se algo ruim fosse acontecer", emoji: "👀", example: "Ex.: Ficar tenso, como se algo ruim fosse acontecer a qualquer momento." }, { text: "Assusto-me com facilidade", emoji: "😨", example: "Ex.: Levar um susto grande com barulhos ou movimentos." } ] },
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
      { name: "Lavar/limpar", color: "text-cyan-600 dark:text-cyan-400", items: [{ text: "Lavo as mãos mais vezes ou mais tempo que o necessário", emoji: "🧼", example: "Ex.: Lavar as mãos muitas vezes ao dia, além do necessário." }, { text: "Preocupo-me muito com sujeira ou germes", emoji: "🦠", example: "Ex.: Ter medo exagerado de sujeira e germes." }, { text: "Tomo banho ou me limpo de forma exagerada", emoji: "🚿", example: "Ex.: Demorar demais no banho tentando ficar bem limpo." }] },
      { name: "Verificar", color: "text-blue-600 dark:text-blue-400", items: [{ text: "Verifico portas, fogão ou luzes várias vezes", emoji: "🚪", example: "Ex.: Voltar várias vezes para conferir se trancou a porta ou desligou o fogão." }, { text: "Preciso conferir as coisas repetidamente", emoji: "🔁", example: "Ex.: Checar a mesma coisa muitas vezes seguidas." }, { text: "Tenho medo de que algo ruim aconteça por minha culpa", emoji: "😧", example: "Ex.: Temer que algo ruim aconteça por sua culpa." }, { text: "Peço para outras pessoas confirmarem que está tudo bem", emoji: "🗣️", example: "Ex.: Perguntar sempre aos outros se está tudo certo." }] },
      { name: "Ordenar", color: "text-indigo-600 dark:text-indigo-400", items: [{ text: "Preciso que as coisas fiquem em ordem exata", emoji: "📏", example: "Ex.: Precisar que os objetos fiquem numa ordem exata." }, { text: "Fico aflito(a) se algo está fora do lugar", emoji: "😖", example: "Ex.: Ficar incomodado se algo está fora do lugar." }, { text: "Arrumo objetos até ficarem 'certos'", emoji: "📐", example: "Ex.: Reorganizar os objetos até parecerem 'certos'." }] },
      { name: "Obsessões", color: "text-violet-600 dark:text-violet-400", items: [{ text: "Tenho pensamentos ruins que voltam sem querer", emoji: "💭", example: "Ex.: Pensamentos ruins que voltam sem eu querer." }, { text: "Tenho pensamentos que me assustam e não consigo parar", emoji: "😱", example: "Ex.: Pensamentos assustadores que eu não consigo controlar." }, { text: "Imagens ou ideias indesejadas surgem na minha cabeça", emoji: "🖼️", example: "Ex.: Imagens ou ideias indesejadas surgem de repente na cabeça." }, { text: "Preciso pensar em algo 'bom' para neutralizar um pensamento ruim", emoji: "🔄", example: "Ex.: Precisar pensar em algo 'bom' para anular um pensamento ruim." }] },
      { name: "Acumular", color: "text-fuchsia-600 dark:text-fuchsia-400", items: [{ text: "Tenho dificuldade de jogar coisas fora", emoji: "🗑️", example: "Ex.: Não conseguir jogar fora coisas velhas ou sem uso." }, { text: "Guardo coisas que não preciso", emoji: "📦", example: "Ex.: Acumular objetos que não são necessários." }, { text: "Fico aflito(a) só de pensar em descartar objetos", emoji: "😥", example: "Ex.: Sentir angústia só de pensar em descartar algo." }] },
      { name: "Neutralizar/repetir", color: "text-purple-600 dark:text-purple-400", items: [{ text: "Repito ações um número certo de vezes", emoji: "🔢", example: "Ex.: Repetir uma ação um número exato de vezes." }, { text: "Conto coisas ou repito palavras mentalmente", emoji: "🔤", example: "Ex.: Contar objetos ou repetir palavras mentalmente." }, { text: "Faço rituais para me sentir 'em paz'", emoji: "🕯️", example: "Ex.: Fazer pequenos rituais para se sentir em paz." }, { text: "Preciso refazer tarefas até parecerem certas", emoji: "♻️", example: "Ex.: Refazer a mesma tarefa até sentir que ficou certa." }] },
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
      { name: "Reexperiência", color: "text-teal-600 dark:text-teal-400", items: [{ text: "Lembranças do evento que vêm sem eu querer", emoji: "💭", example: "Ex.: Lembranças do ocorrido que vêm sem a criança querer." }, { text: "Pesadelos sobre o evento", emoji: "🌙", example: "Ex.: Ter pesadelos com o que aconteceu." }, { text: "Sentir como se o evento acontecesse de novo", emoji: "⏪", example: "Ex.: Sentir como se o evento estivesse acontecendo de novo." }, { text: "Ficar muito aflito(a) ao lembrar", emoji: "😰", example: "Ex.: Ficar muito aflito quando lembra do ocorrido." }, { text: "Reações no corpo ao lembrar (coração acelerado, suor)", emoji: "💓", example: "Ex.: Coração acelerado e suor ao lembrar do evento." }] },
      { name: "Evitação", color: "text-cyan-600 dark:text-cyan-400", items: [{ text: "Evitar pensar ou falar sobre o evento", emoji: "🤐", example: "Ex.: Evitar pensar ou conversar sobre o que aconteceu." }, { text: "Evitar pessoas, lugares ou coisas que lembrem o evento", emoji: "🚫", example: "Ex.: Fugir de pessoas ou lugares que lembram o ocorrido." }] },
      { name: "Cognição e humor", color: "text-amber-600 dark:text-amber-400", items: [{ text: "Dificuldade de lembrar partes do evento", emoji: "🌫️", example: "Ex.: Não conseguir lembrar de partes do que aconteceu." }, { text: "Pensar que o mundo é muito perigoso", emoji: "🌍", example: "Ex.: Passar a achar que o mundo é um lugar muito perigoso." }, { text: "Culpar a si mesmo(a) pelo que aconteceu", emoji: "😔", example: "Ex.: Achar que o que houve foi culpa sua, mesmo sem ter tido controle sobre a situação." }, { text: "Sentir-se triste, com medo ou com raiva quase sempre", emoji: "😢", example: "Ex.: Passar a maior parte dos dias triste, assustado(a) ou com raiva sem motivo claro." }, { text: "Perder o interesse por coisas de que gostava", emoji: "🎈", example: "Ex.: Deixar de brincar ou de fazer o que antes te animava, achando tudo sem graça." }, { text: "Sentir-se distante das pessoas", emoji: "🚶", example: "Ex.: Sentir-se separado(a) dos amigos e da família, como se houvesse uma parede entre vocês." }, { text: "Dificuldade de sentir emoções boas", emoji: "💔", example: "Ex.: Não conseguir sentir alegria nem carinho, mesmo em momentos que deveriam ser bons." }] },
      { name: "Alerta", color: "text-orange-600 dark:text-orange-400", items: [{ text: "Ficar irritado(a) ou ter explosões de raiva", emoji: "😠", example: "Ex.: Explodir de raiva por coisas pequenas, como gritar por causa de um brinquedo fora do lugar." }, { text: "Fazer coisas arriscadas ou se machucar", emoji: "⚠️", example: "Ex.: Fazer coisas perigosas sem pensar, como atravessar a rua correndo ou se machucar de propósito." }, { text: "Ficar muito vigilante, esperando algo ruim", emoji: "👀", example: "Ex.: Ficar o tempo todo em alerta, olhando ao redor esperando que algo ruim aconteça." }, { text: "Assustar-se com facilidade", emoji: "😨", example: "Ex.: Levar um susto enorme com um barulho comum, como uma porta batendo." }, { text: "Dificuldade de concentração", emoji: "🧠", example: "Ex.: Não conseguir prestar atenção na tarefa da escola porque a mente foge o tempo todo." }, { text: "Dificuldade para dormir", emoji: "🛌", example: "Ex.: Demorar horas para pegar no sono ou acordar várias vezes durante a noite." }] },
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
      { name: "Intrusão", color: "text-indigo-600 dark:text-indigo-400", items: [{ text: "Lembranças aflitivas que voltam sem querer", emoji: "💭", example: "Ex.: Cenas do que aconteceu surgirem na cabeça de repente, mesmo sem querer pensar nelas." }, { text: "Pesadelos sobre o evento", emoji: "😴", example: "Ex.: Ter pesadelos frequentes revivendo o acontecimento que causou o sofrimento." }, { text: "Reviver o evento como se acontecesse de novo", emoji: "🔁", example: "Ex.: Sentir como se o evento estivesse acontecendo agora, de novo, bem na sua frente." }, { text: "Aflição intensa ao lembrar", emoji: "😰", example: "Ex.: Ficar muito angustiado(a) e desesperado(a) quando algo faz lembrar do ocorrido." }, { text: "Reações físicas ao lembrar (coração disparado, suor)", emoji: "💓", example: "Ex.: Coração disparar e suar frio ao ver algo que remete ao acontecimento." }] },
      { name: "Evitação", color: "text-cyan-600 dark:text-cyan-400", items: [{ text: "Evitar pensamentos ou sentimentos sobre o evento", emoji: "🙅", example: "Ex.: Tentar não pensar nem sentir nada relacionado ao que aconteceu, empurrando tudo para longe." }, { text: "Evitar lugares, pessoas ou coisas que lembrem o evento", emoji: "🚷", example: "Ex.: Fugir de lugares, pessoas ou objetos que lembrem o evento, como evitar certa rua." }] },
      { name: "Cognição e humor", color: "text-amber-600 dark:text-amber-400", items: [{ text: "Dificuldade de lembrar partes importantes do evento", emoji: "🕳️", example: "Ex.: Não conseguir recordar partes importantes do que aconteceu, como se houvesse um vazio." }, { text: "Crenças negativas sobre si, os outros ou o mundo", emoji: "🌧️", example: "Ex.: Passar a achar que 'não presto', que 'ninguém é confiável' ou que 'o mundo é perigoso'." }, { text: "Culpar a si mesmo(a) ou aos outros pelo ocorrido", emoji: "⚖️", example: "Ex.: Culpar a si mesmo(a) ou a alguém pelo que ocorreu, remoendo de quem foi a responsabilidade." }, { text: "Sentir-se mal (medo, raiva, culpa, vergonha) quase sempre", emoji: "😞", example: "Ex.: Viver quase sempre tomado(a) por medo, raiva, culpa ou vergonha." }, { text: "Perda de interesse em atividades", emoji: "🎨", example: "Ex.: Largar hobbies e atividades preferidas, sem vontade de participar de nada." }, { text: "Sentir-se distante das pessoas", emoji: "🧍", example: "Ex.: Afastar-se dos colegas e parentes, preferindo ficar sozinho(a) e distante." }, { text: "Dificuldade de sentir emoções positivas", emoji: "🚫", example: "Ex.: Não conseguir sentir amor, alegria ou ternura, mesmo perto de quem gosta." }] },
      { name: "Alerta e reatividade", color: "text-orange-600 dark:text-orange-400", items: [{ text: "Irritabilidade ou explosões de raiva", emoji: "💥", example: "Ex.: Perder a paciência com facilidade e ter acessos de raiva por pouca coisa." }, { text: "Comportamento imprudente ou autodestrutivo", emoji: "🎢", example: "Ex.: Agir sem cuidado, como dirigir bicicleta imprudentemente ou se colocar em risco." }, { text: "Estar excessivamente vigilante", emoji: "🔦", example: "Ex.: Ficar tenso(a) e vigiando tudo o tempo todo, sem conseguir relaxar." }, { text: "Sobressaltar-se com facilidade", emoji: "⚡", example: "Ex.: Pular de susto ao menor barulho ou toque inesperado." }, { text: "Dificuldade de concentração", emoji: "🎯", example: "Ex.: Perder o foco no meio de uma leitura ou conversa, sem conseguir se concentrar." }, { text: "Dificuldade para dormir", emoji: "🌙", example: "Ex.: Rolar na cama sem conseguir dormir ou acordar cansado(a) depois de uma noite ruim." }] },
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
      { name: "Contaminação", color: "text-cyan-600 dark:text-cyan-400", items: [{ text: "Tempo gasto com medo de contaminação/limpeza", emoji: "🧼", example: "Ex.: Passar muito tempo do dia com medo de germes e lavando as mãos repetidas vezes." }, { text: "Evitação por medo de germes/sujeira", emoji: "🚯", example: "Ex.: Deixar de tocar em maçanetas ou usar banheiros públicos por medo de sujeira." }, { text: "Sofrimento causado por esses medos", emoji: "😣", example: "Ex.: Sofrer bastante por causa desse medo de contaminação, ficando angustiado(a)." }, { text: "Dificuldade de ignorar pensamentos de contaminação", emoji: "🌀", example: "Ex.: Não conseguir tirar da cabeça a ideia de que está sujo(a) ou contaminado(a)." }, { text: "Interferência na rotina por causa disso", emoji: "⏳", example: "Ex.: Atrasar-se ou faltar a compromissos porque a limpeza toma tempo demais." }] },
      { name: "Responsabilidade por dano/erro", color: "text-blue-600 dark:text-blue-400", items: [{ text: "Tempo gasto verificando para evitar danos", emoji: "🔍", example: "Ex.: Gastar muito tempo checando se trancou a porta ou desligou o fogão para evitar acidentes." }, { text: "Evitação de situações por medo de causar erro", emoji: "🙈", example: "Ex.: Evitar cozinhar ou ficar por último saindo de casa por medo de cometer um erro grave." }, { text: "Sofrimento com a possibilidade de algo dar errado", emoji: "😥", example: "Ex.: Ficar muito angustiado(a) imaginando que algo terrível pode dar errado por sua causa." }, { text: "Dificuldade de parar de verificar", emoji: "🔂", example: "Ex.: Voltar várias vezes para conferir a mesma coisa sem conseguir parar de verificar." }, { text: "Interferência na rotina pelas verificações", emoji: "🕰️", example: "Ex.: Perder tempo importante do dia repetindo verificações antes de sair de casa." }] },
      { name: "Pensamentos inaceitáveis", color: "text-violet-600 dark:text-violet-400", items: [{ text: "Tempo tomado por pensamentos indesejados/intrusivos", emoji: "💭", example: "Ex.: Ter a mente ocupada por longos períodos com pensamentos indesejados que insistem em voltar." }, { text: "Evitação de gatilhos desses pensamentos", emoji: "🚪", example: "Ex.: Fugir de situações ou objetos que costumam disparar esses pensamentos incômodos." }, { text: "Sofrimento causado por esses pensamentos", emoji: "😖", example: "Ex.: Sentir grande sofrimento e desconforto por causa desses pensamentos intrusivos." }, { text: "Dificuldade de afastá-los da mente", emoji: "🧩", example: "Ex.: Tentar afastar o pensamento e ele voltar sempre, como se grudasse na mente." }, { text: "Interferência na rotina por causa deles", emoji: "📉", example: "Ex.: Deixar de fazer tarefas do dia porque esses pensamentos atrapalham a rotina." }] },
      { name: "Simetria/incompletude", color: "text-fuchsia-600 dark:text-fuchsia-400", items: [{ text: "Tempo gasto ordenando até parecer 'certo'", emoji: "📐", example: "Ex.: Reorganizar objetos várias vezes até ficarem exatamente 'certos' ou simétricos." }, { text: "Evitação de deixar coisas fora de ordem", emoji: "🧷", example: "Ex.: Não suportar deixar lápis ou livros tortos, precisando alinhar tudo antes de sair." }, { text: "Sofrimento quando algo está 'incompleto'", emoji: "😫", example: "Ex.: Sentir mal-estar forte quando algo parece 'incompleto' ou fora do lugar." }, { text: "Dificuldade de ignorar a necessidade de simetria", emoji: "⚖️", example: "Ex.: Não conseguir ignorar a vontade de deixar tudo simétrico e igualado." }, { text: "Interferência na rotina por arrumar/repetir", emoji: "🔃", example: "Ex.: Chegar atrasado(a) por ficar arrumando e repetindo até tudo ficar perfeito." }] },
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
      { name: "Abuso", color: "text-rose-600 dark:text-rose-400", items: [{ text: "Abuso emocional recorrente (humilhações, ameaças)", emoji: "🗯️", example: "Ex.: Sofrer humilhações, xingamentos ou ameaças frequentes de um adulto em casa." }, { text: "Abuso físico (agressão que machucou)", emoji: "🩹", example: "Ex.: Ter apanhado ou sido agredido(a) fisicamente a ponto de se machucar." }, { text: "Abuso sexual", emoji: "🚫", example: "Ex.: Ter sofrido qualquer forma de abuso sexual ou toque forçado por alguém." }] },
      { name: "Negligência", color: "text-amber-600 dark:text-amber-400", items: [{ text: "Negligência emocional (não se sentir amado/apoiado)", emoji: "🫥", example: "Ex.: Crescer sem se sentir amado(a) ou apoiado(a), sem colo ou atenção afetiva." }, { text: "Negligência física (faltou comida, cuidado ou proteção)", emoji: "🍽️", example: "Ex.: Faltar comida, roupa limpa, cuidados de saúde ou proteção básica em casa." }] },
      { name: "Disfunção familiar", color: "text-orange-600 dark:text-orange-400", items: [{ text: "Separação ou divórcio dos pais", emoji: "💔", example: "Ex.: Os pais terem se separado ou divorciado durante a infância." }, { text: "Violência contra a mãe/cuidadora", emoji: "🛑", example: "Ex.: Presenciar a mãe ou cuidadora ser agredida ou ameaçada por alguém." }, { text: "Convívio com uso problemático de álcool/drogas", emoji: "🍾", example: "Ex.: Conviver com um familiar que bebia demais ou usava drogas de forma problemática." }, { text: "Convívio com doença mental ou tentativa de suicídio na família", emoji: "🧠", example: "Ex.: Ter em casa alguém com doença mental grave ou que tentou tirar a própria vida." }, { text: "Familiar preso", emoji: "⛓️", example: "Ex.: Ter tido um familiar próximo preso durante a infância." }] },
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
      { name: "Obsessões (pensamentos)", color: "text-blue-600 dark:text-blue-400", items: [{ text: "Tempo ocupado por obsessões", emoji: "⏱️", example: "Ex.: Passar boa parte do dia tomado(a) por pensamentos obsessivos que não param." }, { text: "Interferência das obsessões na rotina", emoji: "🚧", example: "Ex.: As obsessões atrapalharem a escola, o trabalho ou momentos com a família." }, { text: "Sofrimento causado pelas obsessões", emoji: "😩", example: "Ex.: Sentir grande angústia e sofrimento por causa dessas obsessões." }, { text: "Esforço para resistir às obsessões", emoji: "🛡️", example: "Ex.: Fazer esforço para não dar atenção às obsessões, tentando afastá-las da mente." }, { text: "Controle sobre as obsessões", emoji: "🎚️", example: "Ex.: Conseguir (ou não) controlar as obsessões quando elas surgem." }] },
      { name: "Compulsões (rituais)", color: "text-violet-600 dark:text-violet-400", items: [{ text: "Tempo gasto com compulsões", emoji: "⌛", example: "Ex.: Gastar muito tempo repetindo rituais, como lavar, contar ou conferir várias vezes." }, { text: "Interferência das compulsões na rotina", emoji: "🚦", example: "Ex.: As compulsões atrasarem tarefas e prejudicarem a rotina do dia." }, { text: "Aflição se impedido(a) de realizar o ritual", emoji: "😰", example: "Ex.: Ficar muito aflito(a) quando é impedido(a) de completar o ritual." }, { text: "Esforço para resistir às compulsões", emoji: "✊", example: "Ex.: Tentar segurar a vontade de repetir o ritual, resistindo à compulsão." }, { text: "Controle sobre as compulsões", emoji: "🎛️", example: "Ex.: Conseguir (ou não) parar a compulsão quando decide interromper." }] },
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
      { text: "Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)", emoji: "😟", example: "Ex.: Sentir-se nervoso(a) e tenso(a) na maior parte dos dias, sem relaxar." },
      { text: "Não conseguir parar ou controlar as preocupações", emoji: "🌪️", example: "Ex.: Não conseguir frear a preocupação, mesmo tentando pensar em outra coisa." },
      { text: "Preocupar-se demais com diferentes coisas", emoji: "🤯", example: "Ex.: Preocupar-se ao mesmo tempo com escola, saúde, dinheiro e muitas outras coisas." },
      { text: "Dificuldade para relaxar", emoji: "🧘", example: "Ex.: Não conseguir descansar a mente nem o corpo, mesmo em momentos de folga." },
      { text: "Ficar tão agitado(a) que se torna difícil permanecer parado(a)", emoji: "🌀", example: "Ex.: Ficar tão agitado(a) que não consegue permanecer sentado(a) por muito tempo." },
      { text: "Ficar facilmente aborrecido(a) ou irritado(a)", emoji: "😤", example: "Ex.: Perder a paciência e irritar-se com facilidade por pequenas coisas." },
      { text: "Sentir medo, como se algo terrível fosse acontecer", emoji: "😱", example: "Ex.: Sentir um medo repentino, como se algo terrível estivesse prestes a acontecer." },
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
      { text: "Você se faz vomitar porque se sente desconfortavelmente cheio(a)?", emoji: "🤢", example: "Ex.: Provocar vômito depois de comer por se sentir desconfortavelmente cheio(a)." },
      { text: "Você se preocupa por ter perdido o controle sobre o quanto come?", emoji: "🍔", example: "Ex.: Preocupar-se por sentir que não consegue controlar o quanto come, comendo demais." },
      { text: "Você perdeu mais de 6 kg em um período de cerca de 3 meses?", emoji: "⚖️", example: "Ex.: Ter emagrecido mais de 6 kg em cerca de três meses sem estar de dieta." },
      { text: "Você acredita estar gordo(a) mesmo quando os outros dizem que está magro(a)?", emoji: "🪞", example: "Ex.: Achar-se gordo(a) diante do espelho mesmo quando todos dizem que está magro(a)." },
      { text: "Você diria que a comida domina sua vida?", emoji: "🍽️", example: "Ex.: Pensar em comida o tempo todo, a ponto de a alimentação dominar sua vida." },
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
      { text: "Tenho me sentido alegre e de bom humor", emoji: "😊", example: "Ex.: Nas últimas semanas, acordar e passar o dia com um humor leve e alegre." },
      { text: "Tenho me sentido calmo(a) e relaxado(a)", emoji: "😌", example: "Ex.: Sentir-se calmo(a) e tranquilo(a) na maior parte do tempo, sem tensão." },
      { text: "Tenho me sentido ativo(a) e com energia", emoji: "⚡", example: "Ex.: Ter disposição e energia para brincar, estudar e fazer as atividades do dia." },
      { text: "Tenho acordado me sentindo descansado(a) e revigorado(a)", emoji: "🌅", example: "Ex.: Acordar descansado(a), sentindo que a noite de sono renovou as energias." },
      { text: "Meu dia a dia tem sido cheio de coisas que me interessam", emoji: "✨", example: "Ex.: Ter os dias cheios de coisas que despertam curiosidade e interesse." },
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
        { text: "Eu me sinto desconfortável em situações sociais, mesmo quando estou rodeado de pessoas conhecidas.", emoji: "😬", example: "Ex.: Sentir-se pouco à vontade em festas, mesmo cercado(a) de gente conhecida." },
        { text: "Eu evito falar com pessoas que não conheço bem, mesmo que haja uma oportunidade de interação.", emoji: "🙊", example: "Ex.: Deixar de puxar conversa com pessoas novas, mesmo tendo a chance de conversar." },
        { text: "Eu tenho dificuldades para entender se alguém está interessado ou não no que estou dizendo.", emoji: "🤔", example: "Ex.: Não perceber se a pessoa está gostando ou entediada com o que você fala." },
        { text: "Costumo sentir que as pessoas estão me observando de forma crítica em ambientes sociais.", emoji: "👁️", example: "Ex.: Sentir que estão te julgando ou observando com crítica em ambientes sociais." },
        { text: "Muitas vezes, eu me sinto ansioso antes de eventos sociais, mesmo sabendo que são importantes.", emoji: "😧", example: "Ex.: Ficar ansioso(a) antes de uma festa ou reunião, mesmo sabendo que é importante." },
        { text: "Prefiro interagir com um pequeno número de pessoas, em vez de grandes grupos.", emoji: "👥", example: "Ex.: Preferir conversar com poucas pessoas de cada vez a ficar em grupos grandes." },
        { text: "Eu tenho dificuldade em entender as piadas ou sarcasmo de outras pessoas.", emoji: "😅", example: "Ex.: Levar piadas ou ironias ao pé da letra, sem perceber que era brincadeira." },
        { text: "Em grupos, frequentemente me sinto deslocado ou fora de lugar.", emoji: "🧩", example: "Ex.: Sentir-se deslocado(a) e fora de sintonia quando está em um grupo." },
        { text: "Evito fazer novas amizades, mesmo quando as oportunidades aparecem.", emoji: "🚪", example: "Ex.: Evitar fazer amigos novos, mesmo quando surgem boas oportunidades." },
        { text: "Eu tenho dificuldades em expressar meus sentimentos em uma conversa social.", emoji: "🗨️", example: "Ex.: Ter dificuldade de dizer o que sente durante uma conversa com outras pessoas." },
      ] },
      { name: "Comunicação", color: "text-fuchsia-600 dark:text-fuchsia-400", items: [
        { text: "Eu tenho dificuldades para entender as emoções dos outros através de expressões faciais.", emoji: "😐", example: "Ex.: Não perceber pela expressão do rosto se alguém está triste ou bravo." },
        { text: "Quando estou conversando, posso achar difícil manter o fluxo da conversa.", emoji: "💬", example: "Ex.: Não saber o que dizer para manter a conversa fluindo, ficando travado(a)." },
        { text: "Eu frequentemente falo sobre meus próprios interesses sem perceber que os outros não estão tão envolvidos.", emoji: "🗣️", example: "Ex.: Falar bastante do próprio assunto favorito sem notar que os outros perderam o interesse." },
        { text: "Eu tenho dificuldade para saber quando é apropriado fazer uma pausa em uma conversa.", emoji: "⏸️", example: "Ex.: Não saber a hora certa de parar de falar e dar espaço para o outro na conversa." },
        { text: "Eu sou muito direto e, às vezes, sinto que as pessoas acham isso insensível.", emoji: "🎯", example: "Ex.: Ser tão direto(a) ao falar que às vezes as pessoas acham que foi grosseria." },
        { text: "Eu fico incerto sobre como lidar com o silêncio em uma conversa.", emoji: "🤐", example: "Ex.: Ficar sem saber o que fazer quando a conversa fica em silêncio." },
        { text: "Em situações sociais, tenho dificuldades para compreender piadas e humor.", emoji: "🃏", example: "Ex.: Ter dificuldade de entender piadas e humor em situações sociais." },
        { text: "Eu me sinto mais confortável em comunicar-me por mensagens escritas do que pessoalmente.", emoji: "📱", example: "Ex.: Sentir-se mais à vontade trocando mensagens de texto do que conversando pessoalmente." },
        { text: "Frequentemente, não entendo as nuances de um tom de voz e como ele altera a mensagem.", emoji: "🎵", example: "Ex.: Não captar quando o tom de voz muda o sentido da frase, como uma ironia." },
        { text: "Eu tenho dificuldades em fazer elogios ou expressar apreciação em uma conversa.", emoji: "👏", example: "Ex.: Achar difícil elogiar ou demonstrar apreço por alguém numa conversa." },
      ] },
      { name: "Imaginatividade", color: "text-purple-600 dark:text-purple-400", items: [
        { text: "Prefiro atividades práticas e objetivas em vez de jogos criativos ou imaginativos.", emoji: "🔧", example: "Ex.: Preferir montar ou consertar algo objetivo a brincar de faz de conta." },
        { text: "Eu me sinto mais confortável com tarefas estruturadas e com regras claras do que com tarefas abertas e criativas.", emoji: "📋", example: "Ex.: Gostar mais de tarefas com regras claras do que de atividades abertas e criativas." },
        { text: "Eu raramente invento histórias ou crio cenários imaginários.", emoji: "📖", example: "Ex.: Raramente inventar histórias ou criar mundos imaginários por conta própria." },
        { text: "Eu sou mais interessado em fatos concretos do que em ideias abstratas ou filosóficas.", emoji: "🔢", example: "Ex.: Interessar-se mais por fatos concretos do que por ideias abstratas ou filosóficas." },
        { text: "Eu encontro mais prazer em resolver problemas práticos do que em atividades criativas ou artísticas.", emoji: "🧰", example: "Ex.: Divertir-se mais resolvendo um problema prático do que pintando ou criando arte." },
        { text: "Eu tenho uma tendência a ser muito literal e ter dificuldades para entender significados figurados ou metafóricos.", emoji: "📏", example: "Ex.: Entender frases literalmente, tendo dificuldade com metáforas como 'quebrar o galho'." },
        { text: "Eu me sinto mais confortável com uma rotina fixa do que com atividades espontâneas e criativas.", emoji: "🗓️", example: "Ex.: Sentir-se melhor seguindo uma rotina fixa do que em atividades espontâneas." },
        { text: "Eu tenho dificuldade em planejar atividades ou eventos que não sigam uma estrutura pré-determinada.", emoji: "🧭", example: "Ex.: Ter dificuldade de planejar um passeio que não siga um roteiro já definido." },
        { text: "Eu sou mais produtivo quando trabalho com instruções claras e metas específicas, em vez de trabalhar em um projeto criativo.", emoji: "✅", example: "Ex.: Render mais com instruções claras e metas específicas do que num projeto livre." },
        { text: "Eu não gosto de jogos ou atividades que exijam imaginação ou fantasia.", emoji: "🎭", example: "Ex.: Não gostar de brincadeiras que exijam imaginação ou fantasia." },
      ] },
      { name: "Atenção a detalhes", color: "text-blue-600 dark:text-blue-400", items: [
        { text: "Eu sou capaz de perceber detalhes em ambientes ou situações que outras pessoas podem não notar.", emoji: "🔎", example: "Ex.: Notar detalhes num ambiente que a maioria das pessoas passa batido." },
        { text: "Eu fico incomodado com falhas ou imperfeições em coisas que outras pessoas podem ignorar.", emoji: "🪛", example: "Ex.: Incomodar-se com pequenas falhas ou imperfeições que os outros nem reparam." },
        { text: "Eu consigo organizar objetos ou informações de uma maneira extremamente detalhada.", emoji: "🗂️", example: "Ex.: Organizar brinquedos ou informações de um jeito extremamente detalhado." },
        { text: "Eu noto padrões e repetições em situações que outras pessoas não percebem.", emoji: "🔁", example: "Ex.: Perceber padrões e repetições em situações que passam despercebidas para os outros." },
        { text: "Eu prefiro atividades que envolvem atenção aos detalhes, como quebra-cabeças ou tarefas de precisão.", emoji: "🧩", example: "Ex.: Preferir quebra-cabeças e tarefas de precisão que exigem atenção aos detalhes." },
        { text: "Eu tenho facilidade para memorizar pequenos detalhes de eventos passados.", emoji: "🧠", example: "Ex.: Lembrar-se de pequenos detalhes de eventos passados com facilidade." },
        { text: "Eu sou meticuloso na revisão de informações ou documentos para detectar erros.", emoji: "📝", example: "Ex.: Revisar textos ou documentos com cuidado, achando erros que outros deixaram passar." },
        { text: "Eu fico irritado quando as coisas não estão organizadas ou arrumadas de maneira detalhada.", emoji: "😾", example: "Ex.: Irritar-se quando as coisas não estão organizadas de forma detalhada e arrumada." },
        { text: "Quando observo algo, sou capaz de identificar pequenas discrepâncias que outros não percebem.", emoji: "🔬", example: "Ex.: Identificar pequenas diferenças em algo que a maioria das pessoas não nota." },
        { text: "Eu sou mais eficiente quando sou capaz de focar nos detalhes ao realizar tarefas.", emoji: "🎯", example: "Ex.: Render mais quando consegue focar nos detalhes ao realizar uma tarefa." },
      ] },
      { name: "Mudanças de rotina e flexibilidade", color: "text-cyan-600 dark:text-cyan-400", items: [
        { text: "Eu me sinto desconfortável quando minha rotina diária é alterada inesperadamente.", emoji: "😰", example: "Ex.: Ficar desconfortável quando a rotina do dia muda de repente, sem aviso." },
        { text: "Eu preciso de tempo para me adaptar a novas situações ou mudanças de planos.", emoji: "⏳", example: "Ex.: Precisar de um tempo maior para se acostumar a novidades ou mudanças de plano." },
        { text: "Eu tenho dificuldade em mudar de atividades ou tarefas, mesmo quando a mudança é necessária.", emoji: "🔀", example: "Ex.: Custar a trocar de atividade, mesmo quando a mudança é necessária." },
        { text: "Eu fico ansioso quando as coisas não acontecem como esperado.", emoji: "😬", example: "Ex.: Ficar ansioso(a) quando as coisas não saem do jeito esperado." },
        { text: "Eu prefiro manter as coisas do mesmo jeito e evito mudanças sempre que possível.", emoji: "🔒", example: "Ex.: Preferir manter tudo do mesmo jeito e evitar mudanças sempre que der." },
        { text: "Quando enfrento mudanças, sinto que preciso de mais tempo do que outras pessoas para me ajustar.", emoji: "🐢", example: "Ex.: Ao enfrentar mudanças, levar mais tempo que os outros para se ajustar." },
        { text: "Eu tenho dificuldades em improvisar ou ser flexível quando algo não sai como planejado.", emoji: "🤹", example: "Ex.: Ter dificuldade de improvisar quando algo foge do que estava planejado." },
        { text: "Eu me sinto frustrado quando preciso mudar a minha forma de fazer as coisas.", emoji: "😤", example: "Ex.: Sentir frustração quando precisa mudar o jeito de fazer as coisas." },
        { text: "Eu me estresso mais do que outras pessoas quando enfrento imprevistos ou alterações no plano.", emoji: "🌩️", example: "Ex.: Estressar-se mais que os outros diante de imprevistos e mudanças de plano." },
        { text: "Eu sou mais produtivo quando sigo uma rotina estruturada e preestabelecida.", emoji: "📅", example: "Ex.: Render melhor seguindo uma rotina estruturada e já combinada de antemão." },
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
        { text: "Sabe o próprio nome", emoji: "🙋", example: "Ex.: Virar-se ou responder quando alguém chama pelo seu nome." },
        { text: "Responde ao \"sim\" e ao \"não\"", emoji: "👌", example: "Ex.: Responder de forma coerente a perguntas de 'sim' e 'não'." },
        { text: "Segue alguns comandos", emoji: "👂", example: "Ex.: Obedecer a pedidos simples, como 'pega a bola' ou 'senta aqui'." },
        { text: "Usa uma palavra por vez (ex.: \"não\", \"comer\", \"água\")", emoji: "🗣️", example: "Ex.: Falar uma palavra de cada vez, como 'água', 'comer' ou 'não'." },
        { text: "Usa duas palavras juntas (ex.: \"quero ir\")", emoji: "💬", example: "Ex.: Juntar duas palavras para se comunicar, como 'quero ir' ou 'mamãe água'." },
        { text: "Usa três palavras juntas (ex.: \"não quero leite\")", emoji: "🔤", example: "Ex.: Formar frases de três palavras, como 'não quero leite'." },
        { text: "Sabe 10 ou mais palavras", emoji: "📚", example: "Ex.: Ter um vocabulário de dez ou mais palavras diferentes que usa no dia a dia." },
        { text: "Usa frases com 4 ou mais palavras", emoji: "📝", example: "Ex.: Montar frases com quatro ou mais palavras, como 'vovó vai no parque hoje'." },
        { text: "Explica o que quer", emoji: "🙌", example: "Ex.: Explicar com palavras o que deseja, como 'quero o carrinho vermelho'." },
        { text: "Faz perguntas com sentido", emoji: "❓", example: "Ex.: Fazer perguntas com sentido, como 'onde está o papai?' ou 'por que chove?'." },
        { text: "Fala de forma significativa e relevante", emoji: "💡", example: "Ex.: Falar de maneira que faz sentido e combina com o assunto do momento." },
        { text: "Usa frases sucessivas / encadeadas", emoji: "🔗", example: "Ex.: Encadear várias frases seguidas para contar algo, como narrar o dia na escola." },
        { text: "Mantém uma boa conversa", emoji: "🗨️", example: "Ex.: Manter uma conversa de ida e volta, ouvindo e respondendo no tempo certo." },
        { text: "Comunica-se normalmente para a idade", emoji: "👦", example: "Ex.: Comunicar-se de forma esperada para a idade, como as outras crianças da mesma faixa." },
      ] },
      { name: "II. Sociabilidade", color: "text-violet-600 dark:text-violet-400", items: [
        { text: "Parece fechado, difícil de alcançar", emoji: "🙁", example: "Ex.: Parecer fechado(a) e distante, difícil de envolver em brincadeiras ou conversa." },
        { text: "Ignora as outras pessoas", emoji: "🙈", example: "Ex.: Quando alguém entra na sala e fala com ela, segue no que estava fazendo como se ninguém tivesse chegado." },
        { text: "Presta pouca ou nenhuma atenção quando abordado", emoji: "🔇", example: "Ex.: Você a chama pelo nome ou pergunta algo e ela quase não olha nem responde." },
        { text: "Pouco cooperativo e resistente", emoji: "🙅", example: "Ex.: Ao pedir para guardar os brinquedos ou vestir a roupa, resiste e não colabora." },
        { text: "Pouco ou nenhum contato visual", emoji: "👀", example: "Ex.: Ao conversar ou brincar, raramente olha nos seus olhos, desviando o olhar." },
        { text: "Prefere ficar sozinho", emoji: "🧍", example: "Ex.: Numa festa infantil, se afasta e brinca sozinha em vez de ficar perto das outras crianças." },
        { text: "Demonstra pouca afeição", emoji: "🫂", example: "Ex.: Quase não dá abraços, beijos ou colo espontâneo para os pais." },
        { text: "Não cumprimenta os pais", emoji: "👋", example: "Ex.: Quando os pais chegam em casa, não vai receber nem demonstra alegria ao vê-los." },
        { text: "Evita contato com os outros", emoji: "🚷", example: "Ex.: Foge do toque e se afasta quando alguém tenta se aproximar dela." },
        { text: "Não imita", emoji: "🪞", example: "Ex.: Não repete gestos simples, como bater palmas ou mandar beijo, quando você faz na frente dela." },
        { text: "Não gosta de ser segurado / aconchegado", emoji: "🧸", example: "Ex.: Fica desconfortável, se retesa ou empurra quando alguém tenta pegá-la no colo e aconchegar." },
        { text: "Não compartilha nem mostra coisas aos outros", emoji: "🎁", example: "Ex.: Não traz um brinquedo ou desenho para mostrar aos pais dizendo 'olha o que eu fiz'." },
        { text: "Não acena \"tchau\"", emoji: "👋", example: "Ex.: Na despedida, não acena tchau com a mãozinha mesmo quando pedem." },
        { text: "Desobediente / opositor", emoji: "😤", example: "Ex.: Diante de qualquer ordem simples, responde 'não' e faz o oposto do pedido." },
        { text: "Faz birras", emoji: "😡", example: "Ex.: Quando contrariada, joga-se no chão, grita e chora de forma intensa." },
        { text: "Falta de amigos / companheiros", emoji: "🧑‍🤝‍🧑", example: "Ex.: Não tem colegas com quem brincar regularmente na escola ou na vizinhança." },
        { text: "Raramente sorri", emoji: "🙂", example: "Ex.: Mesmo em brincadeiras divertidas ou cócegas, quase não sorri." },
        { text: "Insensível aos sentimentos dos outros", emoji: "💔", example: "Ex.: Se um coleguinha se machuca e chora, ela não parece perceber nem se importar." },
        { text: "Indiferente a ser querido", emoji: "🤷", example: "Ex.: Não parece se importar ou reagir quando recebe carinho ou é elogiada com afeto." },
        { text: "Indiferente quando os pais saem", emoji: "🚪", example: "Ex.: Quando os pais saem de casa, não estranha nem demonstra reação." },
      ] },
      { name: "III. Consciência sensorial / cognitiva", color: "text-teal-600 dark:text-teal-400", items: [
        { text: "Responde ao próprio nome", emoji: "📣", example: "Ex.: Ao ouvir o próprio nome, vira o rosto ou olha para quem chamou." },
        { text: "Reage ao elogio", emoji: "👏", example: "Ex.: Quando você diz 'muito bem!', ela sorri ou fica contente com o elogio." },
        { text: "Olha para pessoas e animais", emoji: "🐶", example: "Ex.: Observa uma pessoa passando ou um cachorro brincando por perto." },
        { text: "Olha para fotos e TV", emoji: "📺", example: "Ex.: Presta atenção em figuras de um livro ou nos personagens da televisão." },
        { text: "Desenha, pinta, usa cores", emoji: "🖍️", example: "Ex.: Pega giz de cera e faz rabiscos ou desenhos coloridos no papel." },
        { text: "Brinca de forma apropriada com os brinquedos", emoji: "🚗", example: "Ex.: Empurra o carrinho fazendo de conta que anda, em vez de só girar as rodas." },
        { text: "Tem expressões faciais apropriadas ao contexto", emoji: "😊", example: "Ex.: Faz cara de alegria quando ganha algo e cara triste quando algo dá errado." },
        { text: "Compreende histórias na TV", emoji: "📺", example: "Ex.: Acompanha o enredo de um desenho e entende o que aconteceu com os personagens." },
        { text: "Compreende explicações", emoji: "💬", example: "Ex.: Quando você explica por que não pode fazer algo, ela entende o motivo." },
        { text: "Tem noção do ambiente ao redor", emoji: "🧭", example: "Ex.: Percebe mudanças no ambiente, como um móvel novo ou a porta aberta." },
        { text: "Tem noção de perigo", emoji: "⚠️", example: "Ex.: Evita se aproximar do fogão quente ou da escada por perceber o risco." },
        { text: "Demonstra imaginação", emoji: "🦄", example: "Ex.: Cria histórias com bonecos, faz de conta que a caixa é um barco." },
        { text: "Inicia atividades por conta própria", emoji: "🎨", example: "Ex.: Começa a brincar ou desenhar sozinha, sem precisar de alguém sugerindo." },
        { text: "Veste-se sozinho", emoji: "👕", example: "Ex.: Consegue vestir camiseta e calça sozinha, sem ajuda dos pais." },
        { text: "É curioso e interessado", emoji: "🔍", example: "Ex.: Faz muitas perguntas e quer saber como as coisas funcionam." },
        { text: "É aventureiro, explorador", emoji: "🧗", example: "Ex.: Gosta de explorar lugares novos, subir e descobrir o que há ao redor." },
        { text: "Vive num mundo à parte", emoji: "🌫️", example: "Ex.: Parece estar 'no mundo da lua', alheia ao que acontece por perto." },
      ] },
      { name: "IV. Saúde / Comportamento", color: "text-amber-600 dark:text-amber-400", items: [
        { text: "Faz xixi na cama", emoji: "🛏️", example: "Ex.: Acorda com a cama molhada por ter feito xixi durante o sono." },
        { text: "Faz xixi nas calças / fraldas", emoji: "💧", example: "Ex.: Molha a roupa ou a fralda de xixi durante o dia, mesmo já treinada." },
        { text: "Evacua nas calças / fraldas", emoji: "💩", example: "Ex.: Evacua na roupa ou na fralda em vez de usar o vaso." },
        { text: "Diarreia", emoji: "🚽", example: "Ex.: Tem fezes amolecidas e vai ao banheiro várias vezes ao dia." },
        { text: "Prisão de ventre", emoji: "🚼", example: "Ex.: Fica dias sem evacuar e as fezes saem endurecidas e com dificuldade." },
        { text: "Problemas de sono", emoji: "😴", example: "Ex.: Demora muito para pegar no sono ou acorda várias vezes à noite." },
        { text: "Come demais ou de menos", emoji: "🍽️", example: "Ex.: Come em excesso ou quase nada nas refeições do dia." },
        { text: "Dieta extremamente restrita", emoji: "🥦", example: "Ex.: Só aceita comer poucos alimentos e recusa quase todo o resto." },
        { text: "Hiperativo", emoji: "⚡", example: "Ex.: Não para quieta, corre e se mexe o tempo todo, difícil de acalmar." },
        { text: "Letárgico / apático", emoji: "🥱", example: "Ex.: Fica muito parada, sem energia e com pouco interesse em brincar." },
        { text: "Machuca a si mesmo", emoji: "🩹", example: "Ex.: Bate a cabeça na parede ou se morde quando fica nervosa." },
        { text: "Machuca os outros", emoji: "✋", example: "Ex.: Bate, belisca ou empurra outras crianças ou adultos." },
        { text: "Destrutivo", emoji: "💥", example: "Ex.: Quebra brinquedos e objetos de propósito quando irritada." },
        { text: "Sensível ao som", emoji: "🔊", example: "Ex.: Tapa os ouvidos e se assusta com liquidificador, aspirador ou sirene." },
        { text: "Ansioso / medroso", emoji: "😰", example: "Ex.: Fica muito ansiosa ou com medo em situações novas ou com pessoas estranhas." },
        { text: "Triste / choroso", emoji: "😢", example: "Ex.: Fica triste e chora com facilidade ao longo do dia." },
        { text: "Convulsões", emoji: "⚡", example: "Ex.: Teve episódios de tremores no corpo, olhar fixo ou desmaio (convulsões)." },
        { text: "Fala / linguagem obsessiva", emoji: "🔁", example: "Ex.: Repete as mesmas frases ou fala sem parar sobre o mesmo assunto." },
        { text: "Rotinas rígidas", emoji: "📋", example: "Ex.: Precisa seguir sempre a mesma sequência de rotina e fica mal se algo muda." },
        { text: "Grita", emoji: "🗣️", example: "Ex.: Grita alto com frequência, mesmo sem motivo aparente." },
        { text: "Exige que as coisas sejam sempre do mesmo jeito", emoji: "🔒", example: "Ex.: Exige que os objetos e a rotina fiquem sempre exatamente do mesmo jeito." },
        { text: "Fica agitado com frequência", emoji: "😣", example: "Ex.: Fica inquieta e irritada com facilidade várias vezes ao dia." },
        { text: "Insensível à dor", emoji: "🤕", example: "Ex.: Se machuca, cai ou se corta e parece não sentir dor." },
        { text: "Obcecado por certos objetos ou temas", emoji: "🎯", example: "Ex.: Fica fixada num único objeto ou assunto, como ventiladores ou dinossauros." },
        { text: "Faz gestos / movimentos repetitivos", emoji: "🔄", example: "Ex.: Balança o corpo, agita as mãos ou gira repetidamente." },
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
        { text: "Percebe pequenos sons, padrões ou detalhes que a maioria das pessoas não nota", emoji: "🔎", example: "Ex.: Percebe um som baixinho ou um detalhe pequeno que ninguém mais notou." },
        { text: "Tende a focar tanto em detalhes que perde a visão do todo", emoji: "🧩", example: "Ex.: Se prende tanto a um detalhe da tarefa que perde a noção do conjunto todo." },
        { text: "Acha difícil perceber a intenção de alguém apenas pela expressão facial ou tom de voz", emoji: "😐", example: "Ex.: Tem dificuldade de saber se a pessoa está brincando ou séria só pela cara ou tom de voz." },
        { text: "Tem dificuldade em manter uma conversa de ida-e-volta, com trocas fluidas", emoji: "💬", example: "Ex.: Numa conversa, custa a esperar a vez e manter a troca fluindo entre os dois." },
        { text: "Percebe com dificuldade quando o outro está perdendo o interesse na conversa", emoji: "🥱", example: "Ex.: Continua falando sem perceber que o outro já perdeu o interesse no assunto." },
        { text: "Interpreta frases de forma muito literal (dificuldade com ironia, piadas ou duplo sentido)", emoji: "🔤", example: "Ex.: Entende 'quebrar a cara' ao pé da letra e não capta ironias ou piadas." },
        { text: "Tem dificuldade em imaginar situações ou entrar em brincadeiras de faz-de-conta / ficção", emoji: "🎭", example: "Ex.: Tem dificuldade de entrar em brincadeiras de faz-de-conta, como imaginar ser um super-herói." },
        { text: "Prefere fazer as coisas sempre da mesma maneira e incomoda-se com mudanças de rotina", emoji: "🔁", example: "Ex.: Prefere fazer tudo na mesma ordem e se incomoda quando a rotina muda." },
        { text: "Tem dificuldade em fazer ou manter amizades com colegas da mesma idade", emoji: "🧑‍🤝‍🧑", example: "Ex.: Tem dificuldade de fazer e manter amizades com crianças da mesma idade." },
        { text: "Tem interesses muito intensos e restritos que ocupam grande parte do tempo", emoji: "🚂", example: "Ex.: Passa horas só com um interesse específico, como trens ou mapas, deixando o resto de lado." },
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
        { text: "Frequência cardíaca — 0: ausente · 1: menor que 100 bpm · 2: 100 bpm ou mais", emoji: "❤️", example: "Ex.: Ao avaliar o recém-nascido, conte os batimentos: ausentes, abaixo ou acima de 100 por minuto." },
        { text: "Esforço respiratório — 0: ausente · 1: irregular ou choro fraco · 2: choro forte, respiração regular", emoji: "🫁", example: "Ex.: Observe a respiração do bebê: se não respira, se o choro é fraco ou se chora forte e regular." },
        { text: "Tônus muscular — 0: flácido · 1: alguma flexão de extremidades · 2: movimento ativo, boa flexão", emoji: "💪", example: "Ex.: Veja o tônus do bebê: se está molinho, com pouca flexão ou movendo braços e pernas ativamente." },
        { text: "Irritabilidade reflexa — 0: sem resposta ao estímulo · 1: careta · 2: choro, tosse ou espirro", emoji: "🤧", example: "Ex.: Ao estimular o bebê (aspirar narinas), observe se não reage, faz careta ou tosse/espirra." },
        { text: "Cor da pele — 0: cianótico ou pálido · 1: corpo rosado com extremidades azuladas · 2: totalmente rosado", emoji: "🎨", example: "Ex.: Observe a cor da pele: azulada/pálida, corpo rosado com pés e mãos azulados, ou totalmente rosada." },
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
        { text: "Choro — 0: ausente ou não agudo · 1: agudo, mas consolável · 2: agudo e inconsolável", emoji: "😭", example: "Ex.: Avalie o choro: ausente, agudo mas que se acalma, ou agudo e inconsolável." },
        { text: "Necessidade de oxigênio para SatO₂ acima de 95% — 0: não · 1: até 30% · 2: mais de 30%", emoji: "🫧", example: "Ex.: Verifique quanto oxigênio a criança precisa para manter a saturação acima de 95%." },
        { text: "Aumento de sinais vitais (FC e PA) — 0: iguais ou abaixo do basal · 1: aumento de até 20% · 2: aumento acima de 20%", emoji: "📈", example: "Ex.: Compare os sinais vitais atuais (batimentos e pressão) com o valor de repouso da criança." },
        { text: "Expressão facial — 0: relaxada/neutra · 1: careta · 2: careta com grunhido", emoji: "😖", example: "Ex.: Observe o rosto do bebê: relaxado, com careta, ou com careta acompanhada de grunhido." },
        { text: "Sono nas últimas horas — 0: dorme normalmente · 1: desperta em intervalos frequentes · 2: permanece acordado", emoji: "😴", example: "Ex.: Avalie o sono das últimas horas: dormiu bem, acordou várias vezes ou ficou acordado o tempo todo." },
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
        { text: "Intensidade da dor agora (0 = sem dor · 10 = pior dor imaginável)", emoji: "🌡️", example: "Ex.: Peça para a criança apontar a intensidade da dor agora, de 0 (sem dor) a 10 (a pior possível)." },
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
        { text: "Escapou urina na roupa durante o dia", emoji: "💧", example: "Ex.: Durante o dia, escapou xixi e molhou a roupa antes de chegar ao banheiro." },
        { text: "Quando escapa, molha a roupa íntima (poucas gotas) sem perceber", emoji: "💦", example: "Ex.: Solta algumas gotas de xixi na roupa íntima sem sequer perceber que aconteceu." },
        { text: "Sente vontade súbita e precisa correr ao banheiro (urgência)", emoji: "🏃", example: "Ex.: Sente uma vontade repentina e forte de fazer xixi e precisa correr para não escapar." },
        { text: "Faz manobras para segurar (cruza as pernas, agacha, aperta a região)", emoji: "🦵", example: "Ex.: Cruza as pernas, se agacha ou aperta a região para segurar o xixi." },
        { text: "Precisa fazer força ou empurrar para começar a urinar", emoji: "😤", example: "Ex.: Precisa fazer força na barriga para conseguir começar a urinar." },
        { text: "Urina poucas vezes ao dia (1 a 2 vezes)", emoji: "🚽", example: "Ex.: Passa o dia quase inteiro sem ir ao banheiro, urinando só 1 ou 2 vezes." },
        { text: "Sente dor ou ardência ao urinar", emoji: "🔥", example: "Ex.: Reclama de ardência ou dor na hora de fazer xixi." },
        { text: "Tem evacuação difícil, endurecida ou infrequente (constipação)", emoji: "💩", example: "Ex.: Fica dias sem evacuar e as fezes saem duras e com dificuldade." },
        { text: "Adia ir ao banheiro / segura o xixi o máximo possível", emoji: "⏳", example: "Ex.: Fica segurando o xixi o máximo que consegue, adiando ir ao banheiro na escola." },
        { text: "Passou por situação estressante recente (mudança, escola, família)", emoji: "🌪️", example: "Ex.: Passou recentemente por mudança de casa, escola nova ou conflito na família." },
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
      { text: "Nível de habilidade manual no dia a dia", emoji: "🤲", example: "Ex.: Avalie o quanto a criança usa as mãos no dia a dia, como segurar talheres e manusear objetos." },
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
      { text: "Nível de eficácia da comunicação no dia a dia", emoji: "🗨️", example: "Ex.: Avalie o quanto ela consegue se fazer entender e comunicar suas necessidades no dia a dia." },
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
      { text: "Nível de habilidade para comer e beber com segurança", emoji: "🍽️", example: "Ex.: Avalie o quanto ela come e bebe com segurança, sem engasgar ou se sufocar." },
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
    domains: [{ name: "Intensidade da dor", color: "text-rose-600 dark:text-rose-400", items: [{ text: "Qual rosto mostra a dor agora?", emoji: "😣", example: "Ex.: Peça à criança para escolher, entre carinhas de sorridente a chorosa, a que mostra a dor agora." }] }],
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
      { text: "Choramingou, gemeu ou vocalizou sofrimento", emoji: "😢", example: "Ex.: Emitiu gemidos, choramingos ou sons de queixa demonstrando desconforto." }, { text: "Ficou agitado ou inquieto sem se acalmar", emoji: "😖", example: "Ex.: Ficou remexendo, sem parar quieto e sem conseguir se acalmar." }, { text: "Expressão facial de dor (testa franzida, olhos apertados)", emoji: "😧", example: "Ex.: Observe se está de testa franzida e olhos apertados, com cara de dor." },
      { text: "Chorou e foi difícil de consolar", emoji: "😭", example: "Ex.: Chorou e foi muito difícil consolar, mesmo com colo e carinho." }, { text: "Ficou mais quieto ou retraído que o habitual", emoji: "🤐", example: "Ex.: Ficou mais calado e retraído do que é o seu normal." }, { text: "Enrijeceu o corpo ou aumentou o tônus muscular", emoji: "🧱", example: "Ex.: Observe se o corpo está endurecido e tenso, com os músculos contraídos." },
      { text: "Fez caretas ou estremeceu ao ser tocado/movido", emoji: "😬", example: "Ex.: Faz careta ou se encolhe quando é tocado ou mudado de posição." }, { text: "Protegeu ou evitou mexer numa parte do corpo", emoji: "🛡️", example: "Ex.: Protege uma parte do corpo, como o braço, evitando que a toquem ou movam." }, { text: "Dormiu mal / sono interrompido", emoji: "🌙", example: "Ex.: Dormiu mal, com o sono interrompido várias vezes durante a noite." },
      { text: "Comeu ou bebeu menos que o habitual", emoji: "🥄", example: "Ex.: Comeu e bebeu menos do que costuma nas refeições." }, { text: "Sudorese, palidez ou mudança de cor", emoji: "💦", example: "Ex.: Observe se está suando, pálido ou com a pele mudando de cor." }, { text: "Movimentos de defesa (afastar, empurrar) ao manuseio", emoji: "🙅", example: "Ex.: Empurra ou afasta suas mãos quando você tenta cuidar ou manuseá-lo." },
      { text: "Ranger de dentes, morder ou autoestimulação aumentada", emoji: "😬", example: "Ex.: Range os dentes, morde ou aumenta os movimentos repetitivos de autoestímulo." }, { text: "Parecia sofrido mesmo em repouso", emoji: "😔", example: "Ex.: Mesmo deitado e parado, mantém uma expressão de sofrimento." }, { text: "Não se interessou pelo ambiente/brincadeira como de costume", emoji: "🧸", example: "Ex.: Não se interessou pelos brinquedos nem pelo ambiente como costuma fazer." },
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
      { text: "As crises acontecem sem aviso (sem aura/pródromo)", emoji: "⚡", example: "Ex.: As crises começam de repente, sem nenhum sinal de aviso antes." }, { text: "A criança perde a consciência durante a crise", emoji: "😵", example: "Ex.: Durante a crise, a criança apaga e não responde a chamados." }, { text: "As crises são longas (mais de alguns minutos)", emoji: "⏱️", example: "Ex.: As crises se prolongam por vários minutos antes de passar." },
      { text: "Ocorrem quedas ou risco de lesão durante a crise", emoji: "🤕", example: "Ex.: Durante a crise ela cai e corre risco de se machucar." }, { text: "Há perda de urina ou fezes durante a crise", emoji: "💧", example: "Ex.: Durante a crise, chega a soltar xixi ou fezes sem controle." }, { text: "Há confusão ou agitação logo após a crise", emoji: "😵‍💫", example: "Ex.: Logo depois da crise, fica confusa ou agitada, sem saber o que houve." },
      { text: "A recuperação é lenta (sonolência/cansaço prolongado)", emoji: "😴", example: "Ex.: Após a crise, fica sonolenta e cansada por bastante tempo até se recuperar." }, { text: "As crises atrapalham as atividades do dia", emoji: "📅", example: "Ex.: As crises interrompem a escola, a brincadeira ou outras atividades do dia." }, { text: "A criança se machucou em alguma crise recente", emoji: "🩹", example: "Ex.: Em alguma crise recente, ela caiu e acabou se machucando." },
      { text: "Há pouco controle das crises apesar do tratamento", emoji: "💊", example: "Ex.: Mesmo tomando os remédios certinho, as crises continuam acontecendo." },
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
      { text: "Alteração ou perda de consciência", emoji: "😵", example: "Ex.: Durante a crise, ela perde ou altera a consciência, ficando desconectada." }, { text: "Quedas ou tombos durante a crise", emoji: "🤸", example: "Ex.: Durante a crise ela perde o equilíbrio e cai no chão." }, { text: "Movimentos ou automatismos intensos", emoji: "🔄", example: "Ex.: Na crise faz movimentos fortes ou gestos automáticos, como mastigar ou mexer as mãos." },
      { text: "Duração longa das crises", emoji: "⏱️", example: "Ex.: As crises duram bastante tempo antes de cederem." }, { text: "Crises frequentes", emoji: "🔁", example: "Ex.: As crises acontecem muitas vezes, várias na semana ou no dia." }, { text: "Generalização (envolve o corpo todo)", emoji: "🧍", example: "Ex.: A crise envolve o corpo todo, com abalos dos braços e pernas ao mesmo tempo." }, { text: "Necessidade de socorro/medicação de resgate", emoji: "🚑", example: "Ex.: A crise exige medicação de resgate ou socorro para ser interrompida." },
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
      { text: "Durante as refeições", emoji: "🍽️", example: "Ex.: Observe se o comportamento aparece principalmente durante as refeições." }, { text: "Ao brincar sozinho", emoji: "🧸", example: "Ex.: Observe se acontece quando a criança está brincando sozinha." }, { text: "Ao brincar com outras crianças", emoji: "🧒", example: "Ex.: Observe se acontece quando ela brinca junto com outras crianças." }, { text: "Na hora de se vestir", emoji: "👕", example: "Ex.: Observe se acontece na hora de se vestir e trocar de roupa." }, { text: "Durante o banho/higiene", emoji: "🛁", example: "Ex.: Observe se acontece durante o banho ou na hora da higiene." },
      { text: "Ao assistir TV ou usar telas", emoji: "📱", example: "Ex.: Observe se acontece ao assistir TV ou usar celular e tablet." }, { text: "Quando há visitas em casa", emoji: "🏠", example: "Ex.: Observe se acontece quando chegam visitas em casa." }, { text: "Em casa de outras pessoas", emoji: "🚪", example: "Ex.: Observe se acontece quando estão na casa de outras pessoas." }, { text: "Em lojas ou lugares públicos", emoji: "🛒", example: "Ex.: Observe se acontece em lojas, mercado ou outros lugares públicos." },
      { text: "Na hora do dever de casa / atividades", emoji: "📚", example: "Ex.: Observe se acontece na hora do dever de casa ou das atividades escolares." }, { text: "Na hora de dormir", emoji: "🌙", example: "Ex.: Observe se acontece na hora de ir para a cama dormir." }, { text: "No carro / transporte", emoji: "🚗", example: "Ex.: Observe se acontece dentro do carro ou no transporte." }, { text: "Quando o adulto está ao telefone / ocupado", emoji: "📞", example: "Ex.: Observe se acontece quando o adulto está ao telefone ou ocupado com outra coisa." }, { text: "Ao ser contrariado ou ouvir 'não'", emoji: "🚫", example: "Ex.: Observe se acontece quando ela é contrariada ou ouve um 'não'." },
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
    domains: [{ name: "Forma das fezes", color: "text-cyan-600 dark:text-cyan-400", items: [{ text: "Tipo habitual das fezes", emoji: "💩", example: "Ex.: Descreva como costumam ser as fezes: ressecadas, normais ou amolecidas." }] }],
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
  ...podjTeaPrimeItems,
};

/** Retorna a definição interativa de uma escala, se existir. */
export function getInteractiveScale(id: string | undefined): InteractiveScaleDef | undefined {
  return id ? interactiveScaleItems[id] : undefined;
}
