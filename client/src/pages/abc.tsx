import { GenericScale } from "@/components/GenericScale";
import { Gauge } from "lucide-react";
import { abcDomains, abcLabels, classifyAbc } from "@/data/expandedScales";

export default function AbcPage() {
  return (
    <GenericScale config={{
      title: "ABC",
      subtitle: "Aberrant Behavior Checklist — Comportamento Aberrante",
      icon: Gauge,
      gradient: "from-red-500 to-orange-500",
      instruction: "Para cada comportamento, avalie se é um problema e a sua gravidade. Considere as últimas 4 semanas.",
      labels: abcLabels,
      domains: abcDomains,
      infoBox: "ABC: Amplamente utilizado para monitorar respostas a tratamento em populações com deficiência intelectual e TEA. Subescalas: Irritabilidade, Letargia, Estereotipia, Hiperatividade e Fala Inadequada.",
      scaleId: "abc",
  onCalculate: (answers) => {
        const domainScores: Record<string, number> = {};
        abcDomains.forEach((domain, di) => {
          let sum = 0;
          domain.items.forEach((_item, ii) => {
            sum += answers[`${di}-${ii}`] || 0;
          });
          domainScores[domain.name] = sum;
        });
        const results = classifyAbc(domainScores);
        const total = Object.values(domainScores).reduce((a, b) => a + b, 0);
        const anyElevated = results.some(r => r.color === "red");
        return {
          total,
          totalLabel: "Pontuação Total",
          classification: anyElevated ? "Elevado" : results.some(r => r.color === "amber") ? "Moderado" : "Baixo",
          description: anyElevated
            ? "Comportamentos aberrantes elevados em uma ou mais subescalas. Acompanhamento intensivo e possível intervenção farmacológica/comportamental."
            : "Níveis aceitáveis de comportamento nas subescalas avaliadas.",
          color: anyElevated ? "red" : "emerald",
          domainResults: results.map(r => ({
            domain: r.domain,
            score: r.score,
            classification: r.level,
            color: r.color,
          })),
        };
      },
    }} />
  );
}
