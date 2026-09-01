type GovernancePatchBody = {
  status?: unknown;
};

/**
 * Trava fail-closed para o workflow LGPD.
 *
 * Enquanto não existir um executor físico idempotente que produza o artefato
 * de exportação ou comprove a eliminação material, uma chamada administrativa
 * não pode transformar `processing` em `completed`. O handler canônico mantém
 * as demais transições; a conclusão deverá ser feita pelo worker futuro após
 * registrar a respectiva prova operacional.
 */
export const onRequest: PagesFunction = async (context) => {
  if (context.request.method.toUpperCase() !== "PATCH") return context.next();

  let body: GovernancePatchBody | null = null;
  try {
    const parsed = await context.request.clone().json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      body = parsed as GovernancePatchBody;
    }
  } catch {
    // O handler da rota continua sendo a autoridade para validar JSON inválido.
    return context.next();
  }

  if (body?.status !== "completed") return context.next();

  return new Response(
    JSON.stringify({
      error: "Conclusão bloqueada até existir prova material da operação LGPD.",
      code: "PHYSICAL_OPERATION_NOT_PROVEN",
    }),
    {
      status: 409,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  );
};
