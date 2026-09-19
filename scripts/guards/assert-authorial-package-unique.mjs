/** Check before catalogue deduplication: aliases must not conceal two sources. */
const canonicalIds = ['afi12-sdg', 'sdrd12-sdg', 'sarf12-sdg'];
const key = (value) => String(value ?? '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function assertUniqueAuthorialPackage(rows) {
  if (!Array.isArray(rows)) throw new TypeError('Expected the raw catalogue array.');
  for (const id of canonicalIds) {
    const matches = rows.filter((row) => key(row?.id) === key(id) || key(row?.name) === key(id));
    if (matches.length !== 1) throw new Error(`${id}: expected one raw source, found ${matches.length}. Do not merge duplicate registries.`);
    const row = matches[0];
    if (row.id !== id) throw new Error(`${id}: alternate ID requires explicit migration, not a silent alias.`);

    // Revisão clínica/editorial concluída não equivale a validação psicométrica.
    // Este guard protege o status científico, sem obrigar que a revisão médica
    // permaneça eternamente pendente.
    if (row.licencaUso !== 'autoral') throw new Error(`${id}: authorial provenance/licensing was lost.`);
    if (row.assessmentUse !== 'monitorizacao' || row.prioridade !== 'monitorizacao') {
      throw new Error(`${id}: authorial instrument must remain a monitoring tool.`);
    }
    if (!key(row.tipo).includes('naovalidado')) {
      throw new Error(`${id}: authorial monitoring must remain explicitly non-validated.`);
    }
    if (!key(row.validacaoBrasil).includes('semvalidacaopsicometrica')) {
      throw new Error(`${id}: clinical review must not be presented as psychometric validation.`);
    }
    if (row.pubmedId !== null) throw new Error(`${id}: authorial monitoring must not gain a fabricated validation PMID.`);
    if (typeof row.pendente_validacao_clinica !== 'boolean') {
      throw new Error(`${id}: clinical-review status must remain explicit.`);
    }
  }
}