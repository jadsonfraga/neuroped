// Resumo pré-consulta: só dados salvos, sem invenção. Dados fictícios.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodificarProntuario, idadeEm, montarResumo, ROTULO_SUGESTAO } from "../../client/src/lib/resumoPreConsulta";

let n = 0;
const ev = (eventType: string, key: string, occurredAt: string, extra: Record<string, unknown> = {}, status = "active") => ({
  id: `e${++n}`, eventType, status, occurredAt, note: JSON.stringify({ key, ...extra }), data: (extra.data as object) ?? {},
});
const obs = (key: string, valueText: string, occurredAt = "2026-06-10T12:00:00Z", status = "active") =>
  ({ ...ev("observation", key, occurredAt, {}, status), data: { valueText } });
const med = (id: string, item: Record<string, string>, occurredAt: string, status = "active", removed = false) =>
  ev("medication", `medicacao:${id}`, occurredAt, removed ? { removed: true } : { item: { id, ...item } }, status);
const exame = (id: string, item: Record<string, string>, occurredAt: string, status = "active") =>
  ev("plan", `exame:${id}`, occurredAt, { item: { id, ...item } }, status);
const terapia = (id: string, item: Record<string, string>, occurredAt: string) => ev("plan", `terapia:${id}`, occurredAt, { item: { id, ...item } });

const base = () => [
  ev("encounter", "encounter", "2026-06-10T12:00:00Z", { identificacao: { cid: "F90.0", hipoteseDiagnostica: "Hipótese fictícia A" } }),
  obs("anamnese:queixaPrincipal", "Queixa fictícia de desatenção."),
  obs("anamnese:escolar", "Segundo ano, escola fictícia."),
  obs("marcos:crises", "Sim"),
  obs("marcos:crisesDesc", "Episódio fictício isolado."),
  med("m1", { nome: "Medicamento Alfa", dose: "10 mg", posologia: "manhã", dataInicio: "2026-05-01", resposta: "boa" }, "2026-06-10T12:00:00Z"),
  med("m2", { nome: "Medicamento Beta", dose: "", posologia: "noite", dataInicio: "2026-08-01", resposta: "" }, "2026-06-10T12:00:00Z"),
  terapia("t1", { tipo: "Terapia Gama", profissional: "Prof. Fictício", frequencia: "2x/semana", evolucao: "" }, "2026-06-10T12:00:00Z"),
  exame("x1", { tipo: "Exame Delta", data: "2026-06-01", status: "Pendente", resultado: "" }, "2026-06-10T12:00:00Z"),
  exame("x2", { tipo: "Exame Épsilon", data: "2026-09-01", status: "Normal", resultado: "sem alterações descritas" }, "2026-06-10T12:00:00Z"),
];
const resultados = [
  { id: "r1", scaleName: "PHQ-A", totalScore: 4, createdAt: "2026-03-01T12:00:00Z" },
  { id: "r2", scaleName: "PHQ-A", totalScore: 12, createdAt: "2026-09-15T12:00:00Z" },
  { id: "r3", scaleName: "SNAP-IV", totalScore: 30, createdAt: "2026-09-15T12:00:00Z" },
];
const hoje = "2026-10-16T12:00:00Z";
const resumo = () => montarResumo({ paciente: { nome: "Paciente Fictício", dataNascimento: "2018-03-10", cid: "" }, eventos: base(), resultados, hoje });

describe("decodificarProntuario", () => {
  it("lê encontro, anamnese, marcos, medicações, terapias e exames ativos", () => {
    const p = decodificarProntuario(base());
    assert.equal(p.encontros.length, 1);
    assert.equal(p.anamnese.queixaPrincipal, "Queixa fictícia de desatenção.");
    assert.equal(p.marcos.crises, "Sim");
    assert.equal(p.medicacoes.length, 2);
    assert.equal(p.terapias.length, 1);
    assert.equal(p.exames.length, 2);
  });
  it("ignora eventos substituídos nos itens ativos e remove itens apagados", () => {
    const comSuperseded = base().map((e) => (e.note.includes("medicacao:m1") ? { ...e, status: "superseded" } : e));
    const q = decodificarProntuario([...comSuperseded, med("m1", {}, "2026-07-01T12:00:00Z", "active", true)]);
    assert.ok(!q.medicacoes.some((m) => m.id === "m1"));
  });
  it("entrada inválida não quebra", () => {
    assert.deepEqual(decodificarProntuario(null as unknown as unknown[]).encontros, []);
    assert.deepEqual(decodificarProntuario([null, 3, "x"]).medicacoes, []);
  });
  it("lê o formato LIVE (payload)", () => {
    const live = [{ id: "l1", eventType: "medication", status: "active", occurredAt: "2026-06-10T12:00:00Z", encounterId: "medicacao:z", payload: { reason: JSON.stringify({ item: { id: "z", nome: "Medicamento Zeta", dose: "5 mg" } }) } }];
    assert.equal(decodificarProntuario(live, true).medicacoes[0].nome, "Medicamento Zeta");
  });
});

