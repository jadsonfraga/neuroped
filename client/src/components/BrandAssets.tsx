import { Brain, ShieldCheck, Zap } from "lucide-react";
import { drJadsonMasterShieldLogo } from "@/assets/drJadsonMasterShieldLogo";
import { SafeImage } from "@/components/SafeImage";
import neuroPedLegacyLogo from "@assets/neuroped-logo.png";
import drSuperMascot from "@assets/images/dr-jadson-logo-super.jpeg";
import drConsultorioHero from "@assets/images/dr-jadson-consultorio-superman.jpeg";
import drArteMascot from "@assets/images/dr-jadson-arte.jpeg";
import drSelfieMascot from "@assets/images/dr-jadson-selfie.jpeg";
import drBatmanMascot from "@assets/images/dr-jadson-consultorio-batman.jpeg";
import drConsultorioFull from "@assets/images/dr-jadson-consultorio-full.jpeg";
import heroBrain from "@assets/images/hero-brain.png";
import childAssessment from "@assets/images/child-assessment.png";
import childDevelopment from "@assets/images/child-development.png";
import mentalHealthChild from "@assets/images/mental-health-child.png";
import neuralAbstract from "@assets/images/neural-abstract.png";
import teamMultiprofessional from "@assets/images/team-multiprofessional.png";

export const brandAssets = {
  masterShield: drJadsonMasterShieldLogo,
  legacyNeuroPedSymbol: neuroPedLegacyLogo,
  mascots: {
    superDoctor: drSuperMascot,
    consultorioSuperman: drConsultorioHero,
    celebrationArt: drArteMascot,
    doctorSelfie: drSelfieMascot,
    consultorioBatman: drBatmanMascot,
    consultorioFull: drConsultorioFull,
  },
  illustrations: {
    heroBrain,
    childAssessment,
    childDevelopment,
    mentalHealthChild,
    neuralAbstract,
    teamMultiprofessional,
  },
} as const;

export const assetInventory = [
  { group: "Logo mestre", name: "Escudo Dr. Jadson Fraga — vermelho/dourado", status: "A — premium e principal", usage: "marca principal em home, menu, splash, login, onboarding e micro branding" },
  { group: "Logo histórica", name: "Símbolo NeuroPed roxo", status: "A — premium e reutilizável", usage: "asset secundário/legado, usado apenas como textura ou acento do ecossistema" },
  { group: "Mascote", name: "Dr. Jadson SuperNeuroPed", status: "A — premium e reutilizável", usage: "boas-vindas e telas vazias" },
  { group: "Mascote", name: "Dr. Jadson no consultório Superman", status: "A — premium e reutilizável", usage: "resultados e recomendações clínicas" },
  { group: "Mascote", name: "Arte Dr. Jadson", status: "A — premium e reutilizável", usage: "celebração, conclusão e exportações" },
  { group: "Mascote", name: "Selfie Dr. Jadson", status: "B — aceitável", usage: "apoio humano e estados neutros" },
  { group: "Mascote", name: "Consultório Batman", status: "B — aceitável", usage: "conteúdo pediátrico/superpoder com uso pontual" },
  { group: "Ilustração", name: "Cérebro infantil", status: "A — premium e reutilizável", usage: "background clínico e telas de bloqueio" },
  { group: "Ilustração", name: "Avaliação infantil", status: "A — premium e reutilizável", usage: "onboarding, ferramenta de filtro e telas vazias" },
  { group: "Ilustração", name: "Equipe multiprofissional", status: "A — premium e reutilizável", usage: "fluxos familiares, PDFs e acompanhamento" },
  { group: "Background", name: "Neural abstract", status: "A — premium e reutilizável", usage: "hero institucional e cards premium" },
] as const;

const sizeClasses = {
  xs: "w-8 h-8",
  sm: "w-10 h-10",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-32 h-32",
} as const;

interface BrandMarkProps {
  size?: keyof typeof sizeClasses;
  showWordmark?: boolean;
  compact?: boolean;
  className?: string;
  imageClassName?: string;
  titleClassName?: string;
  subtitle?: string;
}

export function BrandMark({
  size = "md",
  showWordmark = false,
  compact = false,
  className = "",
  imageClassName = "",
  titleClassName = "",
  subtitle = "Plataforma Clínica de Neuropediatria",
}: BrandMarkProps) {
  return (
    <div className={`flex items-center ${compact ? "gap-2" : "gap-3"} ${className}`}>
      <div className="relative flex-shrink-0">
        <div className="absolute inset-0 rounded-[1.35rem] bg-amber-400/25 blur-md" aria-hidden="true" />
        <SafeImage
          src={brandAssets.masterShield}
          alt="Escudo Dr. Jadson Fraga — logo mestre NeuroPed"
          fallbackLabel="Logo NeuroPed"
          className={`${sizeClasses[size]} relative rounded-[1.2rem] object-contain bg-white p-0.5 shadow-lg ring-2 ring-amber-300/60 dark:ring-amber-400/40 ${imageClassName}`}
        />
        <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-lg bg-gradient-to-br from-amber-300 to-yellow-600 text-red-950 shadow-md ring-1 ring-white/70 dark:ring-black/40" aria-hidden="true">
          <Zap className="h-3 w-3" strokeWidth={2.5} />
        </span>
      </div>
      {showWordmark && (
        <div className="min-w-0">
          <p className={`truncate text-base font-black tracking-tight text-foreground ${titleClassName}`}>NeuroPed</p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{subtitle}</p>
        </div>
      )}
    </div>
  );
}

export function MiniShield({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-red-800 via-red-700 to-red-950 text-amber-300 shadow-sm ring-1 ring-amber-400/40 ${className}`} aria-hidden="true">
      <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.25} />
    </span>
  );
}

export function BrandWatermark({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute opacity-[0.055] dark:opacity-[0.075] ${className}`} aria-hidden="true">
      <SafeImage src={brandAssets.masterShield} alt="" className="h-full w-full object-contain" />
    </div>
  );
}

export function ClinicalBrandIcon({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-red-800 via-red-700 to-slate-950 shadow-md ring-1 ring-amber-300/40 ${className}`}>
      <Brain className="h-5 w-5 text-amber-200" strokeWidth={1.75} aria-hidden="true" />
      <Zap className="absolute -right-1 -bottom-1 h-5 w-5 text-amber-400/80" strokeWidth={2.25} aria-hidden="true" />
    </div>
  );
}
