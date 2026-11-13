import assert from "node:assert/strict";
import { test } from "node:test";
import { auditarDossie, type DossiePanty } from "../../client/src/lib/laudo/pantyAudit";

function base(): DossiePanty {
  return {
    tipo: "PANTY",
    fontes: [{ id: "f1", natureza: "familia", data: "2026-11-01", relato: "Relato fictício." },
             { id: "f2", natureza: "escola", data: "2026-11-02", relato: "Relato fictício divergente." }],
    divergencias: [{ id: "d1", fonteIds: ["f1", "f2"], descricao: "Informantes divergem.", resolvida: false }],
    hipoteses: [{ id: "h1", descricao: "Hipótese fictícia", estado: "investigacao", aFavor: [], contra: [] }],
    metas: [{ id: "m1", descricao: "Meta fictícia", prazoSemanas: 10, criterioObservavel: "Observação registrada", decisao: "RX" }],
    medicamentos: [],
    cronologiaRevisada: true, narrativaRevisada: true, revisaoCidConfirmada: true,
    aceiteMedico: { confirmado: true, responsavel: "Médico de teste", data: "2026-11-07" },
  };
}
test("dossiê revisado aceita divergência não resolvida sem apagá-la", () => {
  assert.equal(auditarDossie(base()).apto, true);
});
test("bloqueia CID de hipótese em investigação", () => {
  const d = base(); d.hipoteses[0].cid10 = "F00";
  assert.ok(auditarDossie(d).achados.some(a => a.codigo === "CID_HIPOTESE"));
});
test("bloqueia emissão sem aceite médico real", () => {
  const d = base(); d.aceiteMedico = { confirmado: false };
  assert.ok(auditarDossie(d).achados.some(a => a.codigo === "ACEITE"));
});
test("bloqueia metas sem decisão longitudinal e prazo fora da janela", () => {
  const d = base(); d.metas[0].decisao = undefined; d.metas[0].prazoSemanas = 16;
  const codes = auditarDossie(d).achados.map(a => a.codigo);
  assert.ok(codes.includes("DECISAO")); assert.ok(codes.includes("META"));
});
test("bloqueia divergência sem duas fontes válidas", () => {
  const d = base(); d.divergencias[0].fonteIds = ["f1", "inexistente"];
  assert.ok(auditarDossie(d).achados.some(a => a.codigo === "DIVERGENCIA_FONTE"));
});
test("bloqueia revisão incompleta de medicação", () => {
  const d = base(); d.medicamentos.push({ principioAtivo: "Fármaco de teste", apresentacao: "", concentracao: "", dosePorTomada: "", frequencia: "", verificacaoMedica: false });
  assert.ok(auditarDossie(d).achados.some(a => a.codigo === "MEDICACAO"));
});
