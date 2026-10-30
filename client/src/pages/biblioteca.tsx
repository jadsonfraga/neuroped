import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Eye,
  Gauge,
  Layers3,
  Lightbulb,
  Link2,
  MessageSquareText,
  Route,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getDailyFeaturedChapter,
  neuropedLibraryChapters,
  type LibraryReference,
  type WiscIndexGuide,
} from "@/data/neuropedLibrary";

const chapter = getDailyFeaturedChapter();

const indexTone: Record<
  WiscIndexGuide["tone"],
  {
    border: string;
    bg: string;
    text: string;
    soft: string;
    dot: string;
  }
> = {
  indigo: {
    border: "border-indigo-200 dark:border-indigo-900/70",
    bg: "bg-indigo-600",
    text: "text-indigo-700 dark:text-indigo-300",
    soft: "bg-indigo-50 dark:bg-indigo-950/25",
    dot: "bg-indigo-500",
  },
  cyan: {
    border: "border-cyan-200 dark:border-cyan-900/70",
    bg: "bg-cyan-700",
    text: "text-cyan-700 dark:text-cyan-300",
    soft: "bg-cyan-50 dark:bg-cyan-950/25",
    dot: "bg-cyan-500",
  },
  amber: {
    border: "border-amber-200 dark:border-amber-900/70",
    bg: "bg-amber-700",
    text: "text-amber-700 dark:text-amber-300",
    soft: "bg-amber-50 dark:bg-amber-950/25",
    dot: "bg-amber-500",
  },
  rose: {
    border: "border-rose-200 dark:border-rose-900/70",
    bg: "bg-rose-600",
    text: "text-rose-700 dark:text-rose-300",
    soft: "bg-rose-50 dark:bg-rose-950/25",
    dot: "bg-rose-500",
  },
};

const diagnosticTone = [
  "border-indigo-200 bg-indigo-50/80 dark:border-indigo-900/60 dark:bg-indigo-950/20",
  "border-cyan-200 bg-cyan-50/80 dark:border-cyan-900/60 dark:bg-cyan-950/20",
  "border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/20",
  "border-violet-200 bg-violet-50/80 dark:border-violet-900/60 dark:bg-violet-950/20",
  "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/20",
  "border-rose-200 bg-rose-50/80 dark:border-rose-900/60 dark:bg-rose-950/20",
  "border-sky-200 bg-sky-50/80 dark:border-sky-900/60 dark:bg-sky-950/20",
] as const;

function ReferenceLinks({
  ids,
  references,
}: {
  ids: number[];
  references: LibraryReference[];
}) {
  return (
    <span className="ml-1 inline-flex gap-1 align-super text-[10px] font-bold">
      {ids.map((id) => {
        const reference = references.find((item) => item.id === id);
        if (!reference) return null;
        return (
          <a
            key={id}
            href={reference.url}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
            aria-label={`Abrir referência ${id}`}
          >
            [{id}]
          </a>
        );
      })}
    </span>
  );
}

