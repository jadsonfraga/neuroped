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
  ClipboardList, type LucideIcon,
} from "lucide-react";
import type { ScaleEntry } from "./scaleFilter";
import type { ScaleConfig } from "@/components/GenericScale";

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
      "Muitos marcos esperados estão ausentes. Recomenda-se investigação e encaminhamento para avaliação especializada (neuropediatria e/ou terapias). Esta é uma triagem, não um diagnóstico.",
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
  // Título limpo: remove o código "(J26-xxx)" do fim, se houver.
  const cleanTitle = scale.name.replace(/\s*\(J26-\d+\)\s*$/i, "").trim() || scale.name;

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

// ------------------------------------------------------------
// Escalas de SINAIS/SINTOMAS (maior = mais intenso = mais concern)
// ------------------------------------------------------------
const SEVERITY_LABELS = ["Não / nunca", "Leve / às vezes", "Moderado / frequente", "Intenso / quase sempre"];
const FREQ_LABELS = ["Nunca", "Raro (≤1×/semana)", "Semanal", "Quase diário", "Várias vezes ao dia"];

// Faixas por intensidade (maior % = mais sinais/intensidade).
const SEVERITY_BANDS: InteractiveBand[] = [
  {
    minPct: 70,
    classification: "Intensidade alta — suporte significativo",
    color: "red",
    description:
      "Vários sinais presentes e intensos, com impacto no cotidiano. Recomenda-se avaliação dirigida e plano de suporte/intervenção. Triagem, não diagnóstico.",
  },
  {
    minPct: 45,
    classification: "Intensidade moderada — suporte indicado",
    color: "orange",
    description:
      "Sinais presentes com repercussão no dia a dia. Vale estruturar suporte/estratégias e reavaliar a resposta ao longo do tempo. Triagem, não diagnóstico.",
  },
  {
    minPct: 20,
    classification: "Intensidade leve — acompanhar",
    color: "amber",
    description:
      "Alguns sinais presentes, de menor intensidade. Acompanhe a evolução e reforce estratégias no cotidiano.",
  },
  {
    minPct: 0,
    classification: "Pouco ou ausente",
    color: "emerald",
    description:
      "Poucos sinais relatados nesta área. Mantenha o acompanhamento de rotina.",
  },
];

const SEVERITY_INSTRUCTION =
  "Para cada item, marque o quanto descreve a criança no dia a dia. Responda com base no que você realmente observa. Responda todos os itens.";

