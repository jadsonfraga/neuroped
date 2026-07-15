import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";
import { RotateCcw, CheckCircle2, Ear } from "lucide-react";
import { useShuffledOptionOrders } from "@/lib/shuffleQuizOptions";

type AgeGroup = "4-5" | "6-7" | "8-9" | "10-12";
type Difficulty = "facil" | "medio" | "dificil";
type Score = number | null;
type Answers = Record<string, Score>;

interface AgeGroupInfo {
  label: string;
  description: string;
}

interface ProcessingTask {
  id: string;
  type: "auditivo" | "visual" | "integrado";
  question: string;
  instruction: string;
  options: string[];
  correct: number;
  explanation: string;
}

const AGE_GROUPS: Record<AgeGroup, AgeGroupInfo> = {
  "4-5": { label: "4–5 anos", description: "Processamento básico" },
  "6-7": { label: "6–7 anos", description: "Integração em desenvolvimento" },
  "8-9": { label: "8–9 anos", description: "Integração consolidada" },
  "10-12": { label: "10–12 anos", description: "Processamento sofisticado" },
};

const PROCESSING_TASKS: Record<
  AgeGroup,
  Record<Difficulty, ProcessingTask[]>
> = {
  "4-5": {
    facil: [
      {
        id: "p1f",
        type: "auditivo",
        question: "Escuta sons: qual som ouve?",
        instruction: "Som de cachorro (AU AU) vs gato (MIAU). Qual é?",
        options: ["Cachorro", "Gato", "Pássaro"],
        correct: 0,
        explanation:
          "Discriminação auditiva simples — reconhecimento de som familiar",
      },
      {
        id: "p2f",
        type: "visual",
        question: "Vê duas cores: qual é igual?",
        instruction: "Mostro VERMELHO. Depois mostro 3 cores. Qual é igual?",
        options: ["Vermelho", "Rosa", "Laranja"],
        correct: 0,
        explanation:
          "Discriminação visual de cores — processamento visual básico",
      },
    ],
    medio: [
      {
        id: "p1m",
        type: "integrado",
        question: "Escuta som enquanto vê figura",
        instruction:
          "Som de gato + figura de gato. Som de cão + figura de cão. Combinam?",
        options: ["Sim, combinam", "Não", "Às vezes"],
        correct: 0,
        explanation: "Integração audiovisual — pareamento som-imagem",
      },
    ],
    dificil: [
      {
        id: "p1d",
        type: "integrado",
        question: "Integração com conflito",
        instruction: "Ouve som de gato, mas vê figura de cachorro. O que é?",
        options: [
          "Responde ao som (gato)",
          "Responde à imagem (cão)",
          "Confunde",
        ],
        correct: 0,
        explanation:
          "Conflito audiovisual — quale sentido tem prioridade? (nível 4–5)",
      },
    ],
  },
  "6-7": {
    facil: [
      {
        id: "p1f",
        type: "auditivo",
        question: "Sequência auditiva: 3 sons",
        instruction:
          "SOM 1 (sino), SOM 2 (sino mais alto), SOM 3 (campainha). Qual vem depois?",
        options: ["SOM 1 (sino)", "Campainha", "SOM desconhecido"],
        correct: 2,
        explanation: "Sequenciamento auditivo simples",
      },
    ],
    medio: [
      {
        id: "p2m",
        type: "visual",
        question: "Padrão visual progressivo",
        instruction: "Vê: ▲ ▲▲ ▲▲▲. Qual vem depois?",
        options: ["▲▲▲▲", "▲", "▲▲"],
        correct: 0,
        explanation: "Reconhecimento de padrão visual — sequência crescente",
      },
      {
        id: "p3m",
        type: "integrado",
        question: "Áudio-visual sincronizados",
        instruction: "Vê 3 luzes piscando. Escuta 3 beeps. Combinam em tempo?",
        options: [
          "Perfeitamente sincronizados",
          "Ligeiramente dessincronizados",
          "Completamente dessincronizados",
        ],
        correct: 0,
        explanation:
          "Sincronização audiovisual — janela temporal de integração ~200ms",
      },
    ],
    dificil: [
      {
        id: "p1d",
        type: "auditivo",
        question: "Discriminação auditiva complexa (ilusão McGurk-like)",
        instruction:
          "Ouve /ba/ com vídeo de pessoa falando /ga/. O que escuta?",
        options: [
          "/da/ (som intermediário)",
          "/ba/ (som real)",
          "/ga/ (vídeo)",
        ],
        correct: 0,
        explanation:
          "Efeito McGurk — integração audiovisual top-down prejudica som",
      },
    ],
  },
  "8-9": {
    facil: [
      {
        id: "p1f",
        type: "auditivo",
        question: "Processamento auditivo rápido",
        instruction: "3 tons rápidos (10ms cada). Qual a ordem?",
        options: [
          "Agudo-Médio-Grave",
          "Médio-Grave-Agudo",
          "Grave-Agudo-Médio",
        ],
        correct: 0,
        explanation: "Discriminação de ordem temporal em milissegundos",
      },
    ],
    medio: [
      {
        id: "p2m",
        type: "visual",
        question: "Rastreamento visual de múltiplos itens",
        instruction:
          "5 pontos vermelhos se movem na tela. Conta quantos ficam vermelhos.",
        options: ["5 pontos", "3 pontos", "2 pontos"],
        correct: 0,
        explanation:
          "Multiple object tracking (MOT) — limite ~3–4 objetos aos 8–9a",
      },
      {
        id: "p3m",
        type: "integrado",
        question: "Integração audiovisual com atraso",
        instruction:
          "Vê pessoa falando. Som chega 50ms atrasado. Percebe dessincronização?",
        options: ["Sim, percebe atraso", "Não, parece sincrônico", "Às vezes"],
        correct: 0,
        explanation:
          "Janela de integração audiovisual ~200ms (ambíguo em 50ms)",
      },
    ],
    dificil: [
      {
        id: "p1d",
        type: "integrado",
        question: "Separação figura-fundo com ruído",
        instruction:
          "Escuta voz-alvo em ruído de fundo. Identifica mensagem (cocktail party).",
        options: ["Identifica mensagem", "Muito difícil", "Impossível"],
        correct: 0,
        explanation: "Atenção auditiva seletiva (efeito cocktail party)",
      },
    ],
  },
  "10-12": {
    facil: [
      {
        id: "p1f",
        type: "auditivo",
        question: "Processamento auditivo com filtro",
        instruction: "2 mensagens simultâneas. Escuta APENAS orelha esquerda.",
        options: [
          "Consegue focar orelha esquerda",
          "Confunde com direita",
          "Não consegue",
        ],
        correct: 0,
        explanation: "Atenção auditiva dicótica — seleção por localização",
      },
    ],
    medio: [
      {
        id: "p2m",
        type: "visual",
        question: "Busca visual conjuntiva (feature binding)",
        instruction:
          "Procura triângulo VERMELHO entre quadrados vermelhos e triângulos azuis.",
        options: ["Encontra rápido", "Busca lenta ou erra", "Não encontra"],
        correct: 0,
        explanation: "Binding de features — requer atenção focal vs paralela",
      },
      {
        id: "p3m",
        type: "integrado",
        question: "Ilusão multissensorial (ventríloqo)",
        instruction:
          "Vê boneco falando, som vem do ator. Percebe origem real do som?",
        options: ["Percebe origem real", "Crê que boneco fala", "Indeciso"],
        correct: 1,
        explanation:
          "Ventrilóquio audiovisual — integração supera informação isolada",
      },
    ],
    dificil: [
      {
        id: "p1d",
        type: "integrado",
        question: "Síntese temporal audiovisual (stream segregation)",
        instruction:
          "2 frequências alternadas rapido. Escuta 1 som ou 2 streams?",
        options: [
          "2 streams (segregação)",
          "1 som (integração)",
          "Depende da velocidade",
        ],
        correct: 2,
        explanation:
          "Segregação de stream — depende de freq delta, ISI, padrão (Bregman)",
      },
    ],
  },
};

