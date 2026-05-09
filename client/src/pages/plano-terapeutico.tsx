import { useState } from "react";
import {
  Target, Users, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft,
  Printer, Mail, RotateCcw, FileText, Info, Stethoscope, Star,
  Baby, Brain, ChevronDown, ChevronUp, Plus, Trash2, ClipboardList
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import childAssessmentImg from "@assets/images/child-assessment.png";
import { apiRequest } from "@/lib/queryClient";

const EMAIL_TO = "jadsonfraga@hotmail.com";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PatientData {
  name: string;
  age: string;
  diagnosis: string;
}

interface AreaPlan {
  area: string;
  profissional: string;
  objetivos: string;
  estrategias: string;
  frequencia: string;
  avaliacao: string;
  prazo: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const AREAS = [
  "Linguagem",
  "Cognição",
  "Comportamento",
  "Socialização",
  "Aprendizagem",
  "Motricidade",
  "Regulação Emocional",
  "Autonomia / AVDs",
  "Integração Sensorial",
];

const PROFISSIONAIS = [
  "Fonoaudiólogo(a)",
  "Psicólogo(a)",
  "Neuropsicólogo(a)",
  "Psicopedagogo(a)",
  "Terapeuta Ocupacional",
  "Fisioterapeuta",
  "Médico(a)",
];

const FREQUENCIAS = [
  "1x/semana",
  "2x/semana",
  "3x/semana",
  "Quinzenal",
  "Mensal",
];

const PRAZOS = [
  "3 meses",
  "6 meses",
  "1 ano",
];

// ─── Example PTI ───────────────────────────────────────────────────────────────

const examplePTI = {
  patient: { name: "Paciente Exemplo (TEA, 7 anos)", age: "7 anos", diagnosis: "Transtorno do Espectro Autista (F84.0)" },
  areas: [
    {
      area: "Linguagem",
      profissional: "Fonoaudiólogo(a)",
      objetivos: "Ampliar vocabulário funcional; desenvolver linguagem pragmática e uso social da comunicação; reduzir ecolalia não-funcional",
      estrategias: "Sessões de habilidades de comunicação aumentativa e alternativa (CAA); narrativas estruturadas; treinamento de turnos comunicativos; uso de pranchas de comunicação",
      frequencia: "2x/semana",
      avaliacao: "Registro em portfólio comunicativo; análise de amostras de linguagem (MLU); aplicação da ABFW a cada 6 meses",
      prazo: "6 meses",
    },
    {
      area: "Socialização",
      profissional: "Psicólogo(a)",
      objetivos: "Desenvolver habilidades de teoria da mente (ToM) básica; treinar reconhecimento de emoções; melhorar interação com pares em brincadeiras estruturadas",
      estrategias: "Grupo de habilidades sociais; jogos cooperativos supervisionados; histórias sociais (Social Stories™); treino de reconhecimento facial de emoções",
      frequencia: "2x/semana",
      avaliacao: "Escala de Habilidades Sociais para Crianças (SSRS-BR); feedback dos pais mensalmente; observação em contexto grupal",
      prazo: "6 meses",
    },
    {
      area: "Aprendizagem",
      profissional: "Psicopedagogo(a)",
      objetivos: "Consolidar consciência fonológica; desenvolver leitura de palavras di e trissílabas; trabalhar sequência numérica até 100",
      estrategias: "Método fônico com apoio visual; uso de alfabeto móvel e jogos de rima; manipulativos matemáticos; rotina estruturada com apoio visual (agenda pictográfica)",
      frequencia: "2x/semana",
      avaliacao: "Análise de portfólio escolar mensal; protocolo CONFIAS de consciência fonológica; parceria com professora da escola",
      prazo: "6 meses",
    },
    {
      area: "Integração Sensorial",
      profissional: "Terapeuta Ocupacional",
      objetivos: "Ampliar tolerância sensorial (tátil e vestibular); melhorar motricidade fina para escrita; promover autorregulação sensorial no contexto escolar",
      estrategias: "Dieta sensorial individualizada; atividades de input proprioceptivo e vestibular controlado; treino de coordenação fina (pinça, tesoura, escrita); orientação à família sobre estratégias em casa",
      frequencia: "2x/semana",
      avaliacao: "Perfil Sensorial 2 (Dunn) a cada 6 meses; diário de autorregulação preenchido pelos pais; observação da qualidade gráfica",
      prazo: "6 meses",
    },
  ],
};

// ─── Email send helper ──────────────────────────────────────────────────────────

async function sendPtiEmail(
  patient: PatientData,
  areas: AreaPlan[],
  setSent: (v: boolean) => void,
  toast: (opts: any) => void
) {
  const dateStr = new Date().toLocaleDateString("pt-BR");
  const subject = `[NeuroPed] Plano Terapêutico (PTI) — ${patient.name} — ${dateStr}`;

  let body = `PLANO TERAPÊUTICO INDIVIDUALIZADO\n`;
  body += `Elaborado com suporte do NeuroPed — Dr. Jadson Fraga Araújo Júnior\n`;
  body += `Data: ${dateStr}\n\n`;
  body += `DADOS DO PACIENTE\n`;
  body += `Nome/Iniciais: ${patient.name}\n`;
  body += `Idade: ${patient.age}\n`;
  body += `Diagnóstico/Hipótese: ${patient.diagnosis}\n\n`;
  body += `ÁREAS E PLANOS TERAPÊUTICOS\n\n`;

  areas.forEach((a, i) => {
    body += `${i + 1}. ${a.area.toUpperCase()}\n`;
    body += `   Profissional responsável: ${a.profissional}\n`;
    body += `   Objetivos: ${a.objetivos}\n`;
    body += `   Estratégias: ${a.estrategias}\n`;
    body += `   Frequência: ${a.frequencia}\n`;
    body += `   Método de avaliação: ${a.avaliacao}\n`;
    body += `   Prazo: ${a.prazo}\n\n`;
  });

  body += `\n— Dr. Jadson Fraga Araújo Júnior — Neuropediatra`;

  try {
    const res = await apiRequest("POST", "/api/send-report", { subject, body });
    if (res.ok) {
      setSent(true);
      toast({ title: "✉️ Enviado", description: `PTI enviado para ${EMAIL_TO}` });
      return;
    }
  } catch { }

  try {
    const truncated = body.length > 1800 ? body.slice(0, 1800) + "\n\n[...PTI truncado — use Imprimir para versão completa]" : body;
    const mailtoUrl = `mailto:${EMAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(truncated)}`;
    window.open(mailtoUrl, "_blank");
    setSent(true);
    toast({ title: "✉️ Email aberto", description: "Seu app de email foi aberto com o PTI." });
  } catch {
    toast({ title: "Use Imprimir", description: "Não foi possível enviar. Use o botão Imprimir para salvar o PTI.", variant: "destructive" });
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, color }: { icon: any; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-5 h-5 ${color}`} />
      <h2 className={`text-sm font-bold uppercase tracking-wider ${color}`}>{title}</h2>
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">{placeholder || "Selecione..."}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
      />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function PlanoTerapeuticoPage() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [emailSent, setEmailSent] = useState(false);

  // Step 1: patient data
  const [patient, setPatient] = useState<PatientData>({ name: "", age: "", diagnosis: "" });

  // Step 2: selected areas
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  // Step 3: plans for each area
  const [areaPlans, setAreaPlans] = useState<Record<string, AreaPlan>>({});

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const updateAreaPlan = (area: string, field: keyof AreaPlan, value: string) => {
    setAreaPlans((prev) => ({
      ...prev,
      [area]: { ...(prev[area] || { area, profissional: "", objetivos: "", estrategias: "", frequencia: "", avaliacao: "", prazo: "" }), [field]: value },
    }));
  };

  const getAreaPlan = (area: string): AreaPlan =>
    areaPlans[area] || { area, profissional: "", objetivos: "", estrategias: "", frequencia: "", avaliacao: "", prazo: "" };

  const completedPlans = selectedAreas.map(getAreaPlan);

  const handlePrint = () => {
    const dateStr = new Date().toLocaleDateString("pt-BR");
    const content = `
      <html>
      <head>
        <title>Plano Terapêutico Individualizado — ${patient.name}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11pt; margin: 2cm; color: #1a1a1a; }
          h1 { font-size: 14pt; text-align: center; margin-bottom: 4px; color: #064e3b; }
          .subtitle { text-align: center; font-size: 10pt; color: #555; margin-bottom: 16px; }
          .section { margin-bottom: 16px; }
          .section-title { font-size: 12pt; font-weight: bold; border-bottom: 2px solid #064e3b; padding-bottom: 4px; margin-bottom: 8px; color: #064e3b; }
          .patient-info { background: #f0fdf4; padding: 10px; border-radius: 6px; margin-bottom: 16px; }
          .patient-info p { margin: 3px 0; font-size: 10pt; }
          table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-top: 8px; }
          th { background: #064e3b; color: white; padding: 6px 8px; text-align: left; }
          td { padding: 6px 8px; border-bottom: 1px solid #d1fae5; vertical-align: top; }
          tr:nth-child(even) { background: #f0fdf4; }
          .footer { margin-top: 32px; text-align: center; font-size: 9pt; color: #555; border-top: 1px solid #ccc; padding-top: 8px; }
        </style>
      </head>
      <body>
        <h1>PLANO TERAPÊUTICO INDIVIDUALIZADO</h1>
        <p class="subtitle">NeuroPed — Dr. Jadson Fraga Araújo Júnior — Neuropediatra</p>
        <p class="subtitle">Data de elaboração: ${dateStr}</p>
        <div class="patient-info">
          <p><strong>Paciente:</strong> ${patient.name}</p>
          <p><strong>Idade:</strong> ${patient.age}</p>
          <p><strong>Diagnóstico / Hipótese:</strong> ${patient.diagnosis}</p>
        </div>
        <div class="section">
          <p class="section-title">Plano por Área Terapêutica</p>
          <table>
            <thead>
              <tr>
                <th>Área</th>
                <th>Profissional</th>
                <th>Objetivos</th>
                <th>Estratégias</th>
                <th>Frequência</th>
                <th>Avaliação</th>
                <th>Prazo</th>
              </tr>
            </thead>
            <tbody>
              ${completedPlans.map((p) => `
                <tr>
                  <td><strong>${p.area}</strong></td>
                  <td>${p.profissional}</td>
                  <td>${p.objetivos}</td>
                  <td>${p.estrategias}</td>
                  <td>${p.frequencia}</td>
                  <td>${p.avaliacao}</td>
                  <td>${p.prazo}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        <div class="footer">
          Dr. Jadson Fraga Araújo Júnior — Neuropediatra<br/>
          Documento gerado pelo NeuroPed — Ferramenta de apoio clínico
        </div>
      </body>
      </html>
    `;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(content);
      win.document.close();
      win.focus();
      win.print();
    }
  };

  const handleReset = () => {
    setStep(1);
    setPatient({ name: "", age: "", diagnosis: "" });
    setSelectedAreas([]);
    setAreaPlans({});
    setEmailSent(false);
  };

  return (
    <div className="space-y-8" data-testid="plano-terapeutico-page">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 via-pink-600 to-fuchsia-700 p-6 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="relative flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg flex-shrink-0">
            <Target className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-2 min-w-0">
            <h1 className="text-xl font-bold leading-tight">
              Plano Terapêutico Individualizado — Dr. Jadson
            </h1>
            <p className="text-white/80 text-sm leading-relaxed">
              Ferramenta interativa para construir o PTI multiprofissional do paciente
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge className="bg-white/20 text-white border-white/30 text-xs">Ferramenta</Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-xs">Gera PDF</Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-xs">Envia por Email</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ── ASSESSMENT IMAGE ── */}
      <div className="w-full h-48 rounded-2xl overflow-hidden mb-6 shadow-lg">
        <img src={childAssessmentImg} alt="" className="w-full h-full object-cover" />
      </div>

      {/* ── SEÇÃO 1: O QUE É O PTI ── */}
      <section className="space-y-3">
        <SectionHeader icon={ClipboardList} title="O Que É o Plano Terapêutico Individualizado" color="text-rose-600 dark:text-rose-400" />

        <Card className="border-card-border">
          <CardContent className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              O <strong className="text-foreground">Plano Terapêutico Individualizado (PTI)</strong> é um conjunto documentado, integrado e individualizado de alternativas terapêuticas que envolve toda a equipe multidisciplinar. Sua elaboração responde à pergunta fundamental:
            </p>
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 p-4 text-center">
              <p className="text-sm font-semibold text-rose-800 dark:text-rose-300 italic">
                "O que queremos e podemos fazer para este paciente?"
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-start gap-3 rounded-xl bg-muted/30 p-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <Users className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">1º Pilar: Construção em Equipe</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">O PTI é elaborado coletivamente. Cada profissional contribui com sua área de expertise, e as metas são discutidas e pactuadas entre a equipe — nunca impostas unilateralmente.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-muted/30 p-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">2º Pilar: Intervenção Precoce</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Quanto mais cedo o PTI é elaborado e iniciado, maior é o potencial de neuroplasticidade e de impacto positivo no desenvolvimento. A janela de oportunidade terapêutica é mais ampla nos primeiros anos de vida.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-muted/30 p-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Target className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">3º Pilar: Abordagem Multidisciplinar</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">Cada área terapêutica tem objetivos específicos, mas todos convergem para um mesmo propósito: maximizar a funcionalidade, a autonomia e a qualidade de vida do paciente e sua família.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── SEÇÃO 2: FORMULÁRIO INTERATIVO ── */}
      <section className="space-y-3">
        <SectionHeader icon={Target} title="Construtor de PTI — Passo a Passo" color="text-pink-600 dark:text-pink-400" />

        {/* Progress */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${s <= step ? "bg-rose-500 text-white" : "bg-muted text-muted-foreground"}`}>
                {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 4 && <div className={`h-1 flex-1 rounded-full transition-colors ${s < step ? "bg-rose-500" : "bg-muted"}`} />}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
          <span>Paciente</span>
          <span>Áreas</span>
          <span>Planos</span>
          <span>Revisão</span>
        </div>

        <Card className="border-card-border">
          <CardContent className="p-5 space-y-4">

            {/* STEP 1: Patient data */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">Dados do Paciente</p>
                <p className="text-xs text-muted-foreground">Use iniciais ou pseudônimo para preservar a privacidade. Nenhum dado é salvo no servidor.</p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Nome / Iniciais *</label>
                    <Input
                      placeholder="Ex: M.S. ou João (iniciais)"
                      value={patient.name}
                      onChange={(e) => setPatient((p) => ({ ...p, name: e.target.value }))}
                      data-testid="input-patient-name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Idade *</label>
                    <Input
                      placeholder="Ex: 7 anos 4 meses"
                      value={patient.age}
                      onChange={(e) => setPatient((p) => ({ ...p, age: e.target.value }))}
                      data-testid="input-patient-age"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Diagnóstico / Hipótese Diagnóstica *</label>
                    <Input
                      placeholder="Ex: TEA, TDAH, Dislexia, DI, etc."
                      value={patient.diagnosis}
                      onChange={(e) => setPatient((p) => ({ ...p, diagnosis: e.target.value }))}
                      data-testid="input-patient-diagnosis"
                    />
                  </div>
                </div>
                <Button
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white"
                  onClick={() => setStep(2)}
                  disabled={!patient.name || !patient.age || !patient.diagnosis}
                  data-testid="button-step1-next"
                >
                  Próximo: Selecionar Áreas <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            {/* STEP 2: Select areas */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">Selecione as Áreas em Necessidade</p>
                <p className="text-xs text-muted-foreground">Marque todas as áreas que precisam de intervenção terapêutica para {patient.name}.</p>
                <div className="grid grid-cols-1 gap-2">
                  {AREAS.map((area) => {
                    const selected = selectedAreas.includes(area);
                    return (
                      <button
                        key={area}
                        onClick={() => toggleArea(area)}
                        data-testid={`checkbox-area-${area}`}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${selected ? "border-rose-400 dark:border-rose-500 bg-rose-50 dark:bg-rose-950/20" : "border-border bg-card hover:border-rose-300 dark:hover:border-rose-700"}`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? "border-rose-500 bg-rose-500" : "border-muted-foreground"}`}>
                          {selected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className={`text-sm font-medium ${selected ? "text-rose-700 dark:text-rose-300" : "text-foreground"}`}>{area}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1" data-testid="button-step2-back">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                  </Button>
                  <Button
                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
                    onClick={() => setStep(3)}
                    disabled={selectedAreas.length === 0}
                    data-testid="button-step2-next"
                  >
                    Próximo: Preencher Planos <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Fill plans for each area */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">Plano por Área ({selectedAreas.length} áreas selecionadas)</p>
                <Accordion type="multiple" className="space-y-2">
                  {selectedAreas.map((area) => {
                    const plan = getAreaPlan(area);
                    return (
                      <AccordionItem key={area} value={area} className="border border-border rounded-xl px-4 overflow-hidden">
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                            <span className="text-sm font-semibold text-foreground">{area}</span>
                            {plan.profissional && (
                              <Badge variant="outline" className="text-xs">{plan.profissional}</Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3 pb-4">
                          <SelectField
                            label="Profissional Responsável"
                            value={plan.profissional}
                            onChange={(v) => updateAreaPlan(area, "profissional", v)}
                            options={PROFISSIONAIS}
                          />
                          <TextareaField
                            label="Objetivos Terapêuticos"
                            value={plan.objetivos}
                            onChange={(v) => updateAreaPlan(area, "objetivos", v)}
                            placeholder="O que se espera alcançar nesta área?"
                          />
                          <TextareaField
                            label="Estratégias / Abordagens"
                            value={plan.estrategias}
                            onChange={(v) => updateAreaPlan(area, "estrategias", v)}
                            placeholder="Quais técnicas, métodos ou atividades serão utilizados?"
                          />
                          <SelectField
                            label="Frequência das Sessões"
                            value={plan.frequencia}
                            onChange={(v) => updateAreaPlan(area, "frequencia", v)}
                            options={FREQUENCIAS}
                          />
                          <TextareaField
                            label="Método de Avaliação do Progresso"
                            value={plan.avaliacao}
                            onChange={(v) => updateAreaPlan(area, "avaliacao", v)}
                            placeholder="Como será monitorado o progresso? Instrumentos, portfólio, observação..."
                          />
                          <SelectField
                            label="Prazo para Reavaliação"
                            value={plan.prazo}
                            onChange={(v) => updateAreaPlan(area, "prazo", v)}
                            options={PRAZOS}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1" data-testid="button-step3-back">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                  </Button>
                  <Button
                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
                    onClick={() => setStep(4)}
                    data-testid="button-step3-next"
                  >
                    Revisar PTI <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: Review */}
            {step === 4 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-foreground">Revisão do Plano Terapêutico</p>

                {/* Patient summary */}
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 p-4 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paciente</p>
                  <p className="text-sm font-bold text-foreground">{patient.name}</p>
                  <p className="text-xs text-muted-foreground">{patient.age} • {patient.diagnosis}</p>
                </div>

                {/* Area plans summary */}
                <div className="space-y-2">
                  {completedPlans.map((plan) => (
                    <div key={plan.area} className="rounded-xl border border-border bg-card p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-bold text-foreground">{plan.area}</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {plan.profissional && <Badge variant="outline" className="text-xs">{plan.profissional}</Badge>}
                          {plan.frequencia && <Badge variant="outline" className="text-xs text-rose-600 dark:text-rose-400">{plan.frequencia}</Badge>}
                          {plan.prazo && <Badge variant="outline" className="text-xs">{plan.prazo}</Badge>}
                        </div>
                      </div>
                      {plan.objetivos && (
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase">Objetivos</p>
                          <p className="text-xs text-foreground">{plan.objetivos}</p>
                        </div>
                      )}
                      {plan.estrategias && (
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase">Estratégias</p>
                          <p className="text-xs text-muted-foreground">{plan.estrategias}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handlePrint}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    data-testid="button-print-pti"
                  >
                    <Printer className="w-4 h-4 mr-1" /> Imprimir / PDF
                  </Button>
                  <Button
                    onClick={() => sendPtiEmail(patient, completedPlans, setEmailSent, toast)}
                    variant="outline"
                    disabled={emailSent}
                    data-testid="button-email-pti"
                  >
                    <Mail className="w-4 h-4 mr-1" /> {emailSent ? "Enviado!" : "Enviar Email"}
                  </Button>
                </div>
                <Button variant="ghost" onClick={handleReset} className="w-full text-muted-foreground" data-testid="button-reset-pti">
                  <RotateCcw className="w-4 h-4 mr-1" /> Novo Plano
                </Button>
              </div>
            )}

          </CardContent>
        </Card>
      </section>

      {/* ── SEÇÃO 3: MODELO DE REFERÊNCIA ── */}
      <section className="space-y-3">
        <SectionHeader icon={Star} title="Modelo de Referência — PTI para TEA (7 anos)" color="text-violet-600 dark:text-violet-400" />

        <div className="rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-violet-800 dark:text-violet-300 leading-relaxed">
            Exemplo de PTI completo para uma criança com TEA de 7 anos, com quatro profissionais envolvidos. Use como referência para estruturar seus próprios planos.
          </p>
        </div>

        <Card className="border-card-border">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Paciente</p>
            <p className="text-sm font-bold text-foreground">{examplePTI.patient.name}</p>
            <p className="text-xs text-muted-foreground">{examplePTI.patient.age} • {examplePTI.patient.diagnosis}</p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {examplePTI.areas.map((area, i) => {
            const colors = [
              { bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-200 dark:border-blue-800/40", accent: "bg-blue-500", text: "text-blue-700 dark:text-blue-300" },
              { bg: "bg-rose-50 dark:bg-rose-950/20", border: "border-rose-200 dark:border-rose-800/40", accent: "bg-rose-500", text: "text-rose-700 dark:text-rose-300" },
              { bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-800/40", accent: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" },
              { bg: "bg-teal-50 dark:bg-teal-950/20", border: "border-teal-200 dark:border-teal-800/40", accent: "bg-teal-500", text: "text-teal-700 dark:text-teal-300" },
            ];
            const c = colors[i % colors.length];
            return (
              <Card key={area.area} className={`border ${c.border} ${c.bg} overflow-hidden`}>
                <div className={`h-1 w-full ${c.accent}`} />
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className={`text-sm font-bold ${c.text}`}>{area.area}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-xs">{area.profissional}</Badge>
                      <Badge variant="outline" className="text-xs">{area.frequencia}</Badge>
                      <Badge variant="outline" className="text-xs">{area.prazo}</Badge>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="font-semibold text-foreground">Objetivos</p>
                      <p className="text-muted-foreground leading-relaxed">{area.objetivos}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Estratégias</p>
                      <p className="text-muted-foreground leading-relaxed">{area.estrategias}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Método de Avaliação</p>
                      <p className="text-muted-foreground leading-relaxed">{area.avaliacao}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── DISCLAIMER ── */}
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Aviso:</strong> Esta ferramenta é um auxílio para construção do PTI — não substitui a elaboração formal com a equipe terapêutica. O plano gerado deve ser discutido, validado e assinado por todos os profissionais envolvidos antes de ser compartilhado com a família.
          </p>
        </div>
      </div>

    </div>
  );
}
