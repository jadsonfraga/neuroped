/**
 * Leitura de parâmetros de consulta em um app roteado por HASH.
 *
 * O NeuroPed usa `wouter` com `useHashLocation`, então um link como
 * `/prontuario?patientId=abc` vira a URL `.../#/prontuario?patientId=abc`.
 * Nesse formato `window.location.search` está VAZIO — a consulta vive dentro
 * do hash. Ler apenas `location.search` faz o parâmetro sumir silenciosamente:
 * a tela abre em branco, sem erro, e a pessoa preenche uma ficha que nunca
 * será vinculada ao paciente.
 *
 * Este helper lê o hash primeiro e só então cai para a query real da URL, que
 * continua valendo para links externos (e-mail, QR, retorno de checkout).
 */
export function readRouteParam(name: string): string {
  if (typeof window === "undefined") return "";

  const rawHash = window.location.hash || "";
  const hashQuery = rawHash.includes("?")
    ? rawHash.slice(rawHash.indexOf("?") + 1)
    : "";
  const fromHash = new URLSearchParams(hashQuery).get(name)?.trim() ?? "";
  if (fromHash) return fromHash;

  return new URLSearchParams(window.location.search).get(name)?.trim() ?? "";
}
