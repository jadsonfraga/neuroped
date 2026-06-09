import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";
import { RotateCcw, CheckCircle2, Brain } from "lucide-react";

type AgeGroup = "3-4" | "5-6" | "7-8" | "9-10" | "11-12";
type Difficulty = "facil" | "medio" | "dificil";
type Score = 0 | 1 | null;
type Answers = Record<string, Score>;

interface AgeGroupInfo {
  label: string;
  description: string;
}

interface MemoryTask {
  id: string;
  type: "sequencia" | "objeto" | "historia";
  question: string;
  instruction: string;
  options: string[];
  correct: number;
  explanation: string;
}

const AGE_GROUPS: Record<AgeGroup, AgeGroupInfo> = {
  "3-4": { label: "3–4 anos", description: "Memória primária" },
  "5-6": { label: "5–6 anos", description: "Memória em desenvolvimento" },
  "7-8": { label: "7–8 anos", description: "Consolidação de memória" },
  "9-10": { label: "9–10 anos", description: "Memória estratégica" },
  "11-12": { label: "11–12 anos", description: "Memória sofisticada" },
};

const MEMORY_TASKS: Record<AgeGroup, Record<Difficulty, MemoryTask[]>> = {
  "3-4": {
    facil: [
      {
        id: "m1f",
        type: "sequencia",
        question: "Repete a sequência: 🔴 🟢 🔴",
        instruction: "Eu mostro 3 cores. Você repete.",
        options: ["🔴 🟢 🔴", "🟢 🔴 🔴", "🔴 🔴 🟢"],
        correct: 0,
        explanation: "Memória de sequência visual — tarefa de repetição imediata",
      },
      {
        id: "m2f",
        type: "objeto",
        question: "Qual objeto escondi?",
        instruction: "Mostro 2 objetos (🎈 🍎), escondo um. Qual falta?",
        options: ["🎈", "🍎", "🎀"],
        correct: 0,
        explanation: "Reconhecimento de objeto ausente — memória visual simples",
      },
    ],
    medio: [
      {
        id: "m1m",
        type: "sequencia",
        question: "Repete: 🔴 🟢 🟡 🔴 🟢",
        instruction: "Sequência de 5 cores. Repita.",
        options: ["Correto", "Errado - trocou ordem", "Errado - esqueceu"],
        correct: 0,
        explanation: "Span de memória visual — esperado 3–4 itens aos 4 anos",
      },
    ],
    dificil: [
      {
        id: "m1d",
        type: "historia",
        question: "Conta a história que escutou",
        instruction: "Leia: 'João foi ao parque. Viu um cachorro. O cachorro comeu bolo.'",
        options: ["Conta os 3 eventos", "Conta 2 eventos", "Conta 1 ou nenhum"],
        correct: 0,
        explanation: "Memória narrativa — raro aos 3–4 anos, marcador de avanço",
      },
    ],
  },
  "5-6": {
    facil: [
      {
        id: "m1f",
        type: "sequencia",
        question: "Repete: 🔴 🟢 🟡 🟣 🔴 🟢",
        instruction: "6 cores em sequência.",
        options: ["Correto", "Trocou ordem", "Esqueceu alguns"],
        correct: 0,
        explanation: "Span de memória visual esperado aos 5–6 anos",
      },
    ],
    medio: [
      {
        id: "m2m",
        type: "objeto",
        question: "Quais objetos viu? (Mostro 5, escondo, pergunto)",
        instruction: "🎈 🍎 🎀 🐶 🌟 → Fecha olhos → Tira 2 → Quais faltam?",
        options: ["Identificou 2 corretos", "Identificou 1", "Nenhum"],
        correct: 0,
        explanation: "Memória de reconhecimento — múltiplos itens",
      },
      {
        id: "m3m",
        type: "historia",
        question: "Repete história com 4 eventos",
        instruction: "Leia: 'Maria entrou na cozinha. Pegou um copo. Colocou água. Bebeu.'",
        options: ["Repete 4 eventos", "Repete 2–3 eventos", "Repete 1 evento"],
        correct: 0,
        explanation: "Memória narrativa estruturada — esperado aos 5–6 anos",
      },
    ],
    dificil: [
      {
        id: "m1d",
        type: "sequencia",
        question: "Repete depois de distração",
        instruction: "Digo: 🟣 🔵 🟢 🟡. Contamos até 10. Agora repete.",
        options: ["Repete correto", "Esquece alguns", "Completely errado"],
        correct: 0,
        explanation: "Memória com intervalo — teste de retenção ativa",
      },
    ],
  },
  "7-8": {
    facil: [
      {
        id: "m1f",
        type: "sequencia",
        question: "Repete 7 dígitos",
        instruction: "2, 5, 8, 1, 9, 3, 7 — Repita.",
        options: ["Repete correto", "Repete com erro", "Perde vários"],
        correct: 0,
        explanation: "Span de dígitos esperado aos 7–8 anos",
      },
    ],
    medio: [
      {
        id: "m2m",
        type: "objeto",
        question: "Aprendizado por repetição (5 tentativas)",
        instruction: "Mostro 8 figuras 5 vezes. Criança tenta memorizar sequência.",
        options: ["Memoriza > 6 em última tentativa", "4–6 itens", "< 4 itens"],
        correct: 0,
        explanation: "Aprendizagem auditivo-visual — efeito de primazia e recência",
      },
      {
        id: "m3m",
        type: "historia",
        question: "Repete história com 6 eventos",
        instruction: "Narrativa mais complexa com detalhes. Criança relata.",
        options: ["Recorda > 5 eventos com detalhes", "3–5 eventos", "< 3"],
        correct: 0,
        explanation: "Memória episódica — recupera contexto e sequência temporal",
      },
    ],
    dificil: [
      {
        id: "m1d",
        type: "sequencia",
        question: "Memória com interferência (CLPT)",
        instruction: "Aprende lista A (4 palavras). Aprende lista B similar. Recorda A.",
        options: ["Pouca interferência", "Interferência moderada", "Esqueceu A"],
        correct: 0,
        explanation: "Resistência à interferência — medida de consolidação",
      },
    ],
  },
  "9-10": {
    facil: [
      {
        id: "m1f",
        type: "sequencia",
        question: "Repete 8 dígitos",
        instruction: "Sequência de 8 números aleatórios.",
        options: ["Repete correto", "Erro em 1–2", "Erro em > 2"],
        correct: 0,
        explanation: "Span de dígitos esperado aos 9–10 anos (8–9 itens)",
      },
    ],
    medio: [
      {
        id: "m2m",
        type: "objeto",
        question: "Memória de trabalho: ordena números mentalmente",
        instruction: "Digo: 7, 2, 9, 1, 5. Criança repete em ORDEM CRESCENTE.",
        options: ["1, 2, 5, 7, 9 — Correto", "Ordem parcial", "Ordem aleatória"],
        correct: 0,
        explanation: "Manipulação e armazenamento simultâneos — função executiva",
      },
      {
        id: "m3m",
        type: "historia",
        question: "Recorda depois de distração (15 min)",
        instruction: "Conta história aos 9 min. Faz atividades 15 min. Pergunta sobre história.",
        options: ["Recorda > 6 elementos", "4–6 elementos", "< 4 elementos"],
        correct: 0,
        explanation: "Memória de longo prazo consolidada — sem degradação rápida",
      },
    ],
    dificil: [
      {
        id: "m1d",
        type: "sequencia",
        question: "Memória verbal complexa (RAVLT — Rey)",
        instruction: "Lista de 15 palavras, 5 apresentações. Recall imediato e diferido.",
        options: ["Curva de aprendizagem típica", "Platô precoce", "Sem aprendizagem"],
        correct: 0,
        explanation: "RAVLT — teste clássico de aprendizagem e consolidação",
      },
    ],
  },
  "11-12": {
    facil: [
      {
        id: "m1f",
        type: "sequencia",
        question: "Repete 9 dígitos (forward)",
        instruction: "Sequência de 9 números.",
        options: ["Repete correto", "Erro em 1–2", "Erro em > 2"],
        correct: 0,
        explanation: "Span esperado aos 11–12 anos",
      },
    ],
    medio: [
      {
        id: "m2m",
        type: "objeto",
        question: "Dígitos em reverso (backward span)",
        instruction: "Digo: 4, 9, 2, 7, 1, 8. Criança repete AO CONTRÁRIO.",
        options: ["8, 1, 7, 2, 9, 4 — Correto", "Parcialmente correto", "Incorreto"],
        correct: 0,
        explanation: "Digit span reverso — requer reordenação executiva",
      },
      {
        id: "m3m",
        type: "historia",
        question: "Memória episódica — detalhes contextuais",
        instruction: "Conta história com múltiplos personagens. Criança responde perguntas sobre contexto.",
        options: ["Lembra personagens, tempo, lugar", "Alguns contextos", "Apenas fatos principais"],
        correct: 0,
        explanation: "Memória episódica sofisticada — integração temporal-espacial",
      },
    ],
    dificil: [
      {
        id: "m1d",
        type: "sequencia",
        question: "Teste de Memória Wisconsin (aprendizagem de conceitos)",
        instruction: "Cartões com regra oculta. Criança aprende regra por feedback.",
        options: ["Aprende regra em < 50 tentativas", "50–100 tentativas", "> 100"],
        correct: 0,
        explanation: "Aprendizagem implícita — envolve funções pré-frontal e estriado",
      },
    ],
  },
};

