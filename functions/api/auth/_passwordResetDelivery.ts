import type { Env } from "./_shared";

export interface PasswordResetDeliveryEnv extends Env {
  AUTH_PUBLIC_APP_URL?: string;
  AUTH_RESEND_API_KEY?: string;
  AUTH_EMAIL_FROM?: string;
}

function normalizeBaseUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return null;
    url.pathname = url.pathname.replace(/\/$/, "");
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function passwordResetDeliveryConfigured(env: PasswordResetDeliveryEnv): boolean {
  return Boolean(
    normalizeBaseUrl(env.AUTH_PUBLIC_APP_URL) &&
    env.AUTH_RESEND_API_KEY?.trim() &&
    env.AUTH_EMAIL_FROM?.trim(),
  );
}

export async function sendPasswordResetEmail(
  env: PasswordResetDeliveryEnv,
  recipient: string,
  token: string,
): Promise<boolean> {
  const baseUrl = normalizeBaseUrl(env.AUTH_PUBLIC_APP_URL);
  const apiKey = env.AUTH_RESEND_API_KEY?.trim();
  const from = env.AUTH_EMAIL_FROM?.trim();
  if (!baseUrl || !apiKey || !from) return false;

  // O frontend usa wouter/useHashLocation. O token fica no fragmento: ele não
  // integra a requisição HTTP ao origin/CDN e é consumido pela tela dedicada
  // /#/redefinir-senha, que troca o token pela nova senha via POST.
  const resetUrl = `${baseUrl}/#/redefinir-senha?token=${encodeURIComponent(token)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject: "Redefinição de senha — NeuroPed",
      text: [
        "Foi solicitada uma redefinição de senha da sua conta NeuroPed.",
        "",
        `Abra este endereço para definir uma nova senha: ${resetUrl}`,
        "",
        "O link expira em 30 minutos e só pode ser usado uma vez.",
        "Se você não fez esta solicitação, ignore esta mensagem.",
      ].join("\n"),
    }),
  });

  return response.ok;
}
