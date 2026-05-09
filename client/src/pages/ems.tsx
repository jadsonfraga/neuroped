import { GenericScale } from "@/components/GenericScale";
import { VolumeX } from "lucide-react";
import { emsDomains, emsLabels, classifyEms } from "@/data/bateriaJadsonPsiq";

export default function EmsPage() {
  return (
    <GenericScale config={{
      title: "EMS-J26",
      subtitle: "Escala de Mutismo Seletivo",
      icon: VolumeX,
      gradient: "from-violet-500 to-purple-600",
      instruction: "Para cada item, indique a frequência com que a criança apresenta o comportamento descrito, considerando o contraste entre ambientes familiares e externos.",
      labels: emsLabels,
      domains: emsDomains,
      infoBox: "EMS-J26: 16 itens, domínio único, máximo 48 pontos. Pontuações mais altas indicam maior probabilidade de mutismo seletivo. Instrumento autoral — Dr. Jadson Fraga, 2026.",
      onCalculate: (answers) => {
        const total = emsDomains[0].items.reduce((sum, _, ii) => sum + (answers[`0-${ii}`] || 0), 0);
        const result = classifyEms(total);
        return {
          total,
          totalLabel: "Pontuação Total (máx. 48)",
          classification: result.classification,
          description: result.description,
          color: result.color,
        };
      },
    }} />
  );
}
