// Qualidade da busca livre do Filtro Clínico (lib/scaleSearch) sobre o
// catálogo REAL usado pela página: siglas sem pontuação, numerais romanos,
// erro de digitação, sinônimos leigos e explicação do acerto. O piso é o
// resultado medido na reconstrução de 2026-09-26 (busca antiga: 71% no 1º
// lugar, 78% no top-3, 17 consultas sem resultado). Regressão = cair abaixo.
import assert from "node:assert/strict";
import { allScales, queixas } from "../../client/src/data/scaleFilter.ts";
import { mergeFilterableCatalog } from "../../client/src/data/filterableCatalog.ts";
import { noCostWorldScales } from "../../client/src/data/noCostWorldScales.ts";
import {
  searchScaleCatalog,
  suggestSearchCorrections,
  describeSearchHit,
  highlightSegments,
  highlightTermsOf,
  tokenizeQuery,
  compactKey,
  acronymsOf,
  editDistance,
} from "../../client/src/lib/scaleSearch.ts";
import { scaleSearchAliases } from "../../client/src/data/scaleSearchAliases.ts";

// Mesma composição da página: catálogo filtrável + mundial sem duplicatas de nome.
const core = mergeFilterableCatalog(allScales);
const coreNames = new Set(core.map((s) => compactKey(s.name)));
const catalog = [...core, ...noCostWorldScales.filter((s) => !(s.id.startsWith("world-") && coreNames.has(compactKey(s.name))))]
  .filter((s, i, a) => a.findIndex((x) => x.id === s.id) === i);
const ids = new Set(catalog.map((s) => s.id));
const rank = (q) => searchScaleCatalog(catalog, q).map((h) => h.scale.id);

// Licenciados retirados (17/10/2026): o nome do original leva à alternativa no app.
const SINAIS = "na-sinais-precoces-tea-pais", ATP = "na-atencao-atividade-professor", ATPA = "na-atencao-atividade-pais";
const PERFIL = "na-perfil-emocional-comportamental-pais", ANS = "na-ansiedade-autorrelato", SONO = "na-sono-crianca-pais";
const QV = "na-qualidade-vida-pais", SUBST = "na-uso-substancias-adolescente";
const SWYC = ["2m", "4m", "6m", "9m", "12m", "15m", "18m", "24m", "30m", "36m", "48m", "60m"].map((m) => `swyc-marcos-${m}`);

