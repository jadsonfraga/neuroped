import { GenericScale } from "@/components/GenericScale";
import { Moon } from "lucide-react";
import { cshqDomains, cshqLabels, classifyCshq } from "@/data/expandedScales";

export default function CshqPage() {
  return (
    <GenericScale config={{
      title: "CSHQ",
      subtitle: "Questionário de Hábitos de Sono Infantil — 4 a 10 anos",
      icon: Moon,
      gradient: "from-indigo-500 to-purple-600",
      instruction: "Para cada afirmação, indique a frequência na última semana (ou semana típica). Responda pensando no comportamento habitual da criança.",
      labels: cshqLabels,
      domains: cshqDomains,
      infoBox: "CSHQ: Ponto de corte total ≥41 sugere distúrbio do sono. Avalia resistência, início do sono, duração, ansiedade, despertares noturnos, parassonias e sonolência diurna. Sensibilidade 0.80, especificidade 0.72.",
      scaleId: "cshq",
  onCalculate: (answers) => {
        let total = 0;
        const domainResults = cshqDomains.map((domain, di) => {
          let sum = 0;
          domain.items.forEach((_item, ii) => {
            sum += (answers[`${di}-${ii}`] || 0) + 1; // CSHQ scores 1-3
          });
          total += sum;
          return {
            domain: domain.name,
            score: sum,
            classification: sum <= Math.ceil(domain.items.length * 1.5) ? "Normal" : "Elevado",
            color: sum <= Math.ceil(domain.items.length * 1.5) ? "emerald" as const : "red" as const,
          };
        });
        const result = classifyCshq(total);
        return {
          total,
          totalLabel: "Pontuação Total CSHQ",
          classification: result.classification,
          description: result.description,
          color: result.color,
          domainResults,
        };
      },
    }} />
  );
}