export default function ProcessamentoVisuoauditivo() {
  const [selectedAge, setSelectedAge] = useState<AgeGroup>("8-9");
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>("facil");
  const [answers, setAnswers] = useState<Answers>({});
  const [showReport, setShowReport] = useState(false);

  const tasks = PROCESSING_TASKS[selectedAge][selectedDifficulty];
  // Ordem de exibição das alternativas embaralhada por aplicação (anti-padrão "primeira é a certa").
  const optionOrders = useShuffledOptionOrders(tasks);
  const answered = Object.values(answers).filter((a) => a !== null).length;
  const progress = (answered / tasks.length) * 100;

  const handleAnswer = (taskId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [taskId]: value }));
  };

  const handleReset = () => {
    setSelectedAge("8-9");
    setSelectedDifficulty("facil");
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
          scaleName="Processamento Visual-Auditivo"
          scaleFullName={`Tarefas multissensoriais — dificuldade ${selectedDifficulty}`}
          items={reportItems}
          patientAge={AGE_GROUPS[selectedAge].label}
        />
        <SaveToPatient
          testName="Processamento Visual-Auditivo"
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
            <Ear className="h-6 w-6" />
            Processamento Visual-Auditivo — Progressivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Avaliação de discriminação, integração e atenção multissensorial com
            níveis de complexidade crescente.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Faixa Etária</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(AGE_GROUPS) as AgeGroup[]).map((age) => (
              <Button
                key={age}
                variant={selectedAge === age ? "default" : "outline"}
                onClick={() => {
                  setSelectedAge(age);
                  setAnswers({});
                }}
                className="text-xs sm:text-sm"
              >
                {AGE_GROUPS[age].label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Nível de Dificuldade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {(["facil", "medio", "dificil"] as Difficulty[]).map((diff) => (
              <Button
                key={diff}
                variant={selectedDifficulty === diff ? "default" : "outline"}
                onClick={() => {
                  setSelectedDifficulty(diff);
                  setAnswers({});
                }}
                className="text-xs sm:text-sm"
              >
                {diff === "facil"
                  ? "🟢 Fácil"
                  : diff === "medio"
                    ? "🟡 Médio"
                    : "🔴 Difícil"}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {AGE_GROUPS[selectedAge].label} —{" "}
              {selectedDifficulty.toUpperCase()}
            </CardTitle>
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
                    {task.type === "auditivo"
                      ? "🎵 Auditivo"
                      : task.type === "visual"
                        ? "👁️ Visual"
                        : "🔗 Integrado"}
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
