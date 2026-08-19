/**
 * /api/documents
 *
 * O contrato clínico permanente é implementado pelo backend Express em
 * `server/routes/documents.ts` e exige o par files + object storage.
 *
 * O Pages runtime atualmente possui apenas D1 e não declara um binding de
 * object storage nem o schema `clinical_documents`. A antiga Function deste
 * caminho gravava em `documents_demo`, com `is_demo = 1`, e portanto podia
 * aparentar sucesso sem arquivar o PDF imutável. Em produção, esse caminho
 * deve falhar fechado até que o backend permanente seja publicado aqui.
 */

function unavailableResponse(): Response {
  return new Response(
    JSON.stringify({
      error: "Arquivamento clínico permanente indisponível neste runtime.",
      code: "CLINICAL_DOCUMENTS_BACKEND_UNAVAILABLE",
    }),
    {
      status: 503,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}

export const onRequest: PagesFunction = async () => unavailableResponse();
export const onRequestGet: PagesFunction = onRequest;
export const onRequestPost: PagesFunction = onRequest;
export const onRequestPut: PagesFunction = onRequest;
export const onRequestPatch: PagesFunction = onRequest;
export const onRequestDelete: PagesFunction = onRequest;