// [consulta, ids aceitáveis no top-3]
const cases = [
  ["mchat", [SINAIS]], ["m-chat", [SINAIS]], ["m chat", [SINAIS]], ["MCHAT R/F", [SINAIS]], ["chat modificado", [SINAIS]],
  ["snap", ["snap"]], ["snap iv", ["snap"]], ["snap 4", ["snap"]], ["snapiv", ["snap"]], ["swanson", ["snap"]],
  ["vanderbilt", [ATP, ATPA]], ["vanderbild", [ATP, ATPA]], ["nichq", [ATP, ATPA]],
  ["conners", ["na-atencao-atividade-pais", "na-atencao-atividade-professor"]], ["connors", ["na-atencao-atividade-pais"]], ["coners", ["na-atencao-atividade-pais"]],
  ["brief", ["na-funcoes-executivas-ampliado-pais", "na-funcoes-executivas-escola-professor"]], ["brief 2", ["na-funcoes-executivas-ampliado-pais", "na-funcoes-executivas-escola-professor"]], ["funções executivas", ["na-funcoes-executivas-ampliado-pais", "na-funcoes-executivas-escola-professor", "na-funcoes-executivas-casa-pais", "ipn-tdah-fe-executivo-10", "j26-220"]],
  ["cbcl", ["na-perfil-emocional-comportamental-pais", "na-perfil-emocional-comportamental-professor"]], ["achenbach", ["na-perfil-emocional-comportamental-pais", "na-perfil-emocional-comportamental-professor"]], ["sdq", [PERFIL]], ["goodman", [PERFIL]], ["psc", ["psc17"]], ["psc-17", ["psc17"]], ["psc17", ["psc17"]],
  ["scared", [ANS]], ["scarred", [ANS]], ["scas", ["scas"]], ["spence", ["scas"]],
  ["gad7", ["gad7", "gad7ped"]], ["gad-7", ["gad7", "gad7ped"]], ["gad 7", ["gad7", "gad7ped"]],
  ["cdi", ["na-humor-crianca-autorrelato"]], ["cdi-2", ["na-humor-crianca-autorrelato"]], ["kovacs", ["na-humor-crianca-autorrelato"]],
  ["phq", ["phqa"]], ["phq-a", ["phqa"]], ["phqa", ["phqa"]], ["phq9", ["phqa"]],
  ["cssrs", ["cssrs"]], ["c-ssrs", ["cssrs"]], ["columbia", ["cssrs"]],
  ["ygtss", ["ygtss"]], ["yale tic", ["ygtss"]], ["tourette", ["ygtss", "tsi", "ticar-18-sdg"]],
  ["cybocs", ["cybocs", "cybocs-sr"]], ["cy-bocs", ["cybocs", "cybocs-sr"]], ["yale brown", ["cybocs", "cybocs-sr"]],
  ["cshq", [SONO]], ["hábitos de sono", [SONO]], ["epworth", ["ess-adol"]],
  ["pedsql", [QV]], ["qualidade de vida", [QV, "na-qualidade-vida-autorrelato", "na-qualidade-vida-epilepsia"]],
  ["asq", ["asq-suicide", ...SWYC]], ["asq-3", SWYC], ["ages and stages", SWYC],
  ["denver", SWYC], ["denver ii", SWYC], ["denver 2", SWYC],
  ["cars", ["na-observacao-clinica-tea"]], ["cars 2", ["na-observacao-clinica-tea"]], ["cars-2", ["na-observacao-clinica-tea"]],
  ["cat clams", ["catclams"]], ["capute", ["catclams"]],
  ["gmfcs", ["gmfcs"]], ["macs", ["macs"]], ["ashworth", ["ashworth"]], ["espasticidade", ["ashworth"]],
  ["wong baker", ["wongbaker"]], ["flacc", ["flacc", "rflacc"]], ["apgar", ["apgar"]], ["ballard", ["ballard"]],
  ["crafft", [SUBST]], ["who5", ["who5"]], ["who-5", ["who5"]], ["hine", ["hine"]], ["hammersmith", ["hine"]],
  ["ymrs", ["ymrs"]], ["mania", ["ymrs"]], ["prime", ["prime-screen"]],
  ["ace", ["ace"]], ["cats", ["cats"]], ["cpss", ["cpss-v"]],
  ["scoff", ["scoff"]], ["arfid", ["etare"]], ["etare", ["etare"]],
  ["bristol", ["bristol-stool"]], ["dvss", ["dvss"]],
  ["pant", ["pant"]], ["emdi", ["emdi"]], ["efdi", ["efdi"]], ["ndi-360", ["ndi-360"]], ["ndi 360", ["ndi-360"]], ["ndi360", ["ndi-360"]],
  ["ipn tea", ["ipn-tea-familia-100", "ipn-tea-escola-100", "ipn-tea-adolescente-60", "ipn-tea-observacao-60", "ipn-tea-18-30m"]],
  ["ipn tdah familia", ["ipn-tdah-fe-familia-48"]], ["ipn epi", ["ipn-epi-seg-familia-50"]],
  ["mutismo seletivo", ["mutismo-seletivo-familia-30", "ems", "mutismo-seletivo-escola-30"]],
  ["autismo", [SINAIS, "na-observacao-clinica-tea", "atec", "q-chat-10"]], ["autimso", [SINAIS, "na-observacao-clinica-tea", "atec", "q-chat-10", "tea-checklists"]],
  ["tdah", ["snap", ATPA, ATP, "ipn-tdah-fe-familia-48"]], ["adhd", ["snap", ATPA, ATP, "ipn-tdah-fe-familia-48"]],
  ["ansiedade", [ANS, "scas", "gad7", "gad7ped", "eai"]], ["ansiedad", [ANS, "scas", "gad7", "gad7ped", "eai"]],
  ["depressão", ["na-humor-crianca-autorrelato", "phqa", "smfq", "edi"]], ["depressao", ["na-humor-crianca-autorrelato", "phqa", "smfq", "edi"]],
  ["não para quieto", ["snap", ATPA, ATP, "afi12-sdg"]],
  ["não fala", ["j26-091", "j26-003", "ipn-lfc-familia-50", "catclams", "ipn-lfc-fala-motora-20"]],
  ["xixi na cama", ["dvss", "bowel-bladder-checklist"]],
  ["dor de cabeça", ["cefaleia-calendario", "ecnfaj-1"]], ["cefaleia", ["cefaleia-calendario", "ecnfaj-1"]],
  ["crises", ["epilepsia-diario", "lsss", "ssq", "hague-szs"]], ["convulsão", ["epilepsia-diario", "lsss", "ssq", "hague-szs"]],
  ["seletividade alimentar", ["sarf12-sdg", "etare", "scoff"]],
  ["suicídio", ["cssrs", "asq-suicide", "ecar-si"]], ["risco suicida", ["cssrs", "asq-suicide", "ecar-si"]],
  ["sono", [SONO, "bisq", "bears", "sdrd12-sdg"]], ["dorme mal", [SONO, "bisq", "bears", "sdrd12-sdg", "vigia-sd-20-sdg"]],
  ["tiques", ["ygtss", "tsi", "ticar-18-sdg"]], ["toc", ["cybocs", "oci-cv", "docs", "toc-drj-psicologia"]],
  ["professor tdah", ["snap", ATP, "ipn-tdah-fe-escola-32", "j26-225"]],
  ["escala gratuita ansiedade", ["gad7", "scas", "gad7ped", ANS]],
  ["efeitos colaterais", ["uku", "vigia-med-24", "balanco-med-24-sdg", "bars"]],
  ["satisfação medicação", ["esm-edj", "j26-184"]],
  ["fluência verbal", ["fas-fluencia", "j26-086"]], ["fas", ["fas-fluencia", "fas-pr"]],
  ["camuflagem", ["camuflagem-tea-neuroped"]], ["masking", ["camuflagem-tea-neuroped"]],
  ["irritabilidade", ["ari", "ejia-15", "mapa-ri-18-sdg", "mcri-24-sdg", "regula-20-sdg"]],
  ["comportamento adaptativo", ["ead-np", "eaf"]],
  ["perfil sensorial", ["psn-np", "ips"]],
  ["estresse do cuidador", ["qec-np"]],
  ["teoria da mente", ["j26-022", "ecsm"]],
];

