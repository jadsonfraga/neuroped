// Checagem de dose (APOIO): base com fonte, motor de comparação, sem inventar faixas.
// Valores de peso, idade e dose são fictícios.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AVISO_APOIO_DOSE, BASE_REFERENCIAS, checarDose, encontrarMedicamento, medicamentosDaBase, validarBase, type BaseReferencias } from "../../client/src/lib/checagemDose";

const anos = (a: number, m = 0) => a * 12 + m;
const dose = (medicamento: string, doseMg: number, dosesPorDia: number, pesoKg: number, idadeMeses: number) => checarDose({ medicamento, doseMg, dosesPorDia, pesoKg, idadeMeses });
const codigos = (r: ReturnType<typeof dose>) => (r.situacao === "avaliada" ? r.alertas.map((a) => a.codigo) : []);

describe("base de referências", () => {
  it("é válida: fonte completa, trecho literal em cada limite", () => {
    assert.deepEqual(validarBase(BASE_REFERENCIAS), []);
  });
  it("todas as entradas nascem aguardando validação do médico", () => {
    for (const e of BASE_REFERENCIAS.entradas) {
      assert.equal(e.status, "aguardando_validacao_medico", e.id);
      assert.equal(e.validacao.por, null);
    }
  });
  it("só fontes oficiais citáveis (FDA/DailyMed) com versão e datas", () => {
    for (const e of BASE_REFERENCIAS.entradas) {
      assert.match(e.fonte.url, /^https:\/\/dailymed\.nlm\.nih\.gov\//);
      assert.match(e.fonte.setId, /^[0-9a-f-]{36}$/);
      assert.ok(e.fonte.versaoSpl);
      assert.match(e.fonte.dataEfetiva, /^\d{4}-\d{2}-\d{2}$/);
      assert.match(e.fonte.dataConsulta, /^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it("lista os quatro medicamentos iniciais", () => {
    assert.deepEqual(medicamentosDaBase(), ["atomoxetina", "carbamazepina", "levetiracetam", "valproato"]);
  });
  it("o validador rejeita entrada sem trecho, sem fonte e validação incoerente", () => {
    const ruim = JSON.parse(JSON.stringify(BASE_REFERENCIAS)) as BaseReferencias;
    ruim.entradas[0].limites[0].trecho = "";
    ruim.entradas[1].fonte.url = "http://x";
    ruim.entradas[2].status = "validado_medico";
    const erros = validarBase(ruim).join("\n");
    assert.match(erros, /sem trecho literal/);
    assert.match(erros, /url deve ser https/);
    assert.match(erros, /validado sem responsável/);
  });
});

describe("checarDose", () => {
  it("levetiracetam 5 anos, 20 kg: 700 mg 2x/dia = 70 mg/kg/dia, acima da dose-alvo de 60", () => {
    const r = dose("Keppra", 700, 2, 20, anos(5));
    assert.equal(r.situacao, "avaliada");
    if (r.situacao !== "avaliada") return;
    assert.equal(r.doseMgKgDia, 70);
    assert.ok(codigos(r).includes("acima-da-dose-alvo-da-fonte"));
    assert.equal(r.aguardandoValidacao, true);
    assert.match(r.alertas[0].limite.trecho, /recommended daily dose of 60 mg\/kg/);
  });

  it("levetiracetam dentro da faixa: sem alerta de atenção, com ressalva", () => {
    const r = dose("levetiracetam", 300, 2, 20, anos(5)); // 30 mg/kg/dia
    assert.deepEqual(codigos(r), ["dentro-da-faixa-da-fonte"]);
    if (r.situacao === "avaliada") assert.match(r.alertas[0].mensagem, /Isso não confirma que a dose seja adequada/);
  });

  it("abaixo da dose inicial é só informativo", () => {
    const r = dose("levetiracetam", 100, 2, 20, anos(5)); // 10 mg/kg/dia
    assert.deepEqual(codigos(r), ["abaixo-da-dose-inicial-da-fonte"]);
    if (r.situacao === "avaliada") { assert.equal(r.alertas[0].nivel, "informativo"); assert.match(r.alertas[0].mensagem, /titulação/); }
  });

  it("limite em mg/dia: levetiracetam 50 kg, 16 anos exclusivos fora da faixa", () => {
    assert.equal(dose("levetiracetam", 1500, 2, 50, anos(15, 11)).situacao, "avaliada");
    assert.equal(dose("levetiracetam", 1500, 2, 50, anos(16)).situacao, "sem-dado-validado");
    const r = dose("levetiracetam", 1750, 2, 50, anos(15)); // 3500 mg/dia, 70 mg/kg/dia
    assert.ok(codigos(r).includes("acima-do-limite-da-fonte"));
  });

  it("atomoxetina por peso: <70 kg usa mg/kg e o menor entre 1,4 mg/kg e 100 mg", () => {
    const r = dose("atomoxetina", 40, 1, 25, anos(8)); // 1,6 mg/kg/dia
    assert.ok(codigos(r).includes("acima-do-limite-da-fonte"));
    assert.ok(codigos(r).includes("acima-da-dose-alvo-da-fonte"));
    const ok = dose("Strattera", 25, 1, 25, anos(8)); // 1,0 mg/kg/dia
    assert.deepEqual(codigos(ok), ["dentro-da-faixa-da-fonte"]);
  });

  it("atomoxetina ≥ 70 kg usa mg/dia", () => {
    const r = dose("atomoxetine", 60, 2, 75, anos(14)); // 120 mg/dia
    assert.ok(codigos(r).includes("acima-do-limite-da-fonte"));
    if (r.situacao === "avaliada") assert.equal(r.entrada.id, "atomoxetina-tdah-6a-70kg-ou-mais");
  });

  it("atomoxetina abaixo de 6 anos: sem dado validado", () => {
    assert.equal(dose("atomoxetina", 10, 1, 18, anos(5)).situacao, "sem-dado-validado");
  });

  it("carbamazepina por idade: <6 anos em mg/kg, 6–<12 em mg/dia, 12–<15 em mg/dia, ≥15 sem dado", () => {
    const a = dose("carbamazepina", 250, 3, 15, anos(4)); // 750 mg/dia = 50 mg/kg
    assert.ok(codigos(a).includes("acima-do-limite-da-fonte"));
    const b = dose("carbamazepina", 500, 3, 30, anos(9)); // 1500 mg/dia
    assert.ok(codigos(b).includes("acima-do-limite-da-fonte"));
    const c = dose("tegretol", 300, 3, 45, anos(13)); // 900 mg/dia
    assert.deepEqual(codigos(c), ["dentro-da-faixa-da-fonte"]);
    assert.equal(dose("carbamazepina", 300, 3, 60, anos(15)).situacao, "sem-dado-validado");
  });

  it("valproato: só ≥ 10 anos; limite 60 mg/kg/dia", () => {
    assert.equal(dose("valproato", 250, 2, 25, anos(8)).situacao, "sem-dado-validado");
    const r = dose("Depakote", 600, 3, 30, anos(11)); // 1800 mg/dia = 60 mg/kg: no limite, não acima
    assert.ok(!codigos(r).includes("acima-do-limite-da-fonte"));
    const acima = dose("ácido valproico", 650, 3, 30, anos(11)); // 65 mg/kg
    assert.ok(codigos(acima).includes("acima-do-limite-da-fonte"));
  });

  it("medicamento fora da base: sem dado validado, sem estimar", () => {
    const r = dose("risperidona", 1, 2, 20, anos(6));
    assert.equal(r.situacao, "sem-dado-validado");
    if (r.situacao === "sem-dado-validado") { assert.equal(r.medicamentoConhecido, false); assert.match(r.motivo, /Sem dado validado/); }
  });

  it("entradas inválidas são recusadas", () => {
    for (const r of [dose("levetiracetam", 0, 2, 20, 60), dose("levetiracetam", 100, 2.5, 20, 60), dose("levetiracetam", 100, 2, -1, 60), dose("levetiracetam", NaN, 2, 20, 60), dose("levetiracetam", 100, 2, 900, 60)]) {
      assert.equal(r.situacao, "entrada-invalida");
    }
  });

  it("entrada rejeitada pelo médico deixa de ser usada", () => {
    const base = JSON.parse(JSON.stringify(BASE_REFERENCIAS)) as BaseReferencias;
    for (const e of base.entradas) if (e.medicamento === "valproato") e.status = "rejeitado_medico";
    assert.equal(checarDose({ medicamento: "valproato", doseMg: 100, dosesPorDia: 2, pesoKg: 40, idadeMeses: 150 }, base).situacao, "sem-dado-validado");
  });

  it("entrada validada pelo médico remove o selo de aguardando", () => {
    const base = JSON.parse(JSON.stringify(BASE_REFERENCIAS)) as BaseReferencias;
    for (const e of base.entradas) if (e.medicamento === "valproato") { e.status = "validado_medico"; e.validacao = { por: "Médico Fictício", em: "2026-10-20", observacao: null }; }
    assert.deepEqual(validarBase(base), []);
    const r = checarDose({ medicamento: "valproato", doseMg: 100, dosesPorDia: 2, pesoKg: 40, idadeMeses: 150 }, base);
    assert.equal(r.situacao === "avaliada" && r.aguardandoValidacao, false);
  });

  it("nenhuma mensagem sugere conduta ou dose correta", () => {
    const proibidas = /\b(reduza|reduzir|aumente|aumentar|prescreva|prescrever|ajuste a dose|dose ideal|dose correta|recomenda-se)\b/i;
    const casos = [dose("levetiracetam", 700, 2, 20, anos(5)), dose("levetiracetam", 100, 2, 20, anos(5)), dose("levetiracetam", 300, 2, 20, anos(5)), dose("atomoxetina", 40, 1, 25, anos(8)), dose("valproato", 650, 3, 30, anos(11)), dose("carbamazepina", 250, 3, 15, anos(4))];
    for (const r of casos) {
      if (r.situacao !== "avaliada") continue;
      for (const a of r.alertas) assert.ok(!proibidas.test(a.mensagem), a.mensagem);
    }
    assert.match(AVISO_APOIO_DOSE, /Não é prescrição/);
  });

  it("aliases e acentos", () => {
    assert.equal(encontrarMedicamento("  Ácido Valproico "), "valproato");
    assert.equal(encontrarMedicamento("DEPAKOTE"), "valproato");
    assert.equal(encontrarMedicamento("xyz"), null);
  });
});
