const API_BASE = (import.meta.env?.VITE_API_URL ?? "").replace(/\/$/, "");

/**
 * Erro de RESPOSTA do servidor (HTTP não-ok com corpo interpretado): a
 * mensagem veio do backend e é segura/útil de exibir — ex.: o runtime local
 * explica que a redefinição por e-mail vive na produção
 * (PASSWORD_RESET_REMOTE_ONLY). Falhas de transporte (fetch rejeitado,
 * "Failed to fetch"…) NÃO usam esta classe e devem cair na mensagem genérica
 * de conectividade da UI.
 */
export class PasswordRecoveryServerError extends Error {}

async function serverError(
  response: Response,
  fallback: string,
): Promise<PasswordRecoveryServerError> {
  const body = await response.json().catch(() => ({}));
  return new PasswordRecoveryServerError(
    typeof body?.error === "string" && body.error.trim() ? body.error : fallback,
  );
}

export async function requestPasswordReset(email: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    throw await serverError(response, `Solicitação falhou (${response.status})`);
  }
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  if (!response.ok) {
    throw await serverError(response, `Redefinição falhou (${response.status})`);
  }
}
