/**
 * Arquitetura explícita da redefinição de senha self-service.
 *
 * A redefinição por e-mail (forgot-password → reset-password) é atendida pelo
 * ambiente de produção — Cloudflare Pages Functions + D1
 * (functions/api/auth/forgot-password.ts / reset-password.ts), com
 * anti-enumeração, rate limit persistente por IP, token só em SHA-256 e
 * entrega SMTP atômica.
 *
 * Este servidor Express é o runtime local/desenvolvimento e NÃO emite tokens
 * de redefinição: duplicar aqui um fluxo de segurança sutil que nenhum usuário
 * real exercita criaria uma segunda implementação para apodrecer em silêncio.
 * Antes desta decisão os endpoints simplesmente não existiam e o botão
 * "Esqueci minha senha" caía num 404 mudo; agora o Express responde o contrato
 * abaixo — explícito, auditado e sem consultar a base (anti-enumeração por
 * construção). Redefinição no ambiente local: o bootstrap do servidor tem
 * paridade com o canônico (functions/api/auth/_shared.ts) —
 * ADMIN_FORCE_PASSWORD_RESET=true + ADMIN_INITIAL_PASSWORD redefinem a senha
 * do admin uma única vez (marcador auth.admin.bootstrap.v2) e revogam as
 * sessões.
 */
export const PASSWORD_RECOVERY_REMOTE_ONLY = {
  status: 503,
  body: {
    error:
      "A redefinição de senha por e-mail é atendida pelo ambiente de produção (app publicado). Neste servidor local não há emissão de token de redefinição — use o app em produção ou redefina a senha do administrador pelo bootstrap do servidor (ADMIN_FORCE_PASSWORD_RESET=true + ADMIN_INITIAL_PASSWORD no reinício).",
    code: "PASSWORD_RESET_REMOTE_ONLY",
  },
} as const;
