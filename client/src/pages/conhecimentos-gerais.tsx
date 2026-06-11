import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";
import { RotateCcw, CheckCircle2, Lightbulb } from "lucide-react";

type AgeGroup = "5-6" | "7-8" | "9-10" | "11-12";
type Score = number | null;
type Answers = Record<string, Score>;

interface AgeGroupInfo {
  label: string;
  description: string;
}

interface GeneralKnowledgeItem {
  id: string;
  question: string;
  type: "factual" | "reasoning" | "culture";
  options: string[];
  correct: number;
  explanation: string;
}

const AGE_GROUPS: Record<AgeGroup, AgeGroupInfo> = {
  "5-6": { label: "5–6 anos", description: "1º ano" },
  "7-8": { label: "7–8 anos", description: "2º–3º ano" },
  "9-10": { label: "9–10 anos", description: "4º–5º ano" },
  "11-12": { label: "11–12 anos", description: "6º–7º ano" },
};

const ITEMS: Record<AgeGroup, GeneralKnowledgeItem[]> = {
  "5-6": [
    {
      id: "f1",
      question: "De que cor é a maçã?",
      type: "factual",
      options: ["Azul", "Vermelho ou verde", "Amarelo"],
      correct: 1,
      explanation: "Maçãs podem ser vermelhas, verdes ou amarelas",
    },
    {
      id: "f2",
      question: "Em que animal vivemos?",
      type: "factual",
      options: ["Água", "Terra", "Ar"],
      correct: 1,
      explanation: "Nós vivemos na Terra",
    },
    {
      id: "c1",
      question: "Se está chovendo, o que você leva?",
      type: "reasoning",
      options: ["Chapéu de praia", "Guarda-chuva", "Nada"],
      correct: 1,
      explanation: "Guarda-chuva nos protege da chuva",
    },
    {
      id: "c2",
      question: "Qual animal é o maior?",
      type: "reasoning",
      options: ["Cachorro", "Elefante", "Gato"],
      correct: 1,
      explanation: "Elefante é muito maior que cachorro e gato",
    },
    {
      id: "k1",
      question: "De quem você gosta de brincar?",
      type: "culture",
      options: ["Brinquedos", "Amigos ou família", "Sozinho"],
      correct: 1,
      explanation: "Brincar com amigos e família é importante",
    },
  ],
  "7-8": [
    {
      id: "f1",
      question: "Quantos dias tem uma semana?",
      type: "factual",
      options: ["5", "7", "10"],
      correct: 1,
      explanation: "Uma semana tem 7 dias",
    },
    {
      id: "f2",
      question: "Qual é o planeta onde vivemos?",
      type: "factual",
      options: ["Marte", "Vênus", "Terra"],
      correct: 2,
      explanation: "Nós vivemos no planeta Terra",
    },
    {
      id: "c1",
      question: "Se está quente, o que você faz?",
      type: "reasoning",
      options: ["Coloca suéter", "Bebe água", "Acende fogo"],
      correct: 1,
      explanation: "Beber água hidrata quando está quente",
    },
    {
      id: "k1",
      question: "Qual é o principal alimento de um leão?",
      type: "factual",
      options: ["Frutas", "Carne", "Plantas"],
      correct: 1,
      explanation: "Leões comem carne (são carnívoros)",
    },
    {
      id: "k2",
      question: "Em que país você está?",
      type: "culture",
      options: ["Brasil", "Argentina", "Portugal"],
      correct: 0,
      explanation: "Você está no Brasil",
    },
  ],
  "9-10": [
    {
      id: "f1",
      question: "Quantos meses tem um ano?",
      type: "factual",
      options: ["10", "12", "14"],
      correct: 1,
      explanation: "Um ano tem 12 meses",
    },
    {
      id: "f2",
      question: "Qual é a capital do Brasil?",
      type: "factual",
      options: ["Rio de Janeiro", "Brasília", "São Paulo"],
      correct: 1,
      explanation: "Brasília é a capital do Brasil",
    },
    {
      id: "c1",
      question: "Se você ganhar um dinheiro, o que você FAZ com ele?",
      type: "reasoning",
      options: ["Perde no caminho", "Gasta em algo importante ou guarda", "Queima"],
      correct: 1,
      explanation: "É sábio gastar ou economizar, não perder",
    },
    {
      id: "c2",
      question: "Quantas rodas tem um carro?",
      type: "factual",
      options: ["2", "3", "4"],
      correct: 2,
      explanation: "Um carro normal tem 4 rodas",
    },
    {
      id: "k1",
      question: "Em qual estação as folhas caem das árvores?",
      type: "factual",
      options: ["Primavera", "Outono", "Verão"],
      correct: 1,
      explanation: "No outono, as folhas caem das árvores",
    },
  ],
  "11-12": [
    {
      id: "f1",
      question: "Quantas fases tem a Lua?",
      type: "factual",
      options: ["2", "4", "8"],
      correct: 1,
      explanation: "A Lua tem 4 fases principais: nova, crescente, cheia, minguante",
    },
    {
      id: "f2",
      question: "Qual é o maior oceano do mundo?",
      type: "factual",
      options: ["Atlântico", "Pacífico", "Índico"],
      correct: 1,
      explanation: "O Oceano Pacífico é o maior",
    },
    {
      id: "c1",
      question: "Por que as plantas precisam de luz solar?",
      type: "reasoning",
      options: ["Para brincar", "Para fazer fotossíntese e crescer", "Porque sim"],
      correct: 1,
      explanation: "Plantas usam luz para fotossíntese",
    },
    {
      id: "c2",
      question: "Se um livro custa R$20 e você tem R$50, quanto sobra?",
      type: "reasoning",
      options: ["R$20", "R$30", "R$70"],
      correct: 1,
      explanation: "50 - 20 = 30",
    },
    {
      id: "k1",
      question: "Qual é o instrumento musical de corda?",
      type: "culture",
      options: ["Piano", "Violão", "Flauta"],
      correct: 1,
      explanation: "Violão é um instrumento de cordas",
    },
    {
      id: "k2",
      question: "Em que continente está o Brasil?",
      type: "culture",
      options: ["Ásia", "América do Sul", "Europa"],
      correct: 1,
      explanation: "Brasil fica na América do Sul",
    },
  ],
};

