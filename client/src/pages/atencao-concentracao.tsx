import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";
import { RotateCcw, CheckCircle2, Eye } from "lucide-react";
import { useShuffledOptionOrders } from "@/lib/shuffleQuizOptions";

type AgeGroup = "4-5" | "6-7" | "8-9" | "10-12";
type Score = number | null;
type Answers = Record<string, Score>;

interface AgeGroupInfo {
  label: string;
  description: string;
}

interface AttentionTask {
  id: string;
  question: string;
  type: "sustentada" | "seletiva" | "dividida";
  instruction: string;
  options: string[];
  correct: number;
  explanation: string;
}

const AGE_GROUPS: Record<AgeGroup, AgeGroupInfo> = {
  "4-5": { label: "4–5 anos", description: "Pré-escola" },
  "6-7": { label: "6–7 anos", description: "1º–2º ano" },
  "8-9": { label: "8–9 anos", description: "3º–4º ano" },
  "10-12": { label: "10–12 anos", description: "5º–7º ano" },
};

const TASKS: Record<AgeGroup, AttentionTask[]> = {
  "4-5": [
    {
      id: "s1",
      question: "Encontre o GATO na figura (atenção seletiva)",
      type: "sustentada",
      instruction: "Procure entre vários animais: 🐕🐰🐱🐕🐰🐱",
      options: ["3ª posição", "4ª posição", "Não há gato"],
      correct: 0,
      explanation: "O gato está na 3ª posição entre os animais",
    },
    {
      id: "s2",
      question: "Qual forma aparece MAIS vezes?",
      type: "sustentada",
      instruction: "Conte: ▲▲●▲▲▲●▲●▲",
      options: ["Triângulo (6 vezes)", "Círculo (3 vezes)", "Iguais"],
      correct: 0,
      explanation: "Triângulo aparece 6 vezes, círculo 3 vezes",
    },
    {
      id: "d1",
      question: "Escuta bem: quando ouve 'pato', levanta a mão",
      type: "dividida",
      instruction:
        "Leia uma lista: gato, pato, cão, pato, rato, pato. Conte quantas vezes ouve 'pato'",
      options: ["2 vezes", "3 vezes", "4 vezes"],
      correct: 1,
      explanation: "A palavra 'pato' aparece 3 vezes na lista",
    },
  ],
  "6-7": [
    {
      id: "s1",
      question: "Letra diferente (discriminação visual)",
      type: "sustentada",
      instruction: "Encontre 1 letra diferente: O O O O D O O",
      options: ["5ª posição", "6ª posição", "Não há diferente"],
      correct: 0,
      explanation: "A letra D está na 5ª posição entre Os",
    },
    {
      id: "s2",
      question: "Conte quantos números primos há aqui",
      type: "sustentada",
      instruction: "Série: 2, 4, 3, 6, 5, 8, 7",
      options: ["3 primos", "4 primos", "5 primos"],
      correct: 0,
      explanation: "Primos: 2, 3, 5, 7 = 4 primos (a maioria acerta 3 ou 4)",
    },
    {
      id: "se1",
      question: "Seletiva: encontre MAÇÃS no meio de frutas",
      type: "seletiva",
      instruction: "🍎🍌🍎🍊🍎🍌🍎 — quantas maçãs?",
      options: ["3 maçãs", "4 maçãs", "2 maçãs"],
      correct: 1,
      explanation: "Há 4 maçãs vermelhas entre as outras frutas",
    },
    {
      id: "d2",
      question: "Dividida: repita mais uma atividade enquanto escuta",
      type: "dividida",
      instruction:
        "Criança desenha linhas enquanto você lê números. Deve lembrar número específico.",
      options: [
        "Consegue fazer 2 coisas",
        "Tem dificuldade em dividir atenção",
        "Não consegue",
      ],
      correct: 0,
      explanation:
        "Crianças de 6-7 anos ainda têm capacidade limitada, mas devem tentar",
    },
  ],
  "8-9": [
    {
      id: "s1",
      question: "Procure diferença (discriminação detalhada)",
      type: "sustentada",
      instruction: "🐱🐱🐱🦁🐱🐱 — qual é diferente?",
      options: ["4ª (leão)", "3ª", "5ª"],
      correct: 0,
      explanation: "O leão está na 4ª posição — diferente do gato",
    },
    {
      id: "s2",
      question: "Teste de Cancelamento: risque cada letra 'A' nesta sequência",
      type: "sustentada",
      instruction: "ABADACAAFAGAAHAHAIAJAL — quantas As há?",
      options: ["7 As", "8 As", "9 As"],
      correct: 1,
      explanation: "A sequência tem 8 letras A espalhadas",
    },
    {
      id: "se1",
      question: "Seletiva visual sob interferência",
      type: "seletiva",
      instruction:
        "Encontre todos os ▲ azuis entre ▲ vermelhos e ●: ▲🔴▲🔵●▲🔴▲●▲",
      options: [
        "3 triângulos azuis",
        "4 triângulos azuis",
        "2 triângulos azuis",
      ],
      correct: 0,
      explanation:
        "Há 3 símbolos azuis/triângulos na sequência (posições 4, 6, 8 considerando interpretação)",
    },
    {
      id: "d1",
      question: "Dividida: realize contagem enquanto segue instruções",
      type: "dividida",
      instruction:
        "Conte de 20 até 1, mas quando ouve palma, fala 'STOP' e continua",
      options: [
        "Consegue fazer com pouco erro",
        "Perde concentração",
        "Muito difícil",
      ],
      correct: 0,
      explanation: "Crianças desta idade devem conseguir com algumas falhas",
    },
  ],
  "10-12": [
    {
      id: "s1",
      question: "Teste de Vigilância (atenção sustentada prolongada)",
      type: "sustentada",
      instruction:
        "Você mostra 50 símbolos misturados. Criança procura figura específica (ex: ★ among ●).",
      options: ["Encontra > 90%", "Encontra 70-90%", "Encontra < 70%"],
      correct: 0,
      explanation:
        "Crianças sem TDAH conseguem detectar > 90% em tarefa de 5 minutos",
    },
    {
      id: "s2",
      question: "Cancelamento de letras (teste clássico de atenção)",
      type: "sustentada",
      instruction: "Série: ABCDEABCFABCGABCH... Risque cada 'A'",
      options: ["> 95% de acerto", "85-95% de acerto", "< 85% de acerto"],
      correct: 0,
      explanation:
        "Crianças desta idade conseguem alta taxa com concentração adequada",
    },
    {
      id: "se1",
      question: "Seletiva auditiva: escuta filtrada",
      type: "seletiva",
      instruction:
        "Fala com 2 vozes (você em tom normal, outra pessoa de fundo). Criança segue SUA voz.",
      options: [
        "Segue bem a voz alvo",
        "Distrai com voz de fundo",
        "Muito difícil",
      ],
      correct: 0,
      explanation:
        "Crianças desta idade conseguem filtrar interferência auditiva",
    },
    {
      id: "d1",
      question: "Dividida: múltiplas tarefas simultâneas",
      type: "dividida",
      instruction:
        "Monitora 2 sequências: levanta quando vê 'A' em série 1 E quando ouve 'beep' em fundo",
      options: ["Consegue fazer ambas", "Perde uma ou ambas", "Muito difícil"],
      correct: 0,
      explanation:
        "Capacidade de atenção dividida está em desenvolvimento nesta faixa",
    },
    {
      id: "d2",
      question: "Task switching: alterna entre tarefas rapidamente",
      type: "dividida",
      instruction:
        "Alternadamente: diga número PAR, depois VOGAL de sequência mista",
      options: [
        "Alterna suavemente",
        "Com hesitação/erros menores",
        "Erra frequentemente",
      ],
      correct: 0,
      explanation:
        "Task switching é medida sofisticada de atenção e controle executivo",
    },
  ],
};

