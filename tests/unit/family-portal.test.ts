// Portal da família: regras puras, token, extração de documento, mensagem. Dados fictícios.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FAMILY_PORTAL_CONSENT_NOTICE,
  ORIENTATION_TEMPLATES,
  OWN_TEST_HOW_DONE,
  buildFamilyMessageDraft,
  clampExpiresHours,
  clampMaxViews,
  findForbiddenInterpretation,
  shareAccessState,
  validatePortalDraft,
} from "../../shared/family-portal";
import { extractDocumentForFamily, parseFamilyPortalToken } from "../../functions/api/family-portal/_shared";

const TOKEN = `convite-1.${"a".repeat(43)}`;

describe("regra do médico: sem interpretação clínica", () => {
  it("os textos-modelo e os avisos fixos passam no filtro", () => {
    for (const t of ORIENTATION_TEMPLATES) assert.equal(findForbiddenInterpretation(`${t.titulo} ${t.texto}`), null, t.id);
    assert.equal(findForbiddenInterpretation(OWN_TEST_HOW_DONE.replace(/nota, nível, classificação nem conclusão/, "x")), null);
    assert.equal(findForbiddenInterpretation(FAMILY_PORTAL_CONSENT_NOTICE), null);
  });
  it("recusa diagnóstico, nível, corte, pontuação e classificação", () => {
    for (const t of ["Suspeita de TDAH", "risco alto de dislexia", "nível moderado", "ficou acima do esperado", "pontuação de 12 pontos", "ponto de corte atingido", "resultado positivo", "percentil 5", "CID F90.0", "acertou 20", "compatível com atraso", "28/36 acertos"]) {
      assert.notEqual(findForbiddenInterpretation(t), null, t);
    }
  });
  it("aceita descrição neutra de como a criança respondeu", () => {
    assert.equal(findForbiddenInterpretation("Colaborou, manteve a atenção por boa parte da atividade e pediu pausa uma vez."), null);
  });
});

describe("validatePortalDraft", () => {
  const base = { orientacoes: [], lembretes: [], questionarios: [], avaliacoesProprias: [], documentIds: [] };
  it("exige ao menos um item", () => {
    assert.equal(validatePortalDraft(base).ok, false);
    assert.equal(validatePortalDraft(null).ok, false);
  });
  it("aceita conteúdo válido", () => {
    const r = validatePortalDraft({
      orientacoes: [{ titulo: "Preparo", texto: "Leve os documentos." }],
      lembretes: [{ tipo: "consulta", titulo: "Consulta de retorno", quando: "2026-11-10T14:00:00-03:00", texto: "" }, { tipo: "documentos", titulo: "Levar exames", quando: "2026-11-09", texto: "" }],
      questionarios: [{ titulo: "Pré-consulta", token: TOKEN }],
      avaliacoesProprias: [{ instrumento: "super-neuropad-game", data: "2026-10-01", comoRespondeu: "Participou com interesse e pediu pausa." }],
      documentIds: ["doc-1", "doc-1", "doc-2"],
    });
    assert.equal(r.ok, true);
    if (r.ok) assert.deepEqual(r.value.documentIds, ["doc-1", "doc-2"]);
  });
  it("recusa avaliação própria com nível/classificação e explica", () => {
    const r = validatePortalDraft({ ...base, avaliacoesProprias: [{ instrumento: "dyslexia-risk-iced8", data: "2026-10-01", comoRespondeu: "Risco alto, abaixo do esperado" }] });
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.message, /sem nível, nota ou conclusão/);
  });
  it("recusa orientação e lembrete com diagnóstico", () => {
    assert.equal(validatePortalDraft({ ...base, orientacoes: [{ titulo: "TDAH", texto: "x" }] }).ok, false);
    assert.equal(validatePortalDraft({ ...base, lembretes: [{ tipo: "outro", titulo: "Tratar transtorno", quando: null, texto: "" }] }).ok, false);
  });
  it("recusa token de questionário, instrumento, data, tipo e id inválidos", () => {
    assert.equal(validatePortalDraft({ ...base, questionarios: [{ titulo: "x", token: "curto" }] }).ok, false);
    assert.equal(validatePortalDraft({ ...base, avaliacoesProprias: [{ instrumento: "outro", data: "2026-10-01", comoRespondeu: "" }] }).ok, false);
    assert.equal(validatePortalDraft({ ...base, avaliacoesProprias: [{ instrumento: "super-neuropad-game", data: "2026-02-31", comoRespondeu: "" }] }).ok, false);
    assert.equal(validatePortalDraft({ ...base, lembretes: [{ tipo: "xyz", titulo: "a", quando: null, texto: "" }] }).ok, false);
    assert.equal(validatePortalDraft({ ...base, documentIds: ["../x"] }).ok, false);
  });
  it("o schema da avaliação própria não tem campo de nota, nível ou classe", () => {
    const r = validatePortalDraft({ ...base, avaliacoesProprias: [{ instrumento: "super-neuropad-game", data: "2026-10-01", comoRespondeu: "ok", nivel: "alerta", score: 30 }] });
    assert.equal(r.ok, true);
    if (r.ok) assert.deepEqual(Object.keys(r.value.avaliacoesProprias[0]).sort(), ["comoRespondeu", "data", "instrumento"]);
  });
  it("respeita limites de quantidade", () => {
    const many = Array.from({ length: 13 }, (_, i) => ({ titulo: `T${i}`, texto: "Leve os documentos." }));
    assert.equal(validatePortalDraft({ ...base, orientacoes: many }).ok, false);
  });
});

