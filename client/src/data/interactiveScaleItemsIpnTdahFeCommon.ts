import type { InteractiveBand } from "./interactiveScaleItems";

export const IPN_TDAH_FE_LABELS = [
  "0 · Não ocorre / sem dificuldade",
  "1 · Ocasional / leve",
  "2 · Frequente / moderado",
  "3 · Muito frequente / intenso",
  "N/O · Sem oportunidade / não sei",
];

export const IPN_TDAH_FE_OBSERVATION_LABELS = [
  "0 · Não evidenciado",
  "1 · Evidenciado de forma leve ou ocasional",
  "2 · Evidenciado com frequência ou impacto moderado",
  "3 · Evidenciado de forma consistente ou intensa",
  "N/O · Não foi possível observar",
];

// O componente genérico exige ao menos duas opções configuradas. Nos módulos
// integralmente textuais elas funcionam apenas como contrato estrutural e nunca
// aparecem como resposta nem geram pontuação.
export const IPN_TDAH_FE_TEXT_LABELS = [
  "Registro qualitativo",
  "Sem registro aplicável",
];

export const IPN_TDAH_FE_BANDS: InteractiveBand[] = [
  {
    minPct: 75,
    classification: "Carga funcional muito elevada — priorizar avaliação",
    color: "red",
    description:
      "Muitos itens aparecem com intensidade ou frequência elevada neste informante. Não confirma TDAH; revisar trajetória, prejuízo, pervasividade, sono, aprendizagem, comorbidades, diferenciais e sentinelas.",
  },
  {
    minPct: 50,
    classification: "Sinais amplos e prejuízo provável — aprofundar",
    color: "orange",
    description:
      "Há um padrão amplo de dificuldades de atenção, inibição ou funções executivas. Triangular ambientes e investigar se o impacto é persistente e desproporcional à idade.",
  },
  {
    minPct: 25,
    classification: "Sinais focais — contextualizar",
    color: "amber",
    description:
      "As dificuldades concentram-se em alguns domínios ou situações. Verificar demanda, oportunidade, ensino, sono, emoção e resposta a suporte ambiental.",
  },
  {
    minPct: 0,
    classification: "Poucos sinais neste registro",
    color: "emerald",
    description:
      "Poucos itens foram assinalados neste informante. Isso não exclui TDAH, camuflagem, prejuízo em outro contexto ou dificuldade que aparece apenas sob maior demanda.",
  },
];

export const IPN_TDAH_FE_TEXT_BANDS: InteractiveBand[] = [
  {
    minPct: 0,
    classification: "Roteiro concluído — revisão clínica qualitativa necessária",
    color: "emerald",
    description:
      "Este módulo organiza texto clínico e não produz escore. Integre os registros com história, exame, múltiplos informantes e instrumentos apropriados.",
  },
];