export default function MemoriaTeste() {
  const [selectedAge, setSelectedAge] = useState<AgeGroup>("7-8");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("facil");
  const [answers, setAnswers] = useState<Answers>({});
  const [showReport, setShowReport] = useState(false);

  const tasks = MEMORY_TASKS[selectedAge][selectedDifficulty];
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
    setSelectedAge("7-8");
    setSelectedDifficulty("facil");
    setAnswers({});
    setShowReport(false);
  };

  if (showReport) {
    return (
      <div className="space-y-4">
        <ClinicalReport
          title="Memória — Resultado"
          sections={[
            { title: "Faixa Etária", content: AGE_GROUPS[selectedAge].label },
            { title: "Nível de Dificuldade", content: selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1) },
            { title: "Desempenho", content: `${score}/${tasks.length} acertos (${Math.round((score/tasks.length)*100)}%)` },
            { title: "Tipos de Memória Avaliados", content: [
              "Memória de Curto Prazo (digit span): retenção imediata",
              "Memória de Trabalho: manipulação e retenção simultânea",
              "Memória Episódica: narrativa e contexto",
              "Aprendizagem Verbal: retenção com múltiplas apresentações",
            ].join('\n') },
            { title: "Interpretação", content: `Escore ${Math.round((score/tasks.length)*100)}% em nível ${selectedDifficulty} indica capacidade de memória ${
              Math.round((score/tasks.length)*100) >= 80 ? "dentro ou acima do esperado" :
              Math.round((score/tasks.length)*100) >= 60 ? "levemente abaixo do esperado" :
              "significativamente prejudicada — considera avaliação neuropsicológica formal"
            } para a faixa etária` },
          ]}
        />
        <SaveToPatient testName="Memória" data={{ score, total: tasks.length, ageGroup: selectedAge, difficulty: selectedDifficulty }} />
        <Button onClick={handleReset} className="w-full">← Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Memória — Múltiplos Níveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Avaliação lúdica de memória de curto prazo, trabalho, episódica e aprendizagem com progressão de dificuldade.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Faixa Etária</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {(Object.keys(AGE_GROUPS) as AgeGroup[]).map(age => (
              <Button
                key={age}
                variant={selectedAge === age ? "default" : "outline"}
                onClick={() => { setSelectedAge(age); setAnswers({}); }}
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
            {(['facil', 'medio', 'dificil'] as Difficulty[]).map(diff => (
              <Button
                key={diff}
                variant={selectedDifficulty === diff ? "default" : "outline"}
                onClick={() => { setSelectedDifficulty(diff); setAnswers({}); }}
                className="text-xs sm:text-sm"
              >
                {diff === 'facil' ? '🟢 Fácil' : diff === 'medio' ? '🟡 Médio' : '🔴 Difícil'}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{AGE_GROUPS[selectedAge].label} — {selectedDifficulty.toUpperCase()}</CardTitle>
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
                    <span className="text-red-600 block">❌ Resposta esperada: {task.options[task.correct]}. {task.explanation}</span>
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
