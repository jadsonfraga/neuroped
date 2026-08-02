// @ts-check
/** Contrato integral, filtros e segurança do IPN-EPI/SEG 200. */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const imp = (rel) => import(pathToFileURL(resolve(repoRoot, rel)).href);

const { allScales } = await imp("client/src/data/scaleFilter.ts");
const { mergeFilterableCatalog } = await imp("client/src/data/filterableCatalog.ts");
const { filterScalesIntelligently, getImplementationStatus, getVerbalRequirement, getLiteracyRequirement } = await imp("client/src/data/advancedFilterLogic.ts");
const { interactiveScaleItems } = await imp("client/src/data/interactiveScaleItems.ts");
const { ipnEpiSegItems, filterIpnEpiSegModules, IPN_EPI_SEG_PROVENANCE } = await imp("client/src/data/ipnEpiSeg200Contract.ts");

const EXPECTED = {
  "ipn-epi-seg-familia-50": 50, "ipn-epi-seg-escola-30": 30,
  "ipn-epi-seg-autopercepcao-20": 20, "ipn-epi-seg-observacao-20": 20,
  "ipn-epi-seg-anamnese-20": 20, "ipn-epi-seg-diferenciais-20": 20,
  "ipn-epi-seg-seguranca-20": 20, "ipn-epi-seg-sintese-20": 20,
};
const IDS = Object.keys(EXPECTED);
const catalog = mergeFilterableCatalog(allScales);
const run = (ctx) => filterScalesIntelligently(catalog, { queixas: ["epilepsia"], selectedSignals: [], ...ctx });
let failures = 0; let checks = 0;
function ok(condition, message) { checks++; if (!condition) { failures++; console.error(`  ❌ ${message}`); } }
function head(title) { console.log(`\n=== ${title} ===`); }

head("A) Contagem integral e proveniência");
let total = 0;
for (const [id, expected] of Object.entries(EXPECTED)) {
  const scale = allScales.find((entry) => entry.id === id);
  const def = interactiveScaleItems[id];
  const delivered = (def?.domains ?? []).reduce((sum, d) => sum + d.items.length, 0);
  total += delivered;
  ok(Boolean(scale), `${id}: metadado presente`);
  ok(Boolean(def), `${id}: aplicação presente`);
  ok(delivered === expected, `${id}: ${delivered}/${expected}`);
  ok(Boolean(scale) && getImplementationStatus(scale) === "complete", `${id}: completo`);
  ok(scale?.appRoute === `/generic-scale/${id}`, `${id}: rota aberta genérica`);
}
ok(total === 200 && ipnEpiSegItems.length === 200, `total integral: ${total}/200`);
ok(new Set(ipnEpiSegItems.map((item) => item.id)).size === 200, "IDs únicos");
ok(new Set(ipnEpiSegItems.map((item) => item.prompt)).size === 200, "prompts únicos");
ok(IPN_EPI_SEG_PROVENANCE.pages === 200 && IPN_EPI_SEG_PROVENANCE.bytes === 904919, "páginas e tamanho do PDF registrados");
ok(IPN_EPI_SEG_PROVENANCE.driveFileId === "1hY-9PY3WCIoaqUSmUQ5cLbRN5e5IidbB", "ID recuperável do Drive registrado");
ok(IPN_EPI_SEG_PROVENANCE.sha256 === "326e2186e04cbdc36cc8b094c3d41fa497dd75133c2a3b95c21a36f2a09837c6", "SHA-256 do PDF registrado");

head("B) Idade, informante e finalidade");
const family0 = run({ ageMonths: 0, respondente: "pais", assessmentUse: "triagem" });
ok(family0.some((m) => m.scale.id === "ipn-epi-seg-familia-50"), "0 mês + pais: família disponível");
ok(!family0.some((m) => m.scale.id === "ipn-epi-seg-escola-30"), "pais não recebem módulo escolar");
const school24 = run({ ageMonths: 24, respondente: "professor", assessmentUse: "triagem" });
ok(school24.some((m) => m.scale.id === "ipn-epi-seg-escola-30"), "24 meses + professor: escola disponível");
const self96 = run({ ageMonths: 96, respondente: "autoaplicavel", assessmentUse: "triagem", isVerbal: false, isLiterate: false });
ok(self96.some((m) => m.scale.id === "ipn-epi-seg-autopercepcao-20"), "8 anos, não falante/não alfabetizado: autopercepção apoiada disponível");
const selfScale = allScales.find((s) => s.id === "ipn-epi-seg-autopercepcao-20");
ok(Boolean(selfScale) && getVerbalRequirement(selfScale) === "nao_verbal_compativel", "comunicação apoiada explícita");
ok(Boolean(selfScale) && getLiteracyRequirement(selfScale) === "indiferente", "alfabetização não bloqueia autopercepção apoiada");
const followup = run({ ageMonths: 120, respondente: "clinico", assessmentUse: "monitorizacao" });
ok(followup.some((m) => m.scale.id === "ipn-epi-seg-sintese-20"), "monitorização: síntese disponível");

