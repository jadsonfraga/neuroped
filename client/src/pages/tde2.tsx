import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  PenLine,
  Calculator,
  RotateCcw,
  ChevronRight,
  CheckCircle2,
  GraduationCap,
  User,
  Info,
} from "lucide-react";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AgeGroup {
  id: string;
  label: string;
  sublabel: string;
  range: string;
}

interface Item {
  text: string;
}

interface Domain {
  name: "Leitura" | "Escrita" | "Matemática";
  icon: typeof BookOpen;
  color: string;
  items: Item[];
}

interface AgeGroupData {
  id: string;
  domains: Domain[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const RATING_LABELS: Record<number, string> = {
  0: "Não consegue",
  1: "Com dificuldade",
  2: "Consegue",
};

const AGE_GROUPS: AgeGroup[] = [
  { id: "4-5", label: "4–5 anos", sublabel: "Pré-escola", range: "4-5 anos" },
  { id: "6-7", label: "6–7 anos", sublabel: "1º–2º ano", range: "6-7 anos" },
  { id: "8-9", label: "8–9 anos", sublabel: "3º–4º ano", range: "8-9 anos" },
  {
    id: "10-11",
    label: "10–11 anos",
    sublabel: "5º–6º ano",
    range: "10-11 anos",
  },
  {
    id: "12-14",
    label: "12–14 anos",
    sublabel: "7º–9º ano",
    range: "12-14 anos",
  },
];

const AGE_DATA: AgeGroupData[] = [
  {
    id: "4-5",
    domains: [
      {
        name: "Leitura",
        icon: BookOpen,
        color: "blue",
        items: [
          { text: "Reconhece o próprio nome escrito entre outros nomes" },
          { text: "Identifica pelo menos 10 letras do alfabeto" },
          {
            text: "Reconhece letras iniciais de palavras familiares (M de mamãe)",
          },
          { text: "Diferencia letras de números e desenhos" },
          {
            text: '"Lê" imagens e interpreta uma história a partir de figuras',
          },
        ],
      },
      {
        name: "Escrita",
        icon: PenLine,
        color: "violet",
        items: [
          { text: "Escreve o próprio primeiro nome (mesmo com erros)" },
          { text: "Reproduz letras do alfabeto quando solicitado" },
          {
            text: "Faz traçados e formas geométricas básicas (círculo, cruz, quadrado)",
          },
          { text: "Segura o lápis com preensão adequada (tripode)" },
          { text: "Copia palavras simples de um modelo visual" },
        ],
      },
      {
        name: "Matemática",
        icon: Calculator,
        color: "emerald",
        items: [
          { text: "Conta oralmente até 10 em sequência correta" },
          { text: "Reconhece os numerais de 1 a 10" },
          { text: "Faz correspondência número-quantidade até 5" },
          { text: "Compara quantidades (mais/menos, maior/menor)" },
          { text: "Classifica objetos por cor, forma ou tamanho" },
        ],
      },
    ],
  },
  {
    id: "6-7",
    domains: [
      {
        name: "Leitura",
        icon: BookOpen,
        color: "blue",
        items: [
          { text: "Lê sílabas simples (ma, pa, bo, lu)" },
          { text: "Lê palavras regulares dissílabas (bola, gato, mesa)" },
          { text: "Lê frases curtas com compreensão (O gato bebe leite)" },
          {
            text: "Reconhece todas as letras do alfabeto maiúsculas e minúsculas",
          },
          {
            text: "Lê palavras com encontros consonantais simples (prato, branco)",
          },
        ],
      },
      {
        name: "Escrita",
        icon: PenLine,
        color: "violet",
        items: [
          { text: "Escreve o nome completo corretamente" },
          { text: "Escreve palavras regulares por ditado (bola, pato, vela)" },
          { text: "Diferencia letra maiúscula e minúscula na escrita" },
          {
            text: "Escreve frases simples ditadas com espaçamento entre palavras",
          },
          { text: "Copia um texto curto do quadro sem erros significativos" },
        ],
      },
      {
        name: "Matemática",
        icon: Calculator,
        color: "emerald",
        items: [
          { text: "Conta até 50 sem erros" },
          { text: "Realiza adição simples com resultado até 10 (3+4=)" },
          { text: "Realiza subtração simples (8-3=)" },
          {
            text: "Reconhece formas geométricas (triângulo, retângulo, círculo)",
          },
          {
            text: "Resolve problemas simples orais (Maria tem 3 balas, ganhou mais 2…)",
          },
        ],
      },
    ],
  },
  {
    id: "8-9",
    domains: [
      {
        name: "Leitura",
        icon: BookOpen,
        color: "blue",
        items: [
          { text: "Lê textos de 3-5 linhas com fluência adequada" },
          { text: "Compreende e responde perguntas sobre texto lido" },
          { text: "Lê palavras irregulares comuns (hoje, homem, aquele)" },
          { text: "Identifica personagens, cenário e enredo de uma história" },
          { text: "Lê em voz alta com entonação e pontuação adequadas" },
        ],
      },
      {
        name: "Escrita",
        icon: PenLine,
        color: "violet",
        items: [
          { text: "Produz texto narrativo de 3-5 frases com coerência" },
          {
            text: "Utiliza pontuação básica (ponto final, vírgula, interrogação)",
          },
          {
            text: "Escreve palavras com dígrafos corretamente (chuva, ninho, galho)",
          },
          { text: "Separa sílabas corretamente em palavras conhecidas" },
          { text: "Ortografia adequada em palavras regulares por ditado" },
        ],
      },
      {
        name: "Matemática",
        icon: Calculator,
        color: "emerald",
        items: [
          { text: "Realiza multiplicação simples (tabuadas do 2, 3, 4, 5)" },
          { text: "Realiza divisão simples (10÷2, 15÷3)" },
          { text: "Resolve problemas com duas operações" },
          { text: "Reconhece e opera com números até 1000" },
          { text: "Compreende medidas simples (metro, quilo, litro, hora)" },
        ],
      },
    ],
  },
  {
    id: "10-11",
    domains: [
      {
        name: "Leitura",
        icon: BookOpen,
        color: "blue",
        items: [
          { text: "Lê textos informativos de 10+ linhas com compreensão" },
          { text: "Identifica a ideia central e detalhes relevantes" },
          { text: "Faz inferências a partir do texto lido" },
          { text: "Diferencia fato de opinião em textos simples" },
          { text: "Localiza informações explícitas em tabelas e gráficos" },
        ],
      },
      {
        name: "Escrita",
        icon: PenLine,
        color: "violet",
        items: [
          {
            text: "Produz texto dissertativo de um parágrafo com argumentação",
          },
          { text: "Utiliza concordância verbal e nominal adequada" },
          { text: "Emprega acentuação corretamente em palavras frequentes" },
          { text: "Organiza ideias em parágrafos com introdução e conclusão" },
          { text: "Revisão: identifica e corrige erros no próprio texto" },
        ],
      },
      {
        name: "Matemática",
        icon: Calculator,
        color: "emerald",
        items: [
          { text: "Opera com frações simples (1/2, 1/4, 3/4)" },
          { text: "Resolve problemas com múltiplas etapas" },
          { text: "Calcula porcentagem simples (50%, 25%, 10%)" },
          { text: "Compreende e usa decimais (0,5 = metade)" },
          { text: "Interpreta gráficos e tabelas simples" },
        ],
      },
    ],
  },
  {
    id: "12-14",
    domains: [
      {
        name: "Leitura",
        icon: BookOpen,
        color: "blue",
        items: [
          { text: "Lê e interpreta textos argumentativos e jornalísticos" },
          {
            text: "Identifica recursos de linguagem (metáfora, ironia, ambiguidade)",
          },
          { text: "Compara informações de múltiplas fontes" },
          { text: "Compreende textos com vocabulário técnico ou abstrato" },
          { text: "Resume textos longos mantendo as ideias essenciais" },
        ],
      },
      {
        name: "Escrita",
        icon: PenLine,
        color: "violet",
        items: [
          {
            text: "Produz texto dissertativo-argumentativo com tese e argumentos",
          },
          {
            text: "Utiliza coesão e coerência textual (conectivos, referências)",
          },
          { text: "Domina regras de acentuação e crase" },
          { text: "Escreve com registro formal quando necessário" },
          { text: "Revisão crítica do próprio texto com autocorreção" },
        ],
      },
      {
        name: "Matemática",
        icon: Calculator,
        color: "emerald",
        items: [
          { text: "Resolve equações de 1º grau (2x + 3 = 11)" },
          { text: "Opera com números negativos" },
          { text: "Calcula área e perímetro de figuras" },
          { text: "Interpreta gráficos de barras, setores e linhas" },
          { text: "Resolve problemas envolvendo proporcionalidade" },
        ],
      },
    ],
  },
];

const DOMAIN_SECTION_COLOR = {
  Leitura: {
    header: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50/60 dark:bg-blue-950/10",
    border: "border-blue-100 dark:border-blue-900/30",
    badge:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200 dark:border-blue-800/40",
  },
  Escrita: {
    header: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50/60 dark:bg-violet-950/10",
    border: "border-violet-100 dark:border-violet-900/30",
    badge:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300 border-violet-200 dark:border-violet-800/40",
  },
  Matemática: {
    header: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50/60 dark:bg-emerald-950/10",
    border: "border-emerald-100 dark:border-emerald-900/30",
    badge:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40",
  },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Tde2Page() {
  const [step, setStep] = useState<"select" | "assess" | "result">("select");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  // answers keyed as "domainIndex-itemIndex" → 0|1|2
  const [answers, setAnswers] = useState<Record<string, number>>({});

  // ── derived ──
  const ageGroupData = AGE_DATA.find((d) => d.id === selectedAgeGroup);
  const ageGroupMeta = AGE_GROUPS.find((g) => g.id === selectedAgeGroup);

  const totalItems = ageGroupData
    ? ageGroupData.domains.flatMap((d) => d.items).length
    : 0;
  const answeredCount = Object.keys(answers).length;
  const progress = totalItems > 0 ? (answeredCount / totalItems) * 100 : 0;
  const allAnswered = answeredCount === totalItems && totalItems > 0;

  // ── handlers ──
  function handleSelectAgeGroup(id: string) {
    setSelectedAgeGroup(id);
    setAnswers({});
  }

  function handleStartAssess() {
    if (!selectedAgeGroup) return;
    setStep("assess");
  }

  function handleSubmit() {
    setStep("result");
  }

  function handleReset() {
    setStep("select");
    setSelectedAgeGroup(null);
    setAnswers({});
    setChildName("");
    setChildAge("");
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP: SELECT AGE GROUP
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === "select") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-sm">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              TDE-2 Adaptado
            </h1>
            <p className="text-xs text-muted-foreground">
              Triagem de Desempenho Escolar — Versão Dr. Jadson
            </p>
          </div>
        </div>

        {/* Info box */}
        <div className="rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-purple-800 dark:text-purple-300 space-y-1 leading-relaxed">
              <p>
                <strong>Instrumento autoral de triagem pedagógica.</strong>{" "}
                Avalia leitura, escrita e matemática por faixa etária (4–14
                anos), com 15 itens por grupo.
              </p>
              <p>
                Cada item é classificado em:{" "}
                <strong>
                  0 = Não consegue · 1 = Com dificuldade · 2 = Consegue
                </strong>
              </p>
            </div>
          </div>
        </div>

        {/* Child info */}
        <Card className="border-card-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">
                Dados da Criança
              </p>
              <Badge variant="secondary" className="text-xs">
                Opcional
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <Input
                  placeholder="Nome da criança"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="text-sm"
                  data-testid="input-child-name"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Idade</Label>
                <Input
                  placeholder="Ex: 7 anos"
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  className="text-sm"
                  data-testid="input-child-age"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Age group selection */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">
            Selecione a faixa etária:
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AGE_GROUPS.map((group) => (
              <button
                key={group.id}
                onClick={() => handleSelectAgeGroup(group.id)}
                data-testid={`age-group-${group.id}`}
                className={`text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                  selectedAgeGroup === group.id
                    ? "border-primary bg-primary/10 dark:bg-primary/20"
                    : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-base font-bold ${
                        selectedAgeGroup === group.id
                          ? "text-primary"
                          : "text-foreground"
                      }`}
                    >
                      {group.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {group.sublabel}
                    </p>
                  </div>
                  {selectedAgeGroup === group.id && (
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {(["Leitura", "Escrita", "Matemática"] as const).map((d) => (
                    <span
                      key={d}
                      className={`text-xs px-2 py-0.5 rounded-full border ${DOMAIN_SECTION_COLOR[d].badge}`}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleStartAssess}
          disabled={!selectedAgeGroup}
          className="w-full gap-2"
          size="lg"
          data-testid="button-start"
        >
          Iniciar Avaliação
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center leading-relaxed px-2">
          TDE-2 Adaptado — Versão Autoral Dr. Jadson Fraga (2026). Instrumento
          de triagem pedagógica. Não substitui avaliação psicopedagógica ou
          neuropsicológica formal.
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP: ASSESS
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === "assess" && ageGroupData && ageGroupMeta) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-sm">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-foreground">
                TDE-2 Adaptado
              </h1>
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 text-xs">
                {ageGroupMeta.label} · {ageGroupMeta.sublabel}
              </Badge>
            </div>
            {childName && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Avaliando: <strong>{childName}</strong>
                {childAge ? ` · ${childAge}` : ""}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {answeredCount} de {totalItems} itens respondidos
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Instruction */}
        <div className="rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-purple-800 dark:text-purple-300 leading-relaxed">
              <strong>Instruções:</strong> Avalie cada habilidade com base em
              tarefas observadas ou relatadas. Selecione:{" "}
              <strong>
                0 = Não consegue · 1 = Com dificuldade · 2 = Consegue
              </strong>
            </p>
          </div>
        </div>

        {/* Domains */}
        {ageGroupData.domains.map((domain, domainIndex) => {
          const sectionColor = DOMAIN_SECTION_COLOR[domain.name];
          const DomainIcon = domain.icon;
          const domainAnswered = domain.items.filter(
            (_, ii) => answers[`${domainIndex}-${ii}`] !== undefined,
          ).length;

          return (
            <div key={domain.name} className="space-y-3">
              {/* Domain header */}
              <div
                className={`rounded-xl border p-3 ${sectionColor.bg} ${sectionColor.border}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DomainIcon className={`w-4 h-4 ${sectionColor.header}`} />
                    <h2 className={`text-sm font-bold ${sectionColor.header}`}>
                      {domain.name}
                    </h2>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {domainAnswered}/{domain.items.length} itens
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                {domain.items.map((item, itemIndex) => {
                  const key = `${domainIndex}-${itemIndex}`;
                  const globalNumber = domainIndex * 5 + itemIndex + 1;
                  const currentAnswer = answers[key];

                  return (
                    <Card
                      key={key}
                      data-testid={`card-item-${key}`}
                      className={`border-card-border transition-all duration-150 ${
                        currentAnswer !== undefined ? "border-primary/30" : ""
                      }`}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs font-mono flex-shrink-0 mt-0.5 ${
                              currentAnswer !== undefined
                                ? sectionColor.badge
                                : ""
                            }`}
                          >
                            {globalNumber}
                          </Badge>
                          <p className="text-sm text-foreground leading-relaxed">
                            {item.text}
                          </p>
                        </div>

                        <RadioGroup
                          value={currentAnswer?.toString()}
                          onValueChange={(val) =>
                            setAnswers((prev) => ({
                              ...prev,
                              [key]: parseInt(val),
                            }))
                          }
                          className="flex flex-wrap gap-2"
                        >
                          {([0, 1, 2] as const).map((val) => (
                            <div key={val} className="flex items-center">
                              <RadioGroupItem
                                value={val.toString()}
                                id={`${key}-v${val}`}
                                className="sr-only"
                              />
                              <Label
                                htmlFor={`${key}-v${val}`}
                                className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors select-none ${
                                  currentAnswer === val
                                    ? val === 0
                                      ? "bg-red-500 text-white border-red-500"
                                      : val === 1
                                        ? "bg-amber-500 text-white border-amber-500"
                                        : "bg-emerald-700 text-white border-emerald-700"
                                    : "bg-card text-foreground border-border hover:bg-muted"
                                }`}
                              >
                                {val} — {RATING_LABELS[val]}
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
        })}

        {/* Submit / back */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setStep("select")}
            className="gap-2"
            data-testid="button-back"
          >
            <RotateCcw className="w-4 h-4" />
            Voltar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="flex-1 gap-2"
            size="lg"
            data-testid="button-submit"
          >
            {allAnswered
              ? "Ver Resultado"
              : `Responda todos os ${totalItems} itens (${totalItems - answeredCount} pendentes)`}
            {allAnswered && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center leading-relaxed px-2">
          TDE-2 Adaptado — Versão Autoral Dr. Jadson Fraga (2026). Instrumento
          de triagem pedagógica. Não substitui avaliação psicopedagógica ou
          neuropsicológica formal.
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP: RESULT
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === "result" && ageGroupData && ageGroupMeta) {
    const reportItems = ageGroupData.domains.flatMap((domain, di) =>
      domain.items.map((item, ii) => {
        const answer = answers[`${di}-${ii}`];
        return {
          question: `[${domain.name}] ${item.text}`,
          answer:
            answer === undefined ? "Não respondida" : RATING_LABELS[answer],
        };
      }),
    );

    const patientLabel = `${ageGroupMeta.label} (${ageGroupMeta.sublabel})${childName ? ` · ${childName}` : ""}${childAge ? ` · ${childAge}` : ""}`;

    return (
      <div className="space-y-6">
        <ClinicalReport
          scaleName="TDE-2 Adaptado"
          scaleFullName="Teste de Desempenho Escolar — Versão Dr. Jadson Fraga (2026)"
          items={reportItems}
          patientAge={patientLabel}
        />

        <SaveToPatient
          scaleName="TDE-2 Adaptado"
          responses={reportItems}
          patientAge={ageGroupMeta.range}
        />

        <Button
          onClick={handleReset}
          variant="outline"
          className="w-full gap-2"
          data-testid="button-reset"
        >
          <RotateCcw className="w-4 h-4" />
          Nova Avaliação
        </Button>

        <div className="rounded-xl bg-muted/50 border border-border p-4">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            <strong>
              TDE-2 Adaptado — Versão Autoral Dr. Jadson Fraga Araújo Júnior
              (2026).
            </strong>
            <br />
            Instrumento de triagem pedagógica. Não substitui avaliação
            psicopedagógica ou neuropsicológica formal.
            <br />A análise das respostas é realizada pelo profissional
            responsável.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
