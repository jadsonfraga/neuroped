import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  Brain,
  CalendarDays,
  Heart,
  Instagram,
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
  tone: "gold" | "blue" | "red" | "green" | "violet";
}

const specialties: Specialty[] = [
  {
    title: "TEA",
    subtitle: "Transtorno do Espectro Autista",
    description:
      "Avaliação clínica cuidadosa e acompanhamento individualizado do desenvolvimento, comunicação, comportamento e autonomia.",
    href: "#/tea",
    icon: Puzzle,
    tone: "gold",
  },
  {
    title: "TDAH",
    subtitle: "Atenção, impulsividade e hiperatividade",
    description:
      "Investigação clínica e estratégias personalizadas para atenção, autorregulação, aprendizagem e funcionamento diário.",
    href: "#/filtro",
    icon: Brain,
    tone: "blue",
  },
  {
    title: "Epilepsia",
    subtitle: "Diagnóstico e acompanhamento",
    description:
      "Seguimento neuropediátrico com integração entre história clínica, semiologia das crises, EEG e evolução funcional.",
    href: "#/epilepsia",
    icon: Activity,
    tone: "red",
  },
  {
    title: "Desenvolvimento Infantil",
    subtitle: "Marcos e trajetória funcional",
    description:
      "Acompanhamento do desenvolvimento motor, cognitivo, da linguagem, social e adaptativo ao longo da infância.",
    href: "#/marcos-desenvolvimento",
    icon: TrendingUp,
    tone: "green",
  },
  {
    title: "Sono",
    subtitle: "Sono na infância e adolescência",
    description:
      "Avaliação das dificuldades de sono e de seu impacto sobre comportamento, aprendizagem, saúde e qualidade de vida.",
    href: "#/diario-sono",
    icon: MoonStar,
    tone: "violet",
  },
];

const toneClasses: Record<Specialty["tone"], { icon: string; card: string; button: string }> = {
  gold: {
    icon: "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300",
    card: "from-amber-50/95 to-card dark:from-amber-950/18",
    button: "border-amber-500/35 text-amber-800 hover:bg-amber-500/10 dark:text-amber-300",
  },
  blue: {
    icon: "bg-blue-500/12 text-blue-700 ring-blue-500/25 dark:text-blue-300",
    card: "from-blue-50/95 to-card dark:from-blue-950/18",
    button: "border-blue-500/30 text-blue-800 hover:bg-blue-500/10 dark:text-blue-300",
  },
  red: {
    icon: "bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:text-rose-300",
    card: "from-rose-50/95 to-card dark:from-rose-950/18",
    button: "border-rose-500/30 text-rose-800 hover:bg-rose-500/10 dark:text-rose-300",
  },
  green: {
    icon: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
    card: "from-emerald-50/95 to-card dark:from-emerald-950/18",
    button: "border-emerald-500/30 text-emerald-800 hover:bg-emerald-500/10 dark:text-emerald-300",
  },
  violet: {
    icon: "bg-violet-500/12 text-violet-700 ring-violet-500/25 dark:text-violet-300",
    card: "from-violet-50/95 to-card dark:from-violet-950/18",
    button: "border-violet-500/30 text-violet-800 hover:bg-violet-500/10 dark:text-violet-300",
  },
};

const trustItems = [
  { icon: Brain, title: "Experiência", text: "Atualização clínica permanente" },
  { icon: Heart, title: "Atendimento humano", text: "Escuta e individualização" },
  { icon: Users, title: "Família", text: "Participação nos próximos passos" },
  { icon: ShieldCheck, title: "Ciência que acolhe", text: "Decisões clínicas responsáveis" },
  { icon: Star, title: "Mais possibilidades", text: "Desenvolvimento como trajetória" },
];

const whatsAppHref =
  "https://wa.me/5587991097371?text=Olá%2C%20gostaria%20de%20informações%20sobre%20consulta%20em%20neuropediatria.";

