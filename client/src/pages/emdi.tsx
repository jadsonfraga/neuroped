import { GenericScale } from "@/components/GenericScale";
import { Baby } from "lucide-react";
import { emdiDomains, emdiLabels, classifyEmdi } from "@/data/bateriaJadson";

export default function EmdiPage() {
  return (
    <GenericScale config={{
      title: "EMDI-J26",
      subtitle: "Escala Médica do Desenvolvimento Infantil (12m–6 anos)",
      icon: Baby,
      gradient: "from-emerald-500 to-teal-600",
      instruction: "Para cada item, assinale o nível que melhor descreve o desempenho atual da criança, considerando a faixa etária e o contexto funcional.",
      labels: emdiLabels,
      domains: emdiDomains,
      infoBox: "EMDI-J26: 36 itens, 8 domínios, máximo 108 pontos. Pontuações mais altas indicam melhor desempenho funcional. Instrumento autoral — Dr. Jadson Fraga, 2026.",
      onCalculate: (answers) => {
        const domainResults = emdiDomains.map((domain, di) => {
          const score = domain.items.reduce((sum, _, ii) => sum + (answers[`${di}-${ii}`] || 0), 0);
          const maxDomain = domain.items.length * 3;
          const ratio = score / maxDomain;
          return {
            domain: domain.name,
            score,
            classification: ratio <= 0.33 ? "Prejuízo" : ratio <= 0.67 ? "Heterogêneo" : ratio <= 0.85 ? "Vulnerável" : "Funcional",
            color: ratio <= 0.33 ? "red" : ratio <= 0.67 ? "orange" : ratio <= 0.85 ? "amber" : "emerald",
          };
        });
        const total = domainResults.reduce((s, d) => s + d.score, 0);
        const result = classifyEmdi(total);
        return {
          total,
          totalLabel: "Pontuação Total (máx. 108)",
          classification: result.classification,
          description: result.description,
          color: result.color,
          domainResults,
        };
      },
    }} />
  );
}
