import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RotateCcw, Sparkles } from "lucide-react";
import {
  ygtssMotorTics,
  ygtssVocalTics,
  ygtssFrequencyLabels,
} from "@/data/expandedScales";
import { ScaleReference } from "@/components/ScaleReference";
import { SaveToPatient } from "@/components/SaveToPatient";
import { ClinicalReport } from "@/components/ClinicalReport";
import {
  ScaleDraftLoading,
  ScaleDraftRestoredNotice,
} from "@/components/ScaleDraftLoading";
import { useSecureTypedScaleDraft } from "@/hooks/useSecureScaleDraft";
import {
  hasRecordEntries,
  indexedAllowedValues,
  sanitizeNumberRecord,
} from "@/lib/scaleDraftCore";

interface YgtssDraft {
  motorAnswers: Record<number, number>;
  vocalAnswers: Record<number, number>;
  impairment: number;
}

const YGTSS_MOTOR_VALUES = indexedAllowedValues(
  ygtssMotorTics.length,
  ygtssFrequencyLabels.length,
);
const YGTSS_VOCAL_VALUES = indexedAllowedValues(
  ygtssVocalTics.length,
  ygtssFrequencyLabels.length,
);
const YGTSS_IMPAIRMENT_VALUES = new Set([0, 10, 20, 30, 40, 50]);
const emptyYgtssDraft = (): YgtssDraft => ({
  motorAnswers: {},
  vocalAnswers: {},
  impairment: 0,
});

function sanitizeYgtssDraft(value: unknown): YgtssDraft {
  const source =
    value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<YgtssDraft>)
      : {};
  return {
    motorAnswers: sanitizeNumberRecord(source.motorAnswers, YGTSS_MOTOR_VALUES),
    vocalAnswers: sanitizeNumberRecord(source.vocalAnswers, YGTSS_VOCAL_VALUES),
    impairment:
      typeof source.impairment === "number" &&
      YGTSS_IMPAIRMENT_VALUES.has(source.impairment)
        ? source.impairment
        : 0,
  };
}

function hasYgtssContent(value: YgtssDraft): boolean {
  return (
    hasRecordEntries(value.motorAnswers) ||
    hasRecordEntries(value.vocalAnswers) ||
    value.impairment !== 0
  );
}

