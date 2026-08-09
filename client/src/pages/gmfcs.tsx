import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accessibility, RotateCcw } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { gmfcsLevels } from "@/data/expandedScales";
import { SaveToPatient } from "@/components/SaveToPatient";
import { ClinicalReport } from "@/components/ClinicalReport";

export default function GmfcsPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed && selected !== null) {
    const level = gmfcsLevels[selected];
    const reportItems = [
      {
        question: "Qual nível GMFCS foi selecionado?",
        answer: `Nível ${level.level} — ${level.title}`,
      },
    ];

    return (
      <div className="space-y-6">
        <ClinicalReport
          scaleName="GMFCS"
          scaleFullName="Gross Motor Function Classification System"
          items={reportItems}
        />
        <SaveToPatient scaleName="GMFCS" responses={reportItems} />
        <Button
          onClick={() => {
            setSelected(null);
            setConfirmed(false);
          }}
          variant="outline"
          className="w-full gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Nova Classificação
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        icon={Accessibility}
        eyebrow="função motora grossa"
        title="GMFCS"
        subtitle="Sistema de Classificação da Função Motora Grossa — Paralisia Cerebral."
        gradient="from-teal-500 to-cyan-600"
      />
      <div className="rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 p-4">
        <p className="text-xs text-teal-800 dark:text-teal-300 leading-relaxed">
          <strong>Instruções:</strong> Leia a descrição de cada nível e
          selecione o que melhor descreve a função motora grossa habitual da
          criança. Foque no desempenho habitual, não no melhor desempenho
          possível.
        </p>
      </div>
      <div className="space-y-3">
        {gmfcsLevels.map((level, i) => (
          <Card
            key={i}
            className={`border-card-border cursor-pointer transition-all ${selected === i ? "ring-2 ring-primary shadow-md" : "hover:shadow-md"}`}
            onClick={() => setSelected(i)}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge
                  className={`bg-${level.color}-100 text-${level.color}-700 dark:bg-${level.color}-900/40 dark:text-${level.color}-300`}
                >
                  {level.level}
                </Badge>
                <h2 className="text-sm font-bold text-foreground">
                  {level.title}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {level.description}
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {level.characteristics.map((c, ci) => (
                  <span
                    key={ci}
                    className="text-xs bg-muted/50 px-2 py-0.5 rounded-full text-muted-foreground"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button
        onClick={() => setConfirmed(true)}
        disabled={selected === null}
        className="w-full"
        size="lg"
      >
        {selected !== null
          ? `Confirmar Nível ${gmfcsLevels[selected].level}`
          : "Selecione um nível"}
      </Button>
    </div>
  );
}
