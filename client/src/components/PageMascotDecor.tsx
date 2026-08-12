import { motion, useReducedMotion } from "framer-motion";
import { useLocation } from "wouter";
import drSuperMascot from "@assets/images/dr-jadson-logo-super.jpeg";
import drConsultorioHero from "@assets/images/dr-jadson-consultorio-superman.jpeg";
import drArteMascot from "@assets/images/dr-jadson-arte.jpeg";
import drSelfieMascot from "@assets/images/dr-jadson-selfie.jpeg";
import drBatmanMascot from "@assets/images/dr-jadson-consultorio-batman.jpeg";
import drConsultorioFull from "@assets/images/dr-jadson-consultorio-full.jpeg";

type LegacyMascot = {
  id: string;
  src: string;
  objectPosition?: string;
};

const NINO_PREMIUM_SRC = "/neuroped-mascot-premium.webp";

const legacyMascots = {
  superDoctor: { id: "super-doctor", src: drSuperMascot, objectPosition: "object-top" },
  consultorioSuperman: {
    id: "consultorio-superman",
    src: drConsultorioHero,
    objectPosition: "object-top",
  },
  celebrationArt: { id: "celebration-art", src: drArteMascot, objectPosition: "object-center" },
  doctorSelfie: { id: "doctor-selfie", src: drSelfieMascot, objectPosition: "object-top" },
  consultorioBatman: {
    id: "consultorio-batman",
    src: drBatmanMascot,
    objectPosition: "object-top",
  },
  consultorioFull: {
    id: "consultorio-full",
    src: drConsultorioFull,
    objectPosition: "object-center",
  },
} satisfies Record<string, LegacyMascot>;

const defaultLegacyPool = Object.values(legacyMascots);

const routePools: Array<{ test: RegExp; mascots: LegacyMascot[] }> = [
  {
    test: /^\/(familia|portal-familia|orientacao-parental|diario-sono|diario-alimentar|marcos-desenvolvimento)/,
    mascots: [legacyMascots.doctorSelfie, legacyMascots.celebrationArt, legacyMascots.consultorioFull],
  },
  {
    test: /^\/(documentos|laudo-neuroped|receita-c1|receita-c1-express|assinatura-digital|pant|verificar)/,
    mascots: [legacyMascots.celebrationArt, legacyMascots.consultorioSuperman, legacyMascots.consultorioFull],
  },
  {
    test: /^\/(medicamentos|farmacologia|calculadora-dose|psiquiatria|mchat|pre-consulta|pre-retorno|prontuario|agenda|recepcao)/,
    mascots: [legacyMascots.consultorioSuperman, legacyMascots.superDoctor, legacyMascots.consultorioBatman],
  },
  {
    test: /^\/(login|sessao-expirada|consentimento-lgpd|ajuda|sobre|sobre-neuroped|termos|qualidade|acessibilidade)/,
    mascots: [legacyMascots.superDoctor, legacyMascots.doctorSelfie, legacyMascots.consultorioFull],
  },
  {
    test: /^\/(tea|tea-comportamentos|snap|denver|sdq|scared|conners|vineland|cbcl|vanderbilt|brief2|abc|asq3|cdi2|phqa|cssrs|crafft|rcads|masc2)/,
    mascots: [legacyMascots.superDoctor, legacyMascots.consultorioBatman, legacyMascots.consultorioSuperman],
  },
];

const routesWithInlineNino = ["/", "/filtro", "/filtro-escalas"];

function stablePathHash(path: string): number {
  let hash = 2166136261;
  for (let i = 0; i < path.length; i += 1) {
    hash ^= path.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getPathname(location: string): string {
  return location.split("?")[0] || "/";
}

function getLegacyMascot(path: string): LegacyMascot {
  const routePool = routePools.find(({ test }) => test.test(path))?.mascots ?? defaultLegacyPool;
  return routePool[stablePathHash(path) % routePool.length];
}

function hasInlineNino(path: string): boolean {
  return routesWithInlineNino.includes(path) || path.startsWith("/generic-scale/");
}

/**
 * Assinatura visual global do NeuroPed.
 *
 * - Toda rota recebe um mascote histórico contextual, escolhido de forma
 *   determinística para não "piscar" entre renders.
 * - O Nino premium aparece como assinatura contemporânea nas rotas que ainda
 *   não o exibem dentro do próprio conteúdo.
 * - Ambos são puramente decorativos: sem foco, clique ou impacto na leitura.
 * - Z-index fica abaixo do header/fluxo clínico/help e os elementos ficam
 *   parcialmente fora das bordas para reduzir competição com o conteúdo.
 */
export function PageMascotDecor() {
  const [location] = useLocation();
  const reduceMotion = useReducedMotion();
  const pathname = getPathname(location);
  const legacy = getLegacyMascot(pathname);
  const showGlobalNino = !hasInlineNino(pathname);

  return (
    <div
      className="pointer-events-none select-none print:hidden"
      aria-hidden="true"
      data-testid="page-mascot-decor"
      data-route={pathname}
    >
      {showGlobalNino && (
        <motion.div
          key={`nino-${pathname}`}
          initial={reduceMotion ? false : { opacity: 0, x: 10, y: -4, scale: 0.94 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed -right-3 top-16 z-20 h-14 w-14 sm:h-16 sm:w-16 md:-right-2 md:top-3 md:h-20 md:w-20 xl:h-24 xl:w-24"
          data-mascot-era="novo"
          data-mascot-id="nino-premium"
        >
          <div className="absolute inset-[18%] rounded-full bg-primary/10 blur-xl dark:bg-primary/15" />
          <motion.img
            src={NINO_PREMIUM_SRC}
            alt=""
            width="640"
            height="640"
            loading="lazy"
            decoding="async"
            animate={reduceMotion ? undefined : { y: [0, -3, 0], rotate: [0, 0.7, 0] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
            className="relative h-full w-full object-contain opacity-70 drop-shadow-[0_12px_18px_rgba(31,24,43,0.16)] dark:opacity-75"
          />
        </motion.div>
      )}

      <motion.div
        key={`legacy-${pathname}-${legacy.id}`}
        initial={reduceMotion ? false : { opacity: 0, x: 8, y: 8, scale: 0.94 }}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        transition={{ duration: 0.38, ease: "easeOut", delay: 0.04 }}
        className="fixed bottom-16 right-2 z-20 sm:right-3 md:bottom-4 md:right-16"
        data-mascot-era="legado"
        data-mascot-id={legacy.id}
      >
        <div className="overflow-hidden rounded-2xl border border-white/65 bg-white/55 p-1 shadow-[0_10px_28px_-14px_rgba(31,24,43,0.32)] backdrop-blur-md dark:border-white/10 dark:bg-slate-950/45">
          <img
            src={legacy.src}
            alt=""
            width="160"
            height="160"
            loading="lazy"
            decoding="async"
            className={`h-9 w-9 rounded-xl object-cover opacity-[0.72] sm:h-10 sm:w-10 md:h-12 md:w-12 md:opacity-[0.78] ${legacy.objectPosition ?? "object-center"}`}
          />
        </div>
      </motion.div>
    </div>
  );
}
