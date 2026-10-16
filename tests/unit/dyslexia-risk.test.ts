import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { featuredNavigation, navSections } from "../../client/src/data/navigation";
import { describeIced, type IcedInput } from "../../client/src/features/dyslexia-risk/model";
import { buildIcedFamilySummary, buildIcedFullRecord, buildIcedSummary, buildIcedDocSpec, icedInputOf, icedResponseItems, type IcedState } from "../../client/src/features/dyslexia-risk/report";

const empty: IcedInput = {
  ano: "3",
  controle: { esc: "sim", alf: "sim", freq: "sim", aud: "sim", vis: "sim", di: "sim", pers: "sim" },
  palavrasAcertos: 20, palavrasF: 0,
  pseudoAcertos: 16, pseudoLex: 0,
  pcpm: 110,
  ditadoF: 0, ditadoPseudoCertas: 5,
  cfAcertos: 12,
  ranSeg: 30, ranErros: 0,
  familiar: "nao",
  persistencia4: false,
};

test("dyslexia risk entra no destaque fora do topo fixo e na triagem", () => {
  assert.equal(featuredNavigation.slice(0, 9).some((item) => item.href === "/dyslexia-risk"), false);
  const featured = featuredNavigation.filter((item) => item.href === "/dyslexia-risk");
  const section = navSections.flatMap((item) => item.items).filter((item) => item.href === "/dyslexia-risk");
  assert.equal(featured.length, 1);
  assert.equal(section.length, 1);
  assert.equal(featured[0].label, "Dyslexia Risk · Jogo 5–18");
  assert.equal(section[0].label, "Dyslexia Risk · Jogo 5–18");
  assert.equal(featured[0].tone, "priority");
  assert.equal(featured[0].hero, true, "atalho em vermelho (cartão-herói), como o Super NeuroPad Game");
});

test("ICED-8 só descreve: medidas brutas por domínio, sem pontos, faixa, trava ou leitura", () => {
  const result = describeIced({ ...empty, controle: { ...empty.controle, aud: "nao" }, pcpm: 20, ditadoF: 8, pseudoAcertos: 4, cfAcertos: 2, ranSeg: 70, fluLidas: 22, fluErros: 2, fluTempo: 60 });
  for (const key of ["total", "faixa", "trava", "nucleo", "leitura", "avisos", "proporcaoPct", "pontosExaminaveis"]) assert.equal(key in result, false, key);
  for (const dominio of result.dominios) for (const key of ["pontos", "peso", "limítrofe"]) assert.equal(key in dominio, false, `${dominio.id}.${key}`);
  const byId = Object.fromEntries(result.dominios.map((d) => [d.id, d.medida]));
  assert.match(byId.fluencia, /22 palavras lidas · 2 erros · 60 s · palavras corretas por minuto: 20/);
  assert.match(byId.ortografia, /erros fonológicos 8 · pseudopalavras certas 5\/5/);
  assert.match(byId.pseudo, /4\/16 certas/);
  assert.match(byId.cf, /2\/12 certas/);
  assert.match(byId.ran, /70 s · 0 erros \(40 estímulos\)/);
  assert.equal(result.controles.find((c) => c.chave === "aud")!.resposta, "não");
  assert.match(result.frase, /Registro descritivo; sem classificação\. Interpretação a cargo do profissional\./);
  assert.doesNotMatch(result.frase, /ICED-8 = |Leitura operacional|Trava|Núcleo/);
});

test("domínio não aplicado aparece como não examinado, sem zerar nem pontuar", () => {
  const result = describeIced({ ...empty, pcpm: null, ranSeg: null, cfAcertos: null });
  assert.deepEqual(result.naoExaminados.sort(), ["Consciência fonológica", "Fluência", "Nomeação rápida"].sort());
  assert.ok(result.dominios.filter((d) => !d.examinado).every((d) => d.medida.startsWith("não examinad")));
});

