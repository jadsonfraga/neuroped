import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";
import { haptic } from "@/lib/haptic";
import { softSuccess, softTap } from "@/lib/softSounds";
import { ArrowLeft, ClipboardCheck, Pill, RotateCcw, ShieldCheck, Star } from "lucide-react";
import { motion } from "framer-motion";
import { duration, easing } from "@/lib/motion";

const SCORE_LABELS = ["Muito ruim", "Ruim", "Regular", "Bom", "Muito bom"];

const EUSM10_ITEMS = [
  "A medicação ajudou no problema principal?",
  "A melhora percebida vale a pena?",
  "A medicação melhorou a rotina do paciente?",
  "Os efeitos colaterais foram aceitáveis?",
  "Sono, apetite, energia e disposição ficaram aceitáveis?",
  "O paciente aceita usar a medicação?",
  "A família consegue administrar corretamente?",
  "O horário, forma de uso e custo são viáveis?",
  "A família se sente segura com a medicação?",
  "A família deseja manter a medicação, se o médico concordar?",
];

function classifyEusm10(score: number) {
  if (score <= 10) {
    return {
      label: "Satisfação muito baixa",
      tone: "red",
      description:
        "Resultado compatível com satisfação muito baixa. Sugere benefício limitado, baixa tolerabilidade, dificuldade prática ou insegurança familiar. Reavaliar indicação, dose, efeitos adversos e adesão.",
    };
  }
  if (score <= 20) {
    return {
      label: "Satisfação baixa",
      tone: "orange",
      description:
        "Resultado compatível com satisfação baixa. Há benefício ou aceitação insuficientes para a rotina atual. Considerar ajuste de dose, horário, formulação, manejo de efeitos colaterais ou mudança terapêutica.",
    };
  }
  if (score <= 28) {
    return {
      label: "Satisfação intermediária",
      tone: "amber",
      description:
        "Resultado intermediário. A medicação pode estar trazendo algum benefício, mas ainda há pontos relevantes de tolerabilidade, adesão, segurança familiar ou viabilidade prática que merecem revisão clínica.",
    };
  }
  if (score <= 35) {
    return {
      label: "Boa satisfação",
      tone: "emerald",
      description:
        "Resultado compatível com boa satisfação. Sugere equilíbrio favorável entre benefício percebido, tolerabilidade, adesão e viabilidade familiar. Manter seguimento e monitorização periódica.",
    };
  }
  return {
    label: "Excelente satisfação",
    tone: "blue",
    description:
      "Resultado compatível com excelente satisfação. Sugere benefício percebido consistente, boa tolerabilidade, boa adesão e segurança familiar para continuidade, desde que o quadro clínico confirme essa impressão.",
  };
}

