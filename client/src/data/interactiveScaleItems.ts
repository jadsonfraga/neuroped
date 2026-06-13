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
  ClipboardList, ShieldAlert, type LucideIcon,
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

  // ============================================================
  // LOTE 3 — Categoria 3: TDAH e Funções Executivas (autoral)
  // ============================================================

  // ---- J26-031 — Disregulação Emocional no TDAH ----
  "j26-031": {
    icon: Activity,
    gradient: "from-orange-500 to-red-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Avalia a disregulação emocional ligada ao TDAH (maior escore = mais intensa). Orienta a decisão sobre adjuvantes e manejo. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Disregulação emocional (maior = mais intensa)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Regulação emocional no cotidiano",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Explode de raiva por coisas pequenas",
          "Passa de calma a muito irritada rapidamente (pavio curto)",
          "Tem dificuldade de se acalmar depois de irritada",
          "Chora ou fica muito frustrada ao errar ou perder",
          "Reage de forma exagerada a um “não”",
          "Tem crises ao mudar de atividade ou ao ser interrompida",
          "Fica irritada quando algo não sai como esperava",
          "A intensidade da emoção é desproporcional à situação",
          "Tem dias de humor muito instável (oscila bastante)",
          "Descarrega a frustração em pessoas ou objetos",
          "Demora muito para “virar a chave” depois de chateada",
          "Fica facilmente sobrecarregada emocionalmente",
          "A irritabilidade atrapalha a convivência em casa",
          "A irritabilidade atrapalha a convivência na escola",
        ],
      },
    ],
  },

  // ---- J26-032 — Tempo Cognitivo Lento (SCT) ----
  "j26-032": {
    icon: Sparkles,
    gradient: "from-slate-500 to-blue-700",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Rastreia o Tempo Cognitivo Lento — perfil “sonhador/lento”, diferente do TDAH hiperativo (maior escore = mais sinais). Útil para diferenciar perfis. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Sinais de tempo cognitivo lento",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Perfil de lentidão/desligamento",
        color: "text-slate-600 dark:text-slate-300",
        items: [
          "Parece sonhando acordada, “na lua”",
          "É lenta para começar e terminar tarefas",
          "Processa as informações devagar (demora para a “ficha cair”)",
          "Confunde-se facilmente com instruções",
          "Fica olhando para o nada com frequência",
          "Tem pouca energia ou parece apática/desanimada",
          "Perde-se nos próprios pensamentos com facilidade",
          "Precisa que repitam várias vezes para entender",
          "Reage devagar quando é chamada",
          "Tem aparência sonolenta mesmo descansada",
          "Trabalha de forma lenta e desorganizada",
          "Parece desligada do que acontece ao redor",
          "Mistura ideias ou se atrapalha ao explicar algo",
          "É quieta e passiva (não é agitada como o TDAH clássico)",
        ],
      },
    ],
  },

  // ---- J26-033 — Perfil Desatenção vs Hiperatividade ----
  "j26-033": {
    icon: Activity,
    gradient: "from-teal-500 to-cyan-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Mapeia os dois eixos do TDAH (maior escore = mais sintomas). O detalhamento por domínio mostra qual perfil predomina — apoia tratamento e conversa com a escola. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Sintomas de TDAH (maior = mais sintomas)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Desatenção",
        color: "text-cyan-600 dark:text-cyan-400",
        items: [
          "Não presta atenção a detalhes / comete erros por descuido",
          "Tem dificuldade de manter a atenção em tarefas",
          "Parece não escutar quando falam diretamente com ela",
          "Não segue instruções até o fim / não termina tarefas",
          "Tem dificuldade de organizar tarefas e materiais",
          "Evita tarefas que exigem esforço mental contínuo",
          "Perde objetos necessários (material, brinquedos)",
          "Distrai-se com facilidade com estímulos externos",
          "Esquece atividades do dia a dia",
        ],
      },
      {
        name: "Hiperatividade / Impulsividade",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Mexe mãos e pés ou se remexe na cadeira",
          "Levanta-se quando deveria ficar sentada",
          "Corre ou sobe nas coisas em momentos inadequados",
          "Tem dificuldade de brincar em silêncio",
          "Está “a mil”, como se tivesse um motorzinho",
          "Fala em excesso",
          "Responde antes de a pergunta terminar",
          "Tem dificuldade de esperar a vez",
          "Interrompe ou se intromete nas conversas e brincadeiras",
        ],
      },
    ],
  },

  // ---- J26-034 — Função Executiva no Cotidiano (casa e escola) ----
  "j26-034": {
    icon: Sparkles,
    gradient: "from-amber-500 to-yellow-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Avalia a função executiva no dia a dia (maior escore = mais dificuldade), separando casa e escola. Mais prático que teste de laboratório. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Dificuldades executivas (maior = mais dificuldade)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Em casa",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Precisa de ajuda para começar as tarefas",
          "Esquece o que foi pedido no meio do caminho",
          "Tem dificuldade de organizar o quarto e os materiais",
          "Não consegue seguir uma rotina sem lembretes",
          "Tem dificuldade de administrar o tempo (atrasa, enrola)",
          "Abandona as tarefas antes de terminar",
        ],
      },
      {
        name: "Na escola",
        color: "text-yellow-600 dark:text-yellow-400",
        items: [
          "Tem dificuldade de planejar e iniciar as atividades",
          "Não anota ou esquece as tarefas de casa",
          "Perde materiais e prazos",
          "Tem dificuldade de manter o foco até terminar",
          "Atrapalha-se com tarefas de várias etapas",
          "Precisa de mediação constante do professor",
        ],
      },
    ],
  },

  // ---- J26-035 — Percepção e Gestão do Tempo ----
  "j26-035": {
    icon: Sparkles,
    gradient: "from-indigo-500 to-violet-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Avalia a percepção e a gestão do tempo (maior escore = mais dificuldade). Comum no TDAH e muito ligado ao prejuízo funcional. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Dificuldade com o tempo (maior = mais dificuldade)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Percepção e gestão do tempo",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Vive atrasada para tudo",
          "Não consegue estimar quanto tempo uma tarefa vai levar",
          "Perde a noção de quanto tempo passou",
          "Perde a hora em atividades prazerosas (tela, jogo)",
          "Deixa tudo para a última hora",
          "Esquece horários e compromissos",
          "Tem dificuldade de cumprir prazos",
          "Não percebe quando está demorando demais",
          "Precisa de alarmes e lembretes para se organizar no tempo",
          "Subestima o tempo necessário para se arrumar e sair",
          "Distrai-se e “o tempo voa” sem perceber",
          "Tem dificuldade de manter uma agenda ou rotina horária",
        ],
      },
    ],
  },

  // ---- J26-036 — Sensibilidade a Recompensa e Motivação ----
  "j26-036": {
    icon: Sparkles,
    gradient: "from-pink-500 to-fuchsia-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Avalia o perfil motivacional (maior escore = mais dependência de recompensa imediata). Orienta estratégias de reforço (metas curtas, retorno imediato) em vez de punição. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Desafio motivacional (maior = mais dependência de recompensa)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Sensibilidade a recompensa",
        color: "text-pink-600 dark:text-pink-400",
        items: [
          "Só se esforça quando a recompensa é imediata",
          "Desiste se o prêmio demora a vir",
          "Não responde a consequências de longo prazo (notas, futuro)",
          "Precisa de estímulo constante para manter o esforço",
          "Cansa rápido de recompensas repetidas (precisa de novidade)",
          "Reage muito mal a punições, sem mudar o comportamento",
          "Busca gratificação imediata mesmo com prejuízo depois",
          "Tem dificuldade de adiar um prazer para conseguir algo melhor",
          "Perde o interesse rápido por atividades sem retorno imediato",
          "Funciona bem com recompensa, mas “trava” sem ela",
          "Não conecta o esforço de hoje com o resultado de amanhã",
          "Rende melhor com metas pequenas e frequentes",
        ],
      },
    ],
  },

  // ---- J26-037 — Memória de Trabalho (contexto escolar) ----
  "j26-037": {
    icon: Sparkles,
    gradient: "from-blue-500 to-indigo-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Triagem da memória de trabalho no cotidiano escolar (maior escore = mais dificuldade). Professores identificam com facilidade. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Dificuldade de memória de trabalho",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Memória de trabalho no dia a dia",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Esquece a instrução antes de chegar a executá-la",
          "Perde a sequência do que estava fazendo",
          "Copia errado ou incompleto do quadro",
          "Esquece parte de pedidos com vários passos",
          "Perde o fio do raciocínio no meio de uma conta/tarefa",
          "Precisa que repitam as instruções",
          "Esquece o que ia falar no meio da frase",
          "Tem dificuldade de fazer cálculo mental",
          "Confunde a ordem dos passos de uma atividade",
          "Esquece regras combinadas há pouco",
          "Tem dificuldade de seguir histórias ou explicações longas",
          "Precisa de apoio visual (lista, lembrete) para não esquecer",
        ],
      },
    ],
  },

  // ---- J26-038 — Impulsividade (motora, verbal, cognitiva) ----
  "j26-038": {
    icon: Activity,
    gradient: "from-red-500 to-orange-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Mapeia os três tipos de impulsividade (maior escore = mais intensa). O detalhamento por domínio ajuda a personalizar o tratamento. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Impulsividade (maior = mais intensa)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Impulsividade motora",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Age sem pensar nas consequências",
          "Mexe em tudo, não consegue ficar parada",
          "Sai correndo ou se arrisca sem avaliar o perigo",
          "Pega objetos ou coisas sem pedir",
        ],
      },
      {
        name: "Impulsividade verbal",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Fala sem esperar a vez",
          "Responde antes de a pergunta terminar",
          "Interrompe conversas e brincadeiras",
          "Fala o que vem à cabeça, sem filtro",
        ],
      },
      {
        name: "Impulsividade cognitiva",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Decide sem analisar as opções",
          "Faz provas e tarefas rápido demais e erra por isso",
          "Muda de ideia ou de atividade impulsivamente",
          "Tem dificuldade de parar para planejar antes de agir",
        ],
      },
    ],
  },

  // ---- J26-039 — Impacto do TDAH na Autoestima ----
  "j26-039": {
    icon: Heart,
    gradient: "from-rose-500 to-red-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Rastreia o sofrimento secundário do TDAH (maior escore = mais sofrimento/autoimagem negativa). Escore alto pede suporte emocional e cuidado com a autoestima. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Sofrimento e autoimagem negativa",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Autoestima e autoimagem",
        color: "text-rose-600 dark:text-rose-400",
        items: [
          "Acha que é “burra”, “preguiçosa” ou “problemática”",
          "Sente que decepciona os pais ou professores",
          "Acha que se esforça mais que os outros e mesmo assim vai mal",
          "Sente-se diferente ou pior que os colegas",
          "Desiste fácil por achar que “não vai dar certo”",
          "Evita tentar coisas novas por medo de errar",
          "Fica muito abalada com críticas",
          "Fala mal de si mesma (“sou um fracasso”)",
          "Acha que os outros não gostam dela",
          "Sente vergonha do próprio comportamento",
          "Mostra tristeza ou desânimo ligados às dificuldades",
          "Perdeu a confiança em conseguir melhorar",
        ],
      },
    ],
  },

  // ---- J26-040 — Problemas de Sono no TDAH ----
  "j26-040": {
    icon: Sparkles,
    gradient: "from-indigo-500 to-blue-700",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Avalia o sono na criança com TDAH (maior escore = mais problemas), antes e durante o tratamento. Base para discutir rotina e medicação com o médico. Não é diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Alterações do sono (maior = mais problemas)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Padrão de sono",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Demora muito para pegar no sono (mente “a mil”)",
          "Resiste à hora de dormir",
          "Acorda várias vezes durante a noite",
          "Tem sono agitado, mexe-se muito",
          "Acorda cansada mesmo tendo dormido",
          "Tem sonolência durante o dia",
          "Tem dificuldade de acordar de manhã",
          "O sono piorou após iniciar o estimulante",
          "Range os dentes ou fala dormindo",
          "Tem horário de sono irregular",
          "Precisa de companhia ou condições específicas para dormir",
          "A falta de sono piora o comportamento no dia seguinte",
        ],
      },
    ],
  },

  // ---- J26-041 — Impacto do TDAH na Dinâmica Familiar ----
  "j26-041": {
    icon: Heart,
    gradient: "from-rose-500 to-pink-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Avalia a sobrecarga familiar (maior escore = mais impacto). Escore alto indica necessidade de suporte e orientação parental. Não é diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Sobrecarga familiar (maior = mais impacto)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Impacto na família",
        color: "text-rose-600 dark:text-rose-400",
        items: [
          "A rotina da casa gira em torno do comportamento da criança",
          "Os pais se sentem esgotados ou estressados",
          "Há brigas frequentes por causa do comportamento",
          "O casal discorda sobre como lidar",
          "Os irmãos são afetados (menos atenção, mais conflitos)",
          "A família evita sair ou receber visitas por causa das crises",
          "Os pais se sentem julgados por outras pessoas",
          "A hora da tarefa de casa é um campo de batalha",
          "Os pais perdem a paciência mais do que gostariam",
          "Falta tempo e energia para o autocuidado dos pais",
          "A família se sente sozinha ou sem suporte",
          "O estresse afeta o trabalho ou a saúde dos pais",
        ],
      },
    ],
  },

  // ---- J26-042 — Triagem de TDAH Pré-Escolar (3-6 anos) ----
  "j26-042": {
    icon: Baby,
    gradient: "from-teal-500 to-emerald-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Triagem adaptada ao pré-escolar (maior escore = mais sintomas). O TDAH pode iniciar antes dos 7 anos — observe persistência e prejuízo, sem confundir com a agitação normal da idade. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Sintomas pré-escolares (maior = mais sintomas)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Desatenção (pré-escolar)",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Troca de brincadeira o tempo todo, não termina nenhuma",
          "Não para de ouvir uma história curta",
          "Distrai-se com qualquer coisa",
          "Parece não ouvir quando é chamada",
          "Esquece o que ia fazer",
        ],
      },
      {
        name: "Hiperatividade / Impulsividade (pré-escolar)",
        color: "text-emerald-600 dark:text-emerald-400",
        items: [
          "Não para quieta, está sempre em movimento",
          "Corre e sobe nas coisas o tempo todo",
          "Tem dificuldade de esperar a vez",
          "Não consegue brincar com calma",
          "Age sem perceber o perigo",
          "Pega as coisas dos colegas sem pedir",
          "Tem mais crises e agitação que outras crianças da idade",
        ],
      },
    ],
  },

  // ---- J26-043 — TDAH na Adolescência (perfil, impacto e riscos) ----
  "j26-043": {
    icon: Activity,
    gradient: "from-violet-500 to-purple-600",
    instruction:
      "Para cada frase, marque o quanto descreve o adolescente no dia a dia. Pode ser respondido pelo próprio jovem ou pelos pais. Responda todos os itens.",
    infoBox:
      "Avalia o TDAH na adolescência (maior escore = mais impacto). Os itens de risco (substâncias, comportamento, autoestima) merecem conversa clínica direcionada. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Impacto do TDAH na adolescência",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Perfil, impacto e riscos",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Não termina o que começa (tarefas, projetos)",
          "Procrastina e deixa tudo para a última hora",
          "Tem desempenho escolar abaixo do seu potencial",
          "Passa tempo excessivo no celular ou em jogos",
          "Tem dificuldade de organização e gestão do tempo",
          "Esquece compromissos e prazos",
          "Age por impulso e se arrepende depois",
          "Tem comportamentos de risco (trânsito, brigas)",
          "Irrita-se ou se frustra com facilidade",
          "Tem conflitos frequentes com a família",
          "Tem baixa autoestima ligada às dificuldades",
          "Tem curiosidade ou já experimentou álcool/substâncias",
          "Tem dificuldade de manter a motivação nos estudos",
          "Sente que “não consegue acompanhar” os colegas",
        ],
      },
    ],
  },

  // ---- J26-044 — Monitorização de Efeitos do Estimulante (frequência) ----
  "j26-044": {
    icon: Activity,
    gradient: "from-cyan-500 to-teal-600",
    instruction:
      "Marque a frequência de cada efeito desde o início (ou ajuste) do remédio. Use nas primeiras semanas e a cada mudança de dose. Responda todos os itens.",
    infoBox:
      "Monitorização de efeitos do metilfenidato/anfetaminas (maior escore = mais efeitos). Relate ao médico para ajuste de dose ou horário. Não suspenda a medicação por conta própria.",
    labels: FREQ_LABELS,
    totalLabel: "Carga de efeitos adversos",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Efeitos observados",
        color: "text-cyan-600 dark:text-cyan-400",
        items: [
          "Perda de apetite / come menos",
          "Dificuldade para dormir / insônia",
          "Dor de cabeça",
          "Dor de barriga ou náusea",
          "Fica muito quieta ou “apagada” (efeito robô)",
          "Fica irritada ou chorosa, principalmente no fim da tarde",
          "Tiques ou movimentos novos",
          "Coração acelerado ou queixa de palpitação",
          "Tontura",
          "Perda de peso",
          "Humor mais triste ou ansioso",
          "Boca seca",
          "Volta forte dos sintomas quando o efeito passa (rebote)",
          "Choro fácil ou sensibilidade aumentada",
        ],
      },
    ],
  },

  // ---- J26-045 — Uso de Telas e Impacto no TDAH ----
  "j26-045": {
    icon: Activity,
    gradient: "from-slate-500 to-indigo-700",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Avalia o uso de telas e seu impacto (maior escore = mais problemático). O excesso pode agravar sintomas e sono no TDAH. Escore alto orienta um plano de manejo de telas. Não é diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Impacto do uso de telas (maior = mais problemático)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Uso de telas no cotidiano",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Passa muitas horas por dia em telas",
          "Tem crise ou raiva quando a tela é retirada",
          "A tela é a única coisa que a acalma",
          "O uso de tela atrapalha o sono",
          "Troca brincadeiras, estudo ou convívio por tela",
          "Fica mais agitada ou irritada depois de muito tempo de tela",
          "Usa tela durante as refeições",
          "Usa tela na cama, antes de dormir",
          "Mente ou esconde o tempo de uso",
          "Tem dificuldade de parar sozinha",
          "Prefere conteúdos muito acelerados e estimulantes",
          "O uso de tela vira motivo de briga em casa",
        ],
      },
    ],
  },

  // ============================================================
  // LOTE 4 — Categoria 4: Comportamento e Conduta (autoral)
  // ============================================================

  // ---- J26-046 — Transtorno Opositor Desafiador (TOD) ----
  "j26-046": {
    icon: Activity,
    gradient: "from-orange-500 to-red-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Triagem de comportamento opositor-desafiador (maior escore = mais sintomas). Avalie persistência e prejuízo em mais de um ambiente. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Comportamento opositor (maior = mais sintomas)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Oposição e desafio",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Perde a paciência com facilidade",
          "Discute com adultos e questiona as regras",
          "Desafia ou recusa ativamente cumprir pedidos e regras",
          "Provoca ou irrita os outros de propósito",
          "Culpa os outros pelos próprios erros ou comportamento",
          "É facilmente incomodada ou aborrecida pelos outros",
          "Fica com raiva e ressentida",
          "É rancorosa ou vingativa",
          "Faz de propósito o contrário do que é pedido",
          "Tem explosões frequentes diante de limites",
          "O comportamento desafiador atrapalha em casa",
          "O comportamento desafiador atrapalha na escola",
          "Mantém o desafio mesmo com consequências",
          "Tem grande dificuldade de aceitar um “não”",
        ],
      },
    ],
  },

  // ---- J26-047 — Problemas de Conduta ----
  "j26-047": {
    icon: ClipboardList,
    gradient: "from-red-600 to-rose-700",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Rastreio de problemas de conduta e comportamento antissocial (maior escore = mais grave). Escore elevado exige avaliação especializada e abordagem multidisciplinar. Não é diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Problemas de conduta (maior = mais grave)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Conduta e comportamento antissocial",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Entra em brigas físicas",
          "Intimida, ameaça ou amedronta os outros",
          "Foi cruel fisicamente com pessoas",
          "Foi cruel com animais",
          "Destrói propriedade alheia de propósito",
          "Pega coisas que não são suas / furta",
          "Mente para obter vantagens ou evitar obrigações",
          "Falta à escola sem permissão (mata aula)",
          "Foge ou ameaça fugir de casa",
          "Usa arma ou objeto para machucar",
          "Desrespeita regras importantes de forma grave",
          "Não demonstra culpa após machucar ou prejudicar",
          "Envolve-se em comportamentos perigosos ou ilegais",
          "O comportamento já gerou problemas sérios (escola, lei)",
        ],
      },
    ],
  },

  // ---- J26-048 — Controle da Raiva e Tolerância à Frustração ----
  "j26-048": {
    icon: Activity,
    gradient: "from-orange-500 to-red-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Avalia o controle da raiva e a tolerância à frustração (maior escore = mais intenso). Base para planejar a intervenção comportamental. Não é diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Raiva e frustração (maior = mais intensa)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Raiva e manejo da frustração",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Explode quando as coisas não saem como quer",
          "Joga ou quebra objetos na raiva",
          "Bate, chuta ou empurra durante a crise",
          "As crises duram muito tempo",
          "Tem dificuldade de se acalmar sozinha",
          "A intensidade da raiva é desproporcional à situação",
          "Frustra-se muito ao perder em jogos",
          "Não tolera esperar",
          "Reage com raiva a correções ou limites",
          "Grita ou xinga quando frustrada",
          "As crises acontecem várias vezes ao dia",
          "A raiva atrapalha as relações com a família",
          "A raiva atrapalha na escola",
          "Tem dificuldade de retomar a calma e seguir em frente",
        ],
      },
    ],
  },

  // ---- J26-049 — Agressividade com Pares e Bullying ----
  "j26-049": {
    icon: Activity,
    gradient: "from-red-500 to-orange-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Identifica o papel de agressor, vítima ou ambos no contexto escolar (maior escore = mais envolvimento). Permite ação conjunta com a escola. Não é diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Envolvimento em agressão/bullying",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Como agressor",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Bate, empurra ou machuca os colegas",
          "Xinga, humilha ou apelida os colegas",
          "Exclui ou espalha fofocas para isolar alguém (agressão relacional)",
          "Ameaça ou intimida outras crianças",
          "Tira coisas dos colegas à força",
          "Lidera ou incentiva outros a implicar com alguém",
        ],
      },
      {
        name: "Como vítima",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "É alvo de apelidos, humilhações ou zoação",
          "Apanha, é empurrada ou machucada pelos colegas",
          "É excluída ou isolada pelo grupo",
          "Tem medo de ir à escola por causa dos colegas",
          "Volta da escola triste, calada ou com pertences danificados",
          "Evita falar sobre o que acontece com os colegas",
        ],
      },
    ],
  },

  // ---- J26-050 — Traços Calosos-Emocionais (CU) ----
  "j26-050": {
    icon: ClipboardList,
    gradient: "from-slate-500 to-gray-700",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Rastreio de traços calosos-emocionais, relevantes no prognóstico da conduta (maior escore = mais traços). NÃO é um rótulo — exige avaliação clínica especializada e abordagem cuidadosa. Não é diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Traços calosos-emocionais",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Empatia, culpa e afeto",
        color: "text-slate-600 dark:text-slate-300",
        items: [
          "Não demonstra culpa ou remorso ao fazer algo errado",
          "Parece indiferente ao sofrimento dos outros",
          "Não se importa em ir mal na escola ou decepcionar",
          "Mostra pouca emoção ou afeto superficial",
          "Não se abala com punições ou consequências",
          "Usa charme ou simpatia de forma superficial para conseguir o que quer",
          "Não mantém amizades verdadeiras",
          "É frio(a) ou calculista no trato",
          "Mente com facilidade e sem desconforto",
          "Não se responsabiliza pelos próprios atos",
          "Magoa os outros sem se importar",
          "Tem dificuldade de demonstrar afeto genuíno",
          "Mostra empatia apenas quando lhe convém",
          "Não muda o comportamento mesmo após prejudicar alguém",
        ],
      },
    ],
  },

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

  // ---- J26-052 — Birra Patológica vs Normativa ----
  "j26-052": {
    icon: Baby,
    gradient: "from-amber-500 to-orange-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Ajuda a diferenciar a birra normal (2–3 anos) da oposição patológica (maior escore = mais sinais de alerta). Vários itens marcados merecem avaliação. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Sinais de alerta nas crises (maior = mais atípico)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Características das crises",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "As crises duram mais de 15 minutos",
          "Tem várias crises por dia",
          "Machuca a si mesma durante a crise",
          "Machuca outras pessoas durante a crise",
          "Destrói objetos durante a crise",
          "As crises acontecem mesmo sem motivo aparente",
          "Não consegue se acalmar de jeito nenhum",
          "As crises acontecem também com pessoas fora da família",
          "Fica esgotada ou exausta após a crise",
          "As crises são desproporcionais para a idade",
          "O comportamento piora em vez de melhorar com o tempo",
          "As crises atrapalham seriamente a rotina da família",
        ],
      },
    ],
  },

  // ---- J26-053 — Mudanças Comportamentais Pós-Pandemia ----
  "j26-053": {
    icon: Heart,
    gradient: "from-blue-500 to-indigo-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Avalia mudanças comportamentais após o período de isolamento (maior escore = mais mudanças). Orienta o suporte emocional e o retorno à rotina. Não é diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Mudanças pós-pandemia (maior = mais alterações)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Mudanças observadas",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Ficou mais ansiosa ou medrosa após a pandemia",
          "Ficou mais agressiva ou irritada",
          "Tem dificuldade de brincar e conviver com outras crianças",
          "Ficou mais apegada e insegura",
          "Regrediu em habilidades (fala, sono, uso do banheiro)",
          "Aumentou muito o uso de telas",
          "Tem mais medo de sair de casa ou de lugares cheios",
          "Tem dificuldade de se separar dos pais",
          "Piorou o sono",
          "Está mais retraída ou isolada",
          "Tem mais crises de choro ou raiva",
          "Tem dificuldade de voltar à rotina escolar",
          "Mostra tristeza ou desânimo",
          "Mudou o apetite",
        ],
      },
    ],
  },

  // ---- J26-054 — Comportamento Digital e Uso da Internet ----
  "j26-054": {
    icon: Activity,
    gradient: "from-slate-500 to-indigo-700",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Rastreio de saúde digital (maior escore = mais problemático). Itens de risco (contato com desconhecidos, conteúdo inadequado) exigem conversa direta. Não é diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Comportamento digital (maior = mais problemático)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Uso digital e internet",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Tem explosão de raiva quando a tela é retirada",
          "Mente sobre o tempo que passa em telas",
          "Esconde-se para usar o celular ou o jogo",
          "Perdeu interesse por outras atividades",
          "Isola-se socialmente por causa das telas",
          "Usa telas até de madrugada",
          "Fica irritada ou ansiosa sem acesso à tela",
          "Negligencia tarefas e estudos pelo uso digital",
          "Tem conflitos frequentes em casa por causa das telas",
          "Acessa conteúdos inadequados para a idade",
          "Interage com desconhecidos online",
          "O uso digital prejudica o sono",
          "Não consegue cumprir os limites de tempo combinados",
          "Mostra sinais de dependência (não consegue parar)",
        ],
      },
    ],
  },

  // ---- J26-055 — Automutilação Não Suicida (NSSI) ----
  "j26-055": {
    icon: ShieldAlert,
    gradient: "from-rose-600 to-red-700",
    instruction:
      "Marque a frequência de cada comportamento nos últimos meses. Responda com sinceridade e sem julgamento — esta é uma ferramenta de cuidado. Responda todos os itens.",
    infoBox:
      "Rastreio de automutilação não suicida, SEM julgamento. Qualquer resposta positiva exige avaliação clínica de segurança e suporte em saúde mental. Não é diagnóstico. Em risco de vida, procure urgência — CVV 188, SAMU 192.",
    labels: FREQ_LABELS,
    totalLabel: "Comportamento autolesivo (frequência)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Autolesão não suicida",
        color: "text-rose-600 dark:text-rose-400",
        items: [
          "Arranha-se de propósito até machucar",
          "Corta a própria pele de propósito",
          "Queima a própria pele de propósito",
          "Bate em si mesma ou bate a cabeça de propósito",
          "Belisca ou fere a pele de propósito",
          "Morde a si mesma a ponto de machucar",
          "Impede que feridas cicatrizem",
          "Faz isso para aliviar uma dor emocional ou tensão",
          "Esconde as marcas (roupas, faixas)",
          "Sente alívio momentâneo após se machucar",
          "Pensa em se machucar quando está mal",
          "Já precisou de cuidado médico por causa disso",
        ],
      },
    ],
  },

  // ---- J26-056 — Comportamento Alimentar Restritivo e Purgativo ----
  "j26-056": {
    icon: ShieldAlert,
    gradient: "from-fuchsia-500 to-rose-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Rastreio de comportamento alimentar de risco (maior escore = mais sinais). Sinais positivos exigem avaliação médica (inclui risco clínico) e suporte especializado. Não é diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Comportamento alimentar de risco",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Restrição, compulsão e purgação",
        color: "text-fuchsia-600 dark:text-fuchsia-400",
        items: [
          "Restringe a quantidade de comida ou pula refeições",
          "Tem medo intenso de engordar",
          "Preocupa-se excessivamente com o peso e a forma do corpo",
          "Conta calorias de forma obsessiva",
          "Evita comer na frente dos outros",
          "Faz exercício de forma excessiva para “queimar” comida",
          "Provoca vômito depois de comer",
          "Usa laxantes ou diuréticos para controlar o peso",
          "Tem episódios de comer muito com sensação de descontrole",
          "Sente culpa ou vergonha intensa após comer",
          "Verifica o corpo no espelho ou se pesa repetidamente",
          "Perdeu peso de forma preocupante",
          "Esconde alimentos ou comportamentos alimentares",
          "O peso e a comida dominam os pensamentos",
        ],
      },
    ],
  },

  // ---- J26-057 — Estratégias de Regulação Emocional (habilidade) ----
  "j26-057": {
    icon: Heart,
    gradient: "from-pink-500 to-rose-600",
    instruction: DEV_INSTRUCTION,
    infoBox:
      "Avalia as estratégias de regulação emocional (maior escore = mais recursos). Orienta o trabalho de habilidades socioemocionais. Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS,
    totalLabel: "Regulação emocional (maior = mais recursos)",
    bands: DEV_BANDS,
    domains: [
      {
        name: "Estratégias de regulação",
        color: "text-pink-600 dark:text-pink-400",
        items: [
          "Consegue se acalmar sozinha quando fica chateada",
          "Nomeia o que está sentindo (“estou bravo”, “estou triste”)",
          "Pede ajuda quando está mal",
          "Espera a emoção forte passar antes de agir",
          "Aceita o consolo de um adulto",
          "Usa estratégias para se acalmar (respirar, se afastar, beber água)",
          "Recupera-se em tempo razoável após uma frustração",
          "Fala sobre o que sentiu depois que se acalma",
          "Tolera pequenas frustrações sem explodir",
          "Adapta a reação ao tamanho do problema",
          "Expressa a raiva sem agredir",
          "Volta a se concentrar depois de um abalo emocional",
        ],
      },
    ],
  },

  // ============================================================
  // LOTE 5 — Categoria 5: Ansiedade Infantil (autoral)
  // ============================================================

  // ---- J26-058 — Ansiedade de Separação ----
  "j26-058": {
    icon: Heart,
    gradient: "from-indigo-500 to-blue-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Triagem da ansiedade de separação além do esperado para a idade (maior escore = mais intensa). Diferencia do apego seguro. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Ansiedade de separação (maior = mais intensa)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Medo de separação",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Fica muito aflita ao se separar dos pais",
          "Chora ou tem crise quando os pais saem",
          "Recusa-se a dormir sozinha ou longe dos pais",
          "Tem pesadelos com separação ou perda dos pais",
          "Preocupa-se que algo ruim aconteça aos pais",
          "Não quer ir à escola por medo de se separar",
          "Precisa saber o tempo todo onde os pais estão",
          "Tem queixas físicas (dor de barriga, cabeça) ao se separar",
          "Gruda nos pais em casa, segue de cômodo em cômodo",
          "Recusa ficar com babá, avós ou outros cuidadores",
          "Tem medo de ficar sozinha em um cômodo",
          "A ansiedade de separação atrapalha a rotina da família",
        ],
      },
    ],
  },

  // ---- J26-059 — Fobia Social Infantil ----
  "j26-059": {
    icon: ShieldAlert,
    gradient: "from-blue-500 to-indigo-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Avalia o medo de ser julgado e de situações sociais (maior escore = mais intenso). Diferencia timidez de fobia social com prejuízo. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Fobia social (maior = mais intensa)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Ansiedade social",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Tem medo de falar ou se apresentar na frente dos outros",
          "Evita situações sociais novas",
          "Fica muito ansiosa de ser observada ou julgada",
          "Tem medo de fazer algo vergonhoso em público",
          "Fica calada ou retraída em grupos",
          "Evita levantar a mão ou participar na aula",
          "Tem dificuldade de iniciar conversas",
          "Recusa convites, festas ou atividades em grupo",
          "Tem sintomas físicos (rubor, suor, tremor) em situações sociais",
          "Preocupa-se muito antes de eventos sociais",
          "Tem poucos amigos por causa do medo social",
          "O medo social atrapalha a escola ou o dia a dia",
        ],
      },
    ],
  },

  // ---- J26-060 — Mutismo Seletivo ----
  "j26-060": {
    icon: MessageCircle,
    gradient: "from-violet-500 to-purple-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Avalia o mutismo seletivo além da timidez (maior escore = mais grave/abrangente). Diferencia de problemas de fala ou de língua. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Mutismo seletivo (maior = mais abrangente)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Fala por contexto",
        color: "text-violet-600 dark:text-violet-400",
        items: [
          "Fala em casa, mas não fala na escola",
          "Não fala com adultos fora da família",
          "Não fala com outras crianças em certos contextos",
          "Comunica-se por gestos em vez de falar fora de casa",
          "Fica paralisada ou travada quando esperam que fale",
          "O silêncio acontece consistentemente nos mesmos lugares",
          "O quadro já dura mais de um mês",
          "Atrapalha o desempenho ou a participação escolar",
          "Atrapalha as amizades",
          "Fica visivelmente ansiosa quando é pressionada a falar",
          "Usa sussurro ou monossílabos em vez de falar normalmente",
          "Não é por não saber a língua nem por problema de fala",
        ],
      },
    ],
  },

  // ---- J26-061 — Ansiedade Escolar e Recusa ----
  "j26-061": {
    icon: ShieldAlert,
    gradient: "from-amber-500 to-orange-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Mapeia a ansiedade escolar e a recusa de ir à escola (maior escore = mais intensa). Muito comum após a pandemia. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Ansiedade e recusa escolar",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Ansiedade ligada à escola",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "Tem dor de barriga ou de cabeça nas manhãs de escola",
          "Chora ou implora para não ir à escola",
          "Tem crise na hora de sair de casa",
          "Falta à escola por ansiedade",
          "Pede para ir embora mais cedo",
          "Tem medo específico ligado à escola (prova, professor, colega)",
          "Os sintomas somem nos fins de semana e nas férias",
          "Fica grudada nos pais antes da escola",
          "Tem dificuldade de entrar na sala",
          "Liga ou pede pelos pais o tempo todo durante a aula",
          "A recusa vem piorando",
          "A ansiedade escolar atrapalha o aprendizado",
        ],
      },
    ],
  },

  // ---- J26-062 — Ansiedade de Desempenho ----
  "j26-062": {
    icon: ShieldAlert,
    gradient: "from-orange-500 to-red-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Avalia a ansiedade de desempenho escolar e esportivo (maior escore = mais intensa). O perfeccionismo costuma estar por trás. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Ansiedade de desempenho",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Medo de errar e de avaliação",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Tem medo intenso de errar",
          "Fica muito ansiosa antes de provas",
          "Tem medo de tirar nota baixa",
          "Tem medo de decepcionar os pais ou professores",
          "Tem “branco” ou bloqueio na hora da prova ou apresentação",
          "Tem sintomas físicos antes de avaliações (náusea, tremor)",
          "Estuda em excesso por medo de falhar",
          "Evita competições ou apresentações",
          "É perfeccionista — nada está bom o bastante",
          "Chora ou se desespera com pequenos erros",
          "Subestima o próprio desempenho",
          "A ansiedade prejudica o resultado real",
        ],
      },
    ],
  },

  // ---- J26-063 — Fobias Específicas (mapa por intensidade) ----
  "j26-063": {
    icon: ShieldAlert,
    gradient: "from-rose-500 to-red-600",
    instruction:
      "Para cada item, marque a intensidade do medo da criança. Use para priorizar o tratamento e planejar a exposição gradual. Responda todos os itens.",
    infoBox:
      "Mapeamento de fobias específicas por intensidade (maior escore = medos mais intensos). Apoia o planejamento da exposição gradual. Triagem, não diagnóstico.",
    labels: ["Sem medo", "Medo leve", "Medo moderado", "Medo intenso"],
    totalLabel: "Carga de fobias (maior = medos mais intensos)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Medos específicos",
        color: "text-rose-600 dark:text-rose-400",
        items: [
          "Agulha, injeção ou sangue",
          "Cachorro ou outros animais",
          "Trovão, raio ou tempestade",
          "Escuro",
          "Altura",
          "Vômito (próprio ou dos outros)",
          "Palhaço ou pessoas fantasiadas",
          "Insetos (barata, aranha)",
          "Médico ou dentista",
          "Água / afogamento (piscina, mar)",
          "Lugares fechados",
          "Ficar sozinha",
          "Sons altos (fogos, balão estourando)",
          "Banheiros ou ralos",
        ],
      },
    ],
  },

  // ---- J26-064 — Ansiedade à Saúde (hipocondríaca) ----
  "j26-064": {
    icon: Heart,
    gradient: "from-teal-500 to-cyan-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Avalia a ansiedade excessiva com a saúde (maior escore = mais intensa). A busca por reasseguramento alimenta o ciclo. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Ansiedade à saúde",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Preocupação com a saúde",
        color: "text-teal-600 dark:text-teal-400",
        items: [
          "Preocupa-se demais com a possibilidade de ficar doente",
          "Interpreta qualquer sintoma como algo grave",
          "Busca reasseguramento o tempo todo (“estou bem?”)",
          "Pesquisa ou pergunta muito sobre doenças",
          "Pede com frequência para medir febre ou ser examinada",
          "Tem medo de morrer ou de que os pais adoeçam",
          "Fica atenta demais a sensações do corpo",
          "Evita lugares ou coisas por medo de contaminação/doença",
          "Pede para ir ao médico com frequência sem necessidade",
          "Sente sintomas físicos quando ansiosa com a saúde",
          "A preocupação atrapalha a rotina",
          "Não se tranquiliza mesmo após exames normais",
        ],
      },
    ],
  },

  // ---- J26-065 — Medos Noturnos e Pesadelos ----
  "j26-065": {
    icon: Sparkles,
    gradient: "from-indigo-500 to-blue-700",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Avalia medos noturnos, pesadelos e terror noturno (maior escore = mais intenso) e o impacto no sono. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Medos noturnos (maior = mais intensos)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Medos e eventos da noite",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Tem medo de dormir sozinha",
          "Precisa de luz ou companhia para dormir",
          "Tem pesadelos frequentes",
          "Acorda assustada à noite",
          "Tem episódios de terror noturno (grita, agitada, sem acordar direito)",
          "Tem medo do escuro",
          "Tem medo de monstros ou de coisas imaginárias",
          "Vai para a cama dos pais à noite",
          "Resiste a ir dormir por medo",
          "O medo noturno atrapalha o sono dela",
          "O medo noturno atrapalha o sono da família",
          "Fica ansiosa ao anoitecer",
        ],
      },
    ],
  },

  // ---- J26-066 — Ansiedade Generalizada (criança) ----
  "j26-066": {
    icon: ShieldAlert,
    gradient: "from-sky-500 to-blue-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Triagem do transtorno de ansiedade generalizada na criança (maior escore = mais intenso), com os efeitos físicos da preocupação. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Ansiedade generalizada (maior = mais intensa)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Preocupação excessiva",
        color: "text-sky-600 dark:text-sky-400",
        items: [
          "Preocupa-se com muitas coisas ao mesmo tempo",
          "Preocupa-se com o futuro ou com catástrofes",
          "Tem dificuldade de controlar as preocupações",
          "Pergunta “e se...” o tempo todo",
          "Busca reasseguramento constante",
          "Tem tensão muscular ou inquietação",
          "Tem dor de cabeça ou de barriga ligadas à preocupação",
          "Cansa-se com facilidade",
          "Tem dificuldade de concentração por estar preocupada",
          "Tem dificuldade para dormir por causa das preocupações",
          "É perfeccionista e autocrítica",
          "A preocupação atrapalha o dia a dia",
        ],
      },
    ],
  },

  // ---- J26-067 — Ansiedade Somática Funcional ----
  "j26-067": {
    icon: Heart,
    gradient: "from-rose-500 to-pink-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Mapeia queixas físicas sem causa orgânica como expressão de ansiedade (maior escore = mais associação). Sempre afastar causas clínicas primeiro. Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Somatização ansiosa (maior = mais associada à ansiedade)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Queixas somáticas funcionais",
        color: "text-rose-600 dark:text-rose-400",
        items: [
          "Tem dor de cabeça sem causa médica encontrada",
          "Tem dor de barriga recorrente sem causa orgânica",
          "As queixas aparecem em situações de estresse (escola, prova)",
          "Tem náusea ou enjoo ligados à ansiedade",
          "Tem tontura em momentos de tensão",
          "As queixas somem em casa, nos fins de semana ou nas férias",
          "Falta à escola por causa das queixas físicas",
          "Tem palpitação ou falta de ar sem causa cardíaca",
          "Tem tensão muscular ou dores no corpo",
          "As queixas aumentam quando há cobrança ou conflito",
          "Já fez exames que vieram normais",
          "As queixas físicas atrapalham a rotina",
        ],
      },
    ],
  },

  // ---- J26-068 — TAG Adolescente (autorrelato) ----
  "j26-068": {
    icon: ShieldAlert,
    gradient: "from-blue-500 to-indigo-600",
    instruction:
      "Para cada frase, marque o quanto descreve você nas últimas 2 semanas. Responda com sinceridade. Responda todos os itens.",
    infoBox:
      "Autorrelato de ansiedade generalizada na adolescência (maior escore = mais intensa). Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Ansiedade generalizada (autorrelato)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Sintomas de ansiedade",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Preocupo-me demais com várias coisas",
          "Tenho dificuldade de controlar as preocupações",
          "Não consigo relaxar",
          "Fico tenso(a) ou no limite com facilidade",
          "Canso-me rápido",
          "Tenho dificuldade de concentração",
          "Fico irritado(a) facilmente",
          "Tenho tensão muscular ou dores",
          "Tenho dificuldade para dormir",
          "Antecipo o pior nos cenários",
          "Preocupo-me com o que os outros pensam de mim",
          "A ansiedade atrapalha meus estudos ou minha vida",
        ],
      },
    ],
  },

  // ---- J26-069 — Pânico Adolescente ----
  "j26-069": {
    icon: ShieldAlert,
    gradient: "from-rose-600 to-red-700",
    instruction:
      "Marque o quanto cada item descreve as crises e os sintomas. Responda com sinceridade. Responda todos os itens.",
    infoBox:
      "Triagem do transtorno de pânico no adolescente (maior escore = mais intenso). Crises recorrentes merecem avaliação clínica. Não é diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Sintomas de pânico (maior = mais intensos)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Crises de pânico",
        color: "text-rose-600 dark:text-rose-400",
        items: [
          "Tem crises súbitas de medo intenso",
          "O coração dispara durante as crises",
          "Falta de ar ou sensação de sufocamento",
          "Tremores ou suor frio",
          "Tontura ou sensação de desmaio",
          "Sensação de que algo terrível vai acontecer",
          "Medo de morrer durante a crise",
          "Sensação de irrealidade ou de estar “fora de si”",
          "Formigamento ou dormência",
          "Medo de ter outra crise (ansiedade antecipatória)",
          "Evita lugares onde já teve crises",
          "As crises atrapalham a rotina",
        ],
      },
    ],
  },

  // ============================================================
  // LOTE 6 — Categoria 6: Depressão e Humor (autoral)
  // (J26-072 — Diário de Humor — segue como ferramenta diária, não escala)
  // ============================================================

  // ---- J26-070 — Anedonia Infantil ----
  "j26-070": {
    icon: Heart,
    gradient: "from-sky-500 to-blue-700",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Triagem da anedonia — perda de prazer e interesse (maior escore = mais intensa). Sintoma central da depressão. Não é diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Anedonia (maior = mais intensa)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Perda de prazer e interesse",
        color: "text-sky-600 dark:text-sky-400",
        items: [
          "Perdeu o interesse pelas coisas de que gostava",
          "Não se anima nem com brincadeiras ou atividades favoritas",
          "Parece sem graça, apática",
          "Não demonstra prazer ao receber algo bom",
          "Recusa convites e passeios que antes adorava",
          "Brinca menos do que antes",
          "Não ri nem se diverte como antes",
          "Isola-se, fica no quarto, sem querer companhia",
          "Diz que “nada é legal” ou “não tem graça”",
          "Perdeu o entusiasmo pela escola e pelos amigos",
          "Tem pouca energia para fazer as coisas",
          "Mostra-se indiferente na maior parte do dia",
        ],
      },
    ],
  },

  // ---- J26-071 — Ideação Suicida na Criança (sensível) ----
  "j26-071": {
    icon: ShieldAlert,
    gradient: "from-red-600 to-rose-700",
    instruction:
      "Aplicação clínica, com linguagem acolhedora e sem julgamento. Marque o que a criança expressa ou apresenta. Responda todos os itens.",
    infoBox:
      "Rastreio de ideação suicida na criança. QUALQUER resposta positiva exige avaliação imediata de segurança e plano de proteção. Em risco de vida, procure urgência — SAMU 192, CVV 188. Não é diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Indicadores de risco (avaliar segurança)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Pensamentos e sinais de risco",
        color: "text-red-600 dark:text-red-400",
        items: [
          "Fala ou pergunta sobre morte com frequência",
          "Diz que queria não existir ou sumir",
          "Diz que queria estar morta",
          "Já disse querer se machucar para morrer",
          "Desenha ou brinca com temas de morte",
          "Diz que a família ficaria melhor sem ela",
          "Já fez algum gesto de se machucar",
          "Relata pensamentos de se machucar",
          "Tem acesso a meios perigosos em casa",
          "Fala de um plano para se machucar",
          "Despede-se ou dá coisas como se fosse partir",
          "Mostra desesperança intensa sobre o futuro",
        ],
      },
    ],
  },

  // ---- J26-073 — Triagem de Bipolaridade ----
  "j26-073": {
    icon: Activity,
    gradient: "from-fuchsia-500 to-purple-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Triagem de bipolaridade (maior escore = mais sintomas), avaliando os dois polos do humor. Ajuda a diferenciar de TDAH e TOD; o diagnóstico exige avaliação especializada. Não é diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Sintomas de oscilação do humor",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Elevação / mania",
        color: "text-fuchsia-600 dark:text-fuchsia-400",
        items: [
          "Tem períodos de humor muito elevado ou eufórico",
          "Fica extremamente agitada e acelerada",
          "Dorme muito menos sem sentir cansaço",
          "Fala muito rápido e pula de assunto",
          "Tem ideias de grandeza (acha que pode tudo)",
          "Toma riscos sem medir as consequências",
        ],
      },
      {
        name: "Depressão / instabilidade",
        color: "text-indigo-600 dark:text-indigo-400",
        items: [
          "Tem períodos de tristeza profunda",
          "Perde o interesse pelas coisas",
          "Fica irritada e explosiva sem motivo claro",
          "Tem mudanças bruscas de humor no mesmo dia",
          "Alterna energia muito alta e depois muito baixa",
          "O humor oscila de forma extrema e cíclica",
        ],
      },
    ],
  },

  // ---- J26-074 — Variação Sazonal de Humor ----
  "j26-074": {
    icon: Sparkles,
    gradient: "from-amber-500 to-orange-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Triagem de variação sazonal do humor (maior escore = padrão mais marcado). Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Padrão sazonal do humor",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Variação sazonal",
        color: "text-amber-600 dark:text-amber-400",
        items: [
          "O humor piora em épocas específicas do ano",
          "Fica mais triste ou desanimada em certos meses",
          "A energia cai em determinadas épocas",
          "Dorme mais ou pior nessas épocas",
          "O apetite muda conforme a época do ano",
          "Isola-se mais em certos períodos",
          "Cai o rendimento escolar nessas épocas",
          "Melhora espontaneamente quando a época passa",
          "O padrão se repete ano após ano",
          "Tem mais irritabilidade nessas épocas",
          "Perde o interesse pelas atividades nesses períodos",
          "A variação acompanha mudanças de clima ou de luz",
        ],
      },
    ],
  },

  // ---- J26-075 — Luto e Perda ----
  "j26-075": {
    icon: Heart,
    gradient: "from-slate-500 to-blue-700",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Distingue o luto normal do luto complicado (maior escore = mais sinais de complicação). Escore alto e persistente indica suporte especializado. Não é diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Sinais de luto complicado",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Processo de luto",
        color: "text-slate-600 dark:text-slate-300",
        items: [
          "A tristeza pela perda não diminui com o tempo",
          "Recusa-se a aceitar a perda",
          "Evita tudo o que lembra a pessoa perdida",
          "Tem raiva intensa relacionada à perda",
          "Regrediu em comportamentos (sono, banheiro, fala)",
          "Tem culpa intensa (“a culpa é minha”)",
          "Tem medo de perder outras pessoas",
          "Teve queda no rendimento escolar",
          "Tem pesadelos ou pensamentos repetitivos sobre a perda",
          "Isola-se de amigos e da família",
          "Apresenta queixas físicas ligadas ao luto",
          "O luto atrapalha gravemente a rotina há muito tempo",
        ],
      },
    ],
  },

  // ---- J26-076 — Autoestima Infantil (positiva; maior = melhor) ----
  "j26-076": {
    icon: Heart,
    gradient: "from-emerald-500 to-teal-600",
    instruction:
      "Para cada frase, marque o quanto combina com a criança. Pode ser respondido pela própria criança/adolescente. Responda todos os itens.",
    infoBox:
      "Avalia a autoestima (maior escore = mais positiva). Escore baixo pede atenção e suporte emocional. Triagem, não diagnóstico.",
    labels: ["Discordo", "Às vezes / mais ou menos", "Concordo"],
    totalLabel: "Autoestima (maior = mais positiva)",
    bands: DEV_BANDS,
    domains: [
      {
        name: "Autoestima e autoeficácia",
        color: "text-emerald-600 dark:text-emerald-400",
        items: [
          "Eu gosto de mim do jeito que sou",
          "Eu me acho capaz de aprender as coisas",
          "Eu tenho amigos e me sinto querida",
          "Eu consigo fazer as coisas que tento",
          "Eu me sinto bem com a minha aparência",
          "Eu me sinto importante para a minha família",
          "Eu me orgulho das minhas conquistas",
          "Eu acredito que posso melhorar quando erro",
          "Eu me sinto bem na escola",
          "Eu me sinto seguro(a) para tentar coisas novas",
          "Eu me sinto tão capaz quanto os outros",
          "Eu acho que sou uma boa pessoa",
        ],
      },
    ],
  },

  // ---- J26-077 — Desesperança (sensível) ----
  "j26-077": {
    icon: ShieldAlert,
    gradient: "from-slate-600 to-gray-800",
    instruction:
      "Para cada frase, marque o quanto combina com você. Responda com sinceridade. Responda todos os itens.",
    infoBox:
      "A desesperança é marcador importante de risco de suicídio, além da tristeza (maior escore = mais desesperança). Escore alto exige avaliação de segurança. Urgência: SAMU 192, CVV 188. Não é diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Desesperança (maior = mais intensa)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Pensamento pessimista",
        color: "text-slate-600 dark:text-slate-300",
        items: [
          "Acha que o futuro não vai melhorar",
          "Acredita que nada do que faz adianta",
          "Sente que as coisas ruins nunca vão acabar",
          "Não tem esperança nas próprias capacidades",
          "Acha que nunca vai conseguir o que quer",
          "Sente que desistiu de tentar",
          "Acredita que não vale a pena se esforçar",
          "Vê o futuro como vazio ou sem sentido",
          "Acha que os problemas não têm solução",
          "Sente que ninguém pode ajudar",
          "Pensa que as coisas só pioram",
          "Perdeu a vontade de planejar o futuro",
        ],
      },
    ],
  },

  // ---- J26-078 — Sintomas Depressivos Pós-COVID ----
  "j26-078": {
    icon: Heart,
    gradient: "from-blue-500 to-indigo-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Rastreio de sintomas depressivos no contexto pós-pandemia (maior escore = mais intensos). Não é diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Sintomas depressivos pós-pandemia",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Humor e funcionamento",
        color: "text-blue-600 dark:text-blue-400",
        items: [
          "Ficou triste ou desanimada após a pandemia",
          "Perdeu o interesse pelas atividades",
          "Tem menos energia do que antes",
          "Perdeu contato ou amizades",
          "Não retomou o ritmo escolar",
          "Dorme mal ou demais",
          "Mudou o apetite",
          "Fica mais irritada ou chorosa",
          "Isola-se no quarto ou nas telas",
          "Tem queixas físicas (dor, cansaço)",
          "Fala de forma pessimista sobre si ou o futuro",
          "O funcionamento geral piorou desde a pandemia",
        ],
      },
    ],
  },

  // ---- J26-079 — Sintomas Somáticos da Depressão ----
  "j26-079": {
    icon: Heart,
    gradient: "from-rose-500 to-pink-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "A depressão na criança costuma se expressar no corpo (maior escore = mais sintomas somáticos). Afaste causas orgânicas e considere o componente emocional. Não é diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Sintomas somáticos depressivos",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Queixas físicas da depressão",
        color: "text-rose-600 dark:text-rose-400",
        items: [
          "Tem dor de cabeça frequente",
          "Sente cansaço o tempo todo",
          "Tem dor de barriga recorrente",
          "Perdeu o apetite ou come demais",
          "Dorme mal (insônia ou sono excessivo)",
          "Queixa-se de dores pelo corpo",
          "Tem lentidão de movimentos e de fala",
          "Fica prostrada, sem energia",
          "Tem alterações de peso",
          "Sente um “peso” ou aperto no peito",
          "As queixas não têm causa médica encontrada",
          "As queixas físicas vêm junto com tristeza ou desânimo",
        ],
      },
    ],
  },

  // ---- J26-080 — Depressão Mascarada por Irritabilidade ----
  "j26-080": {
    icon: Activity,
    gradient: "from-orange-500 to-red-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "No adolescente, a depressão frequentemente aparece como irritabilidade, não como tristeza (maior escore = mais provável). Triagem, não diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Depressão mascarada (maior = mais provável)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Irritabilidade e retraimento",
        color: "text-orange-600 dark:text-orange-400",
        items: [
          "Está mais irritado e explosivo que o habitual",
          "Briga com todo mundo (família, colegas)",
          "Responde mal e fica “grosso”",
          "Isola-se no quarto ou nas telas",
          "Perdeu o interesse pelas coisas",
          "Está mais cansado e sem energia",
          "Dorme mal ou demais",
          "Mudou o apetite",
          "Caiu o rendimento escolar",
          "Fala de forma pessimista ou negativa",
          "Tem baixa autoestima",
          "A irritabilidade parece esconder uma tristeza de fundo",
        ],
      },
    ],
  },

  // ---- J26-081 — Impacto Funcional da Depressão ----
  "j26-081": {
    icon: Activity,
    gradient: "from-sky-500 to-indigo-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox:
      "Avalia o quanto a depressão prejudica o funcionamento (maior escore = mais impacto). Útil para dimensionar gravidade e acompanhar resposta. Não é diagnóstico.",
    labels: SEVERITY_LABELS,
    totalLabel: "Impacto funcional (maior = mais prejuízo)",
    bands: SEVERITY_BANDS,
    domains: [
      {
        name: "Prejuízo no dia a dia",
        color: "text-sky-600 dark:text-sky-400",
        items: [
          "A tristeza atrapalha o desempenho escolar",
          "Atrapalha as amizades e o convívio",
          "Atrapalha a relação com a família",
          "Reduz a participação em atividades ou esportes",
          "Atrapalha o autocuidado (higiene, alimentação)",
          "Atrapalha o sono",
          "Faz faltar à escola",
          "Reduz a capacidade de se divertir",
          "Atrapalha a concentração nos estudos",
          "Reduz a energia para a rotina",
          "Afeta a vontade de sair de casa",
          "Compromete o funcionamento geral do dia a dia",
        ],
      },
    ],
  },

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

  // ---- J26-087 — Gagueira (intensidade/impacto) ----
  "j26-087": {
    icon: MessageCircle, gradient: "from-orange-500 to-red-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia a gagueira pela frequência e pelo impacto (maior escore = mais impacto). Encaminhar à fonoaudiologia. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Gagueira (maior = mais impacto)", bands: SEVERITY_BANDS,
    domains: [{ name: "Disfluência e impacto", color: "text-orange-600 dark:text-orange-400", items: [
      "Repete sons ou sílabas no início das palavras",
      "Prolonga sons (“mmmmamãe”)",
      "Trava ou bloqueia, com esforço para iniciar a fala",
      "Tem tensão facial ou corporal ao falar",
      "Usa palavras de apoio ou rodeios para evitar travar",
      "Evita falar em certas situações por medo de gaguejar",
      "Fica ansiosa antes de falar (ansiedade antecipatória)",
      "Demonstra frustração ou vergonha ao gaguejar",
      "Evita certas palavras difíceis",
      "A gagueira piora sob pressão ou nervosismo",
      "A gagueira atrapalha a comunicação no dia a dia",
      "A gagueira afeta a participação social ou escolar",
    ]}],
  },

  // ---- J26-088 — Linguagem Bilíngue/Dialetal (sinais de transtorno) ----
  "j26-088": {
    icon: MessageCircle, gradient: "from-lime-500 to-green-600",
    instruction: SEVERITY_INSTRUCTION,
    infoBox: "Diferencia a DIFERENÇA linguística (dialetal/bilíngue, esperada) do TRANSTORNO de linguagem (maior escore = mais sinais de transtorno verdadeiro, presentes nas duas línguas). Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Sinais de transtorno (além da diferença)", bands: SEVERITY_BANDS,
    domains: [{ name: "Sinais que vão além do dialeto/bilinguismo", color: "text-lime-700 dark:text-lime-400", items: [
      "Tem dificuldade de linguagem TAMBÉM na língua/dialeto de casa",
      "Falava pouco para a idade desde cedo (em qualquer língua)",
      "Tem vocabulário reduzido nas duas línguas",
      "Tem dificuldade de montar frases em ambas as línguas",
      "Tem dificuldade de compreender em ambas as línguas",
      "Os familiares notam atraso de fala (não só “sotaque”)",
      "Tem dificuldade de aprender palavras novas",
      "Tem dificuldade de contar histórias em qualquer língua",
      "Tem dificuldade de encontrar as palavras (acesso lexical)",
      "A dificuldade persiste apesar de boa exposição à língua",
      "Outras crianças bilíngues da mesma comunidade falam melhor",
      "A dificuldade aparece em casa e na escola",
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
      "Diferencia pergunta de afirmação pela entonação",
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

  "j26-095": {
    icon: Hand, gradient: "from-amber-500 to-orange-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Análise qualitativa dos erros de escrita (maior escore = erros mais frequentes/variados). Orienta a intervenção. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Erros de escrita (maior = mais frequentes)", bands: SEVERITY_BANDS,
    domains: [{ name: "Padrão de erros ortográficos", color: "text-amber-600 dark:text-amber-400", items: [
      "Troca letras parecidas no som (f/v, p/b, t/d)",
      "Troca letras parecidas na forma (b/d, p/q)",
      "Omite letras nas palavras",
      "Acrescenta letras a mais",
      "Inverte a ordem das letras ou sílabas",
      "Junta palavras que deveriam ser separadas",
      "Separa palavras que deveriam ser juntas",
      "Escreve “como fala” (erro fonológico)",
      "Erra regras ortográficas já ensinadas",
      "Usa maiúsculas/minúsculas de forma inadequada",
      "Omite acentos e pontuação",
      "Os erros persistem apesar da correção",
    ]}],
  },

  "j26-096": {
    icon: ShieldAlert, gradient: "from-orange-500 to-red-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia a ansiedade matemática (maior = mais intensa). Ajuda a diferenciar discalculia de ansiedade. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Ansiedade matemática (maior = mais intensa)", bands: SEVERITY_BANDS,
    domains: [{ name: "Ansiedade ligada à matemática", color: "text-orange-600 dark:text-orange-400", items: [
      "Fica ansiosa só de ver uma conta",
      "Trava ou dá “branco” nas provas de matemática",
      "Evita atividades que envolvem números",
      "Tem sintomas físicos (suor, náusea) na aula de matemática",
      "Acha que é “ruim de matemática” (crença negativa)",
      "Fica nervosa ao ser chamada para responder uma conta",
      "Sente o coração acelerar em testes de matemática",
      "Procrastina ou foge das tarefas de matemática",
      "O nervosismo prejudica o desempenho real",
      "Tem medo de errar na frente dos outros em matemática",
      "A ansiedade não aparece nas outras matérias do mesmo jeito",
      "A ansiedade atrapalha o aprendizado de matemática",
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

  "j26-099": {
    icon: Sparkles, gradient: "from-violet-500 to-purple-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a motivação acadêmica (maior = mais motivada). Muitas vezes confundida com preguiça. Triagem, não diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Motivação escolar (maior = mais motivada)", bands: DEV_BANDS,
    domains: [{ name: "Motivação acadêmica", color: "text-violet-600 dark:text-violet-400", items: [
      "Tem vontade de aprender coisas novas",
      "Sente prazer em entender algo",
      "Esforça-se mesmo sem prêmio externo",
      "Estabelece metas para si na escola",
      "Persiste diante de uma tarefa difícil",
      "Tem curiosidade pelos assuntos",
      "Sente orgulho das próprias conquistas",
      "Acredita que o esforço melhora o resultado",
      "Vai à escola de bom grado",
      "Participa das atividades em sala",
      "Valoriza aprender, não só tirar nota",
      "Mantém o interesse ao longo do ano",
    ]}],
  },

  "j26-100": {
    icon: Eye, gradient: "from-rose-500 to-red-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Rastreio de sinais precoces de dislexia (maior escore = mais sinais de risco). Confirma-se com avaliação especializada. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Risco de dislexia (maior = mais sinais)", bands: SEVERITY_BANDS,
    domains: [{ name: "Sinais de risco para dislexia", color: "text-rose-600 dark:text-rose-400", items: [
      "Tem dificuldade com rimas",
      "Tem consciência fonológica fraca para a idade",
      "É lenta para nomear letras, cores ou objetos (nomeação rápida)",
      "Confunde letras parecidas (b/d, p/q)",
      "Tem dificuldade de aprender o som das letras",
      "Demora muito mais que os colegas para ler",
      "Lê de forma silabada e com esforço",
      "Troca, omite ou inverte letras ao ler ou escrever",
      "Tem histórico familiar de dificuldade de leitura",
      "Evita atividades de leitura",
      "Tem boa oralidade, mas trava na leitura (descompasso)",
      "A dificuldade persiste apesar do ensino adequado",
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

  "j26-103": {
    icon: Activity, gradient: "from-orange-500 to-red-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Mapeia as dificuldades reais com o dever de casa (maior escore = mais difícil). Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Dificuldade com o dever (maior = mais difícil)", bands: SEVERITY_BANDS,
    domains: [{ name: "Comportamento frente ao dever de casa", color: "text-orange-600 dark:text-orange-400", items: [
      "Chora ou tem crise na hora do dever",
      "Bate o pé ou se recusa a começar",
      "Leva muito mais tempo que o esperado",
      "Não sabe o que foi mandado de tarefa",
      "Esquece o material ou a tarefa na escola",
      "Precisa de um adulto colado o tempo todo",
      "Distrai-se constantemente durante o dever",
      "Faz “de qualquer jeito” só para terminar",
      "Vira uma briga diária na família",
      "Desiste no meio da tarefa",
      "Tem dificuldade de organizar o que fazer primeiro",
      "O dever de casa gera muito estresse em casa",
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

  "j26-105": {
    icon: ClipboardList, gradient: "from-slate-500 to-blue-700", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Levanta necessidades de adaptação para o ENEM/vestibular (maior = mais necessidade). Subsidia o laudo de atendimento especializado. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Necessidade de adaptações (maior = mais necessidade)", bands: SEVERITY_BANDS,
    domains: [{ name: "Necessidades para o exame", color: "text-slate-600 dark:text-slate-300", items: [
      "Tem dificuldade de manter a atenção em provas longas",
      "Precisa de tempo adicional para concluir provas",
      "Tem dificuldade de leitura que exige ledor ou tempo extra",
      "Tem dificuldade de escrita que exige adaptação",
      "Tem ansiedade de desempenho que prejudica provas",
      "Precisa de sala com menos estímulos",
      "Tem dificuldade de organizar o tempo de prova",
      "Tem condição (TDAH/TEA/dislexia) com laudo",
      "Cansa-se cognitivamente em provas longas",
      "Tem dificuldade de interpretar enunciados complexos",
      "Precisa de recursos de acessibilidade específicos",
      "Beneficia-se de atendimento especializado no exame",
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
  "j26-110": {
    icon: Activity, gradient: "from-orange-500 to-red-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia o impacto do Transtorno do Desenvolvimento da Coordenação no cotidiano (maior = mais impacto). Encaminhar à TO/fisioterapia. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Descoordenação no cotidiano (maior = mais impacto)", bands: SEVERITY_BANDS,
    domains: [{ name: "Coordenação no dia a dia", color: "text-orange-600 dark:text-orange-400", items: [
      "Cai ou tropeça com facilidade","Esbarra nas coisas e nas pessoas","Tem dificuldade de amarrar o tênis","Tem dificuldade de pegar ou chutar bola","Tem letra muito ruim ou desorganizada","É desajeitada nas tarefas manuais","Derruba objetos com frequência","Tem dificuldade de andar de bicicleta","Tem dificuldade de se vestir sozinha","Cansa-se ou evita atividades físicas","É mais lenta que os colegas em tarefas motoras","A descoordenação atrapalha o dia a dia e a escola",
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
  "j26-114": {
    icon: Activity, gradient: "from-rose-500 to-red-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia o impacto funcional do tônus (hipotonia/hipertonia) — maior escore = mais impacto. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Impacto do tônus (maior = mais impacto)", bands: SEVERITY_BANDS,
    domains: [{ name: "Tônus e função", color: "text-rose-600 dark:text-rose-400", items: [
      "Parece “molenga”/frouxa (hipotonia) ou muito “dura” (hipertonia)","Cansa-se rápido para manter a postura","Tem dificuldade de sustentar a cabeça ou o tronco","Tem posturas atípicas ao sentar ou ficar em pé","Tem movimentos rígidos ou pouco fluidos","Tem amplitude de movimento alterada (frouxa ou limitada)","Tem dificuldade de manipular objetos pelo tônus","Tem dificuldade para a marcha ou as transferências","Tem reflexos ou posturas alterados","O tônus atrapalha a alimentação ou a fala","O tônus atrapalha as atividades do dia a dia","Apresenta assimetria entre os lados do corpo",
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
  "j26-116": {
    icon: Activity, gradient: "from-yellow-500 to-orange-600", instruction:
      "Marque a frequência de cada tique nas últimas 2 semanas. Responda todos os itens.",
    infoBox: "Inventário de tiques motores e vocais (maior = mais frequentes/intensos). Base para Tourette e para a conversa com a escola. Não é diagnóstico.",
    labels: FREQ_LABELS, totalLabel: "Tiques (maior = mais frequentes)", bands: SEVERITY_BANDS,
    domains: [
      { name: "Tiques motores", color: "text-yellow-600 dark:text-yellow-400", items: [
        "Pisca os olhos repetidamente","Faz caretas ou movimentos faciais","Encolhe ou levanta os ombros","Mexe a cabeça ou o pescoço","Faz movimentos com braços ou mãos","Faz movimentos complexos (pular, tocar, gestos)",
      ]},
      { name: "Tiques vocais", color: "text-orange-600 dark:text-orange-400", items: [
        "Funga, pigarreia ou tosse sem estar doente","Faz sons com a garganta ou a boca","Repete sons, sílabas ou palavras","Solta palavras ou frases involuntárias","Os tiques pioram com estresse ou cansaço","Os tiques atrapalham a escola ou o convívio",
      ]},
    ],
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

  "j26-118": {
    icon: Hand, gradient: "from-violet-500 to-purple-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia o processamento tátil — defensivo e buscador (maior = mais alterações). Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Processamento tátil (maior = mais alterações)", bands: SEVERITY_BANDS,
    domains: [{ name: "Tato", color: "text-violet-600 dark:text-violet-400", items: [
      "Incomoda-se com etiquetas, costuras ou texturas de roupa","Não gosta de mão suja, areia, tinta ou cola","Reage mal a toques leves inesperados","Não gosta de cortar unha/cabelo ou escovar os dentes","Evita abraços ou certos contatos","Reage demais (ou quase nada) a pequenos machucados","Incomoda-se com roupas de certo tecido","Não tolera estar com rosto ou mãos sujos","Busca tocar texturas o tempo todo","Esfrega-se em superfícies ou pessoas","Tem reação intensa à temperatura (água, comida)","As reações táteis atrapalham o dia a dia",
    ]}],
  },
  "j26-119": {
    icon: Activity, gradient: "from-blue-500 to-indigo-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia o processamento vestibular — evitação e busca de movimento (maior = mais alterações). Base para a integração sensorial. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Processamento vestibular (maior = mais alterações)", bands: SEVERITY_BANDS,
    domains: [{ name: "Movimento e equilíbrio", color: "text-blue-600 dark:text-blue-400", items: [
      "Enjoa fácil no carro","Tem medo de balanço, escorregador ou altura","Fica tonta com facilidade","Evita brinquedos de movimento","Tem medo de tirar os pés do chão","Procura girar, balançar e rodar sem parar","Não enjoa nem fica tonta por mais que gire","Busca movimento intenso o tempo todo","Tem dificuldade de equilíbrio","Fica insegura em superfícies instáveis","Reage com medo a mudanças de posição","As reações ao movimento atrapalham o dia a dia",
    ]}],
  },
  "j26-120": {
    icon: Hand, gradient: "from-teal-500 to-cyan-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia o processamento proprioceptivo — força e busca de pressão profunda (maior = mais alterações). Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Processamento proprioceptivo (maior = mais alterações)", bands: SEVERITY_BANDS,
    domains: [{ name: "Força e pressão profunda", color: "text-teal-600 dark:text-teal-400", items: [
      "Bate as portas mais forte do que precisa","Aperta demais o lápis ou os objetos","Joga-se no sofá, no chão ou nas pessoas","Adora abraço bem apertado","Esbarra e empurra para sentir o corpo","Pisa forte ao andar","Morde, rói ou aperta objetos","Não dosa a força (machuca sem querer)","Busca carregar coisas pesadas","Procura apertos e compressão","Parece “não saber onde o corpo está” (desajeitada)","A busca por estímulo profundo atrapalha o dia a dia",
    ]}],
  },
  "j26-121": {
    icon: Ear, gradient: "from-cyan-500 to-blue-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia o processamento auditivo funcional (maior = mais dificuldades). Flag para encaminhamento fonoaudiológico. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Processamento auditivo (maior = mais dificuldades)", bands: SEVERITY_BANDS,
    domains: [{ name: "Audição funcional", color: "text-cyan-600 dark:text-cyan-400", items: [
      "Distrai-se com sons de fundo","Confunde palavras parecidas","Tem dificuldade de entender em ambiente barulhento","Pede para repetir com frequência","Tapa os ouvidos com sons comuns","Assusta-se demais com sons inesperados","Demora a responder ao que é falado","Tem dificuldade de seguir instruções faladas","Incomoda-se com lugares barulhentos (recreio, festa)","Parece “não ouvir” quando está concentrada","Tem dificuldade de localizar de onde vem o som","As dificuldades auditivas atrapalham a aprendizagem",
    ]}],
  },
  "j26-122": {
    icon: Eye, gradient: "from-indigo-500 to-blue-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia o processamento visual funcional (maior = mais dificuldades). Impacta leitura e coordenação. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Processamento visual (maior = mais dificuldades)", bands: SEVERITY_BANDS,
    domains: [{ name: "Visão funcional", color: "text-indigo-600 dark:text-indigo-400", items: [
      "Perde a linha ao ler (tracking)","Inverte ou troca letras e números","Confunde figuras ou letras parecidas","Incomoda-se com luz forte","Cansa os olhos rapidamente em tarefas visuais","Tem dificuldade de copiar do quadro","Tem dificuldade de achar um objeto em meio a outros","Esbarra em coisas ou julga mal as distâncias","Tem dificuldade com quebra-cabeças e formas","Fecha um olho ou aproxima muito o rosto do papel","Pula linhas ou palavras ao ler","As dificuldades visuais atrapalham a leitura e a coordenação",
    ]}],
  },
  "j26-123": {
    icon: Sparkles, gradient: "from-lime-500 to-green-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia a sensibilidade oral-sensorial e alimentar (maior = mais alterações). Útil na seletividade alimentar e no TEA. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Sensibilidade oral (maior = mais alterações)", bands: SEVERITY_BANDS,
    domains: [{ name: "Sensibilidade oral", color: "text-lime-700 dark:text-lime-400", items: [
      "Recusa alimentos por textura","Recusa alimentos por cheiro","Recusa alimentos por temperatura","Só aceita pouquíssimos tipos de comida","Enjoa de comidas misturadas","Tem ânsia de vômito com certas texturas","Prefere só comidas pastosas ou só crocantes","Não tolera novos alimentos","Cheira a comida antes de comer","Coloca objetos não-alimentares na boca","Reage mal a escovar os dentes","A sensibilidade oral atrapalha a alimentação",
    ]}],
  },
  "j26-124": {
    icon: Activity, gradient: "from-amber-500 to-orange-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia a busca de sensações (maior = mais busca). Pode ser confundida com TDAH ou comportamento opositor. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Busca sensorial (maior = mais busca)", bands: SEVERITY_BANDS,
    domains: [{ name: "Comportamento buscador", color: "text-amber-600 dark:text-amber-400", items: [
      "Toca em tudo o tempo todo","Lambe ou cheira objetos","Fica se jogando, batendo, esbarrando de propósito","Parece não sentir dor","Busca estímulos intensos (barulho, luz, movimento)","Não para quieta, está sempre em movimento","Aperta, morde ou rói objetos","Faz barulho com a boca ou objetos","Mexe em texturas o tempo todo","Procura sensações fortes (girar, pular de alturas)","O comportamento é confundido com TDAH ou oposição","A busca sensorial atrapalha o dia a dia",
    ]}],
  },
  "j26-125": {
    icon: ShieldAlert, gradient: "from-rose-500 to-red-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia a sobrecarga sensorial e os meltdowns (maior = mais intenso). O meltdown é por sobrecarga, diferente de birra. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Sobrecarga sensorial (maior = mais intensa)", bands: SEVERITY_BANDS,
    domains: [{ name: "Sobrecarga e meltdown", color: "text-rose-600 dark:text-rose-400", items: [
      "Fica sobrecarregada em ambientes com muito estímulo","Tapa os ouvidos ou os olhos quando é demais","Entra em crise (meltdown) com estímulo excessivo","Foge ou tenta sair de lugares cheios","Chora, grita ou se agride quando sobrecarregada","Tem náusea ou vômito com a sobrecarga","“Desliga” ou se isola quando é demais","Demora muito para se recuperar da crise","Antecipa e evita lugares estimulantes","Precisa de um canto calmo para se regular","A crise é por sobrecarga (diferente de birra)","A sobrecarga atrapalha a vida em sociedade",
    ]}],
  },
  "j26-126": {
    icon: Sparkles, gradient: "from-emerald-500 to-teal-600", instruction: DEV_INSTRUCTION,
    infoBox: "Monitora a eficácia da dieta sensorial prescrita pelo TO (maior = funcionando melhor). Aplicar mensalmente. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Eficácia da dieta sensorial (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Resposta às estratégias sensoriais", color: "text-emerald-600 dark:text-emerald-400", items: [
      "As estratégias sensoriais ajudam a criança a se regular","A criança fica mais calma após as atividades sensoriais","Melhorou o foco com a dieta sensorial","Melhorou o comportamento em casa","Melhorou o comportamento na escola","Reduziram as crises de sobrecarga","A criança aceita bem as estratégias","As estratégias são usadas na rotina diária","Melhorou o sono","Melhorou a alimentação","A família consegue aplicar as estratégias","No geral, a dieta sensorial está funcionando",
    ]}],
  },
  "j26-127": {
    icon: Sparkles, gradient: "from-fuchsia-500 to-purple-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia a hipersensibilidade olfativa (maior = mais alterações). Pode afetar a alimentação. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Hipersensibilidade olfativa (maior = mais intensa)", bands: SEVERITY_BANDS,
    domains: [{ name: "Olfato", color: "text-fuchsia-600 dark:text-fuchsia-400", items: [
      "Cheira tudo antes de comer","Vomita ou tem ânsia com certos cheiros","Não suporta cheiro de perfume ou produto de limpeza","Recusa alimentos pelo cheiro","Incomoda-se com cheiros que outros nem notam","Reclama de cheiros em ambientes (banheiro, cozinha)","Tapa o nariz com frequência","Evita lugares por causa do cheiro","O cheiro afeta o apetite","Reage com mau humor a certos cheiros","Identifica cheiros muito sutis","A sensibilidade a cheiros atrapalha o dia a dia",
    ]}],
  },
  "j26-128": {
    icon: Activity, gradient: "from-orange-500 to-red-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia a regulação sensorial na sala de aula (maior = mais desregulação). Respondido pelo professor. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Desregulação sensorial escolar (maior = mais)", bands: SEVERITY_BANDS,
    domains: [{ name: "Sensorial na escola", color: "text-orange-600 dark:text-orange-400", items: [
      "Agita-se ao ficar sentada por muito tempo","Não suporta o barulho do recreio ou da sala","Distrai-se com estímulos do ambiente","Levanta-se e se mexe o tempo todo","Reage mal a aglomeração (fila, pátio)","Busca tocar materiais e colegas","Tem crise de sobrecarga na escola","Tem dificuldade de foco em ambiente estimulante","Precisa de pausas sensoriais para se regular","Reage à luz ou à temperatura da sala","Mostra desconforto em atividades sensoriais (cola, tinta)","A desregulação sensorial atrapalha a aprendizagem",
    ]}],
  },
  "j26-129": {
    icon: Hand, gradient: "from-violet-500 to-fuchsia-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Perfil sensorial integrado por modalidade (maior = mais alterações). O detalhamento por domínio mostra os canais mais afetados. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Perfil sensorial integrado (maior = mais alterações)", bands: SEVERITY_BANDS,
    domains: [
      { name: "Tátil", color: "text-violet-600 dark:text-violet-400", items: [
        "Etiquetas e texturas de roupa incomodam","Não gosta de sujar as mãos","Reage mal a toques leves",
      ]},
      { name: "Auditivo", color: "text-cyan-600 dark:text-cyan-400", items: [
        "Tapa os ouvidos com sons comuns","Distrai-se com ruído de fundo","Assusta-se com sons inesperados",
      ]},
      { name: "Vestibular / proprioceptivo", color: "text-blue-600 dark:text-blue-400", items: [
        "Busca girar, pular e se movimentar intensamente","Não dosa a força do corpo","Tem medo ou busca excessiva de movimento",
      ]},
      { name: "Oral / olfativo", color: "text-lime-700 dark:text-lime-400", items: [
        "Seletividade por textura ou cheiro dos alimentos","Leva objetos à boca além do esperado","Reage a cheiros que outros não notam",
      ]},
      { name: "Visual", color: "text-indigo-600 dark:text-indigo-400", items: [
        "Incomoda-se com luz forte","Perde-se em ambientes visualmente cheios","Fixa-se em luzes ou objetos que giram",
      ]},
    ],
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
  "j26-131": {
    icon: ShieldAlert, gradient: "from-violet-500 to-purple-700", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Ajuda a diferenciar pesadelo, terror noturno e sonambulismo (manejos diferentes). Maior = mais frequente/intenso. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Eventos noturnos (maior = mais intensos)", bands: SEVERITY_BANDS,
    domains: [{ name: "Pesadelos, terrores e sonambulismo", color: "text-violet-600 dark:text-violet-400", items: [
      "Tem pesadelos (acorda assustada e lembra do sonho)","Tem terror noturno (grita/agitada, sem acordar nem lembrar)","Anda dormindo (sonambulismo)","Fala dormindo","Tem despertar confuso no meio da noite","Os episódios acontecem no início da noite","Os episódios acontecem na madrugada ou fim da noite","Tem vários episódios por semana","Os episódios assustam a família","Há risco de a criança se machucar nos episódios","Fica sonolenta no dia seguinte por causa disso","Os episódios vêm piorando",
    ]}],
  },
  "j26-132": {
    icon: Sparkles, gradient: "from-blue-500 to-indigo-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia o atraso de início do sono (maior = mais demora). Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Latência do sono (maior = mais demora)", bands: SEVERITY_BANDS,
    domains: [{ name: "Início do sono", color: "text-blue-600 dark:text-blue-400", items: [
      "Demora mais de 30-45 minutos para pegar no sono","Fica se mexendo e rolando na cama","A mente “não para” na hora de dormir","Levanta-se várias vezes antes de dormir","Chama os pais repetidamente","Pede água, banheiro ou colo seguidamente","Reclama que não consegue dormir","Fica ansiosa por não conseguir dormir","Só dorme muito tarde","Precisa de companhia ou condições para iniciar o sono","A demora atrapalha o sono total da noite","Acorda cansada por dormir tarde",
    ]}],
  },
  "j26-133": {
    icon: Sparkles, gradient: "from-slate-500 to-indigo-700", instruction:
      "Marque a frequência de cada evento durante o sono. Anote também o horário em que costumam ocorrer. Responda todos os itens.",
    infoBox: "Inventário de parassônias por frequência (maior = mais frequentes). Tipo e horário ajudam o diagnóstico. Não é diagnóstico.",
    labels: FREQ_LABELS, totalLabel: "Parassônias (maior = mais frequentes)", bands: SEVERITY_BANDS,
    domains: [{ name: "Eventos durante o sono", color: "text-slate-600 dark:text-slate-300", items: [
      "Anda dormindo (sonambulismo)","Fala dormindo","Range os dentes (bruxismo)","Faz movimentos rítmicos (bate a cabeça, balança) ao dormir","Tem terror noturno","Tem despertar confusional","Tem pesadelos","Mexe muito as pernas ou tem desconforto nas pernas","Tem sobressaltos ao adormecer","Urina na cama (enurese noturna)","Os episódios ocorrem sempre no mesmo horário","As parassônias atrapalham o sono ou o dia seguinte",
    ]}],
  },
  "j26-134": {
    icon: Activity, gradient: "from-slate-500 to-blue-700", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia o impacto das telas no sono (maior = mais impacto). Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Telas e sono (maior = mais impacto)", bands: SEVERITY_BANDS,
    domains: [{ name: "Telas no sono", color: "text-blue-600 dark:text-blue-400", items: [
      "Usa telas na hora antes de dormir","Tem celular, tablet ou TV no quarto","Assiste ou joga até altas horas","Leva o celular para a cama","Acorda à noite para ver o celular","Fica agitada ou estimulada depois da tela","Atrasa a hora de dormir por causa da tela","Reduz o tempo total de sono pela tela","Tem dificuldade de “desligar” da tela à noite","Acorda cansada por dormir tarde com tela","Resiste a entregar a tela na hora de dormir","O uso de tela à noite atrapalha claramente o sono",
    ]}],
  },
  "j26-135": {
    icon: ShieldAlert, gradient: "from-indigo-500 to-violet-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia a ansiedade noturna como causa de insônia (maior = mais intensa). Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Ansiedade noturna (maior = mais intensa)", bands: SEVERITY_BANDS,
    domains: [{ name: "Ansiedade na hora de dormir", color: "text-indigo-600 dark:text-indigo-400", items: [
      "Tem medo do escuro","Tem medo de dormir sozinha","Tem medo de pesadelos","Tem pensamentos que não param na hora de dormir","Preocupa-se com coisas ao deitar","Pede para um adulto ficar até ela dormir","Vai para a cama dos pais por medo","Resiste a ir para a cama por ansiedade","Tem sintomas físicos (coração acelerado, barriga) ao deitar","Fica aflita conforme a hora de dormir se aproxima","Acorda à noite ansiosa e com medo","A ansiedade é a causa principal da insônia",
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
  "j26-138": {
    icon: Baby, gradient: "from-blue-500 to-indigo-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia a qualidade do sono e o impacto no neurodesenvolvimento (maior = mais problemas). Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Sono e desenvolvimento (maior = mais problemas)", bands: SEVERITY_BANDS,
    domains: [{ name: "Qualidade do sono e impacto", color: "text-blue-600 dark:text-blue-400", items: [
      "Dorme menos horas do que o esperado para a idade","Acorda muitas vezes à noite","Tem dificuldade de pegar no sono","Tem sono agitado ou inquieto","Fica irritada e chorosa de dia por causa do sono","Tem dificuldade de atenção/aprendizagem ligada ao sono","Tem mais problemas de comportamento quando dorme mal","Tem sonolência diurna","O ritmo de sono é irregular","A privação de sono afeta o desenvolvimento e o humor","A família dorme mal por causa do sono da criança","Os problemas de sono persistem há tempo",
    ]}],
  },
  "j26-139": {
    icon: ShieldAlert, gradient: "from-rose-500 to-red-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Triagem de apneia obstrutiva do sono (maior = mais sinais). Sinais positivos exigem avaliação (otorrino/polissonografia). Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Sinais de apneia do sono (maior = mais sinais)", bands: SEVERITY_BANDS,
    domains: [{ name: "Respiração no sono", color: "text-rose-600 dark:text-rose-400", items: [
      "Ronca alto e com frequência","Faz pausas na respiração durante o sono","Engasga ou tem sufocos durante o sono","Respira pela boca dormindo","Tem sono agitado e suado","Dorme em posições estranhas (pescoço estendido)","Acorda cansada mesmo dormindo o suficiente","Tem sonolência diurna","Tem dificuldade de atenção ou hiperatividade de dia","Tem amígdalas ou adenoides aumentadas (ou já foi dito por médico)","Faz xixi na cama (associado)","O ronco ou a apneia atrapalham a qualidade do sono",
    ]}],
  },

  // ============================================================
  // LOTE 12 — Categoria 12: Alimentação e Nutrição (autoral)
  // ============================================================

  "j26-140": {
    icon: Sparkles, gradient: "from-lime-500 to-green-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia a seletividade alimentar e suas causas sensoriais (maior = mais seletiva). Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Seletividade alimentar (maior = mais seletiva)", bands: SEVERITY_BANDS,
    domains: [{ name: "Repertório e recusa alimentar", color: "text-lime-700 dark:text-lime-400", items: [
      "Aceita poucos tipos de alimentos","Recusa alimentos por textura","Recusa alimentos por cor","Recusa alimentos por cheiro","Recusa alimentos por sabor","Come sempre as mesmas comidas","Recusa alimentos novos sem provar","Recusa comidas misturadas","Só aceita certas marcas ou preparos","Tem ânsia ou náusea com alimentos rejeitados","A seletividade limita refeições em família ou fora","A seletividade preocupa quanto à nutrição",
    ]}],
  },
  "j26-141": {
    icon: Activity, gradient: "from-orange-500 to-red-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia o comportamento nas refeições (maior = mais difícil). Diferencia seletividade de comportamento opositor. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Comportamento na refeição (maior = mais difícil)", bands: SEVERITY_BANDS,
    domains: [{ name: "Comportamento à mesa", color: "text-orange-600 dark:text-orange-400", items: [
      "Chora ou faz drama na hora de comer","Recusa-se a sentar à mesa","Cospe a comida","Joga a comida ou o prato","Demora muito para comer","Precisa de distração (tela, brinquedo) para comer","Só come no colo ou andando","Tem crise quando é oferecido algo que não quer","Negocia ou chantageia na refeição","A refeição vira uma batalha diária","Os pais preparam algo separado só para ela","O comportamento atrapalha a refeição da família",
    ]}],
  },
  "j26-142": {
    icon: Activity, gradient: "from-amber-500 to-orange-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia função motora oral e deglutição (maior = mais dificuldades). Engasgos e tosse frequentes exigem avaliação fonoaudiológica. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Motor oral e deglutição (maior = mais dificuldades)", bands: SEVERITY_BANDS,
    domains: [{ name: "Função oral e deglutição", color: "text-amber-600 dark:text-amber-400", items: [
      "Engasga durante as refeições","Tosse ao comer ou beber","Tem dificuldade de mastigar","Guarda comida na boca (não engole)","Tem dificuldade com certas texturas por motivo motor","Derrama muito líquido ao beber","Tem ânsia frequente ao comer","Demora muito para mastigar e engolir","Tem escape de alimento pela boca","Cansa-se durante a refeição","Tem voz “molhada” após engolir","As dificuldades atrapalham a alimentação ou o ganho de peso",
    ]}],
  },
  "j26-143": {
    icon: ShieldAlert, gradient: "from-fuchsia-500 to-rose-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia o ARFID — transtorno alimentar restritivo/evitativo (maior = mais grave). Diferencia da anorexia (aqui não há medo de engordar). Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "ARFID (maior = mais grave)", bands: SEVERITY_BANDS,
    domains: [{ name: "Restrição/evitação alimentar", color: "text-fuchsia-600 dark:text-fuchsia-400", items: [
      "Come uma variedade muito restrita de alimentos","Evita alimentos por características sensoriais","Tem medo de engasgar ou vomitar ao comer","Tem pouco interesse por comida ou apetite","Não come o suficiente para crescer ou ganhar peso","Precisou de suplemento ou sonda em algum momento","Evita comer fora de casa ou em festas","A restrição prejudica o convívio social","A restrição preocupa quanto à nutrição","Teve perda de peso ou estagnação","A restrição NÃO é por medo de engordar","A restrição atrapalha a vida diária",
    ]}],
  },
  "j26-144": {
    icon: Hand, gradient: "from-teal-500 to-cyan-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Mapeia aversões por textura alimentar (maior = mais aversões). Orienta a progressão de consistências. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Aversão a texturas (maior = mais aversões)", bands: SEVERITY_BANDS,
    domains: [{ name: "Texturas rejeitadas", color: "text-teal-600 dark:text-teal-400", items: [
      "Rejeita alimentos moles ou pastosos","Rejeita alimentos granulados","Rejeita alimentos fibrosos (carne, folhas)","Rejeita alimentos crocantes","Rejeita alimentos com casca ou sementes","Rejeita comidas com texturas misturadas","Tem ânsia ao sentir certas texturas","Só aceita uma faixa estreita de consistência","Cospe quando sente uma textura indesejada","Evita pegar certos alimentos com a mão","A aversão limita muito o cardápio","A aversão atrapalha a progressão de consistências",
    ]}],
  },
  "j26-145": {
    icon: Sparkles, gradient: "from-amber-500 to-orange-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia a neofobia alimentar — recusa do novo (maior = mais intensa). Diferencia de ARFID e seletividade sensorial. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Neofobia alimentar (maior = mais intensa)", bands: SEVERITY_BANDS,
    domains: [{ name: "Recusa de novos alimentos", color: "text-amber-600 dark:text-amber-400", items: [
      "Recusa experimentar qualquer alimento novo","Diz “não gosto” antes mesmo de provar","Desconfia de pratos diferentes do habitual","Reage com medo ou aversão ao novo no prato","Precisa de muitas exposições para aceitar algo novo","Recusa se a aparência do alimento mudou","Não aceita o alimento conhecido preparado de forma diferente","Fica ansiosa diante de comida desconhecida","Prefere sempre o mesmo cardápio","A recusa do novo vem piorando ou persiste","A neofobia limita a variedade da dieta","A neofobia atrapalha refeições fora de casa",
    ]}],
  },
  "j26-146": {
    icon: Baby, gradient: "from-emerald-500 to-teal-600", instruction: DEV_INSTRUCTION,
    infoBox: "Marcos de autonomia alimentar de 6 a 36 meses (maior = mais marcos). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Autonomia alimentar 6–36 meses", bands: DEV_BANDS,
    domains: [{ name: "Marcos de autonomia alimentar", color: "text-emerald-600 dark:text-emerald-400", items: [
      "Leva a mão ou objetos à boca (início da introdução)","Come pedaços com a mão","Segura e bebe no copo","Segura a colher (mesmo sem precisão)","Leva a colher à boca sozinha","Come sozinha derramando pouco","Mastiga alimentos em pedaços","Senta na cadeirinha para comer","Aceita texturas progressivamente mais complexas","Sinaliza fome e saciedade","Participa da refeição da família","Usa garfo (conforme a idade)",
    ]}],
  },
  "j26-147": {
    icon: Heart, gradient: "from-rose-500 to-red-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Triagem de risco nutricional na criança seletiva (maior = mais risco). Orienta exames e encaminhamento à nutrição. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Risco nutricional (maior = mais risco)", bands: SEVERITY_BANDS,
    domains: [{ name: "Sinais de risco nutricional", color: "text-rose-600 dark:text-rose-400", items: [
      "A dieta é pouco variada","Come poucas frutas e verduras","Come pouca proteína (carne, ovo, feijão)","Consome muito ultraprocessado ou açúcar","Recusa grupos alimentares inteiros (laticínios, etc.)","Tem sinais de anemia (palidez, cansaço)","Está abaixo do peso ou altura esperados","Teve estagnação de peso ou altura","Toma pouca água e muito leite ou suco","Tem unhas/cabelos frágeis ou outros sinais carenciais","Já precisou de suplementação","A alimentação restrita preocupa nutricionalmente",
    ]}],
  },
  "j26-148": {
    icon: Baby, gradient: "from-pink-500 to-rose-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia dificuldades de sucção e aleitamento (maior = mais dificuldades). Podem ser o primeiro sinal neurológico. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Dificuldades de amamentação (maior = mais)", bands: SEVERITY_BANDS,
    domains: [{ name: "Sucção e aleitamento", color: "text-pink-600 dark:text-pink-400", items: [
      "Tem dificuldade de pega no peito","Suga de forma fraca ou descoordenada","Cansa-se rápido durante a mamada","As mamadas são muito longas","Engasga ou tosse ao mamar","Escapa leite pelos cantos da boca","Não esvazia bem o peito","Tem ganho de peso insuficiente","Chora ou irrita-se durante a mamada","Precisou de complemento ou fórmula por dificuldade","Tem língua presa ou alteração oral (ou já foi dito por profissional)","As dificuldades preocupam quanto à nutrição ou ao neurológico",
    ]}],
  },
  "j26-149": {
    icon: Baby, gradient: "from-amber-500 to-orange-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia a recusa alimentar no bebê de 6 a 18 meses (maior = mais grave). Afastar causas clínicas (refluxo, alergia, dor). Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Recusa alimentar do bebê (maior = mais grave)", bands: SEVERITY_BANDS,
    domains: [{ name: "Recusa alimentar", color: "text-amber-600 dark:text-amber-400", items: [
      "Recusa a mamadeira ou o peito","Recusa a introdução alimentar (papinha)","Vira o rosto ou fecha a boca ao ser alimentado","Cospe a comida oferecida","Chora durante as refeições","Aceita muito pouca quantidade","Tem ânsia ou vômito com a comida","Só aceita líquidos","Demonstra desconforto ao comer (dor, refluxo)","Tem ganho de peso insuficiente","A recusa preocupa ou persiste","A recusa gera muita ansiedade na família",
    ]}],
  },

  // ============================================================
  // LOTE 13 — Categoria 13: Dor e Cefaleia (autoral)
  // (J26-150 — Diário de Cefaleia — segue como ferramenta diária)
  // ============================================================

  "j26-151": {
    icon: Heart, gradient: "from-rose-500 to-red-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia o impacto da dor crônica na vida da criança (maior = mais impacto). Base para o plano multidisciplinar. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Impacto da dor crônica (maior = mais)", bands: SEVERITY_BANDS,
    domains: [{ name: "Impacto funcional da dor", color: "text-rose-600 dark:text-rose-400", items: [
      "A dor atrapalha a frequência ou o desempenho escolar","A dor atrapalha o sono","A dor atrapalha brincadeiras e atividades físicas","A dor atrapalha o convívio com amigos","A dor deixa a criança irritada ou triste","A criança falta à escola por causa da dor","A dor limita passeios e atividades em família","A criança evita atividades com medo da dor","A dor exige uso frequente de medicação","A dor leva a idas frequentes ao médico/pronto-socorro","A dor preocupa e sobrecarrega a família","A dor compromete a qualidade de vida no geral",
    ]}],
  },
  "j26-152": {
    icon: ShieldAlert, gradient: "from-orange-500 to-red-600", instruction:
      "Para cada frase, marque o quanto combina com você quando está com dor. Responda todos os itens.",
    infoBox: "A catastrofização amplifica a dor e prediz cronificação (maior = mais catastrofização). Alvo de abordagem psicológica. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Catastrofização da dor (maior = mais)", bands: SEVERITY_BANDS,
    domains: [{ name: "Pensamentos sobre a dor", color: "text-orange-600 dark:text-orange-400", items: [
      "Quando dói, penso que nunca vai passar","Acho que a dor é a pior coisa do mundo","Fico com medo de que a dor piore","Não consigo parar de pensar na dor","Acho que algo muito grave está acontecendo","Sinto que não consigo suportar a dor","Acho que a dor vai estragar tudo","Sinto-me impotente diante da dor","Espero o pior quando começa a doer","A dor toma conta dos meus pensamentos","Acho que ninguém entende a minha dor","Sinto que nada vai aliviar",
    ]}],
  },
  "j26-153": {
    icon: Activity, gradient: "from-violet-500 to-purple-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Caracteriza a aura da enxaqueca (maior = mais sintomas de aura). Importante diferenciar de epilepsia. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Sintomas de aura (maior = mais)", bands: SEVERITY_BANDS,
    domains: [{ name: "Sintomas que precedem a dor", color: "text-violet-600 dark:text-violet-400", items: [
      "Vê luzes, pontos ou linhas antes da dor (aura visual)","Tem áreas de visão “apagada” ou embaçada antes da dor","Sente formigamento ou dormência (aura sensitiva)","Tem dificuldade de falar ou achar palavras antes da dor","Sente fraqueza em um lado antes da dor (aura motora)","Os sintomas surgem minutos antes da dor de cabeça","Os sintomas duram de 5 a 60 minutos","Os sintomas se espalham gradualmente","Os sintomas desaparecem e então vem a dor","Os sintomas são sempre parecidos","Tem náusea ou sensibilidade à luz junto","A aura assusta a criança",
    ]}],
  },
  "j26-154": {
    icon: Heart, gradient: "from-amber-500 to-orange-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia a dor abdominal recorrente funcional (maior = mais sugestivo de funcional). Sempre afastar causas orgânicas. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Dor abdominal funcional (maior = mais sugestivo)", bands: SEVERITY_BANDS,
    domains: [{ name: "Características da dor", color: "text-amber-600 dark:text-amber-400", items: [
      "Tem dor de barriga recorrente (semanal)","A dor é em volta do umbigo","A dor não tem causa orgânica encontrada","A dor aparece em situações de estresse (escola, prova)","A dor some nos fins de semana ou férias","A dor não acorda a criança à noite","A dor vem com náusea ou falta de apetite","Não há perda de peso nem sangramento","A criança falta à escola pela dor","A dor está ligada à ansiedade","Os exames vieram normais","A dor atrapalha a rotina",
    ]}],
  },
  "j26-155": {
    icon: MessageCircle, gradient: "from-teal-500 to-cyan-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a capacidade de comunicar e localizar a dor (maior = melhor comunicação). Adaptar a avaliação ao desenvolvimento. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Comunicação da dor (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Comunicar e localizar a dor", color: "text-teal-600 dark:text-teal-400", items: [
      "Aponta onde dói","Diz que está com dor","Descreve como é a dor (queima, aperta, lateja)","Usa a escala de faces para mostrar a intensidade","Diz quando a dor começou","Diz o que melhora ou piora a dor","Localiza a dor em mais de um lugar quando é o caso","Diferencia dor de outros desconfortos","Avisa espontaneamente quando está com dor","Mantém a informação consistente sobre a dor","Usa palavras adequadas à idade sobre a dor","Coopera com a avaliação da dor",
    ]}],
  },
  "j26-156": {
    icon: Activity, gradient: "from-fuchsia-500 to-purple-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Triagem de características neuropáticas da dor (maior = mais sugestivo). Útil em neuropatias, lesões medulares e doenças metabólicas. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Dor neuropática (maior = mais sugestivo)", bands: SEVERITY_BANDS,
    domains: [{ name: "Características neuropáticas", color: "text-fuchsia-600 dark:text-fuchsia-400", items: [
      "A dor queima","A dor formiga ou dá agulhadas","A dor dá “choques”","A pele fica sensível ao toque leve (dói o que não deveria)","A dor é em uma área de nervo ou dermátomo","A dor vem com dormência na mesma área","A dor piora à noite","A dor é desproporcional ao estímulo","A dor persiste após a lesão cicatrizar","A dor não melhora com analgésico comum","Há fraqueza ou alteração de sensibilidade associada","A dor tem características diferentes de uma dor comum",
    ]}],
  },
  "j26-157": {
    icon: ShieldAlert, gradient: "from-red-600 to-rose-700", instruction:
      "Avaliação clínica. Marque a presença de cada sinal de alerta. QUALQUER item positivo muda a conduta. Responda todos os itens.",
    infoBox: "SINAIS DE ALERTA (red flags) para cefaleia secundária. Qualquer item positivo exige avaliação médica imediata e considerar neuroimagem urgente. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Sinais de alerta (qualquer positivo = avaliar já)", bands: SEVERITY_BANDS,
    domains: [{ name: "Red flags de cefaleia", color: "text-red-600 dark:text-red-400", items: [
      "“Pior dor de cabeça da vida” / início súbito e explosivo","Dor que vem piorando progressivamente","Dor que acorda à noite ou é pior ao acordar","Vômitos, especialmente “em jato” e sem náusea","Febre com rigidez de nuca","Alteração da consciência ou do comportamento","Convulsão associada","Déficit neurológico (fraqueza, alteração visual, fala)","Piora com esforço, tosse ou ao deitar","Dor sempre no mesmo lado ou local fixo","Crescimento anormal do perímetro cefálico (lactente)","Alteração de marcha/equilíbrio ou estrabismo novo",
    ]}],
  },

  // ============================================================
  // LOTE 14 — Categoria 14: Epilepsia Expandida (autoral)
  // ============================================================

  "j26-158": {
    icon: Activity, gradient: "from-violet-500 to-purple-700", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia a gravidade das crises pelo relato dos pais (maior = mais grave). Complementa o diário e guia o ajuste da medicação. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Gravidade das crises (maior = mais grave)", bands: SEVERITY_BANDS,
    domains: [{ name: "Características das crises", color: "text-violet-600 dark:text-violet-400", items: [
      "As crises são frequentes","As crises são longas (mais de 5 minutos)","As crises envolvem o corpo todo (tônico-clônicas)","A criança cai ou se machuca nas crises","Há perda de consciência nas crises","Há alteração respiratória ou de coloração na crise","O pós-crise é longo (sonolência, confusão)","As crises acontecem em série (uma após a outra)","Já precisou de pronto-socorro por crise","As crises acontecem durante o sono","As crises atrapalham as atividades diárias","As crises não estão controladas com a medicação atual",
    ]}],
  },
  "j26-159": {
    icon: ClipboardList, gradient: "from-emerald-500 to-teal-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a adesão ao tratamento antiepiléptico (maior = melhor adesão). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Adesão ao tratamento (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Adesão à medicação", color: "text-emerald-600 dark:text-emerald-400", items: [
      "Dá o remédio todos os dias","Dá nos horários certos","Dá a dose correta","Não esquece doses","Mantém o remédio em estoque (não falta)","A criança consegue engolir ou aceitar o remédio","Não interrompe por conta própria","Continua mesmo quando a criança está bem","Sabe o que fazer se esquecer uma dose","Comparece às consultas e exames de acompanhamento","Faz os exames de nível sérico quando pedido","No geral, segue o tratamento corretamente",
    ]}],
  },
  "j26-160": {
    icon: Heart, gradient: "from-blue-500 to-indigo-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Avalia o impacto da epilepsia na qualidade de vida (maior = mais impacto). Para olhar além das crises. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Impacto na qualidade de vida (maior = mais)", bands: SEVERITY_BANDS,
    domains: [{ name: "Qualidade de vida na epilepsia", color: "text-blue-600 dark:text-blue-400", items: [
      "A epilepsia atrapalha a escola","Atrapalha as amizades","Atrapalha os esportes e atividades físicas","Afeta a autoestima da criança","A criança sente vergonha ou estigma","A criança tem medo de ter crise em público","Há restrições no dia a dia (natação, bicicleta)","A criança se sente diferente dos colegas","A família tem medo constante de crise","A epilepsia limita passeios e atividades","A criança fica ansiosa ou triste com a condição","A epilepsia compromete a qualidade de vida no geral",
    ]}],
  },
  "j26-161": {
    icon: Sparkles, gradient: "from-amber-500 to-orange-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Triagem do impacto cognitivo das crises e da medicação (maior = mais impacto). Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Impacto cognitivo (maior = mais)", bands: SEVERITY_BANDS,
    domains: [{ name: "Cognição e medicação", color: "text-amber-600 dark:text-amber-400", items: [
      "Piorou a memória após as crises ou a medicação","Piorou a atenção ou a concentração","Ficou mais lenta para pensar ou responder","Caiu o rendimento escolar","Tem dificuldade de aprender coisas novas","Fica sonolenta e desligada (efeito do remédio)","Tem mais dificuldade de organização","Esquece o que estudou","Tem “brancos” ou lapsos durante o dia","As mudanças surgiram após iniciar a medicação","Tem dificuldade de acompanhar a turma","As alterações cognitivas preocupam a família",
    ]}],
  },
  "j26-162": {
    icon: Activity, gradient: "from-orange-500 to-red-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Identifica gatilhos das crises (maior = mais gatilhos associados). Importante para a prevenção. Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Gatilhos de crise (maior = mais associados)", bands: SEVERITY_BANDS,
    domains: [{ name: "Fatores desencadeantes", color: "text-orange-600 dark:text-orange-400", items: [
      "Febre desencadeia crises","Privação ou falta de sono desencadeia","Estresse ou ansiedade desencadeia","Luz piscante ou telas desencadeiam","Esquecer o remédio desencadeia","Infecções ou doenças desencadeiam","Cansaço físico excessivo desencadeia","Jejum ou hipoglicemia desencadeia","Menstruação desencadeia (catamenial)","Excesso de estimulação ou agitação desencadeia","Mudança de rotina desencadeia","Há um padrão de horário para as crises",
    ]}],
  },
  "j26-163": {
    icon: ShieldAlert, gradient: "from-teal-500 to-emerald-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia a preparação para emergência em casa e na escola (maior = mais preparada). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Preparação para emergência (maior = melhor)", bands: DEV_BANDS,
    domains: [{ name: "Preparo para a crise", color: "text-teal-600 dark:text-teal-400", items: [
      "A família sabe colocar a criança em posição de segurança","A família sabe NÃO colocar nada na boca","A família sabe cronometrar a crise","A família sabe quando chamar o SAMU (192)","A família sabe quando e como usar a medicação de resgate","A escola tem o plano de emergência por escrito","Os professores sabem o que fazer na crise","Há medicação de resgate disponível na escola","A família sabe o que observar e anotar na crise","Os contatos de emergência estão acessíveis","A família sabe o que fazer após a crise (pós-ictal)","Todos os cuidadores estão orientados",
    ]}],
  },
  "j26-164": {
    icon: Sparkles, gradient: "from-lime-500 to-green-600", instruction: DEV_INSTRUCTION,
    infoBox: "Monitorização mensal da dieta cetogênica (maior = funcionando melhor). Acompanhamento clínico/nutricional obrigatório. Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Dieta cetogênica (maior = funcionando melhor)", bands: DEV_BANDS,
    domains: [{ name: "Eficácia e tolerância", color: "text-lime-700 dark:text-lime-400", items: [
      "Houve redução das crises com a dieta","A criança mantém a cetose desejada","A criança aceita bem a dieta","A família consegue manter a dieta corretamente","O crescimento está adequado","Não há efeitos adversos importantes (constipação, etc.)","O humor ou o comportamento melhorou","A energia e a disposição estão boas","Os exames de acompanhamento estão adequados","A dieta é viável na rotina da família","A escola colabora com a dieta","No geral, a dieta cetogênica está funcionando",
    ]}],
  },
  "j26-165": {
    icon: Activity, gradient: "from-cyan-500 to-blue-600", instruction:
      "Marque a frequência de cada efeito desde o início (ou ajuste) da medicação. Responda todos os itens.",
    infoBox: "Monitorização de efeitos colaterais dos antiepilépticos (maior = mais efeitos). Relate ao médico — não suspenda por conta própria. Não é diagnóstico.",
    labels: FREQ_LABELS, totalLabel: "Efeitos adversos (maior = mais)", bands: SEVERITY_BANDS,
    domains: [{ name: "Efeitos observados", color: "text-cyan-600 dark:text-cyan-400", items: [
      "Sonolência","Perda de apetite","Ganho de peso","Irritabilidade ou agressividade","Tremor","Tontura ou desequilíbrio","Náusea ou vômito","Alterações de humor ou tristeza","Lentidão cognitiva","Alterações de pele (manchas, alergia)","Queda de cabelo","Mudanças de comportamento",
    ]}],
  },
  "j26-166": {
    icon: Heart, gradient: "from-sky-500 to-indigo-600", instruction: SEVERITY_INSTRUCTION,
    infoBox: "Rastreio de depressão e ansiedade na epilepsia (maior = mais sintomas; risco aumentado). Não é diagnóstico.",
    labels: SEVERITY_LABELS, totalLabel: "Depressão/ansiedade na epilepsia (maior = mais)", bands: SEVERITY_BANDS,
    domains: [{ name: "Humor e ansiedade", color: "text-sky-600 dark:text-sky-400", items: [
      "Está mais triste ou desanimada","Perdeu o interesse pelas coisas","Sente-se diferente ou limitada pela epilepsia","Tem medo constante de ter crise","Evita atividades por medo ou estigma","Tem baixa autoestima","Está mais irritada","Dorme mal","Mudou o apetite","Fica ansiosa com a condição","Isola-se dos amigos","Fala de forma negativa sobre o futuro",
    ]}],
  },
  "j26-167": {
    icon: Sparkles, gradient: "from-emerald-500 to-green-600", instruction: DEV_INSTRUCTION,
    infoBox: "Avalia as necessidades educacionais e a preparação da escola na epilepsia (maior = melhor). Não é diagnóstico.",
    labels: MILESTONE_LABELS, totalLabel: "Epilepsia e escola (maior = melhor preparada)", bands: DEV_BANDS,
    domains: [{ name: "Inclusão e preparo escolar", color: "text-emerald-600 dark:text-emerald-400", items: [
      "O professor sabe que a criança tem epilepsia","O professor sabe o que fazer na crise","A escola tem plano de emergência","Há medicação de resgate disponível na escola","A escola permite que a criança se recupere após a crise","Há adaptações pedagógicas quando necessário","A criança não sofre estigma na escola","A criança participa das atividades com segurança","A escola comunica as crises à família","A escola colabora com o tratamento","A criança se sente segura na escola","No geral, a inclusão escolar está adequada",
    ]}],
  },
};

/** Retorna a definição interativa de uma escala, se existir. */
export function getInteractiveScale(id: string | undefined): InteractiveScaleDef | undefined {
  return id ? interactiveScaleItems[id] : undefined;
}