test("cabeçalho usa o escudo e a estética do Super NeuroPad", () => {
  const page = readFileSync("client/src/pages/dyslexia-risk.tsx", "utf8");
  assert.match(page, /dr-jadson-shield-badge\.webp/);
  assert.match(page, /super-neuropad-arcade\.css/);
  assert.match(page, /className="snp /);
  assert.doesNotMatch(page, /<main/);
});

test("anti-regressão visual: cada toggle snp-chip declara estado via aria-pressed", () => {
  const page = readFileSync("client/src/pages/dyslexia-risk.tsx", "utf8");
  const chips = page.match(/<button[^>]*className=\{`snp-chip/g) ?? [];
  assert.ok(chips.length >= 8, `esperados >=8 toggles snp-chip, encontrados ${chips.length}`);
  const pressed = page.match(/aria-pressed=/g) ?? [];
  assert.equal(pressed.length >= chips.length, true, `todos os snp-chip devem ter aria-pressed (${pressed.length}/${chips.length})`);
});

test("anti-regressão: cronômetro da fluência trava em 60 s e campos numéricos não aceitam negativo", () => {
  const page = readFileSync("client/src/pages/dyslexia-risk.tsx", "utf8");
  assert.match(page, /secs < 60/, "o efeito do cronômetro deve parar em 60 s");
  assert.match(page, /tempo: 60/, "ao atingir 60 s o tempo deve ser gravado como 60");
  const numberInputs = page.match(/<input type="number"[\s\S]*?\/>/g) ?? [];
  assert.ok(numberInputs.length >= 3, `esperados >=3 inputs numéricos, encontrados ${numberInputs.length}`);
  for (const input of numberInputs) {
    assert.match(input, /min=\{0\}/, `input numérico sem min 0: ${input}`);
    assert.match(input, /Math\.max\(0/, `input numérico sem clamp Math.max(0): ${input}`);
  }
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
    ran: { seg: 30, erros: 0 },
    fam: { pai: "nao", mae: "nao", irmao: "nao", nome: "" },
    pers: { a: "nao", b: "", c: "", d: "", nota: "" },
    fenomeno: "",
    done: { portao: true, escudo: true, palavras: true, pseudo: true, fluencia: true, ditado: true, sons: true, formas: true, familia: true, ponte: true },
  };
  return { ...base, ...over };
}

test("icedInputOf reflete os gates de fase done e persiste igual ao describeIced da página", () => {
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
  const result = describeIced(icedInputOf(state));
  const record = buildIcedFullRecord(state, result, "01/01/2026 10:00");
  assert.match(record, /Ana Testes/);
  assert.match(record, /casas/);
  assert.match(record, /Erro fonol\u00f3gico|erro fonol\u00f3gico/i);
  assert.match(record, /Registro descritivo; sem classificação\./);
  assert.match(record, /18\/20 certas/);
});

test("resumo para a família cabe no wa.me (limite 1800 codificado)", () => {
  for (const over of [{}, { fenomeno: "x".repeat(200) }, { done: {} }]) {
    const state = stateFor(over as Partial<IcedState>);
    const result = describeIced(icedInputOf(state));
    const text = buildIcedFamilySummary(state, result, "01/01/2026 10:00");
    const encoded = encodeURIComponent(text).length;
    assert.ok(encoded <= 1800, `resumo ICED-8 familiar codificado em ${encoded} estoura o wa.me`);
    assert.match(text, /Registro descritivo; sem classificação\./);
  }
});

test("DocSpec do PDF tem rodapé LGPD, controles como respondidos e nenhuma classificação", () => {
  const locked = stateFor({ controle: { esc: "nao", alf: "sim", freq: "sim", aud: "sim", vis: "sim", di: "sim", pers: "sim" } });
  const result = describeIced(icedInputOf(locked));
  const spec = buildIcedDocSpec(locked, result, { doctorName: "Dra. Teste", specialty: "", credentials: "", clinicName: "", motto: "" }, "01/01/2026 10:00");
  assert.match(spec.footer ?? "", /LGPD/);
  assert.match(spec.subtitle, /Registro descritivo/);
  assert.match(spec.sections[0].body, /≥ 2 anos de escolarização formal: não/);
  assert.equal(spec.sections.length >= 5, true);
  assert.equal(spec.sections.some((section) => section.heading === "Medidas registradas por domínio"), true);
});

test("icedResponseItems alimenta o SaveToPatient sem lacunas e sem escore", () => {
  const state = stateFor();
  const result = describeIced(icedInputOf(state));
  const items = icedResponseItems(state, result);
  assert.equal(items.length > 15, true);
  assert.equal(items.every((item) => item.question && item.answer), true);
  assert.equal(items.some((item) => /escore|leitura operacional|trava|núcleo/i.test(item.question)), false);
});

test("resumo curto traz as medidas e o aviso descritivo", () => {
  const state = stateFor({ controle: { esc: "sim", alf: "sim", freq: "sim", aud: "nao", vis: "sim", di: "sim", pers: "sim" } });
  const result = describeIced(icedInputOf(state));
  const summary = buildIcedSummary(state, result, "01/01/2026 10:00");
  assert.match(summary, /Medidas registradas por domínio/);
  assert.match(summary, /Registro descritivo; sem classificação\./);
  assert.doesNotMatch(summary, /Trava|Escore|\/15/);
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
  assert.match(page, /clearDraft\(KEY\)/, "nova aplicação apaga o rascunho local");
  assert.match(page, /aria-pressed/);
  assert.doesNotMatch(page, /normas\.|\.norma\b|result\.(trava|faixa|total|leitura)/);
  assert.doesNotMatch(page, /sessionStorage/);
  assert.match(page, /N\u00e3o foi poss\u00edvel gerar o PDF/);
});
