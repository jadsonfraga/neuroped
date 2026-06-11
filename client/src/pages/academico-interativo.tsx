import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";
import {
  Calculator,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Printer,
  Brain,
} from "lucide-react";

type AgeGroup = "6-7" | "8-9" | "10-11" | "12-14";
type Score = number | null;
type Answers = Record<string, Score>;

interface AgeGroupInfo {
  label: string;
  description: string;
  color: string;
}

interface MathItem {
  id: string;
  type: "calculo" | "problema" | "sequencia";
  question: string;
  options?: string[];
  correct: string | number;
  explanation: string;
}

const AGE_GROUPS: Record<AgeGroup, AgeGroupInfo> = {
  "6-7": { label: "6–7 anos", description: "1º–2º ano", color: "text-blue-600" },
  "8-9": { label: "8–9 anos", description: "3º–4º ano", color: "text-green-600" },
  "10-11": { label: "10–11 anos", description: "5º–6º ano", color: "text-purple-600" },
  "12-14": { label: "12–14 anos", description: "7º–9º ano", color: "text-orange-600" },
};

const ITEMS: Record<AgeGroup, MathItem[]> = {
  "6-7": [
    { id: "c1", type: "calculo", question: "3 + 4 = ?", options: ["5", "6", "7", "8"], correct: "7", explanation: "Soma correta" },
    { id: "c2", type: "calculo", question: "8 - 2 = ?", options: ["4", "5", "6", "7"], correct: "6", explanation: "Subtração correta" },
    { id: "p1", type: "problema", question: "Maria tem 2 maçãs. Ganhou mais 3. Quantas tem agora?", options: ["3", "4", "5", "6"], correct: "5", explanation: "Problema simples de adição" },
    { id: "p2", type: "problema", question: "João comeu 2 de 5 biscoitos. Quantos restam?", options: ["2", "3", "4", "5"], correct: "3", explanation: "Problema de subtração" },
    { id: "s1", type: "sequencia", question: "2, 4, 6, ? → Qual número segue?", options: ["7", "8", "9", "10"], correct: "8", explanation: "Sequência de pares" },
  ],
  "8-9": [
    { id: "c1", type: "calculo", question: "25 + 18 = ?", options: ["40", "42", "43", "45"], correct: "43", explanation: "Adição com dezenas" },
    { id: "c2", type: "calculo", question: "50 - 23 = ?", options: ["25", "27", "30", "35"], correct: "27", explanation: "Subtração com dezenas" },
    { id: "c3", type: "calculo", question: "6 × 4 = ?", options: ["20", "24", "28", "30"], correct: "24", explanation: "Multiplicação simples" },
    { id: "p1", type: "problema", question: "Uma caixa tem 12 lápis. Há 3 caixas. Quantos lápis no total?", options: ["30", "35", "36", "40"], correct: "36", explanation: "Problema de multiplicação" },
    { id: "s1", type: "sequencia", question: "3, 6, 12, ? → Qual número segue?", options: ["20", "24", "30", "36"], correct: "24", explanation: "Sequência: dobra cada número" },
  ],
  "10-11": [
    { id: "c1", type: "calculo", question: "125 + 87 = ?", options: ["200", "210", "212", "215"], correct: "212", explanation: "Adição com centenas" },
    { id: "c2", type: "calculo", question: "200 - 145 = ?", options: ["45", "55", "60", "65"], correct: "55", explanation: "Subtração com centenas" },
    { id: "c3", type: "calculo", question: "12 × 7 = ?", options: ["80", "84", "88", "92"], correct: "84", explanation: "Multiplicação" },
    { id: "c4", type: "calculo", question: "72 ÷ 8 = ?", options: ["8", "9", "10", "12"], correct: "9", explanation: "Divisão" },
    { id: "p1", type: "problema", question: "Uma loja vende 15 livros por dia. Em uma semana (7 dias), quantos vende?", options: ["100", "105", "110", "120"], correct: "105", explanation: "Problema com multiplicação" },
    { id: "s1", type: "sequencia", question: "5, 10, 20, 40, ? → Qual número segue?", options: ["60", "70", "80", "100"], correct: "80", explanation: "Sequência: dobra cada número" },
  ],
  "12-14": [
    { id: "c1", type: "calculo", question: "456 + 789 = ?", options: ["1200", "1245", "1245", "1300"], correct: "1245", explanation: "Adição com números grandes" },
    { id: "c2", type: "calculo", question: "1000 - 342 = ?", options: ["658", "668", "678", "700"], correct: "658", explanation: "Subtração com números grandes" },
    { id: "c3", type: "calculo", question: "25 × 16 = ?", options: ["300", "350", "400", "450"], correct: "400", explanation: "Multiplicação com dezenas" },
    { id: "c4", type: "calculo", question: "144 ÷ 12 = ?", options: ["10", "12", "14", "16"], correct: "12", explanation: "Divisão" },
    { id: "p1", type: "problema", question: "Um ônibus tem 45 passageiros. Sobem mais 28. Descem 15. Quantos ficam?", options: ["45", "55", "58", "65"], correct: "58", explanation: "Problema com múltiplas operações" },
    { id: "s1", type: "sequencia", question: "1, 4, 9, 16, 25, ? → Qual número segue?", options: ["30", "35", "36", "40"], correct: "36", explanation: "Sequência: quadrados perfeitos (1², 2², 3², 4², 5², 6²)" },
  ],
};