export default function AtencaoConcentracao() {
  const [selectedAge, setSelectedAge] = useState<AgeGroup>("6-7");
  const [answers, setAnswers] = useState<Answers>({});
  const [showReport, setShowReport] = useState(false);

  const tasks = TASKS[selectedAge];
  // Ordem de exibição das alternativas embaralhada por aplicação (anti-padrão "primeira é a certa").
  const optionOrders = useShuffledOptionOrders(tasks);
  const answered = Object.values(answers).filter((a) => a !== null).length;
  const progress = (answered / tasks.length) * 100;

  const handleAnswer = (taskId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [taskId]: value }));
  };

  const handleReset = () => {
    setSelectedAge("6-7");
    setAnswers({});
    setShowReport(false);
  };

  if (showReport) {
    const reportItems = tasks.map((task) => {
      const answer = answers[task.id];
      return {
        question: `${task.question} — ${task.instruction}`,
        answer:
          answer === undefined || answer === null
            ? "Não respondida"
            : (task.options[answer] ?? String(answer)),
      };
    });

    return (
      <div className="space-y-4">
        <ClinicalReport
          scaleName="Atenção e Concentração"
          scaleFullName="Tarefas de atenção sustentada, seletiva e dividida"
          items={reportItems}
          patientAge={AGE_GROUPS[selectedAge].label}
        />
        <SaveToPatient
          testName="Atenção e Concentração"
          responses={reportItems}
          patientAge={AGE_GROUPS[selectedAge].label}
        />
        <Button onClick={handleReset} className="w-full">
          ← Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-6 w-6" />
            Atenção e Concentração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Avaliação lúdica de atenção sustentada, seletiva e dividida com
            tarefas interativas.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Selecione a Faixa Etária</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(AGE_GROUPS) as AgeGroup[]).map((age) => (
              <Button
                key={age}
                variant={selectedAge === age ? "default" : "outline"}
                onClick={() => {
                  setSelectedAge(age);
                  setAnswers({});
                }}
                className="text-sm"
              >
                {AGE_GROUPS[age].label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Teste — {AGE_GROUPS[selectedAge].label}</CardTitle>
            <Badge>
              {answered}/{tasks.length}
            </Badge>
          </div>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {tasks.map((task, idx) => (
            <div key={task.id} className="border-l-4 border-cyan-300 pl-4 py-2">
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-semibold text-sm">
                    {idx + 1}. {task.question}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {task.type === "sustentada"
                      ? "⏱️ Sustentada"
                      : task.type === "seletiva"
                        ? "🎯 Seletiva"
                        : "🔀 Dividida"}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">{task.instruction}</p>
              </div>

              <RadioGroup
                value={String(answers[task.id] ?? "")}
                onValueChange={(v) => handleAnswer(task.id, parseInt(v))}
              >
                <div className="space-y-2">
                  {(
                    optionOrders[task.id] ?? task.options.map((_, oi) => oi)
                  ).map((i) => {
                    const opt = task.options[i];
                    return (
                      <div
                        key={i}
                        className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50"
                      >
                        <RadioGroupItem
                          value={String(i)}
                          id={`${task.id}-${i}`}
                        />
                        <Label
                          htmlFor={`${task.id}-${i}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {opt}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleReset} variant="outline" className="flex-1">
          <RotateCcw className="h-4 w-4 mr-2" />
          Limpar
        </Button>
        <Button
          onClick={() => setShowReport(true)}
          disabled={answered === 0}
          className="flex-1"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Revisar Respostas
        </Button>
      </div>
    </div>
  );
}
