import { GenericScale } from "@/components/GenericScale";
import { UtensilsCrossed } from "lucide-react";
import { etareDomains, etareLabels, classifyEtare } from "@/data/bateriaJadsonPsiq";

export default function EtarePage() {
  return (
    <GenericScale config={{
      title: "ETARE-J26",
      subtitle: "Escala de Transtorno Alimentar Restritivo Evitativo",
      icon: UtensilsCrossed,
      gradient: "from-lime-500 to-green-600",
      instruction: "Para cada item, indique a frequência com que a criança/adolescente apresenta o comportamento alimentar descrito.",
      labels: etareLabels,
      domains: etareDomains,
      infoBox: "ETARE-J26: 19 itens, domínio único, máximo 57 pontos. O item 13 (ausência de foco em emagrecer) ajuda a distinguir TARE de anorexia nervosa. Instrumento autoral — Dr. Jadson Fraga, 2026.",
      onCalculate: (answers) => {
        const total = etareDomains[0].items.reduce((sum, _, ii) => sum + (answers[`0-${ii}`] || 0), 0);
        const result = classifyEtare(total);
        return {
          total,
          totalLabel: "Pontuação Total (máx. 57)",
          classification: result.classification,
          description: result.description,
          color: result.color,
        };
      },
    }} />
  );
}
