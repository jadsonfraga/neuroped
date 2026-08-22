import { GenericScale } from "@/components/GenericScale";
import { ListChecks } from "lucide-react";
import { cbclDomains, cbclLabels, classifyCbcl } from "@/data/cbcl";

export default function CbclPage() {
  return (
    <GenericScale config={{
      title: "CBCL",
      subtitle: "Child Behavior Checklist — Triagem de Problemas Comportamentais (4-18 anos)",
      icon: ListChecks,
      gradient: "from-blue-500 to-indigo-600",
      instruction: "Para cada afirmação, indique o quanto ela descreve o comportamento da criança nos últimos 6 meses.",
      labels: cbclLabels,
      domains: cbclDomains,
      infoBox: "CBCL: Pontuações mais altas indicam maior número de problemas comportamentais. Normal ≤ percentil 84 | Limítrofe = 84-90 | Clínico ≥ percentil 90. Avaliação por Achenbach (ASEBA).",
      scaleId: "cbcl",
  onCalculate: (answers) => {
        let intScore = 0, extScore = 0, socScore = 0;
        cbclDomains.forEach((domain, di) => {
          domain.items.forEach((_item, ii) => {
            const val = answers[`${di}-${ii}`] || 0;
            if (di === 0) intScore += val;
            else if (di === 1) extScore += val;
            else socScore += val;
          });
        });
        const result = classifyCbcl(intScore, extScore, socScore);
        return {
          total: result.total,
          totalLabel: "Pontuação Total de Problemas",
          classification: result.total <= 24 ? "Normal" : result.total <= 36 ? "Limítrofe" : "Clínico",
          description: result.description,
          color: result.total <= 24 ? "emerald" : result.total <= 36 ? "amber" : "red",
          domainResults: result.results.map(r => ({ domain: r.domain, score: r.score, classification: r.classification, color: r.color })),
        };
      },
    }} />
  );
}
