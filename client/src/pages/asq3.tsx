import { useState } from "react";
import { GenericScale } from "@/components/GenericScale";
import { Baby } from "lucide-react";
import { asq3Domains, asq3Labels, asq3Values, asq3AgeGroups, classifyAsq3Domain } from "@/data/expandedScales";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Asq3Page() {
  const [selectedAge, setSelectedAge] = useState<number | null>(null);

  if (!selectedAge) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-sm">
            <Baby className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">ASQ-3</h1>
            <p className="text-xs text-muted-foreground">Ages & Stages Questionnaire — 1 a 60 meses</p>
          </div>
        </div>
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-4">
          <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
            <strong>Selecione a faixa etária da criança</strong> para iniciar a triagem do desenvolvimento.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {asq3AgeGroups.map((ag) => (
            <Card key={ag.months} className="border-card-border cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedAge(ag.months)}>
              <CardContent className="p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{ag.label}</span>
                <Badge variant="outline" className="text-xs">{ag.months}m</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setSelectedAge(null)} className="text-xs text-primary hover:underline">← Voltar para seleção de idade</button>
      <GenericScale config={{
        title: "ASQ-3",
        subtitle: `Triagem do Desenvolvimento — ${selectedAge} meses`,
        icon: Baby,
        gradient: "from-emerald-500 to-green-600",
        instruction: `Para cada habilidade, indique se a criança de ${selectedAge} meses realiza a atividade descrita. Considere o que ela faz habitualmente.`,
        labels: asq3Labels,
        domains: asq3Domains,
        infoBox: "ASQ-3: Triagem do desenvolvimento com pontos de corte por faixa etária. 'Sim' = 10pts, 'Às vezes' = 5pts, 'Ainda não' = 0pts. Abaixo do corte = encaminhamento para avaliação.",
        scaleId: "asq3",
  onCalculate: (answers) => {
          const domainResults = asq3Domains.map((domain, di) => {
            let sum = 0;
            domain.items.forEach((_item, ii) => {
              const val = answers[`${di}-${ii}`];
              if (val !== undefined) sum += asq3Values[val];
            });
            const cls = classifyAsq3Domain(sum);
            return { domain: domain.name, score: sum, classification: cls.classification, color: cls.color };
          });
          const total = domainResults.reduce((s, r) => s + r.score, 0);
          const anyRed = domainResults.some(r => r.color === "red");
          const anyAmber = domainResults.some(r => r.color === "amber");
          return {
            total,
            totalLabel: "Pontuação Total (soma dos domínios)",
            classification: anyRed ? "Encaminhar" : anyAmber ? "Monitorar" : "Adequado",
            description: anyRed
              ? "Um ou mais domínios abaixo do esperado. Encaminhamento para avaliação do desenvolvimento indicado."
              : anyAmber
              ? "Um ou mais domínios próximos ao ponto de corte. Estimulação e reavaliação recomendadas."
              : "Desenvolvimento dentro do esperado em todos os domínios avaliados.",
            color: anyRed ? "red" : anyAmber ? "amber" : "emerald",
            domainResults,
          };
        },
      }} />
    </div>
  );
}
