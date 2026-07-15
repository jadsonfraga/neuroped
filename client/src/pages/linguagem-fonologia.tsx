import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";
import { RotateCcw, CheckCircle2, MessageCircle } from "lucide-react";
import { useShuffledOptionOrders } from "@/lib/shuffleQuizOptions";

type AgeGroup = "3-4" | "5-6" | "7-8" | "9-10";
type Score = number | null;
type Answers = Record<string, Score>;

interface AgeGroupInfo {
  label: string;
  description: string;
}

interface LanguageTask {
  id: string;
  question: string;
  type: "fonologica" | "vocabulario" | "compreensao" | "expressao";
  instruction: string;
  options: string[];
  correct: number;
  explanation: string;
}

const AGE_GROUPS: Record<AgeGroup, AgeGroupInfo> = {
  "3-4": { label: "3–4 anos", description: "Toddler/Pré-escola" },
  "5-6": { label: "5–6 anos", description: "1º ano" },
  "7-8": { label: "7–8 anos", description: "2º–3º ano" },
  "9-10": { label: "9–10 anos", description: "4º–5º ano" },
};

const TASKS: Record<AgeGroup, LanguageTask[]> = {
  "3-4": [
    {
      id: "f1",
      question: "Rima: qual palavra RIMA com 'gato'?",
      type: "fonologica",
      instruction: "Peça à criança qual palavra soa parecido no final",
      options: ["Pato", "Cão", "Árvore"],
      correct: 0,
      explanation: "Gato e pato rimam (som final -ato)",
    },
    {
      id: "v1",
      question: "Vocabulário: o que é isto? (mostre figura de maçã)",
      type: "vocabulario",
      instruction: "Aponte para figura ou objeto comum",
      options: ["Maçã", "Bola", "Livro"],
      correct: 0,
      explanation: "Reconhecimento de objeto comum esperado aos 3-4 anos",
    },
    {
      id: "c1",
      question: "Compreensão: 'Onde está o olho?'",
      type: "compreensao",
      instruction: "Peça à criança para apontar ou tocar seu olho",
      options: ["Aponta corretamente", "Aponta região errada", "Não consegue"],
      correct: 0,
      explanation:
        "Compreensão de palavras de partes do corpo é marco esperado",
    },
    {
      id: "e1",
      question: "Expressão: como a criança fala palavras?",
      type: "expressao",
      instruction: "Observe se pronuncia palavras com clareza ou com trocas",
      options: [
        "Claro e inteligível",
        "Alguns sons imprecisos",
        "Muito impreciso",
      ],
      correct: 1,
      explanation: "Aos 3-4 anos alguns sons ainda estão em desenvolvimento",
    },
  ],
  "5-6": [
    {
      id: "f1",
      question: "Segmentação silábica: quantas sílabas em 'borboleta'?",
      type: "fonologica",
      instruction:
        "Peça à criança para bater palmas para cada sílaba: bor-bo-le-ta",
      options: ["3 sílabas", "4 sílabas", "5 sílabas"],
      correct: 1,
      explanation: "Borboleta tem 4 sílabas (bor-bo-le-ta)",
    },
    {
      id: "f2",
      question: "Aliteração: qual começa com 'B'?",
      type: "fonologica",
      instruction: "Opções de palavras",
      options: ["Bolo", "Casa", "Fogo"],
      correct: 0,
      explanation: "Bolo começa com som 'B'",
    },
    {
      id: "v1",
      question: "Vocabulário: o que significa 'gigante'?",
      type: "vocabulario",
      instruction: "Descreva ou peça à criança descrever",
      options: ["Muito grande", "Muito pequeno", "Amarelo"],
      correct: 0,
      explanation: "Gigante significa pessoa/coisa muito grande",
    },
    {
      id: "c1",
      question: "Compreensão: 'Pega a colher vermelha'",
      type: "compreensao",
      instruction:
        "Apresente 3 colheres (cores diferentes). Criança pega a correta.",
      options: ["Pega corretamente", "Hesita", "Não consegue"],
      correct: 0,
      explanation: "Crianças desta idade devem compreender cor + objeto",
    },
    {
      id: "e1",
      question: "Expressão: frase de 4-5 palavras",
      type: "expressao",
      instruction: "Peça: 'Fale uma frase sobre esse brinquedo'",
      options: [
        "Forma frase de 4-5+ palavras",
        "2-3 palavras",
        "1 palavra ou sons",
      ],
      correct: 0,
      explanation: "Aos 5-6 anos crianças devem formar frases simples",
    },
  ],
  "7-8": [
    {
      id: "f1",
      question: "Fonema inicial: 'Que som começa 'PATO'?'",
      type: "fonologica",
      instruction: "Peça o som (não a letra)",
      options: ["Som P", "Som A", "Som T"],
      correct: 0,
      explanation: "PATO começa com som consonantal P",
    },
    {
      id: "f2",
      question: "Rima: qual palavra RIMA com 'nuvem'?",
      type: "fonologica",
      instruction: "Procure rima final similar",
      options: ["Jovem", "Casa", "Livro"],
      correct: 0,
      explanation: "Nuvem e jovem rimam (final -em)",
    },
    {
      id: "v1",
      question: "Vocabulário: sinônimo de 'triste' é:",
      type: "vocabulario",
      instruction: "Qual palavra significa parecido?",
      options: ["Infeliz", "Alegre", "Calmo"],
      correct: 0,
      explanation: "Infeliz é sinônimo de triste",
    },
    {
      id: "c1",
      question: "Compreensão narrativa: história de 3 eventos",
      type: "compreensao",
      instruction:
        "Conte: 'João acordou, comeu pão, foi à escola'. Depois pergunte ordem dos eventos.",
      options: [
        "Responde correto a 2-3 perguntas",
        "Responde 1 corretamente",
        "Não consegue",
      ],
      correct: 0,
      explanation: "Compreensão de sequência narrativa esperada nesta faixa",
    },
    {
      id: "e1",
      question: "Expressão: conta experiência pessoal",
      type: "expressao",
      instruction: "Peça: 'Conte o que fez ontem'",
      options: [
        "Narra com 5+ eventos",
        "Narra 2-3 eventos",
        "Resposta muito curta",
      ],
      correct: 0,
      explanation:
        "Crianças desta idade conseguem narrar experiências sequenciadas",
    },
  ],
  "9-10": [
    {
      id: "f1",
      question: "Manipulação de sons: remova 'B' de 'BOLA'. O que sobra?",
      type: "fonologica",
      instruction: "Jogo de transformação fonológica",
      options: ["OLA", "BOL", "BOLA"],
      correct: 0,
      explanation: "Removendo B de BOLA fica OLA",
    },
    {
      id: "f2",
      question: "Leitura de pseudo-palavras (jogo de fone): pronuncie 'DRATO'",
      type: "fonologica",
      instruction: "Peça para ler palavra inventada",
      options: ["DRÁ-TO", "DA-RA-TO", "DRAT-O"],
      correct: 0,
      explanation:
        "Leitura fonética de pseudo-palavras indica decodificação adequada",
    },
    {
      id: "v1",
      question: "Vocabulário: qual é antônimo de 'fraco'?",
      type: "vocabulario",
      instruction: "Palavra com significado oposto",
      options: ["Forte", "Cansado", "Pequeno"],
      correct: 0,
      explanation: "Forte é antônimo (oposto) de fraco",
    },
    {
      id: "c1",
      question: "Compreensão: explique uma anedota simples",
      type: "compreensao",
      instruction:
        "Conte piada ou anedota infantil. Pergunte o quê que é engraçado.",
      options: [
        "Explica ponto de humor",
        "Entende mas não explica bem",
        "Não entende",
      ],
      correct: 0,
      explanation:
        "Compreensão de humor requer conhecimento cognitivo sofisticado",
    },
    {
      id: "e1",
      question: "Expressão: define palavra com característica",
      type: "expressao",
      instruction: "Peça: 'O que é um livro?'",
      options: [
        "Oferece definição com características",
        "Resposta vaga",
        "Resposta não-funcional",
      ],
      correct: 0,
      explanation: "Definições categóricas esperadas em crianças desta idade",
    },
  ],
};

export default function LinguagemFonologia() {
  const [selectedAge, setSelectedAge] = useState<AgeGroup>("5-6");
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
    setSelectedAge("5-6");
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
          scaleName="Linguagem e Fonologia"
          scaleFullName="Consciência fonológica, vocabulário, compreensão e expressão"
          items={reportItems}
          patientAge={AGE_GROUPS[selectedAge].label}
        />
        <SaveToPatient
          testName="Linguagem e Fonologia"
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
            <MessageCircle className="h-6 w-6" />
            Linguagem e Fonologia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Avaliação lúdica de consciência fonológica, vocabulário, compreensão
            e expressão linguística.
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
            <div
              key={task.id}
              className="border-l-4 border-orange-300 pl-4 py-2"
            >
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-semibold text-sm">
                    {idx + 1}. {task.question}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {task.type === "fonologica"
                      ? "🔤 Fonologia"
                      : task.type === "vocabulario"
                        ? "📚 Vocabulário"
                        : task.type === "compreensao"
                          ? "👂 Compreensão"
                          : "💬 Expressão"}
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
