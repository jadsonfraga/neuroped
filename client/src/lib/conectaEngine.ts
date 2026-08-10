import {
  CONECTA_MIN_RECORDS_FOR_INSIGHT,
  conectaCategoryLabels,
  conectaContextLabels,
  type ConectaCategory,
  type ConectaEvent,
  type ConectaInsight,
} from "@shared/conecta";

const DAY_MS = 24 * 60 * 60 * 1000;

function timeOf(event: ConectaEvent): number {
  const value = new Date(event.occurredAt).getTime();
  return Number.isFinite(value) ? value : 0;
}

export function eventsWithinDays(
  events: ConectaEvent[],
  days: number,
  now = Date.now(),
): ConectaEvent[] {
  const start = now - Math.max(1, days) * DAY_MS;
  return events
    .filter((event) => {
      const time = timeOf(event);
      return time >= start && time <= now + 5 * 60 * 1000;
    })
    .sort((a, b) => timeOf(a) - timeOf(b));
}

function numeric(events: ConectaEvent[]): ConectaEvent[] {
  return events.filter(
    (event) => typeof event.value === "number" && Number.isFinite(event.value),
  );
}

function average(events: ConectaEvent[]): number | null {
  const values = numeric(events).map((event) => event.value as number);
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function evidence(
  periodDays: number,
  events: ConectaEvent[],
  sources: string[],
  limitations: string[],
) {
  return {
    periodDays,
    recordCount: events.length,
    sources: [...new Set(sources)],
    relatedRecordIds: events.map((event) => event.id),
    limitations,
  };
}

function categorySource(category: ConectaCategory): string {
  return conectaCategoryLabels[category];
}

function buildTemporalTrend(
  events: ConectaEvent[],
  periodDays: number,
  category: ConectaCategory,
): ConectaInsight | null {
  const selected = numeric(events.filter((event) => event.category === category));
  if (selected.length < 6) return null;
  const midpoint = Math.floor(selected.length / 2);
  const first = selected.slice(0, midpoint);
  const last = selected.slice(midpoint);
  const firstAverage = average(first);
  const lastAverage = average(last);
  if (firstAverage == null || lastAverage == null) return null;
  const delta = lastAverage - firstAverage;
  if (Math.abs(delta) < 0.55) return null;

  const label = conectaCategoryLabels[category].toLowerCase();
  const direction = delta > 0 ? "aumentou" : "diminuiu";
  return {
    id: `trend-${category}`,
    kind: "tendencia",
    title: `Tendência em ${conectaCategoryLabels[category]}`,
    body: `Nos registros disponíveis, a intensidade de ${label} ${direction} na parte mais recente do período analisado. Pode ser útil discutir esse padrão na próxima consulta.`,
    evidence: evidence(periodDays, selected, [categorySource(category)], [
      "A comparação usa apenas registros preenchidos e não representa períodos sem registro.",
      "Mudança temporal não demonstra causa.",
    ]),
  };
}

function buildEnvironmentComparison(
  events: ConectaEvent[],
  periodDays: number,
): ConectaInsight | null {
  const attention = numeric(events.filter((event) => event.category === "atencao"));
  const home = attention.filter((event) => event.context === "casa");
  const school = attention.filter((event) => event.context === "escola");
  if (home.length < 3 || school.length < 3) return null;
  const homeAverage = average(home);
  const schoolAverage = average(school);
  if (homeAverage == null || schoolAverage == null) return null;
  const delta = homeAverage - schoolAverage;
  if (Math.abs(delta) < 0.6) return null;
  const predominant = delta > 0 ? "em casa" : "na escola";
  const related = [...home, ...school];
  return {
    id: "environment-attention",
    kind: "ambiente",
    title: "Atenção em contextos diferentes",
    body: `Os registros de dificuldade de atenção foram mais intensos ${predominant} no período analisado. A diferença entre ambientes não estabelece a causa do padrão.`,
    evidence: evidence(
      periodDays,
      related,
      [conectaContextLabels.casa, conectaContextLabels.escola, categorySource("atencao")],
      [
        "Casa e escola podem ter quantidades e momentos de registro diferentes.",
        "A comparação descreve os registros; não mede causalidade nem confirma diagnóstico.",
      ],
    ),
  };
}

function hourBand(hour: number): "manhã" | "tarde" | "noite/madrugada" {
  if (hour >= 6 && hour < 12) return "manhã";
  if (hour >= 12 && hour < 18) return "tarde";
  return "noite/madrugada";
}

function buildTimeConcentration(
  events: ConectaEvent[],
  periodDays: number,
  category: ConectaCategory,
): ConectaInsight | null {
  const selected = events.filter((event) => event.category === category);
  if (selected.length < 5) return null;
  const counts = new Map<string, number>();
  for (const event of selected) {
    const date = new Date(event.occurredAt);
    if (!Number.isFinite(date.getTime())) continue;
    const band = hourBand(date.getHours());
    counts.set(band, (counts.get(band) ?? 0) + 1);
  }
  const winner = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!winner || winner[1] / selected.length < 0.6) return null;
  return {
    id: `time-${category}`,
    kind: category === "crise_epileptica" ? "neurologico" : "horario",
    title: `Concentração de ${conectaCategoryLabels[category]}`,
    body: `Os registros disponíveis de ${conectaCategoryLabels[category].toLowerCase()} ocorreram com maior frequência no período da ${winner[0]}. Esse padrão descreve horários registrados e não identifica a causa.`,
    evidence: evidence(periodDays, selected, [categorySource(category), "Horário dos registros"], [
      "Horários sem registro não são considerados eventos ausentes.",
      "A concentração temporal não demonstra relação causal.",
    ]),
  };
}