export default function ConhecimentosGerais() {
  const [selectedAge, setSelectedAge] = useState<AgeGroup>("7-8");
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
      if (userAnswer === item.correct) {
        correct++;
      }
    });
    return correct;
  }, [answers, items]);

  const handleAnswer = (itemId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [itemId]: value }));
  };

  const handleReset = () => {
    setSelectedAge("7-8");
    setAnswers({});
    setShowReport(false);
  };

  if (showReport) {
    return (
      <div className="space-y-4">
        <ClinicalReport
          title="Conhecimentos Gerais — Resultado"
          sections={[
            { title: "Faixa Etária", content: AGE_GROUPS[selectedAge].label },
            { title: "Desempenho", content: `${score}/${items.length} acertos (${Math.round((score/items.length)*100)}%)` },
            { title: "Categorias Avaliadas", content: [
              `Conhecimento Factual: Perguntas sobre fatos do mundo`,
              `Raciocínio: Aplicação de lógica e senso comum`,
              `Cultura/Awareness: Conhecimento cultural e geográfico`,
            ].join('\n') },
            { title: "Interpretação", content: `Escore ${Math.round((score/items.length)*100)}% indica ${Math.round((score/items.length)*100) >= 70 ? "bom" : "adequado"} conhecimento geral para a faixa etária` },
          ]}
        />
        <SaveToPatient testName="Conhecimentos Gerais" data={{ score, total: items.length, ageGroup: selectedAge }} />
        <Button onClick={handleReset} className="w-full">← Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6" />
            Conhecimentos Gerais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Avaliação de conhecimento factual, raciocínio lógico e awareness cultural.</p>
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
            <div key={item.id} className="border-l-4 border-yellow-300 pl-4 py-2">
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-semibold text-sm">{idx + 1}. {item.question}</p>
                  <Badge variant="secondary" className="text-xs">
                    {item.type === "factual" ? "📚 Fato" : item.type === "reasoning" ? "🧠 Raciocínio" : "🌍 Cultura"}
                  </Badge>
                </div>
              </div>

              <RadioGroup value={String(answers[item.id] ?? "")} onValueChange={(v) => handleAnswer(item.id, parseInt(v))}>
                <div className="space-y-2">
                  {item.options.map((opt, i) => (
                    <div key={i} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                      <RadioGroupItem value={String(i)} id={`${item.id}-${i}`} />
                      <Label htmlFor={`${item.id}-${i}`} className="text-sm cursor-pointer flex-1">{opt}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              {answers[item.id] !== undefined && answers[item.id] !== null && (
                <div className="mt-3 text-xs text-gray-600">
                  {answers[item.id] === item.correct ? (
                    <span className="text-green-600 block">✅ Correto! {item.explanation}</span>
                  ) : (
                    <span className="text-red-600 block">❌ Incorreto. Resposta correta: {item.options[item.correct]}. {item.explanation}</span>
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
