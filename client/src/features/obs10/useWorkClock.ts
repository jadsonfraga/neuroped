import { useCallback, useEffect, useRef, useState } from "react";
import { elapsedWork, type PilotRecord, type WorkPhase } from "./pilot";

/** Measures only deliberately started visible-work segments. Never labels inactivity as work. */
export function useWorkClock(onSegment: (log: PilotRecord["logs"][number]) => void) {
  const active = useRef<{ phase: WorkPhase; start: number } | null>(null);
  const callback = useRef(onSegment); callback.current = onSegment;
  const [phase, setPhase] = useState<WorkPhase | null>(null);
  const [seconds, setSeconds] = useState(0);
  const stop = useCallback((endedBy: PilotRecord["logs"][number]["endedBy"] = "manual") => {
    const a = active.current; if (!a) return;
    active.current = null;
    callback.current({ phase: a.phase, seconds: elapsedWork(a.start, performance.now()), endedBy });
    setPhase(null); setSeconds(0);
  }, []);
  const start = (next: WorkPhase) => { stop("troca de etapa"); active.current = { phase: next, start: performance.now() }; setPhase(next); setSeconds(0); };
  const reset = useCallback(() => { active.current = null; setPhase(null); setSeconds(0); }, []);
  useEffect(() => {
    const id = setInterval(() => { const a = active.current; if (!a) return; const n = elapsedWork(a.start, performance.now()); setSeconds(n); if (n >= 7200) stop("limite"); }, 500);
    const hidden = () => { if (document.hidden) stop("aba oculta"); };
    document.addEventListener("visibilitychange", hidden);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", hidden); active.current = null; };
  }, [stop]);
  return { phase, seconds, start, stop, reset };
}