export default function YgtssPage() {
  const [showResult, setShowResult] = useState(false);
  const {
    value: draft,
    setValue: setDraft,
    ready: draftReady,
    restored: draftRestored,
    clearDraft,
  } = useSecureTypedScaleDraft<YgtssDraft>({
    draftId: "dedicated:ygtss",
    schemaVersion: 1,
    createEmpty: emptyYgtssDraft,
    sanitize: sanitizeYgtssDraft,
    hasContent: hasYgtssContent,
  });
  const { motorAnswers, vocalAnswers, impairment } = draft;

  const totalQ = ygtssMotorTics.length + ygtssVocalTics.length;
  const answered =
    Object.keys(motorAnswers).length + Object.keys(vocalAnswers).length;
  const progress = (answered / totalQ) * 100;

  if (!draftReady) return <ScaleDraftLoading />;

  if (showResult) {
    const freqOrDash = (v: number | undefined) =>
      v === undefined ? "—" : ygtssFrequencyLabels[v];
    const impairmentLabels: Record<number, string> = {
      0: "Nenhum",
      10: "Leve",
      20: "Moderado",
      30: "Grave",
      40: "Muito grave",
      50: "Extremo",
    };
    const reportItems = [
      ...ygtssMotorTics.map((question, index) => ({
        question: `[Motor] ${question}`,
        answer: freqOrDash(motorAnswers[index]),
      })),
      ...ygtssVocalTics.map((question, index) => ({
        question: `[Vocal] ${question}`,
        answer: freqOrDash(vocalAnswers[index]),
      })),
      {
        question:
          "Quanto os tiques interferem na vida diária, escola, socialização e autoestima?",
        answer: impairmentLabels[impairment] ?? String(impairment),
      },
    ];
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Respostas registradas — YGTSS</h1>
            <p className="text-xs text-muted-foreground">
              Yale Global Tic Severity Scale
            </p>
          </div>
        </div>
        <Card className="border-card-border">
          <CardContent className="p-6 space-y-5">
            <h2 className="text-sm font-bold text-foreground">
              Perguntas e respostas
            </h2>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                Tiques Motores
              </h3>
              {ygtssMotorTics.map((tic, i) => (
                <div
                  key={`rm-${i}`}
                  className="text-sm border-b border-border/40 pb-2 last:border-0"
                >
                  <p className="text-foreground leading-relaxed">{tic}</p>
                  <p className="text-muted-foreground mt-0.5">
                    → {freqOrDash(motorAnswers[i])}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                Tiques Vocais
              </h3>
              {ygtssVocalTics.map((tic, i) => (
                <div
                  key={`rv-${i}`}
                  className="text-sm border-b border-border/40 pb-2 last:border-0"
                >
                  <p className="text-foreground leading-relaxed">{tic}</p>
                  <p className="text-muted-foreground mt-0.5">
                    → {freqOrDash(vocalAnswers[i])}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-foreground">
                Impacto Funcional
              </h3>
              <div className="text-sm">
                <p className="text-foreground leading-relaxed">
                  Quanto os tiques interferem na vida diária, escola,
                  socialização e autoestima?
                </p>
                <p className="text-muted-foreground mt-0.5">
                  → {impairmentLabels[impairment] ?? String(impairment)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <ClinicalReport
          scaleName="YGTSS"
          scaleFullName="Yale Global Tic Severity Scale"
          items={reportItems}
          patientAge="5-18 anos"
        />
        <SaveToPatient
          scaleName="YGTSS"
          responses={reportItems}
          patientAge="5-18 anos"
        />
        <Button
          onClick={() => {
            void clearDraft();
            setShowResult(false);
          }}
          variant="outline"
          className="w-full gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Nova Avaliação
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ScaleDraftRestoredNotice
        visible={draftRestored}
        onClear={() => {
          void clearDraft();
          setShowResult(false);
        }}
      />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-sm">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">YGTSS</h1>
          <p className="text-xs text-muted-foreground">
            Yale Global Tic Severity Scale — Avaliação de Tiques
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {answered} de {totalQ} tiques avaliados
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      <div className="rounded-xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/40 p-4">
        <p className="text-xs text-yellow-800 dark:text-yellow-300 leading-relaxed">
          <strong>Instruções:</strong> Avalie a frequência de cada tique na
          última semana. Para cada tique presente, pontue a frequência de 0
          (ausente) a 4 (constante).
        </p>
      </div>

      <h2 className="text-sm font-bold text-orange-600 dark:text-orange-400">
        Tiques Motores
      </h2>
      {ygtssMotorTics.map((tic, i) => (
        <Card key={`m-${i}`} className="border-card-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Badge
                variant="outline"
                className="text-xs font-mono flex-shrink-0 mt-0.5"
              >
                M{i + 1}
              </Badge>
              <p className="text-sm text-foreground leading-relaxed">{tic}</p>
            </div>
            <RadioGroup
              value={motorAnswers[i]?.toString()}
              onValueChange={(val) =>
                setDraft((current) => ({
                  ...current,
                  motorAnswers: {
                    ...current.motorAnswers,
                    [i]: parseInt(val),
                  },
                }))
              }
              className="flex flex-wrap gap-2"
            >
              {ygtssFrequencyLabels.map((label, j) => (
                <div key={j} className="flex items-center">
                  <RadioGroupItem
                    value={j.toString()}
                    id={`motor-${i}-${j}`}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`motor-${i}-${j}`}
                    className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${motorAnswers[i] === j ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"}`}
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      ))}

      <h2 className="text-sm font-bold text-purple-600 dark:text-purple-400">
        Tiques Vocais
      </h2>
      {ygtssVocalTics.map((tic, i) => (
        <Card key={`v-${i}`} className="border-card-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Badge
                variant="outline"
                className="text-xs font-mono flex-shrink-0 mt-0.5"
              >
                V{i + 1}
              </Badge>
              <p className="text-sm text-foreground leading-relaxed">{tic}</p>
            </div>
            <RadioGroup
              value={vocalAnswers[i]?.toString()}
              onValueChange={(val) =>
                setDraft((current) => ({
                  ...current,
                  vocalAnswers: {
                    ...current.vocalAnswers,
                    [i]: parseInt(val),
                  },
                }))
              }
              className="flex flex-wrap gap-2"
            >
              {ygtssFrequencyLabels.map((label, j) => (
                <div key={j} className="flex items-center">
                  <RadioGroupItem
                    value={j.toString()}
                    id={`vocal-${i}-${j}`}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`vocal-${i}-${j}`}
                    className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${vocalAnswers[i] === j ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"}`}
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      ))}

      <h2 className="text-sm font-bold text-foreground">
        Impacto Funcional (0-50)
      </h2>
      <Card className="border-card-border">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Quanto os tiques interferem na vida diária, escola, socialização e
            autoestima?
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">0</span>
            <Slider
              aria-label="Comprometimento global por tiques"
              value={[impairment]}
              onValueChange={([v]) =>
                setDraft((current) => ({ ...current, impairment: v }))
              }
              max={50}
              step={10}
              className="flex-1"
            />
            <span className="text-sm font-bold w-8 text-right">
              {impairment}
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Nenhum</span>
            <span>Leve</span>
            <span>Moderado</span>
            <span>Grave</span>
            <span>Extremo</span>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() => setShowResult(true)}
        disabled={answered < totalQ}
        className="w-full"
        size="lg"
      >
        {answered >= totalQ
          ? "Ver respostas"
          : `Avalie todos os ${totalQ} tiques`}
      </Button>
      <ScaleReference scaleId="ygtss" />
    </div>
  );
}