describe("montarResumo", () => {
  it("histórico e última visita", () => {
    const r = resumo();
    assert.equal(r.paciente.idade, "8 anos");
    assert.equal(r.paciente.cid, "F90.0");
    assert.equal(r.ultimaVisita?.diasDesde, 128);
    assert.equal(r.historico.queixa, "Queixa fictícia de desatenção.");
    assert.ok(r.historico.marcosAlerta[0].startsWith("Crises registradas: Episódio fictício"));
    assert.ok(r.historico.medicacoes.some((m) => m.startsWith("Medicamento Alfa · 10 mg")));
  });

  it("mudanças desde a última visita: escala aplicada depois, início de medicação e exame datados depois", () => {
    const textos = resumo().mudancas.map((m) => m.texto).join("\n");
    assert.match(textos, /PHQ-A aplicada em 15\/09\/2026: escore 12/);
    assert.match(textos, /Medicamento Beta: início registrado em 01\/08\/2026/);
    assert.match(textos, /Exame Épsilon: exame datado de 01\/09\/2026/);
    assert.ok(!/Medicamento Alfa: início/.test(textos), "início anterior à visita não é mudança");
  });

  it("mudanças entre versões do prontuário (dose, status do exame)", () => {
    const eventos = [
      ...base().map((e) => (e.note.includes("medicacao:m1") || e.note.includes("exame:x1") ? { ...e, status: "superseded" } : e)),
      med("m1", { nome: "Medicamento Alfa", dose: "15 mg", posologia: "manhã", dataInicio: "2026-05-01", resposta: "boa" }, "2026-10-01T12:00:00Z"),
      exame("x1", { tipo: "Exame Delta", data: "2026-06-01", status: "Normal", resultado: "sem alterações descritas" }, "2026-10-01T12:00:00Z"),
    ];
    const t = montarResumo({ paciente: { nome: "P" }, eventos, resultados: [], hoje }).mudancas.map((m) => m.texto).join("\n");
    assert.match(t, /Medicamento Alfa: dose mudou de "10 mg" para "15 mg"/);
    assert.match(t, /Exame Delta: status mudou de "Pendente" para "Normal"/);
  });

  it("pendências: só o que falta nos dados, sem inventar", () => {
    const t = resumo().pendencias.map((p) => p.texto).join("\n");
    assert.match(t, /Exame "Exame Delta" sem resultado concluído \(status: Pendente\)/);
    assert.match(t, /Medicação "Medicamento Beta" sem resposta registrada/);
    assert.match(t, /Medicação "Medicamento Beta" sem dose registrada/);
    assert.match(t, /Terapia "Terapia Gama" sem evolução registrada/);
    assert.match(t, /SNAP-IV: sem regra de evolução validada/);
    assert.ok(!/Exame Épsilon/.test(t));
  });

  it("prontuário vazio gera pendências claras e nenhum conteúdo clínico", () => {
    const r = montarResumo({ paciente: { nome: "P Vazio" }, eventos: [], resultados: [], hoje });
    const t = r.pendencias.map((p) => p.texto).join("\n");
    assert.match(t, /Nenhuma consulta registrada/);
    assert.match(t, /Queixa principal sem registro/);
    assert.match(t, /Sem CID nem hipótese/);
    assert.equal(r.ultimaVisita, null);
    assert.deepEqual(r.historico.medicacoes, []);
    assert.deepEqual(r.mudancas, []);
  });

  it("reaproveita o módulo de evolução (série PHQ-A com alerta de piora)", () => {
    const r = resumo();
    assert.equal(r.evolucao.series[0].instrumento.id, "phqa");
    assert.ok(r.evolucao.series[0].alertas.some((a) => a.codigo === "piora-de-faixa"));
    assert.equal(r.evolucao.pendentes[0].nome, "SNAP-IV");
  });

  it("perguntas sugeridas vêm de modelos fixos acionados pelos dados", () => {
    const q = resumo().perguntas.join("\n");
    assert.match(q, /mudança de saúde, sono, alimentação/);
    assert.match(q, /uso de Medicamento Alfa/);
    assert.match(q, /Terapia Gama/);
    assert.match(q, /Exame Delta" foi realizado/);
    assert.match(q, /novas crises/);
    assert.match(q, /O que a família e a escola percebem de diferente|o que a família e a escola percebem/i);
    assert.ok(!/regress|perda de alguma habilidade/.test(q), "sem regressão registrada, sem pergunta de regressão");
  });

  it("texto copiável rotula sugestão e declara fonte somente em dados salvos", () => {
    const r = resumo();
    assert.match(r.texto, /RESUMO PRÉ-CONSULTA/);
    assert.match(r.texto, /apenas com dados já salvos/);
    assert.ok(r.texto.includes(`PERGUNTAS SUGERIDAS (${ROTULO_SUGESTAO})`));
  });

  it("escala sem escore salvo (caso LIVE hoje) fica pendente, sem gráfico nem número inventado", () => {
    const live = [{ id: "a", scaleName: "PHQ-A", totalScore: null, appliedAt: "2026-09-15T12:00:00Z" }];
    const r = montarResumo({ paciente: { nome: "P" }, eventos: base(), resultados: live, hoje });
    assert.equal(r.evolucao.series.length, 0);
    assert.equal(r.evolucao.pendentes.length, 1);
    assert.ok(!r.mudancas.some((m) => m.tipo === "escala"));
  });

  it("idadeEm", () => {
    assert.equal(idadeEm("2024-01-10", "2026-03-15"), "2 anos e 2 meses");
    assert.equal(idadeEm(undefined, "2026-03-15"), "");
  });
});
