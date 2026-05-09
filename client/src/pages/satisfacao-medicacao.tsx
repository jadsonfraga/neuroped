import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Pill, RotateCcw, Printer, CheckCircle2, AlertTriangle, Info,
  ThumbsUp, ThumbsDown, Minus, Clock, Weight, Droplets, Smile,
  Frown, Meh, TrendingUp, TrendingDown, Minus as MinusIcon,
  Heart, Brain, Moon, Zap, UtensilsCrossed, Eye, Activity
} from "lucide-react";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";

// ══════════════════════════════════════════════════════════
// DADOS DA ESCALA
// ══════════════════════════════════════════════════════════

const eficaciaLabels = ["Sem efeito", "Pouco efeito", "Efeito parcial", "Bom efeito", "Excelente efeito"];
const satisfacaoLabels = ["Muito insatisfeito", "Insatisfeito", "Neutro", "Satisfeito", "Muito satisfeito"];
const frequenciaLabels = ["Ausente", "Raro", "Às vezes", "Frequente", "Constante"];
const facilidadeLabels = ["Muito difícil", "Difícil", "Razoável", "Fácil", "Muito fácil"];

interface EfeitoAdverso {
  id: string;
  nome: string;
  icon: any;
  categoria: string;
}

const efeitosAdversos: EfeitoAdverso[] = [
  // Apetite/Peso
  { id: "apetite-menos", nome: "Diminuição do apetite", icon: UtensilsCrossed, categoria: "Apetite e Peso" },
  { id: "apetite-mais", nome: "Aumento do apetite / ganho de peso", icon: UtensilsCrossed, categoria: "Apetite e Peso" },
  { id: "nausea", nome: "Náusea / dor de barriga", icon: Frown, categoria: "Apetite e Peso" },
  // Sono
  { id: "insonia", nome: "Dificuldade para dormir", icon: Moon, categoria: "Sono" },
  { id: "sonolencia", nome: "Sonolência excessiva", icon: Moon, categoria: "Sono" },
  { id: "pesadelos", nome: "Pesadelos / sono agitado", icon: Moon, categoria: "Sono" },
  // Humor/Comportamento
  { id: "irritabilidade", nome: "Irritabilidade / choro fácil", icon: Frown, categoria: "Humor e Comportamento" },
  { id: "apatia", nome: "Apatia / parece 'dopado'", icon: Meh, categoria: "Humor e Comportamento" },
  { id: "agitacao", nome: "Piora da agitação", icon: Zap, categoria: "Humor e Comportamento" },
  { id: "rebote", nome: "Efeito rebote (piora ao fim do dia)", icon: TrendingDown, categoria: "Humor e Comportamento" },
  // Neurológico
  { id: "tremor", nome: "Tremores / movimentos involuntários", icon: Activity, categoria: "Neurológico" },
  { id: "tiques", nome: "Piora ou surgimento de tiques", icon: Activity, categoria: "Neurológico" },
  { id: "cefaleia", nome: "Dor de cabeça", icon: Brain, categoria: "Neurológico" },
  { id: "tontura", nome: "Tontura / visão turva", icon: Eye, categoria: "Neurológico" },
  // Cardiovascular/Outros
  { id: "taquicardia", nome: "Coração acelerado", icon: Heart, categoria: "Outros" },
  { id: "boca-seca", nome: "Boca seca", icon: Droplets, categoria: "Outros" },
  { id: "constipacao", nome: "Prisão de ventre", icon: Minus, categoria: "Outros" },
  { id: "pele", nome: "Problemas de pele / alergia", icon: AlertTriangle, categoria: "Outros" },
  { id: "salivacao", nome: "Salivação excessiva", icon: Droplets, categoria: "Outros" },
  { id: "enurese", nome: "Xixi na cama (novo ou piora)", icon: Droplets, categoria: "Outros" },
];

// Agrupar por categoria
const efeitosCategorias = [...new Set(efeitosAdversos.map(e => e.categoria))];

// ── Itens de eficácia por área ──
const areasEficacia = [
  { id: "atencao", nome: "Atenção / Concentração", icon: Brain },
  { id: "agitacao-melhora", nome: "Agitação / Hiperatividade", icon: Zap },
  { id: "irritabilidade-melhora", nome: "Irritabilidade / Agressividade", icon: Frown },
  { id: "sono-melhora", nome: "Sono", icon: Moon },
  { id: "ansiedade-melhora", nome: "Ansiedade / Medos", icon: AlertTriangle },
  { id: "humor-melhora", nome: "Humor / Tristeza", icon: Heart },
  { id: "aprendizado", nome: "Desempenho na escola", icon: TrendingUp },
  { id: "social", nome: "Convívio social / Comportamento", icon: Smile },
];

