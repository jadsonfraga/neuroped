import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";
import { RotateCcw, CheckCircle2, Pen } from "lucide-react";

type AgeGroup = "3-4" | "5-6" | "8-9" | "10-11";
type TaskType = "desenho" | "copia" | "escrita";
type Score = number | null;

interface AgeGroupInfo {
  label: string;
  description: string;
}

interface Task {
  id: string;
  type: TaskType;
  instruction: string;
  criteria: string[];
  rubric: Record<number, string>;
}

const AGE_GROUPS: Record<AgeGroup, AgeGroupInfo> = {
  "3-4": { label: "3–4 anos", description: "Pré-escola" },
  "5-6": { label: "5–6 anos", description: "1º ano" },
  "8-9": { label: "8–9 anos", description: "3º–4º ano" },
  "10-11": { label: "10–11 anos", description: "5º–6º ano" },
};

const TASKS: Record<AgeGroup, Task[]> = {
  "3-4": [
    {
      id: "d1",
      type: "desenho",
      instruction: "Desenhe um círculo",
      criteria: ["Forma é redonda", "Traço contínuo"],
      rubric: { 0: "Não tenta ou rabisco", 1: "Tenta mas com dificuldade", 2: "Desenha círculo reconhecível" },
    },
    {
      id: "d2",
      type: "desenho",
      instruction: "Desenhe uma casa (quadrado com telhado e porta)",
      criteria: ["Base quadrada", "Telhado triangular", "Porta ou janela"],
      rubric: { 0: "Rabisco sem forma", 1: "Tenta alguns elementos", 2: "Casa reconhecível com 3+ elementos" },
    },
    {
      id: "d3",
      type: "desenho",
      instruction: "Desenhe uma pessoa (cabeça, corpo, pernas, braços)",
      criteria: ["Cabeça", "Tronco", "Pernas", "Braços"],
      rubric: { 0: "Não reconhecível", 1: "Alguns membros faltando", 2: "Pessoa com 4+ partes" },
    },
    {
      id: "c1",
      type: "copia",
      instruction: "Copie este traço: _____ (linha horizontal)",
      criteria: ["Aproximadamente horizontal", "Contínuo"],
      rubric: { 0: "Não copia", 1: "Tenta mas desorganizado", 2: "Linha clara e direita" },
    },
  ],
  "5-6": [
    {
      id: "c1",
      type: "copia",
      instruction: "Copie esta sequência: ▢▢▢ (3 quadrados)",
      criteria: ["Forma quadrada", "3 quadrados", "Organização na linha"],
      rubric: { 0: "Não reconhecível", 1: "Alguns quadrados", 2: "3 quadrados claros" },
    },
    {
      id: "c2",
      type: "copia",
      instruction: "Copie esta letra maiúscula: A",
      criteria: ["Tem 2 linhas diagonais", "Tem travessão no meio", "Legível"],
      rubric: { 0: "Não parece A", 1: "Tenta mas desorganizado", 2: "A reconhecível" },
    },
    {
      id: "e1",
      type: "escrita",
      instruction: "Escreva o seu primeiro nome",
      criteria: ["Legível", "Espaçamento básico", "Maiúscula no começo"],
      rubric: { 0: "Ilegível ou recusa", 1: "Parcialmente legível", 2: "Nome claro e legível" },
    },
    {
      id: "d1",
      type: "desenho",
      instruction: "Desenhe uma árvore (tronco e copa)",
      criteria: ["Tronco", "Copa arredondada", "Proporção básica"],
      rubric: { 0: "Não reconhecível", 1: "Alguns elementos", 2: "Árvore clara" },
    },
  ],
  "8-9": [
    {
      id: "c1",
      type: "copia",
      instruction: "Copie este padrão: ▢▲▢▲▢▲",
      criteria: ["Alterna quadrado e triângulo", "Alinhamento", "Legibilidade"],
      rubric: { 0: "Não segue padrão", 1: "Alguns erros", 2: "Padrão claro" },
    },
    {
      id: "e1",
      type: "escrita",
      instruction: "Escreva a frase: 'Eu gosto de ler livros'",
      criteria: ["Legível", "Espaçamento entre palavras", "Pontuação final"],
      rubric: { 0: "Muito difícil de ler", 1: "Legível com esforço", 2: "Claro e organizado" },
    },
    {
      id: "d1",
      type: "desenho",
      instruction: "Desenhe uma cena: menino brincando com bola no parque",
      criteria: ["Pessoa reconhecível", "Bola", "Parque (árvore, banco)"],
      rubric: { 0: "Rabisco sem sentido", 1: "Alguns elementos", 2: "Cena clara com 3+ elementos" },
    },
  ],
  "10-11": [
    {
      id: "e1",
      type: "escrita",
      instruction: "Escreva um parágrafo sobre seu hobby favorito (5–7 linhas)",
      criteria: ["Coerência", "Pontuação", "Letra legível", "Espaçamento"],
      rubric: { 0: "Incoerente ou ilegível", 1: "Legível mas com erros", 2: "Claro, coerente e bem organizado" },
    },
    {
      id: "c1",
      type: "copia",
      instruction: "Copie este texto: 'A natureza é bela.'",
      criteria: ["Sem erros ortográficos", "Legível", "Espaçamento uniforme"],
      rubric: { 0: "Muitos erros", 1: "Alguns erros pequenos", 2: "Cópia fiel e legível" },
    },
    {
      id: "d1",
      type: "desenho",
      instruction: "Desenhe um autorretrato (seu rosto) com detalhes (olhos, nariz, boca, cabelo, orelhas)",
      criteria: ["Simetria básica", "6+ detalhes", "Proporção facial"],
      rubric: { 0: "Muito simples ou não reconhecível", 1: "Básico com alguns detalhes", 2: "Autorretrato com detalhes e proporção" },
    },
  ],
};

