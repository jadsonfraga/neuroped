import { GenericScale } from "@/components/GenericScale";
import { Zap } from "lucide-react";
import { vanderbiltDomains, vanderbiltLabels, classifyVanderbilt } from "@/data/expandedScales";

export default function VanderbiltPage() {
  return (
    <GenericScale config={{
      title: "Vanderbilt (NICHQ)",
      subtitle: "Escala de Avaliação para TDAH — Pais (6-12 anos)",
      icon: Zap,
      gradient: "from-orange-500 to-red-500",
      instruction: "Para cada comportamento, avalie a frequência com que ocorre. Considere o comportamento da criança nos últimos 6 meses.",
      labels: vanderbiltLabels,
      domains: vanderbiltDomains,
      infoBox: "Vanderbilt: Triagem positiva = ≥6 itens pontuados 2 ou 3 em Desatenção e/ou Hiperatividade. Conduta/Oposição: ≥4 itens pontuados 2 ou 3. Avaliação complementar necessária para diagnóstico.",
      scaleId: "vanderbilt",
  onCalculate: (answers) => {
        // Count items scored ≥2 in each domain
        let inattCount = 0, hyperCount = 0, conductCount = 0;
        let inattTotal = 0, hyperTotal = 0, conductTotal = 0;
        vanderbiltDomains.forEach((domain, di) => {
          domain.items.forEach((_item, ii) => {
            const val = answers[`${di}-${ii}`] || 0;
            if (di === 0) { inattTotal += val; if (val >= 2) inattCount++; }
            else if (di === 1) { hyperTotal += val; if (val >= 2) hyperCount++; }
            else { conductTotal += val; if (val >= 2) conductCount++; }
          });
        });
        const results = classifyVanderbilt(inattCount, hyperCount, conductCount);
        const anyPositive = results.some(r => r.positive);
        return {
          total: inattTotal + hyperTotal + conductTotal,
          totalLabel: "Pontuação Total",
          classification: anyPositive ? "Triagem Positiva" : "Triagem Negativa",
          description: anyPositive
            ? "Triagem positiva para TDAH e/ou problemas de conduta. Avaliação diagnóstica aprofundada recomendada."
            : "Triagem negativa. Sintomas abaixo do ponto de corte para TDAH neste instrumento.",
          color: anyPositive ? "red" : "emerald",
          domainResults: results.map(r => ({
            domain: r.domain,
            score: r.score,
            classification: r.positive ? "Positivo" : "Negativo",
            color: r.positive ? "red" : "emerald",
          })),
        };
      },
    }} />
  );
}
