/**
 * Entrega do convite de equipe por e-mail.
 *
 * Até aqui o convite era o único e-mail transacional do funil que NÃO saía
 * pelo sistema: a API devolvia o link ao gestor e a tela pedia "copie e envie
 * ao convidado". Isso viola a definição de vendável (nenhum fluxo externo
 * depende do operador copiar link) e abre um vetor que a revisão adversarial
 * de 03/09 já tinha nomeado: o token de aceite ficava nas mãos do convidante,
 * que poderia usá-lo para criar a conta em nome de terceiro.
 *
 * Com entrega por e-mail, o token vai direto a quem tem que provar posse do
 * endereço — e a API deixa de devolvê-lo ao gestor. Sem transporte configurado
 * o comportamento anterior continua (link exibido, rotulado como manual), para
 * que uma instalação sem e-mail não perca a capacidade de convidar.
 */
import {
  mailTransportConfigured,
  sendTransactionalEmail,
  type MailTransportEnv,
} from "../auth/_mailTransport";

export type InvitationDelivery = "email" | "manual";

export function invitationDeliveryMode(env: MailTransportEnv): InvitationDelivery {
  return mailTransportConfigured(env) ? "email" : "manual";
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
