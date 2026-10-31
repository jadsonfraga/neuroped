import { useEffect, useMemo, useState } from "react";
import TeaTimidezChapter from "@/components/biblioteca-clinica-tea-timidez";
import {
  ArrowRight, BookOpen, BrainCircuit, ChevronRight,
  CircleAlert, Clock3, FileText, Layers3, Lightbulb, LockKeyhole,
  Microscope, Search, ShieldCheck, Sparkles,
} from "lucide-react";
import {
  clinicalConditions, clinicalLibraryChapters, nextClinicalTopics,
  wiscCheckpoints, wiscFictionalCases, wiscIndices, wiscReferences,
  type WiscIndexKey,
} from "@/data/clinicalLibrary";

const indexTheme: Record<WiscIndexKey, { panel: string; ink: string; tile: string; progress: string }> = {
  ICV: { panel: "border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/40", ink: "text-sky-800 dark:text-sky-200", tile: "bg-sky-600", progress: "bg-sky-500" },
  IOP: { panel: "border-teal-200 bg-teal-50 dark:border-teal-900 dark:bg-teal-950/40", ink: "text-teal-800 dark:text-teal-200", tile: "bg-teal-600", progress: "bg-teal-500" },
  IMO: { panel: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40", ink: "text-amber-800 dark:text-amber-200", tile: "bg-amber-600", progress: "bg-amber-500" },
  IVP: { panel: "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40", ink: "text-rose-800 dark:text-rose-200", tile: "bg-rose-600", progress: "bg-rose-500" },
};

function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-black uppercase tracking-[.18em] text-teal-700 dark:text-teal-300">{children}</p>;
}

function SectionTitle({ id, number, title, summary }: { id: string; number: string; title: string; summary: string }) {
  return (
    <div id={id} className="scroll-mt-28 mb-6">
      <Kicker>ESTUDO WISC-IV <span aria-hidden="true">/</span> {number}</Kicker>
      <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">{summary}</p>
    </div>
  );
}

function SoftCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900 ${className}`}>{children}</div>;
}

function LearningMap() {
  return (
    <div className="relative overflow-hidden rounded-[1.6rem] bg-[#12253c] p-5 text-white sm:p-7">
      <div className="pointer-events-none absolute -right-16 -top-12 h-52 w-52 rounded-full border border-amber-200/20" />
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-amber-200">Mapa mental • 4 caminhos, 1 leitura integrada</p>
      <div className="mx-auto mt-5 max-w-xl">
        <div className="mx-auto w-fit rounded-2xl border border-amber-300/45 bg-amber-300/10 px-7 py-4 text-center">
          <span className="block text-xs uppercase tracking-widest text-amber-200">QI Total (QIT)</span>
          <strong className="mt-1 block text-xl">Síntese global</strong>
          <span className="mt-1 block text-xs text-slate-300">Não é média aritmética dos índices</span>
        </div>
        <div className="mx-auto h-7 w-px bg-amber-200/50" aria-hidden="true" />
        <div className="mx-auto h-px w-3/4 bg-amber-200/50" aria-hidden="true" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {wiscIndices.map((item) => (
            <div key={item.key} className="relative pt-5 text-center">
              <span className="absolute left-1/2 top-0 h-5 w-px bg-amber-200/50" aria-hidden="true" />
              <div className="h-full rounded-xl border border-white/15 bg-white/10 p-3">
                <strong className="block text-lg text-amber-200">{item.key}</strong>
                <span className="mt-1 block text-[11px] leading-5 text-slate-100">{item.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mx-auto mt-5 max-w-xl text-center text-xs leading-6 text-slate-300">
        Representação didática dos domínios. O QIT é calculado por normas dos subtestes centrais e requer interpretação psicométrica contextualizada.
      </p>
    </div>
  );
}

function IndexExplorer() {
  const [active, setActive] = useState<WiscIndexKey>("ICV");
  const selected = wiscIndices.find((item) => item.key === active) ?? wiscIndices[0];
  const theme = indexTheme[selected.key];
  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Escolha um dos quatro índices" className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {wiscIndices.map((item) => (
          <button type="button" key={item.key} role="tab" aria-selected={active === item.key}
            aria-controls="biblioteca-index-panel" id={`tab-${item.key}`}
            onClick={() => setActive(item.key)}
            className={`rounded-2xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${active === item.key ? `${indexTheme[item.key].panel} ring-2 ring-teal-600/30` : "border-slate-200 bg-white hover:border-teal-400 dark:border-slate-700 dark:bg-slate-900"}`}>
            <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-black text-white ${indexTheme[item.key].tile}`}>{item.key}</span>
            <span className="mt-3 block text-sm font-bold text-slate-900 dark:text-slate-100">{item.name}</span>
            <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{item.subtitle}</span>
          </button>
        ))}
      </div>
      <div id="biblioteca-index-panel" role="tabpanel" aria-labelledby={`tab-${active}`} className={`rounded-[1.4rem] border p-5 sm:p-7 ${theme.panel}`}>
        <Kicker>Leitura do índice {selected.key}</Kicker>
        <h3 className={`mt-2 font-serif text-2xl font-bold ${theme.ink}`}>{selected.short}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200"><strong>Pergunta clínica:</strong> {selected.question}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white/80 p-4 dark:bg-slate-950/60">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Subtestes principais</p>
            <p className="mt-2 text-sm font-semibold leading-7 text-slate-800 dark:text-slate-100">{selected.tests.join(" · ")}</p>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-300"><strong>Suplementares:</strong> {selected.additional.join(" · ")}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 dark:bg-slate-950/60">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">O que pode interferir?</p>
            <ul className="mt-3 space-y-2">{selected.confounders.map((line) => <li key={line} className="flex gap-2 text-sm text-slate-700 dark:text-slate-200"><span className="font-black text-amber-600">•</span>{line}</li>)}</ul>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-white/80 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-950/50">
          <div className="flex items-start gap-3"><Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-teal-700 dark:text-teal-300" /><p className="text-sm leading-7 text-slate-800 dark:text-slate-100"><strong>Na vida real:</strong> {selected.functional}</p></div>
          <div className="mt-3 flex items-start gap-3 border-t border-slate-200 pt-3 dark:border-slate-700"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" /><p className="text-sm leading-7 text-slate-800 dark:text-slate-100"><strong>Não concluir:</strong> {selected.never}</p></div>
        </div>
      </div>
    </div>
  );
}

