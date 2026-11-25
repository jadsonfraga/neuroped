// Assinatura manuscrita do Renderizador: só uma imagem PNG, guardada neste
// aparelho, separada por conta e clínica. Nada do laudo (texto, nome, manifesto) passa
// por aqui; nunca vai ao servidor nem ao repositório.
const SIGNATURE_PREFIX = "neuroped.renderizador.assinatura.v2:";
const PNG_DATA_URL = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;

export function readStoredSignature(scope: string): string {
  if (!scope) return "";
  try {
    const value = localStorage.getItem(SIGNATURE_PREFIX + scope) || "";
    return PNG_DATA_URL.test(value) ? value : "";
  } catch {
    return "";
  }
}

/** Retorna false se o navegador não permitiu guardar (vale só nesta sessão). */
export function storeSignature(scope: string, dataUrl: string): boolean {
  if (!scope) return false;
  if (!PNG_DATA_URL.test(dataUrl)) return false;
  try {
    localStorage.setItem(SIGNATURE_PREFIX + scope, dataUrl);
    requestPersistentStorage();
    return true;
  } catch {
    return false;
  }
}

// Pede ao navegador que não apague a assinatura por falta de uso (Safari/iOS e Chrome
// podem descartar dados de sites pouco usados). O navegador pode negar; nada depende disso.
function requestPersistentStorage(): void {
  try {
    void navigator.storage?.persist?.()?.catch(() => undefined);
  } catch {
    /* sem suporte */
  }
}

export function clearStoredSignature(scope: string): void {
  if (!scope) return;
  try {
    localStorage.removeItem(SIGNATURE_PREFIX + scope);
  } catch {
    /* nada guardado */
  }
}
