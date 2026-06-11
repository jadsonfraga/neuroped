import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";
import { RotateCcw, CheckCircle2, Move } from "lucide-react";

type AgeGroup = "2-3" | "4-5" | "6-7" | "8-9";
type Score = number | null;
type Answers = Record<string, Score>;

interface AgeGroupInfo {
  label: string;
  description: string;
}

interface MotorTask {
  id: string;
  name: string;
  instruction: string;
  type: "grossa" | "fina";
  criteria: string[];
  rubric: Record<number, string>;
}

const AGE_GROUPS: Record<AgeGroup, AgeGroupInfo> = {
  "2-3": { label: "2–3 anos", description: "Toddler" },
  "4-5": { label: "4–5 anos", description: "Pré-escola" },
  "6-7": { label: "6–7 anos", description: "1º–2º ano" },
  "8-9": { label: "8–9 anos", description: "3º–4º ano" },
};

const TASKS: Record<AgeGroup, MotorTask[]> = {
  "2-3": [
    {
      id: "g1",
      name: "Andar em linha reta",
      instruction: "Criança caminha sobre uma linha desenhada no chão",
      type: "grossa",
      criteria: ["Mantém equilíbrio", "Segue a linha aproximadamente"],
      rubric: { 0: "Cai ou não consegue", 1: "Tenta mas oscila", 2: "Anda com equilíbrio claro" },
    },
    {
      id: "g2",
      name: "Pular num pé só",
      instruction: "Criança pula num pé só, 3 vezes",
      type: "grossa",
      criteria: ["Equilíbrio", "Movimento coordenado"],
      rubric: { 0: "Não consegue", 1: "Tenta com dificuldade", 2: "Pula com controle" },
    },
    {
      id: "f1",
      name: "Preensão do lápis",
      instruction: "Avaliar como segura o lápis (trípode, cilindro, etc.)",
      type: "fina",
      criteria: ["Preensão apropriada", "Controle"],
      rubric: { 0: "Preensão inadequada", 1: "Preensão parcial", 2: "Trípode ou cilindro adequado" },
    },
  ],
  "4-5": [
    {
      id: "g1",
      name: "Pular num pé só",
      instruction: "Pula num pé só, mantendo equilíbrio por 5 segundos",
      type: "grossa",
      criteria: ["Equilíbrio", "Sem cair"],
      rubric: { 0: "Cai ou não consegue", 1: "Tenta mas desequilibra", 2: "Pula com equilíbrio claro" },
    },
    {
      id: "g2",
      name: "Chutar bola",
      instruction: "Chuta uma bola em movimento",
      type: "grossa",
      criteria: ["Contato com bola", "Direção"],
      rubric: { 0: "Não consegue", 1: "Chuta mas sem controle", 2: "Chuta com força e direção" },
    },
    {
      id: "f1",
      name: "Recortar com tesoura",
      instruction: "Corta papel com tesoura apropriada",
      type: "fina",
      criteria: ["Preensão", "Corte direto"],
      rubric: { 0: "Não consegue usar tesoura", 1: "Abre/fecha mas sem controle", 2: "Corta linha reta" },
    },
    {
      id: "f2",
      name: "Abotoar camisa",
      instruction: "Abotoa 3 botões em camisa",
      type: "fina",
      criteria: ["Coordenação", "Velocidade"],
      rubric: { 0: "Não consegue", 1: "Com ajuda de adulto", 2: "Sozinho com facilidade" },
    },
  ],
  "6-7": [
    {
      id: "g1",
      name: "Equilíbrio estático",
      instruction: "De pé sobre um pé só, mantém por 10 segundos",
      type: "grossa",
      criteria: ["Equilíbrio", "Postura"],
      rubric: { 0: "Cai antes de 3 segundos", 1: "Mantém 5-10 segundos", 2: "Mantém 10+ segundos com estabilidade" },
    },
    {
      id: "g2",
      name: "Corrida e mudança de direção",
      instruction: "Corre e muda de direção rapidamente",
      type: "grossa",
      criteria: ["Velocidade", "Controle"],
      rubric: { 0: "Corre mas sem controle", 1: "Consegue mudar com dificuldade", 2: "Ágil e coordenado" },
    },
    {
      id: "f1",
      name: "Caligrafia / Letra",
      instruction: "Escreve seu nome com letra legível",
      type: "fina",
      criteria: ["Legibilidade", "Controle do lápis"],
      rubric: { 0: "Ilegível", 1: "Legível com esforço", 2: "Letra clara e organizada" },
    },
    {
      id: "f2",
      name: "Desenho complexo",
      instruction: "Desenha um padrão ou figura com detalhes",
      type: "fina",
      criteria: ["Proporção", "Controle"],
      rubric: { 0: "Simples ou desorganizado", 1: "Alguns detalhes", 2: "Proporção e detalhe adequados" },
    },
  ],
  "8-9": [
    {
      id: "g1",
      name: "Coordenação dinâmica (pular corda)",
      instruction: "Pula corda, 10+ vezes seguidas",
      type: "grossa",
      criteria: ["Ritmo", "Coordenação"],
      rubric: { 0: "Não consegue", 1: "Pula 3-5 vezes", 2: "Pula 10+ vezes com ritmo" },
    },
    {
      id: "g2",
      name: "Lançamento e recepção",
      instruction: "Lança bola e pega com precisão",
      type: "grossa",
      criteria: ["Força", "Controle"],
      rubric: { 0: "Falha na recepção", 1: "Pega mas com dificuldade", 2: "Preciso e fluido" },
    },
    {
      id: "f1",
      name: "Velocidade de digitação",
      instruction: "Digita texto simples, observa velocidade e precisão",
      type: "fina",
      criteria: ["Velocidade", "Acertos"],
      rubric: { 0: "Muito lento ou muitos erros", 1: "Razoável com alguns erros", 2: "Rápido e preciso" },
    },
    {
      id: "f2",
      name: "Desenho técnico / Cópia",
      instruction: "Copia figura geométrica complexa",
      type: "fina",
      criteria: ["Proporção", "Precisão"],
      rubric: { 0: "Desproporcionado", 1: "Aproximado", 2: "Preciso e proporcionado" },
    },
  ],
};