function IndexCard({ index }: { index: WiscIndexGuide }) {
  const tone = indexTone[index.tone];
  return (
    <article
      id={`indice-${index.abbreviation.toLowerCase()}`}
      className={`overflow-hidden rounded-[26px] border ${tone.border} bg-card shadow-sm`}
    >
      <div className={`${tone.soft} border-b ${tone.border} p-5 sm:p-6`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div
              className={`inline-flex h-12 min-w-16 items-center justify-center rounded-2xl px-3 text-lg font-black tracking-tight text-white shadow-sm ${tone.bg}`}
            >
              {index.abbreviation}
            </div>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {index.internationalLabel} na literatura internacional
            </p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-foreground">
              {index.title}
            </h3>
          </div>
          <Brain className={`h-6 w-6 shrink-0 ${tone.text}`} aria-hidden="true" />
        </div>
        <p className={`mt-4 text-base font-semibold leading-relaxed ${tone.text}`}>
          “{index.guidingQuestion}”
        </p>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            O que sintetiza
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            {index.measures}
          </p>
        </div>
        <div className={`rounded-2xl border ${tone.border} ${tone.soft} p-4`}>
          <p className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Lightbulb className={`h-4 w-4 ${tone.text}`} /> Leitura clínica
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {index.clinicalReading}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold text-foreground">Antes de interpretar, cheque</p>
            <ul className="mt-2 space-y-2 text-xs leading-relaxed text-muted-foreground">
              {index.confounders.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Onde isso aparece no cotidiano</p>
            <ul className="mt-2 space-y-2 text-xs leading-relaxed text-muted-foreground">
              {index.functionalClues.map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${tone.text}`} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function BibliotecaPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-16">
      <section className="relative overflow-hidden rounded-[34px] border border-slate-800 bg-[#0b1630] text-white shadow-xl">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-cyan-300/20"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-6 top-12 h-52 w-52 rounded-full border border-indigo-300/20"
          aria-hidden="true"
        />
        <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.18fr_.82fr] lg:p-11">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-cyan-300/30 bg-cyan-300/15 text-cyan-100 hover:bg-cyan-300/15">
                <BookOpen className="mr-1.5 h-3.5 w-3.5" /> Biblioteca NeuroPed
              </Badge>
              <Badge variant="outline" className="border-white/30 bg-slate-950/80 text-white">
                Capítulo do dia
              </Badge>
              <Badge variant="outline" className="border-white/30 bg-slate-950/80 text-white">
                Nº {String(chapter.chapterNumber).padStart(2, "0")}
              </Badge>
            </div>
            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200">
              {chapter.category}
            </p>
            <h1
              className="mt-3 max-w-4xl text-3xl font-black leading-[1.04] tracking-[-0.04em] sm:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {chapter.title}
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
              {chapter.subtitle}
            </p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-cyan-300" /> {chapter.publishedAt.split("-").reverse().join("/")}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock3 className="h-4 w-4 text-cyan-300" /> {chapter.readingMinutes} min de leitura
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-cyan-300" /> Curadoria diária · catálogo versionado
              </span>
            </div>
          </div>

          <div className="relative self-center rounded-[28px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm sm:p-5">
            <div className="grid grid-cols-2 gap-3">
              {chapter.indices.map((index) => {
                const tone = indexTone[index.tone];
                return (
                  <a
                    key={index.abbreviation}
                    href={`#indice-${index.abbreviation.toLowerCase()}`}
                    className="group rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-white/[0.1]"
                  >
                    <span className={`inline-flex h-9 items-center rounded-xl px-2.5 text-sm font-black text-white ${tone.bg}`}>
                      {index.abbreviation}
                    </span>
                    <p className="mt-2 text-xs font-bold leading-snug text-white">
                      {index.title.replace("Índice de ", "")}
                    </p>
                    <ArrowDown className="mt-3 h-3.5 w-3.5 text-cyan-300 transition group-hover:translate-y-0.5" />
                  </a>
                );
              })}
            </div>
            <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-relaxed text-amber-100">
              Quatro lentes descrevem o desempenho. Nenhuma delas, sozinha, nomeia um diagnóstico.
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="Sumário do capítulo" className="flex flex-wrap gap-2">
        {[
          ["#mapa", "Mapa inicial"],
          ["#indices", "4 índices"],
          ["#diagnosticos", "Hipóteses diagnósticas"],
          ["#caso", "Caso fictício"],
          ["#fontes", "Fontes"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            {label}
          </a>
        ))}
      </nav>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <Card className="rounded-[28px] border-primary/15">
          <CardContent className="p-6 sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Comece pela pergunta certa</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">O WISC-IV não pergunta “qual é o diagnóstico?”</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{chapter.opening}</p>
            <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-xs leading-relaxed text-foreground">
              <strong>Público deste capítulo:</strong> {chapter.audience}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-cyan-200 bg-cyan-50/50 dark:border-cyan-900/60 dark:bg-cyan-950/15">
          <CardContent className="p-6 sm:p-8">
            <p className="flex items-center gap-2 text-xs font-bold text-cyan-800 dark:text-cyan-200">
              <Route className="h-4 w-4" /> Ao final, você saberá
            </p>
            <ol className="mt-4 space-y-3">
              {chapter.learningObjectives.map((objective, index) => (
                <li key={objective} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-700 text-[10px] font-black text-white">
                    {index + 1}
                  </span>
                  <span>{objective}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </section>

      <section id="mapa" className="scroll-mt-24">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Diagrama 1 · sequência segura</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">Do escore à decisão clínica</h2>
          </div>
          <Layers3 className="hidden h-7 w-7 text-primary sm:block" />
        </div>
        <div className="grid overflow-hidden rounded-[28px] border border-border bg-card shadow-sm sm:grid-cols-2 xl:grid-cols-6">
          {chapter.readingSequence.map((item, index) => (
            <article
              key={item.step}
              className="relative border-b border-border p-5 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 xl:border-b-0 xl:border-r xl:last:border-r-0"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-[0.18em] text-primary">{item.step}</span>
                {index < chapter.readingSequence.length - 1 && (
                  <ArrowRight className="hidden h-4 w-4 text-border xl:block" aria-hidden="true" />
                )}
              </div>
              <h3 className="mt-5 text-base font-black text-foreground">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="indices" className="scroll-mt-24">
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Diagrama 2 · as quatro lentes</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">Entenda cada índice sem atalhos</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            A nomenclatura brasileira usa IOP; artigos internacionais costumam usar PRI. Em ambos os casos, a interpretação exige o conjunto do protocolo e as condições da avaliação.
            <ReferenceLinks ids={[1]} references={chapter.references} />
          </p>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          {chapter.indices.map((index) => (
            <IndexCard key={index.abbreviation} index={index} />
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[30px] border border-violet-200 bg-gradient-to-br from-violet-950 via-slate-950 to-indigo-950 text-white shadow-lg dark:border-violet-900/60">
        <div className="grid gap-7 p-6 sm:p-8 lg:grid-cols-[.8fr_1.2fr] lg:p-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">O centro do mapa</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">{chapter.qitGuide.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">{chapter.qitGuide.coherent}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5">
              <Gauge className="h-5 w-5 text-violet-300" />
              <h3 className="mt-3 font-black">Quando o perfil é heterogêneo</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">{chapter.qitGuide.heterogeneous}</p>
            </div>
            <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-5">
              <ShieldAlert className="h-5 w-5 text-rose-200" />
              <h3 className="mt-3 font-black">Nunca faça isso</h3>
              <p className="mt-2 text-xs leading-relaxed text-rose-100">{chapter.qitGuide.neverDo}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="diagnosticos" className="scroll-mt-24">
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Diagrama 3 · raciocínio diferencial</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">O mesmo perfil, múltiplas hipóteses</h2>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">
            Perfis médios de grupos ajudam a formular perguntas, mas não têm sensibilidade nem especificidade suficientes para diagnosticar uma criança individualmente.
            <ReferenceLinks ids={[4]} references={chapter.references} />
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {chapter.diagnosticLenses.map((lens, index) => (
            <article key={lens.id} className={`rounded-[24px] border p-5 ${diagnosticTone[index % diagnosticTone.length]}`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-black text-foreground">{lens.title}</h3>
                <ReferenceLinks ids={lens.evidenceRefs} references={chapter.references} />
              </div>
              <div className="mt-4 space-y-4 text-xs leading-relaxed">
                <div>
                  <p className="font-bold uppercase tracking-[0.12em] text-muted-foreground">Padrão possível</p>
                  <p className="mt-1 text-foreground">{lens.pattern}</p>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-[0.12em] text-muted-foreground">Leitura útil</p>
                  <p className="mt-1 text-foreground">{lens.interpretation}</p>
                </div>
                <div className="rounded-xl border border-foreground/10 bg-background/60 p-3">
                  <p className="font-bold text-foreground">Precisa convergir com</p>
                  <p className="mt-1 text-muted-foreground">{lens.mustCorrelate}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="caso" className="scroll-mt-24 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
        <Card className="rounded-[28px] border-amber-200 dark:border-amber-900/60">
          <CardContent className="p-6 sm:p-8">
            <p className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
              <MessageSquareText className="h-4 w-4" /> Aplicação prática
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">{chapter.vignette.title}</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{chapter.vignette.presentation}</p>
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-relaxed text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-100">
              <strong>Evite o atalho:</strong> {chapter.vignette.wrongShortcut}
            </div>
            <div className="mt-5 space-y-3">
              {chapter.vignette.expertReading.map((item) => (
                <p key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-indigo-200 dark:border-indigo-900/60">
          <CardContent className="p-6 sm:p-8">
            <p className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
              <Eye className="h-4 w-4" /> Perguntas que mudam a interpretação
            </p>
            <div className="mt-5 space-y-3">
              {chapter.vignette.nextQuestions.map((question, index) => (
                <div key={question} className="flex gap-3 rounded-2xl bg-muted/60 p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">{index + 1}</span>
                  <p className="text-sm font-semibold leading-relaxed text-foreground">{question}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-xs leading-relaxed text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/20 dark:text-indigo-100">
              A decisão clínica nasce da convergência entre perfil cognitivo, história, prejuízo funcional, exame e fontes independentes.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-[30px] border border-emerald-200 bg-emerald-50/70 p-6 dark:border-emerald-900/60 dark:bg-emerald-950/15 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Resumo de bolso</p>
            <h2 className="text-2xl font-black tracking-tight text-foreground">Sete ideias para levar à consulta</h2>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {chapter.keyPoints.map((point, index) => (
            <div key={point} className="flex gap-3 rounded-2xl border border-emerald-200 bg-background/80 p-4 dark:border-emerald-900/60">
              <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">{String(index + 1).padStart(2, "0")}</span>
              <p className="text-sm leading-relaxed text-foreground">{point}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="fontes" className="scroll-mt-24">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Rastreabilidade</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">Fontes verificadas</h2>
          </div>
          <Badge variant="outline">Corte da literatura: {chapter.evidence.literatureCutoff.split("-").reverse().join("/")}</Badge>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {chapter.references.map((reference) => (
            <a
              key={reference.id}
              href={reference.url}
              target="_blank"
              rel="noreferrer"
              className="group flex gap-4 rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-sm"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-black text-primary">{reference.id}</span>
              <span>
                <span className="text-sm font-semibold leading-relaxed text-foreground">{reference.citation}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{reference.supports}</span>
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                  Abrir fonte <ExternalLink className="h-3 w-3 transition group-hover:translate-x-0.5" />
                </span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {[chapter.safety.disclaimer, chapter.safety.copyright, chapter.safety.professionalBoundary].map((item, index) => (
          <div key={item} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
            <ShieldAlert className="mb-2 h-4 w-4" />
            <strong>{["Limite clínico", "Proteção do instrumento", "Limite profissional"][index]}:</strong> {item}
          </div>
        ))}
      </section>

      <p className="text-center text-[11px] text-muted-foreground">
        {neuropedLibraryChapters.length} capítulo publicado · Atualizado em {chapter.updatedAt.split("-").reverse().join("/")} · Conteúdo educacional sujeito à revisão clínica contínua.
      </p>
    </div>
  );
}
