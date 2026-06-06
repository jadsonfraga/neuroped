import { useState } from "react";
import {
  School, Eye, Puzzle, BookOpen, Brain,
  CheckCircle2, AlertTriangle, AlertCircle,
  RotateCcw, Printer, ClipboardList, Users,
  MessageSquare, Info,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClassificationBand {
  min: number;
  max: number;
  label: string;
  color: "green" | "yellow" | "orange" | "red";
  description: string;
}

// ─── INVENTÁRIO 1: Observação do Comportamento em Sala de Aula ───────────────

const inv1Labels = ["Nunca", "Raramente", "Frequentemente", "Sempre"];

const inv1Categories = [
  {
    id: "atencao",
    title: "Atenção",
    icon: Eye,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800/40",
    gradient: "from-blue-500 to-indigo-500",
    items: [
      "Mantém atenção nas atividades propostas",
      "Segue instruções sem necessidade de repetição",
      "Completa as tarefas no tempo esperado",
      "Organiza seu material escolar",
      "Permanece sentado durante as atividades",
    ],
  },
  {
    id: "social",
    title: "Interação Social",
    icon: Users,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800/40",
    gradient: "from-emerald-500 to-teal-500",
    items: [
      "Interage adequadamente com colegas",
      "Respeita regras e limites em grupo",
      "Participa de atividades em grupo",
      "Expressa sentimentos de forma adequada",
      "Resolve conflitos sem agressividade",
    ],
  },
  {
    id: "linguagem",
    title: "Linguagem e Comunicação",
    icon: MessageSquare,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    border: "border-violet-200 dark:border-violet-800/40",
    gradient: "from-violet-500 to-purple-600",
    items: [
      "Compreende instruções orais",
      "Expressa ideias com clareza",
      "Participa das discussões em sala",
      "Vocabulário adequado para a idade",
      "Narra experiências com sequência lógica",
    ],
  },
  {
    id: "aprendizagem",
    title: "Aprendizagem",
    icon: BookOpen,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800/40",
    gradient: "from-amber-500 to-orange-500",
    items: [
      "Demonstra interesse pelas atividades",
      "Consegue copiar do quadro",
      "Leitura compatível com a série",
      "Escrita compatível com a série",
      "Raciocínio matemático adequado",
    ],
  },
];

const inv1Bands: ClassificationBand[] = [
  { min: 48, max: 60, label: "Adequado", color: "green", description: "O aluno apresenta desempenho dentro do esperado para a faixa etária/série. Manter acompanhamento de rotina." },
  { min: 36, max: 47, label: "Dificuldades Leves — Monitorar", color: "yellow", description: "Foram identificadas dificuldades leves em alguns domínios. Recomenda-se monitoramento regular e estratégias de suporte pedagógico." },
  { min: 24, max: 35, label: "Dificuldades Moderadas — Avaliação Recomendada", color: "orange", description: "O perfil sugere dificuldades moderadas. Encaminhar para avaliação com equipe multidisciplinar (psicopedagogo, psicólogo, neuropediatra)." },
  { min: 0, max: 23, label: "Dificuldades Significativas — Encaminhamento Urgente", color: "red", description: "O perfil indica dificuldades significativas em múltiplos domínios. Encaminhamento prioritário para avaliação especializada." },
];

// ─── INVENTÁRIO 2: Sinais de Alerta para TEA ─────────────────────────────────

const inv2Items = [
  "Não faz contato visual com professor/colegas",
  "Não responde quando chamado pelo nome",
  "Prefere brincar sozinho",
  "Tem dificuldade em brincadeiras de faz-de-conta",
  "Apresenta interesses restritos e intensos",
  "Tem movimentos repetitivos (flapping, girar)",
  "Incomoda-se com barulhos ou texturas",
  "Tem dificuldade em mudanças de rotina",
  "Não aponta para mostrar ou compartilhar",
  "Ecolalia (repete frases/palavras)",
  "Não imita comportamentos de colegas",
  "Dificuldade em entender expressões faciais",
  "Alinha objetos ou organiza de forma peculiar",
  "Reações emocionais desproporcionais",
  "Dificuldade em esperar sua vez",
];

const inv2Bands: ClassificationBand[] = [
  { min: 0, max: 3, label: "Baixo Risco", color: "green", description: "Poucos sinais de alerta identificados. Manter observação regular do desenvolvimento." },
  { min: 4, max: 7, label: "Risco Moderado — Avaliação Recomendada", color: "yellow", description: "Presença de sinais de alerta para TEA em quantidade moderada. Recomenda-se avaliação neuropediátrica e/ou com especialista em desenvolvimento." },
  { min: 8, max: 15, label: "Alto Risco — Encaminhamento Prioritário", color: "red", description: "Número significativo de sinais de alerta para TEA. Encaminhamento prioritário para avaliação diagnóstica especializada." },
];

// ─── INVENTÁRIO 3: Perfil de Habilidades para Alfabetização ──────────────────

const inv3Labels = ["Não consegue", "Em desenvolvimento", "Consegue"];

const inv3Items = [
  "Reconhece o próprio nome escrito",
  "Reconhece letras do alfabeto",
  "Relaciona letra ao som (consciência fonológica)",
  "Segmenta palavras em sílabas (palmas)",
  "Identifica rimas",
  "Reconta uma história ouvida",
  "Segura o lápis adequadamente (preensão)",
  "Copia formas geométricas simples",
  "Escreve o próprio nome",
  "Reconhece números de 1 a 10",
  "Faz correspondência número-quantidade",
  "Identifica cores básicas",
];

const inv3Bands: ClassificationBand[] = [
  { min: 20, max: 24, label: "Pronto para Alfabetização", color: "green", description: "O aluno demonstra as pré-habilidades esperadas para o processo de alfabetização." },
  { min: 14, max: 19, label: "Em Desenvolvimento — Estimulação Recomendada", color: "yellow", description: "Algumas habilidades ainda estão em desenvolvimento. Recomenda-se estimulação direcionada e acompanhamento pedagógico." },
  { min: 0, max: 13, label: "Dificuldades Significativas — Investigar Atraso", color: "red", description: "O perfil indica dificuldades significativas nas pré-habilidades de alfabetização. Investigar possível atraso no desenvolvimento e encaminhar para avaliação." },
];

// ─── INVENTÁRIO 4: Funções Executivas ────────────────────────────────────────

const inv4Labels = ["Nunca", "Raramente", "Frequentemente", "Sempre"];

const inv4Items = [
  "Inicia tarefas de forma independente",
  "Planeja os passos antes de começar",
  "Mantém o foco mesmo com distrações",
  "Alterna entre atividades sem dificuldade",
  "Controla impulsos (espera, não interrompe)",
  "Organiza mochila e materiais",
  "Gerencia o tempo das atividades",
  "Adapta-se a mudanças de planos",
  "Monitora próprios erros e corrige",
  "Persiste em tarefas difíceis",
];

const inv4Bands: ClassificationBand[] = [
  { min: 24, max: 30, label: "Funções Executivas Adequadas", color: "green", description: "O aluno demonstra funções executivas compatíveis com a faixa etária." },
  { min: 16, max: 23, label: "Dificuldades Leves — Monitorar", color: "yellow", description: "Foram identificadas dificuldades leves nas funções executivas. Recomenda-se monitoramento e estratégias de organização em sala." },
  { min: 8, max: 15, label: "Dificuldades Moderadas — Avaliação Recomendada", color: "orange", description: "O perfil sugere comprometimento moderado das funções executivas. Avaliação neuropsicológica recomendada." },
  { min: 0, max: 7, label: "Comprometimento Significativo — Encaminhar", color: "red", description: "Comprometimento significativo das funções executivas identificado. Encaminhamento prioritário para avaliação neuropsicológica e neuropediátrica." },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBand(score: number, bands: ClassificationBand[]): ClassificationBand {
  return bands.find((b) => score >= b.min && score <= b.max) ?? bands[bands.length - 1];
}

const colorStyles = {
  green: {
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800/40",
    text: "text-emerald-700 dark:text-emerald-300",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    icon: CheckCircle2,
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  yellow: {
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
    border: "border-yellow-200 dark:border-yellow-800/40",
    text: "text-yellow-700 dark:text-yellow-300",
    badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    icon: AlertCircle,
    iconColor: "text-yellow-600 dark:text-yellow-400",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-800/40",
    text: "text-orange-700 dark:text-orange-300",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    icon: AlertTriangle,
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-200 dark:border-red-800/40",
    text: "text-red-700 dark:text-red-300",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    icon: AlertTriangle,
    iconColor: "text-red-600 dark:text-red-400",
  },
};

// ─── Subcomponents ────────────────────────────────────────────────────────────

function ProgressBar({ answered, total }: { answered: number; total: number }) {
  const pct = total > 0 ? (answered / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{answered} de {total} respondidas</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}

function ResultCard({
  score,
  maxScore,
  band,
  onReset,
  extraInfo,
}: {
  score: number;
  maxScore: number;
  band: ClassificationBand;
  onReset: () => void;
  extraInfo?: React.ReactNode;
}) {
  const style = colorStyles[band.color];
  const Icon = style.icon;

  return (
    <div className="space-y-4">
      <Card className="border-card-border">
        <CardContent className="p-6 space-y-5">
          {/* Score display */}
          <div className="flex flex-col items-center gap-2 py-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Pontuação Total</p>
            <p className="text-5xl font-bold text-foreground">{score}</p>
            <p className="text-xs text-muted-foreground">de {maxScore} pontos</p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                band.color === "green" ? "bg-emerald-500" :
                band.color === "yellow" ? "bg-yellow-500" :
                band.color === "orange" ? "bg-orange-500" : "bg-red-500"
              }`}
              style={{ width: `${(score / maxScore) * 100}%` }}
            />
          </div>

          {/* Classification badge */}
          <div className="text-center">
            <Badge className={`text-sm px-4 py-1.5 ${style.badge}`}>
              {band.label}
            </Badge>
          </div>

          {/* Description */}
          <div className={`rounded-xl p-4 border ${style.bg} ${style.border}`}>
            <div className="flex items-start gap-2">
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${style.iconColor}`} />
              <p className={`text-sm leading-relaxed ${style.text}`}>{band.description}</p>
            </div>
          </div>

          {extraInfo}
        </CardContent>
      </Card>

      <Button onClick={onReset} variant="outline" className="w-full gap-2">
        <RotateCcw className="w-4 h-4" />
        Nova Avaliação
      </Button>
    </div>
  );
}

// ─── INVENTÁRIO 1 Component ───────────────────────────────────────────────────

function Inventario1() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);

  const allItems = inv1Categories.flatMap((cat) => cat.items.map((_, i) => `${cat.id}-${i}`));
  const answered = allItems.filter((k) => answers[k] !== undefined).length;
  const allAnswered = answered === allItems.length;

  const score = Object.values(answers).reduce((a, b) => a + b, 0);
  const band = getBand(score, inv1Bands);

  const categoryScores = inv1Categories.map((cat) => ({
    ...cat,
    score: cat.items.reduce((sum, _, i) => sum + (answers[`${cat.id}-${i}`] ?? 0), 0),
    answered: cat.items.filter((_, i) => answers[`${cat.id}-${i}`] !== undefined).length,
  }));

  if (showResult) {
    return (
      <ResultCard
        score={score}
        maxScore={60}
        band={band}
        onReset={() => { setAnswers({}); setShowResult(false); }}
        extraInfo={
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Por Categoria</p>
            <div className="grid grid-cols-2 gap-2">
              {categoryScores.map((cat) => {
                const CatIcon = cat.icon;
                return (
                  <div key={cat.id} className={`rounded-xl p-3 border ${cat.bg} ${cat.border}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <CatIcon className={`w-3.5 h-3.5 ${cat.color}`} />
                      <p className={`text-xs font-semibold ${cat.color}`}>{cat.title}</p>
                    </div>
                    <p className="text-xl font-bold text-foreground">{cat.score}<span className="text-xs font-normal text-muted-foreground">/15</span></p>
                  </div>
                );
              })}
            </div>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-violet-800 dark:text-violet-300 leading-relaxed">
            <strong>Instruções:</strong> Para cada item, selecione a frequência que melhor descreve o comportamento do aluno em sala de aula. Escala: 0 = Nunca, 1 = Raramente, 2 = Frequentemente, 3 = Sempre.
          </p>
        </div>
      </div>

      <ProgressBar answered={answered} total={allItems.length} />

      {inv1Categories.map((cat) => {
        const CatIcon = cat.icon;
        const globalOffset = inv1Categories.slice(0, inv1Categories.indexOf(cat)).reduce((s, c) => s + c.items.length, 0);
        return (
          <div key={cat.id} className="space-y-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${cat.bg} ${cat.border}`}>
              <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${cat.gradient} flex items-center justify-center`}>
                <CatIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className={`text-sm font-semibold ${cat.color}`}>{cat.title}</h3>
            </div>

            {cat.items.map((item, i) => {
              const key = `${cat.id}-${i}`;
              const globalNum = globalOffset + i + 1;
              return (
                <Card key={key} className="border-card-border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs font-mono flex-shrink-0 mt-0.5">{globalNum}</Badge>
                      <p className="text-sm text-foreground leading-relaxed">{item}</p>
                    </div>
                    <RadioGroup
                      value={answers[key]?.toString()}
                      onValueChange={(val) => setAnswers({ ...answers, [key]: parseInt(val) })}
                      className="flex flex-wrap gap-2"
                    >
                      {inv1Labels.map((label, j) => (
                        <div key={j} className="flex items-center">
                          <RadioGroupItem value={j.toString()} id={`inv1-${key}-${j}`} className="sr-only" />
                          <Label
                            htmlFor={`inv1-${key}-${j}`}
                            className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                              answers[key] === j
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-foreground border-border hover:bg-muted"
                            }`}
                          >
                            <span className="font-mono mr-1">{j}</span>{label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );
      })}

      <Button
        onClick={() => setShowResult(true)}
        disabled={!allAnswered}
        className="w-full"
        size="lg"
      >
        {allAnswered ? "Ver Resultado" : `Responda todas as ${allItems.length} perguntas (${answered}/${allItems.length})`}
      </Button>
    </div>
  );
}

// ─── INVENTÁRIO 2 Component ───────────────────────────────────────────────────

function Inventario2() {
  const [answers, setAnswers] = useState<Record<number, boolean | null>>({});
  const [showResult, setShowResult] = useState(false);

  const answered = Object.values(answers).filter((v) => v !== null && v !== undefined).length;
  const allAnswered = answered === inv2Items.length;
  const score = Object.values(answers).filter(Boolean).length;
  const band = getBand(score, inv2Bands);

  if (showResult) {
    const simCount = Object.values(answers).filter(Boolean).length;
    const naoCount = inv2Items.length - simCount;
    return (
      <ResultCard
        score={score}
        maxScore={15}
        band={band}
        onReset={() => { setAnswers({}); setShowResult(false); }}
        extraInfo={
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-center">
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{simCount}</p>
              <p className="text-xs text-red-600 dark:text-red-400">Sim (sinais presentes)</p>
            </div>
            <div className="rounded-xl p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-center">
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{naoCount}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Não (sinais ausentes)</p>
            </div>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Instruções:</strong> Para cada item, indique se o comportamento descrito está <strong>presente (Sim)</strong> ou <strong>ausente (Não)</strong> no aluno observado. Baseie-se no comportamento habitual em ambiente escolar.
          </p>
        </div>
      </div>

      <ProgressBar answered={answered} total={inv2Items.length} />

      <div className="space-y-3">
        {inv2Items.map((item, i) => (
          <Card key={i} className="border-card-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="text-xs font-mono flex-shrink-0 mt-0.5">{i + 1}</Badge>
                <p className="text-sm text-foreground leading-relaxed">{item}</p>
              </div>
              <RadioGroup
                value={answers[i] === undefined ? undefined : answers[i] ? "sim" : "nao"}
                onValueChange={(val) => setAnswers({ ...answers, [i]: val === "sim" })}
                className="flex gap-3"
              >
                {["sim", "nao"].map((opt) => (
                  <div key={opt} className="flex items-center">
                    <RadioGroupItem value={opt} id={`inv2-${i}-${opt}`} className="sr-only" />
                    <Label
                      htmlFor={`inv2-${i}-${opt}`}
                      className={`text-xs px-4 py-1.5 rounded-full border cursor-pointer transition-colors font-medium ${
                        (answers[i] === true && opt === "sim") || (answers[i] === false && opt === "nao")
                          ? opt === "sim"
                            ? "bg-red-500 text-white border-red-500"
                            : "bg-emerald-500 text-white border-emerald-500"
                          : "bg-card text-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {opt === "sim" ? "Sim" : "Não"}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        onClick={() => setShowResult(true)}
        disabled={!allAnswered}
        className="w-full"
        size="lg"
      >
        {allAnswered ? "Ver Resultado" : `Responda todos os ${inv2Items.length} itens (${answered}/${inv2Items.length})`}
      </Button>
    </div>
  );
}

// ─── INVENTÁRIO 3 Component ───────────────────────────────────────────────────

function Inventario3() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);

  const answered = Object.keys(answers).length;
  const allAnswered = answered === inv3Items.length;
  const score = Object.values(answers).reduce((a, b) => a + b, 0);
  const band = getBand(score, inv3Bands);

  if (showResult) {
    const nivelCount = [0, 1, 2].map((n) => Object.values(answers).filter((v) => v === n).length);
    return (
      <ResultCard
        score={score}
        maxScore={24}
        band={band}
        onReset={() => { setAnswers({}); setShowResult(false); }}
        extraInfo={
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Não consegue", count: nivelCount[0], color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-200 dark:border-red-800/40" },
              { label: "Em desen.", count: nivelCount[1], color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/20", border: "border-yellow-200 dark:border-yellow-800/40" },
              { label: "Consegue", count: nivelCount[2], color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-800/40" },
            ].map((n) => (
              <div key={n.label} className={`rounded-xl p-3 border ${n.bg} ${n.border} text-center`}>
                <p className={`text-2xl font-bold ${n.color}`}>{n.count}</p>
                <p className={`text-xs ${n.color}`}>{n.label}</p>
              </div>
            ))}
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
            <strong>Instruções:</strong> Para cada habilidade, selecione o nível de desenvolvimento observado: 0 = Não consegue, 1 = Em desenvolvimento, 2 = Consegue com independência.
          </p>
        </div>
      </div>

      <ProgressBar answered={answered} total={inv3Items.length} />

      <div className="space-y-3">
        {inv3Items.map((item, i) => (
          <Card key={i} className="border-card-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="text-xs font-mono flex-shrink-0 mt-0.5">{i + 1}</Badge>
                <p className="text-sm text-foreground leading-relaxed">{item}</p>
              </div>
              <RadioGroup
                value={answers[i]?.toString()}
                onValueChange={(val) => setAnswers({ ...answers, [i]: parseInt(val) })}
                className="flex flex-wrap gap-2"
              >
                {inv3Labels.map((label, j) => (
                  <div key={j} className="flex items-center">
                    <RadioGroupItem value={j.toString()} id={`inv3-${i}-${j}`} className="sr-only" />
                    <Label
                      htmlFor={`inv3-${i}-${j}`}
                      className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                        answers[i] === j
                          ? j === 0
                            ? "bg-red-500 text-white border-red-500"
                            : j === 1
                            ? "bg-yellow-500 text-white border-yellow-500"
                            : "bg-emerald-500 text-white border-emerald-500"
                          : "bg-card text-foreground border-border hover:bg-muted"
                      }`}
                    >
                      <span className="font-mono mr-1">{j}</span>{label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        onClick={() => setShowResult(true)}
        disabled={!allAnswered}
        className="w-full"
        size="lg"
      >
        {allAnswered ? "Ver Resultado" : `Responda todos os ${inv3Items.length} itens (${answered}/${inv3Items.length})`}
      </Button>
    </div>
  );
}

// ─── INVENTÁRIO 4 Component ───────────────────────────────────────────────────

function Inventario4() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);

  const answered = Object.keys(answers).length;
  const allAnswered = answered === inv4Items.length;
  const score = Object.values(answers).reduce((a, b) => a + b, 0);
  const band = getBand(score, inv4Bands);

  if (showResult) {
    return (
      <ResultCard
        score={score}
        maxScore={30}
        band={band}
        onReset={() => { setAnswers({}); setShowResult(false); }}
        extraInfo={
          <div className="rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 p-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-violet-800 dark:text-violet-300 space-y-0.5">
                <p><strong>Referências de corte:</strong></p>
                <p>24-30 pts: Adequado · 16-23 pts: Leve · 8-15 pts: Moderado · 0-7 pts: Significativo</p>
              </div>
            </div>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-violet-800 dark:text-violet-300 leading-relaxed">
            <strong>Instruções:</strong> Avalie a frequência com que o aluno demonstra cada comportamento executivo em sala de aula. Escala: 0 = Nunca, 1 = Raramente, 2 = Frequentemente, 3 = Sempre.
          </p>
        </div>
      </div>

      <ProgressBar answered={answered} total={inv4Items.length} />

      <div className="space-y-3">
        {inv4Items.map((item, i) => (
          <Card key={i} className="border-card-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="text-xs font-mono flex-shrink-0 mt-0.5">{i + 1}</Badge>
                <p className="text-sm text-foreground leading-relaxed">{item}</p>
              </div>
              <RadioGroup
                value={answers[i]?.toString()}
                onValueChange={(val) => setAnswers({ ...answers, [i]: parseInt(val) })}
                className="flex flex-wrap gap-2"
              >
                {inv4Labels.map((label, j) => (
                  <div key={j} className="flex items-center">
                    <RadioGroupItem value={j.toString()} id={`inv4-${i}-${j}`} className="sr-only" />
                    <Label
                      htmlFor={`inv4-${i}-${j}`}
                      className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                        answers[i] === j
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border hover:bg-muted"
                      }`}
                    >
                      <span className="font-mono mr-1">{j}</span>{label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        onClick={() => setShowResult(true)}
        disabled={!allAnswered}
        className="w-full"
        size="lg"
      >
        {allAnswered ? "Ver Resultado" : `Responda todos os ${inv4Items.length} itens (${answered}/${inv4Items.length})`}
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const tabConfig = [
  {
    value: "comportamento",
    label: "Comportamento",
    shortLabel: "Comport.",
    icon: ClipboardList,
    gradient: "from-blue-500 to-indigo-500",
    component: Inventario1,
    items: 20,
    scale: "0–60 pts",
  },
  {
    value: "tea",
    label: "Sinais TEA",
    shortLabel: "TEA",
    icon: Puzzle,
    gradient: "from-amber-500 to-orange-500",
    component: Inventario2,
    items: 15,
    scale: "0–15 sinais",
  },
  {
    value: "alfabetizacao",
    label: "Alfabetização",
    shortLabel: "Alfabet.",
    icon: BookOpen,
    gradient: "from-emerald-500 to-teal-500",
    component: Inventario3,
    items: 12,
    scale: "0–24 pts",
  },
  {
    value: "executivas",
    label: "Funções Executivas",
    shortLabel: "F. Exec.",
    icon: Brain,
    gradient: "from-violet-500 to-purple-600",
    component: Inventario4,
    items: 10,
    scale: "0–30 pts",
  },
];

export default function InventariosEscolaPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <School className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Inventários para Escola</h1>
            <p className="text-xs text-muted-foreground">Questionários práticos para professores e equipe pedagógica</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 flex-shrink-0 print:hidden"
          onClick={() => window.print()}
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Imprimir</span>
        </Button>
      </div>

      {/* Inventories overview */}
      <div className="grid grid-cols-2 gap-2">
        {tabConfig.map((tab) => {
          const Icon = tab.icon;
          return (
            <div
              key={tab.value}
              className="rounded-xl p-3 bg-muted/40 border border-border flex items-center gap-2.5"
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tab.gradient} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground leading-tight truncate">{tab.label}</p>
                <p className="text-xs text-muted-foreground">{tab.items} itens · {tab.scale}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="comportamento" className="space-y-5">
        <TabsList className="grid grid-cols-4 h-auto gap-1 p-1">
          {tabConfig.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex flex-col items-center gap-1 py-2 px-1 h-auto text-xs data-[state=active]:bg-background"
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="leading-tight text-center">{tab.shortLabel}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabConfig.map((tab) => {
          const Icon = tab.icon;
          const Component = tab.component;
          return (
            <TabsContent key={tab.value} value={tab.value} className="space-y-5 mt-0">
              {/* Inventory header */}
              <div className={`rounded-xl p-4 bg-gradient-to-br ${tab.gradient} text-white`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" />
                  <h2 className="text-sm font-bold">{tab.label}</h2>
                </div>
                <p className="text-xs opacity-80">{tab.items} itens · {tab.scale}</p>
              </div>

              <Component />
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Print note */}
      <div className="rounded-xl bg-muted/50 border border-border p-4 print:hidden">
        <div className="flex items-start gap-2">
          <Printer className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Use o botão <strong>Imprimir</strong> para gerar uma versão para preenchimento físico ou envio por e-mail à escola.
          </p>
        </div>
      </div>
    </div>
  );
}
