/**
 * _mailTransport.ts — o único lugar do backend que fala com um provedor de
 * e-mail transacional.
 *
 * Antes deste módulo, redefinição de senha e verificação de e-mail carregavam
 * cada uma a sua própria chamada `fetch("https://api.resend.com/emails")`.
 * Funcionava, mas fazia duas coisas ruins ao mesmo tempo: amarrava o produto a
 * um fornecedor específico em três pontos diferentes, e tornava o convite de
 * equipe — o terceiro e-mail transacional do funil — um passo MANUAL ("copie o
 * link e envie ao convidado"), porque ninguém queria duplicar o `fetch` uma
 * terceira vez.
 *
 * Contrato:
 *   - `mailTransportConfigured(env)` diz se É POSSÍVEL entregar. Todo fluxo
 *     que depende de e-mail decide fail-closed com base nela.
 *   - `sendTransactionalEmail(env, message)` entrega ou devolve `false`. Nunca
 *     lança para o chamador, nunca loga o destinatário nem o corpo (o corpo
 *     carrega token de uso único).
 *
 * Provedores:
 *   - `resend` (padrão, e o único hoje). A requisição é byte a byte a que já
 *     existia, para que a suíte que interceptava `api.resend.com` continue
 *     válida sem alteração.
 *   - O Cloudflare Email Service foi avaliado como segundo adaptador (removeria
 *     um suboperador da cadeia LGPD). Não entrou: o binding nativo não está
 *     disponível em Pages Functions, e o contrato da REST API não pôde ser
 *     verificado a partir deste ambiente. Um adaptador escrito às cegas contra
 *     uma API em beta seria fonte de bug, não de independência. Quando entrar,
 *     entra AQUI, e nenhum fluxo muda.
 */

export interface MailTransportEnv {
  AUTH_PUBLIC_APP_URL?: string;
  AUTH_RESEND_API_KEY?: string;
  AUTH_EMAIL_FROM?: string;
  /** Reservado para o segundo adaptador. Hoje só `resend` é aceito. */
  AUTH_EMAIL_TRANSPORT?: string;
}

export interface TransactionalEmail {
  to: string;
  subject: string;
  text: string;
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Base pública HTTPS do app, normalizada. HTTPS é obrigatório: todo e-mail
 * transacional carrega um link com token de uso único, e um link em http seria
 * interceptável no caminho.
 */
export function publicAppBaseUrl(env: Pick<MailTransportEnv, "AUTH_PUBLIC_APP_URL">): string | null {
  const value = env.AUTH_PUBLIC_APP_URL;
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

function transportName(env: MailTransportEnv): "resend" | null {
  const requested = (env.AUTH_EMAIL_TRANSPORT ?? "resend").trim().toLowerCase();
  return requested === "resend" ? "resend" : null;
}

export function mailTransportConfigured(env: MailTransportEnv): boolean {
  if (!transportName(env)) return false;
  return Boolean(
    publicAppBaseUrl(env) &&
      env.AUTH_RESEND_API_KEY?.trim() &&
      env.AUTH_EMAIL_FROM?.trim(),
  );
}

export async function sendTransactionalEmail(
  env: MailTransportEnv,
  message: TransactionalEmail,
): Promise<boolean> {
  if (!mailTransportConfigured(env)) return false;
  const apiKey = env.AUTH_RESEND_API_KEY!.trim();
  const from = env.AUTH_EMAIL_FROM!.trim();

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
      }),
    });
    if (!response.ok) {
      // Status é o único dado seguro de registrar: o corpo da resposta do
      // provedor pode ecoar o destinatário.
      console.error("[mail] delivery failed", { status: response.status });
    }
    return response.ok;
  } catch (error) {
    console.error("[mail] delivery error", error instanceof Error ? error.name : "unknown");
    return false;
  }
}
