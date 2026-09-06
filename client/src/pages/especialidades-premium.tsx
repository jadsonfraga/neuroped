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
import kidsMascot from "@assets/images/dr-fraga-kids/mascote.png";

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
    description:
      "Avaliação cuidadosa e acompanhamento individualizado do desenvolvimento, comunicação e autonomia.",
    href: "#/tea",
    icon: Puzzle,
    tone: "from-amber-50 to-card dark:from-amber-950/20",
    button: "border-amber-500/35 text-amber-800 dark:text-amber-300",
  },
  {
    title: "TDAH",
    subtitle: "Atenção, impulsividade e hiperatividade",
    description:
      "Investigação clínica e estratégias individualizadas para atenção, autorregulação e aprendizagem.",
    href: "#/filtro",
    icon: Brain,
    tone: "from-blue-50 to-card dark:from-blue-950/20",
    button: "border-blue-500/35 text-blue-800 dark:text-blue-300",
  },
  {
    title: "Epilepsia",
    subtitle: "Diagnóstico e acompanhamento",
    description:
      "Seguimento neuropediátrico integrando história clínica, semiologia das crises, EEG e evolução funcional.",
    href: "#/epilepsia",
    icon: Activity,
    tone: "from-rose-50 to-card dark:from-rose-950/20",
    button: "border-rose-500/35 text-rose-800 dark:text-rose-300",
  },
  {
    title: "Desenvolvimento Infantil",
    subtitle: "Marcos e trajetória funcional",
    description:
      "Acompanhamento motor, cognitivo, de linguagem, social e adaptativo ao longo da infância.",
    href: "#/marcos-desenvolvimento",
    icon: TrendingUp,
    tone: "from-emerald-50 to-card dark:from-emerald-950/20",
    button: "border-emerald-500/35 text-emerald-800 dark:text-emerald-300",
  },
  {
    title: "Sono",
    subtitle: "Sono na infância e adolescência",
    description:
      "Avaliação das dificuldades de sono e de seus efeitos sobre comportamento, aprendizagem e qualidade de vida.",
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

const whatsAppHref =
  "https://wa.me/5587991097371?text=Olá%2C%20gostaria%20de%20informações%20sobre%20consulta%20em%20neuropediatria.";

function BrandHeader() {
  return (
    <header className="relative z-40 border-b border-amber-400/35 bg-[hsl(214_76%_11%)] text-white shadow-[0_16px_40px_-28px_hsl(214_76%_6%/0.85)]">
      <div className="mx-auto flex min-h-[4.8rem] max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <a
          href="#/especialidades"
          className="flex min-w-0 items-center gap-3"
          aria-label="Especialidades do Dr. Jadson Fraga"
        >
          <img
            src={brandAssets.masterShield}
            alt="Escudo Dr. Jadson Fraga"
            className="h-14 w-14 shrink-0 rounded-2xl object-contain sm:h-16 sm:w-16"
          />
          <div className="hidden sm:block">
            <p
              className="text-xl font-semibold tracking-[-0.02em] lg:text-2xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Dr. Jadson Fraga
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-amber-300">
              Neuropediatra
            </p>
            <p className="mt-1 text-[9px] text-white/70">CRM-PE 25227 · RQE 17756</p>
          </div>
        </a>

        <nav
          className="ml-auto hidden items-center gap-5 text-[12px] font-medium text-white/78 lg:flex"
          aria-label="Navegação institucional"
        >
          <a href="#/" className="transition-colors hover:text-amber-300">Início</a>
          <a href="#/especialidades" className="border-b-2 border-amber-400 pb-2 text-white">
            Especialidades
          </a>
          <a href="#/portal-familia" className="transition-colors hover:text-amber-300">
            App da Família
          </a>
          <a href="#/" className="transition-colors hover:text-amber-300">Portal Profissional</a>
          <a href="#/sobre" className="transition-colors hover:text-amber-300">Sobre</a>
        </nav>

        <div className="ml-auto hidden items-center gap-3 xl:flex">
          <a
            href={whatsAppHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-[11px] font-semibold"
          >
            <MessageCircle className="h-5 w-5 text-emerald-400" />
            87 9 9109-7371
          </a>
          <a
            href="https://instagram.com/drjadsonfraganeuroped"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram do Dr. Jadson Fraga"
          >
            <AtSign className="h-5 w-5 text-fuchsia-300" />
          </a>
        </div>

        <a
          href="#/agendar"
          className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-2xl border border-amber-200/55 bg-gradient-to-b from-amber-300 to-amber-500 px-4 py-2 text-[12px] font-bold text-[hsl(214_76%_11%)] shadow-lg lg:ml-1"
        >
          <CalendarDays className="h-4 w-4" />
          <span className="hidden sm:inline">Agendar consulta</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </header>
  );
}

function SpecialtyCard({ specialty }: { specialty: Specialty }) {
  const Icon = specialty.icon;
  return (
    <article
      className={`flex min-h-[14.6rem] flex-col rounded-[1.45rem] border border-border/70 bg-gradient-to-b ${specialty.tone} p-4 shadow-[0_18px_42px_-34px_hsl(214_76%_11%/0.46)]`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3
            className="text-base font-semibold leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {specialty.title}
          </h3>
          <p className="mt-0.5 text-[9px] font-semibold leading-snug text-primary/80">
            {specialty.subtitle}
          </p>
        </div>
      </div>
      <p className="mt-3 flex-1 text-[11px] leading-relaxed text-muted-foreground">
        {specialty.description}
      </p>
      <a
        href={specialty.href}
        className={`mt-3 inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-semibold transition hover:bg-background/65 ${specialty.button}`}
      >
        Saiba mais <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </article>
  );
}

export default function EspecialidadesPremiumPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[hsl(42_44%_96%)] text-[hsl(214_58%_15%)] dark:bg-background dark:text-foreground">
      <BrandHeader />

      <main>
        <section className="relative overflow-hidden border-b border-amber-500/20 bg-[radial-gradient(48rem_24rem_at_68%_18%,hsl(41_82%_72%/0.28),transparent_70%),linear-gradient(135deg,hsl(43_100%_98%),hsl(38_70%_94%))] dark:bg-[linear-gradient(145deg,hsl(214_76%_11%),hsl(212_70%_17%))]">
          <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full border border-amber-500/10" aria-hidden="true" />
          <div className="mx-auto grid max-w-[1600px] gap-5 px-4 pb-12 pt-5 sm:px-6 lg:h-[25rem] lg:grid-cols-[0.86fr_1.02fr_0.72fr] lg:items-stretch lg:px-8 lg:pb-9 lg:pt-6">
            <div className="relative z-10 flex flex-col justify-center py-2">
              <div className="mb-3 flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.23em] text-amber-700 dark:text-amber-300">
                <span>Cuidando de cada fase do desenvolvimento</span>
                <span className="hidden h-px w-10 bg-amber-500/60 sm:block" aria-hidden="true" />
              </div>
              <h1
                className="max-w-[10.5ch] text-[clamp(2.8rem,4.7vw,5rem)] font-semibold leading-[0.88] tracking-[-0.045em] text-[hsl(214_76%_11%)] dark:text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Especialidades em Neurologia <span className="text-amber-700 dark:text-amber-300">Infantil</span>
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-[hsl(214_38%_26%)] dark:text-white/76 sm:text-[15px]">
                Ciência, empatia e propósito para compreender o neurodesenvolvimento e construir próximos passos individualizados para cada criança e adolescente.
              </p>
              <div className="mt-4 flex items-end gap-3">
                <div>
                  <p
                    className="text-xl italic text-[hsl(214_76%_24%)] dark:text-amber-200"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Dr. Jadson Fraga
                  </p>
                  <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Neuropediatra · CRM-PE 25227 · RQE 17756
                  </p>
                </div>
                <span className="mb-2 hidden h-px w-8 bg-amber-500/60 sm:block" aria-hidden="true" />
              </div>
            </div>

            <div className="relative min-h-[24rem] overflow-hidden rounded-[2rem] border border-white/70 bg-[hsl(39_38%_84%)] shadow-[0_32px_70px_-44px_hsl(214_76%_11%/0.72)] lg:min-h-0">
              <img
                src={brandAssets.mascots.doctorSelfie}
                alt="Dr. Jadson Fraga"
                loading="eager"
                decoding="async"
                className="absolute inset-0 h-full w-full scale-110 object-cover object-center opacity-35 blur-sm"
                aria-hidden="true"
              />
              <img
                src={brandAssets.mascots.doctorSelfie}
                alt="Dr. Jadson Fraga"
                loading="eager"
                decoding="async"
                className="absolute inset-0 h-full w-full object-contain object-bottom"
              />
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[hsl(214_76%_11%/0.58)] via-transparent to-transparent" aria-hidden="true" />
              <div className="absolute bottom-3 left-3 rounded-xl border border-white/30 bg-[hsl(214_76%_11%/0.68)] px-3 py-2 text-white backdrop-blur-md">
                <p className="text-[11px] font-semibold">Dr. Jadson Fraga</p>
                <p className="text-[8px] uppercase tracking-[0.13em] text-amber-200">Neuropediatra · Petrolina-PE</p>
              </div>
            </div>

            <div className="flex min-h-0 flex-col gap-3">
              <div className="relative min-h-[15rem] flex-1 overflow-hidden rounded-[1.8rem] border-4 border-white bg-white shadow-[0_24px_55px_-38px_hsl(214_76%_11%/0.7)]">
                <img
                  src={brandAssets.mascots.consultorioFull}
                  alt="Dr. Jadson Fraga em ambiente de atendimento infantil"
                  loading="eager"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[hsl(214_76%_11%/0.78)] to-transparent px-4 pb-3 pt-10 text-[11px] font-semibold text-white">
                  Escuta, vínculo e acompanhamento
                </div>
              </div>
              <div className="grid grid-cols-[1.05fr_0.95fr] gap-3">
                <div className="flex items-center gap-2.5 rounded-2xl border border-amber-500/28 bg-[hsl(214_76%_11%)] px-3 py-3 text-white shadow-lg">
                  <MapPin className="h-6 w-6 shrink-0 text-amber-300" />
                  <div>
                    <p className="text-[7px] uppercase tracking-[0.14em] text-amber-100/80">Atendimento em</p>
                    <p className="text-base font-semibold" style={{ fontFamily: "var(--font-display)" }}>Petrolina-PE</p>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-2xl border border-amber-500/24 bg-white/76 p-3 pr-16 shadow-sm dark:bg-white/5">
                  <p className="text-[10px] font-semibold italic leading-snug text-[hsl(214_65%_24%)] dark:text-amber-200" style={{ fontFamily: "var(--font-display)" }}>
                    Juntos por um futuro com mais possibilidades.
                  </p>
                  <img src={kidsMascot} alt="Mascote NeuroPed" className="absolute -bottom-2 -right-2 h-20 w-16 object-contain" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-20 mx-auto -mt-7 max-w-[1600px] px-4 sm:px-6 lg:px-8" aria-labelledby="especialidades-premium-title">
          <div className="rounded-[1.8rem] border border-amber-500/25 bg-[hsl(43_100%_99%/0.97)] p-4 shadow-[0_30px_80px_-50px_hsl(214_76%_11%/0.65)] backdrop-blur-xl dark:bg-card/95">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3 px-1">
              <div>
                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">Cuidado por necessidades reais</p>
                <h2 id="especialidades-premium-title" className="mt-0.5 text-xl font-semibold tracking-[-0.03em]" style={{ fontFamily: "var(--font-display)" }}>
                  Nossas Especialidades
                </h2>
              </div>
              <p className="text-[10px] text-muted-foreground">Avaliação clínica · acompanhamento · orientação familiar</p>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {specialties.map((specialty) => (
                  <SpecialtyCard key={specialty.title} specialty={specialty} />
                ))}
              </div>

              <aside className="relative min-h-[14.6rem] overflow-hidden rounded-[1.55rem] border border-amber-400/40 bg-[radial-gradient(22rem_15rem_at_100%_0%,hsl(41_85%_58%/0.18),transparent_65%),linear-gradient(145deg,hsl(214_76%_11%),hsl(212_70%_17%))] p-4 text-white shadow-lg">
                <div className="relative z-10 max-w-[14.5rem]">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.15em] text-amber-300">Próximo passo</p>
                  <h2 className="mt-1.5 text-xl font-semibold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                    Agende a consulta do seu filho
                  </h2>
                  <p className="mt-1.5 text-[10px] leading-relaxed text-white/70">
                    Tempo para escuta, avaliação clínica e definição responsável dos próximos passos.
                  </p>
                </div>
                <div className="relative z-10 mt-3 space-y-2 pr-4">
                  <a href="#/agendar" className="flex min-h-10 items-center justify-between rounded-xl bg-gradient-to-b from-rose-600 to-rose-800 px-3 py-2 text-xs font-semibold shadow-lg">
                    <span className="inline-flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" />Agendar consulta</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                  <a href={whatsAppHref} target="_blank" rel="noreferrer" className="flex min-h-10 items-center justify-between rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 px-3 py-2 text-xs font-semibold shadow-lg">
                    <span className="inline-flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5" />Falar no WhatsApp</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
                <div className="relative z-10 mt-3 flex flex-col gap-1 text-[8px] text-white/68">
                  <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3 text-emerald-300" />87 9 9109-7371</span>
                  <span className="inline-flex items-center gap-1"><AtSign className="h-3 w-3 text-fuchsia-300" />@drjadsonfraganeuroped</span>
                </div>
                <img src={kidsMascot} alt="" aria-hidden="true" className="pointer-events-none absolute -bottom-4 -right-3 h-32 w-24 object-contain opacity-95" />
              </aside>
            </div>
          </div>
        </section>

        <section className="mt-5 bg-[hsl(214_76%_11%)] text-white">
          <div className="mx-auto grid max-w-[1600px] gap-2 px-4 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
            {trust.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-center gap-2.5 border-white/10 px-2 py-1 lg:border-r lg:last:border-r-0">
                <Icon className="h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.11em]">{title}</p>
                  <p className="mt-0.5 text-[8px] text-white/58">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-amber-400/20 bg-[hsl(214_76%_9%)] text-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-3 text-[8px] sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-5 text-white/68">
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-amber-300" />Petrolina-PE</span>
            <a href={whatsAppHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5 text-emerald-300" />87 9 9109-7371</a>
            <span className="inline-flex items-center gap-1.5"><AtSign className="h-3.5 w-3.5 text-fuchsia-300" />@drjadsonfraganeuroped</span>
          </div>
          <p className="inline-flex items-center gap-1.5 text-amber-200"><Sparkles className="h-3.5 w-3.5" />Mais desenvolvimento. Mais futuros possíveis.</p>
        </div>
      </footer>
    </div>
  );
}