function CaseDiagram({ scores }: { scores: { ICV: number; IOP: number; IMO: number; IVP: number } }) {
  return (
    <div className="space-y-3" aria-label="Exemplo de pontuações fictícias por índice">
      {wiscIndices.map((index) => (
        <div key={index.key} className="grid grid-cols-[44px_1fr_40px] items-center gap-3">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{index.key}</span>
          <div className="relative h-4 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700" aria-hidden="true">
            <div className={`h-full rounded-full ${indexTheme[index.key].progress}`} style={{ width: `${Math.max(0, Math.min(100, (scores[index.key] / 150) * 100))}%` }} />
            <span className="absolute bottom-0 top-0 left-[66.67%] w-px bg-slate-600/30" />
          </div>
          <strong className="text-right font-mono text-sm text-slate-800 dark:text-slate-100">{scores[index.key]}</strong>
        </div>
      ))}
      <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Exemplo sintético, sem QIT calculado. As barras apenas ilustram valores e não substituem tabelas normativas.</p>
    </div>
  );
}

function CasePractice() {
  const [selected, setSelected] = useState(0);
  const current = wiscFictionalCases[selected];
  return (
    <div className="grid gap-4 lg:grid-cols-[210px_1fr]">
      <div aria-label="Escolher caso fictício" className="space-y-2">
        {wiscFictionalCases.map((item, index) => (
          <button key={item.label} type="button" onClick={() => setSelected(index)} aria-pressed={selected === index}
            className={`w-full rounded-xl border p-4 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-teal-600 ${selected === index ? "border-teal-600 bg-teal-50 text-teal-900 dark:bg-teal-950 dark:text-teal-200" : "border-slate-200 bg-white text-slate-700 hover:border-teal-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"}`}>
            <strong className="block text-xs uppercase tracking-widest">{item.label}</strong>
            <span className="mt-1 block font-semibold">{item.title}</span>
          </button>
        ))}
      </div>
      <SoftCard>
        <p className="text-xs font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">Treino de raciocínio — dados fictícios</p>
        <h3 className="mt-2 font-serif text-xl font-bold text-slate-900 dark:text-slate-100">{current.title}</h3>
        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{current.observation}</p>
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70"><CaseDiagram scores={current.scores} /></div>
        <details className="group mt-4 rounded-xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-900 dark:bg-teal-950/30">
          <summary className="cursor-pointer font-semibold text-teal-950 dark:text-teal-100">Revelar a interpretação responsável <ChevronRight className="ml-1 inline h-4 w-4 transition group-open:rotate-90" /></summary>
          <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200">{current.interpret}</p>
          <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-200"><strong>Próximo passo:</strong> {current.next}</p>
        </details>
      </SoftCard>
    </div>
  );
}

