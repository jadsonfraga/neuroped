import { GenericScale } from "@/components/GenericScale";
import { Brain } from "lucide-react";
import { ecsmDomains, ecsmLabels, classifyEcsm } from "@/data/bateriaJadson";

export default function EcsmPage() {
  return (
    <GenericScale config={{
      title: "ECSM-NEXUS",
      subtitle: "Escala de Cognição Social e Mentalização (4–14 anos)",
      icon: Brain,
      gradient: "from-purple-500 to-violet-600",
      instruction: "Para cada item, indique com que frequência a criança demonstra a habilidade descrita em contextos naturais de interação.",
      labels: ecsmLabels,
      domains: ecsmDomains,
      infoBox: "ECSMNEXUS: 15 itens, domínio único (Cognição Social), máximo 45 pontos. Pontuações mais altas indicam melhor cognição social. Instrumento autoral — Dr. Jadson Fraga, 2026.",
      onCalculate: (answers) => {
        const total = ecsmDomains[0].items.reduce((sum, _, ii) => sum + (answers[`0-${ii}`] || 0), 0);
        const result = classifyEcsm(total);
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
