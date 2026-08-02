// @ts-check
/** Regressão clínica e de integração do IPN-LFC 200. */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const imp = (rel) => import(pathToFileURL(resolve(repoRoot, rel)).href);

const { allScales } = await imp("client/src/data/scaleFilter.ts");
const { mergeFilterableCatalog } = await imp("client/src/data/filterableCatalog.ts");
const {
  filterScalesIntelligently,
  getImplementationStatus,
  getVerbalRequirement,
  getLiteracyRequirement,
} = await imp("client/src/data/advancedFilterLogic.ts");
const { interactiveScaleItems } = await imp("client/src/data/interactiveScaleItems.ts");

const EXPECTED_COUNTS = {
  "ipn-lfc-familia-50": 50,
  "ipn-lfc-escola-30": 30,
  "ipn-lfc-autopercepcao-20": 20,
  "ipn-lfc-observacao-30": 30,
  "ipn-lfc-fala-motora-20": 20,
  "ipn-lfc-anamnese-20": 20,
  "ipn-lfc-diferenciais-15": 15,
  "ipn-lfc-sintese-15": 15,
};
const IDS = Object.keys(EXPECTED_COUNTS);
const catalog = mergeFilterableCatalog(allScales);
const run = (ctx) =>
  filterScalesIntelligently(catalog, {
    queixas: ["linguagem"],
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
function head(title) { console.log(`\n=== ${title} ===`); }

head("A) Catálogo e conteúdo integral");
let total = 0;
for (const [id, expected] of Object.entries(EXPECTED_COUNTS)) {
  const scale = allScales.find((entry) => entry.id === id);
  const definition = interactiveScaleItems[id];
  const delivered = (definition?.domains ?? []).reduce(
    (sum, domain) => sum + (domain.items?.length ?? 0),
    0,
  );
  total += delivered;
  ok(Boolean(scale), `${id}: cadastrado`);
  ok(Boolean(definition), `${id}: aplicação interativa presente`);
  ok(delivered === expected, `${id}: ${delivered}/${expected} itens/campos`);
  ok(Boolean(scale) && getImplementationStatus(scale) === "complete", `${id}: implementação completa`);
}
ok(total === 200, `conteúdo operacional integral: ${total}/200`);

head("B) Idade, informante e finalidade");
const family12 = run({ ageMonths: 12, respondente: "pais", assessmentUse: "diagnostico" });
ok(family12.some((m) => m.scale.id === "ipn-lfc-familia-50"), "12 meses + pais: Família 50 disponível");
ok(!family12.some((m) => m.scale.id === "ipn-lfc-escola-30"), "pais não recebem módulo escolar");

const school24 = run({ ageMonths: 24, respondente: "professor", assessmentUse: "diagnostico" });
ok(school24.some((m) => m.scale.id === "ipn-lfc-escola-30"), "24 meses + professor: Escola/Terapia 30 disponível");
ok(!school24.some((m) => m.scale.id === "ipn-lfc-familia-50"), "professor não recebe módulo familiar");

const clinician72 = run({ ageMonths: 72, respondente: "clinico", assessmentUse: "diagnostico" });
for (const id of [
  "ipn-lfc-observacao-30",
  "ipn-lfc-fala-motora-20",
  "ipn-lfc-anamnese-20",
  "ipn-lfc-diferenciais-15",
]) {
  ok(clinician72.some((m) => m.scale.id === id), `clínico aos 6 anos: inclui ${id}`);
}
const newborn = run({ ageMonths: 0, respondente: "clinico", assessmentUse: "diagnostico" });
ok(newborn.some((m) => m.scale.id === "ipn-lfc-anamnese-20"), "recém-nascido: anamnese disponível");
ok(!newborn.some((m) => m.scale.id === "ipn-lfc-observacao-30"), "recém-nascido: observação geral inicia em 6 meses");
const followup = run({ ageMonths: 120, respondente: "clinico", assessmentUse: "monitorizacao" });
ok(followup.some((m) => m.scale.id === "ipn-lfc-sintese-15"), "monitorização: síntese e metas disponível");

head("C) Voz da criança acessível");
const selfSupported = run({
  ageMonths: 144,
  respondente: "autoaplicavel",
  assessmentUse: "diagnostico",
  isVerbal: false,
  isLiterate: false,
});
ok(selfSupported.some((m) => m.scale.id === "ipn-lfc-autopercepcao-20"), "12 anos não falante/não alfabetizado: autorrelato apoiado disponível");
const selfScale = allScales.find((s) => s.id === "ipn-lfc-autopercepcao-20");
ok(Boolean(selfScale) && getVerbalRequirement(selfScale) === "nao_verbal_compativel", "acesso não verbal explícito");
ok(Boolean(selfScale) && getLiteracyRequirement(selfScale) === "indiferente", "alfabetização não é barreira automática");

head("D) Qualitativos, red flags e honestidade");
for (const id of [
  "ipn-lfc-anamnese-20",
  "ipn-lfc-diferenciais-15",
  "ipn-lfc-sintese-15",
]) {
  const items = interactiveScaleItems[id].domains.flatMap((d) => d.items);
  ok(items.every((it) => typeof it !== "string" && it.responseType === "text"), `${id}: todos os campos são textuais`);
  ok(items.every((it) => typeof it !== "string" && it.required === false), `${id}: campos qualitativos opcionais`);
}
const allItems = IDS.flatMap((id) => interactiveScaleItems[id].domains.flatMap((d) => d.items));
ok(allItems.every((it) => typeof it === "string" || !it.sentinel), "red flags clínicas não reutilizam sentinela suicídio/autolesão");
ok(
  allItems.some((it) => typeof it !== "string" && /regressão|aspiração|perda auditiva|fraqueza bulbar/i.test(`${it.text} ${it.example ?? ""}`)),
  "red flags clínicas explícitas no conteúdo",
);

const scales = allScales.filter((s) => IDS.includes(s.id));
ok(scales.every((s) => s.licencaUso === "autoral"), "licença autoral explícita");
ok(scales.every((s) => s.pendente_validacao_clinica === true), "validação psicométrica pendente explícita");
ok(scales.every((s) => s.suicideRiskInstrument === false && s.psychosisRiskInstrument === false), "sem classificação indevida como escala de suicídio/psicose");
ok(scales.every((s) => /sem ponto de corte|sem escore/i.test(`${s.scoringCutoff} ${s.validacaoBrasil}`)), "limite interpretativo explícito");
ok(scales.every((s) => (s.signalTags?.length ?? 0) >= 35), "todos os módulos possuem filtragem clínica rica");
ok(scales.every((s) => s.queixas.includes("linguagem")), "todos respondem ao eixo linguagem");

console.log(`\n${"=".repeat(56)}`);
if (failures === 0) {
  console.log(`✅ IPN-LFC FILTER OK — ${checks} verificações passaram.`);
  process.exit(0);
}
console.error(`❌ IPN-LFC FILTER FALHOU — ${failures}/${checks} verificações falharam.`);
process.exit(1);