let hit1 = 0, hit3 = 0, zero = 0;
const misses = [];
for (const [query, expected] of cases) {
  const present = expected.filter((id) => ids.has(id));
  assert.ok(present.length > 0, `caso "${query}" referencia ids fora do catálogo: ${expected.join(",")}`);
  const r = rank(query);
  if (!r.length) zero += 1;
  if (present.includes(r[0])) hit1 += 1;
  if (r.slice(0, 3).some((id) => present.includes(id))) hit3 += 1;
  else misses.push(`${query} → [${r.slice(0, 3).join(", ")}]`);
}
const n = cases.length;
console.log(`[filter-search-quality] casos=${n} | top1=${hit1} (${((hit1 / n) * 100).toFixed(1)}%) | top3=${hit3} (${((hit3 / n) * 100).toFixed(1)}%) | sem-resultado=${zero}`);
assert.equal(zero, 0, "nenhuma consulta do benchmark pode ficar sem resultado");
assert.ok(hit3 / n >= 0.97, `top-3 abaixo do piso (97%): ${misses.join(" ; ")}`);
assert.ok(hit1 / n >= 0.9, `top-1 abaixo do piso (90%): ${hit1}/${n}`);

// Determinismo e ausência de ruído.
assert.deepEqual(rank("snap iv"), rank("snap iv"), "busca determinística");
assert.deepEqual(rank("zzqqxx"), [], "termo inexistente não devolve nada");
assert.deepEqual(rank("2"), [], "dígito solto não casa com o catálogo inteiro");
assert.deepEqual(rank(""), catalog.map((s) => s.id), "consulta vazia preserva a ordem do catálogo");