function ReviewChecklist() {
  const [checked, setChecked] = useState<number[]>([]);
  const count = checked.length;
  return (
    <SoftCard>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-slate-50">Checklist antes de usar um laudo</h3>
        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-200">{count}/{wiscCheckpoints.length} verificados</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"><div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${(count / wiscCheckpoints.length) * 100}%` }} /></div>
      <div className="mt-5 space-y-2">
        {wiscCheckpoints.map((text, index) => (
          <label key={text} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
            <input type="checkbox" checked={checked.includes(index)} onChange={() => setChecked(prev => prev.includes(index) ? prev.filter(x => x !== index) : [...prev, index])} className="mt-1 h-4 w-4 accent-teal-700" />
            <span className="text-sm leading-6 text-slate-700 dark:text-slate-200">{text}</span>
          </label>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">Checklist local e educativo. Nenhuma marcação é salva em prontuário ou enviada ao servidor.</p>
    </SoftCard>
  );
}

export default function BibliotecaClinicaPage() {
  const [query, setQuery] = useState("");
  const entries = useMemo(() => clinicalLibraryChapters.filter(ch => (ch.title + " " + ch.subtitle + " " + ch.category).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())), [query]);
  const chapter = clinicalLibraryChapters.find(item => item.slug === "wisc-iv-interpretacao-neuropediatria") ?? clinicalLibraryChapters[0];
  useEffect(() => {
    const scrollToSelected = () => {
      const slug = new URLSearchParams(window.location.hash.split("?")[1] ?? "").get("capitulo");
      const target = slug === "tea-timidez-primeira-infancia" ? "capitulo-tea-timidez" : slug === "wisc-iv-interpretacao-neuropediatria" ? "capitulo-wisc" : null;
      if (target) requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ block: "start" }));
    };
    scrollToSelected();
    window.addEventListener("hashchange", scrollToSelected);
    return () => window.removeEventListener("hashchange", scrollToSelected);
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-3 pb-16 pt-3 sm:px-6 sm:pt-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-[#102438] p-6 text-white shadow-xl sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[50px] border-teal-400/10" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/25 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.16em] text-amber-200"><BookOpen className="h-4 w-4" /> NeuroPed · Academia clínica</div>
          <h1 className="mt-6 max-w-3xl font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Biblioteca de <span className="text-amber-200">Neuropediatria</span></h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">Uma coleção de capítulos clínicos ultradidáticos: mapas mentais, decisões práticas, casos de treinamento e referências rastreáveis.</p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-teal-500/20 px-3 py-2 text-teal-100"><Layers3 className="mr-1 inline h-4 w-4" /> Capítulos versionados</span>
            <span className="rounded-full bg-white/10 px-3 py-2 text-slate-100"><Microscope className="mr-1 inline h-4 w-4" /> Evidência e limites</span>
            <span className="rounded-full bg-white/10 px-3 py-2 text-slate-100"><ShieldCheck className="mr-1 inline h-4 w-4" /> Revisão médica</span>
          </div>
        </div>
      </div>

      <section aria-labelledby="catalog-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><Kicker>Estante de conhecimento</Kicker><h2 id="catalog-title" className="mt-1 font-serif text-2xl font-bold text-slate-900 dark:text-slate-100">Capítulos</h2></div>
          <label className="relative block w-full max-w-xs"><span className="sr-only">Buscar capítulos</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar assunto..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
        </div>
        <div className="grid gap-3">
          {entries.length === 0 && <p className="rounded-2xl border border-slate-200 p-6 text-sm text-slate-500">Nenhum capítulo encontrado.</p>}
          {entries.map((item) => (
            <a key={item.slug} href={`#/${"biblioteca-clinica"}?capitulo=${item.slug}`} onClick={(event) => { event.preventDefault(); window.history.replaceState(null, "", "#/biblioteca-clinica?capitulo=" + encodeURIComponent(item.slug)); document.getElementById(item.day === 1 ? "capitulo-tea-timidez" : "capitulo-wisc")?.scrollIntoView({ behavior: "smooth" }); }}
              className="group flex flex-col gap-4 rounded-[1.4rem] border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-teal-500 hover:shadow-md sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-900">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-2xl font-black text-teal-800 dark:bg-teal-950 dark:text-teal-200">{item.day ? String(item.day).padStart(2, "0") : "PRÉVIO"}</div>
              <div className="flex-1"><span className="text-[10px] font-black uppercase tracking-[.14em] text-teal-700 dark:text-teal-300">{item.category} · {item.date.split("-").reverse().join("/")}</span><h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{item.title}</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.subtitle}</p><div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><Clock3 className="h-3.5 w-3.5" /> {item.minutes} min de leitura <span aria-hidden="true">·</span> <span className="font-semibold text-amber-700 dark:text-amber-200">Revisão médica pendente</span></div></div>
              <ArrowRight className="hidden h-5 w-5 text-teal-700 sm:block" aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <TeaTimidezChapter />

      <article id="capitulo-wisc" aria-labelledby="wisc-title" className="scroll-mt-20 space-y-12">
        <header className="rounded-[1.5rem] border-l-4 border-amber-500 bg-amber-50 p-5 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-100"><LockKeyhole className="h-4 w-4" /> Rascunho científico • revisão médica pendente</div>
          <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-200">{chapter.review} Pesquisa Consensus solicitada em 28/10/2026, mas não executada por cota mensal esgotada. As referências foram verificadas em fontes públicas e estão listadas ao final.</p>
        </header>

        <div className="max-w-4xl">
          <Kicker>Estudo pré-existente · Neuropsicologia · {chapter.date.split("-").reverse().join("/")}</Kicker>
          <h2 id="wisc-title" className="mt-3 font-serif text-3xl font-bold leading-tight text-slate-950 sm:text-4xl dark:text-white">{chapter.title}</h2>
          <p className="mt-3 text-base leading-8 text-slate-600 dark:text-slate-300">{chapter.subtitle}. Um roteiro para interpretar um relatório sem transformar índices em diagnósticos.</p>
        </div>

        <LearningMap />

        <section>
          <SectionTitle id="fundamentos" number="01" title="Primeiro: o que o teste responde?" summary="O WISC-IV é uma escala individual padronizada de capacidade intelectual dos 6 anos aos 16 anos e 11 meses. Cada índice é um recorte do desempenho, não uma função cerebral pura." />
          <div className="grid gap-4 md:grid-cols-3">
            <SoftCard><BrainCircuit className="h-6 w-6 text-teal-600" /><h3 className="mt-3 font-bold text-slate-900 dark:text-white">QI Total (QIT)</h3><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">Síntese global calculada pelos subtestes principais. Não é a média dos quatro índices e pode esconder contrastes relevantes.</p></SoftCard>
            <SoftCard><Layers3 className="h-6 w-6 text-sky-600" /><h3 className="mt-3 font-bold text-slate-900 dark:text-white">IAG (GAI)</h3><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">Composto derivado de subtestes de ICV e IOP. Útil em casos selecionados; não é o “QI verdadeiro” nem substitui automaticamente o QIT.</p></SoftCard>
            <SoftCard><Sparkles className="h-6 w-6 text-amber-600" /><h3 className="mt-3 font-bold text-slate-900 dark:text-white">IPC (CPI)</h3><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">Integra subtestes de IMO e IVP, aproximando a eficiência em tarefas específicas; não mede todas as funções executivas.</p></SoftCard>
          </div>
          <p className="mt-3 text-xs leading-6 text-slate-500">A interpretação de IAG/IPC depende de normas e tabelas válidas para a adaptação usada. Não calcular somando escores ou transpondo tabelas estadunidenses para a versão brasileira.</p>
        </section>

        <section>
          <SectionTitle id="indices" number="02" title="Explore os quatro índices" summary="Selecione um domínio para compreender o que é medido, quais tarefas o compõem, o que interfere no resultado e o que não se pode diagnosticar." />
          <IndexExplorer />
        </section>

        <section>
          <SectionTitle id="discrepancias" number="03" title="Por que um índice baixo não fecha diagnóstico?" summary="Há uma diferença entre ser estatisticamente diferente, ser raro na população e explicar um prejuízo funcional real." />
          <div className="grid gap-3 md:grid-cols-3">
            {[["1", "Diferença confiável?", "Conferir erro de medida, intervalos de confiança e valor crítico."], ["2", "Diferença rara?", "Conferir taxa de base normativa, e não apenas significância."], ["3", "Diferença funcional?", "Comparar com história, contexto escolar e observação clínica."]].map(([n, heading, desc]) => (
              <SoftCard key={n}><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#102438] text-sm font-bold text-amber-200">{n}</span><h3 className="mt-3 font-bold text-slate-900 dark:text-slate-100">{heading}</h3><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{desc}</p></SoftCard>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100"><CircleAlert className="mr-2 inline h-4 w-4" /><strong>Alerta:</strong> uma fraqueza relativa pode ainda ser um desempenho dentro da média normativa. Diferenças entre subtestes isolados são menos robustas do que índices compostos.</div>
        </section>

        <section>
          <SectionTitle id="diagnosticos" number="04" title="À luz dos diagnósticos neuropediátricos" summary="A literatura identifica tendências em grupos, com ampla sobreposição entre indivíduos. Um perfil do WISC-IV não confirma nem exclui doenças do neurodesenvolvimento." />
          <div className="grid gap-3 md:grid-cols-2">
            {clinicalConditions.map(condition => (
              <details key={condition.name} className="group rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                  <span><span className="block text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">{condition.evidence}</span><strong className="mt-1 block text-base text-slate-900 dark:text-white">{condition.name}</strong><span className="mt-2 block text-sm leading-6 text-slate-600 dark:text-slate-300">{condition.impact}</span></span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-teal-700 transition group-open:rotate-90" />
                </summary>
                <div className="mt-4 border-t border-slate-200 pt-4 text-sm leading-7 dark:border-slate-700"><p className="text-slate-700 dark:text-slate-200"><strong>Investigar:</strong> {condition.investigate}</p><p className="mt-2 font-medium text-rose-800 dark:text-rose-200"><strong>Limite:</strong> {condition.caveat}</p></div>
              </details>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle id="casos" number="05" title="Treine seu raciocínio" summary="Perfis artificiais, exclusivamente pedagógicos. Observe os quatro números e só depois revele a interpretação e os próximos passos." />
          <CasePractice />
        </section>

        <section>
          <SectionTitle id="checklist" number="06" title="Leitura clínica de laudos: oito verificações" summary="O neuropediatra integra o relatório psicológico à história do desenvolvimento, exame médico e funcionalidade. Os itens abaixo organizam essa leitura." />
          <ReviewChecklist />
        </section>

        <section>
          <SectionTitle id="fontes" number="07" title="Fontes, método e limites da evidência" summary="Links diretos para conferência. Este capítulo não contém itens restritos, tabelas proprietárias de conversão ou perfis diagnósticos automáticos." />
          <SoftCard>
            <ol className="space-y-4">{wiscReferences.map((source, i) => (
              <li key={source.id} className="flex gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0 dark:border-slate-800"><span className="text-sm font-bold text-teal-700 dark:text-teal-300">{String(i + 1).padStart(2, "0")}</span><div className="min-w-0"><a href={source.url} rel="noopener noreferrer" target="_blank" className="font-semibold leading-6 text-slate-900 underline decoration-teal-400 underline-offset-4 hover:text-teal-700 dark:text-slate-100">{source.title} ({source.year})</a><p className="mt-1 text-xs leading-6 text-slate-600 dark:text-slate-300">{source.note}</p></div></li>
            ))}</ol>
            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><ShieldCheck className="mr-1 inline h-4 w-4" /> A interpretação psicométrica formal é atribuição do profissional habilitado. Consulte a situação atual do instrumento no SATEPSI. Este capítulo é leitura de apoio, não manual de aplicação.</div>
          </SoftCard>
        </section>

        <section className="rounded-[1.6rem] bg-[#12253c] p-6 text-white sm:p-8">
          <Kicker>Conclusão que fica</Kicker>
          <blockquote className="mt-3 font-serif text-xl leading-9 sm:text-2xl">“O gráfico ajuda a formular perguntas. O diagnóstico exige história, critérios clínicos e funcionalidade.”</blockquote>
          <p className="mt-4 text-sm leading-7 text-slate-300">Em crianças com potencial de raciocínio preservado e eficiência reduzida, a intervenção deve mirar as barreiras demonstradas — não um rótulo inferido do índice.</p>
        </section>
      </article>

      <section aria-labelledby="future-topics" className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-teal-700 dark:text-teal-300" /><h2 id="future-topics" className="font-serif text-xl font-bold text-slate-900 dark:text-white">Próximos temas na pauta editorial</h2></div>
        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">A sequência abaixo segue o índice canônico de 365 perguntas. Conteúdos educacionais podem ser exibidos como material em revisão médica; somente o aceite médico explícito autoriza classificá-los como validados clinicamente.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">{nextClinicalTopics.slice(0, 6).map((topic, i) => <div key={topic} className="flex items-start gap-3 rounded-xl bg-white p-3 dark:bg-slate-800"><span className="text-xs font-bold text-teal-700 dark:text-teal-300">{String(i + 2).padStart(2, "0")}</span><span className="text-sm text-slate-800 dark:text-slate-200">{topic}</span></div>)}</div>
      </section>
      <p className="text-center text-xs text-slate-500">Biblioteca clínica NeuroPed · Conteúdo educacional sujeito à revisão médica · 29/10/2026</p>
    </div>
  );
}
