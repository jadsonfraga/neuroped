import { useCallback } from "react";
import { haptic } from "@/lib/haptic";
import { isSoundEnabled } from "@/lib/softSounds";
import { uiFeedback } from "@/lib/uiFeedback";

/**
 * Hook semântico de feedback sensorial.
 *
 * Som e vibração são independentes. Cliques rotineiros não produzem áudio;
 * confirmações, alertas e informações relevantes passam pela política central.
 */
export function useSound() {
  const clique = useCallback(() => {
    haptic.tap();
  }, []);

  const sucesso = useCallback(() => {
    uiFeedback.success();
  }, []);

  const alerta = useCallback(() => {
    uiFeedback.error();
  }, []);

  const celebracao = useCallback(() => {
    uiFeedback.success();
  }, []);

  return {
    clique,
    sucesso,
    alerta,
    celebracao,
    enabled: isSoundEnabled(),
  };
}
