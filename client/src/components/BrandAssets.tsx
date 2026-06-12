import { useState } from "react";
import { Brain, ImageOff, ShieldCheck, Zap } from "lucide-react";
import { drJadsonMasterShieldLogo } from "@/assets/drJadsonMasterShieldLogo";
import drJadsonLogoFile from "@assets/dr-jadson-logo.jpeg";
import neuroPedLegacyLogo from "@assets/neuroped-logo.png";
import drSuperMascot from "@assets/images/dr-jadson-logo-super.jpeg";
import drConsultorioHero from "@assets/images/dr-jadson-consultorio-superman.jpeg";
import drArteMascot from "@assets/images/dr-jadson-arte.jpeg";
import drSelfieMascot from "@assets/images/dr-jadson-selfie.jpeg";
import drBatmanMascot from "@assets/images/dr-jadson-consultorio-batman.jpeg";
import drConsultorioFull from "@assets/images/dr-jadson-consultorio-full.jpeg";
import heroBrain from "@assets/images/hero-brain.webp";
import childAssessment from "@assets/images/child-assessment.webp";
import childDevelopment from "@assets/images/child-development.webp";
import mentalHealthChild from "@assets/images/mental-health-child.webp";
import neuralAbstract from "@assets/images/neural-abstract.webp";
import teamMultiprofessional from "@assets/images/team-multiprofessional.webp";

export const brandAssets = {
  masterShield: drJadsonMasterShieldLogo,
  masterShieldFile: drJadsonLogoFile,
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

export type VisualAssetStatus = "ativo" | "secundario" | "apoio";

export interface VisualAssetRegistryItem {
  id: string;
  group: string;
  name: string;
  path: string;
  src: string;
  status: VisualAssetStatus;
  usage: string;
  auditRoute: string;
}

export const visualAssetRegistry: VisualAssetRegistryItem[] = [
  {
    id: "dr-jadson-logo-file",
    group: "Logo mestre",
    name: "Escudo Dr. Jadson Fraga — arquivo original",
    path: "attached_assets/dr-jadson-logo.jpeg",
    src: brandAssets.masterShieldFile,
    status: "ativo",
    usage: "registro físico do escudo mestre; auditado em /qualidade para garantir carregamento do arquivo do repositório",
    auditRoute: "/qualidade",
  },
  {
    id: "neuroped-legacy-logo",
    group: "Logo histórica",
    name: "Símbolo NeuroPed roxo",
    path: "attached_assets/neuroped-logo.png",
    src: brandAssets.legacyNeuroPedSymbol,
    status: "secundario",
    usage: "marca secundária/legado, acento histórico e apoio visual discreto",
    auditRoute: "/qualidade",
  },
  {
    id: "dr-superdoctor",
    group: "Mascote",
    name: "Dr. Jadson SuperNeuroPed",
    path: "attached_assets/images/dr-jadson-logo-super.jpeg",
    src: brandAssets.mascots.superDoctor,
    status: "ativo",
    usage: "boas-vindas, home e estados vazios por meio do Mascote e painel de qualidade",
    auditRoute: "/qualidade",
  },
  {
    id: "dr-consultorio-superman",
    group: "Mascote",
    name: "Dr. Jadson no consultório Superman",
    path: "attached_assets/images/dr-jadson-consultorio-superman.jpeg",
    src: brandAssets.mascots.consultorioSuperman,
    status: "ativo",
    usage: "resultados, recomendações clínicas e painel de qualidade",
    auditRoute: "/qualidade",
  },
  {
    id: "dr-arte",
    group: "Mascote",
    name: "Arte Dr. Jadson",
    path: "attached_assets/images/dr-jadson-arte.jpeg",
    src: brandAssets.mascots.celebrationArt,
    status: "ativo",
    usage: "celebração, conclusão de fluxos, exportações e painel de qualidade",
    auditRoute: "/qualidade",
  },
  {
    id: "dr-selfie",
    group: "Mascote",
    name: "Selfie Dr. Jadson",
    path: "attached_assets/images/dr-jadson-selfie.jpeg",
    src: brandAssets.mascots.doctorSelfie,
    status: "apoio",
    usage: "apoio humano, estados neutros e painel de qualidade",
    auditRoute: "/qualidade",
  },
  {
    id: "dr-batman",
    group: "Mascote",
    name: "Consultório Batman",
    path: "attached_assets/images/dr-jadson-consultorio-batman.jpeg",
    src: brandAssets.mascots.consultorioBatman,
    status: "apoio",
    usage: "uso pediátrico pontual, superpoder infantil controlado e painel de qualidade",
    auditRoute: "/qualidade",
  },
  {
    id: "dr-consultorio-full",
    group: "Mascote",
    name: "Consultório completo Dr. Jadson",
    path: "attached_assets/images/dr-jadson-consultorio-full.jpeg",
    src: brandAssets.mascots.consultorioFull,
    status: "apoio",
    usage: "conteúdo institucional, sobre a clínica e painel de qualidade",
    auditRoute: "/qualidade",
  },
  {
    id: "hero-brain",
    group: "Ilustração",
    name: "Cérebro infantil",
    path: "attached_assets/images/hero-brain.webp",
    src: brandAssets.illustrations.heroBrain,
    status: "ativo",
    usage: "login, splash secundário, bloqueio clínico e painel de qualidade",
    auditRoute: "/qualidade",
  },
  {
    id: "child-assessment",
    group: "Ilustração",
    name: "Avaliação infantil",
    path: "attached_assets/images/child-assessment.webp",
    src: brandAssets.illustrations.childAssessment,
    status: "ativo",
    usage: "onboarding, filtro clínico, estados vazios e painel de qualidade",
    auditRoute: "/qualidade",
  },
  {
    id: "child-development",
    group: "Ilustração",
    name: "Desenvolvimento infantil",
    path: "attached_assets/images/child-development.webp",
    src: brandAssets.illustrations.childDevelopment,
    status: "ativo",
    usage: "educação familiar, desenvolvimento e painel de qualidade",
    auditRoute: "/qualidade",
  },
  {
    id: "mental-health-child",
    group: "Ilustração",
    name: "Saúde mental infantil",
    path: "attached_assets/images/mental-health-child.webp",
    src: brandAssets.illustrations.mentalHealthChild,
    status: "ativo",
    usage: "saúde mental pediátrica, psiquiatria e painel de qualidade",
    auditRoute: "/qualidade",
  },
  {
    id: "neural-abstract",
    group: "Background",
    name: "Neural abstract",
    path: "attached_assets/images/neural-abstract.webp",
    src: brandAssets.illustrations.neuralAbstract,
    status: "ativo",
    usage: "hero institucional, fundos premium discretos e painel de qualidade",
    auditRoute: "/qualidade",
  },
  {
    id: "team-multiprofessional",
    group: "Ilustração",
    name: "Equipe multiprofissional",
    path: "attached_assets/images/team-multiprofessional.webp",
    src: brandAssets.illustrations.teamMultiprofessional,
    status: "ativo",
    usage: "fluxos multiprofissionais, família, PDFs e painel de qualidade",
    auditRoute: "/qualidade",
  },
];

export const assetInventory = visualAssetRegistry.map((asset) => ({
  group: asset.group,
  name: asset.name,
  status: asset.status === "ativo" ? "A — ativo e auditado" : asset.status === "secundario" ? "A — secundário e auditado" : "B — apoio e auditado",
  usage: asset.usage,
})) as ReadonlyArray<{ group: string; name: string; status: string; usage: string }>;

const sizeClasses = {
  xs: "w-8 h-8",
  sm: "w-10 h-10",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-32 h-32",
} as const;

interface SafeAssetImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  onLoadStateChange?: (loaded: boolean) => void;
}