function Header() {
  return (
    <header className="relative z-40 border-b border-amber-400/35 bg-[hsl(214_76%_11%)] text-white shadow-[0_16px_40px_-28px_hsl(214_76%_6%/0.85)]">
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <a href="#/especialidades" className="flex min-w-0 items-center gap-3" aria-label="Especialidades · Dr. Jadson Fraga">
          <img
            src={brandAssets.masterShield}
            alt="Escudo Dr. Jadson Fraga"
            className="h-14 w-14 shrink-0 rounded-2xl object-contain drop-shadow-[0_8px_12px_hsl(0_0%_0%/0.28)] sm:h-16 sm:w-16"
          />
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-xl font-semibold tracking-[-0.02em] text-white lg:text-2xl" style={{ fontFamily: "var(--font-display)" }}>
              Dr. Jadson Fraga
            </p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.28em] text-amber-300 lg:text-[10px]">
              Neuropediatra
            </p>
            <p className="mt-1 text-[9px] text-white/70">CRM-PE 25227 · RQE 17756</p>
          </div>
        </a>

        <nav className="ml-auto hidden items-center gap-5 text-[12px] font-medium text-white/78 lg:flex" aria-label="Navegação institucional">
          <a href="#/" className="transition-colors hover:text-amber-300">Início</a>
          <a href="#/especialidades" className="relative text-white after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-amber-400">Especialidades</a>
          <a href="#/portal-familia" className="transition-colors hover:text-amber-300">App da Família</a>
          <a href="#/" className="transition-colors hover:text-amber-300">Portal Profissional</a>
          <a href="#/sobre" className="transition-colors hover:text-amber-300">Sobre</a>
        </nav>

        <div className="ml-auto hidden items-center gap-3 xl:flex">
          <a
            href={whatsAppHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 border-l border-white/20 pl-4 text-[11px] font-semibold text-white"
          >
            <MessageCircle className="h-5 w-5 text-emerald-400" />
            <span>87 9 9109-7371</span>
          </a>
          <a
            href="https://instagram.com/drjadsonfraganeuroped"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram do Dr. Jadson Fraga"
            className="rounded-xl p-2 text-white/80 transition-colors hover:bg-white/8 hover:text-white"
          >
            <Instagram className="h-5 w-5 text-fuchsia-400" />
          </a>
        </div>

        <a
          href="#/agendar"
          className="ml-auto inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border border-amber-200/55 bg-gradient-to-b from-amber-300 to-amber-500 px-4 py-2 text-[12px] font-bold text-[hsl(214_76%_11%)] shadow-[0_12px_26px_-18px_hsl(40_90%_45%/0.95)] transition hover:brightness-105 lg:ml-1"
        >
          <CalendarDays className="h-4 w-4" />
          <span className="hidden sm:inline">Agendar consulta</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </header>
  );
}

