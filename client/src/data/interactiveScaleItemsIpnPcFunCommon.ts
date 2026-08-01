import type { InteractiveBand } from "./interactiveScaleItems";

export const IPN_PC_FUN_FREQ_LABELS = [
  "0 · Não ocorre / preservado",
  "1 · Leve / ocasional",
  "2 · Moderado / frequente",
  "3 · Intenso / constante",
  "N/O · Sem oportunidade / não sei",
];

export const IPN_PC_FUN_OBS_LABELS = [
  "0 · Não evidenciado / preservado",
  "1 · Leve ou ocasional",
  "2 · Moderado ou frequente",
  "3 · Consistente, intenso ou prioritário",
  "N/O · Não foi possível observar",
];

export const IPN_PC_FUN_STRENGTH_LABELS = [
  "0 · Ainda não / nunca",
  "1 · Às vezes / com muita ajuda",
  "2 · Frequentemente / com alguma ajuda",
  "3 · Consistentemente / de modo acessível",
  "N/O · Não foi possível responder",
];

export const IPN_PC_FUN_TEXT_LABELS = [
  "Registro qualitativo",
  "Sem registro aplicável",
];

export const IPN_PC_FUN_PROFILE_BANDS: InteractiveBand[] = [
  { minPct: 75, classification: "Carga funcional muito elevada — priorizar revisão", color: "red", description: "Muitos itens aparecem com intensidade elevada neste módulo. Não define gravidade global; revise risco, dor, contexto, metas, apoios e necessidade de avaliação específica." },
  { minPct: 50, classification: "Carga funcional ampla — aprofundar", color: "orange", description: "Há dificuldades frequentes em vários itens. Triangule informantes e identifique barreiras modificáveis, condições médicas e metas funcionais." },
  { minPct: 25, classification: "Sinais focais — contextualizar", color: "amber", description: "As dificuldades concentram-se em algumas tarefas ou ambientes. Registre posição, equipamento, parceiro, fadiga e resposta a suporte." },
  { minPct: 0, classification: "Poucos sinais neste módulo", color: "emerald", description: "Poucos itens foram assinalados nesta perspectiva. Isso não exclui dificuldade em outro ambiente, dor intermitente, fadiga ou baixa oportunidade de participação." },
];

export const IPN_PC_FUN_TEXT_BANDS: InteractiveBand[] = [
  { minPct: 0, classification: "Roteiro qualitativo — revisão clínica necessária", color: "emerald", description: "Este módulo organiza narrativa clínica e não produz escore. A decisão final permanece com o profissional responsável." },
];

export const IPN_PC_FUN_STRENGTH_BANDS: InteractiveBand[] = [
  { minPct: 75, classification: "Acesso e participação amplos nesta perspectiva", color: "emerald", description: "Muitas condições de voz, autonomia, conforto e pertencimento estão acessíveis. Preserve facilitadores e valide prioridades da criança." },
  { minPct: 50, classification: "Acesso parcial — remover barreiras prioritárias", color: "amber", description: "Há participação em alguns contextos, com barreiras relevantes em outros. Identifique uma mudança ambiental mensurável." },
  { minPct: 25, classification: "Acesso restrito — aprofundar apoios", color: "orange", description: "A criança relata poucas oportunidades ou recursos acessíveis. Revise comunicação, consentimento, mobilidade e pertencimento." },
  { minPct: 0, classification: "Acesso muito limitado ou resposta insuficiente", color: "red", description: "Priorize escuta apoiada, recurso de comunicação e verificação de que o formato permitiu resposta autêntica." },
];
