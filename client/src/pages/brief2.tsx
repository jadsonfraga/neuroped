import { GenericScale } from "@/components/GenericScale";
import { BrainCircuit } from "lucide-react";
import { brief2Domains, brief2Labels, classifyBrief2 } from "@/data/expandedScales";

export default function Brief2Page() {
  return (
    <GenericScale config={{
      title: "BRIEF-2",
      subtitle: "Inventário de Funções Executivas — Triagem (5-18 anos)",
      icon: BrainCircuit,
      gradient: "from-purple-500 to-violet-600",
      instruction: "Para cada afirmação, indique a frequência com que o comportamento tem sido um problema nos últimos 6 meses.",
      labels: brief2Labels,
      domains: brief2Domains,
      infoBox: "BRIEF-2: T-score ≥65 = clinicamente significativo. T-score 60-64 = potencialmente clínico. Avalia inibição, flexibilidade, controle emocional, memória de trabalho e planejamento/organização.",
      scaleId: "brief2",
  onCalculate: (answers) => {
        const domainScores: Record<string, number> = {};
        brief2Domains.forEach((domain, di) => {
          let sum = 0;
          domain.items.forEach((_item, ii) => {
            sum += answers[`${di}-${ii}`] || 0;
          });
          domainScores[domain.name] = sum;
        });
        const results = classifyBrief2(domainScores);
        const total = Object.values(domainScores).reduce((a, b) => a + b, 0);
        const anyClinical = results.some(r => r.color === "red");
        return {
          total,
          totalLabel: "Pontuação Total Bruta",
          classification: anyClinical ? "Dificuldades Identificadas" : "Dentro do Esperado",
          description: anyClinical
            ? "Uma ou mais áreas de função executiva apresentam dificuldades clinicamente significativas. Avaliação neuropsicológica recomendada."
            : "Funções executivas dentro dos parâmetros esperados para a idade.",
          color: anyClinical ? "red" : "emerald",
          domainResults: results.map(r => ({
            domain: r.domain,
            score: r.score,
            classification: `${r.classification} (T≈${r.tScore})`,
            color: r.color,
          })),
        };
      },
    }} />
  );
}
