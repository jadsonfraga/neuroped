import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { easing, duration } from "@/lib/motion";

export function PinGate({
  buttonClassName = "w-full",
}: {
  onUnlock: () => void;
  inputTestId: string;
  buttonTestId: string;
  buttonClassName?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.normal, ease: easing.smooth }}
      className="flex flex-col items-center justify-center py-20 space-y-6"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: duration.normal, ease: easing.spring }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg"
      >
        <Lock className="w-8 h-8 text-white" strokeWidth={1.75} />
      </motion.div>
      <div className="text-center space-y-1">
        <h2
          className="text-2xl text-foreground"
          style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
        >
          Area restrita
        </h2>
        <p className="text-xs text-muted-foreground italic">Login nominal obrigatorio</p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        <Button
          className={buttonClassName}
          onClick={() => {
            window.location.hash = "/login";
          }}
        >
          Ir para login
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        O acesso por PIN local foi desativado. Dados reais de pacientes exigem backend autenticado.
      </p>
    </motion.div>
  );
}
