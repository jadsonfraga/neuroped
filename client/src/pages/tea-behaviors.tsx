import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Fingerprint,
  ArrowLeft,
  RotateCcw,
  Info,
  BookOpen,
  Brain,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  teaAgeGroups,
  teaConceptualBase,
  behaviorRatingLabels,
  type TeaAgeGroup,
} from "@/data/teaBehaviors";
import { SaveToPatient } from "@/components/SaveToPatient";
import { ClinicalReport } from "@/components/ClinicalReport";

function ConceptualBase() {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="border-blue-200 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-950/20">
      <CardContent className="p-4 space-y-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-blue-800 dark:text-blue-300">
              Base Conceitual — DSM-5 Critério B
            </h2>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-blue-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-blue-600" />
          )}
        </button>
        {expanded && (
          <div className="space-y-3 pt-1">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              {teaConceptualBase.dsm5Criteria}
            </p>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                4 Domínios de RRBs:
              </p>
              {teaConceptualBase.domains.map((d, i) => (
                <div key={i} className="flex items-start gap-2 ml-2">
                  <span className="text-xs text-blue-600 font-bold mt-0.5">
                    {i + 1}.
                  </span>
                  <span className="text-xs text-blue-700 dark:text-blue-300">
                    {d}
                  </span>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-3 space-y-2">
              <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                {teaConceptualBase.developmentalNote}
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed italic">
                {teaConceptualBase.functionalNote}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                O que torna o achado clinicamente relevante:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {teaConceptualBase.clinicalRelevance.map((r) => (
                  <Badge
                    key={r}
                    variant="outline"
                    className="text-xs text-blue-700 dark:text-blue-300 border-blue-300"
                  >
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AgeGroupSelector({
  onSelect,
}: {
  onSelect: (g: TeaAgeGroup) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
          <Fingerprint className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Comportamentos Atípicos em TEA</h1>
          <p className="text-xs text-muted-foreground">
            100 itens por faixa etária — Síntese clínica baseada no DSM-5
          </p>
        </div>
      </div>

      <ConceptualBase />

      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
            Selecione a faixa etária do paciente para avaliar a presença e
            intensidade dos comportamentos repetitivos restritos (RRBs),
            alterações sensoriais e padrões de rigidez.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {teaAgeGroups.map((group) => (
          <Card
            key={group.id}
            className="border-card-border cursor-pointer hover:shadow-md transition-all"
            onClick={() => onSelect(group)}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${group.gradient} flex items-center justify-center shadow-sm`}
                >
                  <Fingerprint className="w-4 h-4 text-white" />
                </div>
                <Badge variant="outline" className="text-xs">
                  {group.items.length} itens
                </Badge>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">
                    {group.title}
                  </h3>
                  <Badge
                    className={`text-xs bg-${group.gradient.split("-")[1]}-100 text-${group.gradient.split("-")[1]}-700 dark:bg-${group.gradient.split("-")[1]}-900/40 dark:text-${group.gradient.split("-")[1]}-300`}
                  >
                    {group.ageRange}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {group.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Avaliação completa */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-chart-2/5 dark:from-primary/10 dark:to-chart-2/10">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Sobre a Escala
            </h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Esta escala apresenta 100 comportamentos atípicos organizados por 6
            faixas etárias (0-18 anos). Um mesmo comportamento pode surgir em
            mais de uma faixa. A relevância clínica depende de frequência,
            intensidade, inflexibilidade, interferência funcional e desproporção
            para a idade.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant="outline" className="text-xs">
              100 Itens
            </Badge>
            <Badge variant="outline" className="text-xs">
              6 Faixas Etárias
            </Badge>
            <Badge variant="outline" className="text-xs">
              4 Domínios RRB
            </Badge>
            <Badge variant="outline" className="text-xs">
              DSM-5 Critério B
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AgeGroupEvaluation({
  group,
  onBack,
}: {
  group: TeaAgeGroup;
  onBack: () => void;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);

  const total = group.items.length;
  const answered = Object.keys(answers).length;
  const progress = (answered / total) * 100;

  if (showResult) {
    const answerLabel = (id: number) =>
      answers[id] === undefined ? "—" : behaviorRatingLabels[answers[id]];
    const reportItems = group.items.map((item) => ({
      question: item.text,
      answer: answerLabel(item.id),
    }));

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${group.gradient} flex items-center justify-center shadow-sm`}
          >
            <Fingerprint className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — {group.title}</h1>
            <p className="text-xs text-muted-foreground">{group.ageRange}</p>
          </div>
        </div>

        <Card className="border-card-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-bold text-foreground">
              Perguntas e respostas
            </h2>
            <div className="space-y-2">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="text-sm border-b border-border/40 pb-2 last:border-0"
                >
                  <p className="text-foreground leading-relaxed">{item.text}</p>
                  <p className="text-muted-foreground mt-0.5">
                    → {answerLabel(item.id)}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <p>
                    <strong>Nota:</strong> Esta escala é uma ferramenta de
                    rastreio educacional. O diagnóstico de TEA requer avaliação
                    multidisciplinar completa, incluindo observação clínica,
                    entrevista e histórico desenvolvimental.
                  </p>
                  <p>
                    Nem todo item aparece em toda criança. Um mesmo
                    comportamento pode surgir em mais de uma faixa etária.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <SaveToPatient
          scaleName="Comportamentos Atípicos TEA"
          responses={reportItems}
          patientAge={group.ageRange}
        />
        <ClinicalReport
          scaleName={`Comport. Atípicos TEA — ${group.title}`}
          items={reportItems}
          patientAge={group.ageRange}
        />
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setAnswers({});
              setShowResult(false);
            }}
            variant="outline"
            className="flex-1 gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Reavaliar
          </Button>
          <Button onClick={onBack} variant="outline" className="flex-1 gap-2">
            <ArrowLeft className="w-4 h-4" /> Outras Faixas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="text-xs text-primary hover:underline flex items-center gap-1"
      >
        <ArrowLeft className="w-3 h-3" /> Voltar para seleção de faixa etária
      </button>

      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${group.gradient} flex items-center justify-center shadow-sm`}
        >
          <Fingerprint className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">{group.title}</h1>
          <p className="text-xs text-muted-foreground">
            {group.ageRange} — {group.items.length} comportamentos
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {answered} de {total} avaliados
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="rounded-xl bg-muted/50 p-4">
        <p className="text-xs text-foreground leading-relaxed">
          {group.description}
        </p>
      </div>

      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-4">
        <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
          <strong>Instruções:</strong> Para cada comportamento, avalie a
          frequência/intensidade com que é observado no paciente. Considere o
          padrão habitual, não episódios isolados.
        </p>
      </div>

      {group.items.map((item) => (
        <Card key={item.id} className="border-card-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Badge
                variant="outline"
                className="text-xs font-mono flex-shrink-0 mt-0.5"
              >
                {item.id}
              </Badge>
              <p className="text-sm text-foreground leading-relaxed">
                {item.text}
              </p>
            </div>
            <RadioGroup
              value={answers[item.id]?.toString()}
              onValueChange={(val) =>
                setAnswers({ ...answers, [item.id]: parseInt(val) })
              }
              className="flex flex-wrap gap-2"
            >
              {behaviorRatingLabels.map((label, j) => (
                <div key={j} className="flex items-center">
                  <RadioGroupItem
                    value={j.toString()}
                    id={`tea-b-${item.id}-o${j}`}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`tea-b-${item.id}-o${j}`}
                    className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                      answers[item.id] === j
                        ? j === 0
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : j === 1
                            ? "bg-amber-500 text-white border-amber-500"
                            : j === 2
                              ? "bg-orange-500 text-white border-orange-500"
                              : "bg-red-500 text-white border-red-500"
                        : "bg-card text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      ))}

      <Button
        onClick={() => setShowResult(true)}
        disabled={answered < total}
        className="w-full"
        size="lg"
        data-testid="button-submit"
      >
        {answered >= total
          ? "Ver Resultado"
          : `Avalie todos os ${total} comportamentos`}
      </Button>
    </div>
  );
}

export default function TeaBehaviorsPage() {
  const [selectedGroup, setSelectedGroup] = useState<TeaAgeGroup | null>(null);

  if (selectedGroup) {
    return (
      <AgeGroupEvaluation
        group={selectedGroup}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  return <AgeGroupSelector onSelect={setSelectedGroup} />;
}
