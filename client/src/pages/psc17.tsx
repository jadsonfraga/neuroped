import { ClipboardList } from "lucide-react";
import { GenericScale } from "@/components/GenericScale";

const config = {
  title: "PSC-17",
  subtitle: "Pediatric Symptom Checklist — 4 a 16 anos, relato dos pais",
  icon: ClipboardList,
  gradient: "from-violet-500 to-purple-600",
  instruction:
    "Para cada afirmação abaixo, indique com que frequência o comportamento descrito se aplica ao seu filho(a) nas últimas 4 semanas. Responda todos os 17 itens.",
  labels: ["Nunca (0)", "Às vezes (1)", "Frequente (2)"],
  infoBox:
    "Pontos de corte: Total ≥ 15 = comprometimento significativo. Internalização ≥ 5, Externalização ≥ 7, Atenção ≥ 7 sugerem comprometimento no respectivo domínio. Resultado positivo indica necessidade de avaliação mais detalhada — não constitui diagnóstico.",
  domains: [
    {
      name: "Internalização",
      color: "text-blue-600 dark:text-blue-400",
      items: [
        "Parece triste ou infeliz",
        "Recusa-se a compartilhar",
        "Parece sem esperança",
        "Está mais triste do que o normal",
        "Culpa-se por problemas",
        "Preocupa-se muito",
      ],
    },
    {
      name: "Externalização",
      color: "text-orange-600 dark:text-orange-400",
      items: [
        "É irritável ou zangado(a)",
        "Não entende os sentimentos dos outros",
        "Briga com outras crianças",
        "Provoca os outros",
        "Recusa-se a obedecer regras",
        "É cruel com animais",
      ],
    },
    {
      name: "Atenção",
      color: "text-purple-600 dark:text-purple-400",
      items: [
        "Sonha acordado(a) demais",
        "Tem dificuldade de concentração",
        "Age como se fosse movido(a) por um motor",
        "Inquieto(a), não consegue ficar parado(a)",
        "Distrai-se facilmente",
      ],
    },
  ],
  onCalculate: (answers: Record<string, number>) => {
    // Domain 0: items 0-0 to 0-5 (Internalização, 6 items)
    // Domain 1: items 1-0 to 1-5 (Externalização, 6 items)
    // Domain 2: items 2-0 to 2-4 (Atenção, 5 items)
    const intScore = [0, 1, 2, 3, 4, 5].reduce((s, i) => s + (answers[`0-${i}`] ?? 0), 0);
    const extScore = [0, 1, 2, 3, 4, 5].reduce((s, i) => s + (answers[`1-${i}`] ?? 0), 0);
    const attnScore = [0, 1, 2, 3, 4].reduce((s, i) => s + (answers[`2-${i}`] ?? 0), 0);
    const total = intScore + extScore + attnScore;

    const classification =
      total < 15
        ? "Sem comprometimento"
        : total < 20
        ? "Comprometimento limítrofe"
        : "Comprometimento significativo — encaminhar";

    const color =
      total < 15 ? "emerald" : total < 20 ? "amber" : "red";

    const intClass = intScore >= 5 ? "Acima do ponto de corte (≥5)" : "Dentro do esperado (<5)";
    const extClass = extScore >= 7 ? "Acima do ponto de corte (≥7)" : "Dentro do esperado (<7)";
    const attnClass = attnScore >= 7 ? "Acima do ponto de corte (≥7)" : "Dentro do esperado (<7)";

    const description =
      total < 15
        ? "Pontuação total abaixo do ponto de corte. Não há indicativo de comprometimento psicossocial significativo pela triagem PSC-17. Recomenda-se monitorização em consultas de rotina."
        : total < 20
        ? "Pontuação na faixa limítrofe. Considerar reavaliação em 4 a 6 semanas e investigação mais detalhada dos domínios afetados."
        : "Pontuação total acima do ponto de corte. Resultado sugestivo de comprometimento psicossocial significativo. Recomendam-se avaliação clínica complementar e encaminhamento especializado conforme domínios comprometidos.";

    return {
      total,
      totalLabel: "Pontuação Total PSC-17 (máx. 34)",
      classification,
      color,
      description,
      domainResults: [
        { domain: "Internalização (máx. 12)", score: intScore, classification: intClass, color: intScore >= 5 ? "red" : "emerald" },
        { domain: "Externalização (máx. 12)", score: extScore, classification: extClass, color: extScore >= 7 ? "red" : "emerald" },
        { domain: "Atenção (máx. 10)", score: attnScore, classification: attnClass, color: attnScore >= 7 ? "red" : "emerald" },
      ],
    };
  },
};

export default function Psc17Page() {
  return <GenericScale config={config} />;
}
