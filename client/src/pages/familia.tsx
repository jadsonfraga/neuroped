import { Link } from "wouter";
import type { LucideIcon } from "lucide-react";
import {
  Heart, Baby, TrendingUp, BookText, MessageCircle, FileText, ShieldCheck, ArrowRight, Sparkles,
} from "lucide-react";

interface FamilyLink {
  href: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  gradient: string;
}

// Atalhos públicos (educativos) para as famílias. Todos abrem sem PIN.
const LINKS: FamilyLink[] = [
  { href: "/orientacao-parental", title: "Orientação aos Pais", desc: "Guias práticos por tema, em linguagem simples.", icon: Heart, gradient: "from-rose-500 to-pink-500" },
  { href: "/marcos-desenvolvimento", title: "Marcos do Desenvolvimento", desc: "O que esperar em cada idade (base OMS/CDC).", icon: Baby, gradient: "from-amber-500 to-orange-500" },
  { href: "/curvas-crescimento", title: "Curvas de Crescimento", desc: "Peso e altura por idade (referência OMS).", icon: TrendingUp, gradient: "from-emerald-500 to-teal-500" },
  { href: "/glossario", title: "Glossário", desc: "Termos da neuropediatria explicados sem jargão.", icon: BookText, gradient: "from-indigo-500 to-blue-600" },
  { href: "/caa", title: "CAA · Vou Falar", desc: "Comunicação alternativa para apoiar a fala.", icon: MessageCircle, gradient: "from-violet-600 to-purple-600" },
  { href: "/portal-familia", title: "Portal e orientações", desc: "Conteúdos para a família; documentos individuais seguem por canal seguro.", icon: FileText, gradient: "from-cyan-500 to-sky-600" },
];

export default function FamiliaPage() {
  return (
    <div className="space-y-6 pb-10">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/[0.08] via-card/70 to-chart-2/[0.06] p-6 shadow-sm backdrop-blur sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-gradient-to-tr from-chart-2/15 to-transparent blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Espaço das Famílias
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Bem-vindo(a) ao <span className="text-primary">NeuroPed</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Conteúdo educativo para ajudar você a entender o desenvolvimento da sua criança e a
            acompanhar o cuidado. <strong className="font-semibold text-foreground">Não substitui</strong> a
            avaliação do seu médico — é um apoio para caminhar junto.
          </p>
        </div>
      </header>

      {/* Assinatura autoral: reconhecimento sem transformar o espaço em publicidade invasiva. */}
      <section aria-labelledby="author-story" className="rounded-3xl border border-primary/20 bg-card/80 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 to-chart-2/15 ring-1 ring-primary/15">
            <img
              src="/dr-jadson-mascot-guide.webp"
              alt="Dr. Jadson Fraga, criador do NeuroPed"
              width="256"
              height="256"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Projeto autoral</p>
            <h2 id="author-story" className="mt-1 text-lg font-bold tracking-tight text-foreground">
              Um espaço criado pelo Dr. Jadson Fraga
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              O NeuroPed reúne ciência, criatividade e experiência em neuropediatria para tornar o cuidado infantil mais compreensível para profissionais e famílias.
            </p>
          </div>
          <Link
            href="/sobre"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-primary/25 bg-primary/10 px-3.5 py-2.5 text-xs font-bold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Conheça o autor <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Grade de atalhos */}
      <section aria-label="Conteúdo para famílias">
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              <div className="group flex h-full cursor-pointer flex-col gap-3 rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${l.gradient} text-white shadow-sm ring-1 ring-white/20`}>
                  <l.icon className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-bold leading-tight text-foreground group-hover:text-primary">{l.title}</h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{l.desc}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-primary/80 group-hover:text-primary">
                  Abrir <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Rodapé de confiança */}
      <div className="flex items-start gap-2 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
        <span>
          Em caso de urgência ou dúvida sobre a saúde da criança, procure sempre o seu médico ou
          serviço de saúde. Este espaço é informativo e educativo.
        </span>
      </div>
    </div>
  );
}
