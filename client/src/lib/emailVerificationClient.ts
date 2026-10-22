const API_BASE = (import.meta.env?.VITE_API_URL ?? "").replace(/\/$/, "");

async function errorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const body = await response.json().catch(() => ({}));
  return typeof body?.error === "string" ? body.error : fallback;
}

function postJson(path: string, body: unknown): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function verifyEmailToken(token: string): Promise<void> {
  const response = await postJson("/api/auth/verify-email", { token });
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
  const response = await postJson("/api/auth/resend-verification", { email });
  if (!response.ok) {
    const message = await errorMessage(response, `Solicitação falhou (${response.status})`);
    if (response.status === 503) throw new EmailVerificationBlockedError(message);
    throw new Error(message);
  }
}
