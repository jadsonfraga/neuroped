import { GenericScale } from "@/components/GenericScale";
import { GraduationCap } from "lucide-react";
import { pdaeDomains, pdaeLabels, classifyPdae } from "@/data/bateriaJadson";

export default function PdaePage() {
  return (
    <GenericScale config={{
      title: "PDAE-NEXUS",
      subtitle: "Protocolo de Desempenho Acadêmico e Escolar (Ed. Infantil final ao 9º ano)",
      icon: GraduationCap,
      gradient: "from-amber-500 to-orange-600",
      instruction: "Para cada item, indique o nível de desempenho acadêmico da criança/adolescente considerando a etapa escolar atual.",
      labels: pdaeLabels,
      domains: pdaeDomains,
      infoBox: "PDAENEXUS: 24 itens, 5 domínios, máximo 72 pontos. Pontuações mais altas indicam desempenho mais adequado. Instrumento autoral — Dr. Jadson Fraga, 2026.",
      onCalculate: (answers) => {
        const domainResults = pdaeDomains.map((domain, di) => {
          const score = domain.items.reduce((sum, _, ii) => sum + (answers[`${di}-${ii}`] || 0), 0);
          const maxDomain = domain.items.length * 3;
          const ratio = score / maxDomain;
          return {
            domain: domain.name,
            score,
            classification: ratio <= 0.33 ? "Prejuízo" : ratio <= 0.67 ? "Abaixo" : ratio <= 0.83 ? "Heterogêneo" : "Adequado",
            color: ratio <= 0.33 ? "red" : ratio <= 0.67 ? "orange" : ratio <= 0.83 ? "amber" : "emerald",
          };
        });
        const total = domainResults.reduce((s, d) => s + d.score, 0);
        const result = classifyPdae(total);
        return {
          total,
          totalLabel: "Pontuação Total (máx. 72)",
          classification: result.classification,
          description: result.description,
          color: result.color,
          domainResults,
        };
      },
    }} />
  );
}
