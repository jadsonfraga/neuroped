import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  RotateCcw, Sparkles, Brain,
  Info, Printer, Lightbulb, Target, Users, MessageCircle,
  Eye, ChevronDown, ChevronUp, ClipboardCheck
} from "lucide-react";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";

// ═══════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════

const likertLabels = ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"];

interface BlockItem {
  num: number;
  text: string;
  tag?: "AH/SD" | "TEA";
}

interface Block {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  gradient: string;
  items: BlockItem[];
  note?: string;
}

const blocks: Block[] = [
  {
    id: "A",
    title: "Bloco A — Habilidades Intelectuais e Acadêmicas",
    subtitle: "Itens 1–12",
    icon: Brain,
    gradient: "from-violet-500 to-indigo-600",
    items: [
      { num: 1, text: "Aprende conteúdos novos muito mais rápido que os colegas da mesma idade" },
      { num: 2, text: "Demonstra vocabulário mais amplo e sofisticado do que o esperado para a idade" },
      { num: 3, text: "Reconhece letras, números e sílabas sem ter sido formalmente ensinado(a)" },
      { num: 4, text: "Realiza operações de contagem, comparação e sequência numérica com facilidade" },
      { num: 5, text: "Compreende conceitos abstratos (quantidade, maior/menor, causa-efeito) com facilidade" },
      { num: 6, text: "Memoriza informações com rapidez e precisão (músicas, histórias, nomes, datas)" },
      { num: 7, text: "Demonstra raciocínio lógico avançado ao resolver problemas ou quebra-cabeças" },
      { num: 8, text: "Classifica e organiza objetos por cor, forma e tamanho de modo espontâneo" },
      { num: 9, text: "Faz perguntas incomuns para a faixa etária, demonstrando curiosidade intensa" },
      { num: 10, text: "Entende instruções complexas dadas oralmente, mesmo sem suporte visual" },
      { num: 11, text: "Apresenta desempenho notavelmente superior ao grupo em atividades cognitivas" },
      { num: 12, text: "Demonstra capacidade de concentração prolongada em atividades de seu interesse" },
    ],
  },
  {
    id: "B",
    title: "Bloco B — Criatividade",
    subtitle: "Itens 13–22",
    icon: Lightbulb,
    gradient: "from-amber-500 to-orange-500",
    items: [
      { num: 13, text: "Propõe soluções originais e inusitadas para problemas do cotidiano" },
      { num: 14, text: "Cria histórias, personagens ou narrativas de forma espontânea" },
      { num: 15, text: "Utiliza materiais de maneiras não convencionais durante as brincadeiras" },
      { num: 16, text: "Demonstra senso estético apurado (aprecia detalhes em desenhos, músicas, construções)" },
      { num: 17, text: "Questiona regras ou soluções apresentadas pelo adulto, propondo alternativas" },
      { num: 18, text: "Demonstra humor inteligente ou irônico, mesmo que de forma peculiar" },
      { num: 19, text: "Inventa jogos, regras ou brincadeiras próprias e convida outros a participar" },
      { num: 20, text: "Produz desenhos, construções ou obras com nível de detalhe acima da faixa etária" },
      { num: 21, text: "Combina ideias de áreas diferentes de forma criativa e surpreendente" },
      { num: 22, text: "Mostra-se insatisfeito(a) com respostas simples, buscando explicações mais profundas" },
    ],
  },
  {
    id: "C",
    title: "Bloco C — Motivação e Comprometimento com Tarefas",
    subtitle: "Itens 23–31",
    icon: Target,
    gradient: "from-emerald-500 to-teal-600",
    items: [
      { num: 23, text: "Dedica-se intensamente a temas de seu interesse, às vezes ignorando o restante" },
      { num: 24, text: "Demonstra frustração ou agitação quando interrompido em atividades que lhe interessam" },
      { num: 25, text: "Prefere atividades desafiadoras a tarefas repetitivas já dominadas" },
      { num: 26, text: "Finaliza atividades com qualidade superior à esperada para a idade" },
      { num: 27, text: "Exige perfeição do próprio trabalho, refazendo quando não está satisfeito(a)" },
      { num: 28, text: "Demonstra persistência elevada diante de tarefas que considera interessantes" },
      { num: 29, text: "Demonstra desinteresse e distração evidente em atividades que considera fáceis" },
      { num: 30, text: "Estabelece metas e organiza suas próprias etapas de execução de atividades" },
      { num: 31, text: "Antecipa etapas e consequências de atividades antes de iniciá-las" },
    ],
  },
  {
    id: "D",
    title: "Bloco D — Socialização e Comportamento",
    subtitle: "Diferencial TEA × AH/SD — Itens 32–43",
    icon: Users,
    gradient: "from-rose-500 to-pink-600",
    note: "⚠️ Bloco essencial para diagnóstico diferencial. Itens marcados [TEA] e [AH/SD] têm interpretação diferenciada.",
    items: [
      { num: 32, text: "Quando motivado(a), interage verbalmente com adultos e pares de forma funcional", tag: "AH/SD" },
      { num: 33, text: "Evita contato visual durante interações sociais espontâneas", tag: "TEA" },
      { num: 34, text: "Demonstra empatia e reage emocionalmente às situações dos colegas", tag: "AH/SD" },
      { num: 35, text: "Apresenta rigidez comportamental intensa: fica angustiado com mudanças na rotina", tag: "TEA" },
      { num: 36, text: "Demonstra interesse restrito e repetitivo em temas muito específicos (ex: apenas trens, números, letras)", tag: "TEA" },
      { num: 37, text: "Apresenta comportamentos motores repetitivos (agitar mãos, balançar corpo, alinhar objetos)", tag: "TEA" },
      { num: 38, text: "Tem dificuldade em compreender regras sociais implícitas (esperar a vez, cumprimentar)", tag: "TEA" },
      { num: 39, text: "Quando interessado(a), consegue adaptar seu comportamento às expectativas sociais do grupo", tag: "AH/SD" },
      { num: 40, text: "Apresenta hipersensibilidade ou hipossensibilidade sensorial (sons, texturas, luz, alimentos)", tag: "TEA" },
      { num: 41, text: "Demonstra preferência por companhia de crianças mais velhas ou adultos", tag: "AH/SD" },
      { num: 42, text: "Negocia, lidera ou organiza os colegas em situações de brincadeira livre", tag: "AH/SD" },
      { num: 43, text: "Apresenta dificuldade em compreender expressões faciais ou emoções dos outros", tag: "TEA" },
    ],
  },
  {
    id: "E",
    title: "Bloco E — Linguagem e Comunicação",
    subtitle: "Itens 44–48",
    icon: MessageCircle,
    gradient: "from-sky-500 to-blue-600",
    items: [
      { num: 44, text: "Usa linguagem funcional e comunicativa para expressar necessidades e emoções" },
      { num: 45, text: "Apresenta ecolalia (repete falas, frases de vídeos ou adultos fora de contexto)" },
      { num: 46, text: "Compreende e usa linguagem figurada, metáforas ou ironia adequadas à faixa etária" },
      { num: 47, text: "Inicia conversas espontaneamente com colegas e adultos por interesse genuíno" },
      { num: 48, text: "Apresenta prosódia atípica (entonação monótona, ritmo ou volume inadequado da fala)" },
    ],
  },
];