describe("expiração e uso limitado", () => {
  const share = { status: "active" as const, expiresAt: "2026-11-01T12:00:00.000Z", viewCount: 0, maxViews: 2, clinicStatus: "active" };
  const now = new Date("2026-10-20T12:00:00.000Z");
  it("ok, expirado, esgotado, revogado, clínica suspensa", () => {
    assert.equal(shareAccessState(share, now), "ok");
    assert.equal(shareAccessState(share, new Date("2026-11-01T12:00:00.000Z")), "expired");
    assert.equal(shareAccessState({ ...share, viewCount: 2 }, now), "exhausted");
    assert.equal(shareAccessState({ ...share, status: "revoked" }, now), "revoked");
    assert.equal(shareAccessState({ ...share, clinicStatus: "suspended" }, now), "clinic_unavailable");
  });
  it("uso único = 1 abertura", () => {
    assert.equal(shareAccessState({ ...share, maxViews: 1, viewCount: 1 }, now), "exhausted");
  });
  it("limites de horas e aberturas", () => {
    assert.equal(clampExpiresHours(undefined), 72);
    assert.equal(clampExpiresHours(0), null);
    assert.equal(clampExpiresHours(721), null);
    assert.equal(clampMaxViews(undefined), 3);
    assert.equal(clampMaxViews(11), null);
    assert.equal(clampMaxViews(1.5), null);
  });
});

describe("token e documentos", () => {
  it("parse do token", () => {
    assert.deepEqual(parseFamilyPortalToken(TOKEN), { shareId: "convite-1", secret: "a".repeat(43) });
    assert.equal(parseFamilyPortalToken("sem-ponto"), null);
    assert.equal(parseFamilyPortalToken(`a.b.${"c".repeat(43)}`), null);
    assert.equal(parseFamilyPortalToken(`a.${"c".repeat(10)}`), null);
  });
  it("extrai título e texto do documento liberado; sem texto = recusa", () => {
    const d = extractDocumentForFamily("d1", "report", "2026-10-01T10:00:00.000Z", { title: "Relatório fictício", text: "Texto do médico." });
    assert.equal(d?.titulo, "Relatório fictício");
    assert.equal(d?.texto, "Texto do médico.");
    assert.equal(extractDocumentForFamily("d2", "report", "2026-10-01T10:00:00.000Z", { title: "x" }), null);
    assert.equal(extractDocumentForFamily("d3", "other", "2026-10-01T10:00:00.000Z", "texto simples")?.texto, "texto simples");
  });
});

describe("mensagem-rascunho", () => {
  it("inclui link, validade, limite, LGPD e emergência; nada de conteúdo clínico", () => {
    const m = buildFamilyMessageDraft({ link: "https://x.example/portal.html#token=abc", expiresAt: "2026-11-01T15:00:00.000Z", maxViews: 1, hasQuestionnaire: true, clinicName: "Clínica Fictícia" });
    assert.match(m, /portal\.html#token=abc/);
    assert.match(m, /até 1 vez e vale até 01\/11\/2026,? 12:00/);
    assert.match(m, /LGPD/);
    assert.match(m, /192/);
    assert.match(m, /questionário/);
    assert.equal(findForbiddenInterpretation(m.replace(/https?:\S+/, "")), null);
  });
});
