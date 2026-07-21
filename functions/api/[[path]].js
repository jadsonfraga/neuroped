/**
 * Catch-all /api/* — retorna 404 JSON para qualquer rota de API que NÃO tenha
 * uma Function dedicada (functions/api/...). As Functions específicas têm
 * precedência sobre este catch-all.
 *
 * Antes, este arquivo fazia proxy de /api/* para um backend externo
 * (neuroped-api-production.up.railway.app) que, na auditoria de 13/06, mostrou-se
 * um serviço NÃO relacionado ("secretaria-ia") respondendo 404 em quase tudo.
 * O proxy foi removido para não encaminhar requisições/headers a terceiros.
 *
 * CORS, headers de segurança e rate limiting são tratados por
 * functions/api/_middleware.ts. Implemente auth/files/send-* como Functions
 * próprias quando essas features forem ativadas.
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  return new Response(
    JSON.stringify({
      error: "Rota de API não encontrada.",
      code: "NOT_FOUND",
      path: url.pathname,
    }),
    {
      status: 404,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    }
  );
}
