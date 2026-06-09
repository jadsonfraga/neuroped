import { AlertTriangle } from "lucide-react";
import { GenericScale } from "@/components/GenericScale";

const config = {
  title: "GAD-7 Pediátrico",
  subtitle: "Generalized Anxiety Disorder — ≥12 anos, autorrelato, ~2 min",
  icon: AlertTriangle,
  gradient: "from-amber-500 to-yellow-600",
  instruction:
    "Durante as últimas 2 semanas, com que frequência você foi incomodado(a) por algum dos problemas a seguir? Responda os 7 itens com sinceridade.",
  labels: [
    "Nenhuma vez (0)",
    "Vários dias (1)",
    "Mais da metade dos dias (2)",
    "Quase todos os dias (3)",
  ],
  infoBox:
    "Pontos de corte GAD-7: 0–4 = Mínimo, 5–9 = Leve, 10–14 = Moderado, ≥15 = Grave. Pontuação ≥10 sugere necessidade de avaliação clínica complementar. Escala de domínio público validada para adolescentes ≥12 anos.",
  domains: [
    {
      name: "Ansiedade Generalizada",
      color: "text-amber-600 dark:text-amber-400",
      items: [
        "Sentir-se nervoso(a), ansioso(a) ou no limite",
        "Não ser capaz de parar ou controlar preocupações",
        "Preocupar-se demais com diversas coisas",
        "Dificuldade para relaxar",
        "Ficar tão inquieto(a) que é difícil ficar parado(a)",
        "Ficar facilmente irritado(a) ou aborrecido(a)",
        "Sentir medo como se algo terrível pudesse acontecer",
      ],
    },
  ],
  onCalculate: (answers: Record<string, number>) => {
    const total = [0, 1, 2, 3, 4, 5, 6].reduce((s, i) => s + (answers[`0-${i}`] ?? 0), 0);

    const classification =
      total <= 4
        ? "Ansiedade Mínima"
        : total <= 9
        ? "Ansiedade Leve"
        : total <= 14
        ? "Ansiedade Moderada"
        : "Ansiedade Grave";

    // Severidade crescente usando o contrato de cores do GenericScale (emerald/amber/orange/red).
    const color =
      total <= 4 ? "emerald" : total <= 9 ? "amber" : total <= 14 ? "orange" : "red";

    const description =
      total <= 4
        ? "Pontuação mínima. Sem indicativo de transtorno ansioso significativo pela triagem GAD-7. Monitorização em consultas de rotina é suficiente."
        : total <= 9
        ? "Pontuação na faixa leve. Observar evolução clínica. Estratégias psicoeducativas e de manejo do estresse podem ser indicadas."
        : total <= 14
        ? "Pontuação sugestiva de ansiedade moderada. Recomenda-se avaliação clínica detalhada e consideração de intervenção psicoterapêutica."
        : "Pontuação na faixa grave. Indicado encaminhamento para avaliação especializada e possível intervenção terapêutica intensiva (psicoterapia e/ou farmacoterapia).";

    return {
      total,
      totalLabel: "Pontuação Total GAD-7 (máx. 21)",
      classification,
      color,
      description,
      domainResults: [
        {
          domain: "Ansiedade Generalizada",
          score: total,
          classification,
          color,
        },
      ],
    };
  },
};

export default function Gad7Page() {
  return <GenericScale config={config} />;
}
