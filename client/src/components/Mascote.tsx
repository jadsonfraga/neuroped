import { motion, useReducedMotion } from "framer-motion";

export type MascoteContexto = "home" | "resultado" | "celebracao" | "vazio";

/**
 * Guia visual do NeuroPed. A partir de 2026 o personagem passou de "Nino" (mascote
 * cerebral genérico) para o próprio Dr. Jadson Fraga em desenho — mantendo o mesmo
 * papel de guia contextual, apenas com a identidade real da marca.
 * Nino permanece publicado no app (acervo histórico em /sobre e no cameo rotativo
 * do rodapé das páginas), apenas não é mais o personagem ativo aqui.
 */
const FALAS: Record<MascoteContexto, string> = {
  home: "Olá! Eu organizo o caminho para você decidir com mais clareza.",
  resultado: "Resultado pronto. Agora revise os sinais e o contexto clínico.",
  celebracao: "Tudo concluído — cada observação ajuda a contar a história clínica.",
  vazio: "Vamos começar? Escolha uma ferramenta e eu acompanho você.",
};

const SIZES = {
  sm: "h-20 w-20",
  md: "h-36 w-36 sm:h-44 sm:w-44",
  lg: "h-52 w-52 sm:h-64 sm:w-64",
};

export function Mascote({
  contexto = "home",
  fala,
  size = "md",
  className = "",
}: {
  contexto?: MascoteContexto;
  fala?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const message = fala ?? FALAS[contexto];

  return (
    <motion.figure
      initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 150, damping: 20 }}
      className={`relative m-0 flex flex-col items-center ${className}`}
      data-testid="mascote-dr-jadson-guide"
    >
      <div
        className="absolute inset-x-[12%] bottom-10 h-14 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.2),transparent_70%)] blur-2xl"
        aria-hidden="true"
      />
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -7, 0], rotate: [0, 0.8, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
        className={`relative ${SIZES[size]} shrink-0`}
      >
        <div
          className="absolute inset-[7%] rounded-full border border-white/50 bg-gradient-to-br from-white/40 via-primary/[0.06] to-chart-2/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_24px_50px_-30px_hsl(var(--primary)/0.45)] backdrop-blur-sm dark:border-white/10 dark:from-white/[0.05] dark:via-primary/[0.08] dark:to-chart-2/[0.07]"
          aria-hidden="true"
        />
        <motion.div
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[2%] rounded-full border border-dashed border-primary/10 dark:border-primary/15"
          aria-hidden="true"
        >
          <span className="absolute left-[9%] top-[28%] h-2 w-2 rounded-full bg-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.28)]" />
          <span className="absolute bottom-[18%] right-[6%] h-1.5 w-1.5 rounded-full bg-[hsl(var(--np-brand-gold)/0.55)] shadow-[0_0_10px_hsl(var(--np-brand-gold)/0.3)]" />
        </motion.div>
        <img
          src="/dr-jadson-mascot-guide.webp"
          alt="Dr. Jadson Fraga em desenho, guia do NeuroPed, de jaleco com o distintivo da clínica"
          width="640"
          height="640"
          loading={contexto === "home" ? "eager" : "lazy"}
          decoding="async"
          className="relative z-10 h-full w-full object-contain drop-shadow-[0_22px_22px_rgba(31,24,43,0.18)]"
        />
      </motion.div>
      {message && (
        <figcaption className="relative -mt-3 max-w-[18rem] rounded-[1.15rem] border border-white/70 bg-card/[0.85] px-4 py-3.5 text-center text-[12px] font-medium leading-relaxed text-foreground/[0.78] shadow-[0_16px_40px_-22px_hsl(var(--foreground)/0.38)] backdrop-blur-xl dark:border-white/10">
          <span
            className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-white/70 bg-card/[0.85] dark:border-white/10"
            aria-hidden="true"
          />
          <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/[0.065] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.11em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--np-brand-gold))]" aria-hidden="true" />
            Dr. Jadson · guia do NeuroPed
          </span>
          <span className="block">{message}</span>
        </figcaption>
      )}
    </motion.figure>
  );
}