// Block F — Global impression (special: SIM / NÃO / EM PARTE)
const blockF = [
  { num: 49, text: "Considerando todas as observações, você acredita que este(a) aluno(a) apresenta habilidades significativamente superiores à maioria das crianças da turma?" },
  { num: 50, text: "Em sua opinião, o perfil de comportamento desta criança vai além das características de superdotação, sugerindo necessidade de avaliação clínica especializada para TEA?" },
];

const blockFLabels = ["SIM", "NÃO", "EM PARTE"];

// ═══════════════════════════════════════════════════════════
// SCORING
// ═══════════════════════════════════════════════════════════

function classifyAhsdTea(answers: Record<number, number>, blockFAnswers: Record<number, number>) {
  // Bloco A: Habilidades Intelectuais (itens 1-12, max 48)
  let blocoA = 0;
  for (let i = 1; i <= 12; i++) blocoA += answers[i] ?? 0;

  // Bloco B: Criatividade (itens 13-22, max 40)
  let blocoB = 0;
  for (let i = 13; i <= 22; i++) blocoB += answers[i] ?? 0;

  // Bloco C: Motivação (itens 23-31, max 36)
  let blocoC = 0;
  for (let i = 23; i <= 31; i++) blocoC += answers[i] ?? 0;

  // Bloco D: TEA items (33, 35, 36, 37, 38, 40, 43) and AH/SD items (32, 34, 39, 41, 42)
  const teaItems = [33, 35, 36, 37, 38, 40, 43];
  const ahsdItems = [32, 34, 39, 41, 42];
  let teaScore = 0;
  for (const i of teaItems) teaScore += answers[i] ?? 0;
  let ahsdSocialScore = 0;
  for (const i of ahsdItems) ahsdSocialScore += answers[i] ?? 0;

  // Bloco E: Language — items 45, 48 are TEA markers; 44, 46, 47 are positive
  const teaLangItems = [45, 48];
  const posLangItems = [44, 46, 47];
  let teaLangScore = 0;
  for (const i of teaLangItems) teaLangScore += answers[i] ?? 0;
  let posLangScore = 0;
  for (const i of posLangItems) posLangScore += answers[i] ?? 0;

  // AH/SD total (A + B + C + AH/SD social + positive language)
  const ahsdTotal = blocoA + blocoB + blocoC + ahsdSocialScore + posLangScore;
  const ahsdMax = 48 + 40 + 36 + 20 + 12; // 156

  // TEA total (TEA social + TEA language)
  const teaTotal = teaScore + teaLangScore;
  const teaMax = 28 + 8; // 36

  // Percentages
  const ahsdPct = Math.round((ahsdTotal / ahsdMax) * 100);
  const teaPct = Math.round((teaTotal / teaMax) * 100);

  // AH/SD classification
  let ahsdClass = "";
  let ahsdDesc = "";
  if (ahsdPct >= 75) {
    ahsdClass = "Forte indicativo de AH/SD";
    ahsdDesc = "A criança apresenta indicadores consistentes de Altas Habilidades/Superdotação em múltiplos domínios. Recomenda-se avaliação formal com equipe multidisciplinar (psicólogo, neuropsicólogo) e encaminhamento para programa de enriquecimento/aceleração curricular.";
  } else if (ahsdPct >= 50) {
    ahsdClass = "Indicativo moderado de AH/SD";
    ahsdDesc = "A criança apresenta indicadores parciais de Altas Habilidades/Superdotação. Recomenda-se observação continuada, enriquecimento pedagógico e reavaliação em 6 meses. Considerar avaliação neuropsicológica para mapeamento cognitivo.";
  } else if (ahsdPct >= 30) {
    ahsdClass = "Indicativo leve — observar";
    ahsdDesc = "A criança apresenta alguns indicadores acima da média em áreas específicas, sem configurar perfil típico de AH/SD. Manter observação e estimulação pedagógica adequada.";
  } else {
    ahsdClass = "Sem indicativos de AH/SD";
    ahsdDesc = "Neste momento, não foram identificados indicadores significativos de Altas Habilidades/Superdotação pela professora. Isso não exclui a possibilidade — recomenda-se reavaliação caso haja mudanças no perfil.";
  }

  // TEA classification
  let teaClass = "";
  let teaDesc = "";
  if (teaPct >= 60) {
    teaClass = "Sinais significativos de TEA";
    teaDesc = "Foram identificados sinais comportamentais significativos compatíveis com Transtorno do Espectro Autista, incluindo dificuldades sociais, comportamentos repetitivos e/ou alterações de linguagem. Encaminhamento prioritário para avaliação neuropediátrica e multidisciplinar.";
  } else if (teaPct >= 35) {
    teaClass = "Sinais moderados — investigar";
    teaDesc = "A criança apresenta alguns sinais que merecem investigação clínica. Recomenda-se avaliação neuropediátrica para diagnóstico diferencial, especialmente se combinados com alto desempenho cognitivo (possível dupla excepcionalidade: AH/SD + TEA).";
  } else if (teaPct >= 15) {
    teaClass = "Sinais leves — monitorar";
    teaDesc = "Poucos sinais identificados. Manter observação clínica e pedagógica. Considerar reavaliação se surgirem novas dificuldades sociais ou comportamentais.";
  } else {
    teaClass = "Sem sinais significativos de TEA";
    teaDesc = "Não foram identificados sinais significativos de TEA pela professora neste momento.";
  }

  // Combined interpretation
  let combinedClass = "";
  let combinedDesc = "";
  if (ahsdPct >= 50 && teaPct >= 35) {
    combinedClass = "Possível Dupla Excepcionalidade (AH/SD + TEA)";
    combinedDesc = "O perfil sugere possível dupla excepcionalidade: altas habilidades cognitivas coexistindo com sinais de TEA. Este é um perfil complexo que exige avaliação multidisciplinar especializada. A superdotação pode mascarar sinais de TEA e vice-versa. Encaminhamento para neuropediatra e neuropsicólogo com experiência em dupla excepcionalidade.";
  } else if (ahsdPct >= 50 && teaPct < 35) {
    combinedClass = "Perfil compatível com AH/SD pura";
    combinedDesc = "O perfil é predominantemente de Altas Habilidades/Superdotação, sem sinais significativos de TEA. Recomenda-se avaliação neuropsicológica e plano de enriquecimento pedagógico.";
  } else if (ahsdPct < 50 && teaPct >= 35) {
    combinedClass = "Sinais de TEA sem perfil de AH/SD";
    combinedDesc = "Foram identificados sinais de TEA sem indicadores claros de superdotação. Encaminhar para avaliação neuropediátrica completa.";
  } else {
    combinedClass = "Sem indicativos significativos";
    combinedDesc = "Não foram identificados indicadores claros de AH/SD ou TEA neste momento. Manter acompanhamento pedagógico regular.";
  }

  // Block F
  const q49 = blockFAnswers[49]; // 0=SIM, 1=NÃO, 2=EM PARTE
  const q50 = blockFAnswers[50];

  return {
    blocoA, blocoB, blocoC,
    teaScore, teaTotal, teaMax, teaPct, teaClass, teaDesc,
    ahsdSocialScore, posLangScore, ahsdTotal, ahsdMax, ahsdPct, ahsdClass, ahsdDesc,
    teaLangScore,
    combinedClass, combinedDesc,
    q49Label: q49 !== undefined ? blockFLabels[q49] : "—",
    q50Label: q50 !== undefined ? blockFLabels[q50] : "—",
  };
}

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export default function AhsdTeaPage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [blockFAnswers, setBlockFAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({ A: true });

  // Patient info
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [school, setSchool] = useState("");
  const [turma, setTurma] = useState("");
  const [tempoConhece, setTempoConhece] = useState("");

  const allItems = blocks.flatMap(b => b.items);
  const totalLikert = allItems.length; // 48
  const answeredLikert = Object.keys(answers).length;
  const answeredBlockF = Object.keys(blockFAnswers).length;
  const totalAll = totalLikert + blockF.length; // 50
  const answeredAll = answeredLikert + answeredBlockF;
  const progress = (answeredAll / totalAll) * 100;
  const allAnswered = answeredAll === totalAll;

  function handleSubmit() { setShowResult(true); window.scrollTo(0, 0); }
  function handleReset() {
    setAnswers({}); setBlockFAnswers({}); setShowResult(false);
    setExpandedBlocks({ A: true });
  }

  function toggleBlock(id: string) {
    setExpandedBlocks(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function handlePrint() {
    window.print();
  }

  // ── RESULTADO ──
  if (showResult) {
    const result = classifyAhsdTea(answers, blockFAnswers);
    const totalScore = result.ahsdTotal + result.teaTotal;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-amber-500 flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — Triagem AH/SD × TEA</h1>
            <p className="text-xs text-muted-foreground">
              {childName && <>{childName} · </>}{childAge && <>{childAge} · </>}Avaliação concluída
            </p>
          </div>
        </div>

        {/* Print button */}
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2" data-testid="button-print">
          <Printer className="w-4 h-4" /> Imprimir Resultado
        </Button>

        {/* ── Perguntas e respostas ── */}
        <Card className="border-card-border">
          <CardContent className="p-5 space-y-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-primary" /> Perguntas e respostas
            </h2>
            {blocks.map((block) => (
              <div key={block.id} className="space-y-2">
                <h3 className="text-xs font-semibold text-primary">{block.title}</h3>
                {block.items.map((item) => (
                  <div key={item.num} className="text-sm border-b border-border/40 pb-2 last:border-0">
                    <p className="text-foreground leading-relaxed">
                      {item.tag && <span className="font-semibold">[{item.tag}] </span>}{item.text}
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      → {answers[item.num] === undefined ? "—" : likertLabels[answers[item.num]]}
                    </p>
                  </div>
                ))}
              </div>
            ))}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-primary flex items-center gap-2">
                <Eye className="w-4 h-4" /> Bloco F — Impressão Global da Professora
              </h3>
              {blockF.map((item) => (
                <div key={item.num} className="text-sm border-b border-border/40 pb-2 last:border-0">
                  <p className="text-foreground leading-relaxed">{item.text}</p>
                  <p className="text-muted-foreground mt-0.5">
                    → {blockFAnswers[item.num] === undefined ? "—" : blockFLabels[blockFAnswers[item.num]]}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Important note */}
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              <strong>Este questionário é um instrumento pedagógico de triagem</strong> e não substitui avaliação clínica multiprofissional.
              O diagnóstico de AH/SD e/ou TEA requer avaliação formal por equipe multidisciplinar (neuropediatra, neuropsicólogo, fonoaudiólogo).
              A dupla excepcionalidade (AH/SD + TEA) é um perfil complexo que demanda expertise clínica especializada.
            </p>
          </div>
        </div>

        {/* Clinical Report */}
        <ClinicalReport
          hideScore
          scaleName="Triagem AH/SD × TEA"
          scaleFullName="Questionário de Triagem — AH/SD com Diagnóstico Diferencial do TEA"
          classification="Registro de respostas — análise clínica pelo profissional"
          description="Transcrição das perguntas e respostas selecionadas."
          items={[
            ...allItems.map(item => ({
              question: `[${item.tag ? item.tag + " " : ""}${item.num}] ${item.text}`,
              answer: answers[item.num] === undefined ? "—" : likertLabels[answers[item.num]],
              value: answers[item.num] ?? 0,
            })),
            ...blockF.map(item => ({
              question: `[F ${item.num}] ${item.text}`,
              answer: blockFAnswers[item.num] === undefined ? "—" : blockFLabels[blockFAnswers[item.num]],
              value: blockFAnswers[item.num] ?? 0,
            })),
          ]}
          patientAge={childAge || "Educação Infantil"}
        />

        <SaveToPatient
          scaleName="Triagem AH/SD × TEA"
          totalScore={totalScore}
          classification={result.combinedClass}
          answers={answers}
          domainScores={{
            "AH/SD Total": result.ahsdTotal,
            "TEA Total": result.teaTotal,
            "Bloco A": result.blocoA,
            "Bloco B": result.blocoB,
            "Bloco C": result.blocoC,
          }}
        />

        <Button onClick={handleReset} variant="outline" className="w-full gap-2" data-testid="button-reset">
          <RotateCcw className="w-4 h-4" /> Nova Avaliação
        </Button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // FORMULÁRIO
  // ══════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-amber-500 flex items-center justify-center shadow-sm">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Triagem AH/SD × TEA</h1>
          <p className="text-xs text-muted-foreground">Resposta da Professora — Educação Infantil</p>
        </div>
      </div>

      {/* Info */}
      <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-xs text-foreground leading-relaxed space-y-1">
              <p><strong>Instrução:</strong> Marque a opção que melhor descreve o comportamento observado em sala de aula.</p>
              <p className="text-muted-foreground">Este questionário não substitui avaliação clínica multiprofissional — é um instrumento pedagógico de triagem.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient info */}
      <Card className="border-card-border">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground">Identificação</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Nome da criança</Label>
              <Input value={childName} onChange={e => setChildName(e.target.value)} placeholder="Nome completo" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Idade</Label>
              <Input value={childAge} onChange={e => setChildAge(e.target.value)} placeholder="Ex: 5 anos" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Professora</Label>
              <Input value={teacherName} onChange={e => setTeacherName(e.target.value)} placeholder="Nome da professora" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Escola</Label>
              <Input value={school} onChange={e => setSchool(e.target.value)} placeholder="Nome da escola" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Turma</Label>
              <Input value={turma} onChange={e => setTurma(e.target.value)} placeholder="Ex: Jardim II" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tempo que conhece o aluno</Label>
              <Input value={tempoConhece} onChange={e => setTempoConhece(e.target.value)} placeholder="Ex: 1 ano" className="h-9 text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{answeredAll} de {totalAll} itens respondidos</span>
          <span className="font-medium text-primary">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Likert scale legend */}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {likertLabels.map((label, i) => (
          <span key={i} className="px-2 py-0.5 rounded bg-muted/50 border">{i} = {label}</span>
        ))}
      </div>

      {/* Blocks A-E */}
      {blocks.map((block) => {
        const BlockIcon = block.icon;
        const isExpanded = expandedBlocks[block.id] ?? false;
        const answeredInBlock = block.items.filter(item => answers[item.num] !== undefined).length;

        return (
          <div key={block.id} className="space-y-3">
            <button
              onClick={() => toggleBlock(block.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 border hover:bg-muted/50 transition-colors"
            >
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${block.gradient} flex items-center justify-center flex-shrink-0`}>
                <BlockIcon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h2 className="text-sm font-bold text-foreground">{block.title}</h2>
                <p className="text-xs text-muted-foreground">{block.subtitle}</p>
              </div>
              <Badge variant="outline" className="text-xs">{answeredInBlock}/{block.items.length}</Badge>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {block.note && isExpanded && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-3 text-xs text-amber-800 dark:text-amber-300">
                {block.note}
              </div>
            )}

            {isExpanded && (
              <div className="space-y-3 pl-1">
                {block.items.map((item) => (
                  <Card key={item.num} className="border-card-border" data-testid={`card-question-${item.num}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs font-mono flex-shrink-0 mt-0.5">{item.num}</Badge>
                        {item.tag && (
                          <Badge className={`text-[10px] flex-shrink-0 mt-0.5 ${item.tag === "TEA" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"}`}>
                            {item.tag}
                          </Badge>
                        )}
                        <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
                      </div>
                      <RadioGroup
                        value={answers[item.num]?.toString()}
                        onValueChange={(val) => setAnswers({ ...answers, [item.num]: parseInt(val) })}
                        className="flex flex-wrap gap-2"
                      >
                        {likertLabels.map((label, j) => (
                          <div key={j} className="flex items-center">
                            <RadioGroupItem value={j.toString()} id={`q${item.num}-o${j}`} className="sr-only" />
                            <Label
                              htmlFor={`q${item.num}-o${j}`}
                              className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                                answers[item.num] === j
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-card text-foreground border-border hover:bg-muted"
                              }`}
                            >
                              {j}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Block F — Global impression */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Eye className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Bloco F — Impressão Global da Professora</h2>
            <p className="text-xs text-muted-foreground">Itens 49–50</p>
          </div>
        </div>

        {blockF.map((item) => (
          <Card key={item.num} className="border-card-border" data-testid={`card-question-${item.num}`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="text-xs font-mono flex-shrink-0 mt-0.5">{item.num}</Badge>
                <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
              </div>
              <RadioGroup
                value={blockFAnswers[item.num]?.toString()}
                onValueChange={(val) => setBlockFAnswers({ ...blockFAnswers, [item.num]: parseInt(val) })}
                className="flex flex-wrap gap-2"
              >
                {blockFLabels.map((label, j) => (
                  <div key={j} className="flex items-center">
                    <RadioGroupItem value={j.toString()} id={`qf${item.num}-o${j}`} className="sr-only" />
                    <Label
                      htmlFor={`qf${item.num}-o${j}`}
                      className={`text-xs px-4 py-2 rounded-full border cursor-pointer transition-colors ${
                        blockFAnswers[item.num] === j
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!allAnswered}
        className="w-full"
        size="lg"
        data-testid="button-submit"
      >
        {allAnswered ? "Ver Resultado" : `Responda todos os ${totalAll} itens`}
      </Button>
    </div>
  );
}
