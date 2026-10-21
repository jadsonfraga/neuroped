const API_BASE = (import.meta.env?.VITE_API_URL ?? "").replace(/\/$/, "");

async function errorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const body = await response.json().catch(() => ({}));
  return typeof body?.error === "string" ? body.error : fallback;
}

export async function verifyEmailToken(token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) {
    throw new Error(
      await errorMessage(response, `Confirmação falhou (${response.status})`),
    );
  }
}

/** Falha tipada de reenvio: o servidor declarou o provedor de e-mail indisponível (BLOCKED_EXTERNAL). */
export class EmailVerificationBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailVerificationBlockedError";
  }
}

export async function resendEmailVerification(email: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const message = await errorMessage(response, `Solicitação falhou (${response.status})`);
    if (response.status === 503) throw new EmailVerificationBlockedError(message);
    throw new Error(message);
  }
}
