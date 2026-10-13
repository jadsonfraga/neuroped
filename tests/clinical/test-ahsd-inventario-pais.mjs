// @ts-check
/** Inventário AH/SD · Pais — registro, sugestão no filtro, itens e honestidade. */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const imp = (rel) => import(pathToFileURL(resolve(repoRoot, rel)).href);

const { allScales } = await imp("client/src/data/scaleFilter.ts");
const { mergeFilterableCatalog } = await imp("client/src/data/filterableCatalog.ts");
const { filterScalesIntelligently, getImplementationStatus, scaleCoversSelectedSignalExactly } =
  await imp("client/src/data/advancedFilterLogic.ts");
const { interactiveScaleItems, makeInteractiveConfig } = await imp("client/src/data/interactiveScaleItems.ts");
const { INTERACTIVE_SCALE_IDS } = await imp("client/src/data/interactiveScaleIds.generated.ts");
const { getAllSignalsForQueixa } = await imp("client/src/data/signalsAndSymptoms.ts");
const { popularSymptomById } = await imp("client/src/data/popularSymptoms.ts");

const ID = "ahsd-inventario-pais";
let failures = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { failures++; console.error(`  ❌ ${m}`); } };

// A) Registro
const scale = allScales.find((s) => s.id === ID);
const def = interactiveScaleItems[ID];
ok(Boolean(scale), "cadastrado no catálogo aplicável");
ok(Boolean(def), "aplicação interativa presente");
ok(INTERACTIVE_SCALE_IDS.has(ID), "manifesto gerado inclui o id");
ok(scale && getImplementationStatus(scale) === "complete", "implementação completa");
ok(scale?.respondente.length === 1 && scale.respondente[0] === "pais", "respondente: somente pais");
ok(scale?.applicationMode === "questionario_pais", "modo questionário de pais");

// B) Itens
const items = def.domains.flatMap((d) => d.items);
const choice = items.filter((it) => typeof it === "string" || it.responseType !== "text");
const text = items.filter((it) => typeof it !== "string" && it.responseType === "text");
ok(def.domains.length === 10, `10 domínios (${def.domains.length})`);
ok(choice.length === 56, `56 itens de frequência (${choice.length})`);
ok(text.length === 10 && text.every((t) => t.required === false), "1 exemplo livre opcional por domínio");
ok(JSON.stringify(def.labels) === JSON.stringify(["Nunca / quase nunca", "Às vezes", "Com frequência", "Quase sempre"]), "escala 1–4 de frequência");
const choiceText = choice.map((it) => (typeof it === "string" ? it : it.text)).join(" \n ");
ok(!/\b(aula|turma|professor|colegas? de sala|em sala)\b/i.test(choiceText), "itens sem contexto exclusivamente escolar");

// C) Sem ponto de corte / sem diagnóstico
ok(def.bands.length === 1, "uma única faixa descritiva");
const allText = [def.instruction, def.infoBox, def.totalLabel, ...def.bands.flatMap((b) => [b.classification, b.description]), scale?.description, scale?.scoringCutoff].join(" ");
ok(/sem ponto de corte|não (existe|tem) ponto de corte/i.test(allText), "declara ausência de ponto de corte");
ok(/não faz diagnóstico|sem diagnóstico|não é diagnóstico/i.test(allText), "declara que não é diagnóstico");
ok(!/(≥|>=|acima de \d|percentil \d|escore (alto|elevado)|provável superdota|indicativo de)/i.test(allText), "nenhum texto de corte/classificação");
const config = makeInteractiveConfig(scale, def);
const answers = {};
def.domains.forEach((d, di) => d.items.forEach((it, ii) => { if (typeof it === "string" || it.responseType !== "text") answers[`${di}-${ii}`] = 3; }));
const res = config.onCalculate(answers);
ok(res.total === 56 * 4, `soma total descritiva (${res.total})`);
ok(res.domainResults?.length === 10 && res.domainResults.every((r) => /média 4,0 \(descritivo\)/.test(r.classification)), "média por domínio descritiva");

// D) Sugestão no filtro
const catalog = mergeFilterableCatalog(allScales);
const ahSignals = getAllSignalsForQueixa("aprendizagem").filter((s) => s.id.startsWith("aprendizagem-ahsd-"));
ok(ahSignals.length === 5, "5 sinais AH/SD na queixa aprendizagem");
for (const sig of ahSignals) {
  ok(scaleCoversSelectedSignalExactly(scale, { queixas: ["aprendizagem"], selectedSignals: [sig.id] }), `cobertura exata: ${sig.label}`);
}
for (const pid of ["aprendizagem-altas-habilidades", "aprendizagem-aprende-muito-rapido"]) {
  ok(Boolean(popularSymptomById[pid]), `sintoma popular ${pid}`);
  const q = pid.split("-")[0];
  ok(scaleCoversSelectedSignalExactly(scale, { queixas: [q], selectedSignals: [pid] }), `cobertura exata popular: ${pid}`);
}
for (const [queixa, sig] of [["aprendizagem", "aprendizagem-ahsd-suspeita"], ["aprendizagem", "aprendizagem-altas-habilidades"], ["aprendizagem", "aprendizagem-ahsd-dupla-excepcionalidade"]]) {
  const r = filterScalesIntelligently(catalog, { ageMonths: 96, queixas: [queixa], respondente: "pais", selectedSignals: [sig] });
  const idx = r.findIndex((m) => m.scale.id === ID);
  ok(idx >= 0 && idx < 5, `${queixa}+${sig} (8 anos, pais): sugerido no topo 5 (posição ${idx + 1})`);
}
const plain = filterScalesIntelligently(catalog, { ageMonths: 96, queixas: ["aprendizagem"], respondente: "pais", selectedSignals: ["aprendizagem-custa-ler"] });
ok(plain[0]?.scale.id !== ID, "sem sinal de AH/SD, não toma o 1º lugar de queixas comuns de aprendizagem");
const prof = filterScalesIntelligently(catalog, { ageMonths: 96, queixas: ["aprendizagem"], respondente: "professor", selectedSignals: ["aprendizagem-ahsd-suspeita"] });
ok(!prof.some((m) => m.scale.id === ID), "não oferecido quando o respondente é professor");

console.log(`\n${"=".repeat(56)}`);
if (failures === 0) { console.log(`✅ AH/SD PAIS OK — ${checks} verificações passaram.`); process.exit(0); }
console.error(`❌ AH/SD PAIS FALHOU — ${failures}/${checks}`); process.exit(1);