export default function MotricidadeTeste() {
  const [selectedAge, setSelectedAge] = useState<AgeGroup>("4-5");
  const [answers, setAnswers] = useState<Answers>({});
  const [showReport, setShowReport] = useState(false);

  const tasks = TASKS[selectedAge];
  const answered = Object.values(answers).filter(a => a !== null).length;
  const progress = (answered / tasks.length) * 100;

  const totalScore = Object.values(answers).reduce<number>((sum, s) => (s ? sum + s : sum), 0);
  const maxScore = tasks.length * 2;

  const handleScore = (taskId: string, score: Score) => {
    setAnswers(prev => ({ ...prev, [taskId]: score }));
  };

  const handleReset = () => {
    setSelectedAge("4-5");
    setAnswers({});
    setShowReport(false);
  };

  if (showReport) {
    return (
      <div className="space-y-4">
        <ClinicalReport
          title="Motricidade — Resultado"
          sections={[
            { title: "Faixa Etária", content: AGE_GROUPS[selectedAge].label },
            { title: "Pontuação Total", content: `${totalScore}/${maxScore} pontos (${Math.round((totalScore/maxScore)*100)}%)` },
            { title: "Motricidade Grossa", content: tasks.filter(t => t.type === "grossa").map((t, i) => {
              const score = answers[t.id];
              const label = score === 0 ? "Dificuldade" : score === 1 ? "Parcial" : score === 2 ? "Adequado" : "Não respondido";
              return `${i + 1}. ${t.name}: ${label}`;
            }).join('\n') },
            { title: "Motricidade Fina", content: tasks.filter(t => t.type === "fina").map((t, i) => {
              const score = answers[t.id];
              const label = score === 0 ? "Dificuldade" : score === 1 ? "Parcial" : score === 2 ? "Adequado" : "Não respondido";
              return `${i + 1}. ${t.name}: ${label}`;
            }).join('\n') },
          ]}
        />
        <SaveToPatient testName="Motricidade" data={{ totalScore, maxScore, ageGroup: selectedAge }} />
        <Button onClick={handleReset} className="w-full">← Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Move className="h-6 w-6" />
            Motricidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Avaliação de coordenação motora grossa (equilíbrio, locomoção) e fina (destreza manual).</p>
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
            <div key={task.id} className="border-l-4 border-green-300 pl-4 py-2">
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-semibold text-sm">{idx + 1}. {task.name}</p>
                  <Badge variant="secondary" className="text-xs">
                    {task.type === "grossa" ? "💪 Grossa" : "🖌️ Fina"}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">{task.instruction}</p>
                <p className="text-xs text-gray-500 mt-1">Critérios: {task.criteria.join(", ")}</p>
              </div>

              <div className="bg-gray-50 p-3 rounded border-l-2 border-gray-300">
                <p className="text-xs font-semibold mb-3">Avaliação (0–2 pontos):</p>
                <div className="space-y-2">
                  {[0, 1, 2].map(score => (
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
                      <label htmlFor={`${task.id}-${score}`} className="text-xs cursor-pointer flex-1">
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
          Recomeçar
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
