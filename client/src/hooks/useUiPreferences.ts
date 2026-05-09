import { useEffect, useState, useCallback } from "react";
import { isSoundEnabled, setSoundEnabled, softMuteHint } from "@/lib/softSounds";
import { isHapticEnabled, setHapticEnabled, haptic } from "@/lib/haptic";

/**
 * Hook centralizado para preferencias UI/UX do usuario.
 * Som, vibracao, modo reduzido. Persistido em localStorage.
 */
export function useUiPreferences() {
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [hapticOn, setHapticOn] = useState(isHapticEnabled());
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggleSound = useCallback(() => {
    const newVal = !soundOn;
    setSoundEnabled(newVal);
    setSoundOn(newVal);
    if (newVal) softMuteHint();
  }, [soundOn]);

  const toggleHaptic = useCallback(() => {
    const newVal = !hapticOn;
    setHapticEnabled(newVal);
    setHapticOn(newVal);
    if (newVal) haptic.success();
  }, [hapticOn]);

  return {
    soundOn,
    hapticOn,
    reducedMotion,
    toggleSound,
    toggleHaptic,
  };
}
