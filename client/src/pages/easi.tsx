import { GenericScale } from "@/components/GenericScale";
import { Users } from "lucide-react";
import { easiDomains, easiLabels, classifyEasi } from "@/data/bateriaJadsonPsiq";

export default function EasiPage() {
  return (
    <GenericScale config={{
      title: "EASI-NEXUS",
      subtitle: "Escala de Ansiedade Social Infantil",
      icon: Users,
      gradient: "from-orange-500 to-red-500",
      instruction: "Para cada item, indique a frequência com que a criança/adolescente apresenta o comportamento descrito em contextos sociais.",
      labels: easiLabels,
      domains: easiDomains,
      infoBox: "EASINEXUS: 15 itens, domínio único, máximo 45 pontos. Pontuações mais altas indicam maior ansiedade social. Instrumento autoral — Dr. Jadson Fraga, 2026.",
      onCalculate: (answers) => {
        const total = easiDomains[0].items.reduce((sum, _, ii) => sum + (answers[`0-${ii}`] || 0), 0);
        const result = classifyEasi(total);
        return {
          total,
          totalLabel: "Pontuação Total (máx. 45)",
          classification: result.classification,
          description: result.description,
          color: result.color,
        };
      },
    }} />
  );
}
