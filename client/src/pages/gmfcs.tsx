import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accessibility, RotateCcw, CheckCircle2, Info } from "lucide-react";
import { gmfcsLevels } from "@/data/expandedScales";
import { SaveToPatient } from "@/components/SaveToPatient";
import { ClinicalReport } from "@/components/ClinicalReport";

export default function GmfcsPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed && selected !== null) {
    const level = gmfcsLevels[selected];
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-sm">
            <Accessibility className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — GMFCS</h1>
            <p className="text-xs text-muted-foreground">Classificação da Função Motora Grossa</p>
          </div>
        </div>
        <Card className="border-card-border">
          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-3">
              <div className="text-4xl font-bold text-foreground">Nível {level.level}</div>
              <Badge className={`text-sm px-4 py-1.5 bg-${level.color}-100 text-${level.color}-700 dark:bg-${level.color}-900/40 dark:text-${level.color}-300`}>
                {level.title}
              </Badge>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground leading-relaxed">{level.description}</p>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Características</h3>
              {level.characteristics.map((c, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                  <span className="text-xs text-primary font-bold mt-0.5">•</span>
                  <p className="text-xs text-foreground leading-relaxed">{c}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-teal-800 dark:text-teal-300 space-y-1">
                  <p><strong>GMFCS — E&R:</strong> Sistema de classificação da função motora grossa para paralisia cerebral.</p>
                  <p>5 níveis baseados no movimento iniciado voluntariamente, com ênfase no sentar, transferências e mobilidade.</p>
                  <p>Classificações são estáveis ao longo do tempo, mas revisadas por faixas etárias (0-2, 2-4, 4-6, 6-12, 12-18 anos).</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <SaveToPatient
          scaleName="GMFCS"
          totalScore={selected + 1}
          classification={level.title}
          answers={{ selected }}
        />
        <ClinicalReport
          scaleName="GMFCS"
          scaleFullName="Gross Motor Function Classification System"
          totalScore={selected + 1}
          maxScore={5}
          classification={level.title}
          description={level.description}
          items={level.characteristics.map((c) => ({ question: c, answer: "Presente", value: 1 }))}
        />
        <Button onClick={() => { setSelected(null); setConfirmed(false); }} variant="outline" className="w-full gap-2">
          <RotateCcw className="w-4 h-4" /> Nova Classificação
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-sm">
          <Accessibility className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">GMFCS</h1>
          <p className="text-xs text-muted-foreground">Sistema de Classificação da Função Motora Grossa — Paralisia Cerebral</p>
        </div>
      </div>
      <div className="rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 p-4">
        <p className="text-xs text-teal-800 dark:text-teal-300 leading-relaxed">
          <strong>Instruções:</strong> Leia a descrição de cada nível e selecione o que melhor descreve a função motora grossa habitual da criança. Foque no desempenho habitual, não no melhor desempenho possível.
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
                <Badge className={`bg-${level.color}-100 text-${level.color}-700 dark:bg-${level.color}-900/40 dark:text-${level.color}-300`}>
                  {level.level}
                </Badge>
                <h3 className="text-sm font-bold text-foreground">{level.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{level.description}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {level.characteristics.map((c, ci) => (
                  <span key={ci} className="text-xs bg-muted/50 px-2 py-0.5 rounded-full text-muted-foreground">{c}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button onClick={() => setConfirmed(true)} disabled={selected === null} className="w-full" size="lg">
        {selected !== null ? `Confirmar Nível ${gmfcsLevels[selected].level}` : "Selecione um nível"}
      </Button>
    </div>
  );
}
