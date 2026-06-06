import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Printer,
  TrendingUp,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type AgeGroup = "5-6" | "7-8" | "9-10" | "11-12" | "13-14";
type Score = 0 | 1 | 2 | null;
type Answers = Record<string, Score>;

interface AgeGroupInfo {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

// ── Age group config ───────────────────────────────────────────────────────
const AGE_GROUPS: Record<AgeGroup, AgeGroupInfo> = {
  "5-6": {
    label: "5–6 anos",
    description: "Pré-escola / 1º ano",
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
    borderColor: "border-pink-200 dark:border-pink-800/40",
  },
  "7-8": {
    label: "7–8 anos",
    description: "2º–3º ano",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800/40",
  },
  "9-10": {
    label: "9–10 anos",
    description: "4º–5º ano",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    borderColor: "border-amber-200 dark:border-amber-800/40",
  },
  "11-12": {
    label: "11–12 anos",
    description: "6º–7º ano",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    borderColor: "border-emerald-200 dark:border-emerald-800/40",
  },
  "13-14": {
    label: "13–14 anos",
    description: "8º–9º ano",
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/20",
    borderColor: "border-violet-200 dark:border-violet-800/40",
  },
};

// ── Item definitions ───────────────────────────────────────────────────────
const LEITURA_ITEMS: Record<AgeGroup, string[]> = {
  "5-6": [
    "Reconhece o próprio nome escrito",
    "Identifica as vogais (A, E, I, O, U)",
    "Lê sílabas simples (MA, PA, BO)",
    "Identifica a letra inicial de palavras (B de bola)",
    "Diferencia letras de números",
    "Reconhece palavras do cotidiano (PARE, SAÍDA)",
    "Segue o texto com o dedo ao ouvir leitura",
    "Reconta história ouvida com sequência lógica",
  ],
  "7-8": [
    "Lê palavras dissílabas (bola, gato)",
    "Lê palavras trissílabas (banana, macaco)",
    "Lê frases curtas com compreensão (O gato bebe leite)",
    "Compreende o que leu — responde perguntas simples",
    "Lê com fluência mínima (não soletra letra a letra)",
    "Identifica singular e plural nas palavras lidas",
    "Reconhece pontuação básica (ponto, interrogação, exclamação)",
    "Lê texto de 3 linhas sem perder a linha",
  ],
  "9-10": [
    "Lê texto de 5+ linhas com fluência",
    "Identifica a ideia principal do texto",
    "Responde perguntas de inferência (o que não está explícito)",
    "Lê palavras irregulares corretamente (hoje, homem, aquele)",
    "Lê em voz alta com entonação adequada",
    "Identifica personagens e cenário da história",
    "Diferencia fato de opinião no texto",
    "Resume com suas palavras o que leu",
  ],
  "11-12": [
    "Lê texto informativo com compreensão plena",
    "Interpreta gráficos e tabelas simples",
    "Identifica recursos de linguagem (ex.: metáfora)",
    "Compara informações de fontes diferentes",
    "Faz inferências complexas além do texto",
    "Identifica argumento e contra-argumento em textos",
    "Reconhece e usa vocabulário técnico da área",
    "Resume texto longo de forma coerente",
  ],
  "13-14": [
    "Lê texto argumentativo/jornalístico com compreensão",
    "Identifica ironia e ambiguidade no texto",
    "Analisa criticamente o conteúdo lido",
    "Sintetiza informações de múltiplas fontes",
    "Identifica o viés ou ponto de vista do autor",
    "Compreende e usa vocabulário abstrato",
    "Interpreta texto literário com linguagem figurada",
    "Produz resumo escrito do texto com qualidade",
  ],
};

const ESCRITA_ITEMS: Record<AgeGroup, string[]> = {
  "5-6": [
    "Escreve o primeiro nome sem modelo",
    "Copia letras de modelo com legibilidade",
    "Escreve as vogais por ditado",
    "Traça formas geométricas básicas (círculo, quadrado, cruz)",
    "Segura o lápis corretamente (preensão trípode)",
    "Escreve 5 letras por ditado corretamente",
    "Separa palavras com espaço ao escrever",
    "Copia palavra curta do quadro/cartão",
  ],
  "7-8": [
    "Escreve o nome completo",
    "Escreve palavras simples por ditado (bola, pato)",
    "Diferencia e usa maiúscula/minúscula corretamente",
    "Escreve frase curta por ditado",
    "Usa ponto final ao terminar a frase",
    "Copia texto curto sem erros graves",
    "Escreve bilhete simples espontaneamente",
    "Segmenta sílabas ao escrever (pa-to, bo-la)",
  ],
  "9-10": [
    "Escreve texto narrativo de 5 frases com início, meio e fim",
    "Usa vírgula e ponto adequadamente",
    "Escreve palavras com dígrafos (ch, nh, lh) corretamente",
    "Ortografia adequada em palavras de escrita regular",
    "Produz texto com coerência e progressão temática",
    "Organiza o texto em parágrafos",
    "Acerta ≥70% em ditado de 10 palavras",
    "Relê e revisa o próprio texto",
  ],
  "11-12": [
    "Produz texto dissertativo com tema definido",
    "Usa concordância verbal e nominal corretamente",
    "Aplica acentuação gráfica corretamente",
    "Organiza texto em introdução, desenvolvimento e conclusão",
    "Usa conectivos adequados (porém, entretanto, portanto)",
    "Escreve em registro formal quando solicitado",
    "Produz 10+ linhas com coerência e coesão",
    "Identifica e corrige erros no próprio texto",
  ],
  "13-14": [
    "Produz texto dissertativo-argumentativo",
    "Apresenta tese e argumentos articulados",
    "Mantém coesão textual ao longo do texto",
    "Domina crase e acentuação com consistência",
    "Mantém registro formal consistente",
    "Faz revisão crítica e reescrita do texto",
    "Produz resumo acadêmico de texto científico",
    "Escreve 20+ linhas organizadas e coesas",
  ],
};

const ARITMETICA_ITEMS: Record<AgeGroup, string[]> = {
  "5-6": [
    "Conta até 20 em sequência sem erros",
    "Reconhece numerais de 1 a 20",
    "Correspondência número-quantidade até 10",
    "Compara quantidades (mais/menos, maior/menor)",
    "Classifica por tamanho (grande, médio, pequeno)",
    "Completa sequência numérica (o que vem depois do 5?)",
    "Realiza adição simples com dedos até 5",
    "Reconhece formas geométricas básicas (círculo, quadrado, triângulo)",
  ],
  "7-8": [
    "Conta até 100 em sequência",
    "Realiza adição simples até 20",
    "Realiza subtração simples até 20",
    "Resolve problemas orais simples de 1 etapa",
    "Reconhece dezenas e unidades (23 = 2 dezenas e 3 unidades)",
    "Completa sequência numérica até 100",
    "Mede objetos com régua em centímetros",
    "Identifica horas cheias no relógio analógico",
  ],
  "9-10": [
    "Domina a tabuada de 2, 3, 4 e 5",
    "Realiza divisão simples com exatidão",
    "Resolve problemas com 2 operações",
    "Opera com números até 1000",
    "Compreende frações simples (metade, terço, quarto)",
    "Usa medidas de comprimento, peso e capacidade",
    "Lê horas e minutos no relógio",
    "Calcula perímetro de figuras simples",
  ],
  "11-12": [
    "Opera com frações (soma, subtração, multiplicação)",
    "Opera com números decimais",
    "Calcula porcentagem simples (10%, 25%, 50%)",
    "Resolve problemas com múltiplas etapas",
    "Interpreta gráfico de barras e tabelas",
    "Calcula área de retângulo e quadrado",
    "Calcula média aritmética de um conjunto",
    "Opera com números negativos",
  ],
  "13-14": [
    "Resolve equação de 1º grau",
    "Aplica proporcionalidade e regra de três",
    "Calcula área e perímetro de figuras variadas",
    "Interpreta gráficos de setores e linhas",
    "Realiza potenciação e radiciação básica",
    "Resolve expressões numéricas com parênteses",
    "Calcula probabilidade simples",
    "Resolve problemas com porcentagem composta",
  ],
};

// ── Scoring helpers ────────────────────────────────────────────────────────
function getClassification(pct: number): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  description: string;
} {
  if (pct >= 80)
    return {
      label: "Adequado",
      color: "text-emerald-700 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      borderColor: "border-emerald-300 dark:border-emerald-700/40",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      description:
        "Desempenho dentro do esperado para a faixa etária. Habilidades acadêmicas preservadas.",
    };
  if (pct >= 60)
    return {
      label: "Em desenvolvimento",
      color: "text-amber-700 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
      borderColor: "border-amber-300 dark:border-amber-700/40",
      icon: <TrendingUp className="w-5 h-5 text-amber-600" />,
      description:
        "Desempenho em desenvolvimento. Acompanhamento pedagógico recomendado.",
    };
  if (pct >= 40)
    return {
      label: "Abaixo do esperado",
      color: "text-orange-700 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      borderColor: "border-orange-300 dark:border-orange-700/40",
      icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
      description:
        "Desempenho abaixo do esperado — investigação e suporte especializado recomendados.",
    };
  return {
    label: "Significativamente abaixo",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-300 dark:border-red-700/40",
    icon: <XCircle className="w-5 h-5 text-red-600" />,
    description:
      "Desempenho significativamente abaixo do esperado — encaminhamento para avaliação especializada indicado.",
  };
}

