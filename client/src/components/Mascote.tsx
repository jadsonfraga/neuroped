import { motion, useReducedMotion } from "framer-motion";

export type MascoteContexto = "home" | "resultado" | "celebracao" | "vazio";

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
    >
      <div className="absolute inset-x-[18%] bottom-12 h-10 rounded-full bg-primary/15 blur-2xl" aria-hidden="true" />
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -7, 0], rotate: [0, 0.8, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
        className={`relative ${SIZES[size]} shrink-0 drop-shadow-[0_22px_22px_rgba(31,24,43,0.18)]`}
      >
        <img
          src="/neuroped-mascot-premium.webp"
          alt="Nino, mascote cerebral do NeuroPed, usando jaleco e segurando um escudo"
          width="640"
          height="640"
          loading={contexto === "home" ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-contain"
        />
      </motion.div>
      {message && (
        <figcaption className="relative -mt-3 max-w-[17rem] rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-center text-[12px] font-medium leading-relaxed text-slate-700 shadow-[0_14px_35px_-18px_rgba(31,24,43,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/65 dark:text-slate-200">
          <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-white/70 bg-white/80 dark:border-white/10 dark:bg-slate-950/65" aria-hidden="true" />
          {message}
        </figcaption>
      )}
    </motion.figure>
  );
}
