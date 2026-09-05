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

export async function resendEmailVerification(email: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    throw new Error(
      await errorMessage(response, `Solicitação falhou (${response.status})`),
    );
  }
}
