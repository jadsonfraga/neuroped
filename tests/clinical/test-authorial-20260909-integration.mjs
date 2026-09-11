// @ts-check
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const imp = (rel) => import(pathToFileURL(resolve(repoRoot, rel)).href);

const { allScales } = await imp("client/src/data/scaleFilter.ts");
const { interactiveScaleItems } = await imp("client/src/data/interactiveScaleItems.ts");
const { makeAuthorialAwareInteractiveConfig } = await imp("client/src/data/authorialScaleCalculators.ts");
const { mergeFilterableCatalog } = await imp("client/src/data/filterableCatalog.ts");
const { filterScalesIntelligently } = await imp("client/src/data/advancedFilterLogic.ts");
const { pendingAuthorialScaleIntakes } = await imp("client/src/data/pendingAuthorialScaleIntake.ts");

let failures = 0;
let checks = 0;
function ok(condition, message) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`  ❌ ${message}`);
  }
}

const catalog = mergeFilterableCatalog(allScales);
const ids = new Set(catalog.map((scale) => scale.id));
const expected = { "vigia-med-24": 24, "nexo-fam-24": 24, "ritmo-18-sdg": 18, "trilha-20-sdg": 20 };
for (const [id, count] of Object.entries(expected)) {  const scale = allScales.find((entry) => entry.id === id);
  const def = interactiveScaleItems[id];
  const delivered = (def?.domains ?? []).reduce((sum, domain) => sum + domain.items.length, 0);
  ok(Boolean(scale), `${id}: presente em allScales`);
  ok(ids.has(id), `${id}: selecionável pelo filtro`);
  ok(Boolean(def), `${id}: aplicação interativa existe`);
  ok(delivered === count, `${id}: preserva ${count} itens (= ${delivered})`);
  ok(scale?.implementationStatus === "complete", `${id}: implementação completa explícita`);
  ok(scale?.licencaUso === "autoral", `${id}: licença autoral`);
  ok(scale?.pendente_validacao_clinica === true, `${id}: não validado permanece explícito`);
  ok(/sem ponto de corte/i.test(`${scale?.scoringCutoff ?? ""} ${scale?.validacaoBrasil ?? ""}`), `${id}: sem cutoff diagnóstico inventado`);
}

for (const pending of pendingAuthorialScaleIntakes) {
  ok(!ids.has(pending.id), `${pending.id}: fonte pendente permanece fora do filtro`);
  ok(!allScales.some((scale) => scale.id === pending.id), `${pending.id}: fonte pendente não é promovida por metadado`);
}

function answerAll(def, index) {
  const answers = {};
  def.domains.forEach((domain, di) => domain.items.forEach((_, ii) => { answers[`${di}-${ii}`] = index; }));
  return answers;
}

const vigia = interactiveScaleItems["vigia-med-24"];
const vigiaScale = allScales.find((scale) => scale.id === "vigia-med-24");
const vigiaConfig = makeAuthorialAwareInteractiveConfig(vigiaScale, vigia);
const vigiaNo = answerAll(vigia, 0);
vigiaNo["0-0"] = 4;const vigiaResult = vigiaConfig.onCalculate(vigiaNo);
ok(vigiaResult.total === undefined, "VIGIA: N/O não vira zero nem permite total bruto completo");
ok(/23\/24/.test(vigiaResult.totalLabel ?? ""), "VIGIA: total informa 23/24 itens pontuáveis após N/O");

const nexo = interactiveScaleItems["nexo-fam-24"];
const nexoScale = allScales.find((scale) => scale.id === "nexo-fam-24");
const nexoConfig = makeAuthorialAwareInteractiveConfig(nexoScale, nexo);
const nexoAnswers = answerAll(nexo, 4);
nexoAnswers["0-0"] = 5;
const nexoResult = nexoConfig.onCalculate(nexoAnswers);
ok(nexoResult.total === undefined, "NEXO-FAM: N/O não entra no total bruto");
ok(/4\.00\/4/.test(nexoResult.totalLabel ?? ""), "NEXO-FAM: média ignora N/O sem reduzir artificialmente o impacto");

