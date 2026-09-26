import assert from "node:assert/strict";
import test from "node:test";
import {
  featuredNavigation,
  findNavigationMatch,
  navigablePages,
  navSections,
} from "../../client/src/data/navigation";

const OBS_ROUTE = "/avaliacao-pre-consulta-faixa-etaria";
const VISUAL_ROUTE = "/testes-reconhecimento";
const COGNITIVE_ROUTE = "/testes-cognitivos";

test("Sonda, OBS, reconhecimento visual e testes cognitivos precedem os atalhos da rotina clínica", () => {
  assert.deepEqual(featuredNavigation.slice(0, 8).map((item) => item.href), [
    "/testes-diretos", OBS_ROUTE, VISUAL_ROUTE, COGNITIVE_ROUTE, "/pacientes", "/agenda", "/laudo-neuroped", "/receita-c1",
  ]);
});

test("testes cognitivos por faixa etária têm acesso prioritário e o mesmo nome no destaque", () => {
  const sections = navSections.filter((section) =>
    section.items.some((item) => item.href === COGNITIVE_ROUTE),
  );
  assert.deepEqual(sections.map((section) => section.title), ["TRIAGEM E FERRAMENTAS"]);
  const sectionItems = navSections.flatMap((section) => section.items)
    .filter((item) => item.href === COGNITIVE_ROUTE);
  const featuredItems = featuredNavigation.filter((item) => item.href === COGNITIVE_ROUTE);
  assert.equal(sectionItems.length, 1);
  assert.equal(featuredItems.length, 1);
  assert.equal(sectionItems[0].label, "Testes cognitivos por faixa etária");
  assert.equal(featuredItems[0].label, sectionItems[0].label);
  assert.equal(featuredItems[0].tone, "priority");
  assert.equal(navigablePages.filter((item) => item.href === COGNITIVE_ROUTE).length, 1);
});

test("reconhecimento visual tem acesso prioritário e uma única entrada por superfície", () => {
  const featured = featuredNavigation.filter((item) => item.href === VISUAL_ROUTE);
  const sections = navSections.flatMap((section) => section.items).filter((item) => item.href === VISUAL_ROUTE);
  assert.equal(featured.length, 1);
  assert.equal(sections.length, 1);
  assert.equal(featured[0].tone, "priority");
  assert.equal(featured[0].label, "Reconhecimento Visual");
  assert.equal(sections[0].label, "Teste de Reconhecimento Visual");
  assert.equal(navigablePages.filter((item) => item.href === VISUAL_ROUTE).length, 1);
});

test("OBS tem um único item de seção e o mesmo nome no destaque", () => {
  const sections = navSections.filter((section) =>
    section.items.some((item) => item.href === OBS_ROUTE),
  );
  assert.deepEqual(sections.map((section) => section.title), ["PRÉ-CONSULTA GUIADA"]);
  const sectionItems = navSections.flatMap((section) => section.items)
    .filter((item) => item.href === OBS_ROUTE);
  const featuredItems = featuredNavigation.filter((item) => item.href === OBS_ROUTE);
  assert.equal(sectionItems.length, 1);
  assert.equal(featuredItems.length, 1);
  assert.equal(sectionItems[0].label, "OBS-10 · Pré-Consulta");
  assert.equal(featuredItems[0].label, sectionItems[0].label);
});

test("Conexões preserva os quatro destinos e Nesplora usa a rota estática", () => {
  assert.deepEqual(
    featuredNavigation.filter((item) => item.tone === "connection")
      .map((item) => item.href).sort(),
    ["/marcacao", "/conecta", "/eletroencefalograma", "/nesplora/"].sort(),
  );
  assert.equal(featuredNavigation.filter((item) => item.href === "/nesplora/").length, 1);
  assert.equal(navigablePages.some((item) => item.href === "/nesplora/"), false,
    "microsite estático não pode ser registrado como rota da SPA");
});

test("rotas duplicadas no destaque ativam a seção real, inclusive com query e hash", () => {
  for (const [path, title] of [
    [OBS_ROUTE, "PRÉ-CONSULTA GUIADA"],
    [`#${OBS_ROUTE}/?origem=atalho`, "PRÉ-CONSULTA GUIADA"],
    ["/testes-diretos", "TRIAGEM E FERRAMENTAS"],
    [VISUAL_ROUTE, "TRIAGEM E FERRAMENTAS"],
    [`#${VISUAL_ROUTE}?origem=atalho`, "TRIAGEM E FERRAMENTAS"],
    ["/pacientes/registro-sintetico", "ATENDIMENTO"],
    ["/conecta", "ACOMPANHAMENTO CLÍNICO"],
  ]) {
    assert.equal(findNavigationMatch(path)?.section.title, title, path);
  }
});

test("preferência pela seção não vence uma rota de destaque mais específica", () => {
  // Uma subrota futura no destaque deve ganhar da seção pai /pacientes.
  // Usa as coleções reais que o matcher consulta e restaura após a assertiva.
  const patient = featuredNavigation.find((item) => item.href === "/pacientes")!;
  const specific = { ...patient, href: "/pacientes/resumo-sintetico" };
  featuredNavigation.push(specific);
  try {
    const match = findNavigationMatch(`${specific.href}/detalhes?origem=teste`);
    assert.equal(match?.item, specific);
    assert.equal(match?.section.title, "DESTAQUES");
  } finally {
    featuredNavigation.splice(featuredNavigation.indexOf(specific), 1);
  }
});

test("aliases de instrumentos continuam resolvendo para seus destinos clínicos", () => {
  assert.equal(findNavigationMatch("/cognitive-lab/registro-sintetico")?.item.href, "/testes-diretos");
  assert.equal(findNavigationMatch("/generic-scale/mchat")?.item.href, "/filtro");
  assert.equal(findNavigationMatch("/rota-inexistente-sintetica"), undefined);
});