export default function EscritaDesenho() {
  const [selectedAge, setSelectedAge] = useState<AgeGroup>("5-6");
  const [currentTaskIdx, setCurrentTaskIdx] = useState(0);
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [showReport, setShowReport] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const tasks = TASKS[selectedAge];
  const currentTask = tasks[currentTaskIdx];
  const answered = Object.values(scores).filter(s => s !== null).length;

  const handleScore = (score: Score) => {
    setScores(prev => ({ ...prev, [currentTask.id]: score }));
    if (currentTaskIdx < tasks.length - 1) {
      setTimeout(() => setCurrentTaskIdx(currentTaskIdx + 1), 500);
    }
  };

  const handleCanvasStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleCanvasEnd = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL();
    link.download = `desenho-${currentTask.id}.png`;
    link.click();
  };

  const totalScore = Object.values(scores).reduce<number>((sum, s) => (s ? sum + s : sum), 0);

  if (showReport) {
    return (
      <div className="space-y-4">
        <ClinicalReport
          title="Escrita e Desenho — Resultado"
          sections={[
            { title: "Faixa Etária", content: AGE_GROUPS[selectedAge].label },
            { title: "Pontuação Total", content: `${totalScore}/${tasks.length * 2} pontos` },
            { title: "Desempenho", content: tasks.map((t, i) => {
              const score = scores[t.id];
              return `${i + 1}. ${t.instruction.slice(0, 40)}... → ${score === 0 ? "❌ Dificuldade" : score === 1 ? "⚠️ Parcial" : score === 2 ? "✅ Adequado" : "⏭️ Não respondido"}`;
            }).join('\n') },
          ]}
        />
        <SaveToPatient testName="Escrita e Desenho" data={{ totalScore, maxScore: tasks.length * 2, ageGroup: selectedAge }} />
        <Button onClick={() => { setSelectedAge("5-6"); setScores({}); setShowReport(false); setCurrentTaskIdx(0); }} className="w-full">
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
            <Pen className="h-6 w-6" />
            Escrita e Desenho
          </CardTitle>
        </CardHeader>
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
                onClick={() => { setSelectedAge(age); setScores({}); setCurrentTaskIdx(0); }}
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
            <CardTitle>Tarefa {currentTaskIdx + 1}/{tasks.length}</CardTitle>
            <Badge>{answered}/{tasks.length} respondidas</Badge>
          </div>
          <Progress value={(answered / tasks.length) * 100} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
            <p className="font-semibold text-sm mb-2">📋 {currentTask.instruction}</p>
            <p className="text-xs text-gray-700">Critérios: {currentTask.criteria.join(", ")}</p>
          </div>

          {currentTask.type === "desenho" && (
            <div className="space-y-2">
              <p className="text-xs font-semibold">Desenho — Use o mouse/toque para desenhar:</p>
              <canvas
                ref={canvasRef}
                width={500}
                height={300}
                className="border-2 border-gray-300 rounded bg-white cursor-crosshair w-full"
                onMouseDown={handleCanvasStart}
                onMouseMove={handleCanvasMove}
                onMouseUp={handleCanvasEnd}
                onMouseLeave={handleCanvasEnd}
              />
              <div className="flex gap-2">
                <Button onClick={clearCanvas} variant="outline" size="sm">🗑️ Limpar</Button>
                <Button onClick={downloadCanvas} variant="outline" size="sm">⬇️ Salvar desenho</Button>
              </div>
            </div>
          )}

          {(currentTask.type === "copia" || currentTask.type === "escrita") && (
            <div className="space-y-2">
              <p className="text-xs font-semibold">{currentTask.type === "copia" ? "✍️ Cópia — Criança escreve aqui:" : "✍️ Escrita — Criança escreve aqui:"}</p>
              <textarea
                placeholder="Criança digita/escreve aqui"
                className="w-full h-32 p-2 border rounded text-sm font-mono"
              />
            </div>
          )}

          <div className="bg-gray-50 p-3 rounded border-l-4 border-gray-300">
            <p className="text-xs font-semibold mb-2">🎯 Avaliação:</p>
            <div className="space-y-2">
              {[
                { score: 0, label: "❌ Não consegue / Recusa" },
                { score: 1, label: "⚠️ Com dificuldade / Parcialmente" },
                { score: 2, label: "✅ Consegue / Adequado" },
              ].map(option => (
                <div key={option.score} className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant={scores[currentTask.id] === option.score ? "default" : "outline"}
                    onClick={() => handleScore(option.score as Score)}
                    className="text-xs w-full"
                  >
                    {option.label}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            <p><strong>Explicação da pontuação:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              {Object.entries(currentTask.rubric).map(([score, desc]) => (
                <li key={score}>{score === "0" ? "0 pontos" : score === "1" ? "1 ponto" : "2 pontos"}: {desc}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={() => { setSelectedAge("5-6"); setScores({}); setCurrentTaskIdx(0); }} variant="outline" className="flex-1">
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
