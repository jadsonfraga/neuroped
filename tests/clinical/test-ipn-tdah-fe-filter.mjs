// @ts-check
/**
 * Regressão focada do IPN-TDAH/FE 200.
 *
 * Garante conteúdo integral, filtro por idade/informante/alfabetização,
 * sentinelas separadas do escore e limites de interpretação autoral.
 */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const imp = (rel) => import(pathToFileURL(resolve(repoRoot, rel)).href);

const { allScales } = await imp("client/src/data/scaleFilter.ts");
const { mergeFilterableCatalog } = await imp("client/src/data/filterableCatalog.ts");
const {
  filterScalesIntelligently,
  getLiteracyRequirement,
  getImplementationStatus,
} = await imp("client/src/data/advancedFilterLogic.ts");
const { interactiveScaleItems } = await imp("client/src/data/interactiveScaleItems.ts");

const EXPECTED_COUNTS = {
  "ipn-tdah-fe-familia-48": 48,
  "ipn-tdah-fe-escola-32": 32,
  "ipn-tdah-fe-adolescente-20": 20,
  "ipn-tdah-fe-observacao-10": 10,
  "ipn-tdah-fe-executivo-10": 10,
  "ipn-tdah-fe-anamnese-18": 18,
  "ipn-tdah-fe-diferenciais-20": 20,
  "ipn-tdah-fe-sintese-15": 15,
};
const IDS = Object.keys(EXPECTED_COUNTS);
const catalog = mergeFilterableCatalog(allScales);
const run = (ctx) =>
  filterScalesIntelligently(catalog, {
    queixas: ["tdah"],
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

head("A) Catálogo, aplicação e conteúdo integral");
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
  ok(Boolean(definition), `${id}: definição interativa presente`);
  ok(delivered === expected, `${id}: ${delivered}/${expected} itens entregues`);
  ok(scale?.implementationStatus === "complete", `${id}: implementação completa explícita`);
  ok(Boolean(scale) && getImplementationStatus(scale) === "complete", `${id}: abre como ferramenta completa`);
}
ok(total === 173, `conteúdo operacional integral: ${total}/173 itens e campos`);

head("B) Idade — TDAH não vaza abaixo de 4 anos");
{
  const age47 = run({ ageMonths: 47, respondente: "pais", assessmentUse: "diagnostico" });
  ok(!age47.some((m) => IDS.includes(m.scale.id)), "47 meses: nenhum módulo IPN-TDAH/FE é oferecido");
  const age48 = run({ ageMonths: 48, respondente: "pais", assessmentUse: "diagnostico" });
  ok(age48.some((m) => m.scale.id === "ipn-tdah-fe-familia-48"), "48 meses: Família 48 fica disponível");
  const age216 = run({ ageMonths: 216, respondente: "pais", assessmentUse: "diagnostico" });
  ok(!age216.some((m) => IDS.includes(m.scale.id)), "18 anos completos: módulos pediátricos encerram em 17a11m");
}

head("C) Informante correto — sem contaminação cruzada");
{
  const family = run({ ageMonths: 120, respondente: "pais", assessmentUse: "diagnostico" });
  ok(family.some((m) => m.scale.id === "ipn-tdah-fe-familia-48"), "10 anos + pais: inclui Família 48");
  ok(!family.some((m) => m.scale.id === "ipn-tdah-fe-escola-32"), "pais: não recebe Escola 32");
  ok(!family.some((m) => m.scale.id === "ipn-tdah-fe-observacao-10"), "pais: não recebe observação clínica");

  const school = run({ ageMonths: 120, respondente: "professor", assessmentUse: "diagnostico" });
  ok(school.some((m) => m.scale.id === "ipn-tdah-fe-escola-32"), "10 anos + professor: inclui Escola 32");
  ok(!school.some((m) => m.scale.id === "ipn-tdah-fe-familia-48"), "professor: não recebe Família 48");

  const clinician = run({ ageMonths: 120, respondente: "clinico", assessmentUse: "diagnostico" });
  for (const id of [
    "ipn-tdah-fe-observacao-10",
    "ipn-tdah-fe-executivo-10",
    "ipn-tdah-fe-anamnese-18",
    "ipn-tdah-fe-diferenciais-20",
    "ipn-tdah-fe-sintese-15",
  ]) {
    ok(clinician.some((m) => m.scale.id === id), `clínico: inclui ${id}`);
  }
  ok(!clinician.some((m) => m.scale.id === "ipn-tdah-fe-familia-48"), "clínico: não recebe inventário familiar");
}

head("D) Adolescente, idade e alfabetização");
{
  const literate = run({
    ageMonths: 180,
    respondente: "autoaplicavel",
    assessmentUse: "diagnostico",
    isLiterate: true,
  });
  ok(literate.some((m) => m.scale.id === "ipn-tdah-fe-adolescente-20"), "15 anos alfabetizado: inclui autorrelato");

  const young = run({
    ageMonths: 132,
    respondente: "autoaplicavel",
    assessmentUse: "diagnostico",
    isLiterate: true,
  });
  ok(!young.some((m) => m.scale.id === "ipn-tdah-fe-adolescente-20"), "11 anos: não oferece autorrelato adolescente");

  const nonLiterate = run({
    ageMonths: 180,
    respondente: "autoaplicavel",
    assessmentUse: "diagnostico",
    isLiterate: false,
  });
  ok(!nonLiterate.some((m) => m.scale.id === "ipn-tdah-fe-adolescente-20"), "não alfabetizado: bloqueia autorrelato textual");

  const adolescent = allScales.find((s) => s.id === "ipn-tdah-fe-adolescente-20");
  ok(Boolean(adolescent) && getLiteracyRequirement(adolescent) === "alfabetizado", "metadado de alfabetização explícito");
}

head("E) Sentinelas e campos textuais");
{
  const items = interactiveScaleItems["ipn-tdah-fe-adolescente-20"].domains.flatMap((d) => d.items);
  const ideation = items.find((item) => typeof item !== "string" && /não existir|desaparecer ou morrer/i.test(item.text));
  const selfHarm = items.find((item) => typeof item !== "string" && /machuquei-me de propósito/i.test(item.text));
  const textItems = items.filter((item) => typeof item !== "string" && item.responseType === "text");
  ok(typeof ideation !== "string" && ideation?.sentinel?.positiveOptionIndexes?.join(",") === "1,2,3", "ideação: qualquer resposta positiva aciona sentinela");
  ok(typeof selfHarm !== "string" && selfHarm?.sentinel?.positiveOptionIndexes?.join(",") === "1,2,3", "autolesão: qualquer resposta positiva aciona sentinela");
  ok(textItems.length === 2, "autorrelato contém duas perguntas abertas de prioridade e meta");

  for (const id of ["ipn-tdah-fe-anamnese-18", "ipn-tdah-fe-diferenciais-20", "ipn-tdah-fe-sintese-15"]) {
    const moduleItems = interactiveScaleItems[id].domains.flatMap((d) => d.items);
    ok(moduleItems.every((item) => typeof item !== "string" && item.responseType === "text"), `${id}: todos os campos são qualitativos`);
  }
}

head("F) Limites clínicos e autoria");
{
  const scales = allScales.filter((s) => IDS.includes(s.id));
  ok(scales.every((s) => s.licencaUso === "autoral"), "todos têm licença autoral");
  ok(scales.every((s) => s.pendente_validacao_clinica === true), "todos permanecem pendentes de validação psicométrica");
  ok(scales.every((s) => s.suicideRiskInstrument === false), "módulos amplos não se apresentam como testes específicos de suicídio");
  ok(scales.every((s) => s.psychosisRiskInstrument === false), "módulos amplos não se apresentam como testes específicos de psicose");
  ok(scales.every((s) => /sem ponto de corte|sem escore/i.test(`${s.scoringCutoff} ${s.validacaoBrasil}`)), "todos explicitam ausência de ponto de corte ou escore diagnóstico");
  ok(scales.every((s) => (s.signalTags?.length ?? 0) >= 10), "todos possuem filtragem clínica rica por sinais");
}

console.log(`\n${"=".repeat(52)}`);
if (failures === 0) {
  console.log(`✅ IPN-TDAH/FE FILTER OK — ${checks} verificações passaram.`);
  process.exit(0);
}
console.error(`❌ IPN-TDAH/FE FILTER FALHOU — ${failures}/${checks} verificações falharam.`);
process.exit(1);