export default function EspecialidadesPremiumPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[hsl(42_44%_96%)] text-[hsl(214_58%_15%)] dark:bg-background dark:text-foreground">
      <Header />

      <main>
        <section className="relative overflow-hidden border-b border-amber-500/20 bg-[radial-gradient(52rem_30rem_at_70%_18%,hsl(41_82%_72%/0.28),transparent_70%),linear-gradient(135deg,hsl(43_100%_98%),hsl(38_70%_94%))] dark:bg-[linear-gradient(145deg,hsl(214_76%_11%),hsl(212_70%_17%))]">
          <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full border border-amber-500/10" aria-hidden="true" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-amber-400/10 to-transparent" aria-hidden="true" />

          <div className="mx-auto grid max-w-[1600px] gap-7 px-4 pb-14 pt-8 sm:px-6 lg:grid-cols-[0.88fr_0.9fr_0.72fr] lg:items-stretch lg:px-8 lg:pb-20 lg:pt-10">
            <div className="relative z-10 flex flex-col justify-center py-2 lg:py-8">
              <div className="mb-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-700 dark:text-amber-300">
                <span>Cuidando de cada fase do desenvolvimento</span>
                <span className="hidden h-px w-12 bg-amber-500/55 sm:block" aria-hidden="true" />
              </div>
              <h1
                className="max-w-[11ch] text-[clamp(3rem,5.1vw,5.9rem)] font-semibold leading-[0.86] tracking-[-0.045em] text-[hsl(214_76%_11%)] dark:text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Especialidades em Neurologia <span className="text-amber-700 dark:text-amber-300">Infantil</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-[hsl(214_38%_26%)] dark:text-white/76 sm:text-lg">
                Ciência, empatia e propósito para compreender o neurodesenvolvimento e construir próximos passos individualizados para cada criança e adolescente.
              </p>
              <div className="mt-6 flex items-center gap-3 text-[hsl(214_76%_24%)] dark:text-amber-200">
                <span className="text-2xl italic" style={{ fontFamily: "var(--font-display)" }}>Dr. Jadson Fraga</span>
                <span className="h-px w-10 bg-amber-500/55" aria-hidden="true" />
              </div>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">Neuropediatra · CRM-PE 25227 · RQE 17756</p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#/agendar"
                  className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[hsl(214_76%_11%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_-20px_hsl(214_76%_11%/0.8)] transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-amber-400 dark:text-[hsl(214_76%_11%)]"
                >
                  <CalendarDays className="h-4 w-4" /> Agendar consulta
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={whatsAppHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-emerald-600/25 bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_-20px_hsl(150_70%_25%/0.7)] transition hover:-translate-y-0.5 hover:brightness-105"
                >
                  <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
                </a>
              </div>
            </div>

            <div className="relative min-h-[31rem] overflow-hidden rounded-[2.4rem] border border-white/70 bg-white/45 shadow-[0_38px_90px_-48px_hsl(214_76%_11%/0.72)] lg:min-h-[39rem]">
              <img
                src={brandAssets.mascots.doctorSelfie}
                alt="Dr. Jadson Fraga"
                loading="eager"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[hsl(214_76%_11%/0.58)] via-[hsl(214_76%_11%/0.08)] to-transparent" aria-hidden="true" />
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/30 bg-[hsl(214_76%_11%/0.66)] px-4 py-3 text-white shadow-lg backdrop-blur-md">
                <p className="text-sm font-semibold">Dr. Jadson Fraga</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-amber-200">Neuropediatra · Petrolina-PE</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="relative min-h-[18rem] overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-[0_28px_60px_-40px_hsl(214_76%_11%/0.7)] lg:min-h-[21rem]">
                <img
                  src={brandAssets.mascots.consultorioFull}
                  alt="Dr. Jadson Fraga em ambiente de atendimento infantil"
                  loading="eager"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[hsl(214_76%_11%/0.72)] to-transparent px-5 pb-4 pt-12 text-white">
                  <p className="text-sm font-semibold">Escuta, vínculo e acompanhamento</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr] lg:grid-cols-1 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="flex items-center gap-3 rounded-2xl border border-amber-500/28 bg-[hsl(214_76%_11%)] px-4 py-4 text-white shadow-[0_18px_40px_-28px_hsl(214_76%_11%/0.85)]">
                  <MapPin className="h-7 w-7 shrink-0 text-amber-300" />
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.15em] text-amber-100/80">Atendimento em</p>
                    <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>Petrolina-PE</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-white/75 p-4 text-[11px] leading-relaxed text-[hsl(214_38%_27%)] shadow-sm backdrop-blur dark:bg-white/5 dark:text-white/72">
                  Cuidado técnico e humano, com foco na história e nas necessidades reais de cada família.
                </div>
              </div>

              <div className="relative mt-auto min-h-28 overflow-hidden rounded-[1.75rem] border border-amber-500/25 bg-white/72 p-4 pr-28 shadow-sm backdrop-blur dark:bg-white/5">
                <p className="text-base font-semibold italic text-[hsl(214_65%_24%)] dark:text-amber-200" style={{ fontFamily: "var(--font-display)" }}>
                  “Juntos por um desenvolvimento com mais possibilidades.”
                </p>
                <img
                  src={brandAssets.mascots.superDoctor}
                  alt="Mascote NeuroPed"
                  loading="lazy"
                  decoding="async"
                  className="absolute -bottom-4 -right-1 h-36 w-28 object-contain drop-shadow-[0_12px_16px_hsl(214_76%_11%/0.2)]"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-20 mx-auto -mt-10 max-w-[1600px] px-4 sm:px-6 lg:px-8" aria-labelledby="especialidades-premium-title">
          <div className="rounded-[2rem] border border-amber-500/25 bg-[hsl(43_100%_99%/0.96)] p-4 shadow-[0_34px_90px_-52px_hsl(214_76%_11%/0.65)] backdrop-blur-xl dark:bg-card/95 sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-1">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">Cuidado por necessidades reais</p>
                <h2 id="especialidades-premium-title" className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[hsl(214_76%_11%)] dark:text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                  Nossas Especialidades
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">Avaliação clínica · acompanhamento · orientação familiar</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {specialties.map((specialty) => {
                  const Icon = specialty.icon;
                  const tone = toneClasses[specialty.tone];
                  return (
                    <article key={specialty.title} className={`group flex min-h-[19rem] flex-col rounded-[1.55rem] border border-border/70 bg-gradient-to-b ${tone.card} p-4 shadow-[0_18px_42px_-34px_hsl(214_76%_11%/0.46)]`}>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${tone.icon}`}>
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold leading-tight text-foreground" style={{ fontFamily: "var(--font-display)" }}>{specialty.title}</h3>
                      <p className="mt-1 min-h-10 text-[10px] font-semibold leading-snug text-primary/80">{specialty.subtitle}</p>
                      <p className="mt-3 flex-1 text-[12px] leading-relaxed text-muted-foreground">{specialty.description}</p>
                      <a href={specialty.href} className={`mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${tone.button}`}>
                        Saiba mais <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    </article>
                  );
                })}
              </div>

              <aside id="especialidades-contato" className="relative overflow-hidden rounded-[1.75rem] border border-amber-400/40 bg-[radial-gradient(24rem_18rem_at_100%_0%,hsl(41_85%_58%/0.18),transparent_65%),linear-gradient(145deg,hsl(214_76%_11%),hsl(212_70%_17%))] p-5 text-white shadow-[0_26px_56px_-34px_hsl(214_76%_11%/0.88)]">
                <div className="relative z-10 max-w-[17rem]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300">Próximo passo</p>
                  <h2 className="mt-2 text-2xl font-semibold leading-tight" style={{ fontFamily: "var(--font-display)" }}>Agende a consulta do seu filho</h2>
                  <p className="mt-2 text-xs leading-relaxed text-white/72">
                    Um atendimento com tempo para escuta, avaliação clínica e definição responsável dos próximos passos.
                  </p>
                </div>
                <div className="relative z-10 mt-5 space-y-2.5">
                  <a href="#/agendar" className="flex min-h-12 items-center justify-between rounded-2xl border border-rose-300/30 bg-gradient-to-b from-rose-600 to-rose-800 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-105">
                    <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Agendar consulta</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a href={whatsAppHref} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-between rounded-2xl border border-emerald-300/30 bg-gradient-to-b from-emerald-500 to-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-105">
                    <span className="inline-flex items-center gap-2"><MessageCircle className="h-4 w-4" /> Falar no WhatsApp</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
                <div className="relative z-10 mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-white/72">
                  <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5 text-emerald-300" /> 87 9 9109-7371</span>
                  <span className="inline-flex items-center gap-1.5"><Instagram className="h-3.5 w-3.5 text-fuchsia-300" /> @drjadsonfraganeuroped</span>
                </div>
                <div className="pointer-events-none absolute -bottom-8 -right-3 h-44 w-32 opacity-95" aria-hidden="true">
                  <img src={brandAssets.mascots.superDoctor} alt="" className="h-full w-full object-contain" />
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="mt-8 bg-[hsl(214_76%_11%)] text-white">
          <div className="mx-auto grid max-w-[1600px] gap-3 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-center gap-3 border-white/10 px-2 py-2 lg:border-r lg:last:border-r-0">
                  <Icon className="h-7 w-7 shrink-0 text-amber-300" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white">{item.title}</p>
                    <p className="mt-1 text-[9px] leading-relaxed text-white/58">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-amber-400/20 bg-[hsl(214_76%_9%)] text-white" id="contato">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-5 px-4 py-5 text-[10px] sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-5 text-white/68">
            <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-amber-300" /> Petrolina-PE</span>
            <a href={whatsAppHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white"><MessageCircle className="h-4 w-4 text-emerald-300" /> 87 9 9109-7371</a>
            <a href="https://instagram.com/drjadsonfraganeuroped" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white"><Instagram className="h-4 w-4 text-fuchsia-300" /> @drjadsonfraganeuroped</a>
          </div>
          <p className="inline-flex items-center gap-2 text-amber-200"><Sparkles className="h-4 w-4" /> Mais desenvolvimento. Mais futuros possíveis.</p>
        </div>
      </footer>
    </div>
  );
}
