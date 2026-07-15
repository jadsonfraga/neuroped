/**
 * Envio de email transacional via SMTP (substitui o execSync do Perplexity Computer).
 *
 * Provedor recomendado para o Brasil:
 *  - Brevo (ex-Sendinblue): plano free 300 emails/dia, baseado na UE
 *  - Resend: plano free 3000/mes, infraestrutura US (com DPA)
 *  - Amazon SES sa-east-1: hospedagem em SP, ~R$0,10 por mil emails
 *
 * Configuracao via env vars:
 *  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

export class EmailConfigurationError extends Error {}
export class EmailSendError extends Error {}

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (!host || !port || !user || !password) {
    throw new EmailConfigurationError(
      "Variaveis SMTP ausentes (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD). Configure em .env.",
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465,
    auth: { user, pass: password },
    tls: { rejectUnauthorized: true },
    disableFileAccess: true,
    disableUrlAccess: true,
  });

  return transporter;
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{ messageId: string }> {
  const from = process.env.SMTP_FROM ||
    "NeuroPed EDJ <noreply@neuroped.local>";

  if (!params.text && !params.html) {
    throw new EmailSendError("Email precisa de text ou html");
  }

  try {
    const t = getTransporter();
    const info = await t.sendMail({
      from,
      to: Array.isArray(params.to) ? params.to.join(", ") : params.to,
      subject: params.subject.slice(0, 200),
      text: params.text,
      html: params.html,
      replyTo: params.replyTo,
      disableFileAccess: true,
      disableUrlAccess: true,
      headers: {
        "X-NeuroPed-App": "edj",
        "Auto-Submitted": "auto-generated",
      },
    });
    return { messageId: info.messageId };
  } catch (e: any) {
    throw new EmailSendError(`Falha ao enviar email: ${e.message}`);
  }
}

export async function verifySmtpConnection(): Promise<boolean> {
  try {
    const t = getTransporter();
    await t.verify();
    return true;
  } catch {
    return false;
  }
}
