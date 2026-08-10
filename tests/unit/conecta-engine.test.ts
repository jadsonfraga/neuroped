import assert from "node:assert/strict";
import { buildConectaInsights, eventsWithinDays } from "../../client/src/lib/conectaEngine";
import { CONECTA_DISCLAIMER, type ConectaEvent } from "../../shared/conecta";

const now = new Date("2026-08-10T12:00:00-03:00").getTime();

function event(
  id: string,
  dayOffset: number,
  category: ConectaEvent["category"],
  value?: number,
  extras: Partial<ConectaEvent> = {},
): ConectaEvent {
  const occurredAt = new Date(now - dayOffset * 24 * 60 * 60 * 1000).toISOString();
  return {
    id,
    patientId: "patient-1",
    category,
    occurredAt,
    ...(value != null ? { value } : {}),
    createdAt: occurredAt,
    storageMode: "local",
    ...extras,
  };
}

// Poucos registros nunca devem ser inflados em um insight.
const sparse = [
  event("s1", 1, "irritabilidade", 5),
  event("s2", 2, "irritabilidade", 5),
  event("s3", 3, "irritabilidade", 5),
];
assert.deepEqual(buildConectaInsights(sparse, 30, now), []);

// Tendência temporal precisa de contraste mínimo e linguagem não diagnóstica.
const trendEvents = [
  event("t1", 12, "irritabilidade", 1),
  event("t2", 10, "irritabilidade", 1),
  event("t3", 8, "irritabilidade", 2),
  event("t4", 6, "irritabilidade", 4),
  event("t5", 4, "irritabilidade", 5),
  event("t6", 2, "irritabilidade", 5),
];
const trend = buildConectaInsights(trendEvents, 30, now);
assert.ok(trend.some((item) => item.id === "trend-irritabilidade"));

// Comparação Casa × Escola só aparece com amostra em ambos os ambientes.
const environmentEvents = [
  event("a1", 6, "atencao", 5, { context: "casa" }),
  event("a2", 5, "atencao", 5, { context: "casa" }),
  event("a3", 4, "atencao", 4, { context: "casa" }),
  event("a4", 3, "atencao", 1, { context: "escola" }),
  event("a5", 2, "atencao", 2, { context: "escola" }),
  event("a6", 1, "atencao", 1, { context: "escola" }),
];
const environment = buildConectaInsights(environmentEvents, 30, now);
const comparison = environment.find((item) => item.id === "environment-attention");
assert.ok(comparison);
assert.match(comparison!.body, /não estabelece a causa/i);
const comparisonSafetyText = `${comparison!.body} ${comparison!.evidence.limitations.join(" ")}`;
assert.match(
  comparisonSafetyText,
  /\b(?:não|nem)\s+confirma\s+(?:o\s+)?diagnóstico\b/i,
  "a comparação deve explicitar, no corpo ou nas limitações, que não confirma diagnóstico",
);

// Associação sono-irritabilidade deve declarar explicitamente que não prova causa.
const associationEvents: ConectaEvent[] = [];
for (let day = 1; day <= 8; day += 1) {
  const lowSleep = day <= 4;
  associationEvents.push(
    event(`sleep-${day}`, day, "sono", undefined, { durationMinutes: lowSleep ? 360 : 600 }),
    event(`irr-${day}`, day, "irritabilidade", lowSleep ? 5 : 1),
  );
}
const association = buildConectaInsights(associationEvents, 30, now).find(
  (item) => item.id === "association-sleep-irritability",
);
assert.ok(association);
assert.match(association!.body, /sem demonstração de causa e efeito/i);
assert.ok(association!.evidence.limitations.some((item) => /causalidade/i.test(item)));

// Recorte temporal não deve carregar evento antigo.
const windowed = eventsWithinDays(
  [event("recent", 2, "humor", 2), event("old", 60, "humor", 5)],
  30,
  now,
);
assert.deepEqual(windowed.map((item) => item.id), ["recent"]);

const allInsightText = [
  ...trend,
  ...environment,
  ...(association ? [association] : []),
]
  .map((item) => `${item.title} ${item.body} ${item.evidence.limitations.join(" ")}`)
  .join(" ");
for (const forbidden of [
  /diagnóstico confirmado/i,
  /\b(isto|isso|este resultado|o resultado)\s+confirma\s+(o\s+)?diagnóstico\b/i,
  /aumente (a )?dose/i,
  /reduza (a )?dose/i,
  /suspenda (a )?medicação/i,
  /inicie (a )?medicação/i,
]) {
  assert.doesNotMatch(allInsightText, forbidden);
}

assert.match(CONECTA_DISCLAIMER, /não constitui diagnóstico, prescrição ou ajuste de tratamento/i);
console.log("✓ Conecta engine: limiares, transparência e linguagem clínica segura aprovados");
