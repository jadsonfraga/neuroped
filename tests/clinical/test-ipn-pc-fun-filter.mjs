// @ts-check
/** Regressão focada do IPN-PC/FUN 200. */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const imp = (rel) => import(pathToFileURL(resolve(repoRoot, rel)).href);

const { allScales } = await imp("client/src/data/scaleFilter.ts");
const { mergeFilterableCatalog } = await imp("client/src/data/filterableCatalog.ts");
const { filterScalesIntelligently, getImplementationStatus, getVerbalRequirement, getLiteracyRequirement } = await imp("client/src/data/advancedFilterLogic.ts");
const { interactiveScaleItems } = await imp("client/src/data/interactiveScaleItems.ts");

const EXPECTED_COUNTS = {
  "ipn-pc-fun-familia-50": 50,
  "ipn-pc-fun-escola-30": 30,
  "ipn-pc-fun-autopercepcao-20": 20,
  "ipn-pc-fun-observacao-20": 20,
  "ipn-pc-fun-tonus-20": 20,
  "ipn-pc-fun-alimentacao-20": 20,
  "ipn-pc-fun-anamnese-20": 20,
  "ipn-pc-fun-sintese-20": 20
};
const IDS = Object.keys(EXPECTED_COUNTS);
const catalog = mergeFilterableCatalog(allScales);
const run = (ctx) => filterScalesIntelligently(catalog, { queixas: ["pc"], selectedSignals: [], ...ctx });
let failures = 0;
let checks = 0;
function ok(condition, message) { checks++; if (!condition) { failures++; console.error(`  ❌ ${message}`); } }
function head(title) { console.log(`\n=== ${title} ===`); }

head("A) Catálogo e conteúdo integral");
let total = 0;
for (const [id, expected] of Object.entries(EXPECTED_COUNTS)) {
  const scale = allScales.find((entry) => entry.id === id);
  const definition = interactiveScaleItems[id];
  const delivered = (definition?.domains ?? []).reduce((sum, domain) => sum + (domain.items?.length ?? 0), 0);
  total += delivered;
  ok(Boolean(scale), `${id}: cadastrado`);
  ok(Boolean(definition), `${id}: aplicação interativa presente`);
  ok(delivered === expected, `${id}: ${delivered}/${expected} itens/campos`);
  ok(Boolean(scale) && getImplementationStatus(scale) === "complete", `${id}: implementação completa`);
}
ok(total === 200, `conteúdo operacional integral: ${total}/200`);

head("B) Idade e informante");
const infantFamily = run({ ageMonths: 12, respondente: "pais", assessmentUse: "diagnostico" });
ok(infantFamily.some((m) => m.scale.id === "ipn-pc-fun-familia-50"), "12 meses + pais: Família 50 disponível");
const newbornFeeding = run({ ageMonths: 0, respondente: "clinico", assessmentUse: "diagnostico" });
ok(newbornFeeding.some((m) => m.scale.id === "ipn-pc-fun-alimentacao-20"), "recém-nascido + clínico: alimentação disponível");
ok(!newbornFeeding.some((m) => m.scale.id === "ipn-pc-fun-observacao-20"), "recém-nascido: observação funcional geral inicia em 6 meses");
const school = run({ ageMonths: 120, respondente: "professor", assessmentUse: "diagnostico" });
ok(school.some((m) => m.scale.id === "ipn-pc-fun-escola-30"), "10 anos + professor: Escola/Terapia 30 disponível");
ok(!school.some((m) => m.scale.id === "ipn-pc-fun-familia-50"), "professor não recebe módulo familiar");
const clinician = run({ ageMonths: 120, respondente: "clinico", assessmentUse: "diagnostico" });
for (const id of ["ipn-pc-fun-observacao-20", "ipn-pc-fun-tonus-20", "ipn-pc-fun-alimentacao-20", "ipn-pc-fun-anamnese-20"]) {
  ok(clinician.some((m) => m.scale.id === id), `clínico: inclui ${id}`);
}

head("C) Voz da criança acessível");
const selfSupported = run({ ageMonths: 144, respondente: "autoaplicavel", assessmentUse: "diagnostico", isVerbal: false, isLiterate: false });
ok(selfSupported.some((m) => m.scale.id === "ipn-pc-fun-autopercepcao-20"), "12 anos não falante/não alfabetizado: autorrelato apoiado permanece disponível");
const selfScale = allScales.find((s) => s.id === "ipn-pc-fun-autopercepcao-20");
ok(Boolean(selfScale) && getVerbalRequirement(selfScale) === "nao_verbal_compativel", "acesso não verbal explícito");
ok(Boolean(selfScale) && getLiteracyRequirement(selfScale) === "indiferente", "alfabetização não é barreira automática");

head("D) Campos qualitativos e red flags");
for (const id of ["ipn-pc-fun-anamnese-20", "ipn-pc-fun-sintese-20"]) {
  const items = interactiveScaleItems[id].domains.flatMap((d) => d.items);
  ok(items.every((it) => typeof it !== "string" && it.responseType === "text"), `${id}: todos os campos são textuais`);
  ok(items.every((it) => typeof it !== "string" && it.required === false), `${id}: campos opcionais sem texto fictício`);
}
const allItems = IDS.flatMap((id) => interactiveScaleItems[id].domains.flatMap((d) => d.items));
ok(allItems.every((it) => typeof it === "string" || !it.sentinel), "red flags neuromotoras não usam sentinela suicídio/autolesão");
ok(allItems.some((it) => typeof it !== "string" && /status distônico|piora respiratória|regressão/i.test(`${it.text} ${it.example ?? ""}`)), "red flags clínicas explícitas no conteúdo");

head("E) Autoria, limites e filtro rico");
const scales = allScales.filter((s) => IDS.includes(s.id));
ok(scales.every((s) => s.licencaUso === "autoral"), "licença autoral explícita");
ok(scales.every((s) => s.pendente_validacao_clinica === true), "validação psicométrica pendente explícita");
ok(scales.every((s) => s.suicideRiskInstrument === false && s.psychosisRiskInstrument === false), "sem classificação indevida como escala de suicídio/psicose");
ok(scales.every((s) => /sem ponto de corte|sem escore/i.test(`${s.scoringCutoff} ${s.validacaoBrasil}`)), "limite interpretativo explícito");
ok(scales.every((s) => (s.signalTags?.length ?? 0) >= 35), "todos os módulos possuem filtragem clínica rica");
ok(scales.every((s) => s.queixas.includes("pc") && s.queixas.includes("funcionalidade")), "todos respondem ao eixo PC/funcionalidade");

console.log(`\n${"=".repeat(52)}`);
if (failures === 0) { console.log(`✅ IPN-PC/FUN FILTER OK — ${checks} verificações passaram.`); process.exit(0); }
console.error(`❌ IPN-PC/FUN FILTER FALHOU — ${failures}/${checks} verificações falharam.`);
process.exit(1);