// ============================================================
// LOTE 1 — Categoria 1: Triagem do Neurodesenvolvimento (autoral)
// ============================================================
export const interactiveScaleItems: Record<string, InteractiveScaleDef> = {
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

  // ---- J26-016 — Perfil Sensorial TEA (sinais/intensidade) ----
  "j26-016": {
    icon: Hand,
    gradient: "from-violet-500 to-purple-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Mapeamento do perfil sensorial (maior escore = mais alterações sensoriais). Orienta o plano de intervenção sensorial. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Carga sensorial (maior = mais alterações)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Perfil sensorial no cotidiano",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Tapa os ouvidos ou se incomoda muito com sons comuns (liquidificador, secador, festa)",
          "Não reage a sons altos ou parece não ouvir quando é chamada",
          "Procura sons repetitivos ou faz barulhos com a boca/objetos",
          "Recusa certas texturas de roupa, etiquetas ou costuras",
          "Incomoda-se com mão suja, cola, areia ou tinta",
          "Não percebe quando está suja, molhada ou se machuca (alta tolerância à dor)",
          "Fixa-se em luzes, objetos que giram ou detalhes pequenos",
          "Incomoda-se com luz forte ou ambientes visualmente cheios",
          "Procura muito movimento — girar, balançar, pular sem cansar",
          "Esbarra, aperta ou busca apertos e impactos no corpo",
          "Parece “molenga”, cansa rápido ou tem postura frouxa",
          "Tem seletividade alimentar forte por textura, cheiro ou cor",
          "Cheira ou lambe objetos que não são alimentos",
          "Leva objetos à boca além da idade esperada",
          "Fica sobrecarregada (crise) em ambientes com muito estímulo (mercado, festa)",
        ],
      },
    ],
  },

  // ---- J26-017 — Interesses Restritos e Comportamentos Repetitivos ----
  "j26-017": {
    icon: Sparkles,
    gradient: "from-amber-500 to-orange-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Mapeia comportamentos repetitivos e inflexibilidade (maior escore = mais presente/intenso). Complementa a avaliação diagnóstica. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Comportamentos repetitivos e inflexibilidade",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Repetição, rituais e interesses restritos",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Balança as mãos, mexe os dedos ou bate palmas no ar repetidamente",
          "Balança o corpo, gira ou anda na ponta dos pés",
          "Repete os mesmos movimentos com objetos (alinhar, girar rodas, abrir/fechar)",
          "Exige que tudo seja sempre do mesmo jeito (mesma rota, prato, ordem)",
          "Fica muito aflita com mudanças de rotina ou imprevistos",
          "Tem rituais que precisam ser cumpridos em sequência fixa",
          "Tem um interesse muito intenso e específico que domina a atenção",
          "Fala repetidamente do mesmo assunto, mesmo sem o outro se interessar",
          "Apega-se a objetos incomuns e os carrega consigo",
          "Repete falas, frases de desenhos ou propagandas fora de contexto (ecolalia)",
          "Faz as mesmas perguntas repetidamente, mesmo sabendo a resposta",
          "Observa objetos de ângulos incomuns ou de muito perto",
          "Fascina-se por partes de objetos (rodinhas, botões) em vez do todo",
          "Tem crise quando o ritual ou a rotina é interrompido",
        ],
      },
    ],
  },

  // ---- J26-019 — Motivação e Dificuldade Social TEA ----
  "j26-019": {
    icon: MessageCircle,
    gradient: "from-blue-500 to-indigo-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Avalia a dificuldade de interação social (maior escore = mais dificuldade). Ajuda a distinguir o retraimento e a planejar a intervenção. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Dificuldade de interação social",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Motivação e interação social",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Prefere brincar sozinha mesmo quando há outras crianças disponíveis",
          "Não procura espontaneamente outras crianças para brincar",
          "Ignora ou não responde quando outra criança a chama ou convida",
          "Não compartilha conquistas ou descobertas buscando o adulto",
          "Parece indiferente ao elogio ou à atenção social",
          "Tem dificuldade de fazer e manter amizades",
          "Aproxima-se das crianças de forma atípica (não sabe como entrar na brincadeira)",
          "Prefere o convívio com adultos ao de crianças da mesma idade",
          "Não imita brincadeiras sociais espontaneamente",
          "Mostra pouco interesse pelo que os colegas estão fazendo",
          "Afasta-se quando o ambiente social fica intenso",
          "Demonstra querer se relacionar, mas não sabe como (frustra-se socialmente)",
        ],
      },
    ],
  },

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

  // ---- J26-025 — Agressividade e Autolesão TEA (frequência) ----
  "j26-025": {
    icon: Activity,
    gradient: "from-red-500 to-rose-600",
    instruction:
      "Marque a frequência de cada comportamento nas últimas 2 semanas. Use para monitorar a resposta ao tratamento ao longo do tempo.",
    infoBox:
      "Monitorização de comportamentos agressivos e autolesivos (maior escore = mais frequente/grave). Relate ao médico — apoia decisões terapêuticas e ajuste de medicação. Não é diagnóstico.",
    labels: FREQ_LABELS,
    totalLabel: "Frequência de agressão/autolesão",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Comportamentos agressivos e autolesivos",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Bate, empurra, chuta ou belisca outras pessoas",
          "Morde outras pessoas",
          "Bate a própria cabeça (em superfícies ou com a mão)",
          "Morde ou belisca a si mesma",
          "Arranha ou machuca a própria pele",
          "Puxa o próprio cabelo",
          "Joga-se no chão ou se atira contra objetos",
          "Quebra ou arremessa objetos durante a crise",
          "Tem crises de grito ou choro intensas e de difícil consolo",
          "Agride ao ser contrariada ou frustrada",
          "Agride quando está sobrecarregada sensorialmente",
          "As crises chegam a causar risco de lesão (a ela ou a outros)",
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

  // ---- J26-029 — TEA e Sono (sinais/intensidade) ----
  "j26-029": {
    icon: Sparkles,
    gradient: "from-indigo-500 to-blue-700",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Avalia problemas de sono comuns no TEA (maior escore = mais alterações). Base para discutir rotina noturna e melatonina com o médico. Não é diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Alterações do sono (maior = mais problemas)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Padrão de sono",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Demora muito para pegar no sono (mais de 30 minutos)",
          "Resiste à hora de dormir ou não quer ir para a cama",
          "Só dorme com condições específicas (luz, objeto, companhia, movimento)",
          "Acorda várias vezes durante a noite",
          "Fica acordada por longos períodos no meio da noite",
          "Acorda muito cedo e não volta a dormir",
          "Inverte o ciclo (dorme de dia e fica ativa de noite)",
          "Tem sono agitado, mexe-se muito ou range os dentes",
          "Tem terror noturno, pesadelos ou desperta gritando",
          "Apresenta sonolência ou cansaço diurno por sono insuficiente",
          "O sono dela atrapalha o sono da família",
          "Precisa de melatonina ou medicação para conseguir dormir",
        ],
      },
    ],
  },

  // ---- J26-018 — Mascaramento (camouflage) TEA em meninas ----
  "j26-018": {
    icon: Sparkles,
    gradient: "from-fuchsia-500 to-purple-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "O mascaramento frequentemente esconde o TEA em meninas e adolescentes (maior escore = mais camuflagem). Escore elevado, mesmo com boa adaptação aparente, justifica avaliação cuidadosa. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Mascaramento social (maior = mais camuflagem)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Camuflagem e compensação social",
        color: "text-fuchsia-600 dark:text-fuchsia-400",
        items: [
          "Observa e copia o jeito das outras pessoas de falar e se comportar para se encaixar",
          "Ensaia conversas, falas ou expressões antes de situações sociais",
          "Força o contato visual mesmo quando é desconfortável",
          "Esconde os próprios interesses ou estereotipias quando está com outras pessoas",
          "Imita personagens de filmes/séries para saber como agir socialmente",
          "Fica exausta depois de conviver socialmente (precisa se recolher)",
          "Finge entender piadas ou conversas que na verdade não acompanhou",
          "Segura os comportamentos na escola e “desmonta” só ao chegar em casa",
          "Tem amigas, mas sente que precisa “atuar” um papel para mantê-las",
          "Sente-se diferente das outras meninas, mas esconde isso",
          "Planeja as respostas sociais conscientemente em vez de fluir naturalmente",
          "Evita situações sociais novas por medo de não saber se comportar",
          "Apresenta ansiedade ligada ao esforço de parecer “normal”",
          "Reprime emoções em público e extravasa em particular",
          "Passou despercebida em avaliações anteriores por “se comportar bem”",
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

  // ---- J26-023 — Função Executiva TEA (dificuldades; maior = mais problema) ----
  "j26-023": {
    icon: Sparkles,
    gradient: "from-amber-500 to-yellow-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Avalia dificuldades executivas no cotidiano (maior escore = mais dificuldade). Orienta os suportes em casa e na escola. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Dificuldades executivas (maior = mais problema)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Função executiva no dia a dia",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Tem dificuldade de começar uma tarefa sozinha (precisa de empurrão)",
          "Trava ou tem crise quando muda a rotina ou o plano (inflexibilidade)",
          "Esquece o que tem que fazer no meio do caminho (memória de trabalho)",
          "Tem dificuldade de organizar materiais, mochila ou tarefas",
          "Age sem pensar nas consequências (impulsividade)",
          "Tem dificuldade de planejar os passos de uma atividade",
          "Não consegue parar uma atividade prazerosa para fazer outra",
          "Tem dificuldade de executar uma sequência de várias etapas",
          "Fica preso em um detalhe e não enxerga o todo",
          "Tem dificuldade de controlar a emoção quando frustrada",
          "Precisa ser lembrada o tempo todo das mesmas regras e rotinas",
          "Tem dificuldade de terminar o que começou (persistência)",
          "Demora muito para se adaptar a uma instrução nova",
          "Perde ou esquece objetos com frequência",
        ],
      },
    ],
  },

  // ---- J26-024 — Rastreio de TEA em adolescentes/adultos jovens (autorrelato) ----
  "j26-024": {
    icon: Sparkles,
    gradient: "from-violet-500 to-indigo-600",
    instruction:
      "Para cada frase, marque o quanto ela combina com você no dia a dia. Não há resposta certa ou errada — responda com sinceridade. Responda todos os itens.",
    infoBox:
      "Rastreio de traços autistas em quem chegou à adolescência sem diagnóstico (maior escore = mais traços). Escore elevado indica encaminhamento para avaliação diagnóstica. Não é diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Traços autistas (maior = mais traços)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Autorrelato de traços do espectro",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Acho difícil entender o que as pessoas estão pensando ou sentindo",
          "Prefiro fazer as coisas sempre da mesma maneira",
          "Fico sobrecarregado(a) com sons, luzes, cheiros ou texturas",
          "Acho difícil manter conversas informais (“conversa fiada”)",
          "Tenho interesses muito intensos e específicos",
          "Sinto-me esgotado(a) depois de situações sociais",
          "Acho difícil fazer e manter amizades",
          "Não percebo quando alguém está entediado ou incomodado comigo",
          "Prefiro rotinas e fico ansioso(a) com mudanças inesperadas",
          "Levo as coisas ao pé da letra (dificuldade com ironia e sentido figurado)",
          "Sinto que tenho que “atuar” para parecer como os outros",
          "Tenho movimentos ou hábitos repetitivos que me acalmam",
          "Tenho dificuldades sociais desde a infância",
          "Evito contato visual ou ele me deixa desconfortável",
          "Sinto-me diferente das pessoas da minha idade",
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

  // ---- J26-028 — Necessidade de Suporte TEA (níveis DSM-5) ----
  "j26-028": {
    icon: ClipboardList,
    gradient: "from-rose-500 to-red-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Estrutura a avaliação da necessidade de suporte (maior escore = mais suporte). Apoia a definição dos níveis 1/2/3 do DSM-5 (apoio / apoio substancial / apoio muito substancial). O juízo clínico final é do profissional.",
    labels: SEVERITY_LABELS,
    totalLabel: "Necessidade de suporte (maior = mais suporte)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Comunicação social",
        color: "text-rose-600 dark:text-rose-400",
        items: [
          "Precisa de apoio para iniciar interações sociais",
          "Tem respostas sociais reduzidas ou atípicas às aproximações dos outros",
          "Comunicação verbal/não-verbal limitada para a idade",
          "Interesse social reduzido por crianças da mesma idade",
          "Dificuldade marcante para se adaptar a diferentes contextos sociais",
          "Necessita de muito suporte para funcionar na escola/ambientes sociais",
        ],
      },
      {
        name: "Comportamentos restritos e repetitivos",
        color: "text-rose-600 dark:text-rose-400",
        items: [
          "Inflexibilidade que interfere no funcionamento em vários contextos",
          "Grande dificuldade para mudar de foco ou de atividade",
          "Comportamentos repetitivos evidentes e frequentes",
          "Rituais ou insistência na mesmice que atrapalham o cotidiano",
          "Reações intensas a mudanças (crises)",
          "Interesses restritos que limitam a participação em atividades",
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
};

/** Retorna a definição interativa de uma escala, se existir. */
export function getInteractiveScale(id: string | undefined): InteractiveScaleDef | undefined {
  return id ? interactiveScaleItems[id] : undefined;
}
