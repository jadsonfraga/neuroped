const API_BASE = (import.meta.env?.VITE_API_URL ?? "").replace(/\/$/, "");

async function errorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => ({}));
  return typeof body?.error === "string" ? body.error : fallback;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    throw new Error(await errorMessage(response, `Solicitação falhou (${response.status})`));
  }
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  if (!response.ok) {
    throw new Error(await errorMessage(response, `Redefinição falhou (${response.status})`));
  }
}
