/**
 * "Paciente em foco" — continuidade de contexto entre telas.
 *
 * O app tinha clínica ativa, mas nenhuma noção de qual paciente está sendo
 * atendido agora. Cada tela recomeçava do zero e a pessoa refazia o caminho
 * lista → ficha → ferramenta a cada troca de ferramenta.
 *
 * PRIVACIDADE: aqui só trafega o IDENTIFICADOR opaco do paciente, nunca nome,
 * data de nascimento, CID ou qualquer outro dado clínico. O identificador vive
 * em `sessionStorage` (morre com a aba, como os tokens de sessão) e é sempre
 * resolvido contra a API tenant-aware antes de virar texto na tela — o servidor
 * continua sendo a autoridade sobre o que esta sessão pode ver.
 */

const FOCUS_KEY = "neuroped:focus-patient-id";
const FOCUS_EVENT = "neuroped:focus-patient-changed";

function readStorage(): string | null {
  try {
    return sessionStorage.getItem(FOCUS_KEY);
  } catch {
    return null;
  }
}

export function getFocusPatientId(): string | null {
  return readStorage();
}

export function setFocusPatientId(patientId: string | null): void {
  try {
    if (patientId) sessionStorage.setItem(FOCUS_KEY, patientId);
    else sessionStorage.removeItem(FOCUS_KEY);
  } catch {
    // Sem storage o foco vale apenas para a navegação em memória.
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(FOCUS_EVENT, { detail: patientId }));
  }
}

export function clearFocusPatient(): void {
  setFocusPatientId(null);
}

export function subscribeFocusPatient(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(FOCUS_EVENT, listener);
  // Outra aba/limpeza de sessão também invalida o foco desta.
  window.addEventListener("auth:expired", listener);
  return () => {
    window.removeEventListener(FOCUS_EVENT, listener);
    window.removeEventListener("auth:expired", listener);
  };
}
