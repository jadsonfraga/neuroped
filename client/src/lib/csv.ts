/**
 * Neutralização de injeção de fórmula em CSV (CWE-1236).
 *
 * Planilhas interpretam células iniciadas em `=`, `+`, `-`, `@` (ou TAB/CR)
 * como fórmula mesmo quando o campo vem entre aspas. Texto livre digitado no
 * app (descrição de crise, notas, nome completo) não pode virar fórmula ao
 * abrir o export no Excel/LibreOffice. Números puros (ex.: "-5") continuam
 * intactos para não corromper colunas quantitativas.
 */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^-?\d+(?:[.,]\d+)?$/;

export function neutralizeCsvFormula(value: string): string {
  return FORMULA_TRIGGER.test(value) && !PLAIN_NUMBER.test(value) ? `'${value}` : value;
}
