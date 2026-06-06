import { useCallback } from "react";
import { softTap, softSuccess, softError, softBell, isSoundEnabled } from "@/lib/softSounds";
import { playCoin, play1Up, playPowerUp } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";

/**
 * Hook semântico de feedback sonoro/háptico.
 * Unifica os primitivos existentes (softSounds + sounds 8-bit) numa API simples:
 *   clique · sucesso · alerta · celebração.
 * Respeita a preferência global de som (localStorage "neuroped:sounds").
 */
export function useSound() {
  const clique = useCallback(() => {
    if (!isSoundEnabled()) return;
    softTap();
    haptic.tap();
  }, []);

  const sucesso = useCallback(() => {
    if (!isSoundEnabled()) return;
    softSuccess();
    haptic.success();
  }, []);

  const alerta = useCallback(() => {
    if (!isSoundEnabled()) return;
    softError();
    softBell();
    haptic.error();
  }, []);

  const celebracao = useCallback(() => {
    if (!isSoundEnabled()) return;
    playCoin();
    playPowerUp();
    play1Up();
    haptic.success();
  }, []);

  return { clique, sucesso, alerta, celebracao, enabled: isSoundEnabled() };
}
