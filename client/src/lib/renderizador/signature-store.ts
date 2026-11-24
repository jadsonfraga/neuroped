// Assinatura manuscrita do Renderizador: só uma imagem PNG, guardada neste
// aparelho sob uma chave própria. Nada do laudo (texto, nome, manifesto) passa
// por aqui; nunca vai ao servidor nem ao repositório.
const SIGNATURE_KEY = "neuroped.renderizador.assinatura.v1";
const PNG_DATA_URL = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;

export function readStoredSignature(): string {
  try {
    const value = localStorage.getItem(SIGNATURE_KEY) || "";
    return PNG_DATA_URL.test(value) ? value : "";
  } catch {
    return "";
  }
}

/** Retorna false se o navegador não permitiu guardar (vale só nesta sessão). */
export function storeSignature(dataUrl: string): boolean {
  if (!PNG_DATA_URL.test(dataUrl)) return false;
  try {
    localStorage.setItem(SIGNATURE_KEY, dataUrl);
    return true;
  } catch {
    return false;
  }
}

export function clearStoredSignature(): void {
  try {
    localStorage.removeItem(SIGNATURE_KEY);
  } catch {
    /* nada guardado */
  }
}
