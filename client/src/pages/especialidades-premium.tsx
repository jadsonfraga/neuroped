import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  AtSign,
  Brain,
  CalendarDays,
  Heart,
  MapPin,
  MessageCircle,
  MoonStar,
  Puzzle,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { brandAssets } from "@/components/BrandAssets";

interface Specialty {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone: string;
  button: string;
}

const specialties: Specialty[] = [
  {
    title: "TEA",
    subtitle: "Transtorno do Espectro Autista",
    description: "Avaliação clínica cuidadosa e acompanhamento do desenvolvimento, comunicação, comportamento e autonomia.",
    href: "#/tea",
    icon: Puzzle,
    tone: "from-amber-50 to-card dark:from-amber-950/20",
    button: "border-amber-500/35 text-amber-800 dark:text-amber-300",
  },
  {
    title: "TDAH",
    subtitle: "Atenção, impulsividade e hiperatividade",
    description: "Investigação clínica e estratégias individualizadas para atenção, autorregulação, aprendizagem e vida diária.",
    href: "#/filtro",
    icon: Brain,
    tone: "from-blue-50 to-card dark:from-blue-950/20",
    button: "border-blue-500/35 text-blue-800 dark:text-blue-300",
  },
  {
    title: "Epilepsia",
    subtitle: "Diagnóstico e acompanhamento",
    description: "Seguimento neuropediátrico integrando história clínica, semiologia das crises, EEG e evolução funcional.",
    href: "#/epilepsia",
    icon: Activity,
    tone: "from-rose-50 to-card dark:from-rose-950/20",
    button: "border-rose-500/35 text-rose-800 dark:text-rose-300",
  },
  {
    title: "Desenvolvimento Infantil",
    subtitle: "Marcos e trajetória funcional",
    description: "Acompanhamento motor, cognitivo, de linguagem, social e adaptativo ao longo da infância.",
    href: "#/marcos-desenvolvimento",
    icon: TrendingUp,
    tone: "from-emerald-50 to-card dark:from-emerald-950/20",
    button: "border-emerald-500/35 text-emerald-800 dark:text-emerald-300",
  },
  {
    title: "Sono",
    subtitle: "Sono na infância e adolescência",
    description: "Avaliação das dificuldades de sono e de seus efeitos sobre comportamento, aprendizagem e qualidade de vida.",
    href: "#/diario-sono",
    icon: MoonStar,
    tone: "from-violet-50 to-card dark:from-violet-950/20",
    button: "border-violet-500/35 text-violet-800 dark:text-violet-300",
  },
];

const trust = [
  { icon: Brain, title: "Experiência", text: "Atualização clínica permanente" },
  { icon: Heart, title: "Atendimento humano", text: "Escuta e individualização" },
  { icon: Users, title: "Família", text: "Participação nos próximos passos" },
  { icon: ShieldCheck, title: "Ciência que acolhe", text: "Decisões clínicas responsáveis" },
  { icon: Star, title: "Mais possibilidades", text: "Desenvolvimento como trajetória" },
];

const whatsAppHref = "https://wa.me/5587991097371?text=Olá%2C%20gostaria%20de%20informações%20sobre%20consulta%20em%20neuropediatria.";

function BrandHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-amber-400/35 bg-[hsl(214_76%_11%)] text-white shadow-[0_16px_40px_-28px_hsl(214_76%_6%/0.85)]">
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <a href="#/especialidades" className="flex min-w-0 items-center gap-3" aria-label="Especialidades do Dr. Jadson Fraga">
          <img src={brandAssets.masterShield} alt="Escudo Dr. Jadson Fraga" className="h-14 w-14 shrink-0 rounded-2xl object-contain sm:h-16 sm:w-16" />
          <div className="hidden sm:block">
            <p className="text-xl font-semibold tracking-[-0.02em] lg:text-2xl" style={{ fontFamily: "var(--font-display)" }}>Dr. Jadson Fraga</p>
            <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-amber-300">Neuropediatra</p>
            <p className="mt-1 text-[9px] text-white/70">CRM-PE 25227 · RQE 17756</p>
          </div>
        </a>
        <nav className="ml-auto hidden items-center gap-5 text-[12px] font-medium text-white/78 lg:flex" aria-label="Navegação institucional">
          <a href="#/">Início</a>
          <a href="#/especialidades" className="border-b-2 border-amber-400 pb-2 text-white">Especialidades</a>
          <a href="#/portal-familia">App da Família</a>
          <a href="#/">Portal Profissional</a>
          <a href="#/sobre">Sobre</a>
        </nav>
        <div className="ml-auto hidden items-center gap-3 xl:flex">
          <a href={whatsAppHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[11px] font-semibold"><MessageCircle className="h-5 w-5 text-emerald-400" />87 9 9109-7371</a>
          <a href="https://instagram.com/drjadsonfraganeuroped" target="_blank" rel="noreferrer" aria-label="Instagram do Dr. Jadson Fraga"><AtSign className="h-5 w-5 text-fuchsia-300" /></a>
        </div>
        <a href="#/agendar" className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-2xl border border-amber-200/55 bg-gradient-to-b from-amber-300 to-amber-500 px-4 py-2 text-[12px] font-bold text-[hsl(214_76%_11%)] lg:ml-1">
          <CalendarDays className="h-4 w-4" /><span className="hidden sm:inline">Agendar consulta</span><ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </header>
  );
}

