import { GenericScale } from "@/components/GenericScale";
import { Waves } from "lucide-react";
import { ipsDomains, ipsLabels, classifyIps } from "@/data/bateriaJadson";

export default function IpsPage() {
  return (
    <GenericScale config={{
      title: "IPS-J26",
      subtitle: "Inventário de Processamento Sensorial (18m–14 anos)",
      icon: Waves,
      gradient: "from-rose-500 to-pink-600",
      instruction: "Para cada item, indique a frequência com que a criança apresenta o comportamento descrito. Atenção: pontuações mais altas indicam MAIOR alteração sensorial.",
      labels: ipsLabels,
      domains: ipsDomains,
      infoBox: "IPS-J26: 24 itens, 6 domínios, máximo 72 pontos. ATENÇÃO: escala invertida — pontuações mais altas indicam maior alteração sensorial e impacto funcional. Instrumento autoral — Dr. Jadson Fraga, 2026.",
      onCalculate: (answers) => {
        const domainResults = ipsDomains.map((domain, di) => {
          const score = domain.items.reduce((sum, _, ii) => sum + (answers[`${di}-${ii}`] || 0), 0);
          const maxDomain = domain.items.length * 3;
          const ratio = score / maxDomain;
          return {
            domain: domain.name,
            score,
            classification: ratio <= 0.25 ? "Poucos sinais" : ratio <= 0.50 ? "Leve/moderado" : ratio <= 0.75 ? "Significativo" : "Importante",
            color: ratio <= 0.25 ? "emerald" : ratio <= 0.50 ? "amber" : ratio <= 0.75 ? "orange" : "red",
          };
        });
        const total = domainResults.reduce((s, d) => s + d.score, 0);
        const result = classifyIps(total);
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
