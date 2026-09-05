/**
 * GET /api/admin/go-live — prontidão comercial desta instalação.
 *
 * Por que existe: os gates que separam "software pronto" de "SaaS vendável"
 * não vivem no código — vivem em variáveis do Cloudflare Pages. Sem esta
 * rota, quem provisiona descobre se acertou tentando vender: cria conta,
 * espera um e-mail que não chega, e não sabe qual das três variáveis faltou.
 *
 * INVARIANTE DE SEGREDO: esta rota responde apenas BOOLEANOS e códigos. Ela
 * nunca devolve, ecoa ou registra o valor de segredo algum — nem prefixo, nem
 * comprimento, nem os últimos dígitos. Um verificador que vaza a chave que
 * verifica é pior do que não ter verificador.
 * Travado por tests/unit/go-live-readiness.test.ts.
 *
 * RESTRITA A ADMIN: a configuração comercial de uma instalação é informação
 * operacional. Exposta publicamente viraria oráculo — diria a qualquer um se
 * o cadastro está aberto, se há cobrança ativa e por qual provedor.
 */
import { getContextUser, isAdmin } from "../auth/_authorization";

interface Env {
  DB?: D1Database;
  NEUROPED_JWT_SECRET?: string;
  SAAS_SIGNUP_ENABLED?: string;
  AUTH_PUBLIC_APP_URL?: string;
  AUTH_RESEND_API_KEY?: string;
  AUTH_EMAIL_FROM?: string;
  ASAAS_API_KEY?: string;
  ASAAS_WEBHOOK_TOKEN?: string;
  ASAAS_ENVIRONMENT?: string;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

const preenchido = (valor: string | undefined, minimo = 1): boolean =>
  (valor?.trim().length ?? 0) >= minimo;

/** HTTPS obrigatório: um link de verificação em http seria interceptável. */
function baseUrlValida(valor: string | undefined): boolean {
  if (!preenchido(valor)) return false;
  try {
    return new URL(valor!.trim()).protocol === "https:";
  } catch {
    return false;
  }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const user = getContextUser(context);
  if (!user) {
    return json({ error: "Autenticação obrigatória.", code: "UNAUTHENTICATED" }, 401);
  }
  if (!isAdmin(user)) {
    return json({ error: "Acesso restrito.", code: "FORBIDDEN" }, 403);
  }

  // Os comprimentos mínimos espelham os exigidos pelos próprios fluxos: o
  // webhook do Asaas compara em tempo constante um token de 32+ (_provider.ts).
  const entregaEmail =
    baseUrlValida(env.AUTH_PUBLIC_APP_URL) &&
    preenchido(env.AUTH_RESEND_API_KEY) &&
    preenchido(env.AUTH_EMAIL_FROM);

  const cobranca =
    preenchido(env.ASAAS_API_KEY, 16) &&
    preenchido(env.ASAAS_WEBHOOK_TOKEN, 32) &&
    ["sandbox", "production"].includes(
      (env.ASAAS_ENVIRONMENT ?? "").trim().toLowerCase(),
    );

  const cadastroAberto = env.SAAS_SIGNUP_ENABLED === "true";

  const gates = {
    banco: Boolean(env.DB),
    sessao: (env.NEUROPED_JWT_SECRET?.trim().length ?? 0) >= 32,
    entregaEmail,
    cobranca,
    cadastroAberto,
  };

  /**
   * A ordem importa, e está codificada aqui — não só na documentação. Abrir o
   * cadastro antes da entrega de e-mail cria contas que nunca conseguem criar
   * clínica: a confirmação de posse não sai, e POST /api/tenants recusa para
   * sempre. É o único estado que este verificador chama de PERIGOSO, em vez de
   * apenas incompleto.
   */
  const ordemInvertida = cadastroAberto && !entregaEmail;

  const pendencias: string[] = [];
  if (!gates.banco) pendencias.push("DB_BINDING_AUSENTE");
  if (!gates.sessao) pendencias.push("JWT_SECRET_AUSENTE_OU_CURTO");
  if (!entregaEmail) pendencias.push("ENTREGA_EMAIL_NAO_CONFIGURADA");
  if (!cobranca) pendencias.push("COBRANCA_NAO_CONFIGURADA");
  if (!cadastroAberto) pendencias.push("CADASTRO_SELF_SERVICE_FECHADO");

  return json(
    {
      pronto: pendencias.length === 0,
      ordemInvertida,
      gates,
      pendencias,
      nota:
        "Booleanos apenas. Esta rota nunca devolve valor de segredo. " +
        "Provisione a entrega de e-mail ANTES de abrir o cadastro.",
    },
    200,
  );
};
