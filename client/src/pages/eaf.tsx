import { GenericScale } from "@/components/GenericScale";
import { Users } from "lucide-react";
import { eafDomains, eafLabels, classifyEaf } from "@/data/bateriaJadson";

export default function EafPage() {
  return (
    <GenericScale config={{
      title: "EAF-NEXUS",
      subtitle: "Escala de Adaptação Funcional (2–18 anos)",
      icon: Users,
      gradient: "from-blue-500 to-cyan-600",
      instruction: "Para cada item, diferencie o que faz sozinho, o que pede ajuda espontaneamente (fala, gesto, olhar ou comunicação alternativa) e o que só realiza após o adulto oferecer auxílio. Considere a idade e o contexto.",
      labels: eafLabels,
      domains: eafDomains,
      infoBox: "EAF-NEXUS: 24 itens, 6 domínios, máximo 72 pontos. Resultado descritivo, sem normas ou pontos de corte diagnósticos validados. Pedido espontâneo de ajuda é observação clínica complementar, sem subescala própria e não inferível do total. Instrumento autoral — Dr. Jadson Fraga, 2026.",
      onCalculate: (answers) => {
        const domainResults = eafDomains.map((domain, di) => {
          const score = domain.items.reduce((sum, _, ii) => sum + (answers[`${di}-${ii}`] || 0), 0);
          const maxDomain = domain.items.length * 3;
          const ratio = score / maxDomain;
          return {
            domain: domain.name,
            score,
            classification: ratio <= 0.33 ? "Grande dependência" : ratio <= 0.67 ? "Moderada" : ratio <= 0.83 ? "Parcial" : "Satisfatória",
            color: ratio <= 0.33 ? "red" : ratio <= 0.67 ? "orange" : ratio <= 0.83 ? "amber" : "emerald",
          };
        });
        const total = domainResults.reduce((s, d) => s + d.score, 0);
        const result = classifyEaf(total);
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
