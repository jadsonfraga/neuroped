/**
 * Leitura de parâmetros de consulta em um app roteado por HASH.
 *
 * O NeuroPed usa `wouter` com hash location, então um link como
 * `/prontuario?patientId=abc` pode chegar de duas formas: `#/prontuario?...`
 * (digitado, copiado ou salvo) ou `/?patientId=abc#/prontuario` (produzido
 * pela navegação interna do wouter). Ler apenas `location.search` perde a
 * primeira; ler apenas o hash perde a segunda. Nos dois casos a tela abre em
 * branco, sem erro, e a pessoa preenche uma ficha que nunca será vinculada ao
 * paciente.
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
