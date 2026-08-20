import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const cockpit = read("client/src/components/clinical/PatientCockpit.tsx");
const patient = read("client/src/pages/paciente-detalhe.tsx");

assert.match(
  patient,
  /PatientCockpit/,
  "detalhe do paciente deve incorporar o cockpit longitudinal",
);
assert.match(
  patient,
  /<PatientCockpit[\s\S]*?scaleCount=\{\s*resultsLoading \|\| resultsUnavailable \? null : results\.length\s*\}/,
  "cockpit deve permanecer montado quando avaliações estão indisponíveis",
);
assert.match(cockpit, /scaleCount: number \| null/);
assert.match(
  cockpit,
  /liveScaleCount === null \? "Indisponível(?: no LIVE)?"/,
  "escalas devem ficar explicitamente indisponíveis quando o cockpit está no LIVE",
);
assert.match(
  cockpit,
  /\/api\/clinical-core\/events/,
  "cockpit deve consumir o Clinical Core canônico",
);
assert.match(
  cockpit,
  /\/api\/consultations/,
  "cockpit deve contextualizar consultas existentes",
);
assert.match(
  cockpit,
  /\/api\/conecta\/events/,
  "cockpit deve contextualizar a jornada Conecta",
);
assert.match(
  cockpit,
  /Ausência de registro não é interpretada como normalidade/i,
  "UI deve explicitar limite de ausência de dado",
);
assert.match(
  cockpit,
  /Isso não confirma ausência de risco/i,
  "estado vazio de segurança não pode ser interpretado como risco ausente",
);
assert.doesNotMatch(
  cockpit,
  /diagnóstico confirmado automaticamente|aumente a dose|reduza a dose|suspenda a medicação/i,
);

console.log(
  "✓ Patient Cockpit: integração longitudinal e microcopy clínica segura aprovadas",
);
