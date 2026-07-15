import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";
import { RotateCcw, CheckCircle2, Brain } from "lucide-react";

type AgeGroup = "4-5" | "6-7" | "8-9" | "10-12";
type Score = number | null;
type Answers = Record<string, Score>;

interface AgeGroupInfo {
  label: string;
  description: string;
}

interface ExecutiveTask {
  id: string;
  name: string;
  instruction: string;
  type: "planejamento" | "inibicao" | "memoria_trabalho" | "flexibilidade";
  criteria: string[];
  rubric: Record<number, string>;
}

const AGE_GROUPS: Record<AgeGroup, AgeGroupInfo> = {
  "4-5": { label: "4–5 anos", description: "Pré-escola" },
  "6-7": { label: "6–7 anos", description: "1º–2º ano" },
  "8-9": { label: "8–9 anos", description: "3º–4º ano" },
  "10-12": { label: "10–12 anos", description: "5º–7º ano" },
};

const TASKS: Record<AgeGroup, ExecutiveTask[]> = {
  "4-5": [
    {
      id: "p1",
      name: "Construir com blocos (3 passos)",
      instruction:
        "Peça à criança para copiar uma torre de 3 blocos em sequência específica",
      type: "planejamento",
      criteria: ["Segue instruções", "Mantém foco até completar"],
      rubric: {
        0: "Não consegue ou para antes de terminar",
        1: "Constrói com ajuda verbal",
        2: "Constrói independentemente",
      },
    },
    {
      id: "i1",
      name: "Espera sua vez (jogo com turnos)",
      instruction:
        "Jogo simples: criança espera turno, você tira algo, ela tira, alternando",
      type: "inibicao",
      criteria: ["Aguarda turno", "Sem impulsividade"],
      rubric: {
        0: "Pega sempre, não espera",
        1: "Ocasionalmente espera com lembretes",
        2: "Espera e tira quando é sua vez",
      },
    },
    {
      id: "mt1",
      name: "Repete sequência (2 ações)",
      instruction:
        "Você faz 2 ações (ex: bate palma, toca nariz). Criança repete.",
      type: "memoria_trabalho",
      criteria: ["Memoriza sequência", "Executa na ordem"],
      rubric: {
        0: "Esquece ou inverte ordem",
        1: "Repete com hesitação",
        2: "Repete corretamente e rápido",
      },
    },
  ],
  "6-7": [
    {
      id: "p1",
      name: "Construir com blocos (5 passos)",
      instruction: "Copiar sequência de 5 movimentos com blocos coloridos",
      type: "planejamento",
      criteria: ["Planejamento visual", "Sequenciamento"],
      rubric: {
        0: "Não completa ou erro > 50%",
        1: "Completa com 1-2 erros",
        2: "Completa corretamente",
      },
    },
    {
      id: "i1",
      name: "Inibição de impulso (Go/NoGo)",
      instruction:
        "Levanta quando você diz 'GO', fica sentado quando diz 'NOGO'",
      type: "inibicao",
      criteria: ["Inibe movimento", "Rapidez correta"],
      rubric: {
        0: "Erra > 4 vezes",
        1: "Erra 2-3 vezes em 10 tentativas",
        2: "Erra 0-1 vez",
      },
    },
    {
      id: "f1",
      name: "Muda de regra (flexibilidade)",
      instruction:
        "Começa: aperte quando vermelho. Depois: aperte quando AZUL. Observar transição.",
      type: "flexibilidade",
      criteria: [
        "Compreende mudança de regra",
        "Executa nova regra rapidamente",
      ],
      rubric: {
        0: "Continua com regra antiga",
        1: "Muda após lembretes",
        2: "Muda imediatamente",
      },
    },
    {
      id: "mt1",
      name: "Memória de 3 dígitos",
      instruction: "Você diz 3 números (ex: 4, 7, 2). Criança repete.",
      type: "memoria_trabalho",
      criteria: ["Retenção", "Recall acurado"],
      rubric: {
        0: "Esquece ou confunde ordem",
        1: "Repete 2 de 3 corretos",
        2: "Repete 3 de 3 ou 5/5 em 2 rodadas",
      },
    },
  ],
  "8-9": [
    {
      id: "p1",
      name: "Problema com múltiplas etapas",
      instruction:
        "Se você tem 5 maçãs e ganha 3, e come 2, quantas ficam? Peça para explicar passos.",
      type: "planejamento",
      criteria: ["Identifica passos", "Ordem lógica"],
      rubric: {
        0: "Não consegue estruturar",
        1: "Identifica 2 passos corretamente",
        2: "Identifica todos os 3 passos",
      },
    },
    {
      id: "i1",
      name: "Teste Stroop infantil (cor vs palavra)",
      instruction:
        "Mostre palavras em cores diferentes. Criança diz a cor (não a palavra)",
      type: "inibicao",
      criteria: ["Inibe leitura automática", "Velocidade de resposta"],
      rubric: {
        0: "Lê a palavra, não consegue inibir",
        1: "Consegue mas lenta (> 30s para 10 palavras)",
        2: "Rápido e acurado (< 20s)",
      },
    },
    {
      id: "f1",
      name: "Categorização flexível",
      instruction:
        "Objetos: bola, copo, boneca, prato. Primeiro agrupa por tipo, depois por cor/tamanho",
      type: "flexibilidade",
      criteria: [
        "Muda critério de agrupamento",
        "Identifica múltiplas dimensões",
      ],
      rubric: {
        0: "Agrupamentos aleatórios",
        1: "1-2 agrupamentos coerentes",
        2: "3+ agrupamentos lógicos diferentes",
      },
    },
    {
      id: "mt1",
      name: "Memória de sequência de 5 dígitos",
      instruction: "Diga 5 números em sequência. Criança repete.",
      type: "memoria_trabalho",
      criteria: ["Retenção de informação", "Acurácia"],
      rubric: {
        0: "Repete 0-2 números",
        1: "Repete 3-4 números na ordem",
        2: "Repete 5/5 ou consegue 2 de 2 sequências",
      },
    },
  ],
  "10-12": [
    {
      id: "p1",
      name: "Planejamento de projeto (Torre de Hanói simplificada)",
      instruction:
        "3 discos em pinos. Mover tudo para outro pino (só um maior embaixo). Conta passos mínimos.",
      type: "planejamento",
      criteria: ["Antecipa movimentos", "Otimização"],
      rubric: {
        0: "Aleatório, > 10 movimentos",
        1: "Estruturado, 7-9 movimentos",
        2: "Eficiente, 5-7 movimentos (ótimo)",
      },
    },
    {
      id: "i1",
      name: "Controle de impulso sob pressão (contagem regressiva)",
      instruction:
        "Conte de 20 para 1. Você diz 'stop' aleatoriamente. Criança deve parar imediatamente.",
      type: "inibicao",
      criteria: ["Reação rápida", "Controle volitivo"],
      rubric: {
        0: "Continua por > 3 números",
        1: "Para em 1-3 números",
        2: "Para imediatamente ou 1 número máximo",
      },
    },
    {
      id: "f1",
      name: "Alternância entre tarefas (task switching)",
      instruction:
        "Alternamente: diga um número par, depois uma vogal, depois par, vogal... de uma série mista",
      type: "flexibilidade",
      criteria: ["Alterna entre critérios", "Sem perseveração"],
      rubric: {
        0: "Fica preso em um tipo (perseveração)",
        1: "Alterna com hesitação/erros (< 80% acerto)",
        2: "Alterna suavemente (> 90% acerto)",
      },
    },
    {
      id: "mt1",
      name: "Working memory de 6 dígitos + operação",
      instruction:
        "Diga 6 números. Criança repete, depois repete em ordem inversa.",
      type: "memoria_trabalho",
      criteria: ["Retenção", "Manipulação mental"],
      rubric: {
        0: "Consegue menos de 4 números",
        1: "Consegue 4-5 números em uma ordem",
        2: "Consegue 6 em ordem correta e/ou inversa",
      },
    },
  ],
};

