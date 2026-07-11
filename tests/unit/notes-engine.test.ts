import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildChecklistSuggestions, classifyTopics, generateClinicalDocuments, inferEvidenceSource, type TranscriptSegment } from "../../shared/notes";

const baseSegment = (partial: Partial<TranscriptSegment>): TranscriptSegment => ({
  id: crypto.randomUUID(), consultationId: "consulta-1", startMs: 0, endMs: 1000, text: "", speaker: "mae", topics: [], source: "relato_pais", createdAt: new Date("2026-07-11T00:00:00.000Z").toISOString(), ...partial,
});

describe("NeuroPed Notes engine", () => {
  it("classifica assuntos clínicos a partir de palavras-chave", () => {
    assert.deepEqual(classifyTopics("A mãe relata insônia, seletividade alimentar e atraso de fala."), ["desenvolvimento_linguagem", "perfil_sensorial", "sono", "alimentacao"]);
  });

  it("mantém fonte da evidência separada do assunto clínico", () => {
    assert.equal(inferEvidenceSource("Relatório escolar descreve dificuldade em sala", "mae"), "documento_escolar");
    assert.equal(inferEvidenceSource("Ao exame observo marcha preservada", "medico"), "observacao_medico");
  });

  it("sugere pendências discretas sem repetir tópicos já cobertos", () => {
    const suggestions = buildChecklistSuggestions([baseSegment({ topics: ["sono", "historia_familiar"] })]);
    assert.ok(suggestions.every((suggestion) => suggestion.topic !== "sono" && suggestion.topic !== "historia_familiar"));
    assert.ok(suggestions.some((suggestion) => suggestion.topic === "crises"));
  });

  it("gera documentos clínicos com campos pendentes para revisão médica", () => {
    const docs = generateClinicalDocuments([
      baseSegment({ startMs: 12_000, speaker: "mae", text: "Procurou por atraso de fala.", topics: ["queixa_principal", "desenvolvimento_linguagem"] }),
      baseSegment({ startMs: 60_000, speaker: "medico", source: "observacao_medico", text: "Ao exame neurológico marcha sem alterações.", topics: ["exame_neurologico"] }),
    ]);
    assert.match(docs.pant, /PANT/);
    assert.match(docs.anamnese, /Procurou por atraso de fala/);
    assert.ok(docs.camposPendentes.includes("historia_familiar"));
  });
});
