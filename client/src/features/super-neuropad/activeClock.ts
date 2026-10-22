export interface ActiveClock {
  elapsedSeconds: number;
  segmentStartedAt: number | null;
}

export const emptyActiveClock = (): ActiveClock => ({ elapsedSeconds: 0, segmentStartedAt: null });

/** Fecha o segmento anterior e inicia ou pausa o próximo, sem contar o intervalo em pausa. */
export function transitionActiveClock(clock: ActiveClock, now: number, running: boolean): ActiveClock {
  const elapsedSeconds = clock.elapsedSeconds + (clock.segmentStartedAt === null ? 0 : Math.max(0, now - clock.segmentStartedAt) / 1000);
  return { elapsedSeconds, segmentStartedAt: running ? now : null };
}

export function activeClockSeconds(clock: ActiveClock, now: number): number {
  return clock.elapsedSeconds + (clock.segmentStartedAt === null ? 0 : Math.max(0, now - clock.segmentStartedAt) / 1000);
}
