/**
 * Entrega de convites de equipe por e-mail.
 *
 * O token de aceite é um bearer secret: quem o possui pode consumir o convite.
 * Por isso ele nunca pode ser devolvido ao convidante como fallback operacional.
 * Convites ficam disponíveis somente quando o transporte transacional está
 * configurado; qualquer indisponibilidade falha fechado e preserva a prova de
 * posse do endereço do destinatário.
 */
import {
  mailTransportConfigured,
  sendTransactionalEmail,
  type MailTransportEnv,
} from "../auth/_mailTransport";

export function invitationDeliveryConfigured(env: MailTransportEnv): boolean {
  return mailTransportConfigured(env);
}

export async function sendInvitationEmail(
  env: MailTransportEnv,
  params: { to: string; clinicName: string; role: string; invitationUrl: string; expiresAt: string },
): Promise<boolean> {
  return sendTransactionalEmail(env, {
    to: params.to,
    subject: `Convite para a equipe de ${params.clinicName} — NeuroPed`,
    text: [
      `Você foi convidado(a) para integrar a equipe de ${params.clinicName} no NeuroPed`,
      `com o papel "${params.role}".`,
      "",
      `Para aceitar, abra: ${params.invitationUrl}`,
      "",
      `O convite expira em ${params.expiresAt.slice(0, 10)} e só pode ser usado uma vez.`,
      "Se você não esperava este convite, ignore esta mensagem — sem o aceite,",
      "nenhum acesso é criado.",
    ].join("\n"),
  });
}
