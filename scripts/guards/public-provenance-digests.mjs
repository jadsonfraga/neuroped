/**
 * Exceções revisadas para integridade de documentos públicos, nunca credenciais.
 * Identificadores qualificados tornam explícitos algoritmo e finalidade.
 * Não libera arquivos inteiros: exige caminho, campo e digest conhecidos.
 * Proveniência: Pacote 01 NeuroPed SDG, conferido em 05/09/2026, PR #790.
 */
const reviewedPdfDigests = new Set([
  "sha256:f2123c61e7f03c52e20a24348b444f5c66293457c76b87756c0800435221b74d",
  "sha256:df63139cd65e52c46f99c772362b6ba36fcaad57794ab9616dbae7dce1c26225",
  "sha256:d0c55e5b29718bdf7b0ccfdb869914ce4f81d69b9dc5c38586c8ffb60194d8e9",
]);
const reviewedItemDigests = new Set([
  "sha256:524b86926dfd552867bd2c0ce462262cb0bcb9bf76ce14286ec6b9fe55537204",
  "sha256:feca17058895d8b379a253099f05b7f51713353a379d03119a036f0e5893b646",
  "sha256:108ef066f98a83a0e874197911bb91ac8c5dbd5ab8003a32155801f7b0a4a1fe",
]);
const reviewedFields = new Map([
  ["client/src/data/authorialSdgRegistry.ts", { field: "sourceSha256", digests: reviewedPdfDigests }],
  ["client/public/authorial-sdg-manifest.json", { field: "sourceSha256", digests: reviewedPdfDigests }],
  ["tests/clinical/test-authorial-sdg-core.mjs", { field: "textSha256", digests: reviewedItemDigests }],
]);

/** Nenhuma exceção é concedida fora do campo e digest previamente revisados. */
function findUnreviewedLiterals(content, reviewed, pattern) {
  return [...content.matchAll(pattern)].filter((match) => {
    if (!reviewed || !reviewed.digests.has(`sha256:${match[1].toLowerCase()}`)) return true;
    // Apenas valor literal de propriedade; nunca variável PIN, argumento, array
    // ou uso em autenticação, mesmo que o valor seja um digest documental conhecido.
    const prefix = content.slice(0, match.index);
    const field = prefix.match(/(?:^|[\n{,])\s*(?:["']([^"']+)["']|([A-Za-z_$][\w$]*))\s*:\s*$/);
    return (field?.[1] ?? field?.[2]) !== reviewed.field;
  }).map((match) => ({ index: match.index, digest: match[1] }));
}

/** Mantém a detecção conservadora original para toda ocorrência não revisada. */
export function findUnreviewedSha256Literals(relativePath, content) {
  return findUnreviewedLiterals(content, reviewedFields.get(relativePath), /["']([a-f0-9]{64})["']/gi);
}

/**
 * O bundle conserva os campos sourceSha256 no chunk do catálogo. Só esse
 * chunk e o manifesto público podem transportar os três digests documentais.
 * Backticks continuam inspecionados, como no auditor compilado original.
 */
export function findUnreviewedBuiltSha256Literals(relativePath, content) {
  const reviewed = relativePath === "authorial-sdg-manifest.json" || /^assets\/scaleFilter-[A-Za-z0-9_-]+\.js$/.test(relativePath)
    ? { field: "sourceSha256", digests: reviewedPdfDigests }
    : undefined;
  return findUnreviewedLiterals(content, reviewed, /["'`]([a-f0-9]{64})["'`]/gi);
}
