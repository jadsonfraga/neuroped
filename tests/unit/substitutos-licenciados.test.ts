// Segunda leva de licenciados retirados do app (17/10/2026): ASQ-3, Denver II, PedsQL, CSHQ, ABC, M-CHAT-R/F,
// CRAFFT, SDQ, SCARED, Vanderbilt e Vineland-3. O original vira ficha de referência, a rota antiga abre a
// alternativa (autoral NeuroPed ou SWYC, livre), o envio remoto do M-CHAT sai sem perder o histórico e
// nenhum item, subescala ou corte do original continua no código.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { allScales, allScalesComFichas } from "../../client/src/data/scaleFilter";
import { getImplementationStatus } from "../../client/src/data/advancedFilterLogic";
import { AUTHORIAL_ALTERNATIVES } from "../../client/src/data/authorialScalesSubstitutos";
import { licenciadosSpecs } from "../../client/src/data/authorialScalesLicenciados";
import { LEGACY_INSTRUMENT_REDIRECTS } from "../../client/src/data/legacyInstrumentRoutes";
import { interactiveScaleItems } from "../../client/src/data/interactiveScaleItems";
import { OWNER_RETAINED_LICENSED_IDS, getExplicitLicenseRecord } from "../../client/src/data/scaleLicenseRegistry";
import { REMOTE_SCALE_IDS, decodeRetiredRemoteAnswers, getRemoteScaleDescriptor } from "../../shared/remoteScaleCatalog";

const RETIRADOS = ["asq3", "denver", "pedsql", "cshq", "abc", "mchat", "crafft", "sdq", "scared", "vanderbilt", "vineland"] as const;
const byId = new Map(allScalesComFichas.map((s) => [s.id, s]));
const textos = (id: string) => interactiveScaleItems[id].domains.flatMap((d) => d.items.map((i) => (typeof i === "string" ? i : i.text)));

test("originais licenciados: só ficha de referência, fora do filtro, sem página nem dados copiados", () => {
  for (const id of RETIRADOS) {
    const s = byId.get(id);
    assert.ok(s, `${id} continua no catálogo como ficha`);
    assert.equal(getImplementationStatus(s!), "external_only", id);
    assert.equal(s!.appRoute, `/generic-scale/${id}`, id);
    assert.ok(!allScales.some((x) => x.id === id), `${id} não pode ser oferecido no filtro`);
    assert.ok(!interactiveScaleItems[id], `${id} não pode ter itens no app`);
    assert.equal(getExplicitLicenseRecord(id)?.softwareAllowed, false, `${id}: uso em software não licenciado`);
    assert.ok((AUTHORIAL_ALTERNATIVES[id] ?? []).length > 0, `${id}: ficha sem alternativa no app`);
  }
  assert.equal(OWNER_RETAINED_LICENSED_IDS.length, 0);
  for (const page of ["asq3", "denver", "pedsql", "cshq", "abc", "mchat", "crafft", "sdq", "scared", "vanderbilt"]) {
    assert.equal(existsSync(`client/src/pages/${page}.tsx`), false, `página ${page} removida`);
  }
  for (const data of ["client/src/data/mchat.ts", "client/src/data/newScales.ts"]) assert.equal(existsSync(data), false, `${data} removido`);
});

test("rotas antigas abrem a alternativa; ASQ-3 e Denver abrem a ficha com o SWYC de cada idade", () => {
  const esperado: Record<string, string> = {
    "/pedsql": "na-qualidade-vida-pais", "/cshq": "na-sono-crianca-pais", "/abc": "na-comportamento-tea-di-pais",
    "/mchat": "na-sinais-precoces-tea-pais", "/crafft": "na-uso-substancias-adolescente", "/sdq": "na-perfil-emocional-comportamental-pais",
    "/scared": "na-ansiedade-autorrelato", "/vanderbilt": "na-atencao-atividade-pais", "/asq3": "asq3", "/denver": "denver",
  };
  for (const [rota, id] of Object.entries(esperado)) assert.equal(LEGACY_INSTRUMENT_REDIRECTS[rota], `/generic-scale/${id}`, rota);
  for (const orig of ["asq3", "denver"]) {
    const alts = AUTHORIAL_ALTERNATIVES[orig];
    assert.equal(alts.length, 12, `${orig}: os 12 formulários SWYC Marcos`);
    for (const alt of alts) assert.equal(getExplicitLicenseRecord(alt)?.status, "free_clinical_use", alt);
  }
});

