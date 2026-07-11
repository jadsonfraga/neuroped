import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  FlaskConical,
  Lightbulb,
  Scale,
  Search,
  ShieldCheck,
} from "lucide-react";

const modules = [
  { icon: BookOpen, title: "Evidências", text: "PubMed, Cochrane, diretrizes e rastreabilidade das fontes.", status: "Conector planejado" },
  { icon: Brain, title: "Memória clínica", text: "Padrões de decisões previamente validadas pelo médico, sem aprendizado automático oculto.", status: "Consentimento obrigatório" },
  { icon: BarChart3, title: "Casuística", text: "Análises agregadas e anonimizadas de perfis, escalas, condutas e desfechos.", status: "Modelo de dados" },
  { icon: Scale, title: "Contraditório", text: "Achados a favor, contra, hipóteses alternativas, vieses e lacunas críticas.", status: "MVP funcional" },
  { icon: Search, title: "Consistência", text: "Confronta história, exame, instrumentos, hipóteses, CID e conduta.", status: "MVP funcional" },
  { icon: Lightbulb, title: "Pesquisa e inovação", text: "Transforma padrões clínicos em perguntas auditáveis, projetos e hipóteses de estudo.", status: "Roadmap" },
];

type AuditItem = {
  label: string;
  state: "ok" | "warning";
  detail: string;
};

function buildAudit(text: string): AuditItem[] {
  const normalized = text.toLowerCase();
  const enoughContext = text.trim().length >= 300;
  const hasTimeline = /(desde|início|evolu|meses|anos|semanas|dias)/i.test(text);
  const hasFunction = /(escola|familiar|social|funcional|aprendiz|autonomia)/i.test(text);
  const hasExam = /(exame|observa|consulta|neurológico|comportamento)/i.test(text);
  const hasInstrument = /(m-chat|ados|snap|vineland|wisc|escala|instrumento)/i.test(text);
  const categorical = /(diagnóstico fechado|com certeza|definitivamente|sem dúvida)/i.test(text);
  const hasDifferential = /(diferencial|alternativa|versus|descartar|investigar)/i.test(text);
  const hasMedication = /(mg|ml|medicação|medicamento|dose|risperidona|atomoxetina|lamotrigina|clobazam|sertralina)/i.test(text);
  const hasWeight = /(peso|kg)/i.test(text);

  return [
    { label: "Contexto clínico suficiente", state: enoughContext ? "ok" : "warning", detail: enoughContext ? "Há material mínimo para revisão estrutural." : "Texto curto; risco elevado de inferência indevida." },
    { label: "Linha temporal", state: hasTimeline ? "ok" : "warning", detail: hasTimeline ? "Há marcadores de início ou evolução." : "Falta cronologia clara dos sintomas." },
    { label: "Impacto funcional", state: hasFunction ? "ok" : "warning", detail: hasFunction ? "Há referência ao funcionamento cotidiano." : "Descrever repercussão escolar, familiar, social e autonomia." },
    { label: "Exame ou observação clínica", state: hasExam ? "ok" : "warning", detail: hasExam ? "Achados observacionais foram identificados." : "Separar relato de terceiros dos achados observados pelo médico." },
    { label: "Instrumentos e fontes", state: hasInstrument ? "ok" : "warning", detail: hasInstrument ? "Há menção a instrumento ou escala." : "Registrar instrumentos, informantes, data e limitações." },
    { label: "Linguagem diagnóstica prudente", state: categorical ? "warning" : "ok", detail: categorical ? "Detectada formulação categórica; revisar base e grau de certeza." : "Não foram detectadas afirmações excessivamente categóricas." },
    { label: "Diagnósticos diferenciais", state: hasDifferential ? "ok" : "warning", detail: hasDifferential ? "Há hipótese alternativa ou estratégia de exclusão." : "Adicionar diferenciais e evidências que os favorecem ou enfraquecem." },
    { label: "Segurança farmacológica básica", state: !hasMedication || hasWeight ? "ok" : "warning", detail: !hasMedication ? "Nenhuma conduta farmacológica detectada." : hasWeight ? "Medicação e peso aparecem no texto; ainda requer conferência médica." : "Há medicação, mas não foi identificado peso; não calcular nem validar dose." },
  ];
}

export default function NeuroPedIntelligencePage() {
  const [caseText, setCaseText] = useState("");
  const [audited, setAudited] = useState(false);
  const audit = useMemo(() => buildAudit(caseText), [caseText]);
  const warnings = audit.filter((item) => item.state === "warning").length;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ShieldCheck className="h-4 w-4" /> Apoio à decisão · supervisão humana
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">NeuroPed Intelligence</h1>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Ambiente clínico para revisar coerência, desafiar hipóteses, organizar evidências e transformar dados anonimizados em aprendizado auditável. Não fecha diagnóstico, não prescreve e não substitui avaliação médica.
            </p>
          </div>
          <div className="rounded-2xl border bg-muted/40 p-4 text-sm lg:max-w-sm">
            <p className="font-semibold">Regra central</p>
            <p className="mt-1 text-muted-foreground">Toda sugestão deve mostrar origem, incerteza, limitações e decisão final registrada pelo profissional.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map(({ icon: Icon, title, text, status }) => (
          <article key={title} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-xl border bg-muted/50 p-2.5"><Icon className="h-5 w-5" /></div>
              <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">{status}</span>
            </div>
            <h2 className="mt-4 font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-5 w-5" />
            <div>
              <h2 className="font-semibold">Auditoria clínica inicial</h2>
              <p className="text-sm text-muted-foreground">Cole apenas conteúdo anonimizado. Esta versão faz checagem estrutural local, sem enviar dados a serviços externos.</p>
            </div>
          </div>
          <textarea
            value={caseText}
            onChange={(event) => { setCaseText(event.target.value); setAudited(false); }}
            placeholder="Cole história, exame, escalas, hipóteses e conduta sem nome, telefone, endereço, CPF ou outros identificadores..."
            className="mt-5 min-h-72 w-full resize-y rounded-2xl border bg-background p-4 text-sm leading-6 outline-none ring-offset-background focus:ring-2 focus:ring-ring"
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{caseText.length} caracteres · processamento local no navegador</p>
            <button
              type="button"
              onClick={() => setAudited(true)}
              disabled={!caseText.trim()}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Executar auditoria
            </button>
          </div>
        </article>

        <aside className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Resultado</h2>
            {audited && <span className="rounded-full border px-3 py-1 text-xs">{warnings} alerta(s)</span>}
          </div>
          {!audited ? (
            <div className="mt-6 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              A auditoria aparecerá aqui após a análise.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {audit.map((item) => (
                <div key={item.label} className="rounded-2xl border p-4">
                  <div className="flex gap-3">
                    {item.state === "ok" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />}
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
