/**
 * GET /api/cert — entrega o certificado digital armazenado como secret do Cloudflare.
 *
 * Protegido por JWT (mesmo mecanismo do /api/auth/me). O certificado NUNCA
 * vai para o git: é armazenado como variável secreta no Cloudflare Pages.
 *
 * Variáveis de ambiente necessárias (Cloudflare Pages → Settings → Secrets):
 *   CERT_P12_B64      — certificado .p12/.pfx codificado em base64
 *   CERT_P12_PASSWORD — senha do certificado
 *   NEUROPED_JWT_SECRET — já existente (JWT auth)
 *
 * Como configurar (uma vez, pelo painel Cloudflare ou wrangler):
 *   base64 -w0 JADSON_FRAGA_ARAUJO_JUNIOR.p12   # Linux
 *   base64 JADSON_FRAGA_ARAUJO_JUNIOR.p12       # macOS
 *   → copie o output → Cloudflare Pages → Variáveis de ambiente → CERT_P12_B64
 */

import { verifyJwt } from "./auth/_crypto";

interface Env {
  NEUROPED_JWT_SECRET?: string;
  CERT_P12_B64?: string;
  CERT_P12_PASSWORD?: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store, private" },
  });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  // Verificação JWT — não precisa de DB, só da assinatura do token.
  const secret = env.NEUROPED_JWT_SECRET;
  if (!secret) {
    return json({ error: "Auth indisponível.", code: "AUTH_UNAVAILABLE" }, 503);
  }

  const auth = request.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const payload = token ? await verifyJwt(token, secret) : null;
  if (!payload || payload.type !== "access") {
    return json({ error: "Não autenticado.", code: "UNAUTHENTICATED" }, 401);
  }

  // Certificado armazenado como secret.
  const certB64 = env.CERT_P12_B64?.trim();
  const password = env.CERT_P12_PASSWORD ?? "";

  if (!certB64) {
    return json({ error: "Certificado não configurado.", code: "CERT_NOT_CONFIGURED" }, 404);
  }

  return json({ cert: certB64, password }, 200);
};
