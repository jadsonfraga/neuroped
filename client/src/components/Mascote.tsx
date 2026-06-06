import { motion } from "framer-motion";
import drSuper from "@assets/images/dr-jadson-logo-super.jpeg";
import drSuperman from "@assets/images/dr-jadson-consultorio-superman.jpeg";
import drArte from "@assets/images/dr-jadson-arte.jpeg";
import drSelfie from "@assets/images/dr-jadson-selfie.jpeg";

/**
 * Mascote contextual do Dr. Jadson — reaproveita os assets de marca já existentes
 * (brand-dr-jadson do app legado). Aparece com fade-in + bounce suave e uma
 * fala curta conforme o contexto. Decorativo e acessível (aria-hidden na imagem).
 */

export type MascoteContexto = "home" | "resultado" | "celebracao" | "vazio";

interface MascoteData {
  src: string;
  alt: string;
  fala: string;
}

const MASCOTES: Record<MascoteContexto, MascoteData> = {
  home: {
    src: drSuper,
    alt: "Dr. Jadson — SuperNeuroPed",
    fala: "Bem-vindo! Vamos cuidar do desenvolvimento com leveza e ciência.",
  },
  resultado: {
    src: drSuperman,
    alt: "Dr. Jadson no consultório",
    fala: "Ótimo! Use este resultado como ponto de partida para a conversa clínica.",
  },
  celebracao: {
    src: drArte,
    alt: "Dr. Jadson — celebração",
    fala: "Parabéns por concluir! Cada passo conta. 🎉",
  },
  vazio: {
    src: drSelfie,
    alt: "Dr. Jadson Fraga",
    fala: "Comece escolhendo uma ferramenta no menu ao lado.",
  },
};

export function Mascote({
  contexto = "home",
  fala,
  size = "md",
  className = "",
}: {
  contexto?: MascoteContexto;
  /** Sobrescreve a fala padrão do contexto. */
  fala?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const data = MASCOTES[contexto];
  const dim = size === "sm" ? "w-12 h-12" : size === "lg" ? "w-20 h-20" : "w-16 h-16";
  const message = fala ?? data.fala;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className={`flex items-center gap-3 ${className}`}
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        className={`${dim} flex-shrink-0 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-lg bg-white`}
      >
        <img src={data.src} alt={data.alt} aria-hidden="true" className="w-full h-full object-cover" />
      </motion.div>
      {message && (
        <div className="relative rounded-2xl rounded-bl-sm bg-primary/10 border border-primary/20 px-3 py-2 text-xs text-foreground max-w-xs">
          {message}
        </div>
      )}
    </motion.div>
  );
}
