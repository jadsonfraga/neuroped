import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { featuredNavigation, navSections } from "../../client/src/data/navigation";
import { scoreIced, type IcedInput } from "../../client/src/features/dyslexia-risk/model";
import { buildIcedFamilySummary, buildIcedFullRecord, buildIcedSummary, buildIcedDocSpec, icedInputOf, icedResponseItems, type IcedState } from "../../client/src/features/dyslexia-risk/report";

const empty: IcedInput = {
  ano: "3",
  controle: { esc: "sim", alf: "sim", freq: "sim", aud: "sim", vis: "sim", di: "sim", pers: "sim" },
  palavrasAcertos: 20, palavrasF: 0, palavrasNorma: false,
  pseudoAcertos: 16, pseudoLex: 0, pseudoNorma: false,
  pcpm: 110, fluenciaNorma: false,
  ditadoF: 0, ditadoPseudoCertas: 5, ditadoNorma: false,
  cfAcertos: 12, cfNorma: false,
  ranSeg: 30, ranErros: 0, ranNorma: false,
  familiar: "nao",
  persistencia4: false,
};

test("dyslexia risk entra no destaque fora do topo fixo e na triagem", () => {
  assert.equal(featuredNavigation.slice(0, 9).some((item) => item.href === "/dyslexia-risk"), false);
  const featured = featuredNavigation.filter((item) => item.href === "/dyslexia-risk");
  const section = navSections.flatMap((item) => item.items).filter((item) => item.href === "/dyslexia-risk");
  assert.equal(featured.length, 1);
  assert.equal(section.length, 1);
  assert.equal(featured[0].label, "dyslexia risk");
  assert.equal(section[0].label, "dyslexia risk");
  assert.equal(featured[0].tone, "priority");
});

test("trava do bloco 0 impede leitura de dislexia", () => {
  const result = scoreIced({ ...empty, controle: { ...empty.controle, aud: "nao" }, pcpm: 20, ditadoF: 8 });
  assert.equal(result.trava, true);
  assert.equal(result.faixa, "descritiva");
  assert.match(result.frase, /não constitui diagnóstico/);
});

test("9–15 sem núcleo reclassifica para intermediário", () => {
  const result = scoreIced({ ...empty, pseudoAcertos: 4, cfAcertos: 2, ranSeg: 70, familiar: "sim", persistencia4: true, pcpm: 110, ditadoF: 0, ditadoPseudoCertas: 5 });
  assert.equal(result.nucleo, "ausente");
  assert.equal(result.faixa, "intermediaria");
});

