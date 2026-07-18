// Formatação de telefone para links wa.me (WhatsApp). Público-alvo: números do
// Brasil (com DDD). Extraído de WhatsAppShare para permitir teste unitário do
// caminho sensível — um erro aqui envia o relatório para o número errado.

/**
 * Normaliza um telefone para o formato E.164 sem "+", pronto para `wa.me`.
 * Retorna "" quando o número não é reconhecível.
 *
 * Regras:
 *  - 10 ou 11 dígitos → número nacional (DDD + fixo de 8 / celular de 9):
 *    prefixa o país 55 — inclusive quando o DDD é o próprio 55 (Santa Maria/RS),
 *    caso que a versão antiga tratava errado com `startsWith("55")`.
 *  - 12 ou 13 dígitos começando com 55 → já vem com o código do Brasil.
 *  - 12 a 15 dígitos → outro internacional já completo.
 */
export function formatPhoneNumber(phone: string): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    return digits;
  }
  if (digits.length >= 12 && digits.length <= 15) {
    return digits;
  }
  return "";
}

/** Verdadeiro quando `formatPhoneNumber` produz um número discável (10–15 dígitos). */
export function isValidPhone(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  return formatted.length >= 10 && /^\d{10,15}$/.test(formatted);
}