function getDomainClassification(score: number): string {
  const pct = (score / 16) * 100;
  if (pct >= 80) return "Adequado";
  if (pct >= 60) return "Em desenvolvimento";
  if (pct >= 40) return "Abaixo do esperado";
  return "Significativamente abaixo";
}

// ── Score button ───────────────────────────────────────────────────────────
const SCORE_OPTIONS: {
  value: Score;
  label: string;
  short: string;
  color: string;
  selectedColor: string;
  icon: string;
}[] = [
  {
    value: 2,
    label: "Correto",
    short: "Correto",
    color: "border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
    selectedColor:
      "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700",
    icon: "✅",
  },
  {
    value: 1,
    label: "Parcial",
    short: "Parcial",
    color:
      "border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30",
    selectedColor: "bg-amber-500 border-amber-500 text-white hover:bg-amber-600",
    icon: "🔶",
  },
  {
    value: 0,
    label: "Incorreto",
    short: "Incorreto",
    color:
      "border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30",
    selectedColor: "bg-red-600 border-red-600 text-white hover:bg-red-700",
    icon: "❌",
  },
];

function ScoreButtons({
  currentValue,
  onChange,
  itemKey,
}: {
  currentValue: Score;
  onChange: (v: Score) => void;
  itemKey: string;
}) {
  return (
    <div className="flex gap-1.5">
      {SCORE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(currentValue === opt.value ? null : opt.value)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            currentValue === opt.value ? opt.selectedColor : opt.color
          }`}
          data-testid={`score-${itemKey}-${opt.value}`}
        >
          <span className="text-sm leading-none">{opt.icon}</span>
          <span className="hidden sm:inline">{opt.short}</span>
        </button>
      ))}
    </div>
  );
}

// ── Domain tab content ─────────────────────────────────────────────────────
function DomainTab({
  domain,
  items,
  answers,
  onChange,
  domainKey,
  emoji,
}: {
  domain: string;
  items: string[];
  answers: Answers;
  onChange: (key: string, value: Score) => void;
  domainKey: string;
  emoji: string;
}) {
  const domainScore = items.reduce(
    (acc, _, idx) => acc + (answers[`${domainKey}-${idx}`] ?? 0),
    0
  );
  const answered = items.filter(
    (_, idx) => answers[`${domainKey}-${idx}`] !== null && answers[`${domainKey}-${idx}`] !== undefined
  ).length;
  const pct = (domainScore / 16) * 100;

  return (
    <div className="space-y-4">
      {/* Domain summary bar */}
      <div className="rounded-xl border border-card-border bg-card/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{emoji}</span>
            <span className="text-sm font-semibold text-foreground">{domain}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {answered}/{items.length} respondidos
            </Badge>
            <Badge
              className={`text-xs font-bold ${
                pct >= 80
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : pct >= 60
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                  : pct >= 40
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400"
                  : answered > 0
                  ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {domainScore}/16
            </Badge>
          </div>
        </div>
        <Progress value={answered > 0 ? pct : 0} className="h-2" />
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item, idx) => {
          const key = `${domainKey}-${idx}`;
          const val = answers[key] ?? null;
          const isAnswered = val !== null;

          return (
            <Card
              key={key}
              className={`border transition-all ${
                val === 2
                  ? "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/10"
                  : val === 1
                  ? "border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/10"
                  : val === 0
                  ? "border-red-200 dark:border-red-800/40 bg-red-50/30 dark:bg-red-950/10"
                  : "border-card-border"
              }`}
            >
              <CardContent className="p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <span
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                        isAnswered
                          ? val === 2
                            ? "bg-emerald-600 text-white"
                            : val === 1
                            ? "bg-amber-500 text-white"
                            : "bg-red-600 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <p className="text-sm text-foreground leading-relaxed">{item}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <ScoreButtons
                      currentValue={val}
                      onChange={(v) => onChange(key, v)}
                      itemKey={key}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function TestesAcademicosPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [activeTab, setActiveTab] = useState("leitura");

  // ── Computed scores ──
  const leituraItems = useMemo(() => ageGroup ? LEITURA_ITEMS[ageGroup] : [], [ageGroup]);
  const escritaItems = useMemo(() => ageGroup ? ESCRITA_ITEMS[ageGroup] : [], [ageGroup]);
  const aritmeticaItems = useMemo(() => ageGroup ? ARITMETICA_ITEMS[ageGroup] : [], [ageGroup]);

  const leituraScore = leituraItems.reduce(
    (acc, _, i) => acc + (answers[`leitura-${i}`] ?? 0),
    0
  );
  const escritaScore = escritaItems.reduce(
    (acc, _, i) => acc + (answers[`escrita-${i}`] ?? 0),
    0
  );
  const aritmeticaScore = aritmeticaItems.reduce(
    (acc, _, i) => acc + (answers[`aritmetica-${i}`] ?? 0),
    0
  );

  const totalScore = leituraScore + escritaScore + aritmeticaScore;
  const maxScore = 48;
  const percentage = Math.round((totalScore / maxScore) * 100);

  const classification = getClassification(percentage);

  const totalAnswered = useMemo(() => {
    return Object.values(answers).filter((v) => v !== null).length;
  }, [answers]);

  const _allAnswered = totalAnswered === 24;

  // ── Clinical report items ──
  const reportItems = useMemo(() => {
    if (!ageGroup) return [];
    const items: { question: string; answer: string; value: number }[] = [];

    leituraItems.forEach((item, i) => {
      const v = answers[`leitura-${i}`] ?? 0;
      items.push({
        question: `[📖 Leitura] ${item}`,
        answer: v === 2 ? "✅ Correto" : v === 1 ? "🔶 Parcial" : "❌ Incorreto",
        value: v,
      });
    });
    escritaItems.forEach((item, i) => {
      const v = answers[`escrita-${i}`] ?? 0;
      items.push({
        question: `[✏️ Escrita] ${item}`,
        answer: v === 2 ? "✅ Correto" : v === 1 ? "🔶 Parcial" : "❌ Incorreto",
        value: v,
      });
    });
    aritmeticaItems.forEach((item, i) => {
      const v = answers[`aritmetica-${i}`] ?? 0;
      items.push({
        question: `[🔢 Aritmética] ${item}`,
        answer: v === 2 ? "✅ Correto" : v === 1 ? "🔶 Parcial" : "❌ Incorreto",
        value: v,
      });
    });

    return items;
  }, [answers, ageGroup, leituraItems, escritaItems, aritmeticaItems]);

  const domainResults = [
    { domain: "📖 Leitura", score: leituraScore, classification: getDomainClassification(leituraScore) },
    { domain: "✏️ Escrita", score: escritaScore, classification: getDomainClassification(escritaScore) },
    { domain: "🔢 Aritmética", score: aritmeticaScore, classification: getDomainClassification(aritmeticaScore) },
  ];

  function handleAnswer(key: string, value: Score) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function handleReset() {
    setStep(1);
    setChildName("");
    setChildAge("");
    setAgeGroup(null);
    setAnswers({});
    setActiveTab("leitura");
  }

  function handlePrint() {
    if (!ageGroup) return;
    const ageInfo = AGE_GROUPS[ageGroup];
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const rowStyle =
      "padding:5px 10px;border-bottom:1px solid #eee;font-size:9pt;";
    const domainHeader = (emoji: string, name: string, score: number, pct: number) =>
      `<tr style="background:#f3f0ff;"><td colspan="4" style="padding:8px 10px;font-weight:bold;font-size:10pt;color:#6d28d9;">${emoji} ${name} — ${score}/16 pts (${Math.round(pct)}%)</td></tr>`;

    const itemRows = (items: string[], domainKey: string, _emoji: string) =>
      items
        .map((item, i) => {
          const v = answers[`${domainKey}-${i}`] ?? 0;
          const ans = v === 2 ? "✅ Correto" : v === 1 ? "🔶 Parcial" : "❌ Incorreto";
          const bg = v === 2 ? "#f0fdf4" : v === 1 ? "#fffbeb" : "#fff1f2";
          return `<tr style="background:${bg};"><td style="${rowStyle}">${i + 1}</td><td style="${rowStyle}">${item}</td><td style="${rowStyle}">${ans}</td><td style="${rowStyle}">${v}</td></tr>`;
        })
        .join("");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Testes Acadêmicos — ${childName} — ${dateStr}</title>
  <style>
    @page { margin: 1.8cm; size: A4; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #1a1a1a; }
    .header { border-bottom: 3px solid #6d28d9; padding-bottom: 14px; margin-bottom: 18px; }
    .header h1 { font-size: 15pt; color: #6d28d9; }
    .header .sub { font-size: 10pt; color: #555; margin-top: 3px; }
    .result-box { display:flex; gap:20px; background:#f3f0ff; border-left:4px solid #6d28d9; padding:12px 16px; border-radius:4px; margin-bottom:16px; }
    .result-box .score { font-size: 22pt; font-weight: bold; color: #6d28d9; }
    .result-box .label { font-size: 9pt; color: #555; }
    .result-box .classif { font-size: 12pt; font-weight: bold; }
    .domains { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:18px; }
    .domain-card { background:#faf9ff; border:1px solid #e5e7eb; border-radius:4px; padding:8px 12px; text-align:center; }
    .domain-card .emoji { font-size:16pt; }
    .domain-card .name { font-weight:bold; font-size:9pt; margin-top:2px; }
    .domain-card .pts { font-size:11pt; font-weight:bold; color:#6d28d9; }
    .domain-card .classif { font-size:8pt; color:#555; }
    h2 { font-size:11pt; color:#6d28d9; text-transform:uppercase; letter-spacing:.5px; border-bottom:1px solid #e5e7eb; padding-bottom:4px; margin-bottom:10px; margin-top:18px; }
    table { width:100%; border-collapse:collapse; }
    th { background:#6d28d9; color:#fff; padding:6px 10px; text-align:left; font-size:9pt; }
    .footer { margin-top:24px; border-top:2px solid #6d28d9; padding-top:10px; font-size:9pt; color:#555; text-align:center; }
    .footer strong { font-size:10pt; color:#1a1a1a; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎓 NeuroPed — Testes Acadêmicos por Faixa Etária</h1>
    <div class="sub">Leitura · Escrita · Aritmética | Paciente: <strong>${childName || "—"}</strong>${childAge ? ` | Idade: ${childAge} anos` : ""} | Faixa: <strong>${ageInfo.label} (${ageInfo.description})</strong></div>
    <div class="sub" style="margin-top:4px;color:#888;">Data: ${dateStr}</div>
  </div>

  <div class="result-box">
    <div>
      <div class="score">${totalScore}<span style="font-size:13pt;color:#555">/${maxScore}</span></div>
      <div class="label">Pontuação total</div>
    </div>
    <div style="border-left:1px solid #c4b5fd;padding-left:20px;">
      <div class="score" style="font-size:18pt;">${percentage}%</div>
      <div class="label">do máximo</div>
    </div>
    <div style="border-left:1px solid #c4b5fd;padding-left:20px;display:flex;align-items:center;">
      <div class="classif">${classification.label}</div>
    </div>
  </div>

  <div class="domains">
    <div class="domain-card"><div class="emoji">📖</div><div class="name">Leitura</div><div class="pts">${leituraScore}/16</div><div class="classif">${getDomainClassification(leituraScore)}</div></div>
    <div class="domain-card"><div class="emoji">✏️</div><div class="name">Escrita</div><div class="pts">${escritaScore}/16</div><div class="classif">${getDomainClassification(escritaScore)}</div></div>
    <div class="domain-card"><div class="emoji">🔢</div><div class="name">Aritmética</div><div class="pts">${aritmeticaScore}/16</div><div class="classif">${getDomainClassification(aritmeticaScore)}</div></div>
  </div>

  <h2>Detalhamento dos Itens Avaliados</h2>
  <table>
    <thead><tr><th>#</th><th>Item</th><th>Resposta</th><th>Pts</th></tr></thead>
    <tbody>
      ${domainHeader("📖", "Leitura", leituraScore, (leituraScore / 16) * 100)}
      ${itemRows(leituraItems, "leitura", "📖")}
      ${domainHeader("✏️", "Escrita", escritaScore, (escritaScore / 16) * 100)}
      ${itemRows(escritaItems, "escrita", "✏️")}
      ${domainHeader("🔢", "Aritmética", aritmeticaScore, (aritmeticaScore / 16) * 100)}
      ${itemRows(aritmeticaItems, "aritmetica", "🔢")}
    </tbody>
  </table>

  <h2>Interpretação</h2>
  <p style="line-height:1.6;text-align:justify;">${classification.description} Este relatório deve ser interpretado no contexto clínico global da criança, considerando anamnese, exame neurológico e avaliação multidisciplinar.</p>

  <div class="footer">
    <strong>Dr. Jadson Fraga Araújo Júnior</strong><br>
    CRM-PE 25227 | CRM-BA 23384 | RQE 17756 / 14499 / 13119<br>
    NeuroPed — Escalas de Neuropediatria
  </div>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }

  // ── Render helpers ──
  function renderStep1() {
    return (
      <div className="space-y-6">
        {/* Child info */}
        <Card className="border-card-border">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Dados da Criança
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="child-name" className="text-xs text-muted-foreground">
                  Nome da criança
                </Label>
                <Input
                  id="child-name"
                  placeholder="Ex.: Maria"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  data-testid="input-child-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="child-age" className="text-xs text-muted-foreground">
                  Idade (anos)
                </Label>
                <Input
                  id="child-age"
                  placeholder="Ex.: 7"
                  type="number"
                  min={5}
                  max={14}
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  data-testid="input-child-age"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Age group selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Selecione a Faixa Etária
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(Object.entries(AGE_GROUPS) as [AgeGroup, AgeGroupInfo][]).map(
              ([key, info]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAgeGroup(key)}
                  data-testid={`age-group-${key}`}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    ageGroup === key
                      ? `${info.bgColor} ${info.borderColor} ring-2 ring-offset-1 ring-primary/40`
                      : "border-card-border hover:border-primary/30 hover:bg-muted/30"
                  }`}
                >
                  <div className={`text-base font-bold ${ageGroup === key ? info.color : "text-foreground"}`}>
                    {info.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {info.description}
                  </div>
                </button>
              )
            )}
          </div>
        </div>

        {/* Info box */}
        <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
              <p>
                <strong>Como aplicar:</strong> Apresente cada tarefa diretamente à
                criança. Registre: ✅ Correto (2 pts), 🔶 Parcial (1 pt) ou ❌
                Incorreto (0 pts).
              </p>
              <p>
                São <strong>24 itens</strong> no total (8 por domínio), com pontuação
                máxima de <strong>48 pontos</strong>.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setStep(2)}
          disabled={!ageGroup}
          className="w-full gap-2"
          data-testid="btn-start-test"
        >
          Iniciar Avaliação <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  function renderStep2() {
    if (!ageGroup) return null;
    const info = AGE_GROUPS[ageGroup];

    const leituraAnswered = leituraItems.filter(
      (_, i) => answers[`leitura-${i}`] !== null && answers[`leitura-${i}`] !== undefined
    ).length;
    const escritaAnswered = escritaItems.filter(
      (_, i) => answers[`escrita-${i}`] !== null && answers[`escrita-${i}`] !== undefined
    ).length;
    const aritmeticaAnswered = aritmeticaItems.filter(
      (_, i) => answers[`aritmetica-${i}`] !== null && answers[`aritmetica-${i}`] !== undefined
    ).length;

    return (
      <div className="space-y-5">
        {/* Header bar */}
        <div
          className={`rounded-xl border p-4 ${info.bgColor} ${info.borderColor}`}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className={`text-sm font-bold ${info.color}`}>
                🎓 {childName || "Criança"} — {info.label} ({info.description})
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalAnswered}/24 itens respondidos
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-bold">
                {totalAnswered}/24
              </Badge>
              <Progress value={(totalAnswered / 24) * 100} className="w-20 h-2" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="leitura" className="gap-1.5 text-xs sm:text-sm">
              <span>📖</span>
              <span className="hidden sm:inline">Leitura</span>
              <Badge
                variant={leituraAnswered === 8 ? "default" : "secondary"}
                className="text-xs ml-1"
              >
                {leituraAnswered}/8
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="escrita" className="gap-1.5 text-xs sm:text-sm">
              <span>✏️</span>
              <span className="hidden sm:inline">Escrita</span>
              <Badge
                variant={escritaAnswered === 8 ? "default" : "secondary"}
                className="text-xs ml-1"
              >
                {escritaAnswered}/8
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="aritmetica" className="gap-1.5 text-xs sm:text-sm">
              <span>🔢</span>
              <span className="hidden sm:inline">Aritmética</span>
              <Badge
                variant={aritmeticaAnswered === 8 ? "default" : "secondary"}
                className="text-xs ml-1"
              >
                {aritmeticaAnswered}/8
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leitura" className="mt-4">
            <DomainTab
              domain="Leitura"
              items={leituraItems}
              answers={answers}
              onChange={handleAnswer}
              domainKey="leitura"
              emoji="📖"
            />
          </TabsContent>
          <TabsContent value="escrita" className="mt-4">
            <DomainTab
              domain="Escrita"
              items={escritaItems}
              answers={answers}
              onChange={handleAnswer}
              domainKey="escrita"
              emoji="✏️"
            />
          </TabsContent>
          <TabsContent value="aritmetica" className="mt-4">
            <DomainTab
              domain="Aritmética"
              items={aritmeticaItems}
              answers={answers}
              onChange={handleAnswer}
              domainKey="aritmetica"
              emoji="🔢"
            />
          </TabsContent>
        </Tabs>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setStep(1)}
            className="gap-2"
            data-testid="btn-back"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar
          </Button>
          <Button
            onClick={() => setStep(3)}
            className="flex-1 gap-2"
            disabled={totalAnswered < 24}
            data-testid="btn-see-results"
          >
            Ver Resultados <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        {totalAnswered < 24 && (
          <p className="text-xs text-center text-muted-foreground">
            Responda todos os {24 - totalAnswered} itens restantes para ver o resultado completo.
          </p>
        )}
      </div>
    );
  }

  function renderStep3() {
    if (!ageGroup) return null;
    const info = AGE_GROUPS[ageGroup];

    return (
      <div className="space-y-6">
        {/* Result header */}
        <div
          className={`rounded-2xl border-2 p-5 ${classification.bgColor} ${classification.borderColor} space-y-3`}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {classification.icon}
              <div>
                <p className={`text-lg font-bold ${classification.color}`}>
                  {classification.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {childName ? `${childName} — ` : ""}{info.label} ({info.description})
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-black ${classification.color}`}>
                {totalScore}
                <span className="text-lg font-medium text-muted-foreground">
                  /{maxScore}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">{percentage}% do máximo</p>
            </div>
          </div>
          <Progress value={percentage} className="h-3" />
          <p className="text-xs text-foreground/80 leading-relaxed">
            {classification.description}
          </p>
        </div>

        {/* Domain cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              emoji: "📖",
              name: "Leitura",
              score: leituraScore,
              items: leituraItems,
              key: "leitura",
              color: "text-blue-600 dark:text-blue-400",
              bg: "bg-blue-50 dark:bg-blue-950/20",
              border: "border-blue-200 dark:border-blue-800/40",
            },
            {
              emoji: "✏️",
              name: "Escrita",
              score: escritaScore,
              items: escritaItems,
              key: "escrita",
              color: "text-violet-600 dark:text-violet-400",
              bg: "bg-violet-50 dark:bg-violet-950/20",
              border: "border-violet-200 dark:border-violet-800/40",
            },
            {
              emoji: "🔢",
              name: "Aritmética",
              score: aritmeticaScore,
              items: aritmeticaItems,
              key: "aritmetica",
              color: "text-emerald-600 dark:text-emerald-400",
              bg: "bg-emerald-50 dark:bg-emerald-950/20",
              border: "border-emerald-200 dark:border-emerald-800/40",
            },
          ].map((d) => {
            const pct = Math.round((d.score / 16) * 100);
            const classif = getDomainClassification(d.score);
            return (
              <Card key={d.key} className={`border ${d.border} ${d.bg}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{d.emoji}</span>
                      <span className={`text-sm font-bold ${d.color}`}>{d.name}</span>
                    </div>
                    <Badge className={`text-xs font-bold ${d.color} bg-white/60 dark:bg-black/20 border border-current/20`}>
                      {d.score}/16
                    </Badge>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{pct}%</span>
                    <span className="font-medium">{classif}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Full item breakdown */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            Detalhamento Completo dos Itens
          </h3>

          {[
            { emoji: "📖", name: "Leitura", items: leituraItems, key: "leitura", score: leituraScore },
            { emoji: "✏️", name: "Escrita", items: escritaItems, key: "escrita", score: escritaScore },
            { emoji: "🔢", name: "Aritmética", items: aritmeticaItems, key: "aritmetica", score: aritmeticaScore },
          ].map((domain) => (
            <div key={domain.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{domain.emoji}</span>
                <h4 className="text-sm font-semibold text-foreground">{domain.name}</h4>
                <Badge variant="outline" className="text-xs">
                  {domain.score}/16 pts
                </Badge>
              </div>
              <div className="space-y-1.5">
                {domain.items.map((item, i) => {
                  const v = answers[`${domain.key}-${i}`] ?? 0;
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs ${
                        v === 2
                          ? "bg-emerald-50/60 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/30"
                          : v === 1
                          ? "bg-amber-50/60 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800/30"
                          : "bg-red-50/40 dark:bg-red-950/10 border-red-200 dark:border-red-800/30"
                      }`}
                    >
                      <span className="flex-shrink-0 text-sm">
                        {v === 2 ? "✅" : v === 1 ? "🔶" : "❌"}
                      </span>
                      <span className="flex-1 text-foreground">{item}</span>
                      <span
                        className={`flex-shrink-0 font-bold ${
                          v === 2
                            ? "text-emerald-700 dark:text-emerald-400"
                            : v === 1
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-red-700 dark:text-red-400"
                        }`}
                      >
                        {v} pt{v !== 1 ? "s" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Score legend */}
        <div className="rounded-xl bg-muted/30 border border-card-border p-4 space-y-2">
          <h4 className="text-xs font-semibold text-foreground">Classificação Geral</h4>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {[
              { range: "≥ 80%", label: "Adequado", color: "text-emerald-600" },
              { range: "60–79%", label: "Em desenvolvimento", color: "text-amber-600" },
              { range: "40–59%", label: "Abaixo do esperado — investigação", color: "text-orange-600" },
              { range: "< 40%", label: "Significativamente abaixo — encaminhar", color: "text-red-600" },
            ].map((r) => (
              <div key={r.range} className="flex items-center gap-1.5">
                <span className="text-muted-foreground">{r.range}:</span>
                <span className={`font-medium ${r.color}`}>{r.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Clinical report */}
        <ClinicalReport
          scaleName="Testes Acadêmicos (Leitura/Escrita/Aritmética)"
          scaleFullName={`Avaliação por Faixa Etária — ${info.label}`}
          totalScore={totalScore}
          maxScore={maxScore}
          classification={classification.label}
          description={classification.description}
          domainResults={domainResults}
          items={reportItems}
          patientAge={`${info.label} — ${info.description}${childAge ? ` (${childAge} anos)` : ""}`}
        />

        {/* Save to patient */}
        <SaveToPatient
          scaleName="Testes Acadêmicos"
          totalScore={totalScore}
          classification={classification.label}
          answers={answers}
          domainScores={{
            leitura: leituraScore,
            escrita: escritaScore,
            aritmetica: aritmeticaScore,
          }}
          patientAge={info.label}
        />

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="gap-2"
            data-testid="btn-print"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </Button>
          <Button
            variant="outline"
            onClick={() => setStep(2)}
            className="gap-2"
            data-testid="btn-edit-answers"
          >
            <ChevronLeft className="w-4 h-4" /> Editar Respostas
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2 text-muted-foreground"
            data-testid="btn-reset"
          >
            <RotateCcw className="w-4 h-4" /> Nova Avaliação
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Testes Acadêmicos</h1>
          <p className="text-xs text-muted-foreground">
            Leitura · Escrita · Aritmética — Faixa etária 5–14 anos
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[
          { n: 1, label: "Identificação" },
          { n: 2, label: "Avaliação" },
          { n: 3, label: "Resultado" },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            {i > 0 && <div className="w-6 h-px bg-border" />}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                step === s.n
                  ? "bg-primary text-primary-foreground"
                  : step > s.n
                  ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                  step === s.n
                    ? "bg-white/20"
                    : step > s.n
                    ? "bg-emerald-600 text-white"
                    : "bg-muted-foreground/20"
                }`}
              >
                {step > s.n ? "✓" : s.n}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
}