function localDateKey(iso: string): string | null {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildSleepIrritabilityAssociation(
  events: ConectaEvent[],
  periodDays: number,
): ConectaInsight | null {
  const sleeps = events.filter(
    (event) => event.category === "sono" && typeof event.durationMinutes === "number" && event.durationMinutes > 0,
  );
  const irritability = numeric(events.filter((event) => event.category === "irritabilidade"));
  if (sleeps.length < 4 || irritability.length < 4) return null;

  const sleepByDay = new Map<string, number[]>();
  for (const event of sleeps) {
    const key = localDateKey(event.occurredAt);
    if (!key) continue;
    const bucket = sleepByDay.get(key) ?? [];
    bucket.push(event.durationMinutes as number);
    sleepByDay.set(key, bucket);
  }
  const irritabilityByDay = new Map<string, number[]>();
  for (const event of irritability) {
    const key = localDateKey(event.occurredAt);
    if (!key) continue;
    const bucket = irritabilityByDay.get(key) ?? [];
    bucket.push(event.value as number);
    irritabilityByDay.set(key, bucket);
  }

  const pairs: Array<{ sleep: number; irritation: number; ids: string[] }> = [];
  for (const [key, durations] of sleepByDay) {
    const values = irritabilityByDay.get(key);
    if (!values?.length) continue;
    pairs.push({
      sleep: durations.reduce((a, b) => a + b, 0) / durations.length,
      irritation: values.reduce((a, b) => a + b, 0) / values.length,
      ids: [
        ...sleeps.filter((event) => localDateKey(event.occurredAt) === key).map((event) => event.id),
        ...irritability.filter((event) => localDateKey(event.occurredAt) === key).map((event) => event.id),
      ],
    });
  }
  if (pairs.length < 4) return null;
  const sortedSleep = [...pairs].sort((a, b) => a.sleep - b.sleep);
  const split = Math.floor(sortedSleep.length / 2);
  const lowSleep = sortedSleep.slice(0, split);
  const highSleep = sortedSleep.slice(split);
  if (!lowSleep.length || !highSleep.length) return null;
  const lowIrr = lowSleep.reduce((sum, pair) => sum + pair.irritation, 0) / lowSleep.length;
  const highIrr = highSleep.reduce((sum, pair) => sum + pair.irritation, 0) / highSleep.length;
  if (lowIrr - highIrr < 0.6) return null;

  const relatedIds = [...new Set(pairs.flatMap((pair) => pair.ids))];
  const related = events.filter((event) => relatedIds.includes(event.id));
  return {
    id: "association-sleep-irritability",
    kind: "associacao",
    title: "Sono e irritabilidade apareceram juntos",
    body: "Nos dias com menor duração de sono registrada, houve maior intensidade média de irritabilidade registrada. Trata-se de uma associação nos dados disponíveis, sem demonstração de causa e efeito.",
    evidence: evidence(periodDays, related, [categorySource("sono"), categorySource("irritabilidade")], [
      "A análise usa somente dias em que sono e irritabilidade foram registrados.",
      "Outros fatores não medidos podem explicar a associação.",
      "Associação não significa causalidade.",
    ]),
  };
}

function buildNeurologicalSummary(
  events: ConectaEvent[],
  periodDays: number,
): ConectaInsight | null {
  const seizures = events.filter((event) => event.category === "crise_epileptica");
  if (seizures.length < CONECTA_MIN_RECORDS_FOR_INSIGHT) return null;
  const durations = seizures
    .map((event) => event.durationMinutes)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const durationText = durations.length
    ? ` A duração média registrada foi de ${Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)} minuto(s).`
    : "";
  return {
    id: "neurological-events",
    kind: "neurologico",
    title: "Resumo de eventos neurológicos",
    body: `Foram registrados ${seizures.length} eventos classificados como crise epiléptica neste período.${durationText} O registro organiza a linha do tempo e não determina etiologia nem orienta dose.`,
    evidence: evidence(periodDays, seizures, [categorySource("crise_epileptica")], [
      "A contagem depende do preenchimento do diário.",
      "A classificação informada no registro não substitui revisão clínica do evento.",
    ]),
  };
}

export function buildConectaInsights(
  allEvents: ConectaEvent[],
  periodDays: number,
  now = Date.now(),
): ConectaInsight[] {
  const events = eventsWithinDays(allEvents, periodDays, now);
  if (events.length < CONECTA_MIN_RECORDS_FOR_INSIGHT) return [];

  const candidates: Array<ConectaInsight | null> = [
    buildTemporalTrend(events, periodDays, "irritabilidade"),
    buildTemporalTrend(events, periodDays, "atencao"),
    buildTemporalTrend(events, periodDays, "apetite"),
    buildEnvironmentComparison(events, periodDays),
    buildSleepIrritabilityAssociation(events, periodDays),
    buildTimeConcentration(events, periodDays, "irritabilidade"),
    buildTimeConcentration(events, periodDays, "atencao"),
    buildTimeConcentration(events, periodDays, "crise_epileptica"),
    buildNeurologicalSummary(events, periodDays),
  ];

  return candidates.filter((insight): insight is ConectaInsight => insight !== null).slice(0, 6);
}

export function latestConectaEvent(events: ConectaEvent[]): ConectaEvent | null {
  return [...events].sort((a, b) => timeOf(b) - timeOf(a))[0] ?? null;
}

export function countByCategory(events: ConectaEvent[], days: number): Partial<Record<ConectaCategory, number>> {
  const counts: Partial<Record<ConectaCategory, number>> = {};
  for (const event of eventsWithinDays(events, days)) {
    counts[event.category] = (counts[event.category] ?? 0) + 1;
  }
  return counts;
}
