import type { Env } from "./_shared";
import {
  mailTransportConfigured,
  publicAppBaseUrl,
  sendTransactionalEmail,
  type MailTransportEnv,
} from "./_mailTransport";

export interface PasswordResetDeliveryEnv extends Env, MailTransportEnv {}

export function passwordResetDeliveryConfigured(env: PasswordResetDeliveryEnv): boolean {
  return mailTransportConfigured(env);
}

export async function sendPasswordResetEmail(
  env: PasswordResetDeliveryEnv,
  recipient: string,
  token: string,
): Promise<boolean> {
  const baseUrl = publicAppBaseUrl(env);
  if (!baseUrl) return false;

  // O frontend usa wouter/useHashLocation. O token fica no fragmento: ele não
  // integra a requisição HTTP ao origin/CDN e é consumido pela tela dedicada
  // /#/redefinir-senha, que troca o token pela nova senha via POST.
  const resetUrl = `${baseUrl}/#/redefinir-senha?token=${encodeURIComponent(token)}`;
  return sendTransactionalEmail(env, {
    to: recipient,
    subject: "Redefinição de senha — NeuroPed",
    text: [
      "Foi solicitada uma redefinição de senha da sua conta NeuroPed.",
      "",
      `Abra este endereço para definir uma nova senha: ${resetUrl}`,
      "",
      "O link expira em 30 minutos e só pode ser usado uma vez.",
      "Se você não fez esta solicitação, ignore esta mensagem.",
    ].join("\n"),
  });
}
