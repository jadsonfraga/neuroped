import { useEffect, useState } from "react";
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

// Guia ativo do NeuroPed (2026): Dr. Jadson Fraga em desenho, substituindo o Nino
// genérico no papel de personagem principal — ver Mascote.tsx para o hero grande.
const GUIDE_MASCOT_SRC = "/dr-jadson-mascot-guide.webp";

// Nino não é mais o guia ativo, mas continua publicado: reentra como mais um item
// do acervo em cameo (abaixo), preservando sua presença histórica no app inteiro.
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
  ninoRetired: { id: "nino-legado", src: NINO_PREMIUM_SRC, objectPosition: "object-center" },
} satisfies Record<string, LegacyMascot>;

const defaultLegacyPool = Object.values(legacyMascots);

const routePools: Array<{ test: RegExp; mascots: LegacyMascot[] }> = [
  {
    test: /^\/(familia|portal-familia|orientacao-parental|diario-sono|diario-alimentar|marcos-desenvolvimento)/,
    mascots: [legacyMascots.doctorSelfie, legacyMascots.celebrationArt, legacyMascots.consultorioFull, legacyMascots.ninoRetired],
  },
  {
    test: /^\/(documentos|laudo-neuroped|laudo-super|receita-c1|receita-c1-express|assinatura-digital|pant|verificar)/,
    mascots: [legacyMascots.celebrationArt, legacyMascots.consultorioSuperman, legacyMascots.consultorioFull, legacyMascots.ninoRetired],
  },
  {
    test: /^\/(medicamentos|farmacologia|calculadora-dose|psiquiatria|mchat|pre-consulta|pre-retorno|prontuario|agenda|recepcao)/,
    mascots: [legacyMascots.consultorioSuperman, legacyMascots.superDoctor, legacyMascots.consultorioBatman, legacyMascots.ninoRetired],
  },
  {
    test: /^\/(login|sessao-expirada|consentimento-lgpd|ajuda|sobre|sobre-neuroped|termos|qualidade|acessibilidade)/,
    mascots: [legacyMascots.superDoctor, legacyMascots.doctorSelfie, legacyMascots.consultorioFull, legacyMascots.ninoRetired],
  },
  {
    test: /^\/(tea|tea-comportamentos|snap|denver|sdq|scared|conners|vineland|cbcl|vanderbilt|brief2|abc|asq3|cdi2|phqa|cssrs|crafft|rcads|masc2)/,
    mascots: [legacyMascots.superDoctor, legacyMascots.consultorioBatman, legacyMascots.consultorioSuperman, legacyMascots.ninoRetired],
  },
];

const routesWithInlineNino = ["/", "/filtro", "/filtro-escalas", "/prontuario"];

// Durante a aplicação de uma escala o conteúdo clínico domina a tela: nenhum
// mascote decorativo compete com o questionário. A lista espelha as chaves de
// scaleReferences (slug = rota) SEM importar o catálogo — este componente vive
// no chunk inicial e os dados das referências estourariam o teto de bundle.
// test:loose-ends trava a sincronia entre esta lista e o catálogo.
const scaleApplicationSlugs = [
  "mchat", "cars", "denver", "snap", "sdq", "conners", "scared", "vineland",
  "cbcl", "vanderbilt", "brief2", "abc", "asq3", "gmfcs", "pedsql", "cshq",
  "ygtss", "cdi2", "phqa", "cssrs", "crafft",
];
const scaleApplicationRoutes = new Set(scaleApplicationSlugs.map((id) => `/${id}`));

function isScaleApplicationRoute(path: string): boolean {
  return scaleApplicationRoutes.has(path) || path.startsWith("/generic-scale/");
}

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

function getLegacyPool(path: string): LegacyMascot[] {
  return routePools.find(({ test }) => test.test(path))?.mascots ?? defaultLegacyPool;
}

function hasInlineNino(path: string): boolean {
  return routesWithInlineNino.includes(path) || path.startsWith("/generic-scale/");
}

function isDenseClinicalWorkspace(path: string): boolean {
  return /^\/(prontuario|agenda|recepcao|pacientes|paciente|pre-consulta|pre-retorno|documentos|laudo-neuroped|laudo-super|receita-c1|receita-c1-express|assinatura-digital|medicamentos|farmacologia|calculadora-dose)(?:\/|$)/.test(path);
}

