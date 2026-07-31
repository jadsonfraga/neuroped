// @ts-check
/**
 * Regressão focada do IPN-TEA 200.
 *
 * Garante que os dez módulos operacionais extraídos do documento autoral:
 *  - existem no catálogo e abrem como aplicações completas;
 *  - entregam exatamente 380 itens/prompts (320 multicontextuais + 60 por idade);
 *  - respeitam idade, informante e alfabetização;
 *  - não contaminam casos incompatíveis com módulos de outra faixa.
 */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const imp = (rel) => import(pathToFileURL(resolve(repoRoot, rel)).href);

const { allScales } = await imp("client/src/data/scaleFilter.ts");
const { mergeFilterableCatalog } = await imp(
  "client/src/data/filterableCatalog.ts",
);
const { filterScalesIntelligently, getLiteracyRequirement } = await imp(
  "client/src/data/advancedFilterLogic.ts",
);
const { interactiveScaleItems } = await imp(
  "client/src/data/interactiveScaleItems.ts",
);

const EXPECTED_COUNTS = {
  "ipn-tea-familia-100": 100,
  "ipn-tea-escola-100": 100,
  "ipn-tea-adolescente-60": 60,
  "ipn-tea-observacao-60": 60,
  "ipn-tea-18-30m": 10,
  "ipn-tea-31-47m": 10,
  "ipn-tea-4-5a": 10,
  "ipn-tea-6-8a": 10,
  "ipn-tea-9-12a": 10,
  "ipn-tea-13-17a": 10,
};

const IPN_IDS = Object.keys(EXPECTED_COUNTS);
const AGE_IDS = IPN_IDS.filter((id) => /(?:m|a)$/.test(id));
const catalog = mergeFilterableCatalog(allScales);
const run = (ctx) =>
  filterScalesIntelligently(catalog, {
    queixas: ["tea"],
    selectedSignals: [],
    ...ctx,
  });

let failures = 0;
let checks = 0;
function ok(condition, message) {
  checks++;
  if (!condition) {
    failures++;
    console.error(`  ❌ ${message}`);
  }
}
function head(title) {
  console.log(`\n=== ${title} ===`);
}

head("A) Catálogo e conteúdo integral");
let deliveredTotal = 0;
for (const [id, expected] of Object.entries(EXPECTED_COUNTS)) {
  const scale = allScales.find((entry) => entry.id === id);
  const definition = interactiveScaleItems[id];
  const delivered = (definition?.domains ?? []).reduce(
    (total, domain) => total + (domain.items?.length ?? 0),
    0,
  );
  deliveredTotal += delivered;

  ok(Boolean(scale), `${id}: cadastrado em allScales`);
  ok(
    scale?.implementationStatus === "complete",
    `${id}: marcado como aplicação completa`,
  );
  ok(Boolean(definition), `${id}: definição interativa presente`);
  ok(delivered === expected, `${id}: ${delivered}/${expected} itens entregues`);
}
ok(
  deliveredTotal === 380,
  `conteúdo operacional integral: ${deliveredTotal}/380 itens e prompts`,
);

head("B) Módulo etário correto — sem vazamento entre faixas");
for (const [ageMonths, expectedId] of [
  [23, "ipn-tea-18-30m"],
  [36, "ipn-tea-31-47m"],
  [60, "ipn-tea-4-5a"],
  [84, "ipn-tea-6-8a"],
  [132, "ipn-tea-9-12a"],
  [180, "ipn-tea-13-17a"],
]) {
  const matches = run({
    ageMonths,
    respondente: "clinico",
    assessmentUse: "triagem",
  });
  const returnedAgeIds = matches
    .map((match) => match.scale.id)
    .filter((id) => AGE_IDS.includes(id));
  ok(
    returnedAgeIds.includes(expectedId),
    `${ageMonths}m: recomenda ${expectedId}`,
  );
  ok(
    returnedAgeIds.every((id) => id === expectedId),
    `${ageMonths}m: não recomenda módulo IPN de outra faixa (${returnedAgeIds.join(", ") || "nenhum"})`,
  );
}

