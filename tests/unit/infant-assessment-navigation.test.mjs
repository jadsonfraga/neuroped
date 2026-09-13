import assert from "node:assert/strict";
import fs from "node:fs";

// Proteção da consolidação Sonda Dez (Missão 2 da espiral, 09/2026).
//
// História: este teste nasceu para as páginas dedicadas de reconhecimento
// infantil e avaliação cognitiva. A consolidação "os testes diretos convergem
// para a Sonda Dez" (f2d7f48) esvaziou essas páginas em shims, o teste ficou
// órfão (nunca wired em script algum) e FALHAVA em silêncio — cenografia.
// Reescrito para o mundo real e ligado ao gate: a home e o catálogo não podem
// voltar a prometer páginas dedicadas que renderizam outra coisa.

const read = (path) => fs.readFileSync(path, "utf8");
const home = read("client/src/pages/home.tsx");
const nav = read("client/src/data/navigation.ts");
const app = read("client/src/App.tsx");

// A home aponta a testagem direta para a superfície canônica, sem ressuscitar
// as cartas das páginas esvaziadas.
assert.match(home, /href: "\/testes-diretos"/);
assert.doesNotMatch(home, /href: "\/testes-reconhecimento"/);
assert.doesNotMatch(home, /href: "\/avaliacao-cognitiva-infantil"/);
assert.doesNotMatch(home, /Reconhecimento Visual Infantil/);

// Nenhum lazy import de shim volta ao App: as rotas legadas vivem no mapa de
// redirects, não como páginas próprias.
for (const shim of [
  "testes-reconhecimento",
  "testes-academicos",
  "cognitive-lab",
  "cognitive-task",
  "avaliacao-cognitiva-infantil",
  "academico-interativo",
  "escrita-desenho",
  "conhecimento-visual",
  "motricidade-teste",
  "conhecimentos-gerais",
  "funcoes-executivas",
  "atencao-concentracao",
  "linguagem-fonologia",
  "memoria-teste",
  "processamento-visuoauditivo",
]) {
  assert.doesNotMatch(
    app,
    new RegExp(`@/pages/${shim}"`),
    `App.tsx voltou a importar o shim ${shim} como página própria`,
  );
  assert.equal(
    fs.existsSync(`client/src/pages/${shim}.tsx`),
    false,
    `shim ${shim}.tsx ressuscitou — a superfície canônica é /testes-diretos`,
  );
}

// A navegação continua resolvendo os caminhos legados para o item Sonda Dez,
// derivando do mapa de redirects (fonte única).
assert.match(nav, /LEGACY_DIRECT_TEST_REDIRECTS/);
assert.match(nav, /startsWith\("\/cognitive-lab\/"\)/);

// Seções da navegação clínica preservadas (asserções herdadas do teste
// original que continuam verdadeiras).
const clinicalStart = nav.indexOf('title: "CLÍNICA E ACOMPANHAMENTO"');
const referenceStart = nav.indexOf('title: "REFERÊNCIA"');
assert.ok(clinicalStart >= 0 && referenceStart > clinicalStart);
const clinicalSection = nav.slice(clinicalStart, referenceStart);
const referenceSection = nav.slice(referenceStart);
assert.match(clinicalSection, /href: "\/medicamentos"/);
assert.match(clinicalSection, /href: "\/farmacologia"/);
assert.match(clinicalSection, /href: "\/calculadora-dose"/);
assert.doesNotMatch(referenceSection, /href: "\/(medicamentos|farmacologia|calculadora-dose)"/);

console.log(
  "✓ Consolidação Sonda Dez protegida: home honesta, shims extintos, navegação derivada do mapa de redirects",
);