// Explicação e realce: todo acerto do top-10 explica por onde casou.
for (const query of ["mchat", "vanderbild", "não para quieto", "cars 2"]) {
  for (const hit of searchScaleCatalog(catalog, query, { limit: 10 })) {
    const text = describeSearchHit(hit);
    assert.ok(text.startsWith("Correspondeu por "), `explicação ausente para "${query}" → ${hit.scale.id}`);
    assert.ok(hit.boost >= 0 && hit.boost <= 45, "bônus dentro de 0–45");
  }
}
const fuzzy = searchScaleCatalog(catalog, "vanderbild")[0];
assert.equal(fuzzy.scale.id, ATP, "nome do original retirado leva à alternativa");
assert.ok(/vanderbild/.test(describeSearchHit(fuzzy)), "explica o que foi digitado");
assert.deepEqual(highlightSegments("M-CHAT-R/F", ["mchat"]).map((s) => s.hit), [true, false], "realce atravessa a pontuação da sigla");
assert.equal(highlightSegments("Denver II", ["xyz"]).length, 1, "sem termo, sem realce");
assert.ok(highlightTermsOf(searchScaleCatalog(catalog, "cars 2")[0]).length > 0);

// "Você quis dizer" para termo próximo de instrumento e de queixa.
const complaints = queixas.map((q) => ({ id: q.id, label: q.label }));
const sugg = suggestSearchCorrections(catalog, "vandrbilt", complaints);
assert.ok(sugg.some((s) => s.id === ATP || s.id === "snap"), `sugestão de instrumento: ${JSON.stringify(sugg)}`);
const suggQ = suggestSearchCorrections(catalog, "epilepsa", complaints);
assert.ok(suggQ.some((s) => s.kind === "queixa" && s.id === "epilepsia"), `sugestão de queixa: ${JSON.stringify(suggQ)}`);
assert.deepEqual(suggestSearchCorrections(catalog, "zzqqxxww", complaints), [], "sem vizinho, sem sugestão");

// Primitivas.
assert.deepEqual(tokenizeQuery("SNAP-IV, pais"), ["snap", "iv", "4", "pais"]);
assert.equal(compactKey("C-SSRS"), "cssrs");
assert.deepEqual(acronymsOf("Childhood Autism Rating Scale 2"), ["cars", "cars2"]);
assert.equal(editDistance("conners", "connors"), 1);
assert.equal(editDistance("mchat", "mcaht"), 1, "transposição conta 1");
assert.equal(editDistance("abc", "xyz", 1), 2, "corte antecipado devolve max+1");

// Aliases: nenhum apelido pode colidir com o nome compacto de OUTRO instrumento.
const compactNames = new Map(catalog.map((s) => [compactKey(s.name), s.id]));
for (const [id, aliases] of Object.entries(scaleSearchAliases)) {
  for (const alias of aliases) {
    const owner = compactNames.get(compactKey(alias));
    assert.ok(!owner || owner === id, `apelido "${alias}" de ${id} colide com o nome de ${owner}`);
  }
}
const aliasCoverage = Object.keys(scaleSearchAliases).filter((id) => ids.has(id)).length;
assert.ok(aliasCoverage >= 150, `cobertura de apelidos sobre o catálogo: ${aliasCoverage}`);

// Desempenho: digitação fluida (média < 15 ms por consulta no catálogo completo).
const t0 = performance.now();
for (let i = 0; i < 100; i += 1) rank(cases[i % n][0]);
const avg = (performance.now() - t0) / 100;
assert.ok(avg < 15, `busca lenta: ${avg.toFixed(1)} ms/consulta`);
console.log(`[filter-search-quality] OK — média ${avg.toFixed(1)} ms/consulta; apelidos cobrindo ${aliasCoverage} instrumentos.`);
