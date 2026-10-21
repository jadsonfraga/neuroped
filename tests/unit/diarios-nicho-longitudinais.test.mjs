import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8").replace(/\r\n?/g, "\n");

const diaries = [
  {
    file: "client/src/pages/diario-aderencia.tsx",
    id: "diario-aderencia",
    storageKey: "neuroped:diario:aderencia:v1",
    route: "/diario-aderencia",
    title: "Diário de aderência",
    trendKey: "percepcao",
  },
  {
    file: "client/src/pages/diario-desregulacao.tsx",
    id: "diario-desregulacao",
    storageKey: "neuroped:diario:desregulacao:v1",
    route: "/diario-desregulacao",
    title: "Diário de desregulação",
    trendKey: "intensidade",
  },
  {
    file: "client/src/pages/diario-dieta-sensorial.tsx",
    id: "diario-dieta-sensorial",
    storageKey: "neuroped:diario:dieta-sensorial:v1",
    route: "/diario-dieta-sensorial",
    title: "Diário da dieta sensorial",
    trendKey: "resposta",
  },
];

const app = read("client/src/App.tsx");
const known = read("client/src/security/knownRoutes.ts");
const guard = read("client/src/security/routeGuardPolicy.ts");
const navigation = read("client/src/data/navigation.ts");
const publicRoutes = read("client/src/lib/publicRoutes.ts");
const engine = read("client/src/components/DiarioClinico.tsx");
const filter = read("client/src/data/scaleFilter.ts");
const clinical = read("tests/clinical/test-clinical.mjs");

assert.match(engine, /const localDraftEnabled = !\(accessMode === "remote" && isAuthenticated\)/);
assert.match(engine, /data-testid="diario-local-persistence-disabled"/);
assert.match(engine, /NÃO pontua/);

const ids = new Set();
const storageKeys = new Set();
for (const diary of diaries) {
  const source = read(diary.file);
  assert.equal(ids.has(diary.id), false, `id repetido: ${diary.id}`);
  assert.equal(storageKeys.has(diary.storageKey), false, `storageKey repetida: ${diary.storageKey}`);
  ids.add(diary.id);
  storageKeys.add(diary.storageKey);

  assert.match(source, /from "@\/components\/DiarioClinico"/);
  assert.match(source, /<DiarioClinico config=\{config\} \/>/);
  assert.match(source, new RegExp(`id: "${diary.id}"`));
  assert.match(source, new RegExp(`storageKey: "${diary.storageKey}"`));
  assert.match(source, new RegExp(`title: "${diary.title}"`));
  assert.match(source, /Registro observacional/);
  assert.match(source, /Não é escore, não é ponto de corte e não é diagnóstico\./);
  assert.match(source, /key: "date", label: "Data", type: "date", required: true/);
  assert.equal(
    [...source.matchAll(/trend: true/g)].length,
    1,
    `${diary.id} deve ter uma única série de tendência`,
  );
  assert.match(source, new RegExp(`key: "${diary.trendKey}"[\\s\\S]*trend: true`));
  assert.match(source, /min: 1,\s*max: 5/);
  assert.doesNotMatch(source, /secureGet|secureSet|localStorage|toISOString/);
  assert.doesNotMatch(
    source,
    /diagnóstico de|confirma o diagnóstico|escore total|escore oficial|ponto de corte oficial|Sensory Profile|Perfil Sensorial|percentil|normat/i,
    `${diary.id} não pode parecer instrumento pontuado ou licenciado`,
  );

  assert.match(app, new RegExp(`<Route path="${diary.route}" component=\\{\\w+\\} />`));
  assert.match(known, new RegExp(`"${diary.route}"`));
  assert.match(guard, new RegExp(`"${diary.route}",`));
  assert.match(navigation, new RegExp(`href: "${diary.route}"`));
  assert.doesNotMatch(publicRoutes, new RegExp(`"${diary.route}"`));
  assert.doesNotMatch(filter, new RegExp(diary.route.replaceAll("/", "\\/")));
  assert.match(clinical, new RegExp(`"${diary.route}"`));
}

const sensitiveBlock = guard.slice(
  guard.indexOf("export const SENSITIVE_ROUTES"),
  guard.indexOf("export const READER_CLINICAL_ROUTES"),
);
for (const diary of diaries) {
  assert.match(sensitiveBlock, new RegExp(`"${diary.route}"`));
  assert.doesNotMatch(
    guard.slice(guard.indexOf("export const READER_CLINICAL_ROUTES")),
    new RegExp(`"${diary.route}"`),
    `${diary.route} não pode abrir para o papel reader`,
  );
}

console.log("✓ três diários de nicho: observacionais, fora do filtro e fail-closed no motor LIVE");