head("C) Sinais, contexto e status");
ok(filterIpnEpiSegModules({ ageMonths: 72, informant: "clinico", signals: ["síncope"] }).some((m) => m.key === "diferenciais"), "síncope recupera diferenciais");
ok(filterIpnEpiSegModules({ ageMonths: 72, informant: "professor", contexts: ["escola"] }).some((m) => m.key === "escola"), "contexto escola recupera módulo escolar");
ok(filterIpnEpiSegModules({ ageMonths: 12, informant: "pais", contexts: ["banho"] }).some((m) => m.key === "familia"), "contexto banho recupera família");
ok(filterIpnEpiSegModules({ ageMonths: 120, implementationStatus: "complete" }).every((m) => m.implementationStatus === "complete"), "status completo filtrável");

head("D) Segurança fora do escore");
const redFlags = ipnEpiSegItems.filter((item) => item.redFlag);
ok(redFlags.length === 20, "20 red flags");
ok(redFlags.every((item) => item.module === "seguranca" && item.scored === false), "red flags todas não pontuáveis");
ok(ipnEpiSegItems.filter((item) => item.scored).every((item) => !/suicid|autoagress|machucar/i.test(`${item.title} ${item.prompt} ${item.signalTags.join(" ")}`)), "risco suicida não aparece em item pontuável");
const safetyDef = interactiveScaleItems["ipn-epi-seg-seguranca-20"];
ok(safetyDef.optionPoints?.every((value) => value === 0), "opções de segurança somam zero");
ok(/fora do escore/i.test(safetyDef.infoBox ?? ""), "aviso fora do escore explícito");
for (const id of ["ipn-epi-seg-anamnese-20", "ipn-epi-seg-diferenciais-20", "ipn-epi-seg-sintese-20"]) {
  const items = interactiveScaleItems[id].domains.flatMap((d) => d.items);
  ok(items.every((it) => typeof it !== "string" && it.responseType === "text" && it.required === false), `${id}: campos textuais opcionais`);
}
const scales = allScales.filter((s) => IDS.includes(s.id));
ok(scales.every((s) => s.licencaUso === "autoral" && s.pendente_validacao_clinica === true), "licença e validação pendente explícitas");
ok(scales.every((s) => s.suicideRiskInstrument === false && s.psychosisRiskInstrument === false), "sem classificação indevida de suicídio/psicose");
ok(scales.every((s) => !/probabilidade de epilepsia|probabilidade diagnóstica de/i.test(`${s.scoringCutoff} ${s.description}`)), "sem probabilidade diagnóstica gerada");
ok(scales.every((s) => (s.signalTags?.length ?? 0) >= 45), "filtragem clínica rica");

head("E) Acesso aberto e contrato do PDF");
ok(scales.every((s) => s.appRoute?.startsWith("/generic-scale/") && !/login|senha|pin/i.test(s.appRoute ?? "")), "rotas sem login/senha/PIN");
const registry = await imp("client/src/data/generatedScalePdfRegistry.ts");
const pdf = registry.generatedScalePdfRegistry.find((value) => value.slug === "ipn-epi-seg-200");
ok(Boolean(pdf), "manifesto PDF registrado");
ok(pdf?.totalOperationalItems === 200 && pdf?.modules.length === 8, "contrato PDF 200/8");
ok(pdf?.modules.reduce((sum, module) => sum + module.expectedItems, 0) === 200, "soma do manifesto PDF = 200");

console.log(`\n${"=".repeat(58)}`);
if (failures === 0) { console.log(`✅ IPN-EPI/SEG 200 OK — ${checks} verificações passaram.`); process.exit(0); }
console.error(`❌ IPN-EPI/SEG 200 FALHOU — ${failures}/${checks} verificações falharam.`); process.exit(1);
