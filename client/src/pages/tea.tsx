import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Puzzle, ArrowLeft, Info, RotateCcw, BookOpen, BarChart3
} from "lucide-react";
import {
  autismScales, quickRefSummary, bestOfEach,
  type AutismScale
} from "@/data/autismScales";
import { SaveToPatient } from "@/components/SaveToPatient";
import { ClinicalReport } from "@/components/ClinicalReport";

function ScaleSelector({ onSelect }: { onSelect: (s: AutismScale) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
          <Puzzle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Checklists TEA</h1>
          <p className="text-xs text-muted-foreground">5 instrumentos adaptados para avaliação do autismo</p>
        </div>
      </div>

      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
            Checklists clínicos adaptados inspirados nos principais instrumentos de avaliação do TEA: ADOS-2 (observação direta), ADI-R (entrevista), CARS-2 (dimensional), GARS-3 (subdomínios) e SRS-2 (responsividade social).
          </p>
        </div>
      </div>

      {/* Quick reference summary */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> Referência Rápida
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {quickRefSummary.map((ref) => (
            <Card key={ref.shortName} className="border-card-border">
              <CardContent className="p-3 space-y-1">
                <Badge variant="outline" className="text-xs font-bold">{ref.shortName}</Badge>
                <div className="flex flex-wrap gap-1">
                  {ref.domains.map((d) => (
                    <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Best of each */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> O Melhor de Cada
        </h2>
        {bestOfEach.map((b) => (
          <Card key={b.scale} className="border-card-border">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary text-xs font-bold">{b.scale}</Badge>
                <span className="text-xs text-foreground font-medium">{b.strength}</span>
              </div>
              <p className="text-xs text-muted-foreground italic">“{b.motto}”</p>
              <div className="flex flex-wrap gap-1">
                {b.picks.map((p) => (
                  <span key={p} className="text-xs bg-muted/50 px-2 py-0.5 rounded-full text-muted-foreground">{p}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scale selection */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground">Aplicar Checklist</h2>
        {autismScales.map((scale) => (
          <Card
            key={scale.id}
            className="border-card-border cursor-pointer hover:shadow-md transition-all"
            onClick={() => onSelect(scale)}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${scale.gradient} flex items-center justify-center shadow-sm`}>
                  <Puzzle className="w-4 h-4 text-white" />
                </div>
                <Badge variant="outline" className="text-xs">{scale.type === "checklist" ? "Checklist" : "Dimensional"}</Badge>
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">{scale.shortName}</h3>
                <p className="text-xs text-primary">{scale.fullNamePt}</p>
              </div>
              <p className="text-xs text-muted-foreground">{scale.focus}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Sens: {scale.psychometrics.sensitivity}</span>
                <span>Esp: {scale.psychometrics.specificity}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ScaleApplication({ scale, onBack }: { scale: AutismScale; onBack: () => void }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);

  const isChecklist = scale.type === "checklist" && scale.domains;
  const isDimensional = scale.type === "dimensional" && scale.dimensionalDomains;

  const allItems = isChecklist
    ? scale.domains!.flatMap((d) => d.items.map((item) => ({ ...item, domain: d.title })))
    : isDimensional
    ? scale.dimensionalDomains!.flatMap((d) => d.items.map((item) => ({ id: item.id, text: item.text, domain: d.title, severityOptions: item.severityOptions })))
    : [];

  const total = allItems.length;
  const answered = Object.keys(answers).length;
  const progress = (answered / total) * 100;

  if (showResult) {
    const presentCount = isChecklist
      ? Object.values(answers).filter((v) => v === 1).length
      : 0;
    const totalScore = isDimensional
      ? Object.values(answers).reduce((a, b) => a + b, 0)
      : presentCount;

    const answerLabel = (item: (typeof allItems)[number]) => {
      const val = answers[item.id];
      if (val === undefined) return "—";
      if (isChecklist) return val === 1 ? "Presente" : "Ausente";
      return (item as any).severityOptions?.find((o: any) => o.value === val)?.label ?? String(val);
    };

    const grouped = allItems.reduce((acc, it) => {
      (acc[it.domain] ??= []).push(it);
      return acc;
    }, {} as Record<string, typeof allItems>);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${scale.gradient} flex items-center justify-center shadow-sm`}>
            <Puzzle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — {scale.shortName}</h1>
            <p className="text-xs text-muted-foreground">{scale.fullNamePt}</p>
          </div>
        </div>
        <Card className="border-card-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-bold text-foreground">Perguntas e respostas</h2>
            {Object.entries(grouped).map(([domainTitle, domainItems]) => (
              <div key={domainTitle} className="space-y-2">
                <h3 className="text-xs font-semibold text-primary">{domainTitle}</h3>
                {domainItems.map((item) => (
                  <div key={item.id} className="text-sm border-b border-border/40 pb-2 last:border-0">
                    <p className="text-foreground leading-relaxed">{item.text}</p>
                    <p className="text-muted-foreground mt-0.5">→ {answerLabel(item)}</p>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
        <SaveToPatient
          scaleName="Checklist TEA"
          totalScore={totalScore}
          classification=""
          answers={answers}
        />
        <ClinicalReport
          hideScore
          scaleName={scale.shortName}
          scaleFullName={scale.fullNamePt}
          classification="Registro de respostas — análise clínica pelo profissional"
          description="Transcrição das perguntas e respostas selecionadas."
          items={allItems.map((item) => ({
            question: item.text,
            answer: answerLabel(item),
            value: answers[item.id] ?? 0,
          }))}
        />
        <div className="flex gap-2">
          <Button onClick={() => { setAnswers({}); setShowResult(false); }} variant="outline" className="flex-1 gap-2">
            <RotateCcw className="w-4 h-4" /> Reaplicar
          </Button>
          <Button onClick={onBack} variant="outline" className="flex-1 gap-2">
            <ArrowLeft className="w-4 h-4" /> Outros Checklists
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-xs text-primary hover:underline flex items-center gap-1">
        <ArrowLeft className="w-3 h-3" /> Voltar
      </button>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${scale.gradient} flex items-center justify-center shadow-sm`}>
          <Puzzle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">{scale.shortName}</h1>
          <p className="text-xs text-muted-foreground">{scale.fullNamePt}</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{answered} de {total}</span><span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-4">
        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">{scale.focus}</p>
      </div>

      {isChecklist && scale.domains!.map((domain) => (
        <div key={domain.id} className="space-y-3">
          <h2 className="text-sm font-semibold text-primary py-1">{domain.title}</h2>
          {domain.items.map((item) => (
            <Card key={item.id} className="border-card-border">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
                <div className="flex gap-2">
                  {[{ val: 1, label: "Presente" }, { val: 0, label: "Ausente" }].map(({ val, label }) => (
                    <button
                      key={val}
                      onClick={() => setAnswers({ ...answers, [item.id]: val })}
                      className={`text-xs px-4 py-1.5 rounded-full border cursor-pointer transition-colors ${
                        answers[item.id] === val
                          ? val === 1 ? "bg-red-500 text-white border-red-500" : "bg-emerald-500 text-white border-emerald-500"
                          : "bg-card text-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      {isDimensional && scale.dimensionalDomains!.map((domain) => (
        <div key={domain.id} className="space-y-3">
          <h2 className="text-sm font-semibold text-primary py-1">{domain.title}</h2>
          {domain.items.map((item) => (
            <Card key={item.id} className="border-card-border">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
                <RadioGroup
                  value={answers[item.id]?.toString()}
                  onValueChange={(val) => setAnswers({ ...answers, [item.id]: parseInt(val) })}
                  className="flex flex-wrap gap-2"
                >
                  {item.severityOptions.map((opt) => (
                    <div key={opt.value} className="flex items-center">
                      <RadioGroupItem value={opt.value.toString()} id={`${item.id}-${opt.value}`} className="sr-only" />
                      <Label
                        htmlFor={`${item.id}-${opt.value}`}
                        className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                          answers[item.id] === opt.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      <Button onClick={() => setShowResult(true)} disabled={answered < total} className="w-full" size="lg">
        {answered >= total ? "Ver Resultado" : `Responda todos os ${total} itens`}
      </Button>
    </div>
  );
}

export default function TeaPage() {
  const [selectedScale, setSelectedScale] = useState<AutismScale | null>(null);

  if (selectedScale) {
    return <ScaleApplication scale={selectedScale} onBack={() => setSelectedScale(null)} />;
  }

  return <ScaleSelector onSelect={setSelectedScale} />;
}
