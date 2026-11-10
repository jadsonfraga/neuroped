import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

// Contrato do catálogo da Biblioteca Clínica 365 (Dias 01–09): identidade
// canônica, âncoras estáveis, ausência de duplicação, estado de revisão médica
// honesto e navegação sem encadeamento manual por Dia.
const data = readFileSync("client/src/data/clinicalLibrary.ts", "utf8");
const page = readFileSync("client/src/pages/biblioteca-clinica.tsx", "utf8");
const workflow = readFileSync(".github/workflows/biblioteca-clinica-qa.yml", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const componentFiles = readdirSync("client/src/components").filter((name) => name.startsWith("biblioteca-clinica-"));
const components = Object.fromEntries(componentFiles.map((name) => [name, readFileSync(`client/src/components/${name}`, "utf8")]));

// Perguntas literais da aba "Trilha 365" do índice-mestre (Drive 1uZ-Lr_ztbnWTue5fuVZsbJ72Ilc_s9NX).
const CANONICAL = {
  1: "Como distinguir sinais de TEA de timidez na primeira infância?",
  2: "Como diferenciar desatenção de imaturidade etária?",
  3: "Primeira crise convulsiva afebril: qual a abordagem inicial?",
  4: "Como diferenciar dificuldade de alfabetização de dislexia?",
  5: "Quando o atraso de fala exige avaliação global?",
  6: "Como reconhecer ansiedade de separação que ultrapassa o esperado?",
  7: "Quando a criança que não fala precisa de avaliação auditiva urgente?",
  8: "Como avaliar insônia comportamental no pré-escolar?",
  9: "O que cada índice do WISC-IV informa ao neuropediatra?",
};
const NEXT_DAY_10 = "Como analisar agressividade infantil antes de propor medicação?";

const blocks = [...data.matchAll(/\{\n\s+slug: "([^"]+)",\n\s+anchor: "([^"]+)",\n(?:\s+day: (\d+),\n)?\s+title: "([^"]+)",[\s\S]*?status: "([a-z_]+)",/g)]
  .map(([, slug, anchor, day, title, status]) => ({ slug, anchor, day: day ? Number(day) : null, title, status }));
const trail = blocks.filter((b) => b.day !== null).sort((a, b) => a.day - b.day);

assert.equal(trail.length, 9, "Trilha 365 deve ter exatamente os Dias 01–09");
assert.deepEqual(trail.map((b) => b.day), [1, 2, 3, 4, 5, 6, 7, 8, 9], "Dias canônicos 1..9 sem lacuna nem repetição");
for (const chapter of trail) {
  assert.equal(chapter.title, CANONICAL[chapter.day], `Dia ${chapter.day}: título diverge do índice-mestre`);
  assert.equal(chapter.status, "revisao_medica", `Dia ${chapter.day}: sem aceite médico, status deve ser revisao_medica`);
}
assert.equal(new Set(blocks.map((b) => b.slug)).size, blocks.length, "slug duplicado no catálogo");
assert.equal(new Set(blocks.map((b) => b.anchor)).size, blocks.length, "âncora duplicada no catálogo");
assert.equal(blocks.filter((b) => b.day === null).length, 1, "apenas o estudo WISC-IV fica fora da Trilha 365");

// Cada âncora existe como <article id> uma única vez, no componente ou na página.
for (const { anchor, slug } of blocks) {
  const sources = [page, ...Object.values(components)].filter((text) => text.includes(`id="${anchor}"`));
  assert.equal(sources.length, 1, `${slug}: âncora ${anchor} deve existir em exatamente um <article>`);
}

// Cada capítulo é renderizado uma única vez na página.
for (const tag of ["<TeaTimidezChapter />", "<DesatencaoImaturidadeChapter />", "<PrimeiraCriseAfebrilChapter />", "<AlfabetizacaoDislexiaChapter />", "<AtrasoFalaAvaliacaoGlobalChapter />", "<AnsiedadeSeparacaoChapter />", "<AudicaoUrgenteChapter />", "<InsoniaPreEscolarChapter />"]) {
  assert.equal(page.split(tag).length - 1, 1, `${tag} renderizado mais de uma vez ou ausente`);
}

// Navegação por âncora estável, sem encadeamento manual por Dia/slug.
assert.match(data, /export function clinicalLibraryAnchorForSlug\(/);
assert.ok(page.includes("clinicalLibraryAnchorForSlug(selectedChapterSlug())"), "link profundo deve usar a âncora do catálogo");
assert.ok(page.includes("new URLSearchParams(window.location.search).get(\"capitulo\")"), "link profundo deve sobreviver ao retorno do login");
assert.ok(page.includes("focusChapter(item.anchor, true)"), "cartão deve navegar pela âncora estável");
assert.ok(page.includes("target.focus({ preventScroll: true })"), "navegação deve mover o foco para o capítulo");
assert.doesNotMatch(page, /item\.day === \d \?/, "encadeamento manual por Dia reintroduzido");
assert.doesNotMatch(page, /slug === "[a-z-]+" \? "capitulo-/, "encadeamento manual por slug reintroduzido");

// Estado de revisão médica honesto.
assert.doesNotMatch(page, /<ShieldCheck[^>]*\/> Revisão médica<\/span>/, "selo do topo não pode sugerir revisão concluída");
assert.ok(page.includes('"Material educacional em revisão médica"'), "selo do topo deve declarar revisão pendente");
assert.ok(page.includes("clinicalLibraryStatusLabel[item.status]"), "cartão deve refletir o status do capítulo");
assert.doesNotMatch(page, /min de leitura <span aria-hidden="true">·<\/span> <span className="[^"]*">Revisão médica pendente<\/span>/, "rótulo de status fixo no cartão");
assert.match(data, /revisao_medica: "Revisão médica pendente"/);
assert.ok(!/status: "publicado"/.test(data), "nenhum capítulo pode estar publicado sem aceite médico explícito");

// Fluxogramas com papel e nome acessível; links externos seguros.
for (const [name, text] of Object.entries(components)) {
  assert.match(text, /role="group" aria-label="[^"]+"/, `${name}: fluxograma sem role="group" + aria-label`);
  const blank = text.match(/target="_blank"/g)?.length ?? 0;
  const safe = text.match(/rel="noopener noreferrer"/g)?.length ?? 0;
  assert.ok(blank > 0 && safe >= blank, `${name}: todo link externo precisa de rel="noopener noreferrer"`);
}

// Pauta seguinte alinhada ao índice e numerada a partir do último Dia publicado.
assert.match(data, new RegExp(`export const nextClinicalTopics = \\[\\n\\s+"${NEXT_DAY_10.replace(/[?]/g, "\\?")}"`), "próximo tema deve ser o Dia 10 do índice");
assert.ok(page.includes("String(i + nextDay)"), "numeração da pauta deve derivar do último Dia da trilha");

// Gates executados pelo QA da Biblioteca.
assert.ok(workflow.includes("clinical-library-catalog.test.mjs"), "QA não executa o contrato do catálogo");
assert.ok(workflow.includes("test:e2e:biblioteca-clinica"), "QA não executa o E2E da Biblioteca");
assert.equal(pkg.scripts["test:e2e:biblioteca-clinica"], "node tests/e2e/biblioteca-clinica.mjs");

// Smoke publicado: trilha derivada do catálogo do commit implantado, nunca lista fixa
// (a lista fixa de 4 capítulos reprovou o deploy do Dia 05).
const publishedSmoke = readFileSync("tests/e2e/published-biblioteca.mjs", "utf8");
const publishedWorkflow = readFileSync(".github/workflows/biblioteca-clinica-published-smoke.yml", "utf8");
assert.ok(publishedSmoke.includes("readTrailFromCatalog()"), "smoke publicado deve ler a trilha do catálogo");
assert.doesNotMatch(publishedSmoke, /const TRAIL = \[/, "smoke publicado não pode fixar a lista de capítulos");
assert.doesNotMatch(publishedSmoke, /cards\.count\(\), \d+/, "smoke publicado não pode fixar a contagem de capítulos");
assert.match(publishedWorkflow, /ref: \$\{\{ github\.event\.workflow_run\.head_sha \|\| github\.sha \}\}/, "smoke publicado deve fazer checkout do SHA implantado");

console.log(`clinical-library-catalog ok (${trail.length} dias, ${blocks.length} capítulos, ${componentFiles.length} componentes)`);
