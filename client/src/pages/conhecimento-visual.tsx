import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";
import { RotateCcw, CheckCircle2, Eye } from "lucide-react";

type AgeGroup = "4-5" | "6-7" | "8-9" | "10-11";
type TaskType = "discriminacao" | "figura_fundo" | "simetria" | "sequencia";
type Score = 0 | 1 | null;
type Answers = Record<string, Score>;

interface AgeGroupInfo {
  label: string;
  description: string;
}

interface VisualTask {
  id: string;
  type: TaskType;
  question: string;
  instruction: string;
  options: string[];
  correct: number;
  explanation: string;
}

const AGE_GROUPS: Record<AgeGroup, AgeGroupInfo> = {
  "4-5": { label: "4–5 anos", description: "Pré-escola" },
  "6-7": { label: "6–7 anos", description: "1º–2º ano" },
  "8-9": { label: "8–9 anos", description: "3º–4º ano" },
  "10-11": { label: "10–11 anos", description: "5º–6º ano" },
};

const TASKS: Record<AgeGroup, VisualTask[]> = {
  "4-5": [
    {
      id: "d1",
      type: "discriminacao",
      question: "Qual desenho é DIFERENTE?",
      instruction: "Aponte o que é diferente dos outros",
      options: ["🔴🔴🔴🔴", "🔴🔴🟢🔴", "🔴🔴🔴🔴", "🔴🔴🔴🔴"],
      correct: 1,
      explanation: "O segundo tem um círculo verde entre vermelhos",
    },
    {
      id: "ff1",
      type: "figura_fundo",
      question: "Onde está o GATO escondido?",
      instruction: "Ache o gato entre os outros animais",
      options: ["🐱🐶🐰🐱🐶", "🐶🐰🐱🐶🐰", "🐰🐶🐶🐱🐶"],
      correct: 1,
      explanation: "O gato está na 4ª posição",
    },
    {
      id: "s1",
      type: "simetria",
      question: "Qual figura é igual à primeira?",
      instruction: "Procure a figura que é exatamente igual",
      options: ["🟦▲", "▲🟦", "🟦🟦"],
      correct: 0,
      explanation: "Primeira: quadrado e triângulo",
    },
  ],
  "6-7": [
    {
      id: "d1",
      type: "discriminacao",
      question: "Qual objeto é DIFERENTE?",
      instruction: "Ache o que não pertence ao grupo",
      options: ["🍎🍎🍌🍎", "🍎🍎🍎🍎", "🍎🍎🍎🍎"],
      correct: 0,
      explanation: "Bananas entre maçãs",
    },
    {
      id: "d2",
      type: "discriminacao",
      question: "Qual é a letra DIFERENTE?",
      instruction: "Procure a letra que não é igual às outras",
      options: ["A A A D A", "B B B B B", "M M M M M"],
      correct: 0,
      explanation: "Um D entre As",
    },
    {
      id: "ff1",
      type: "figura_fundo",
      question: "Quantas ESTRELAS você vê?",
      instruction: "Conte as estrelas escondidas entre as linhas",
      options: ["2", "3", "4", "5"],
      correct: 2,
      explanation: "Há 4 estrelas na figura",
    },
    {
      id: "s1",
      type: "simetria",
      question: "Qual figura é SIMÉTRICA?",
      instruction: "Escolha a figura que tem lados iguais",
      options: ["🟨🔶", "❌❌", "🎀"],
      correct: 2,
      explanation: "Lacinho é simétrico",
    },
  ],
  "8-9": [
    {
      id: "d1",
      type: "discriminacao",
      question: "Qual desenho tem um detalhe a MAIS?",
      instruction: "Procure o que tem algo que os outros não têm",
      options: ["Rosto: olhos, nariz, boca", "Rosto: olhos, nariz, boca, orelha", "Rosto: olhos, nariz, boca"],
      correct: 1,
      explanation: "O segundo tem orelha extra",
    },
    {
      id: "ff1",
      type: "figura_fundo",
      question: "Quantos TRIÂNGULOS estão escondidos nesta figura?",
      instruction: "Conte todos os triângulos, mesmo os parcialmente vistos",
      options: ["3", "4", "5", "6"],
      correct: 3,
      explanation: "Há múltiplos triângulos entrelaçados",
    },
    {
      id: "s1",
      type: "simetria",
      question: "Qual figura NÃO é simétrica?",
      instruction: "Escolha a que não é equilibrada dos lados",
      options: ["Borboleta com asas iguais", "Árvore torta", "Rosto frontal"],
      correct: 1,
      explanation: "Árvore torta não é simétrica",
    },
    {
      id: "seq1",
      type: "sequencia",
      question: "Qual vem DEPOIS?",
      instruction: "Continue a sequência visual",
      options: ["🔴🔵🔴🔵 → 🔴", "🔴🔵🔴🔵 → 🔵", "🔴🔵🔴🔵 → 🟢"],
      correct: 1,
      explanation: "Padrão alternado: continua com 🔵",
    },
  ],
  "10-11": [
    {
      id: "d1",
      type: "discriminacao",
      question: "Qual padrão quebra a sequência?",
      instruction: "Ache o que não segue a regra",
      options: ["📐📐📐🟪📐", "⭐⭐⭐⭐⭐", "🔷🔷🔷🔷🔷"],
      correct: 0,
      explanation: "Um quadrado entre triângulos",
    },
    {
      id: "ff1",
      type: "figura_fundo",
      question: "Quantas FORMAS DIFERENTES você consegue ver?",
      instruction: "Identifique quadrados, triângulos, círculos, etc.",
      options: ["3", "4", "5", "6"],
      correct: 3,
      explanation: "Várias formas sobrepostas",
    },
    {
      id: "s1",
      type: "simetria",
      question: "Se dobrasse isso no meio, seria simétrico?",
      instruction: "Imagine dobrando a figura ao meio",
      options: ["Sim", "Não", "Parcialmente"],
      correct: 1,
      explanation: "Depende do eixo de simetria",
    },
    {
      id: "seq1",
      type: "sequencia",
      question: "Qual número completa a sequência?",
      instruction: "Encontre o padrão: 2, 4, 8, ?, 32",
      options: ["12", "16", "20", "24"],
      correct: 1,
      explanation: "Sequência: cada número é o dobro do anterior",
    },
  ],
};

