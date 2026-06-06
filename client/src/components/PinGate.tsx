import { useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { verifyPin } from "@/lib/pinAuth";
import { softTap, softSuccess, softError } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import { easing, duration } from "@/lib/motion";

/**
 * Portão de PIN reutilizável da Área Restrita (prontuários do Dr. Jadson).
 * Extraído de pacientes.tsx / paciente-detalhe.tsx para que aqueles
 * componentes possam chamar todos os seus hooks de dados de forma
 * incondicional (regra react-hooks/rules-of-hooks) — o early-return passa a
 * renderizar este componente, cujos próprios hooks ficam isolados aqui.
 */
export function PinGate({
  onUnlock,
  inputTestId,
  buttonTestId,
  buttonClassName = "w-full",
}: {
  onUnlock: () => void;
  inputTestId: string;
  buttonTestId: string;
  buttonClassName?: string;
}) {
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [pinChecking, setPinChecking] = useState(false);

  async function handlePinSubmit() {
    if (!pin) return;
    setPinChecking(true);
    softTap();
    haptic.tap();
    const ok = await verifyPin(pin);
    setPinChecking(false);
    if (ok) {
      softSuccess();
      haptic.success();
      onUnlock();
    } else {
      softError();
      haptic.error();
      setPinError(true);
      setTimeout(() => setPinError(false), 3000);
    }
  }

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
          Área Restrita
        </h2>
        <p className="text-xs text-muted-foreground italic">Acesso exclusivo do Dr. Jadson</p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        <Input
          type="password"
          placeholder="PIN de acesso..."
          value={pin}
          onChange={(e) => { setPin(e.target.value); setPinError(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") handlePinSubmit(); }}
          className={`text-center h-12 text-lg ${pinError ? "border-red-400" : ""}`}
          data-testid={inputTestId}
        />
        {pinError && (
          <p className="text-xs text-red-500 text-center">PIN incorreto. Tente novamente.</p>
        )}
        <Button
          className={buttonClassName}
          onClick={handlePinSubmit}
          disabled={!pin || pinChecking}
          data-testid={buttonTestId}
        >
          {pinChecking ? "Verificando..." : "Acessar Prontuários"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Dados protegidos localmente. Modo demonstração — não inserir dados reais de pacientes.
      </p>
    </motion.div>
  );
}
