import { GenericScale } from "@/components/GenericScale";
import { Heart } from "lucide-react";
import { pedsqlDomains, pedsqlLabels, pedsqlValues, classifyPedsql } from "@/data/expandedScales";

export default function PedsqlPage() {
  return (
    <GenericScale config={{
      title: "PedsQL",
      subtitle: "Qualidade de Vida Pediátrica — 2 a 18 anos",
      icon: Heart,
      gradient: "from-pink-500 to-rose-500",
      instruction: "No último mês, com que frequência a criança/adolescente teve problemas com cada item a seguir?",
      labels: pedsqlLabels,
      domains: pedsqlDomains,
      infoBox: "PedsQL 4.0: Pontuações transformadas em escala 0-100 (100 = melhor qualidade de vida). Pontuação ≥70 = boa QV | 50-69 = moderada | <50 = comprometida. Avalia funcionamento físico, emocional, social e escolar.",
      scaleId: "pedsql",
  onCalculate: (answers) => {
        const domainScores: Record<string, number> = {};
        pedsqlDomains.forEach((domain, di) => {
          let sum = 0;
          let count = 0;
          domain.items.forEach((_item, ii) => {
            const val = answers[`${di}-${ii}`];
            if (val !== undefined) {
              sum += pedsqlValues[val];
              count++;
            }
          });
          domainScores[domain.name] = count > 0 ? sum / count : 0;
        });
        const results = classifyPedsql(domainScores);
        const allScores = results.map(r => r.score);
        const avgTotal = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
        return {
          total: avgTotal,
          totalLabel: "Qualidade de Vida Global (0-100)",
          classification: avgTotal >= 70 ? "Boa" : avgTotal >= 50 ? "Moderada" : "Comprometida",
          description: avgTotal >= 70
            ? "Qualidade de vida global boa. Manter acompanhamento."
            : avgTotal >= 50
            ? "Qualidade de vida moderada. Identificar domínios afetados para intervenção."
            : "Qualidade de vida comprometida. Avaliação multidisciplinar recomendada.",
          color: avgTotal >= 70 ? "emerald" : avgTotal >= 50 ? "amber" : "red",
          domainResults: results.map(r => ({
            domain: r.domain,
            score: r.score,
            classification: r.level,
            color: r.color,
          })),
        };
      },
    }} />
  );
}