export default function ConhecimentoVisual() {
  const [selectedAge, setSelectedAge] = useState<AgeGroup>("6-7");
  const [answers, setAnswers] = useState<Answers>({});
  const [showReport, setShowReport] = useState(false);

  const tasks = TASKS[selectedAge];
  const answered = Object.values(answers).filter(a => a !== null).length;
  const progress = (answered / tasks.length) * 100;

  const score = useMemo(() => {
    let correct = 0;
    tasks.forEach(task => {
      const userAnswer = answers[task.id];
      if (userAnswer === undefined || userAnswer === null) return;
      if (userAnswer === task.correct) {
        correct++;
      }
    });
    return correct;
  }, [answers, tasks]);

  const handleAnswer = (taskId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [taskId]: value }));
  };

  const handleReset = () => {
    setSelectedAge("6-7");
    setAnswers({});
    setShowReport(false);
  };

  if (showReport) {
    return (
      <div className="space-y-4">
        <ClinicalReport
          title="Conhecimento Visual — Resultado"
          sections={[
            { title: "Faixa Etária", content: AGE_GROUPS[selectedAge].label },
            { title: "Desempenho", content: `${score}/${tasks.length} acertos (${Math.round((score/tasks.length)*100)}%)` },
            { title: "Habilidades Avaliadas", content: [
              "Discriminação Visual: consegue identificar diferenças",
              "Figura-Fundo: consegue localizar objetos em contextos complexos",
              "Simetria: entende equilíbrio visual",
              "Sequências: reconhece padrões visuais",
            ].join('\n') },
          ]}
        />
        <SaveToPatient testName="Conhecimento Visual" data={{ score, total: tasks.length, ageGroup: selectedAge }} />
        <Button onClick={handleReset} className="w-full">← Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-6 w-6" />
            Conhecimento Visual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Discriminação visual, figura-fundo, simetria e sequências.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Selecione a Faixa Etária</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(AGE_GROUPS) as AgeGroup[]).map(age => (
              <Button
                key={age}
                variant={selectedAge === age ? "default" : "outline"}
                onClick={() => { setSelectedAge(age); setAnswers({}); }}
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
            <Badge>{answered}/{tasks.length}</Badge>
          </div>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {tasks.map((task, idx) => (
            <div key={task.id} className="border-l-4 border-purple-300 pl-4 py-2">
              <div className="mb-3">
                <p className="font-semibold text-sm">{idx + 1}. {task.question}</p>
                <p className="text-xs text-gray-600 mt-1">{task.instruction}</p>
                <Badge variant="secondary" className="text-xs mt-2">
                  {task.type === "discriminacao" ? "👁️ Discriminação" : task.type === "figura_fundo" ? "🔍 Figura-Fundo" : task.type === "simetria" ? "🪞 Simetria" : "🔗 Sequência"}
                </Badge>
              </div>

              <RadioGroup value={String(answers[task.id] ?? "")} onValueChange={(v) => handleAnswer(task.id, parseInt(v))}>
                <div className="space-y-2">
                  {task.options.map((opt, i) => (
                    <div key={i} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                      <RadioGroupItem value={String(i)} id={`${task.id}-${i}`} />
                      <Label htmlFor={`${task.id}-${i}`} className="text-sm cursor-pointer flex-1">{opt}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              {answers[task.id] !== undefined && answers[task.id] !== null && (
                <div className="mt-3 text-xs text-gray-600">
                  {answers[task.id] === task.correct ? (
                    <span className="text-green-600 block">✅ Correto! {task.explanation}</span>
                  ) : (
                    <span className="text-red-600 block">❌ Incorreto. Resposta correta: {task.options[task.correct]}. {task.explanation}</span>
                  )}
                </div>
              )}
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
          Finalizar e Salvar
        </Button>
      </div>
    </div>
  );
}
