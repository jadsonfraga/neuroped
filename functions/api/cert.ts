/**
 * GET /api/cert — endpoint aposentado.
 *
 * Certificados ICP-Brasil e respectivas senhas nunca devem ser exportados para
 * o navegador. A assinatura aceita somente um arquivo selecionado localmente e
 * mantém chave e senha na memória da aba.
 */

function retired(): Response {
  return new Response(
    JSON.stringify({
      error: "Distribuição remota de certificado desativada.",
      code: "CERT_ENDPOINT_RETIRED",
    }),
    {
      status: 410,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, private",
      },
    },
  );
}

export const onRequestGet: PagesFunction = async () => retired();