export default function Eusm10Page() {
  const [medicacao, setMedicacao] = useState("");
  const [doseHorario, setDoseHorario] = useState("");
  const [tempoUso, setTempoUso] = useState("");
  const [respondente, setRespondente] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const totalScore = useMemo(
    () => Object.values(answers).reduce((sum, value) => sum + value, 0),
    [answers],
  );
  const result = classifyEusm10(totalScore);
  const canSubmit = answeredCount === EUSM10_ITEMS.length;

  function setItemAnswer(index: number, value: string) {
    softTap();
    haptic.tap();
    setAnswers((current) => ({ ...current, [index]: Number(value) }));
  }

  function handleSubmit() {
    if (!canSubmit) return;
    softSuccess();
    haptic.success();
    setShowResult(true);
    window.scrollTo({ top: 0 });
  }

  function handleReset() {
    setAnswers({});
    setObservacoes("");
    setShowResult(false);
    window.scrollTo({ top: 0 });
  }

  const reportItems = EUSM10_ITEMS.map((question, index) => {
    const value = answers[index];
    return {
      question,
      answer: value === undefined ? "—" : SCORE_LABELS[value],
      value: value ?? 0,
    };
  });

  if (showResult) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal, ease: easing.smooth }}
        className="space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-md">
            <ClipboardCheck className="w-5 h-5 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl text-foreground leading-tight" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
              Resultado — EUSM-10
            </h1>
            <p className="text-xs text-muted-foreground italic">
              Escala Universal de Satisfação com Medicação · {medicacao || "medicação não informada"}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="text-sm font-bold uppercase text-muted-foreground">Perguntas e respostas</h2>
            <div className="space-y-2.5">
              {EUSM10_ITEMS.map((item, index) => {
                const value = answers[index];
                return (
                  <div key={item} className="rounded-xl border border-border/70 bg-background p-3">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">{item}</p>
                        <p className="text-sm text-primary">→ {value === undefined ? "—" : SCORE_LABELS[value]}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="text-sm font-bold uppercase text-muted-foreground">Regra prática</h2>
            <div className="space-y-2 text-sm leading-relaxed text-foreground">
              <p>Reavaliar rapidamente se houver efeito colateral importante, piora após início ou aumento da dose, sonolência excessiva, insônia intensa, mudança importante de humor, alergia, palpitações, síncope, recusa persistente ou insegurança familiar para manter o uso.</p>
              <p>Se necessário, considerar ajuste de dose, mudança de horário, mudança de formulação, troca de medicação ou encaminhamento para avaliação complementar.</p>
              <p>Nunca interromper abruptamente medicação quando houver risco clínico.</p>
            </div>
          </CardContent>
        </Card>

        <ClinicalReport
          scaleName="EUSM-10"
          scaleFullName="Escala Universal de Satisfação com Medicação"
          hideScore
          classification="Registro de respostas — análise clínica pelo profissional"
          description={observacoes ? `Observações clínicas: ${observacoes}` : ""}
          items={reportItems}
          patientAge={tempoUso ? `Tempo de uso: ${tempoUso}` : "Uso medicamentoso"}
        />

        <SaveToPatient
          scaleName={`EUSM-10 — ${medicacao || "Medicação"}`}
          totalScore={totalScore}
          classification={result.label}
          answers={{ medicacao, doseHorario, tempoUso, respondente, observacoes, ...answers }}
          domainScores={{ total: totalScore }}
        />

        <Button onClick={handleReset} variant="outline" className="w-full gap-2">
          <RotateCcw className="w-4 h-4" /> Nova aplicação
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-md">
          <Pill className="w-5 h-5 text-white" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl text-foreground leading-tight" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
            EUSM-10
          </h1>
          <p className="text-xs text-muted-foreground italic">Escala Universal de Satisfação com Medicação · 10 itens · total máximo 40 pontos</p>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-primary mt-0.5" />
            <p className="text-sm leading-relaxed text-foreground">
              Instrumento breve para acompanhar se uma medicação está trazendo benefício, sendo tolerada e cabendo na rotina do paciente e da família. Período sugerido: últimos 7 a 14 dias.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">0 = muito ruim</Badge>
            <Badge variant="secondary">1 = ruim</Badge>
            <Badge variant="secondary">2 = regular</Badge>
            <Badge variant="secondary">3 = bom</Badge>
            <Badge variant="secondary">4 = muito bom</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-bold">Identificação</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Medicação</Label>
              <Input value={medicacao} onChange={(event) => setMedicacao(event.target.value)} placeholder="Ex.: risperidona, atomoxetina..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Dose / horário</Label>
              <Input value={doseHorario} onChange={(event) => setDoseHorario(event.target.value)} placeholder="Ex.: 0,5 mL manhã + 1 mL noite" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tempo de uso</Label>
              <Input value={tempoUso} onChange={(event) => setTempoUso(event.target.value)} placeholder="Ex.: 14 dias, 2 meses..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Respondente</Label>
              <Input value={respondente} onChange={(event) => setRespondente(event.target.value)} placeholder="Família, paciente, cuidador..." />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold">Itens da escala</h2>
            <Badge variant="outline">{answeredCount}/10 respondidos</Badge>
          </div>

          <div className="space-y-3">
            {EUSM10_ITEMS.map((item, index) => (
              <div key={item} className="rounded-xl border border-border/70 bg-background p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <p className="text-sm font-medium text-foreground">{item}</p>
                </div>
                <RadioGroup
                  value={answers[index]?.toString() ?? ""}
                  onValueChange={(value) => setItemAnswer(index, value)}
                  className="grid grid-cols-5 gap-1"
                >
                  {SCORE_LABELS.map((label, value) => (
                    <Label
                      key={`${item}-${value}`}
                      className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-border/70 p-2 text-center text-[10px] hover:bg-primary/5"
                    >
                      <RadioGroupItem value={value.toString()} className="sr-only" />
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${answers[index] === value ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                        {value}
                      </span>
                      <span className="leading-tight text-muted-foreground">{label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <Label className="text-sm font-bold">Observações clínicas</Label>
          <Textarea
            value={observacoes}
            onChange={(event) => setObservacoes(event.target.value)}
            placeholder="Opcional: efeitos colaterais relevantes, perda de eficácia, insegurança familiar, adesão, contexto escolar..."
            className="min-h-[90px]"
          />
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-2">
        <Link href="/filtro">
          <Button variant="outline" className="w-full gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar ao filtro
          </Button>
        </Link>
        <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full gap-2">
          <Star className="w-4 h-4" /> Calcular EUSM-10
        </Button>
      </div>
    </div>
  );
}