head("C) Informante e finalidade clínica");
{
  const family = run({
    ageMonths: 84,
    respondente: "pais",
    assessmentUse: "diagnostico",
  });
  ok(
    family.some((match) => match.scale.id === "ipn-tea-familia-100"),
    "7 anos + pais + diagnóstico: inclui Família 100",
  );
  ok(
    !family.some((match) => match.scale.id === "ipn-tea-escola-100"),
    "pais: não recebe inventário escolar",
  );
  ok(
    !family.some((match) => match.scale.id === "ipn-tea-observacao-60"),
    "pais: não recebe observação clínica",
  );

  const school = run({
    ageMonths: 84,
    respondente: "professor",
    assessmentUse: "diagnostico",
  });
  ok(
    school.some((match) => match.scale.id === "ipn-tea-escola-100"),
    "7 anos + professor + diagnóstico: inclui Escola 100",
  );
  ok(
    !school.some((match) => match.scale.id === "ipn-tea-familia-100"),
    "professor: não recebe inventário familiar",
  );

  const clinical = run({
    ageMonths: 84,
    respondente: "clinico",
    assessmentUse: "diagnostico",
  });
  ok(
    clinical.some((match) => match.scale.id === "ipn-tea-observacao-60"),
    "7 anos + clínico + diagnóstico: inclui Observação 60",
  );
}

head("D) Adolescente, autorrelato e alfabetização");
{
  const literate = run({
    ageMonths: 180,
    respondente: "autoaplicavel",
    assessmentUse: "diagnostico",
    isLiterate: true,
  });
  ok(
    literate.some((match) => match.scale.id === "ipn-tea-adolescente-60"),
    "15 anos alfabetizado: inclui autorrelato de 60 itens",
  );

  const preLiterate = run({
    ageMonths: 180,
    respondente: "autoaplicavel",
    assessmentUse: "diagnostico",
    isLiterate: false,
  });
  ok(
    !preLiterate.some((match) => match.scale.id === "ipn-tea-adolescente-60"),
    "não alfabetizado: bloqueia autorrelato textual",
  );

  const adolescent = allScales.find(
    (scale) => scale.id === "ipn-tea-adolescente-60",
  );
  ok(
    Boolean(adolescent) &&
      getLiteracyRequirement(adolescent) === "alfabetizado",
    "metadado explícito de alfabetização preservado",
  );
}

head("E) Limites essenciais");
{
  const toddler = run({
    ageMonths: 23,
    respondente: "pais",
    assessmentUse: "diagnostico",
  });
  ok(
    !toddler.some((match) => match.scale.id === "ipn-tea-adolescente-60"),
    "23 meses: nunca oferece autorrelato adolescente",
  );
  ok(
    !toddler.some((match) => match.scale.id === "ipn-tea-escola-100"),
    "23 meses + pais: não oferece inventário escolar",
  );

  const allIpn = allScales.filter((scale) => IPN_IDS.includes(scale.id));
  ok(
    allIpn.every((scale) => scale.suicideRiskInstrument === false),
    "nenhum IPN amplo é classificado como instrumento específico de suicídio",
  );
  ok(
    allIpn.every((scale) => scale.psychosisRiskInstrument === false),
    "nenhum IPN amplo é classificado como instrumento específico de psicose",
  );
  ok(
    allIpn.every((scale) =>
      /sem ponto de corte|sem soma|sem validação|qualitativo|descritivo/i.test(
        `${scale.scoringCutoff} ${scale.validacaoBrasil}`,
      ),
    ),
    "todos explicitam limites de interpretação",
  );
}

head("F) Respostas mistas e sentinelas clínicas");
{
  const adolescentItems = interactiveScaleItems[
    "ipn-tea-adolescente-60"
  ].domains.flatMap((domain) => domain.items);
  const ideation = adolescentItems.find(
    (item) =>
      typeof item !== "string" &&
      /melhor não existir|desaparecer ou morrer/i.test(item.text),
  );
  const selfHarm = adolescentItems.find(
    (item) =>
      typeof item !== "string" && /me machuquei de propósito/i.test(item.text),
  );
  const priority = adolescentItems.find(
    (item) =>
      typeof item !== "string" && /prioridade concreta/i.test(item.text),
  );
  const observation = interactiveScaleItems["ipn-tea-observacao-60"];

  ok(
    typeof ideation !== "string" &&
      ideation?.sentinel?.positiveOptionIndexes?.join(",") === "1,2,3",
    "ideação suicida aciona sentinela em qualquer resposta positiva",
  );
  ok(
    typeof selfHarm !== "string" &&
      selfHarm?.sentinel?.positiveOptionIndexes?.join(",") === "1,2,3",
    "autolesão aciona sentinela em qualquer resposta positiva",
  );
  ok(
    typeof priority !== "string" && priority?.responseType === "text",
    "prioridade de três meses coleta resposta aberta real",
  );
  ok(
    observation.labels.every((label) => !/funcionamento esperado/i.test(label)),
    "observação clínica usa alternativas neutras de ocorrência",
  );
}

console.log(`\n${"=".repeat(48)}`);
if (failures === 0) {
  console.log(`✅ IPN-TEA FILTER OK — ${checks} verificações passaram.`);
  process.exit(0);
}
console.error(
  `❌ IPN-TEA FILTER FALHOU — ${failures}/${checks} verificações falharam.`,
);
process.exit(1);