export default function AcademicoInterativo() {
  const [selectedAge, setSelectedAge] = useState<AgeGroup>("6-7");
  const [answers, setAnswers] = useState<Answers>({});
  const [showReport, setShowReport] = useState(false);

  const items = ITEMS[selectedAge];
  const answered = Object.values(answers).filter(a => a !== null).length;
  const progress = (answered / items.length) * 100;

  const score = useMemo(() => {
    let correct = 0;
    items.forEach(item => {
      const userAnswer = answers[item.id];
      if (userAnswer === undefined || userAnswer === null) return;
      if (String(item.correct) === String(item.options?.[userAnswer] || userAnswer)) {
        correct++;
      }
    });
    return correct;
  }, [answers, items]);

  const handleAnswer = (itemId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [itemId]: value }));
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
          title="Acadêmico Interativo — Resultado"
          sections={[
            { title: "Faixa Etária", content: AGE_GROUPS[selectedAge].label },
            { title: "Desempenho", content: `${score}/${items.length} acertos (${Math.round((score/items.length)*100)}%)` },
            { title: "Itens Respondidos", content: items.map((item, idx) => {
              const userAnswer = answers[item.id];
              const isCorrect = userAnswer != null && String(item.correct) === String(item.options?.[userAnswer]);
              return `${idx+1}. ${item.question} → ${isCorrect ? '✅' : '❌'}`;
            }).join('\n') },
          ]}
        />
        <SaveToPatient testName="Acadêmico Interativo" data={{ score, total: items.length, ageGroup: selectedAge }} />
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
            Acadêmico Interativo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Cálculos, problemas matemáticos e sequências lógicas.</p>
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
            <Badge>{answered}/{items.length}</Badge>
          </div>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {items.map((item, idx) => (
            <div key={item.id} className="border-l-4 border-blue-300 pl-4 py-2">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-sm">{idx + 1}. {item.question}</p>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {item.type === "calculo" ? "🔢 Cálculo" : item.type === "problema" ? "📝 Problema" : "🔗 Sequência"}
                  </Badge>
                </div>
              </div>

              {item.options ? (
                <RadioGroup value={String(answers[item.id] ?? "")} onValueChange={(v) => handleAnswer(item.id, parseInt(v))}>
                  <div className="grid grid-cols-2 gap-2">
                    {item.options.map((opt, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <RadioGroupItem value={String(i)} id={`${item.id}-${i}`} />
                        <Label htmlFor={`${item.id}-${i}`} className="text-sm cursor-pointer">{opt}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              ) : null}

              {answers[item.id] !== undefined && answers[item.id] !== null && (
                <div className="mt-2 text-xs text-gray-600">
                  {String(item.correct) === String(item.options?.[answers[item.id]!]) ? (
                    <span className="text-green-600">✅ Correto! {item.explanation}</span>
                  ) : (
                    <span className="text-red-600">❌ Incorreto. Resposta: {item.options?.[answers[item.id]!] || item.correct}. {item.explanation}</span>
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