test("cabeçalho usa o escudo e a estética do Super NeuroPad", () => {
  const page = readFileSync("client/src/pages/dyslexia-risk.tsx", "utf8");
  assert.match(page, /dr-jadson-shield-badge\.webp/);
  assert.match(page, /super-neuropad-arcade\.css/);
  assert.match(page, /className="snp /);
  assert.doesNotMatch(page, /<main/);
});

test("fluência do 2º ano pontua só na âncora", () => {
  assert.equal(scoreIced({ ...empty, ano: "2", pcpm: 42 }).dominios[0].pontos, 3);
  assert.equal(scoreIced({ ...empty, ano: "2", pcpm: 50 }).dominios[0].pontos, 0);
  assert.equal(scoreIced({ ...empty, ano: "2", pcpm: 50 }).dominios[0].limítrofe, true);
});

function stateFor(over: Partial<IcedState> = {}): IcedState {
  const base: IcedState = {
    nome: "Ana Testes", data: "", nasc: "", idade: "8", ano: "3", escola: "pública", anosEsc: "2", examinador: "Dra. Teste",
    controle: { esc: "sim", alf: "sim", freq: "sim", aud: "sim", vis: "sim", di: "sim", pers: "sim" },
    palavras: Array.from({ length: 20 }, () => ({ ok: true, err: false, prod: "" })),
    pseudo: Array.from({ length: 16 }, () => ({ ok: true, err: false, lex: false, prod: "" })),
    flu: { tempo: 60, lidas: 110, erros: 0 },
    ditado: Array.from({ length: 12 }, () => ({ grafia: "", f: false, o: false })),
    ditadoP: Array.from({ length: 5 }, () => ({ grafia: "", ok: true })),
    cf: Array.from({ length: 12 }, () => ({ ok: true, err: false })),
    ran: { seg: 30, erros: 0, norma: false },
    fam: { pai: "nao", mae: "nao", irmao: "nao", nome: "" },
    pers: { a: "nao", b: "", c: "", d: "", nota: "" },
    normas: { palavras: false, pseudo: false, flu: false, ditado: false, cf: false },
    fenomeno: "",
    done: { portao: true, escudo: true, palavras: true, pseudo: true, fluencia: true, ditado: true, sons: true, formas: true, familia: true, ponte: true },
  };
  return { ...base, ...over };
}

test("icedInputOf reflete os gates de fase done e persiste igual ao scoreIced da página", () => {
  const state = stateFor();
  const input = icedInputOf(state);
  assert.equal(input.palavrasAcertos, 20);
  assert.equal(input.pcpm, 110);
  assert.equal(input.familiar, "nao");
  assert.equal(input.persistencia4, false);
  const incomplete = icedInputOf({ ...state, done: { portao: true } });
  assert.equal(incomplete.palavrasAcertos, null);
  assert.equal(incomplete.pcpm, null);
});

test("registro completo transcreve literalmente sem perder produções", () => {
  const state = stateFor({ palavras: Array.from({ length: 20 }, (_, i) => ({ ok: i < 18, err: i >= 18, prod: i === 18 ? "casas" : "" })) });
  const result = scoreIced(icedInputOf(state));
  const record = buildIcedFullRecord(state, result, "01/01/2026 10:00");
  assert.match(record, /Ana Testes/);
  assert.match(record, /casas/);
  assert.match(record, /Erro fonol\u00f3gico|erro fonol\u00f3gico/i);
  assert.match(record, /n\u00e3o constitui diagn\u00f3stico/i);
  assert.match(record, /18\/20|- 18 acertos|18 de 20/);
});

test("resumo para a família cabe no wa.me (limite 1800 codificado)", () => {
  for (const over of [{}, { fenomeno: "x".repeat(200) }, { done: {} }]) {
    const state = stateFor(over as Partial<IcedState>);
    const result = scoreIced(icedInputOf(state));
    const text = buildIcedFamilySummary(state, result, "01/01/2026 10:00");
    const encoded = encodeURIComponent(text).length;
    assert.ok(encoded <= 1800, `resumo ICED-8 familiar codificado em ${encoded} estoura o wa.me`);
    assert.match(text, /n\u00e3o \u00e9 diagn\u00f3stico/i);
  }
});

test("DocSpec do PDF tem rodap\u00e9 LGPD e nunca classifica com trava ativa", () => {
  const locked = stateFor({ controle: { esc: "nao", alf: "sim", freq: "sim", aud: "sim", vis: "sim", di: "sim", pers: "sim" } });
  const result = scoreIced(icedInputOf(locked));
  const spec = buildIcedDocSpec(locked, result, { doctorName: "Dra. Teste", specialty: "", credentials: "", clinicName: "", motto: "" }, "01/01/2026 10:00");
  assert.equal(result.faixa, "descritiva");
  assert.match(spec.footer ?? "", /LGPD/);
  assert.match(spec.subtitle, /descritiva/);
  const clean = stateFor();
  const cleanResult = scoreIced(icedInputOf(clean));
  const cleanSpec = buildIcedDocSpec(clean, cleanResult, { doctorName: "Dra. Teste", specialty: "", credentials: "", clinicName: "", motto: "" }, "01/01/2026 10:00");
  assert.equal(cleanSpec.sections.length >= 5, true);
  assert.equal(cleanSpec.sections.some((section) => section.heading === "Dom\u00ednios pontuados"), true);
});

test("icedResponseItems alimenta o SaveToPatient sem lacunas", () => {
  const state = stateFor();
  const result = scoreIced(icedInputOf(state));
  const items = icedResponseItems(state, result);
  assert.equal(items.length > 15, true);
  assert.equal(items.every((item) => item.question && item.answer), true);
  assert.match(items.find((item) => item.question === "Escore ICED-8")?.answer ?? "", /^\d+\/15$/);
});

test("resumo curto mant\u00e9m trava e disclaimers", () => {
  const state = stateFor({ controle: { esc: "sim", alf: "sim", freq: "sim", aud: "nao", vis: "sim", di: "sim", pers: "sim" } });
  const result = scoreIced(icedInputOf(state));
  const summary = buildIcedSummary(state, result, "01/01/2026 10:00");
  assert.match(summary, /Trava ativa/);
  assert.match(summary, /n\u00e3o diagnostica/i);
});

test("p\u00e1gina wired de ponta a ponta: exporta\u00e7\u00e3o, salvar e anti-regress\u00f5es", () => {
  const page = readFileSync("client/src/pages/dyslexia-risk.tsx", "utf8");
  assert.match(page, /buildIcedFullRecord/);
  assert.match(page, /buildIcedDocSpec/);
  assert.match(page, /buildIcedSummary/);
  assert.match(page, /icedResponseItems/);
  assert.match(page, /LazySaveToPatient/);
  assert.match(page, /exportPdf/);
  assert.match(page, /newApplication/);
  assert.match(page, /localStorage\.removeItem\(KEY\)/);
  assert.match(page, /aria-pressed/);
  assert.match(page, /normas\.pseudo/);
  assert.doesNotMatch(page, /sessionStorage/);
  assert.match(page, /N\u00e3o foi poss\u00edvel gerar o PDF/);
});
