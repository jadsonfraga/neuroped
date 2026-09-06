/** Check before catalogue deduplication: aliases must not conceal two sources. */
const canonicalIds = ['afi12-sdg', 'sdrd12-sdg', 'sarf12-sdg'];
const key = (value) => String(value ?? '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function assertUniqueAuthorialPackage(rows) {
  if (!Array.isArray(rows)) throw new TypeError('Expected the raw catalogue array.');
  for (const id of canonicalIds) {
    const matches = rows.filter((row) => key(row?.id) === key(id) || key(row?.name) === key(id));
    if (matches.length !== 1) throw new Error(`${id}: expected one raw source, found ${matches.length}. Do not merge duplicate registries.`);
    if (matches[0].id !== id) throw new Error(`${id}: alternate ID requires explicit migration, not a silent alias.`);
    if (matches[0].pendente_validacao_clinica !== true) throw new Error(`${id}: authorial monitoring must not gain presumed validation.`);
  }
}
