// Instrumentos de ASEBA, MHS, PAR e WPS retirados do app (17/10/2026): o original vira ficha de
// referência, a rota antiga abre a alternativa autoral e nenhum item, subescala ou corte do original
// continua no código. As formas casa × escola precisam ser paralelas para a comparação lado a lado.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { allScales, allScalesComFichas } from "../../client/src/data/scaleFilter";
import { getImplementationStatus } from "../../client/src/data/advancedFilterLogic";
import { AUTHORIAL_ALTERNATIVES, substitutosSpecs } from "../../client/src/data/authorialScalesSubstitutos";
import { LEGACY_INSTRUMENT_REDIRECTS } from "../../client/src/data/legacyInstrumentRoutes";
import { interactiveScaleItems } from "../../client/src/data/interactiveScaleItems";
import { autismScales } from "../../client/src/data/autismScales";

const RETIRADOS = ["cbcl", "conners", "cdi2", "brief2", "cars"] as const;
const byId = new Map(allScalesComFichas.map((s) => [s.id, s]));
const itens = (id: string) => interactiveScaleItems[id].domains.map((d) => d.items.length);

test("originais proprietários: só ficha de referência, fora do filtro e sem página própria", () => {
  for (const id of RETIRADOS) {
    const s = byId.get(id);
    assert.ok(s, `${id} continua no catálogo como ficha`);
    assert.equal(getImplementationStatus(s!), "external_only", id);
    assert.equal(s!.appRoute, `/generic-scale/${id}`, id);
    assert.ok(!allScales.some((x) => x.id === id), `${id} não pode ser oferecido no filtro`);
    assert.ok(!interactiveScaleItems[id], `${id} não pode ter itens no app`);
  }
  for (const page of ["cbcl", "conners", "cdi2", "brief2", "cars"]) assert.equal(existsSync(`client/src/pages/${page}.tsx`), false, `página ${page} removida`);
  for (const data of ["client/src/data/cbcl.ts", "client/src/data/cars.ts"]) assert.equal(existsSync(data), false, `${data} removido`);
});

test("rotas antigas abrem a alternativa autoral e toda alternativa existe e é aplicável", () => {
  const esperado: Record<string, string> = {
    "/cbcl": "na-perfil-emocional-comportamental-pais", "/conners": "na-atencao-atividade-pais",
    "/cdi2": "na-humor-crianca-autorrelato", "/brief2": "na-funcoes-executivas-ampliado-pais", "/cars": "na-observacao-clinica-tea",
  };
  for (const [rota, id] of Object.entries(esperado)) assert.equal(LEGACY_INSTRUMENT_REDIRECTS[rota], `/generic-scale/${id}`, rota);
  for (const [orig, alts] of Object.entries(AUTHORIAL_ALTERNATIVES)) {
    assert.equal(getImplementationStatus(byId.get(orig)!), "external_only", `${orig} é ficha`);
    for (const alt of alts) {
      assert.ok(allScales.some((s) => s.id === alt), `${orig} → ${alt} precisa abrir no filtro`);
      assert.ok(interactiveScaleItems[alt], `${alt} precisa ter itens`);
    }
  }
});

test("substitutos: autorais, descritivos, sem nome nem corte do original", () => {
  // Siglas em caixa alta (sensível a maiúsculas: "bagunçADOS" não conta); termos de norma sem distinção.
  const proibido = /(?<![\p{L}])(CBCL|ASEBA|TRF|Conners|CDI|BRIEF|CARS|ADOS|ADI-R|SRS)(?![\p{L}])|escore T|T-score|ponto de corte|percentil/u;
  assert.equal(substitutosSpecs.length, 8);
  for (const spec of substitutosSpecs) {
    assert.equal(spec.authorial, true, spec.id);
    assert.equal(spec.license.status, "authorial", spec.id);
    assert.equal(spec.def.descriptiveDomainSummary, true, `${spec.id} descritivo`);
    assert.deepEqual(spec.def.bands.map((b) => b.classification), ["Descritivo"], `${spec.id} sem faixa interpretativa`);
    const texto = spec.def.domains.flatMap((d) => d.items.map((i) => (typeof i === "string" ? i : i.text))).join(" ");
    assert.doesNotMatch(texto, proibido, `${spec.id}: item cita instrumento proprietário ou norma`);
    assert.doesNotMatch(`${spec.name} ${spec.fullName}`, proibido, `${spec.id}: nome cita instrumento proprietário`);
    assert.ok(new Set(spec.def.domains.flatMap((d) => d.items.map((i) => (typeof i === "string" ? i : i.text)))).size === itens(spec.id).reduce((a, b) => a + b, 0), `${spec.id}: item repetido`);
  }
});

test("formas paralelas casa × escola: mesmos blocos, mesma ordem e mesmo número de itens", () => {
  for (const [casa, escola] of [
    ["na-perfil-emocional-comportamental-pais", "na-perfil-emocional-comportamental-professor"],
    ["na-atencao-atividade-pais", "na-atencao-atividade-professor"],
    ["na-funcoes-executivas-ampliado-pais", "na-funcoes-executivas-escola-professor"],
  ]) {
    assert.deepEqual(interactiveScaleItems[casa].domains.map((d) => d.name), interactiveScaleItems[escola].domains.map((d) => d.name), `${casa} × ${escola}: blocos`);
    assert.deepEqual(itens(casa), itens(escola), `${casa} × ${escola}: itens por bloco`);
    assert.deepEqual(interactiveScaleItems[casa].labels, interactiveScaleItems[escola].labels, `${casa} × ${escola}: opções`);
    assert.deepEqual(byId.get(casa)!.respondente, ["pais"]);
    assert.deepEqual(byId.get(escola)!.respondente, ["professor"]);
  }
});

test("autorrelato da criança: 3 opções, sem item de risco (rastreio à parte, com aviso)", () => {
  const spec = substitutosSpecs.find((s) => s.id === "na-humor-crianca-autorrelato")!;
  assert.deepEqual(spec.def.labels, ["Não", "Um pouco", "Muito"]);
  assert.equal(spec.suicideRisk, undefined);
  assert.match(spec.def.infoBox ?? "", /ASQ/);
  const texto = spec.def.domains.flatMap((d) => d.items).join(" ");
  assert.doesNotMatch(texto, /machuc|morr|suic/i);
});

test("roteiros de TEA: nome autoral; o instrumento padronizado aparece só como referência", () => {
  for (const s of autismScales) {
    assert.doesNotMatch(`${s.shortName} ${s.tabLabel}`, /ADOS|ADI-R|CARS|GARS|SRS/, s.id);
    assert.match(s.fullNamePt, new RegExp(`não é o ${s.referenceInstrument.replace("-", "\\-")}`), s.id);
  }
  const grad = autismScales.find((s) => s.referenceInstrument === "CARS-2")!;
  const areas = grad.dimensionalDomains!.flatMap((d) => d.items.map((i) => i.text)).join(" | ");
  for (const categoria of ["Imitação", "Uso do corpo", "Uso de objetos", "Resposta visual", "Resposta auditiva", "Medo ou ansiedade", "Nível e consistência intelectual"]) {
    assert.ok(!areas.includes(categoria), `categoria do CARS-2 não pode voltar: ${categoria}`);
  }
  const pagina = readFileSync("client/src/pages/tea-checklists.tsx", "utf8");
  assert.match(pagina, /instrumento de referência/);
});
