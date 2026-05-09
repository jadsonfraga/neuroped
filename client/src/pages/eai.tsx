import { GenericScale } from "@/components/GenericScale";
import { AlertTriangle } from "lucide-react";
import { eaiDomains, eaiLabels, classifyEai } from "@/data/bateriaJadsonPsiq";

export default function EaiPage() {
  return (
    <GenericScale config={{
      title: "EAI-J26",
      subtitle: "Escala de Ansiedade Infantil",
      icon: AlertTriangle,
      gradient: "from-amber-500 to-yellow-600",
      instruction: "Para cada item, indique a frequência com que a criança/adolescente apresenta o comportamento descrito.",
      labels: eaiLabels,
      domains: eaiDomains,
      infoBox: "EAI-J26: 21 itens, domínio único, máximo 63 pontos. Pontuações mais altas indicam maior sintomatologia ansiosa. Instrumento autoral — Dr. Jadson Fraga, 2026.",
      onCalculate: (answers) => {
        const total = eaiDomains[0].items.reduce((sum, _, ii) => sum + (answers[`0-${ii}`] || 0), 0);
        const result = classifyEai(total);
        return {
          total,
          totalLabel: "Pontuação Total (máx. 63)",
          classification: result.classification,
          description: result.description,
          color: result.color,
        };
      },
    }} />
  );
}
