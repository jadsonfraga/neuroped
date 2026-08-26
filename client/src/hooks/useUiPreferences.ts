import { useCallback, useEffect, useState } from "react";
import {
  getSoundVolume,
  isSoundEnabled,
  setSoundEnabled,
  setSoundVolume,
  softMuteHint,
  SOUND_PREFERENCE_EVENT,
} from "@/lib/softSounds";
import { haptic, isHapticEnabled, setHapticEnabled } from "@/lib/haptic";

/** Preferências locais de som, vibração e movimento do usuário. */
export function useUiPreferences() {
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [soundVolume, setSoundVolumeState] = useState(() => getSoundVolume());
  const [hapticOn, setHapticOn] = useState(() => isHapticEnabled());
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (event: MediaQueryListEvent) =>
      setReducedMotion(event.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const syncSound = () => {
      setSoundOn(isSoundEnabled());
      setSoundVolumeState(getSoundVolume());
    };
    window.addEventListener(SOUND_PREFERENCE_EVENT, syncSound);
    return () => window.removeEventListener(SOUND_PREFERENCE_EVENT, syncSound);
  }, []);

  const toggleSound = useCallback(() => {
    const nextValue = !soundOn;
    setSoundEnabled(nextValue);
    setSoundOn(nextValue);
    if (nextValue) softMuteHint();
  }, [soundOn]);

  const updateSoundVolume = useCallback((value: number) => {
    const nextValue = Math.min(1, Math.max(0, value));
    setSoundVolume(nextValue);
    setSoundVolumeState(nextValue);
  }, []);

  const toggleHaptic = useCallback(() => {
    const nextValue = !hapticOn;
    setHapticEnabled(nextValue);
    setHapticOn(nextValue);
    if (nextValue) haptic.success();
  }, [hapticOn]);

  return {
    soundOn,
    soundVolume,
    hapticOn,
    reducedMotion,
    toggleSound,
    updateSoundVolume,
    toggleHaptic,
  };
}