test("autorais novos: descritivos, sem nome nem corte do original nos itens", () => {
  const proibido = /(?<![\p{L}])(M-CHAT|MCHAT|SDQ|SCARED|CRAFFT|PedsQL|CSHQ|ASQ-3|Denver|Vanderbilt|Vineland|Aberrant)(?![\p{L}])|escore T|ponto de corte|percentil/u;
  assert.equal(licenciadosSpecs.length, 6);
  for (const spec of licenciadosSpecs) {
    assert.equal(spec.authorial, true, spec.id);
    assert.equal(spec.def.descriptiveDomainSummary, true, `${spec.id} descritivo`);
    assert.deepEqual(spec.def.bands.map((b) => b.classification), ["Descritivo"], `${spec.id} sem faixa interpretativa`);
    assert.doesNotMatch(textos(spec.id).join(" "), proibido, `${spec.id}: item cita instrumento licenciado ou norma`);
    assert.doesNotMatch(`${spec.name} ${spec.fullName}`, proibido, `${spec.id}: nome cita instrumento licenciado`);
  }
});

test("formas paralelas: qualidade de vida pais × autorrelato e perfil pais × professor × adolescente", () => {
  const blocos = (id: string) => interactiveScaleItems[id].domains.map((d) => [d.name, d.items.length]);
  assert.deepEqual(blocos("na-qualidade-vida-pais"), blocos("na-qualidade-vida-autorrelato"));
  assert.deepEqual(interactiveScaleItems["na-qualidade-vida-pais"].labels, interactiveScaleItems["na-qualidade-vida-autorrelato"].labels);
  for (const outra of ["na-perfil-emocional-comportamental-professor", "na-perfil-emocional-comportamental-adolescente"]) {
    assert.deepEqual(blocos("na-perfil-emocional-comportamental-pais"), blocos(outra), outra);
    assert.deepEqual(interactiveScaleItems["na-perfil-emocional-comportamental-pais"].labels, interactiveScaleItems[outra].labels, outra);
  }
  assert.deepEqual(byId.get("na-perfil-emocional-comportamental-adolescente")!.respondente, ["autoaplicavel"]);
  assert.deepEqual(byId.get("na-qualidade-vida-autorrelato")!.respondente, ["autoaplicavel"]);
});

test("autorrelatos sem item de risco; o aviso manda ao rastreio de suicídio do app", () => {
  for (const id of ["na-ansiedade-autorrelato", "na-qualidade-vida-autorrelato", "na-perfil-emocional-comportamental-adolescente"]) {
    const spec = licenciadosSpecs.find((s) => s.id === id)!;
    assert.equal(spec.suicideRisk, undefined, id);
    assert.doesNotMatch(textos(id).join(" "), /morr|suic|me machuc|me cort/i, id);
    assert.match(spec.def.infoBox ?? "", /ASQ/, `${id}: aviso do rastreio de risco`);
  }
});

test("sinais precoces pesam a perda de habilidades; comportamento em TEA/DI separa autoagressão e agressão", () => {
  const sinais = interactiveScaleItems["na-sinais-precoces-tea-pais"].domains.map((d) => d.name);
  assert.ok(sinais.includes("Perda de habilidades"));
  const tea = interactiveScaleItems["na-comportamento-tea-di-pais"].domains.map((d) => d.name);
  assert.ok(tea.includes("Autoagressão") && tea.includes("Agressão e destruição") && tea.includes("Irritabilidade e crises"));
});

test("envio remoto: M-CHAT sai das novas solicitações e o histórico segue legível por número do item", () => {
  assert.ok(!(REMOTE_SCALE_IDS as readonly string[]).includes("mchat"));
  assert.equal(getRemoteScaleDescriptor("mchat"), null);
  const historico = decodeRetiredRemoteAnswers("mchat", [1, 0]);
  assert.equal(historico.length, 20);
  assert.deepEqual(historico.slice(0, 2), [{ label: "Item 1", value: "Não" }, { label: "Item 2", value: "Sim" }]);
  assert.deepEqual(decodeRetiredRemoteAnswers("psc17", [0]), [], "só escalas retiradas usam o decodificador por número");
});
