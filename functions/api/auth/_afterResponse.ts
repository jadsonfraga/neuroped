/**
 * Trabalho que sai da resposta HTTP (consulta à conta, emissão de token, envio de e-mail).
 *
 * Conta existente e inexistente só respondem no mesmo tempo se esse trabalho não fica no caminho
 * da resposta. Com `waitUntil` do runtime, o trabalho continua depois do envio; sem ele (testes,
 * adaptador), aguarda. Falha vira log e nunca resposta: quem pediu já recebeu a mensagem genérica.
 */
export interface AfterResponseContext {
  waitUntil?: (promise: Promise<unknown>) => void;
}

export async function runAfterResponse(
  context: AfterResponseContext,
  label: string,
  work: () => Promise<void>,
): Promise<void> {
  const task = work().catch((error) => console.error(`[${label}] fluxo falhou`, error));
  if (typeof context.waitUntil === "function") {
    context.waitUntil(task);
  } else {
    await task;
  }
}
