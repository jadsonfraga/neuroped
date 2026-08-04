// @ts-check
/** Contrato integral, filtros, ausência de escore e segurança do Mutismo Seletivo 200. */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const imp = (rel) => import(pathToFileURL(resolve(repoRoot, rel)).href);
const { allScales } = await imp("client/src/data/scaleFilter.ts");
const { mergeFilterableCatalog } = await imp("client/src/data/filterableCatalog.ts");
const { filterScalesIntelligently, getImplementationStatus, getVerbalRequirement, getLiteracyRequirement } = await imp("client/src/data/advancedFilterLogic.ts");
const { interactiveScaleItems } = await imp("client/src/data/interactiveScaleItems.ts");
const { mutismoSeletivoItems, filterMutismoSeletivoModules, MUTISMO_SELETIVO_PROVENANCE } = await imp("client/src/data/mutismoSeletivo200Contract.ts");
const EXPECTED = {
  "mutismo-seletivo-familia-30": 30, "mutismo-seletivo-escola-30": 30,
  "mutismo-seletivo-autopercepcao-20": 20, "mutismo-seletivo-anamnese-20": 20,
  "mutismo-seletivo-observacao-20": 20, "mutismo-seletivo-diferenciais-20": 20,
  "mutismo-seletivo-seguranca-10": 10, "mutismo-seletivo-sintese-50": 50,
};
const IDS = Object.keys(EXPECTED);
const catalog = mergeFilterableCatalog(allScales);
const run = (ctx) => filterScalesIntelligently(catalog, { queixas: ["ansiedade"], selectedSignals: [], ...ctx });
let failures = 0; let checks = 0;
function ok(condition, message) { checks++; if (!condition) { failures++; console.error(`  ❌ ${message}`); } }
function head(title) { console.log(`\n=== ${title} ===`); }
head("A) Contagem integral e proveniência");
let total = 0;
for (const [id, expected] of Object.entries(EXPECTED)) {
  const scale = allScales.find((entry) => entry.id === id); const def = interactiveScaleItems[id];
  const delivered = (def?.domains ?? []).reduce((sum, d) => sum + d.items.length, 0); total += delivered;
  ok(Boolean(scale), `${id}: metadado presente`); ok(Boolean(def), `${id}: aplicação presente`); ok(delivered === expected, `${id}: ${delivered}/${expected}`);
  ok(Boolean(scale) && getImplementationStatus(scale) === "complete", `${id}: completo`); ok(scale?.appRoute === `/generic-scale/${id}`, `${id}: rota aberta`);
}
ok(total === 200 && mutismoSeletivoItems.length === 200, `total integral: ${total}/200`);
ok(new Set(mutismoSeletivoItems.map((item) => item.id)).size === 200, "IDs únicos");
ok(new Set(mutismoSeletivoItems.map((item) => item.prompt)).size >= 195, "prompts clinicamente diferenciados; repetições limitadas a construtos transversais entre módulos");
ok(mutismoSeletivoItems.every((item) => item.scored === false), "todos os campos sem escore");
ok(MUTISMO_SELETIVO_PROVENANCE.pages === 200 && MUTISMO_SELETIVO_PROVENANCE.bytes === 632257, "páginas e bytes registrados");
ok(MUTISMO_SELETIVO_PROVENANCE.sha256 === "aea95638d3c1519449cce1559d6bb90b773cb38775af6a1bae610af357126e2c", "SHA-256 registrado");
ok(MUTISMO_SELETIVO_PROVENANCE.storageStatus === "blocked" ? MUTISMO_SELETIVO_PROVENANCE.driveFileId === null : Boolean(MUTISMO_SELETIVO_PROVENANCE.driveFileId), "estado de armazenamento honesto");
head("B) Idade, informante e finalidade");
const family = run({ ageMonths: 48, respondente: "pais", assessmentUse: "triagem" });
ok(family.some((m) => m.scale.id === "mutismo-seletivo-familia-30"), "4 anos + pais: família");
ok(!family.some((m) => m.scale.id === "mutismo-seletivo-escola-30"), "pais não recebem escola");
const school = run({ ageMonths: 48, respondente: "professor", assessmentUse: "triagem" });
ok(school.some((m) => m.scale.id === "mutismo-seletivo-escola-30"), "4 anos + professor: escola");
const self = run({ ageMonths: 96, respondente: "autoaplicavel", assessmentUse: "triagem", isVerbal: false, isLiterate: false });
ok(self.some((m) => m.scale.id === "mutismo-seletivo-autopercepcao-20"), "8 anos sem fala/alfabetização: autopercepção apoiada");
const selfScale = allScales.find((s) => s.id === "mutismo-seletivo-autopercepcao-20");
ok(Boolean(selfScale) && getVerbalRequirement(selfScale) === "nao_verbal_compativel", "comunicação apoiada");
ok(Boolean(selfScale) && getLiteracyRequirement(selfScale) === "indiferente", "alfabetização não bloqueia");
const followup = run({ ageMonths: 120, respondente: "clinico", assessmentUse: "monitorizacao" });
ok(followup.some((m) => m.scale.id === "mutismo-seletivo-sintese-50"), "monitorização: síntese");
head("C) Sinais, contexto e status");
ok(filterMutismoSeletivoModules({ ageMonths: 72, informant: "clinico", signals: ["catatonia"] }).some((m) => m.key === "diferenciais"), "catatonia recupera diferenciais");
ok(filterMutismoSeletivoModules({ ageMonths: 72, informant: "professor", contexts: ["escola"] }).some((m) => m.key === "escola"), "contexto escola");
ok(filterMutismoSeletivoModules({ ageMonths: 72, informant: "pais", contexts: ["casa"] }).some((m) => m.key === "familia"), "contexto casa");
ok(filterMutismoSeletivoModules({ ageMonths: 120, implementationStatus: "complete" }).every((m) => m.implementationStatus === "complete"), "status completo");
head("D) Qualitativo e segurança");
const redFlags = mutismoSeletivoItems.filter((item) => item.redFlag);
ok(redFlags.length === 10 && redFlags.every((item) => item.module === "seguranca" && item.scored === false), "10 red flags não pontuáveis");
for (const id of IDS) {
  const def = interactiveScaleItems[id]; const fields = def.domains.flatMap((d) => d.items);
  ok(def.optionPoints?.every((value) => value === 0), `${id}: opções somam zero`);
  ok(fields.every((it) => typeof it !== "string" && it.responseType === "text" && it.required === false), `${id}: campos textuais opcionais`);
  ok(/sem (escore|classificação)|fora de qualquer escore/i.test(`${def.infoBox} ${def.bands.map((b)=>b.classification).join(" ")}`), `${id}: ausência de classificação explícita`);
}
const scales = allScales.filter((s) => IDS.includes(s.id));
ok(scales.every((s) => s.licencaUso === "autoral" && s.pendente_validacao_clinica === true), "licença e validação explícitas");
ok(scales.every((s) => !/ponto de corte positivo|probabilidade diagnóstica [0-9]/i.test(`${s.scoringCutoff} ${s.description}`)), "sem probabilidade diagnóstica");
ok(scales.every((s) => (s.signalTags?.length ?? 0) >= 45), "filtragem clínica rica");
head("E) Acesso aberto e contrato PDF");
ok(scales.every((s) => s.appRoute?.startsWith("/generic-scale/") && !/login|senha|pin/i.test(s.appRoute ?? "")), "rotas abertas");
ok(MUTISMO_SELETIVO_PROVENANCE.sourcePdf === "2026-08-04 — Mutismo seletivo — NeuroPed.pdf", "nome do PDF registrado");
ok(MUTISMO_SELETIVO_PROVENANCE.pages === 200 && MUTISMO_SELETIVO_PROVENANCE.bytes === 632257, "contrato PDF 200 páginas");
ok(MUTISMO_SELETIVO_PROVENANCE.scoring.includes("Sem escore"), "contrato sem escore");
console.log(`\n${"=".repeat(58)}`);
if (failures === 0) { console.log(`✅ Mutismo seletivo 200 OK — ${checks} verificações passaram.`); process.exit(0); }
console.error(`❌ Mutismo seletivo 200 FALHOU — ${failures}/${checks} verificações falharam.`); process.exit(1);
