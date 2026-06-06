import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Web Speech API (síntese de voz PT-BR) para a CAA.
 * Seleciona automaticamente uma voz em português quando disponível.
 */
export function useSpeech() {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text: string, rate = 0.84) => {
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "pt-BR";
    u.rate = rate;
    u.pitch = 1;
    u.volume = 1;
    const voices = voicesRef.current.length ? voicesRef.current : synth.getVoices();
    const pt =
      voices.find((v) => /pt-BR|pt_BR/i.test(v.lang)) ||
      voices.find((v) => /pt|Portuguese/i.test(v.lang));
    if (pt) u.voice = pt;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.speak(u);
  }, []);

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  return { supported, speaking, speak, cancel };
}
