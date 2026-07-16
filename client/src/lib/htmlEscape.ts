/**
 * Escapes untrusted values before inserting them into an HTML template.
 *
 * React escapes rendered text for us, but printable documents are assembled as
 * strings and written to a new document. Those templates must escape every
 * value originating from a form, patient record or API response.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Preserves line breaks after escaping all markup. */
export function escapeHtmlWithBreaks(value: unknown): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}
