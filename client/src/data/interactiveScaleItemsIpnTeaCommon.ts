import type { InteractiveBand } from "./interactiveScaleItems";

export const IPN_LABELS = [
  "0 · Não observado / funcionamento esperado",
  "1 · Ocasional / leve",
  "2 · Frequente / moderado",
  "3 · Intenso / persistente",
  "N/O · Sem oportunidade / não aplicável",
];

export const IPN_OBSERVATION_LABELS = [
  "0 · Não observado",
  "1 · Observado ocasionalmente",
  "2 · Observado com frequência",
  "3 · Observado de forma consistente",
  "N/O · Sem oportunidade / não aplicável",
];

export const IPN_BANDS: InteractiveBand[] = [
  {
    minPct: 75,
    classification: "Sinais extensos — organizar avaliação prioritária",
    color: "red",
    description:
      "Densidade elevada de relatos no domínio. Não confirma TEA; revisar exemplos, impacto, trajetória, diferenciais e sentinelas.",
  },
  {
    minPct: 50,
    classification: "Sinais amplos — aprofundar",
    color: "orange",
    description:
      "Múltiplos itens frequentes ou com impacto. Triangular fontes e investigar qualidade, função e condições associadas.",
  },
  {
    minPct: 25,
    classification: "Sinais focais — contextualizar",
    color: "amber",
    description:
      "Características em parte do domínio. Verificar idade, contexto, desenvolvimento e explicações alternativas.",
  },
  {
    minPct: 0,
    classification: "Sinais esparsos no registro",
    color: "emerald",
    description:
      "Poucos itens ou baixa intensidade neste informante. Não exclui TEA, camuflagem ou dificuldade presente em outro contexto.",
  },
];