export default function FuncoesExecutivas() {
  const [selectedAge, setSelectedAge] = useState<AgeGroup>("6-7");
  const [answers, setAnswers] = useState<Answers>({});
  const [showReport, setShowReport] = useState(false);

  const tasks = TASKS[selectedAge];
  const answered = Object.values(answers).filter((a) => a !== null).length;
  const progress = (answered / tasks.length) * 100;

  const handleScore = (taskId: string, score: Score) => {
    setAnswers((prev) => ({ ...prev, [taskId]: score }));
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
        question: `${task.name} — ${task.instruction}`,
        answer:
          answer === undefined || answer === null
            ? "Não respondida"
            : task.rubric[answer],
      };
    });

    return (
      <div className="space-y-4">
        <ClinicalReport
          scaleName="Funções Executivas"
          scaleFullName="Planejamento, inibição, memória de trabalho e flexibilidade"
          items={reportItems}
          patientAge={AGE_GROUPS[selectedAge].label}
        />
        <SaveToPatient
          testName="Funções Executivas"
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
            <Brain className="h-6 w-6" />
            Funções Executivas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Avaliação lúdica de planejamento, inibição de impulso, memória de
            trabalho e flexibilidade cognitiva.
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
            <div key={task.id} className="border-l-4 border-blue-300 pl-4 py-2">
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-semibold text-sm">
                    {idx + 1}. {task.name}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {task.type === "planejamento"
                      ? "📋 Planejamento"
                      : task.type === "inibicao"
                        ? "🛑 Inibição"
                        : task.type === "memoria_trabalho"
                          ? "💾 Mem. Trabalho"
                          : "🔄 Flexibilidade"}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">{task.instruction}</p>
              </div>

              <div className="bg-gray-50 p-3 rounded border-l-2 border-gray-300">
                <p className="text-xs font-semibold mb-3">Observação (0–2):</p>
                <div className="space-y-2">
                  {[0, 1, 2].map((score) => (
                    <div key={score} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id={`${task.id}-${score}`}
                        name={task.id}
                        value={score}
                        checked={answers[task.id] === score}
                        onChange={() => handleScore(task.id, score as Score)}
                        className="cursor-pointer"
                      />
                      <label
                        htmlFor={`${task.id}-${score}`}
                        className="text-xs cursor-pointer flex-1"
                      >
                        {score === 0 ? "❌ " : score === 1 ? "⚠️ " : "✅ "}
                        {task.rubric[score]}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
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
