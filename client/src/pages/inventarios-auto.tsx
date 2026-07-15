import { useState } from "react";
import {
  Heart,
  Zap,
  ShieldAlert,
  Moon,
  Apple,
  Users,
  BookOpen,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";

// ─── Types ────────────────────────────────────────────────────────────────────
type ScaleAnswer = Record<number, number>;

interface InventoryDef {
  id: string;
  tabLabel: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string; // tailwind accent color key
  bgLight: string;
  bgDark: string;
  items: string[];
  maxScore: number;
  classify: (score: number) => Classification;
}

interface Classification {
  label: string;
  description: string;
  level: "normal" | "leve" | "moderado" | "alto";
}

// ─── Scale Definitions ────────────────────────────────────────────────────────
const SCALE_OPTIONS = [
  { value: 0, label: "Nunca" },
  { value: 1, label: "Às vezes" },
  { value: 2, label: "Muitas vezes" },
  { value: 3, label: "Sempre" },
];

function stdClassify(score: number, max: number): Classification {
  const pct = score / max;
  if (pct < 0.2)
    return {
      label: "Normal / Sem indícios",
      description:
        "Suas respostas não mostram sinais preocupantes nessa área. Continue assim!",
      level: "normal",
    };
  if (pct < 0.4)
    return {
      label: "Leve",
      description:
        "Há alguns sinais que merecem atenção, mas ainda são poucos. Vale conversar com um adulto de confiança.",
      level: "leve",
    };
  if (pct < 0.67)
    return {
      label: "Moderado",
      description:
        "Você marcou várias coisas que podem estar te incomodando. É importante conversar com um médico ou psicólogo.",
      level: "moderado",
    };
  return {
    label: "Alto — Atenção!",
    description:
      "Suas respostas mostram muitas coisas difíceis. Fale com um médico ou profissional de saúde logo.",
    level: "alto",
  };
}

function humClassify(score: number): Classification {
  if (score <= 5)
    return {
      label: "Normal / Sem indícios",
      description:
        "Suas respostas não mostram sinais de tristeza ou depressão. Continue cuidando de você!",
      level: "normal",
    };
  if (score <= 11)
    return {
      label: "Leve",
      description:
        "Você está sentindo algumas coisas difíceis. Vale conversar com alguém de confiança sobre como você está se sentindo.",
      level: "leve",
    };
  if (score <= 19)
    return {
      label: "Moderado",
      description:
        "Você está sentindo muitas coisas pesadas. É muito importante conversar com um médico ou psicólogo.",
      level: "moderado",
    };
  return {
    label: "Alto — Atenção Urgente!",
    description:
      "Suas respostas mostram um sofrimento muito grande. Por favor, fale com um adulto de confiança ou com um médico hoje.",
    level: "alto",
  };
}

const INVENTORIES: InventoryDef[] = [
  {
    id: "humor",
    tabLabel: "Humor",
    title: "Como Eu Me Sinto",
    subtitle: "Humor / Tristeza",
    icon: Heart,
    color: "rose",
    bgLight: "bg-rose-50",
    bgDark: "dark:bg-rose-950/20",
    maxScore: 30,
    classify: humClassify,
    items: [
      "Me sinto triste sem motivo",
      "Não tenho vontade de fazer as coisas que eu gostava",
      "Me sinto cansado(a) mesmo sem fazer nada",
      "Tenho vontade de chorar",
      "Acho que nada vai dar certo",
      "Me sinto sozinho(a) mesmo com gente por perto",
      "Durmo mal ou demais",
      "Não consigo me concentrar na escola",
      "Sinto que ninguém gosta de mim",
      "Penso que seria melhor se eu não existisse",
    ],
  },
  {
    id: "ansiedade",
    tabLabel: "Ansiedade",
    title: "Minhas Preocupações",
    subtitle: "Ansiedade / Medos",
    icon: AlertCircle,
    color: "amber",
    bgLight: "bg-amber-50",
    bgDark: "dark:bg-amber-950/20",
    maxScore: 30,
    classify: (s) => stdClassify(s, 30),
    items: [
      "Me preocupo muito com coisas que podem dar errado",
      "Tenho medo de ir pra escola",
      "Meu coração dispara sem motivo",
      "Tenho medo de ficar longe dos meus pais",
      "Evito situações por medo",
      "Tenho dificuldade para relaxar",
      "Fico nervoso(a) quando tenho que falar na frente dos outros",
      "Tenho pensamentos ruins que não saem da minha cabeça",
      "Preciso fazer as coisas de um jeito certinho senão fico mal",
      "Tenho pesadelos frequentes",
    ],
  },
  {
    id: "atencao",
    tabLabel: "Atenção",
    title: "Minha Atenção",
    subtitle: "TDAH — Autoavaliação",
    icon: Zap,
    color: "blue",
    bgLight: "bg-blue-50",
    bgDark: "dark:bg-blue-950/20",
    maxScore: 30,
    classify: (s) => stdClassify(s, 30),
    items: [
      "Esqueço coisas que me pedem pra fazer",
      "Não consigo ficar parado(a) na cadeira",
      "Começo coisas e não termino",
      "Me distraio com qualquer barulho",
      "Faço coisas sem pensar e me arrependo depois",
      "Perco material escolar, brinquedos, coisas importantes",
      "Parece que minha cabeça está sempre em outro lugar",
      "Falo demais ou na hora errada",
      "Tenho dificuldade para esperar minha vez",
      'Me chamam de "elétrico" ou "avoado"',
    ],
  },
  {
    id: "comportamento",
    tabLabel: "Comportamento",
    title: "Como Eu Me Comporto",
    subtitle: "Comportamento / Irritabilidade",
    icon: ShieldAlert,
    color: "orange",
    bgLight: "bg-orange-50",
    bgDark: "dark:bg-orange-950/20",
    maxScore: 30,
    classify: (s) => stdClassify(s, 30),
    items: [
      "Fico com raiva muito fácil",
      "Brigo com colegas na escola",
      "Desobedeço regras de propósito",
      "Destruo coisas quando estou nervoso(a)",
      "Culpo os outros pelos meus erros",
      "Discuto com adultos",
      "Provoco ou irrito pessoas de propósito",
      "Sou vingativo(a) quando me fazem algo",
      "Minto para conseguir o que quero",
      "Tenho dificuldade em controlar minha raiva",
    ],
  },
  {
    id: "sono",
    tabLabel: "Sono",
    title: "Meu Sono",
    subtitle: "Qualidade do Sono",
    icon: Moon,
    color: "indigo",
    bgLight: "bg-indigo-50",
    bgDark: "dark:bg-indigo-950/20",
    maxScore: 24,
    classify: (s) => stdClassify(s, 24),
    items: [
      "Demoro para pegar no sono",
      "Acordo durante a noite",
      "Tenho pesadelos",
      "Me sinto cansado(a) de manhã",
      "Fico com sono durante o dia",
      "Preciso de alguém perto pra dormir",
      "Tenho medo de dormir no escuro",
      "Ronco ou respiro pela boca dormindo",
    ],
  },
  {
    id: "alimentacao",
    tabLabel: "Alimentação",
    title: "Minha Alimentação",
    subtitle: "Hábitos Alimentares",
    icon: Apple,
    color: "green",
    bgLight: "bg-green-50",
    bgDark: "dark:bg-green-950/20",
    maxScore: 24,
    classify: (s) => stdClassify(s, 24),
    items: [
      "Não gosto de experimentar comidas novas",
      "Só como poucas coisas",
      "O cheiro de certas comidas me incomoda",
      "Me forçam a comer e eu não quero",
      "Pulo refeições (café, almoço ou janta)",
      "Como escondido(a)",
      "Me sinto mal depois de comer",
      "Fico preocupado(a) com meu peso ou corpo",
    ],
  },
  {
    id: "social",
    tabLabel: "Social",
    title: "Eu e os Outros",
    subtitle: "Habilidades Sociais",
    icon: Users,
    color: "purple",
    bgLight: "bg-purple-50",
    bgDark: "dark:bg-purple-950/20",
    maxScore: 24,
    classify: (s) => stdClassify(s, 24),
    items: [
      "Prefiro ficar sozinho(a) a brincar com outros",
      "Tenho poucos amigos",
      "Não entendo piadas ou brincadeiras dos colegas",
      "Sofro bullying ou sou excluído(a)",
      "Tenho dificuldade em conversar com pessoas novas",
      "Não gosto de mudanças na rotina",
      "Me incomodo com barulhos ou toques",
      'As pessoas dizem que eu sou "diferente"',
    ],
  },
  {
    id: "escola",
    tabLabel: "Escola",
    title: "Minha Escola",
    subtitle: "Aprendizado / Dificuldades",
    icon: BookOpen,
    color: "teal",
    bgLight: "bg-teal-50",
    bgDark: "dark:bg-teal-950/20",
    maxScore: 24,
    classify: (s) => stdClassify(s, 24),
    items: [
      "Tenho dificuldade para ler",
      "Tenho dificuldade para escrever",
      "Tenho dificuldade com matemática",
      "Não entendo o que o professor explica",
      "Demoro mais que os colegas para fazer as tarefas",
      "Esqueço o que estudei rapidinho",
      "Não gosto de ir pra escola",
      "Acho as aulas muito difíceis",
    ],
  },
];

// ─── Colour helpers ────────────────────────────────────────────────────────────
const INVENTORY_ACCENT: Record<string, { iconBg: string; tab: string }> = {
  humor: {
    iconBg: "from-rose-500 to-pink-500",
    tab: "data-[state=active]:text-rose-600 data-[state=active]:border-rose-400",
  },
  ansiedade: {
    iconBg: "from-amber-500 to-yellow-500",
    tab: "data-[state=active]:text-amber-600 data-[state=active]:border-amber-400",
  },
  atencao: {
    iconBg: "from-blue-500 to-cyan-500",
    tab: "data-[state=active]:text-blue-600 data-[state=active]:border-blue-400",
  },
  comportamento: {
    iconBg: "from-orange-500 to-red-400",
    tab: "data-[state=active]:text-orange-600 data-[state=active]:border-orange-400",
  },
  sono: {
    iconBg: "from-indigo-500 to-violet-500",
    tab: "data-[state=active]:text-indigo-600 data-[state=active]:border-indigo-400",
  },
  alimentacao: {
    iconBg: "from-green-500 to-emerald-500",
    tab: "data-[state=active]:text-green-600 data-[state=active]:border-green-400",
  },
  social: {
    iconBg: "from-purple-500 to-fuchsia-500",
    tab: "data-[state=active]:text-purple-600 data-[state=active]:border-purple-400",
  },
  escola: {
    iconBg: "from-teal-500 to-cyan-500",
    tab: "data-[state=active]:text-teal-600 data-[state=active]:border-teal-400",
  },
};

// ─── InventoryQuestions sub-component ─────────────────────────────────────────
interface InventoryQuestionsProps {
  inv: InventoryDef;
  answers: ScaleAnswer;
  onChange: (idx: number, val: number) => void;
}

function InventoryQuestions({
  inv,
  answers,
  onChange,
}: InventoryQuestionsProps) {
  const answered = Object.keys(answers).filter(
    (k) => answers[+k] !== undefined,
  ).length;
  const progress = (answered / inv.items.length) * 100;
  const accent = INVENTORY_ACCENT[inv.id];
  const Icon = inv.icon;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent.iconBg} flex items-center justify-center shadow-sm flex-shrink-0`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground truncate">
            {inv.title}
          </h2>
          <p className="text-xs text-muted-foreground">
            {inv.subtitle} • {inv.items.length} perguntas
          </p>
        </div>
        <Badge variant="outline" className="text-xs shrink-0">
          {answered}/{inv.items.length}
        </Badge>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground text-right">
          {Math.round(progress)}% respondido
        </p>
      </div>

      {/* Scale legend */}
      <div className="flex gap-2 flex-wrap">
        {SCALE_OPTIONS.map((opt) => (
          <span
            key={opt.value}
            className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
          >
            {opt.value} = {opt.label}
          </span>
        ))}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {inv.items.map((item, i) => {
          const val = answers[i];
          const isAnswered = val !== undefined;
          return (
            <Card
              key={i}
              className={`border transition-colors ${isAnswered ? "border-primary/30 bg-primary/5 dark:bg-primary/10" : "border-border"}`}
            >
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium text-foreground leading-snug">
                  <span className="text-muted-foreground mr-2 text-xs font-normal">
                    {i + 1}.
                  </span>
                  {item}
                </p>
                <RadioGroup
                  value={val !== undefined ? String(val) : ""}
                  onValueChange={(v) => onChange(i, parseInt(v))}
                  className="flex gap-2 flex-wrap"
                >
                  {SCALE_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center gap-1.5">
                      <RadioGroupItem
                        value={String(opt.value)}
                        id={`${inv.id}-q${i}-v${opt.value}`}
                        className="sr-only"
                      />
                      <Label
                        htmlFor={`${inv.id}-q${i}-v${opt.value}`}
                        className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-medium transition-all select-none
                          ${
                            val === opt.value
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5"
                          }`}
                      >
                        {opt.value} — {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function InventariosAutoPage() {
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");

  // One answers map per inventory, keyed by inventory id
  const [allAnswers, setAllAnswers] = useState<Record<string, ScaleAnswer>>(
    Object.fromEntries(INVENTORIES.map((inv) => [inv.id, {}])),
  );

  const [activeTab, setActiveTab] = useState(INVENTORIES[0].id);
  const [showResult, setShowResult] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  function handleAnswer(invId: string, idx: number, val: number) {
    setAllAnswers((prev) => ({
      ...prev,
      [invId]: { ...prev[invId], [idx]: val },
    }));
  }

  function getAnsweredCount(invId: string) {
    return Object.keys(allAnswers[invId]).length;
  }

  const totalAnswered = INVENTORIES.reduce(
    (sum, inv) => sum + getAnsweredCount(inv.id),
    0,
  );
  const totalQuestions = INVENTORIES.reduce(
    (sum, inv) => sum + inv.items.length,
    0,
  );
  const allDone = INVENTORIES.every(
    (inv) => getAnsweredCount(inv.id) === inv.items.length,
  );

  function handleReset() {
    setAllAnswers(Object.fromEntries(INVENTORIES.map((inv) => [inv.id, {}])));
    setShowResult(false);
    setShowProfile(false);
    setActiveTab(INVENTORIES[0].id);
    setChildName("");
    setChildAge("");
  }

  // Build ClinicalReport items — ALL questions from ALL inventories
  function buildReportItems() {
    const items: { question: string; answer: string }[] = [];
    INVENTORIES.forEach((inv) => {
      const ans = allAnswers[inv.id];
      inv.items.forEach((q, i) => {
        const val = ans[i];
        const opt =
          val === undefined
            ? undefined
            : SCALE_OPTIONS.find((o) => o.value === val);
        items.push({
          question: `[${inv.title}] ${q}`,
          answer: opt?.label ?? "Não respondida",
        });
      });
    });
    return items;
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-sm">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Inventários Autoaplicáveis
            </h1>
            <p className="text-xs text-muted-foreground">
              Para crianças e adolescentes de 8 a 17 anos — 8 áreas clínicas
            </p>
          </div>
        </div>
        {(showResult || showProfile) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Reiniciar
          </Button>
        )}
      </div>

      {/* Child Info */}
      <Card className="border-border">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Informações da Criança / Adolescente
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="childName" className="text-xs">
                Meu nome
              </Label>
              <Input
                id="childName"
                placeholder="Como você se chama?"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="childAge" className="text-xs">
                Minha idade
              </Label>
              <Input
                id="childAge"
                placeholder="Quantos anos você tem?"
                value={childAge}
                onChange={(e) => setChildAge(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Progress */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-xs font-semibold text-muted-foreground">
              Progresso geral
            </p>
            <span className="text-xs text-muted-foreground">
              {totalAnswered} de {totalQuestions} perguntas
            </span>
          </div>
          <Progress
            value={(totalAnswered / totalQuestions) * 100}
            className="h-2.5"
          />
          <div className="flex flex-wrap gap-1.5 mt-1">
            {INVENTORIES.map((inv) => {
              const cnt = getAnsweredCount(inv.id);
              const done = cnt === inv.items.length;
              const _accent = INVENTORY_ACCENT[inv.id];
              const Icon = inv.icon;
              return (
                <button
                  key={inv.id}
                  onClick={() => setActiveTab(inv.id)}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-all
                    ${
                      done
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300"
                        : cnt > 0
                          ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300"
                          : "border-border bg-background text-muted-foreground"
                    }`}
                >
                  <Icon className="w-3 h-3" />
                  {inv.tabLabel}
                  {done && <CheckCircle2 className="w-3 h-3" />}
                  {!done && (
                    <span className="text-xs opacity-70">
                      {cnt}/{inv.items.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Inventories Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/60 p-1 rounded-xl">
          {INVENTORIES.map((inv) => {
            const cnt = getAnsweredCount(inv.id);
            const done = cnt === inv.items.length;
            const Icon = inv.icon;
            return (
              <TabsTrigger
                key={inv.id}
                value={inv.id}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg data-[state=active]:shadow-sm"
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{inv.tabLabel}</span>
                {done && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                {!done && cnt > 0 && (
                  <span className="text-amber-500 text-xs">{cnt}</span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {INVENTORIES.map((inv) => (
          <TabsContent key={inv.id} value={inv.id} className="mt-5">
            <InventoryQuestions
              inv={inv}
              answers={allAnswers[inv.id]}
              onChange={(idx, val) => handleAnswer(inv.id, idx, val)}
            />

            {/* Navigation between tabs */}
            <div className="flex justify-between gap-3 mt-5">
              {(() => {
                const idx = INVENTORIES.findIndex((i) => i.id === inv.id);
                const prev = INVENTORIES[idx - 1];
                const next = INVENTORIES[idx + 1];
                return (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={!prev}
                      onClick={() => prev && setActiveTab(prev.id)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      {prev ? prev.tabLabel : "Início"}
                    </Button>
                    {next ? (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setActiveTab(next.id)}
                      >
                        {next.tabLabel}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                        onClick={() => {
                          setShowResult(true);
                          setShowProfile(true);
                        }}
                        disabled={!allDone}
                      >
                        <ClipboardList className="w-4 h-4" />
                        Ver Todas as Respostas
                      </Button>
                    )}
                  </>
                );
              })()}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* CTA when not all done */}
      {!allDone && (
        <Card className="border-dashed border-muted-foreground/30">
          <CardContent className="p-4 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Responda todas as perguntas dos {INVENTORIES.length} inventários
              para ver seu perfil completo.
            </p>
            <p className="text-xs text-muted-foreground">
              Faltam {totalQuestions - totalAnswered} respostas
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── RESULTS SECTION ── */}
      {showResult &&
        showProfile &&
        allDone &&
        (() => {
          const reportItems = buildReportItems();

          return (
            <div className="space-y-6 mt-2">
              {/* Cabeçalho */}
              <Card className="border-border">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-sm">
                      <ClipboardList className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">
                        {childName
                          ? `Respostas de ${childName}`
                          : "Minhas Respostas"}
                      </h2>
                      {childAge && (
                        <p className="text-xs text-muted-foreground">
                          {childAge} anos
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Registro integral do que foi perguntado e respondido, para
                    revisão do profissional responsável.
                  </p>
                </CardContent>
              </Card>

              {/* Perguntas e respostas por inventário */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  Perguntas e respostas
                </h3>
                <div className="space-y-4">
                  {INVENTORIES.map((inv) => {
                    const ans = allAnswers[inv.id];
                    const Icon = inv.icon;
                    const accent = INVENTORY_ACCENT[inv.id];
                    return (
                      <Card key={inv.id} className="border-border">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-lg bg-gradient-to-br ${accent.iconBg} flex items-center justify-center flex-shrink-0`}
                            >
                              <Icon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground">
                                {inv.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {inv.subtitle}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {inv.items.map((q, i) => {
                              const val = ans[i];
                              const opt =
                                val === undefined
                                  ? undefined
                                  : SCALE_OPTIONS.find((o) => o.value === val);
                              return (
                                <div
                                  key={i}
                                  className="rounded-lg border border-border/70 bg-background p-2.5"
                                >
                                  <p className="text-sm text-foreground leading-snug">
                                    <span className="text-muted-foreground mr-1.5 text-xs font-normal">
                                      {i + 1}.
                                    </span>
                                    {q}
                                  </p>
                                  <p className="text-sm text-primary mt-1">
                                    → {opt?.label ?? "—"}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Clinical Report */}
              <ClinicalReport
                scaleName="Inventários Autoaplicáveis — 8 Áreas Clínicas"
                scaleFullName={
                  childName
                    ? `Respondido por: ${childName}${childAge ? `, ${childAge} anos` : ""}`
                    : undefined
                }
                items={reportItems}
                patientAge={childAge ? `${childAge} anos` : "8–17 anos"}
              />

              {/* Save to Patient */}
              <SaveToPatient
                scaleName="Inventários Autoaplicáveis"
                responses={reportItems}
                patientAge={childAge || "8-17 anos"}
              />

              {/* Reset */}
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Fazer Novamente
                </Button>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