const ritmo = interactiveScaleItems["ritmo-18-sdg"];
const ritmoScale = allScales.find((scale) => scale.id === "ritmo-18-sdg");
const ritmoConfig = makeAuthorialAwareInteractiveConfig(ritmoScale, ritmo);
const ritmoAnswers = answerAll(ritmo, 3);
ritmoAnswers["0-0"] = 4;
const ritmoResult = ritmoConfig.onCalculate(ritmoAnswers);
ok(ritmoResult.total === 3, "RITMO: N/O sai do denominador; média dos válidos permanece 3/3");
ok(/17\/18/.test(ritmoResult.totalLabel ?? ""), "RITMO: cobertura válida é explicitada");

const trilha = interactiveScaleItems["trilha-20-sdg"];
const trilhaScale = allScales.find((scale) => scale.id === "trilha-20-sdg");
const trilhaConfig = makeAuthorialAwareInteractiveConfig(trilhaScale, trilha);
const trilhaAnswers = answerAll(trilha, 3);
trilhaAnswers["0-0"] = 4;
trilhaAnswers["0-1"] = 5;
const trilhaResult = trilhaConfig.onCalculate(trilhaAnswers);
ok(trilhaResult.total === 3, "TRILHA: N/O e N/A saem do denominador; autonomia válida permanece 3/3");ok(trilha.scoreDirection === "higher_better", "TRILHA: direção maior = maior autonomia");
ok(vigia.scoreDirection === "higher_worse", "VIGIA: direção maior = maior carga de tolerabilidade");
ok(ritmo.scoreDirection === "higher_worse", "RITMO: direção maior = maior carga de fadiga");
const ritmoMeta = allScales.find((scale) => scale.id === "ritmo-18-sdg");
ok(!ritmoMeta?.respondente.includes("autoaplicavel"), "RITMO: autorrelato assistido ≥12a não é oferecido automaticamente a toda a faixa 5–17a");
ok(nexo.scoreDirection === "higher_worse", "NEXO-FAM: direção maior = maior impacto familiar");

const effectsRanking = filterScalesIntelligently(catalog, {
  queixas: ["efeitos"], ageMonths: 120, respondente: "pais", assessmentUse: "monitorizacao",
});
ok(effectsRanking.some((match) => match.scale.id === "vigia-med-24"), "Filtro: VIGIA aparece em efeitos/monitorização");
ok(effectsRanking.findIndex((match) => match.scale.id === "vigia-med-24") < effectsRanking.findIndex((match) => match.scale.id === "ejia-15"), "Filtro refinado: VIGIA precede EJIA em efeitos adversos");

const fatigueRanking = filterScalesIntelligently(catalog, {
  queixas: ["funcionalidade", "sono"], ageMonths: 120, respondente: "pais", assessmentUse: "monitorizacao",
});
ok(fatigueRanking.slice(0, 8).some((match) => match.scale.id === "ritmo-18-sdg"), "Filtro: RITMO fica no bloco prioritário para funcionalidade + sono");

const autonomyRanking = filterScalesIntelligently(catalog, {
  queixas: ["autonomia"], ageMonths: 180, respondente: "autoaplicavel", assessmentUse: "monitorizacao",
});
ok(autonomyRanking[0]?.scale.id === "trilha-20-sdg", "Filtro: TRILHA é primeira opção para autonomia do adolescente em monitorização");

ok(vigia.labels[0].includes("Não ocorreu") && vigia.labels[3].includes("Impacto forte"), "VIGIA: respostas descrevem ocorrência/impacto do próprio item");
ok(ritmo.labels[0].includes("Ausente") && ritmo.labels[3].includes("Intenso"), "RITMO: respostas seguem intensidade e impacto funcional");
ok(trilha.labels[0].includes("Ainda não realiza") && trilha.labels[3].includes("independente"), "TRILHA: respostas medem nível de apoio/autonomia");

console.log(`\n${"=".repeat(52)}`);
if (failures === 0) {
  console.log(`✅ AUTORAIS 09/09/2026 OK — ${checks} verificações passaram.`);
  process.exit(0);
}
console.error(`❌ AUTORAIS 09/09/2026 FALHOU — ${failures}/${checks} verificações falharam.`);
process.exit(1);