// ── Forma de administrar ──
const formaPerguntas = [
  { id: "aceita", nome: "A criança aceita tomar a medicação?", labels: facilidadeLabels },
  { id: "horario", nome: "Conseguem manter o horário correto?", labels: facilidadeLabels },
  { id: "entendeu", nome: "Entenderam como dar a medicação?", labels: facilidadeLabels },
  { id: "sabor", nome: "O sabor/formato é aceitável pela criança?", labels: facilidadeLabels },
  { id: "rotina", nome: "A medicação se encaixa na rotina da família?", labels: facilidadeLabels },
];

export default function SatisfacaoMedicacaoPage() {
  // Identificação
  const [nomeCrianca, setNomeCrianca] = useState("");
  const [idadeCrianca, setIdadeCrianca] = useState("");
  const [pesoCrianca, setPesoCrianca] = useState("");
  const [nomeMedicacao, setNomeMedicacao] = useState("");
  const [doseMedicacao, setDoseMedicacao] = useState("");
  const [posologia, setPosologia] = useState("");
  const [tempoUso, setTempoUso] = useState("");
  const [indicacao, setIndicacao] = useState("");
  const [respondente, setRespondente] = useState("");

  // Respostas
  const [eficaciaGeral, setEficaciaGeral] = useState<number | null>(null);
  const [satisfacaoGeral, setSatisfacaoGeral] = useState<number | null>(null);
  const [continuaria, setContinuaria] = useState<number | null>(null);
  const [efeitosResp, setEfeitosResp] = useState<Record<string, number>>({});
  const [eficaciaAreas, setEficaciaAreas] = useState<Record<string, number>>({});
  const [formaResp, setFormaResp] = useState<Record<string, number>>({});
  const [obsLivre, setObsLivre] = useState("");

  const [showResult, setShowResult] = useState(false);

  // Contagem
  const totalEfeitos = efeitosAdversos.length;
  const respondidosEfeitos = Object.keys(efeitosResp).length;
  const totalEficacia = areasEficacia.length;
  const respondidosEficacia = Object.keys(eficaciaAreas).length;
  const totalForma = formaPerguntas.length;
  const respondidosForma = Object.keys(formaResp).length;
  const totalItens = totalEfeitos + totalEficacia + totalForma + 3; // +3: eficácia geral, satisfação, continuaria
  const respondidos = respondidosEfeitos + respondidosEficacia + respondidosForma + (eficaciaGeral !== null ? 1 : 0) + (satisfacaoGeral !== null ? 1 : 0) + (continuaria !== null ? 1 : 0);
  const progress = (respondidos / totalItens) * 100;
  const canSubmit = eficaciaGeral !== null && satisfacaoGeral !== null && respondidosEfeitos >= 5;

  function handleSubmit() { setShowResult(true); window.scrollTo(0, 0); }
  function handleReset() {
    setEficaciaGeral(null); setSatisfacaoGeral(null); setContinuaria(null);
    setEfeitosResp({}); setEficaciaAreas({}); setFormaResp({});
    setObsLivre(""); setShowResult(false);
  }

  // ── MG/KG calc ──
  const mgKg = useMemo(() => {
    const peso = parseFloat(pesoCrianca);
    const dose = parseFloat(doseMedicacao);
    if (peso > 0 && dose > 0) return (dose / peso).toFixed(2);
    return null;
  }, [pesoCrianca, doseMedicacao]);

  // ═══════════════════════════════════════════════════════
  // RESULTADO
  // ═══════════════════════════════════════════════════════

  if (showResult) {
    // Calcular scores
    const efeitosPresentes = efeitosAdversos.filter(e => (efeitosResp[e.id] ?? 0) >= 2);
    const efeitosGraves = efeitosAdversos.filter(e => (efeitosResp[e.id] ?? 0) >= 3);
    const eficaciaMedia = respondidosEficacia > 0
      ? Object.values(eficaciaAreas).reduce((s, v) => s + v, 0) / respondidosEficacia
      : 0;
    const formaMedia = respondidosForma > 0
      ? Object.values(formaResp).reduce((s, v) => s + v, 0) / respondidosForma
      : 0;
    const totalEfeitosScore = Object.values(efeitosResp).reduce((s, v) => s + v, 0);
    const efeitosMax = totalEfeitos * 4;

    // Score composto (0-100)
    const eficaciaScore = (eficaciaGeral ?? 0) * 25; // 0-100
    const satisfacaoScore = (satisfacaoGeral ?? 0) * 25;
    const efeitosInverso = Math.max(0, 100 - (totalEfeitosScore / efeitosMax) * 100);
    const compostoScore = Math.round((eficaciaScore * 0.35 + satisfacaoScore * 0.25 + efeitosInverso * 0.25 + formaMedia * 25 * 0.15));

    let classificacao = "";
    let cor = "";
    let desc = "";
    if (compostoScore >= 75) {
      classificacao = "Boa resposta — manter";
      cor = "emerald";
      desc = "A medicação apresenta boa eficácia, poucos efeitos adversos e boa aceitação familiar. Recomenda-se manter o tratamento atual e reavaliar periodicamente.";
    } else if (compostoScore >= 50) {
      classificacao = "Resposta parcial — ajustar";
      cor = "amber";
      desc = "A medicação apresenta resposta parcial. Considerar ajuste de dose, horário ou formulação. Monitorar efeitos adversos e reavaliar em 2-4 semanas.";
    } else if (compostoScore >= 25) {
      classificacao = "Resposta insatisfatória — reavaliar";
      cor = "orange";
      desc = "Resposta insuficiente ou efeitos adversos relevantes. Reavaliar indicação, considerar troca de medicação ou ajuste significativo de dose.";
    } else {
      classificacao = "Intolerância / sem resposta — suspender ou trocar";
      cor = "red";
      desc = "Efeitos adversos significativos e/ou ausência de benefício clínico. Considerar suspensão gradual e troca por alternativa terapêutica.";
    }

    const totalScore = compostoScore;

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — Satisfação com Medicação</h1>
            <p className="text-xs text-muted-foreground">
              {nomeCrianca && <>{nomeCrianca} · </>}{nomeMedicacao && <>{nomeMedicacao} {doseMedicacao && `${doseMedicacao}mg`} · </>}
              {mgKg && <>{mgKg} mg/kg · </>}Score: {compostoScore}/100
            </p>
          </div>
        </div>

        {/* Score principal */}
        <Card className={`border-2 ${cor === "emerald" ? "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20" : cor === "amber" ? "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20" : cor === "orange" ? "border-orange-300 bg-orange-50/50 dark:bg-orange-950/20" : "border-red-300 bg-red-50/50 dark:bg-red-950/20"}`}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-foreground">{compostoScore}</p>
                <p className="text-xs text-muted-foreground">/100 pontos</p>
              </div>
              <Badge className={`text-sm px-4 py-1.5 ${cor === "emerald" ? "bg-emerald-100 text-emerald-700" : cor === "amber" ? "bg-amber-100 text-amber-700" : cor === "orange" ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}>
                {classificacao}
              </Badge>
            </div>
            <Progress value={compostoScore} className="h-2" />
            <p className="text-sm text-foreground leading-relaxed">{desc}</p>
          </CardContent>
        </Card>

        {/* Detalhamento */}
        <div className="grid sm:grid-cols-2 gap-3">
          {/* Eficácia */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">Eficácia Global</h3>
              <p className="text-2xl font-bold">{eficaciaLabels[eficaciaGeral ?? 0]}</p>
              {respondidosEficacia > 0 && (
                <div className="space-y-1.5 pt-2 border-t">
                  {areasEficacia.map(a => {
                    const val = eficaciaAreas[a.id];
                    if (val === undefined) return null;
                    const Icon = a.icon;
                    return (
                      <div key={a.id} className="flex items-center gap-2 text-xs">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="flex-1 truncate">{a.nome}</span>
                        <Badge variant="outline" className={`text-[10px] ${val >= 3 ? "text-emerald-600 border-emerald-300" : val >= 2 ? "text-amber-600 border-amber-300" : "text-red-600 border-red-300"}`}>
                          {eficaciaLabels[val]}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Efeitos adversos */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">Efeitos Adversos</h3>
              <div className="flex gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{efeitosPresentes.length}</p>
                  <p className="text-[10px] text-muted-foreground">presentes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{efeitosGraves.length}</p>
                  <p className="text-[10px] text-muted-foreground">frequentes/constantes</p>
                </div>
              </div>
              {efeitosPresentes.length > 0 && (
                <div className="space-y-1 pt-2 border-t">
                  {efeitosPresentes.map(e => (
                    <div key={e.id} className="flex items-center gap-2 text-xs">
                      <span className={`w-2 h-2 rounded-full ${(efeitosResp[e.id] ?? 0) >= 3 ? "bg-red-500" : "bg-amber-500"}`} />
                      <span className="flex-1">{e.nome}</span>
                      <span className="text-muted-foreground">{frequenciaLabels[efeitosResp[e.id] ?? 0]}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Administração */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">Forma de Administrar</h3>
              <p className="text-2xl font-bold">{formaMedia.toFixed(1)}<span className="text-sm text-muted-foreground">/4</span></p>
              <div className="space-y-1 pt-2 border-t">
                {formaPerguntas.map(fp => {
                  const val = formaResp[fp.id];
                  if (val === undefined) return null;
                  return (
                    <div key={fp.id} className="flex items-center gap-2 text-xs">
                      <span className="flex-1 truncate">{fp.nome.replace("?", "")}</span>
                      <Badge variant="outline" className={`text-[10px] ${val >= 3 ? "text-emerald-600 border-emerald-300" : val >= 2 ? "text-amber-600 border-amber-300" : "text-red-600 border-red-300"}`}>
                        {facilidadeLabels[val]}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Satisfação geral */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">Satisfação da Família</h3>
              <p className="text-2xl font-bold">{satisfacaoLabels[satisfacaoGeral ?? 0]}</p>
              {continuaria !== null && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Continuaria usando?</p>
                  <Badge className={`text-xs mt-1 ${continuaria >= 3 ? "bg-emerald-100 text-emerald-700" : continuaria >= 2 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                    {["Não, de jeito nenhum", "Provavelmente não", "Talvez", "Provavelmente sim", "Com certeza sim"][continuaria]}
                  </Badge>
                </div>
              )}
              {obsLivre && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Observações da família:</p>
                  <p className="text-xs text-foreground mt-1 italic">"{obsLivre}"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dose e mg/kg */}
        {mgKg && (
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
            <div className="flex items-center gap-2">
              <Weight className="w-4 h-4 text-primary" />
              <p className="text-sm text-foreground">
                <strong>{nomeMedicacao}</strong> {doseMedicacao}mg · Peso: {pesoCrianca}kg · <strong className="text-primary">{mgKg} mg/kg</strong>
                {posologia && <> · {posologia}</>}
              </p>
            </div>
          </div>
        )}

        <ClinicalReport
          scaleName="Satisfação com Medicação"
          scaleFullName={`Escala de Satisfação e Monitoramento Medicamentoso — ${nomeMedicacao || "Medicação"}`}
          totalScore={compostoScore}
          maxScore={100}
          classification={classificacao}
          description={desc}
          domainResults={[
            { domain: "Eficácia", score: eficaciaScore, classification: eficaciaLabels[eficaciaGeral ?? 0] },
            { domain: "Efeitos Adversos (invertido)", score: Math.round(efeitosInverso), classification: efeitosGraves.length === 0 ? "Ausentes" : `${efeitosGraves.length} frequentes` },
            { domain: "Administração", score: Math.round(formaMedia * 25), classification: formaMedia >= 3 ? "Fácil" : formaMedia >= 2 ? "Razoável" : "Difícil" },
            { domain: "Satisfação", score: satisfacaoScore, classification: satisfacaoLabels[satisfacaoGeral ?? 0] },
          ]}
          items={[
            ...efeitosAdversos.filter(e => efeitosResp[e.id] !== undefined).map(e => ({ question: `[Efeito] ${e.nome}`, answer: frequenciaLabels[efeitosResp[e.id]], value: efeitosResp[e.id] })),
            ...areasEficacia.filter(a => eficaciaAreas[a.id] !== undefined).map(a => ({ question: `[Eficácia] ${a.nome}`, answer: eficaciaLabels[eficaciaAreas[a.id]], value: eficaciaAreas[a.id] })),
            ...formaPerguntas.filter(f => formaResp[f.id] !== undefined).map(f => ({ question: `[Admin.] ${f.nome}`, answer: facilidadeLabels[formaResp[f.id]], value: formaResp[f.id] })),
          ]}
          patientAge={idadeCrianca || "Pediátrico"}
        />

        <SaveToPatient
          scaleName={`Satisfação Medicação — ${nomeMedicacao}`}
          totalScore={compostoScore}
          classification={classificacao}
          answers={{ ...efeitosResp, ...eficaciaAreas, ...formaResp, eficaciaGeral, satisfacaoGeral, continuaria }}
          domainScores={{ "Eficácia": eficaciaScore, "Efeitos": Math.round(efeitosInverso), "Administração": Math.round(formaMedia * 25), "Satisfação": satisfacaoScore }}
        />

        <Button onClick={handleReset} variant="outline" className="w-full gap-2">
          <RotateCcw className="w-4 h-4" /> Nova Avaliação
        </Button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // FORMULÁRIO
  // ═══════════════════════════════════════════════════════

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
          <Pill className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Satisfação com Medicação</h1>
          <p className="text-xs text-muted-foreground">Resposta dos pais — Efeitos, eficácia e forma de administrar</p>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-3">
          <p className="text-xs text-foreground flex items-start gap-2">
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <span>Instrumento para os <strong>pais/responsáveis</strong> avaliarem a medicação atual da criança: eficácia percebida, efeitos adversos, facilidade de administração e satisfação geral. O resultado gera um score de 0-100 que auxilia na decisão clínica.</span>
          </p>
        </CardContent>
      </Card>

      {/* Identificação */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-bold">Identificação</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Nome da criança</Label>
              <Input value={nomeCrianca} onChange={e => setNomeCrianca(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Idade</Label>
              <Input value={idadeCrianca} onChange={e => setIdadeCrianca(e.target.value)} placeholder="Ex: 8 anos" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Peso (kg)</Label>
              <Input value={pesoCrianca} onChange={e => setPesoCrianca(e.target.value)} placeholder="Ex: 25" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Quem responde</Label>
              <Input value={respondente} onChange={e => setRespondente(e.target.value)} placeholder="Ex: Mãe" className="h-9 text-sm" />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Medicação</Label>
              <Input value={nomeMedicacao} onChange={e => setNomeMedicacao(e.target.value)} placeholder="Ex: Risperidona" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Dose (mg)</Label>
              <Input value={doseMedicacao} onChange={e => setDoseMedicacao(e.target.value)} placeholder="Ex: 0.5" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Posologia</Label>
              <Input value={posologia} onChange={e => setPosologia(e.target.value)} placeholder="Ex: 1x noite" className="h-9 text-sm" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tempo de uso</Label>
              <Input value={tempoUso} onChange={e => setTempoUso(e.target.value)} placeholder="Ex: 3 meses" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Indicação</Label>
              <Input value={indicacao} onChange={e => setIndicacao(e.target.value)} placeholder="Ex: irritabilidade, sono" className="h-9 text-sm" />
            </div>
          </div>
          {mgKg && (
            <div className="rounded-lg bg-primary/10 px-3 py-2">
              <p className="text-xs font-medium text-primary">Dose calculada: {mgKg} mg/kg</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{respondidos} de {totalItens} itens</span>
          <span className="text-primary font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* ── 1. EFICÁCIA GERAL ── */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            No geral, a medicação está fazendo efeito?
          </h3>
          <RadioGroup value={eficaciaGeral?.toString()} onValueChange={v => setEficaciaGeral(parseInt(v))} className="flex flex-wrap gap-2">
            {eficaciaLabels.map((l, i) => (
              <div key={i}><RadioGroupItem value={i.toString()} id={`eg-${i}`} className="sr-only" />
                <Label htmlFor={`eg-${i}`} className={`text-xs px-3 py-2 rounded-xl border cursor-pointer transition-all ${eficaciaGeral === i ? "bg-primary text-white border-primary" : "bg-card border-border hover:bg-muted"}`}>{l}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* ── 2. EFICÁCIA POR ÁREA ── */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-500" />
            Em que áreas percebeu melhora?
          </h3>
          <p className="text-xs text-muted-foreground">Responda apenas as áreas relevantes para a criança</p>
          <div className="space-y-3">
            {areasEficacia.map(a => {
              const Icon = a.icon;
              return (
                <div key={a.id} className="space-y-1.5">
                  <p className="text-xs font-medium flex items-center gap-1.5"><Icon className="w-3.5 h-3.5 text-muted-foreground" />{a.nome}</p>
                  <RadioGroup value={eficaciaAreas[a.id]?.toString()} onValueChange={v => setEficaciaAreas({ ...eficaciaAreas, [a.id]: parseInt(v) })} className="flex flex-wrap gap-1.5">
                    {eficaciaLabels.map((l, i) => (
                      <div key={i}><RadioGroupItem value={i.toString()} id={`ea-${a.id}-${i}`} className="sr-only" />
                        <Label htmlFor={`ea-${a.id}-${i}`} className={`text-[11px] px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all ${eficaciaAreas[a.id] === i ? "bg-primary text-white border-primary" : "bg-card border-border hover:bg-muted"}`}>{i}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── 3. EFEITOS ADVERSOS ── */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Efeitos adversos observados
          </h3>
          <p className="text-xs text-muted-foreground">0 = Ausente, 1 = Raro, 2 = Às vezes, 3 = Frequente, 4 = Constante</p>
          {efeitosCategorias.map(cat => (
            <div key={cat} className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2 border-t">{cat}</p>
              {efeitosAdversos.filter(e => e.categoria === cat).map(e => (
                <div key={e.id} className="space-y-1">
                  <p className="text-xs">{e.nome}</p>
                  <RadioGroup value={efeitosResp[e.id]?.toString()} onValueChange={v => setEfeitosResp({ ...efeitosResp, [e.id]: parseInt(v) })} className="flex gap-1.5">
                    {frequenciaLabels.map((l, i) => (
                      <div key={i}><RadioGroupItem value={i.toString()} id={`ef-${e.id}-${i}`} className="sr-only" />
                        <Label htmlFor={`ef-${e.id}-${i}`} className={`text-[11px] px-2 py-1 rounded-lg border cursor-pointer transition-all ${efeitosResp[e.id] === i ? (i >= 3 ? "bg-red-500 text-white border-red-500" : i >= 2 ? "bg-amber-500 text-white border-amber-500" : "bg-primary text-white border-primary") : "bg-card border-border hover:bg-muted"}`}>{i}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── 4. FORMA DE DAR ── */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-500" />
            Forma de administrar
          </h3>
          {formaPerguntas.map(fp => (
            <div key={fp.id} className="space-y-1.5">
              <p className="text-xs font-medium">{fp.nome}</p>
              <RadioGroup value={formaResp[fp.id]?.toString()} onValueChange={v => setFormaResp({ ...formaResp, [fp.id]: parseInt(v) })} className="flex flex-wrap gap-1.5">
                {fp.labels.map((l, i) => (
                  <div key={i}><RadioGroupItem value={i.toString()} id={`fm-${fp.id}-${i}`} className="sr-only" />
                    <Label htmlFor={`fm-${fp.id}-${i}`} className={`text-[11px] px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all ${formaResp[fp.id] === i ? "bg-primary text-white border-primary" : "bg-card border-border hover:bg-muted"}`}>{l}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── 5. SATISFAÇÃO GERAL ── */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Smile className="w-4 h-4 text-primary" />
            Satisfação geral com a medicação
          </h3>
          <RadioGroup value={satisfacaoGeral?.toString()} onValueChange={v => setSatisfacaoGeral(parseInt(v))} className="flex flex-wrap gap-2">
            {satisfacaoLabels.map((l, i) => (
              <div key={i}><RadioGroupItem value={i.toString()} id={`sg-${i}`} className="sr-only" />
                <Label htmlFor={`sg-${i}`} className={`text-xs px-3 py-2 rounded-xl border cursor-pointer transition-all ${satisfacaoGeral === i ? "bg-primary text-white border-primary" : "bg-card border-border hover:bg-muted"}`}>{l}</Label>
              </div>
            ))}
          </RadioGroup>

          <p className="text-xs font-medium pt-2">Se pudesse, continuaria usando esta medicação?</p>
          <RadioGroup value={continuaria?.toString()} onValueChange={v => setContinuaria(parseInt(v))} className="flex flex-wrap gap-2">
            {["Não, de jeito nenhum", "Provavelmente não", "Talvez", "Provavelmente sim", "Com certeza sim"].map((l, i) => (
              <div key={i}><RadioGroupItem value={i.toString()} id={`ct-${i}`} className="sr-only" />
                <Label htmlFor={`ct-${i}`} className={`text-xs px-3 py-2 rounded-xl border cursor-pointer transition-all ${continuaria === i ? "bg-primary text-white border-primary" : "bg-card border-border hover:bg-muted"}`}>{l}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* ── 6. OBSERVAÇÕES LIVRES ── */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <h3 className="text-sm font-bold">Observações da família (livre)</h3>
          <Textarea value={obsLivre} onChange={e => setObsLivre(e.target.value)} placeholder="Algo que queira relatar sobre a medicação..." className="min-h-[80px] text-sm" />
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full" size="lg">
        {canSubmit ? "Ver Resultado" : "Preencha os itens obrigatórios"}
      </Button>
    </div>
  );
}

