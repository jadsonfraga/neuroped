/** Scientific validation is independent from editorial/clinical review. */
const normalize = (value) =>
  String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Canonical predicate shared by the provenance report and the release gate. */
export function awaitsPsychometricValidation(scale) {
  return normalize(scale.validacaoBrasil).includes("sem validacao psicometrica") ||
    (scale.licencaUso === "autoral" && normalize(scale.tipo).includes("nao validado")) ||
    scale.pendente_validacao_clinica === true;
}