function SpecialtyCard({ specialty }: { specialty: Specialty }) {
  const Icon = specialty.icon;
  return (
    <article className={`flex min-h-[18rem] flex-col rounded-[1.55rem] border border-border/70 bg-gradient-to-b ${specialty.tone} p-4 shadow-[0_18px_42px_-34px_hsl(214_76%_11%/0.46)]`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15"><Icon className="h-6 w-6" /></div>
      <h3 className="mt-4 text-lg font-semibold leading-tight" style={{ fontFamily: "var(--font-display)" }}>{specialty.title}</h3>
      <p className="mt-1 min-h-10 text-[10px] font-semibold leading-snug text-primary/80">{specialty.subtitle}</p>
      <p className="mt-3 flex-1 text-[12px] leading-relaxed text-muted-foreground">{specialty.description}</p>
      <a href={specialty.href} className={`mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition hover:bg-background/65 ${specialty.button}`}>Saiba mais <ArrowRight className="h-3.5 w-3.5" /></a>
    </article>
  );
}

export default function EspecialidadesPremiumPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[hsl(42_44%_96%)] text-[hsl(214_58%_15%)] dark:bg-background dark:text-foreground">
      <BrandHeader />
      <main>
        <section className="relative overflow-hidden border-b border-amber-500/20 bg-[radial-gradient(52rem_30rem_at_70%_18%,hsl(41_82%_72%/0.28),transparent_70%),linear-gradient(135deg,hsl(43_100%_98%),hsl(38_70%_94%))] dark:bg-[linear-gradient(145deg,hsl(214_76%_11%),hsl(212_70%_17%))]">
          <div className="mx-auto grid max-w-[1600px] gap-7 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[0.9fr_0.92fr_0.72fr] lg:px-8 lg:pb-20">
            <div className="flex flex-col justify-center py-4 lg:py-8">
              <div className="mb-5 text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">Cuidando de cada fase do desenvolvimento</div>
              <h1 className="max-w-[11ch] text-[clamp(3rem,5.1vw,5.9rem)] font-semibold leading-[0.86] tracking-[-0.045em] text-[hsl(214_76%_11%)] dark:text-white" style={{ fontFamily: "var(--font-display)" }}>
                Especialidades em Neurologia <span className="text-amber-700 dark:text-amber-300">Infantil</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-[hsl(214_38%_26%)] dark:text-white/76 sm:text-lg">Ciência, empatia e propósito para compreender o neurodesenvolvimento e construir próximos passos individualizados para cada criança e adolescente.</p>
              <p className="mt-6 text-2xl italic text-[hsl(214_76%_24%)] dark:text-amber-200" style={{ fontFamily: "var(--font-display)" }}>Dr. Jadson Fraga</p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">Neuropediatra · CRM-PE 25227 · RQE 17756</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#/agendar" className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[hsl(214_76%_11%)] px-5 py-3 text-sm font-semibold text-white shadow-lg"><CalendarDays className="h-4 w-4" />Agendar consulta<ArrowRight className="h-4 w-4" /></a>
                <a href={whatsAppHref} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg"><MessageCircle className="h-4 w-4" />Falar no WhatsApp</a>
              </div>
            </div>

            <div className="relative min-h-[31rem] overflow-hidden rounded-[2.4rem] border border-white/70 bg-white/45 shadow-[0_38px_90px_-48px_hsl(214_76%_11%/0.72)] lg:min-h-[39rem]">
              <img src={brandAssets.mascots.doctorSelfie} alt="Dr. Jadson Fraga" loading="eager" decoding="async" className="absolute inset-0 h-full w-full object-cover object-top" />
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[hsl(214_76%_11%/0.58)] to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/30 bg-[hsl(214_76%_11%/0.66)] px-4 py-3 text-white backdrop-blur-md"><p className="text-sm font-semibold">Dr. Jadson Fraga</p><p className="text-[10px] uppercase tracking-[0.15em] text-amber-200">Neuropediatra · Petrolina-PE</p></div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="relative min-h-[19rem] overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-[0_28px_60px_-40px_hsl(214_76%_11%/0.7)] lg:min-h-[22rem]">
                <img src={brandAssets.mascots.consultorioFull} alt="Dr. Jadson Fraga em ambiente de atendimento infantil" loading="eager" decoding="async" className="absolute inset-0 h-full w-full object-cover object-center" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[hsl(214_76%_11%/0.72)] to-transparent px-5 pb-4 pt-12 text-sm font-semibold text-white">Escuta, vínculo e acompanhamento</div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-amber-500/28 bg-[hsl(214_76%_11%)] px-4 py-4 text-white shadow-lg"><MapPin className="h-7 w-7 text-amber-300" /><div><p className="text-[9px] uppercase tracking-[0.15em] text-amber-100/80">Atendimento em</p><p className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>Petrolina-PE</p></div></div>
              <div className="relative mt-auto min-h-32 overflow-hidden rounded-[1.75rem] border border-amber-500/25 bg-white/76 p-4 pr-28 shadow-sm dark:bg-white/5"><p className="text-base font-semibold italic text-[hsl(214_65%_24%)] dark:text-amber-200" style={{ fontFamily: "var(--font-display)" }}>“Juntos por um desenvolvimento com mais possibilidades.”</p><img src={brandAssets.mascots.superDoctor} alt="Mascote NeuroPed" className="absolute -bottom-4 -right-1 h-36 w-28 object-contain" /></div>
            </div>
          </div>
        </section>

        <section className="relative z-20 mx-auto -mt-10 max-w-[1600px] px-4 sm:px-6 lg:px-8" aria-labelledby="especialidades-premium-title">
          <div className="rounded-[2rem] border border-amber-500/25 bg-[hsl(43_100%_99%/0.96)] p-4 shadow-[0_34px_90px_-52px_hsl(214_76%_11%/0.65)] backdrop-blur-xl dark:bg-card/95 sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-1"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">Cuidado por necessidades reais</p><h2 id="especialidades-premium-title" className="mt-1 text-2xl font-semibold tracking-[-0.03em]" style={{ fontFamily: "var(--font-display)" }}>Nossas Especialidades</h2></div><p className="text-xs text-muted-foreground">Avaliação clínica · acompanhamento · orientação familiar</p></div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{specialties.map((specialty) => <SpecialtyCard key={specialty.title} specialty={specialty} />)}</div>
              <aside className="relative overflow-hidden rounded-[1.75rem] border border-amber-400/40 bg-[radial-gradient(24rem_18rem_at_100%_0%,hsl(41_85%_58%/0.18),transparent_65%),linear-gradient(145deg,hsl(214_76%_11%),hsl(212_70%_17%))] p-5 text-white shadow-lg">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300">Próximo passo</p>
                <h2 className="mt-2 max-w-[17rem] text-2xl font-semibold leading-tight" style={{ fontFamily: "var(--font-display)" }}>Agende a consulta do seu filho</h2>
                <p className="mt-2 max-w-[17rem] text-xs leading-relaxed text-white/72">Um atendimento com tempo para escuta, avaliação clínica e definição responsável dos próximos passos.</p>
                <div className="mt-5 space-y-2.5"><a href="#/agendar" className="flex min-h-12 items-center justify-between rounded-2xl bg-gradient-to-b from-rose-600 to-rose-800 px-4 py-3 text-sm font-semibold"><span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />Agendar consulta</span><ArrowRight className="h-4 w-4" /></a><a href={whatsAppHref} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-between rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-700 px-4 py-3 text-sm font-semibold"><span className="inline-flex items-center gap-2"><MessageCircle className="h-4 w-4" />Falar no WhatsApp</span><ArrowRight className="h-4 w-4" /></a></div>
                <div className="mt-5 flex flex-wrap gap-3 text-[10px] text-white/72"><span className="inline-flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5 text-emerald-300" />87 9 9109-7371</span><span className="inline-flex items-center gap-1.5"><AtSign className="h-3.5 w-3.5 text-fuchsia-300" />@drjadsonfraganeuroped</span></div>
              </aside>
            </div>
          </div>
        </section>

        <section className="mt-8 bg-[hsl(214_76%_11%)] text-white"><div className="mx-auto grid max-w-[1600px] gap-3 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">{trust.map(({ icon: Icon, title, text }) => <div key={title} className="flex items-center gap-3 px-2 py-2"><Icon className="h-7 w-7 text-amber-300" /><div><p className="text-[10px] font-semibold uppercase tracking-[0.12em]">{title}</p><p className="mt-1 text-[9px] text-white/58">{text}</p></div></div>)}</div></section>
      </main>
      <footer className="border-t border-amber-400/20 bg-[hsl(214_76%_9%)] text-white"><div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-5 px-4 py-5 text-[10px] sm:px-6 lg:px-8"><div className="flex flex-wrap gap-5 text-white/68"><span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-amber-300" />Petrolina-PE</span><a href={whatsAppHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2"><MessageCircle className="h-4 w-4 text-emerald-300" />87 9 9109-7371</a><span className="inline-flex items-center gap-2"><AtSign className="h-4 w-4 text-fuchsia-300" />@drjadsonfraganeuroped</span></div><p className="inline-flex items-center gap-2 text-amber-200"><Sparkles className="h-4 w-4" />Mais desenvolvimento. Mais futuros possíveis.</p></div></footer>
    </div>
  );
}
