/** Retorna true somente para um objeto JSON comum (não null/array). */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Resposta JSON canônica das Functions: nunca cacheada. Fonte única — as
 * rotas importam daqui (ou de auth/_shared, que reexporta) em vez de manter
 * cópias locais. A exceção deliberada é integrations/boaconsulta/import.ts,
 * que precisa de headers adicionais (charset, private, nosniff).
 */
export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

/**
 * Sanitização canônica de campo string de payload: apara e limita o tamanho;
 * qualquer outro tipo vira string vazia (fail-closed).
 */
export function boundedText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
