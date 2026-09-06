export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;

/**
 * Política canônica para toda criação/troca de credencial humana.
 *
 * Senha é dado opaco: nunca aparar, normalizar Unicode ou truncar antes desta
 * validação. O mesmo valor que passa na política deve ser o valor enviado ao
 * KDF/hash.
 */
export function passwordPolicyError(password: string, subject = "A senha"): string | null {
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return `${subject} deve ter entre ${PASSWORD_MIN} e ${PASSWORD_MAX} caracteres.`;
  }
  if (!/[A-Z]/.test(password)) return `${subject} deve conter letra maiúscula.`;
  if (!/[a-z]/.test(password)) return `${subject} deve conter letra minúscula.`;
  if (!/[0-9]/.test(password)) return `${subject} deve conter número.`;
  if (!/[^A-Za-z0-9]/.test(password)) return `${subject} deve conter símbolo.`;
  return null;
}
