export type FrameStatus = "loading" | "ready" | "unverified" | "timeout" | "error";

/**
 * `onLoad` de iframe cross-origin dispara mesmo quando o destino bloqueia a
 * incorporação (X-Frame-Options/CSP) — o navegador carrega a página interna de
 * erro e o evento chega igual. Só é honesto declarar "ready" quando o
 * documento é legível (mesma origem); caso contrário o estado fica
 * "unverified" e a UI deve manter a saída externa visível em vez de fingir
 * sucesso.
 */
export function resolveFrameLoadStatus(frame: Pick<HTMLIFrameElement, "contentDocument">): FrameStatus {
  try {
    if (frame.contentDocument) return "ready";
  } catch {
    // Acesso negado: origem cruzada.
  }
  return "unverified";
}