/**
 * Assinatura visual global do NeuroPed.
 *
 * Dr. Jadson Fraga (desenho) é o personagem principal contemporâneo — guia
 * ativo do app, ver Mascote.tsx. O acervo histórico, incluindo o antigo guia
 * Nino, aparece como cameo secundário no desktop, preservando a memória
 * visual do produto sem competir com o fluxo clínico. A camada inteira é
 * decorativa, sem foco, clique ou alteração da semântica das páginas.
 */
export function PageMascotDecor() {
  const [location] = useLocation();
  const reduceMotion = useReducedMotion();
  const pathname = getPathname(location);
  const pool = getLegacyPool(pathname);
  // O cameo revez a TODO o acervo da rota em ciclo lento, para que nenhuma
  // arte histórica fique invisível na prática. Com prefers-reduced-motion a
  // imagem permanece estática (determinada pela rota).
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    if (reduceMotion) return;
    const timer = globalThis.setInterval(() => setCycle((value) => value + 1), 14_000);
    return () => globalThis.clearInterval(timer);
  }, [reduceMotion]);
  const legacy = pool[(stablePathHash(pathname) + cycle) % pool.length];
  const scaleFocus = isScaleApplicationRoute(pathname);
  const denseClinicalWorkspace = isDenseClinicalWorkspace(pathname);
  const showGlobalNino = !hasInlineNino(pathname) && !scaleFocus && !denseClinicalWorkspace;
  // O acervo continua disponível onde é conteúdo, não como FAB concorrente.
  const showLegacyCameo = pathname === "/sobre" || pathname === "/sobre-neuroped";

  return (
    <div
      className="np-mascot-layer pointer-events-none select-none print:hidden"
      aria-hidden="true"
      data-testid="page-mascot-decor"
      data-route={pathname}
    >
      {showGlobalNino && (
        <motion.div
          key={`guide-${pathname}`}
          initial={reduceMotion ? false : { opacity: 0, x: 14, y: -5, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          transition={{ duration: 0.46, ease: "easeOut" }}
          className="np-mascot-nino fixed -right-1 top-[4.9rem] z-20 h-[4.35rem] w-[4.35rem] sm:right-1 sm:h-20 sm:w-20 md:right-2 md:top-16 md:h-24 md:w-24 xl:right-5 xl:h-28 xl:w-28"
          data-mascot-era="novo"
          data-mascot-id="dr-jadson-guide"
        >
          <div className="np-mascot-orb" />
          <div className="absolute inset-[9%] rounded-full border border-white/45 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] backdrop-blur-[2px] dark:border-white/10" />
          <motion.img
            src={GUIDE_MASCOT_SRC}
            alt=""
            width="640"
            height="640"
            loading="lazy"
            decoding="async"
            animate={reduceMotion ? undefined : { y: [0, -4, 0], rotate: [0, 0.85, 0] }}
            transition={{ duration: 5.4, repeat: Infinity, ease: "easeInOut" }}
            className="relative h-full w-full object-contain opacity-[0.93] dark:opacity-[0.96]"
          />
          <span className="np-mascot-chip hidden sm:inline-flex">NeuroPed</span>
        </motion.div>
      )}

      {showLegacyCameo && (
      <motion.div
        key={`legacy-${pathname}-${legacy.id}`}
        initial={reduceMotion ? false : { opacity: 0, x: 10, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.06 }}
        className="np-mascot-legacy fixed bottom-[9.5rem] right-5 z-20 hidden md:block"
        data-mascot-era="legado"
        data-mascot-id={legacy.id}
      >
        <div className="np-mascot-legacy-card">
          <div className="absolute -right-3 -top-3 h-9 w-9 rounded-full bg-primary/15 blur-xl" />
          <img
            src={legacy.src}
            alt=""
            width="160"
            height="160"
            loading="lazy"
            decoding="async"
            className={`relative h-16 w-16 rounded-[0.9rem] object-cover opacity-[0.9] xl:h-20 xl:w-20 xl:opacity-[0.95] ${legacy.objectPosition ?? "object-center"}`}
          />
        </div>
      </motion.div>
      )}
    </div>
  );
}
