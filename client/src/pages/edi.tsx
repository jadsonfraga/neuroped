import { GenericScale } from "@/components/GenericScale";
import { CloudRain } from "lucide-react";
import { ediDomains, ediLabels, classifyEdi } from "@/data/bateriaJadsonPsiq";

export default function EdiPage() {
  return (
    <GenericScale config={{
      title: "EDI-J26",
      subtitle: "Escala de Depressão Infantil",
      icon: CloudRain,
      gradient: "from-sky-500 to-blue-600",
      instruction: "Para cada item, indique a frequência com que a criança/adolescente apresenta o sintoma descrito nas últimas duas semanas.",
      labels: ediLabels,
      domains: ediDomains,
      infoBox: "EDI-J26: 28 itens, domínio único, máximo 84 pontos. ATENÇÃO: itens sobre morte/desaparecer são marcadores de alarme — qualquer pontuação ≥ 2 nesses itens exige avaliação de risco imediata. Instrumento autoral — Dr. Jadson Fraga, 2026.",
      onCalculate: (answers) => {
        const total = ediDomains[0].items.reduce((sum, _, ii) => sum + (answers[`0-${ii}`] || 0), 0);
        const result = classifyEdi(total);
        return {
          total,
          totalLabel: "Pontuação Total (máx. 84)",
          classification: result.classification,
          description: result.description,
          color: result.color,
        };
      },
    }} />
  );
}