export function SafeAssetImage({
  src,
  alt,
  className = "",
  fallbackClassName = "",
  onLoadStateChange,
}: SafeAssetImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex h-full min-h-[96px] w-full items-center justify-center rounded-2xl border border-destructive/40 bg-destructive/10 text-destructive ${fallbackClassName}`}
        role="img"
        aria-label={`Imagem indisponível: ${alt}`}
      >
        <div className="flex flex-col items-center gap-2 text-center text-xs font-semibold">
          <ImageOff className="h-5 w-5" />
          <span>Imagem não abriu</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`${className} ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-200`}
      onLoad={() => {
        setLoaded(true);
        onLoadStateChange?.(true);
      }}
      onError={() => {
        setFailed(true);
        onLoadStateChange?.(false);
      }}
    />
  );
}

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
        <SafeAssetImage
          src={brandAssets.masterShield}
          alt="Escudo Dr. Jadson Fraga — logo mestre NeuroPed"
          className={`${sizeClasses[size]} relative rounded-[1.2rem] object-cover shadow-lg ring-2 ring-amber-300/60 dark:ring-amber-400/40 ${imageClassName}`}
          fallbackClassName={sizeClasses[size]}
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
      <SafeAssetImage src={brandAssets.masterShield} alt="" className="h-full w-full object-contain no-zoom-media" />
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

type AssetShowcaseVariant = "clinical" | "family" | "mascots" | "all";

const showcaseIds: Record<AssetShowcaseVariant, string[]> = {
  clinical: ["child-assessment", "team-multiprofessional", "mental-health-child", "hero-brain", "dr-consultorio-superman", "neural-abstract"],
  family: ["child-development", "team-multiprofessional", "dr-selfie", "mental-health-child", "child-assessment", "dr-arte"],
  mascots: ["dr-superdoctor", "dr-consultorio-superman", "dr-arte", "dr-selfie", "dr-batman", "dr-consultorio-full"],
  all: visualAssetRegistry.map((asset) => asset.id),
};

interface AssetShowcaseProps {
  variant?: AssetShowcaseVariant;
  title?: string;
  subtitle?: string;
  max?: number;
  compact?: boolean;
  className?: string;
}

export function AssetShowcase({
  variant = "clinical",
  title = "Biblioteca visual NeuroPed",
  subtitle = "Mascotes e ilustrações oficiais reaproveitados com proporção preservada.",
  max = 6,
  compact = false,
  className = "",
}: AssetShowcaseProps) {
  const allowed = new Set(showcaseIds[variant]);
  const assets = visualAssetRegistry.filter((asset) => allowed.has(asset.id)).slice(0, max);

  return (
    <section className={`overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-4 shadow-sm ${className}`} aria-label={title}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">assets oficiais</p>
          <h2 className="text-base font-black text-foreground">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
        </div>
        <span className="hidden rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary sm:inline-flex">
          {assets.length} usados
        </span>
      </div>
      <div className={`grid gap-2 ${compact ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"}`}>
        {assets.map((asset) => (
          <div key={asset.id} className="group overflow-hidden rounded-2xl border border-border/70 bg-background/60 p-2">
            <div className="asset-proportion-box aspect-card-safe rounded-xl bg-muted/40">
              <SafeAssetImage src={asset.src} alt={asset.name} className="no-zoom-media h-full w-full rounded-xl object-contain" />
            </div>
            {!compact && (
              <p className="mt-2 line-clamp-2 text-[10px] font-semibold leading-tight text-muted-foreground group-hover:text-foreground">
                {asset.name}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
