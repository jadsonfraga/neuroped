export interface ActiveClock {
  elapsedSeconds: number;
  segmentStartedAt: number | null;
}

export const emptyActiveClock = (): ActiveClock => ({ elapsedSeconds: 0, segmentStartedAt: null });

/** Fecha o segmento anterior e inicia ou pausa o próximo, sem contar o intervalo em pausa. */
export function transitionActiveClock(clock: ActiveClock, now: number, running: boolean): ActiveClock {
  return { elapsedSeconds: activeClockSeconds(clock, now), segmentStartedAt: running ? now : null };
}

/** Segundos ativos até `now`, incluindo o segmento em curso (se estiver rodando). */
export function activeClockSeconds(clock: ActiveClock, now: number): number {
  return clock.elapsedSeconds + (clock.segmentStartedAt === null ? 0 : Math.max(0, now - clock.segmentStartedAt) / 1000);
}
